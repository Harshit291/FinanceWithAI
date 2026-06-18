"""Key financial ratios + last 4 quarterly results via yfinance.

yfinance works for ALL symbols — NSE/BSE Indian stocks and US equities —
with no API key required.  It handles the Yahoo Finance cookie/crumb auth
automatically.  Falls back gracefully to empty dict on any failure.
Falls back to Finnhub for profile data if yfinance returns nothing.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

log = logging.getLogger(__name__)


def _fmt(val, digits: int = 2) -> float | None:
    """Safely round a numeric value; return None if not numeric."""
    try:
        return round(float(val), digits)
    except (TypeError, ValueError):
        return None


def _fmt_pct(val) -> str | None:
    """Convert a 0.0–1.0 fraction to a readable percentage string."""
    try:
        return f"{round(float(val) * 100, 2)}%"
    except (TypeError, ValueError):
        return None


async def _finnhub_profile(symbol: str) -> dict:
    """Fetch company profile from Finnhub as a fallback."""
    api_key = os.getenv("FINNHUB_API_KEY")
    if not api_key:
        return {}
    try:
        import httpx
        # Finnhub uses base symbol without exchange suffix for profile
        base = symbol.split(".")[0]
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                "https://finnhub.io/api/v1/stock/profile2",
                params={"symbol": symbol, "token": api_key},
            )
            if r.status_code != 200:
                # Try without exchange suffix
                r = await client.get(
                    "https://finnhub.io/api/v1/stock/profile2",
                    params={"symbol": base, "token": api_key},
                )
            if r.status_code == 200:
                data = r.json()
                if data:
                    return {
                        "sector": data.get("finnhubIndustry"),
                        "industry": data.get("finnhubIndustry"),
                        "marketCap": data.get("marketCapitalization", 0) * 1_000_000
                        if data.get("marketCapitalization") else None,
                        "longBusinessSummary": f"{data.get('name', '')} is a {data.get('finnhubIndustry', '')} company listed on {data.get('exchange', '')}. It was founded in {data.get('ipo', 'N/A')[:4] if data.get('ipo') else 'N/A'} and employs approximately {data.get('employeeTotal', 0):,} people.",
                    }
    except Exception as exc:
        log.warning("finnhub_profile: failed for %s — %s", symbol, exc)
    return {}


async def fetch_fundamentals(symbol: str) -> dict:
    """Return key financial metrics and last 4 quarterly results.

    Uses yfinance (unofficial Yahoo Finance, no API key) which covers
    NSE/BSE Indian stocks as well as US equities.
    Falls back to Finnhub profile if yfinance returns empty data.
    """
    try:
        # yfinance is synchronous; run in thread pool to avoid blocking the event loop
        import asyncio
        import functools

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, functools.partial(_fetch_sync, symbol))

        # If yfinance returned meaningful metrics, use them directly
        if result.get("metrics"):
            return result

        # yfinance returned empty — fall back to Finnhub for profile data
        log.info("fetch_fundamentals: yfinance empty for %s, trying Finnhub fallback", symbol)
        fallback = await _finnhub_profile(symbol)
        if fallback:
            metrics = {k: v for k, v in fallback.items() if v is not None}
            log.info("fetch_fundamentals: Finnhub fallback got %d fields for %s", len(metrics), symbol)
            return {"metrics": metrics, "earnings": []}

        return result
    except Exception as exc:
        log.error(f"fetch_fundamentals failed: {exc}", exc_info=True)
        raise


def _fetch_sync(symbol: str) -> dict:
    """Synchronous yfinance fetch — called in a thread pool executor."""
    try:
        import yfinance as yf
    except ImportError:
        log.error("yfinance is not installed — run: pip install yfinance")
        return {"metrics": {}, "earnings": []}

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info or {}

        # ── Core valuation & profitability metrics ──────────────────────────
        metrics: dict = {
            # Valuation
            "peRatio":           _fmt(info.get("trailingPE")),
            "forwardPE":         _fmt(info.get("forwardPE")),
            "priceToBook":       _fmt(info.get("priceToBook")),
            "priceToSales":      _fmt(info.get("priceToSalesTrailing12Months")),
            "evToEbitda":        _fmt(info.get("enterpriseToEbitda")),
            "evToRevenue":       _fmt(info.get("enterpriseToRevenue")),

            # Market position
            "marketCap":         info.get("marketCap"),
            "enterpriseValue":   info.get("enterpriseValue"),
            "beta":              _fmt(info.get("beta")),

            # Earnings & growth
            "epsTrailing":       _fmt(info.get("trailingEps")),
            "epsForward":        _fmt(info.get("forwardEps")),
            "earningsGrowthYoY": _fmt_pct(info.get("earningsGrowth")),
            "revenueGrowthYoY":  _fmt_pct(info.get("revenueGrowth")),

            # Profitability
            "grossMargins":      _fmt_pct(info.get("grossMargins")),
            "operatingMargins":  _fmt_pct(info.get("operatingMargins")),
            "netMargins":        _fmt_pct(info.get("profitMargins")),
            "returnOnEquity":    _fmt_pct(info.get("returnOnEquity")),
            "returnOnAssets":    _fmt_pct(info.get("returnOnAssets")),

            # Balance sheet health
            "debtToEquity":      _fmt(info.get("debtToEquity")),
            "currentRatio":      _fmt(info.get("currentRatio")),
            "bookValue":         _fmt(info.get("bookValue")),
            "totalRevenue":      info.get("totalRevenue"),
            "totalDebt":         info.get("totalDebt"),
            "freeCashflow":      info.get("freeCashflow"),

            # Dividends
            "dividendYield":     _fmt_pct(info.get("dividendYield")),
            "payoutRatio":       _fmt_pct(info.get("payoutRatio")),

            # 52-week range (useful context for price action)
            "fiftyTwoWeekHigh":  _fmt(info.get("fiftyTwoWeekHigh")),
            "fiftyTwoWeekLow":   _fmt(info.get("fiftyTwoWeekLow")),

            # Company context
            "sector":            info.get("sector"),
            "industry":          info.get("industry"),
            "fullTimeEmployees": info.get("fullTimeEmployees"),
            "longBusinessSummary": (info.get("longBusinessSummary") or "")[:500] or None,
        }

        # Drop None values to keep the AI prompt compact
        metrics = {k: v for k, v in metrics.items() if v is not None}

        # ── Last 4 quarters of financial results ────────────────────────────
        earnings: list[dict] = []
        try:
            qf = ticker.quarterly_financials
            qi = ticker.quarterly_income_stmt  # may have more rows depending on version

            # Use whichever is non-empty
            stmt = qi if (qi is not None and not qi.empty) else qf
            if stmt is not None and not stmt.empty:
                for col in list(stmt.columns)[:4]:
                    period = str(col)[:10]  # "YYYY-MM-DD"

                    def _row(label: str):
                        """Safely extract a row value from the quarterly statement."""
                        for key in [label, label.lower(), label.replace(" ", ""), label.replace("_", " ")]:
                            if key in stmt.index:
                                val = stmt.loc[key, col]
                                return _fmt(val)
                        return None

                    q_data = {
                        "period":          period,
                        "totalRevenue":    _row("Total Revenue"),
                        "grossProfit":     _row("Gross Profit"),
                        "operatingIncome": _row("Operating Income"),
                        "netIncome":       _row("Net Income"),
                        "ebitda":          _row("Normalized EBITDA") or _row("EBITDA"),
                    }
                    # Only include the quarter if we got at least revenue or net income
                    if q_data["totalRevenue"] or q_data["netIncome"]:
                        earnings.append({k: v for k, v in q_data.items() if v is not None})
        except Exception as exc:
            log.warning("fetch_fundamentals: quarterly data failed for %s — %s", symbol, exc)

        log.info(
            "fetch_fundamentals: %d metrics, %d quarters for %s",
            len(metrics), len(earnings), symbol,
        )
        return {"metrics": metrics, "earnings": earnings}

    except Exception as exc:
        log.warning("fetch_fundamentals: yfinance failed for %s — %s", symbol, exc)
        return {"metrics": {}, "earnings": []}



