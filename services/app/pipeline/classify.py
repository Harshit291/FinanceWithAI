"""Per-article sentiment + relevance classifier using the LLM classifier model.
Skips LLM call (returns neutral/low tags) when no provider API key is set.
"""
from __future__ import annotations
import asyncio
import json
from ._shared import PROVIDERS, chat_with_failover
import os

_SYSTEM = """\
You classify financial news articles for a stock-research app. Return a single JSON object:

{"sentiment": "bullish" | "bearish" | "neutral", "relevance": "high" | "medium" | "low", "rationale": "<one sentence, max 25 words>"}

Rules:
- Sentiment = stock's likely price impact, not editorial tone.
- Relevance: earnings/regulatory/major contracts = high; sector commentary = medium; tangential = low.
- Output ONLY the JSON object. No prose, no markdown fences.\
"""


async def _classify_one(symbol: str, article: dict) -> dict:
    user_msg = (
        f"SYMBOL: {symbol}\n"
        f"ARTICLE_HEADLINE: {article.get('headline', '')}\n"
        f"ARTICLE_BODY: {article.get('summary', '')[:2000]}\n"
        f"PUBLISHED_AT: {article.get('published_at', '')}\n"
        f"SOURCE: {article.get('source', '')}"
    )
    try:
        completion, _provider = await chat_with_failover(
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": user_msg},
            ],
            kind="classifier",
            temperature=0.1,
            response_format={"type": "json_object"},
            symbol=symbol,
            max_providers=2,  # don't burn OpenRouter RPD on per-article calls
        )
        tags = json.loads(completion.choices[0].message.content or "{}")
    except Exception:
        tags = {"sentiment": "neutral", "relevance": "low", "rationale": "classification failed"}
    return {**article, **tags}


def _any_provider_configured() -> bool:
    return any(os.getenv(p.api_key_env) for p in PROVIDERS)


async def classify_articles(symbol: str, articles: list[dict]) -> list[dict]:
    if not articles:
        return []
    if not _any_provider_configured():
        return [
            {**a, "sentiment": "neutral", "relevance": "low", "rationale": "classifier unavailable"}
            for a in articles
        ]
    return list(await asyncio.gather(*[_classify_one(symbol, a) for a in articles]))
