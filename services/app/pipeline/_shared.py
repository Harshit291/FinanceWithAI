"""Shared constants and multi-provider LLM client factory.

Failover chain ordered by quality (see docs/DECISIONS.md ADR-0007).
Order is loaded from `services/providers.ranked.json` if present (written by
`services/scripts/rank_providers.py`); otherwise a hardcoded default is used.
"""
from __future__ import annotations
import json
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from openai import (
    AsyncOpenAI,
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    RateLimitError,
)
from openai.types.chat import ChatCompletion

log = logging.getLogger(__name__)

FINNHUB_BASE = "https://finnhub.io/api/v1"
INDIANAPI_BASE = "https://indianapi.in/api"


# ── Provider registry ────────────────────────────────────────────────────────

@dataclass(frozen=True)
class Provider:
    name: str
    api_key_env: str
    base_url: str
    models: dict[str, str] = field(default_factory=dict)  # {"synthesis": "...", "classifier": "..."}
    privacy_note: str = ""


PROVIDER_CATALOGUE: dict[str, Provider] = {
    "groq": Provider(
        name="groq",
        api_key_env="GROQ_API_KEY",
        base_url="https://api.groq.com/openai/v1",
        models={
            "synthesis": "llama-3.3-70b-versatile",
            "classifier": "llama-3.1-8b-instant",
        },
    ),
    "cerebras": Provider(
        name="cerebras",
        api_key_env="CEREBRAS_API_KEY",
        base_url="https://api.cerebras.ai/v1",
        models={
            "synthesis": "llama-3.3-70b",
            "classifier": "llama3.1-8b",
        },
    ),
    "sambanova": Provider(
        name="sambanova",
        api_key_env="SAMBANOVA_API_KEY",
        base_url="https://api.sambanova.ai/v1",
        models={
            "synthesis": "Meta-Llama-3.3-70B-Instruct",
            "classifier": "Meta-Llama-3.1-8B-Instruct",
        },
    ),
    "openrouter": Provider(
        name="openrouter",
        api_key_env="OPENROUTER_API_KEY",
        base_url="https://openrouter.ai/api/v1",
        models={
            "synthesis": "meta-llama/llama-3.3-70b-instruct:free",
            "classifier": "meta-llama/llama-3.1-8b-instruct:free",
        },
        privacy_note="free tier may train on prompt data",
    ),
}


def load_provider_order() -> list[Provider]:
    """Load ranking from services/providers.ranked.json if present;
    otherwise return a hardcoded default order."""
    path = Path(__file__).parent.parent.parent / "providers.ranked.json"
    if path.exists():
        try:
            ranked = json.loads(path.read_text())["ranking"]
            ordered = [
                PROVIDER_CATALOGUE[r["provider"]]
                for r in ranked
                if r["provider"] in PROVIDER_CATALOGUE
            ]
            if ordered:
                return ordered
        except Exception as e:  # noqa: BLE001 — corrupt ranking file, fall back
            log.warning("failed to load providers.ranked.json: %s — using default order", e)
    # Default order until benchmark is run
    return [
        PROVIDER_CATALOGUE["cerebras"],
        PROVIDER_CATALOGUE["groq"],
        PROVIDER_CATALOGUE["sambanova"],
        PROVIDER_CATALOGUE["openrouter"],
    ]


PROVIDERS: list[Provider] = load_provider_order()


# ── Client cache ─────────────────────────────────────────────────────────────

_client_cache: dict[str, AsyncOpenAI] = {}


def _get_client(provider: Provider) -> AsyncOpenAI:
    """Return a cached AsyncOpenAI for the given provider (lazy-init)."""
    if provider.name not in _client_cache:
        api_key = os.getenv(provider.api_key_env)
        if not api_key:
            raise RuntimeError(f"{provider.api_key_env} not set")
        _client_cache[provider.name] = AsyncOpenAI(api_key=api_key, base_url=provider.base_url)
    return _client_cache[provider.name]


async def close_all_clients() -> None:
    """Close every cached client. Call from FastAPI lifespan shutdown."""
    for client in _client_cache.values():
        try:
            await client.close()
        except Exception:  # noqa: BLE001
            pass
    _client_cache.clear()


def _active_providers(max_providers: int | None = None) -> list[Provider]:
    """Filter PROVIDERS to those whose API key env var is set."""
    active = [p for p in PROVIDERS if os.getenv(p.api_key_env)]
    if max_providers is not None:
        active = active[:max_providers]
    return active


# ── Failover helper ──────────────────────────────────────────────────────────

# Transient errors that warrant trying the next provider:
_TRANSIENT_ERRORS: tuple[type[Exception], ...] = (
    RateLimitError,
    APITimeoutError,
    APIConnectionError,
    InternalServerError,
)

# Hard errors that should fail fast (config bug, malformed request):
_FATAL_ERRORS: tuple[type[Exception], ...] = (
    AuthenticationError,
    BadRequestError,
)


async def chat_with_failover(
    *,
    messages: list[dict],
    kind: Literal["synthesis", "classifier"],
    temperature: float = 0.2,
    response_format: dict | None = None,
    symbol: str | None = None,
    max_providers: int | None = None,
) -> tuple[ChatCompletion, str]:
    """Run a chat completion with failover across providers.

    Returns ``(completion, provider_name)``. Iterates active providers in
    ``PROVIDERS`` order (filters out those with missing API keys). On a
    transient error (RateLimit / timeout / 5xx), tries the next provider.
    Hard errors (auth, bad request) fail fast. After all providers are
    exhausted, the last exception is re-raised so existing call-site
    ``except`` blocks still trigger graceful degradation.
    """
    active = _active_providers(max_providers)
    if not active:
        raise RuntimeError("No LLM provider API keys configured.")

    last_exc: Exception | None = None
    kwargs: dict = {"temperature": temperature}
    if response_format is not None:
        kwargs["response_format"] = response_format

    for provider in active:
        model = provider.models.get(kind)
        if not model:
            log.warning("provider %s has no %s model configured, skipping", provider.name, kind)
            continue
        try:
            client = _get_client(provider)
            completion = await client.chat.completions.create(
                model=model,
                messages=messages,
                **kwargs,
            )
            log.info(
                "llm.ok provider=%s kind=%s symbol=%s model=%s",
                provider.name, kind, symbol, model,
            )
            return completion, provider.name
        except _FATAL_ERRORS as exc:
            log.error(
                "llm.fatal provider=%s kind=%s symbol=%s err=%s",
                provider.name, kind, symbol, exc,
            )
            raise
        except _TRANSIENT_ERRORS as exc:
            log.warning(
                "llm.transient provider=%s kind=%s symbol=%s err=%s — failing over",
                provider.name, kind, symbol, exc,
            )
            last_exc = exc
            continue
        except Exception as exc:  # noqa: BLE001 — unknown provider error, try next
            log.warning(
                "llm.unknown provider=%s kind=%s symbol=%s err=%s — failing over",
                provider.name, kind, symbol, exc,
            )
            last_exc = exc
            continue

    assert last_exc is not None  # we have at least one active provider, so we tried at least once
    log.error("llm.exhausted kind=%s symbol=%s — re-raising last error", kind, symbol)
    raise last_exc


# ── Backwards-compatible single-provider client (deprecated) ─────────────────

def groq_client() -> AsyncOpenAI:
    """Deprecated: prefer ``chat_with_failover``. Kept for any straggler imports."""
    return _get_client(PROVIDER_CATALOGUE["groq"])
