"""Benchmark each configured LLM provider on the same fundamental-synthesis
prompt and rank by output quality. Writes ``services/providers.ranked.json``
and per-provider outputs in ``services/scripts/benchmark_outputs/``.

Usage:
    python -m services.scripts.rank_providers [--symbol AAPL]

Run from the project root with the .venv active. Requires whichever provider
API keys you want benchmarked to be set in ``.env.local``.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import statistics
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SERVICES_DIR = REPO_ROOT / "services"
load_dotenv(REPO_ROOT / ".env.local")

# Make `services` importable when running as a script from arbitrary cwd.
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from pydantic import ValidationError  # noqa: E402

from services.app.models import VerdictReport  # noqa: E402
from services.app.pipeline._shared import PROVIDER_CATALOGUE, _get_client  # noqa: E402
from services.app.pipeline.classify import classify_articles  # noqa: E402
from services.app.pipeline.fundamentals import fetch_fundamentals  # noqa: E402
from services.app.pipeline.news import fetch_news  # noqa: E402
from services.app.pipeline.peers import fetch_peers  # noqa: E402
from services.app.pipeline.resolve import resolve  # noqa: E402
from services.app.pipeline.synthesize import _SYSTEM  # noqa: E402

OUTPUTS_DIR = Path(__file__).parent / "benchmark_outputs"
RANKING_PATH = SERVICES_DIR / "providers.ranked.json"


# ── Scoring rubric (see plan / ADR-0007) ─────────────────────────────────────

_NUM_PATTERN = re.compile(r"(\$[\d,.]+|\d+(?:\.\d+)?\s*%|\d+(?:\.\d+)?x|\d+\s*[MBT](?!\w))")


def _score(parsed: dict | None, *, schema_ok: bool, latency_s: float) -> dict[str, Any]:
    breakdown: dict[str, Any] = {
        "schema_validity": 25 if schema_ok else 0,
        "completeness": 0.0,
        "depth": 0.0,
        "specificity": 0.0,
        "latency": 0.0,         # filled in by caller after all providers complete
        "calibration": 0.0,
        "_raw_latency_s": round(latency_s, 3),
    }
    if not parsed:
        breakdown["total"] = breakdown["schema_validity"]
        return breakdown

    horizons = parsed.get("horizons", {}) or {}

    # Completeness (20)
    full = 0
    for h in horizons.values():
        if (
            h
            and h.get("stance") not in (None, "insufficient_data")
            and h.get("key_drivers")
            and h.get("key_risks")
        ):
            full += 1
    breakdown["completeness"] = round(20 * full / 3, 1)

    # Reasoning depth (20) — median word count of drivers+risks
    all_strings: list[str] = []
    for h in horizons.values():
        all_strings += list(h.get("key_drivers") or [])
        all_strings += list(h.get("key_risks") or [])
    if all_strings:
        median_words = statistics.median(len(s.split()) for s in all_strings)
        breakdown["depth"] = round(min(20, median_words / 8 * 20), 1)

    # Specificity (20) — numeric grounding in drivers+risks+summary
    text = " ".join(all_strings) + " " + (parsed.get("summary_paragraph") or "")
    nums = _NUM_PATTERN.findall(text)
    breakdown["specificity"] = round(min(20, len(nums) / 6 * 20), 1)

    # Confidence calibration (5) — % of non-insufficient horizons in 40–85 band
    in_band = band_count = 0
    for h in horizons.values():
        if h and h.get("stance") not in (None, "insufficient_data"):
            band_count += 1
            c = h.get("confidence_pct", 0)
            if 40 <= c <= 85:
                in_band += 1
    breakdown["calibration"] = round(5 * in_band / band_count, 1) if band_count else 0.0

    return breakdown


def _normalize_latency(scored: list[dict]) -> None:
    """Fill ``latency`` (0–10 pts) based on each provider's speed relative to
    the slowest successful call."""
    successful = [s for s in scored if s["score"]["_raw_latency_s"] > 0]
    if not successful:
        return
    slowest = max(s["score"]["_raw_latency_s"] for s in successful)
    if slowest <= 0:
        return
    for s in successful:
        raw = s["score"]["_raw_latency_s"]
        s["score"]["latency"] = round(10 * (1 - raw / slowest), 1)


def _total(score: dict) -> float:
    return round(
        score["schema_validity"]
        + score["completeness"]
        + score["depth"]
        + score["specificity"]
        + score["latency"]
        + score["calibration"],
        1,
    )


# ── Provider runner ──────────────────────────────────────────────────────────

async def _run_provider(provider, system_msg: str, user_msg: str) -> dict:
    client = _get_client(provider)
    started = time.time()
    raw_text: str | None = None
    parsed: dict | None = None
    schema_ok = False
    error: str | None = None

    try:
        completion = await client.chat.completions.create(
            model=provider.models["synthesis"],
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw_text = completion.choices[0].message.content or ""
        parsed = json.loads(raw_text)
        try:
            VerdictReport.model_validate(parsed)
            schema_ok = True
        except ValidationError as exc:
            error = f"schema_invalid: {exc.error_count()} errors"
    except json.JSONDecodeError as exc:
        error = f"bad_json: {exc}"
    except Exception as exc:  # noqa: BLE001 — capture all provider errors
        error = f"{type(exc).__name__}: {exc}"

    latency = time.time() - started
    score = _score(parsed, schema_ok=schema_ok, latency_s=latency)

    return {
        "provider": provider.name,
        "synthesis_model": provider.models["synthesis"],
        "error": error,
        "raw_output": raw_text,
        "parsed": parsed,
        "score": score,
    }


# ── Main ─────────────────────────────────────────────────────────────────────

async def benchmark(symbol: str) -> None:
    active = [p for p in PROVIDER_CATALOGUE.values() if os.getenv(p.api_key_env)]
    if not active:
        print("No provider API keys set. Add at least one to .env.local.", file=sys.stderr)
        sys.exit(2)

    print(f"\n=== Benchmark fixture build for {symbol} ===")
    print(f"Active providers: {[p.name for p in active]}\n")

    # 1) Build identical input fixture once.
    meta = await resolve(symbol)
    fundamentals, news, peers = await asyncio.gather(
        fetch_fundamentals(symbol),
        fetch_news(symbol),
        fetch_peers(symbol),
    )
    classified_news = await classify_articles(symbol, news)

    print(
        f"  exchange={meta.exchange} currency={meta.currency} "
        f"company={meta.company_name or 'unknown'}"
    )
    print(
        f"  fundamentals={'yes' if fundamentals else 'no'} "
        f"news_articles={len(classified_news)} peers={len(peers)}"
    )

    report_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    fund_str = json.dumps(fundamentals, indent=2) if fundamentals else "unavailable"
    peers_str = json.dumps(peers) if peers else "unavailable"
    news_str = json.dumps(classified_news, indent=2) if classified_news else "unavailable"
    user_msg = (
        f"SYMBOL: {symbol}\n"
        f"AS_OF: {now}\n"
        f"EXCHANGE: {meta.exchange}\n"
        f"CURRENCY: {meta.currency}\n"
        f"COMPANY: {meta.company_name or 'unknown'}\n"
        f"REPORT_ID: {report_id}\n\n"
        f"COMPANY FUNDAMENTALS + EARNINGS:\n{fund_str}\n\n"
        f"PEERS:\n{peers_str}\n\n"
        f"NEWS (last 90 days, with sentiment tags):\n{news_str}\n\n"
        "Produce the VerdictReport now."
    )

    # 2) Hit every active provider in parallel with the SAME inputs.
    print("\n=== Running providers in parallel ===")
    results = await asyncio.gather(
        *(_run_provider(p, _SYSTEM, user_msg) for p in active),
        return_exceptions=False,
    )

    # 3) Normalize latency, compute totals, rank.
    _normalize_latency(results)
    for r in results:
        r["score"]["total"] = _total(r["score"])
    results.sort(key=lambda r: r["score"]["total"], reverse=True)

    # 4) Persist per-provider outputs (raw+parsed) for eyeballing.
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    for r in results:
        out_path = OUTPUTS_DIR / f"{r['provider']}.json"
        out_path.write_text(json.dumps(r, indent=2, default=str), encoding="utf-8")

    # 5) Print ranking + write providers.ranked.json.
    print("\n=== Ranking ===")
    print(f"{'rank':<5} {'provider':<12} {'model':<40} {'score':<7} {'latency':<8} {'error'}")
    print("-" * 100)
    for i, r in enumerate(results, 1):
        s = r["score"]
        print(
            f"{i:<5} {r['provider']:<12} {r['synthesis_model'][:38]:<40} "
            f"{s['total']:<7} {s['_raw_latency_s']:<8} {r['error'] or ''}"
        )

    ranking_payload = {
        "ranked_at": now,
        "test_symbol": symbol,
        "ranking": [
            {
                "provider": r["provider"],
                "synthesis_model": r["synthesis_model"],
                "score": r["score"]["total"],
                "breakdown": {k: v for k, v in r["score"].items() if not k.startswith("_")},
                "latency_s": r["score"]["_raw_latency_s"],
                "error": r["error"],
            }
            for r in results
            if r["error"] is None  # exclude errored providers from prod ordering
        ],
    }
    RANKING_PATH.write_text(json.dumps(ranking_payload, indent=2), encoding="utf-8")
    print(f"\nWrote: {RANKING_PATH}")
    print(f"Per-provider outputs: {OUTPUTS_DIR}/")


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark + rank LLM providers.")
    parser.add_argument("--symbol", default="AAPL", help="Stock symbol to benchmark on (default: AAPL)")
    args = parser.parse_args()
    asyncio.run(benchmark(args.symbol.upper()))


if __name__ == "__main__":
    main()
