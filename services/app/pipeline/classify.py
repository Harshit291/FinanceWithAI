"""Per-article sentiment + relevance classifier using the LLM classifier model.

After classification each article receives a `signed_recency_score`:

    signed_recency_score = recency_score × direction_multiplier

where:
    bullish  → direction_multiplier = +1.0   (positive recent news = +score)
    bearish  → direction_multiplier = -1.0   (negative recent news = -score)
    neutral  → direction_multiplier =  0.0   (no directional signal)

This gives the synthesis LLM a single number that encodes both:
- HOW RECENT the news is (magnitude, 0.0–1.0, exponential decay)
- WHICH DIRECTION it points (sign: + bullish, − bearish)

Example: signed_recency_score = -0.91 means "very recent and very negative".
         signed_recency_score = +0.15 means "old but slightly positive".

Skips LLM call (returns neutral/low tags) when no provider API key is set.
"""
from __future__ import annotations

import asyncio
import json
import os

from ._shared import PROVIDERS, chat_with_failover

_SYSTEM = """\
You classify financial news articles for a stock-research app. Return a single JSON object:

{"sentiment": "bullish" | "bearish" | "neutral", "relevance": "high" | "medium" | "low", "rationale": "<one sentence, max 30 words explaining the key fact and its likely impact>"}

Rules:
- sentiment = the article's likely impact on this stock's price: bullish (positive for stock), bearish (negative), neutral (no clear impact).
- Classify based on the ARTICLE CONTENT, not the current price. Earnings beats, big deals, regulatory approvals, takeover bids = bullish. Profit warnings, regulatory penalties, CEO exits, macro headwinds = bearish.
- relevance: earnings/results/revenue/profit/guidance/deal/acquisition/regulatory = high; analyst commentary/sector news = medium; tangential/macro = low.
- rationale: one sentence naming the specific fact (e.g. "Q3 net profit up 18% YoY, beating consensus by 6%").
- Output ONLY the JSON object. No prose, no markdown fences.\
"""

_DIRECTION: dict[str, float] = {
    "bullish":  +1.0,
    "bearish":  -1.0,
    "neutral":   0.0,
}


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
                {"role": "user",   "content": user_msg},
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

    # ── Signed recency score ────────────────────────────────────────────────
    # recency_score was attached by the news fetcher (0.0–1.0, exponential decay)
    raw_recency: float = float(article.get("recency_score", 0.5))
    sentiment: str = tags.get("sentiment", "neutral")
    direction: float = _DIRECTION.get(sentiment, 0.0)
    signed_recency_score = round(raw_recency * direction, 3)

    return {
        **article,
        **tags,
        # Keep the original unsigned score for ordering
        "recency_score": raw_recency,
        # Signed score: + means recent positive, − means recent negative, 0 = neutral
        "signed_recency_score": signed_recency_score,
    }


def _any_provider_configured() -> bool:
    return any(os.getenv(p.api_key_env) for p in PROVIDERS)


async def classify_articles(symbol: str, articles: list[dict]) -> list[dict]:
    if not articles:
        return []
    if not _any_provider_configured():
        # No LLM available — attach neutral tags and zero signed score
        return [
            {
                **a,
                "sentiment": "neutral",
                "relevance": "low",
                "rationale": "classifier unavailable",
                "signed_recency_score": 0.0,
            }
            for a in articles
        ]

    # Run in small batches of 4 with a brief pause between batches
    # to stay well within Groq's free-tier rate limit (30 req/min classifier)
    BATCH_SIZE = 4
    classified: list[dict] = []
    for i in range(0, len(articles), BATCH_SIZE):
        batch = articles[i : i + BATCH_SIZE]
        results = list(await asyncio.gather(*[_classify_one(symbol, a) for a in batch]))
        classified.extend(results)
        if i + BATCH_SIZE < len(articles):
            await asyncio.sleep(1.5)  # ~1.5s pause prevents bursting the rate limit

    # Re-sort by absolute signed_recency_score descending so the most
    # impactful articles (recent + high-conviction sentiment) appear first
    classified.sort(key=lambda a: abs(a.get("signed_recency_score", 0.0)), reverse=True)
    return classified
