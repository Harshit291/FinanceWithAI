"""Key financial ratios + last 4 quarterly results via yfinance.

yfinance works for ALL symbols — NSE/BSE Indian stocks and US equities —
with no API key required.  It handles the Yahoo Finance cookie/crumb auth
automatically.  Falls back gracefully to empty dict on any failure.
"""
from __future__ import annotations

import logging
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


async def fetch_fundamentals(symbol: str) -> dict:
    """Return key financial metrics and last 4 quarterly results.

    Uses yfinance (unofficial Yahoo Finance, no API key) which covers
    NSE/BSE Indian stocks as well as US equities.
    """
    try:
        # yfinance is synchronous; run in thread pool to avoid blocking the event loop
        import asyncio
        import functools

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, functools.partial(_fetch_sync, symbol))
    except Exception as exc:
        log.warning("fetch_fundamentals: exception for %s — %s", symbol, exc)
        return {"metrics": {}, "earnings": []}


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
