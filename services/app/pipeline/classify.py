"""Per-article sentiment + relevance classifier using the LLM classifier model.
Skips LLM call (returns neutral/low tags) when GROQ_API_KEY is unset.
"""
from __future__ import annotations
import os
import json
from openai import AsyncOpenAI

CLASSIFIER_MODEL = os.getenv("LLM_CLASSIFIER_MODEL", "llama-3.1-8b-instant")

_SYSTEM = """\
You classify financial news articles for a stock-research app. Return a single JSON object:

{"sentiment": "bullish" | "bearish" | "neutral", "relevance": "high" | "medium" | "low", "rationale": "<one sentence, max 25 words>"}

Rules:
- Sentiment = stock's likely price impact, not editorial tone.
- Relevance: earnings/regulatory/major contracts = high; sector commentary = medium; tangential = low.
- Output ONLY the JSON object. No prose, no markdown fences.\
"""


def _client() -> AsyncOpenAI:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")
    return AsyncOpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")


async def classify_articles(symbol: str, articles: list[dict]) -> list[dict]:
    if not articles:
        return []
    if not os.getenv("GROQ_API_KEY"):
        return [{**a, "sentiment": "neutral", "relevance": "low", "rationale": "classifier unavailable"} for a in articles]

    client = _client()
    results: list[dict] = []
    for article in articles:
        user_msg = (
            f"SYMBOL: {symbol}\n"
            f"ARTICLE_HEADLINE: {article.get('headline', '')}\n"
            f"ARTICLE_BODY: {article.get('summary', '')[:2000]}\n"
            f"PUBLISHED_AT: {article.get('published_at', '')}\n"
            f"SOURCE: {article.get('source', '')}"
        )
        try:
            completion = await client.chat.completions.create(
                model=CLASSIFIER_MODEL,
                messages=[
                    {"role": "system", "content": _SYSTEM},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            tags = json.loads(completion.choices[0].message.content or "{}")
        except Exception:
            tags = {"sentiment": "neutral", "relevance": "low", "rationale": "classification failed"}
        results.append({**article, **tags})
    return results
