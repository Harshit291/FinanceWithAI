"""Last 90 days of company news from Finnhub.
Returns empty list when FINNHUB_API_KEY is unset or fetch fails.
"""
from __future__ import annotations
import os
import httpx
from datetime import datetime, timedelta, timezone

FINNHUB_BASE = "https://finnhub.io/api/v1"


async def fetch_news(symbol: str) -> list[dict]:
    api_key = os.getenv("FINNHUB_API_KEY")
    if not api_key:
        return []

    to_dt = datetime.now(timezone.utc)
    from_dt = to_dt - timedelta(days=90)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"{FINNHUB_BASE}/company-news",
                params={
                    "symbol": symbol,
                    "from": from_dt.strftime("%Y-%m-%d"),
                    "to": to_dt.strftime("%Y-%m-%d"),
                    "token": api_key,
                },
            )
        if r.status_code == 200:
            return [
                {
                    "headline": a.get("headline", ""),
                    "summary": a.get("summary", "")[:2000],
                    "source": a.get("source", ""),
                    "published_at": datetime.fromtimestamp(
                        a.get("datetime", 0), tz=timezone.utc
                    ).isoformat(),
                    "url": a.get("url", ""),
                }
                for a in r.json()[:20]  # cap at 20 to stay within LLM context
            ]
    except Exception:
        pass
    return []
