"""Last 90 days of company news from Finnhub.
Returns empty list when FINNHUB_API_KEY is unset or fetch fails.
"""
from __future__ import annotations
import os
import httpx
from datetime import datetime, timedelta, timezone
from ._shared import FINNHUB_BASE


async def fetch_news(symbol: str) -> list[dict]:
    api_key_fh = os.getenv("FINNHUB_API_KEY")
    api_key_in = os.getenv("INDIANAPI_API_KEY")

    # 1. Try IndianAPI for Indian stocks first (better coverage for NSE/BSE)
    if symbol.endswith(".NS") or symbol.endswith(".BO"):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                headers = {"X-Api-Key": api_key_in} if api_key_in else {}
                r = await client.get(
                    f"{INDIANAPI_BASE}/stock",
                    params={"symbol": symbol},
                    headers=headers,
                )
                if r.status_code == 200:
                    d = r.json()
                    # IndianAPI returns news in a 'recentNews' list within the 'data' object
                    data = d.get("data") if d.get("status") == "success" else None
                    if data and "recentNews" in data:
                        news_list = data["recentNews"]
                        return [
                            {
                                "headline": a.get("headline") or a.get("title", ""),
                                "summary": a.get("summary") or a.get("description", "")[:2000],
                                "source": a.get("source", "IndianAPI"),
                                "published_at": a.get("published_at") or a.get("date", ""),
                                "url": a.get("url", ""),
                            }
                            for a in news_list[:20]
                        ]
        except Exception:
            pass

    # 2. Fallback to Finnhub
    if not api_key_fh:
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
                    "token": api_key_fh,
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
                for a in r.json()[:20]
            ]
    except Exception:
        pass
    return []
