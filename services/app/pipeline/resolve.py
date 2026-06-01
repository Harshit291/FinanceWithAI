"""Symbol → exchange + company metadata via Finnhub profile2."""
from __future__ import annotations
import os
import httpx
from dataclasses import dataclass
from ._shared import FINNHUB_BASE


@dataclass
class SymbolMeta:
    symbol: str
    exchange: str   # NSE | BSE | NYSE/NASDAQ
    currency: str   # INR | USD
    company_name: str | None = None
    country: str | None = None


async def resolve(symbol: str) -> SymbolMeta:
    symbol = symbol.upper()
    if symbol.endswith(".NS"):
        exchange, currency = "NSE", "INR"
    elif symbol.endswith(".BO"):
        exchange, currency = "BSE", "INR"
    else:
        exchange, currency = "NYSE/NASDAQ", "USD"

    # Try IndianAPI first for Indian stocks
    if exchange in ["NSE", "BSE"]:
        api_key = os.getenv("INDIANAPI_API_KEY")
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                headers = {"X-Api-Key": api_key} if api_key else {}
                r = await client.get(
                    f"{INDIANAPI_BASE}/stock",
                    params={"symbol": symbol, "res": "num"},
                    headers=headers,
                )
            if r.status_code == 200:
                d = r.json()
                data = d.get("data") if d.get("status") == "success" else None
                if data:
                    return SymbolMeta(
                        symbol=symbol,
                        exchange=exchange,
                        currency=currency,
                        company_name=data.get("company_name"),
                        country="India",
                    )
        except Exception:
            pass

    api_key_fh = os.getenv("FINNHUB_API_KEY")
    if not api_key_fh:
        return SymbolMeta(symbol=symbol, exchange=exchange, currency=currency)

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(
                f"{FINNHUB_BASE}/stock/profile2",
                params={"symbol": symbol, "token": api_key_fh},
            )
        if r.status_code == 200:
            d = r.json()
            return SymbolMeta(
                symbol=symbol,
                exchange=exchange,
                currency=currency,
                company_name=d.get("name"),
                country=d.get("country"),
            )
    except Exception:
        pass
    return SymbolMeta(symbol=symbol, exchange=exchange, currency=currency)
