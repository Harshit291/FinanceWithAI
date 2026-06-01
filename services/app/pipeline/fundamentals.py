"""Key financial ratios + last 4 quarters from Finnhub.
Returns empty dict when FINNHUB_API_KEY is unset or fetch fails.
"""
from __future__ import annotations
import asyncio
import os
import httpx
from ._shared import FINNHUB_BASE


async def fetch_fundamentals(symbol: str) -> dict:
    api_key_fh = os.getenv("FINNHUB_API_KEY")
    api_key_in = os.getenv("INDIANAPI_API_KEY")

    # Start with basic structures
    metrics = {}
    earnings = []

    # 1. Try IndianAPI for Indian stocks
    if symbol.endswith(".NS") or symbol.endswith(".BO"):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                headers = {"X-Api-Key": api_key_in} if api_key_in else {}

                # Fetch general stock data (includes metrics and some financials)
                r_stock = await client.get(
                    f"{INDIANAPI_BASE}/stock",
                    params={"symbol": symbol, "res": "num"},
                    headers=headers,
                )

                if r_stock.status_code == 200:
                    d = r_stock.json()
                    data = d.get("data") if d.get("status") == "success" else None
                    if data:
                        # Core metrics
                        metrics = {
                            "marketCap": data.get("market_cap"),
                            "peRatio": data.get("pe_ratio"),
                            "dividendYield": data.get("dividend_yield"),
                            "bookValue": data.get("book_value"),
                            "eps": data.get("earnings_per_share"),
                        }
                        # If the professional API provides a financials block, merge it
                        if "financials" in data:
                            metrics.update(data["financials"])

                # Fetch historical stats for earnings history (quarter_results)
                r_stats = await client.get(
                    f"{INDIANAPI_BASE}/historical_stats",
                    params={"symbol": symbol, "stats": "quarter_results"},
                    headers=headers,
                )
                if r_stats.status_code == 200:
                    stats_d = r_stats.json()
                    if stats_d.get("status") == "success" and "data" in stats_d:
                        q_results = stats_d["data"].get("quarter_results", [])
                        for q in q_results[:4]:
                            earnings.append({
                                "time": q.get("quarter"),
                                "eps": q.get("eps"),
                                "net_income": q.get("net_income"),
                                "revenue": q.get("revenue"),
                            })
        except Exception:
            pass

    # 2. Always try Finnhub if key is available (for earnings history and additional metrics)
    if api_key_fh:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                metrics_r, earnings_r = await asyncio.gather(
                    client.get(
                        f"{FINNHUB_BASE}/stock/metric",
                        params={"symbol": symbol, "metric": "all", "token": api_key_fh},
                    ),
                    client.get(
                        f"{FINNHUB_BASE}/stock/earnings",
                        params={"symbol": symbol, "token": api_key_fh},
                    ),
                )

                fh_metrics = metrics_r.json().get("metric", {}) if metrics_r.status_code == 200 else {}
                metrics.update(fh_metrics)

                # Finnhub earnings are usually more standard; prioritize them if available
                if earnings_r.status_code == 200:
                    earnings = earnings_r.json()[:4]
        except Exception:
            pass

    return {"metrics": metrics, "earnings": earnings}
