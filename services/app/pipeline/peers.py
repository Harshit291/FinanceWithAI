"""3-5 sector peers from Finnhub.
Returns empty list when FINNHUB_API_KEY is unset or fetch fails.
"""
from __future__ import annotations
import os
import httpx

FINNHUB_BASE = "https://finnhub.io/api/v1"


async def fetch_peers(symbol: str) -> list[str]:
    api_key = os.getenv("FINNHUB_API_KEY")
    if not api_key:
        return []

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(
                f"{FINNHUB_BASE}/stock/peers",
                params={"symbol": symbol, "token": api_key},
            )
        if r.status_code == 200:
            return [p for p in r.json() if p != symbol][:5]
    except Exception:
        pass
    return []
