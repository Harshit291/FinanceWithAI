"""Key financial ratios + last 4 quarters from Finnhub.
Returns empty dict when FINNHUB_API_KEY is unset or fetch fails.
"""
from __future__ import annotations
import os
import httpx

FINNHUB_BASE = "https://finnhub.io/api/v1"


async def fetch_fundamentals(symbol: str) -> dict:
    api_key = os.getenv("FINNHUB_API_KEY")
    if not api_key:
        return {}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            metrics_r, earnings_r = await _gather(
                client.get(
                    f"{FINNHUB_BASE}/stock/metric",
                    params={"symbol": symbol, "metric": "all", "token": api_key},
                ),
                client.get(
                    f"{FINNHUB_BASE}/stock/earnings",
                    params={"symbol": symbol, "token": api_key},
                ),
            )
        metrics = metrics_r.json().get("metric", {}) if metrics_r.status_code == 200 else {}
        earnings = earnings_r.json()[:4] if earnings_r.status_code == 200 else []
        return {"metrics": metrics, "earnings": earnings}
    except Exception:
        return {}


async def _gather(*coros):
    import asyncio
    return await asyncio.gather(*coros)
