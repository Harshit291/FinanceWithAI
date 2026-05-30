"""Technical analysis pipeline: OHLCV → indicators → LLM → TechnicalVerdict."""
from __future__ import annotations
import json
from datetime import datetime, timezone

import httpx
from openai import RateLimitError, APIError
from pydantic import ValidationError

from ..models import TechnicalSignal, TechnicalVerdict, KeyLevels
from ._shared import chat_with_failover
_YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
_YAHOO_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; FinAI/1.0)"}

_INSUFFICIENT = TechnicalSignal(
    action="insufficient_data",
    confidence_pct=0,
    rationale="Insufficient price data to compute technical indicators.",
    indicators=[],
)


# ── indicator math (pure Python, no numpy) ───────────────────────────────────

def _ema(values: list[float], period: int) -> list[float]:
    k = 2 / (period + 1)
    result = [values[0]]
    for v in values[1:]:
        result.append(v * k + result[-1] * (1 - k))
    return result


def _rsi(closes: list[float], period: int = 14) -> float:
    if len(closes) < period + 1:
        return 50.0
    deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
    gains = [max(d, 0.0) for d in deltas[-period:]]
    losses = [max(-d, 0.0) for d in deltas[-period:]]
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    if avg_loss == 0:
        return 100.0
    return round(100 - (100 / (1 + avg_gain / avg_loss)), 1)


def _sma(closes: list[float], period: int) -> float | None:
    if len(closes) < period:
        return None
    return round(sum(closes[-period:]) / period, 2)


def _macd(closes: list[float]) -> dict:
    if len(closes) < 35:
        return {"macd": None, "signal": None, "histogram": None}
    ema12 = _ema(closes, 12)
    ema26 = _ema(closes, 26)
    macd_line = [m - s for m, s in zip(ema12, ema26)]
    signal_line = _ema(macd_line, 9)
    hist = macd_line[-1] - signal_line[-1]
    return {
        "macd": round(macd_line[-1], 4),
        "signal": round(signal_line[-1], 4),
        "histogram": round(hist, 4),
    }


def _compute(closes: list[float]) -> dict:
    last = closes[-1]
    sma20 = _sma(closes, 20)
    sma50 = _sma(closes, 50)
    sma200 = _sma(closes, 200)
    rsi = _rsi(closes)
    macd = _macd(closes)
    window = closes[-252:] if len(closes) >= 252 else closes
    high_52w = max(window)
    low_52w = min(window)

    signals: list[str] = []
    for label, val in [("SMA-20", sma20), ("SMA-50", sma50), ("SMA-200", sma200)]:
        if val is not None:
            direction = "above" if last > val else "below"
            trend = " — long-term uptrend" if label == "SMA-200" and last > val else (
                " — long-term downtrend" if label == "SMA-200" else "")
            signals.append(f"Price {direction} {label} ({val:.2f}){trend}")

    rsi_label = "oversold" if rsi < 30 else "overbought" if rsi > 70 else "neutral"
    signals.append(f"RSI-14: {rsi} ({rsi_label})")

    if macd["histogram"] is not None:
        momentum = "bullish" if macd["histogram"] > 0 else "bearish"
        signals.append(f"MACD histogram: {macd['histogram']} ({momentum} momentum)")

    pct_high = round((last - high_52w) / high_52w * 100, 1)
    pct_low = round((last - low_52w) / low_52w * 100, 1)
    signals.append(
        f"52-week range: {pct_high}% from high ({high_52w:.2f}), "
        f"+{pct_low}% from low ({low_52w:.2f})"
    )

    return {
        "current_price": round(last, 2),
        "sma20": sma20,
        "sma50": sma50,
        "sma200": sma200,
        "rsi14": rsi,
        "macd": macd,
        "high_52w": round(high_52w, 2),
        "low_52w": round(low_52w, 2),
        "signals": signals,
    }


# ── data fetch ────────────────────────────────────────────────────────────────

async def _fetch_closes(symbol: str) -> list[float] | None:
    url = _YAHOO_URL.format(symbol=symbol)
    async with httpx.AsyncClient(timeout=12) as client:
        try:
            r = await client.get(
                url,
                params={"interval": "1d", "range": "1y"},
                headers=_YAHOO_HEADERS,
            )
            r.raise_for_status()
            raw = r.json()["chart"]["result"][0]["indicators"]["quote"][0]["close"]
            return [c for c in raw if c is not None]
        except Exception:
            return None


# ── LLM synthesis ─────────────────────────────────────────────────────────────

_SYSTEM = """\
You are a quantitative technical analyst. Given computed technical indicators for a stock, \
produce structured BUY/HOLD/SELL verdicts for two time horizons.

Rules:
1. Use ONLY provided indicator values. Never invent prices or data.
2. short_term = 1-4 weeks — weight RSI extremes, MACD momentum, short-term MAs.
3. long_term = 1+ year — weight SMA-200 trend, 52-week positioning, structural momentum.
4. action must be exactly: "buy", "hold", "sell", or "insufficient_data".
5. confidence_pct: 50 = weak/mixed, 80+ = multiple converging signals.
6. rationale: 1-2 sentences citing specific computed values.
7. indicators: 2-4 strings, each quoting an actual value from the data.
8. key_levels.support / key_levels.resistance: nearest price levels, or null.
9. OUTPUT: single JSON object — no prose, no markdown fences.

Schema:
{
  "symbol": "string",
  "as_of": "ISO-8601",
  "short_term": {
    "action": "buy|hold|sell|insufficient_data",
    "confidence_pct": 0-100,
    "rationale": "string",
    "indicators": ["string", ...]
  },
  "long_term": {
    "action": "buy|hold|sell|insufficient_data",
    "confidence_pct": 0-100,
    "rationale": "string",
    "indicators": ["string", ...]
  },
  "key_levels": {"support": number|null, "resistance": number|null}
}\
"""


async def run_technical_analysis(symbol: str) -> TechnicalVerdict:
    now = datetime.now(timezone.utc).isoformat()
    closes = await _fetch_closes(symbol)

    if not closes or len(closes) < 20:
        return TechnicalVerdict(
            symbol=symbol,
            as_of=now,
            short_term=_INSUFFICIENT,
            long_term=_INSUFFICIENT,
            key_levels=KeyLevels(),
        )

    indicators = _compute(closes)
    user_msg = (
        f"SYMBOL: {symbol}\n"
        f"AS_OF: {now}\n"
        f"INDICATORS:\n{json.dumps(indicators, indent=2)}\n\n"
        "Produce the TechnicalVerdict now."
    )

    async def _call() -> TechnicalVerdict:
        completion, _provider = await chat_with_failover(
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": user_msg},
            ],
            kind="synthesis",
            temperature=0.1,
            response_format={"type": "json_object"},
            symbol=symbol,
        )
        data = json.loads(completion.choices[0].message.content or "")
        verdict = TechnicalVerdict.model_validate(data)
        verdict.symbol = symbol
        verdict.as_of = now
        return verdict

    try:
        return await _call()
    except (ValidationError, ValueError, json.JSONDecodeError):
        return await _call()
    except Exception:
        return TechnicalVerdict(
            symbol=symbol,
            as_of=now,
            short_term=_INSUFFICIENT,
            long_term=_INSUFFICIENT,
            key_levels=KeyLevels(),
        )
