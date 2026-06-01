"""Technical analysis pipeline: OHLCV → indicators → LLM → TechnicalVerdict.

Supports 25 quantitative strategies across 5 categories:
  Trend Following  : trend_following, ema_crossover, golden_death_cross, adx_trend, supertrend
  Mean Reversion   : mean_reversion, rsi_divergence, stochastic_oscillator, williams_r, cci
  Momentum         : momentum, roc, price_momentum, macd_histogram, tsi
  Volatility       : bollinger_squeeze, atr_breakout, historical_volatility,
                     donchian_breakout, volatility_ratio
  Value / Cycle    : 52w_range, support_resistance, fibonacci, elder_ray, force_index
"""
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


# ══════════════════════════════════════════════════════════════════════════════
# Indicator math  (pure Python — no numpy/scipy dependencies)
# ══════════════════════════════════════════════════════════════════════════════

def _ema(values: list[float], period: int) -> list[float]:
    """Exponential moving average — full series."""
    k = 2 / (period + 1)
    result = [values[0]]
    for v in values[1:]:
        result.append(v * k + result[-1] * (1 - k))
    return result


def _sma(closes: list[float], period: int) -> float | None:
    if len(closes) < period:
        return None
    return round(sum(closes[-period:]) / period, 2)


def _std_dev(closes: list[float], period: int) -> float | None:
    if len(closes) < period:
        return None
    mean = sum(closes[-period:]) / period
    variance = sum((x - mean) ** 2 for x in closes[-period:]) / period
    return variance ** 0.5


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


def _atr(highs: list[float], lows: list[float], closes: list[float], period: int = 14) -> float | None:
    """Average True Range."""
    if len(closes) < period + 1:
        return None
    trs = []
    for i in range(1, len(closes)):
        tr = max(
            highs[i] - lows[i],
            abs(highs[i] - closes[i - 1]),
            abs(lows[i] - closes[i - 1]),
        )
        trs.append(tr)
    return round(sum(trs[-period:]) / period, 4)


def _stochastic(
    highs: list[float], lows: list[float], closes: list[float],
    k_period: int = 14, d_period: int = 3
) -> dict:
    """Stochastic Oscillator: %K and %D."""
    if len(closes) < k_period + d_period:
        return {"k": None, "d": None}
    k_values = []
    for i in range(k_period - 1, len(closes)):
        window_high = max(highs[i - k_period + 1 : i + 1])
        window_low  = min(lows[i  - k_period + 1 : i + 1])
        denom = window_high - window_low
        k = 100.0 * (closes[i] - window_low) / denom if denom != 0 else 50.0
        k_values.append(k)
    d_values = [
        sum(k_values[i - d_period + 1 : i + 1]) / d_period
        for i in range(d_period - 1, len(k_values))
    ]
    return {
        "k": round(k_values[-1], 1),
        "d": round(d_values[-1], 1) if d_values else None,
    }


def _williams_r(
    highs: list[float], lows: list[float], closes: list[float], period: int = 14
) -> float | None:
    """Williams %R."""
    if len(closes) < period:
        return None
    hh = max(highs[-period:])
    ll = min(lows[-period:])
    denom = hh - ll
    if denom == 0:
        return -50.0
    return round(-100.0 * (hh - closes[-1]) / denom, 1)


def _cci(
    highs: list[float], lows: list[float], closes: list[float], period: int = 20
) -> float | None:
    """Commodity Channel Index."""
    if len(closes) < period:
        return None
    typical = [(h + l + c) / 3 for h, l, c in zip(highs, lows, closes)]
    tp_slice = typical[-period:]
    mean_tp = sum(tp_slice) / period
    mean_dev = sum(abs(x - mean_tp) for x in tp_slice) / period
    if mean_dev == 0:
        return 0.0
    return round((typical[-1] - mean_tp) / (0.015 * mean_dev), 1)


def _donchian(
    highs: list[float], lows: list[float], period: int = 20
) -> dict:
    """Donchian Channel: upper (highest high), lower (lowest low)."""
    if len(highs) < period:
        return {"upper": None, "lower": None}
    return {
        "upper": round(max(highs[-period:]), 2),
        "lower": round(min(lows[-period:]), 2),
    }


def _roc(closes: list[float], period: int) -> float | None:
    """Rate of Change (%)."""
    if len(closes) < period + 1:
        return None
    base = closes[-(period + 1)]
    if base == 0:
        return None
    return round((closes[-1] - base) / base * 100, 2)


def _tsi(closes: list[float], long_period: int = 25, short_period: int = 13) -> dict:
    """True Strength Index."""
    min_len = long_period + short_period + 5
    if len(closes) < min_len:
        return {"tsi": None, "signal": None}
    momentum = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
    abs_momentum = [abs(m) for m in momentum]
    ema1_m = _ema(momentum, long_period)
    ema2_m = _ema(ema1_m, short_period)
    ema1_am = _ema(abs_momentum, long_period)
    ema2_am = _ema(ema1_am, short_period)
    if ema2_am[-1] == 0:
        return {"tsi": None, "signal": None}
    tsi_val = round(100 * ema2_m[-1] / ema2_am[-1], 2)
    signal_line = _ema([100 * a / b for a, b in zip(ema2_m, ema2_am) if b != 0], 13)
    return {"tsi": tsi_val, "signal": round(signal_line[-1], 2) if signal_line else None}


def _adx(
    highs: list[float], lows: list[float], closes: list[float], period: int = 14
) -> dict:
    """Average Directional Index: ADX, +DI, -DI."""
    min_len = 2 * period + 1
    if len(closes) < min_len:
        return {"adx": None, "plus_di": None, "minus_di": None}
    plus_dm, minus_dm, trs = [], [], []
    for i in range(1, len(closes)):
        up   = highs[i] - highs[i - 1]
        down = lows[i - 1] - lows[i]
        plus_dm.append(max(up, 0) if up > down else 0)
        minus_dm.append(max(down, 0) if down > up else 0)
        tr = max(
            highs[i] - lows[i],
            abs(highs[i] - closes[i - 1]),
            abs(lows[i] - closes[i - 1]),
        )
        trs.append(tr)

    def _smooth(vals: list[float], p: int) -> list[float]:
        smoothed = [sum(vals[:p])]
        for v in vals[p:]:
            smoothed.append(smoothed[-1] - smoothed[-1] / p + v)
        return smoothed

    atr14   = _smooth(trs, period)
    pdm14   = _smooth(plus_dm, period)
    mdm14   = _smooth(minus_dm, period)
    pdi     = [100 * p / a if a != 0 else 0 for p, a in zip(pdm14, atr14)]
    mdi     = [100 * m / a if a != 0 else 0 for m, a in zip(mdm14, atr14)]
    dx_vals = [
        100 * abs(p - m) / (p + m) if (p + m) != 0 else 0
        for p, m in zip(pdi, mdi)
    ]
    adx_vals = _smooth(dx_vals, period)
    return {
        "adx": round(adx_vals[-1], 1),
        "plus_di": round(pdi[-1], 1),
        "minus_di": round(mdi[-1], 1),
    }


def _historical_volatility(closes: list[float], period: int = 20) -> float | None:
    """Annualised historical volatility (log returns, %)."""
    if len(closes) < period + 1:
        return None
    log_returns = []
    for i in range(1, len(closes)):
        if closes[i - 1] <= 0:
            continue
        import math
        log_returns.append(math.log(closes[i] / closes[i - 1]))
    lr = log_returns[-period:]
    if len(lr) < 2:
        return None
    mean = sum(lr) / len(lr)
    variance = sum((x - mean) ** 2 for x in lr) / (len(lr) - 1)
    import math
    return round(math.sqrt(variance * 252) * 100, 2)


def _keltner_channel(
    highs: list[float], lows: list[float], closes: list[float],
    ema_period: int = 20, atr_period: int = 10, mult: float = 2.0
) -> dict:
    """Keltner Channel: upper, mid, lower."""
    if len(closes) < max(ema_period, atr_period) + 2:
        return {"upper": None, "mid": None, "lower": None}
    mid = _ema(closes, ema_period)[-1]
    atr = _atr(highs, lows, closes, atr_period)
    if atr is None:
        return {"upper": None, "mid": None, "lower": None}
    return {
        "upper": round(mid + mult * atr, 2),
        "mid": round(mid, 2),
        "lower": round(mid - mult * atr, 2),
    }


def _supertrend(
    highs: list[float], lows: list[float], closes: list[float],
    period: int = 10, multiplier: float = 3.0
) -> dict:
    """Supertrend indicator: direction (+1 bullish, -1 bearish) and line value."""
    min_len = period + 2
    if len(closes) < min_len:
        return {"value": None, "direction": None}
    # Compute ATR series
    trs = [max(highs[i] - lows[i], abs(highs[i] - closes[i - 1]), abs(lows[i] - closes[i - 1]))
           for i in range(1, len(closes))]
    # Simple ATR smoothing (Wilder)
    atr_series: list[float] = [sum(trs[:period]) / period]
    for tr in trs[period:]:
        atr_series.append((atr_series[-1] * (period - 1) + tr) / period)

    st_upper: list[float] = []
    st_lower: list[float] = []
    direction: list[int] = []

    offset = period  # atr_series aligns with closes[period:]
    for i, atr in enumerate(atr_series):
        idx = i + offset
        hl2 = (highs[idx] + lows[idx]) / 2
        basic_upper = hl2 + multiplier * atr
        basic_lower = hl2 - multiplier * atr

        if i == 0:
            st_upper.append(basic_upper)
            st_lower.append(basic_lower)
            direction.append(1)
        else:
            prev_upper = st_upper[-1]
            prev_lower = st_lower[-1]
            final_upper = basic_upper if basic_upper < prev_upper or closes[idx - 1] > prev_upper else prev_upper
            final_lower = basic_lower if basic_lower > prev_lower or closes[idx - 1] < prev_lower else prev_lower
            st_upper.append(final_upper)
            st_lower.append(final_lower)
            if direction[-1] == 1:
                d = -1 if closes[idx] < final_lower else 1
            else:
                d = 1 if closes[idx] > final_upper else -1
            direction.append(d)

    d = direction[-1]
    val = st_lower[-1] if d == 1 else st_upper[-1]
    return {"value": round(val, 2), "direction": d}


def _pivot_points(high: float, low: float, close: float) -> dict:
    """Classic pivot points: PP, S1, R1, S2, R2."""
    pp = (high + low + close) / 3
    r1 = 2 * pp - low
    s1 = 2 * pp - high
    r2 = pp + (high - low)
    s2 = pp - (high - low)
    return {
        "pp": round(pp, 2),
        "r1": round(r1, 2),
        "s1": round(s1, 2),
        "r2": round(r2, 2),
        "s2": round(s2, 2),
    }


def _fibonacci(highs: list[float], lows: list[float], closes: list[float]) -> dict:
    """Fibonacci retracement levels from the most recent 52-week swing."""
    window = min(252, len(closes))
    h = max(highs[-window:])
    l = min(lows[-window:])
    diff = h - l
    last = closes[-1]
    levels = {
        "high": round(h, 2),
        "low": round(l, 2),
        "fib_236": round(h - 0.236 * diff, 2),
        "fib_382": round(h - 0.382 * diff, 2),
        "fib_500": round(h - 0.500 * diff, 2),
        "fib_618": round(h - 0.618 * diff, 2),
    }
    # Nearest retracement label
    keys = ["fib_236", "fib_382", "fib_500", "fib_618"]
    nearest = min(keys, key=lambda k: abs(levels[k] - last))
    levels["nearest"] = nearest
    levels["last"] = round(last, 2)
    return levels


def _elder_ray(closes: list[float], period: int = 13) -> dict:
    """Elder Ray: Bull Power and Bear Power relative to EMA-13."""
    # Requires highs/lows; approximate with close for pure-price version
    if len(closes) < period + 1:
        return {"bull_power": None, "bear_power": None, "ema": None}
    ema = _ema(closes, period)[-1]
    # Without H/L data at this call-site, approximate using close
    return {
        "bull_power": round(closes[-1] - ema, 4),
        "bear_power": round(closes[-1] - ema, 4),
        "ema": round(ema, 2),
    }


def _elder_ray_hl(
    highs: list[float], lows: list[float], closes: list[float], period: int = 13
) -> dict:
    """Elder Ray using actual H/L."""
    if len(closes) < period + 1:
        return {"bull_power": None, "bear_power": None, "ema": None}
    ema = _ema(closes, period)[-1]
    return {
        "bull_power": round(highs[-1] - ema, 4),
        "bear_power": round(lows[-1] - ema, 4),
        "ema": round(ema, 2),
    }


def _force_index(closes: list[float], volumes: list[float], period: int = 13) -> dict:
    """Force Index: raw and EMA-smoothed."""
    if len(closes) < period + 2:
        return {"fi2": None, "fi13": None}
    fi_raw = [(closes[i] - closes[i - 1]) * volumes[i] for i in range(1, len(closes))]
    fi2  = _ema(fi_raw, 2)[-1]
    fi13 = _ema(fi_raw, period)[-1]
    return {"fi2": round(fi2, 2), "fi13": round(fi13, 2)}


# ══════════════════════════════════════════════════════════════════════════════
# Strategy dispatcher
# ══════════════════════════════════════════════════════════════════════════════

def _compute(data: list[dict], strategy: str) -> dict:  # noqa: C901  (complex by design)
    closes  = [d["close"]  for d in data]
    volumes = [d["volume"] for d in data]
    highs   = [d.get("high",  d["close"]) for d in data]   # fallback to close if missing
    lows    = [d.get("low",   d["close"]) for d in data]
    last    = closes[-1]

    # Common pre-computes (always available)
    sma20  = _sma(closes, 20)
    sma50  = _sma(closes, 50)
    sma200 = _sma(closes, 200)
    rsi    = _rsi(closes, 14)
    window = closes[-252:] if len(closes) >= 252 else closes
    high_52w = max(highs[-252:] if len(highs) >= 252 else highs)
    low_52w  = min(lows[-252:]  if len(lows)  >= 252 else lows)

    signals: list[str] = []
    metrics: dict = {
        "current_price": round(last, 2),
        "high_52w": round(high_52w, 2),
        "low_52w":  round(low_52w,  2),
    }

    # ── Trend Following ────────────────────────────────────────────────────────
    if strategy == "trend_following":
        macd_res = _macd(closes)
        metrics.update({"sma20": sma20, "sma50": sma50, "sma200": sma200, "macd": macd_res})
        for label, val in [("SMA-20", sma20), ("SMA-50", sma50), ("SMA-200", sma200)]:
            if val is not None:
                direction = "above" if last > val else "below"
                trend = " — long-term uptrend" if label == "SMA-200" and last > val else (
                    " — long-term downtrend" if label == "SMA-200" else "")
                signals.append(f"Price {direction} {label} ({val:.2f}){trend}")
        if macd_res["histogram"] is not None:
            m_val = macd_res["histogram"]
            signals.append(f"MACD histogram: {m_val} ({'bullish' if m_val > 0 else 'bearish'} momentum)")

    elif strategy == "ema_crossover":
        ema9  = _ema(closes, 9)[-1]
        ema21 = _ema(closes, 21)[-1]
        ema50 = _ema(closes, 50)[-1]
        metrics.update({"ema9": round(ema9, 2), "ema21": round(ema21, 2), "ema50": round(ema50, 2)})
        cross = "bullish" if ema9 > ema21 else "bearish"
        signals.append(f"EMA-9 ({ema9:.2f}) is {'above' if ema9 > ema21 else 'below'} EMA-21 ({ema21:.2f}) — {cross} cross")
        if ema21 > ema50:
            signals.append(f"EMA-21 ({ema21:.2f}) above EMA-50 ({ema50:.2f}) — intermediate uptrend")
        else:
            signals.append(f"EMA-21 ({ema21:.2f}) below EMA-50 ({ema50:.2f}) — intermediate downtrend")
        signals.append(f"Price vs EMA-50: {'above' if last > ema50 else 'below'} ({ema50:.2f})")

    elif strategy == "golden_death_cross":
        metrics.update({"sma50": sma50, "sma200": sma200})
        if sma50 is not None and sma200 is not None:
            cross = "Golden Cross (bullish)" if sma50 > sma200 else "Death Cross (bearish)"
            signals.append(f"SMA-50 ({sma50:.2f}) vs SMA-200 ({sma200:.2f}): {cross}")
            gap_pct = round((sma50 - sma200) / sma200 * 100, 2)
            signals.append(f"Gap between SMA-50 and SMA-200: {gap_pct:+.2f}%")
        signals.append(f"Price vs SMA-200: {'above' if sma200 and last > sma200 else 'below'} ({sma200})")
        macd_res = _macd(closes)
        metrics["macd"] = macd_res
        if macd_res["histogram"] is not None:
            signals.append(f"MACD confirmation: {'bullish' if macd_res['histogram'] > 0 else 'bearish'} (hist {macd_res['histogram']})")

    elif strategy == "adx_trend":
        adx_res = _adx(highs, lows, closes)
        metrics.update(adx_res)
        if adx_res["adx"] is not None:
            strength = "strong" if adx_res["adx"] > 25 else "weak"
            signals.append(f"ADX-14: {adx_res['adx']} ({strength} trend)")
            signals.append(f"+DI: {adx_res['plus_di']} vs -DI: {adx_res['minus_di']} — {'bullish' if adx_res['plus_di'] > adx_res['minus_di'] else 'bearish'} bias")
        else:
            signals.append("Insufficient data for ADX calculation")

    elif strategy == "supertrend":
        st = _supertrend(highs, lows, closes)
        metrics["supertrend"] = st
        if st["value"] is not None:
            label = "BULLISH (price above Supertrend)" if st["direction"] == 1 else "BEARISH (price below Supertrend)"
            signals.append(f"Supertrend: {label} — line at {st['value']:.2f}")
            atr14 = _atr(highs, lows, closes, 14)
            metrics["atr14"] = atr14
            if atr14:
                signals.append(f"ATR-14 (volatility): {atr14:.2f} ({round(atr14 / last * 100, 1)}% of price)")
        else:
            signals.append("Insufficient data for Supertrend")

    # ── Mean Reversion ─────────────────────────────────────────────────────────
    elif strategy == "mean_reversion":
        std = _std_dev(closes, 20)
        metrics.update({"sma20": sma20, "rsi14": rsi})
        if std is not None and sma20 is not None:
            upper_bb = sma20 + 2 * std
            lower_bb = sma20 - 2 * std
            metrics.update({"bollinger_upper": round(upper_bb, 2), "bollinger_lower": round(lower_bb, 2)})
            pos = "above" if last > upper_bb else "below" if last < lower_bb else "within"
            signals.append(f"Price is {pos} Bollinger Band ({lower_bb:.2f} – {upper_bb:.2f})")
        rsi_label = "oversold" if rsi < 30 else "overbought" if rsi > 70 else "neutral"
        signals.append(f"RSI-14: {rsi} ({rsi_label})")

    elif strategy == "rsi_divergence":
        metrics.update({"rsi14": rsi, "sma20": sma20})
        rsi_label = "oversold" if rsi < 30 else "overbought" if rsi > 70 else "neutral"
        signals.append(f"RSI-14: {rsi} ({rsi_label})")
        # Simple divergence check: recent price direction vs recent RSI direction
        if len(closes) >= 20:
            price_change  = closes[-1] - closes[-20]
            rsi_now       = _rsi(closes)
            rsi_20ago     = _rsi(closes[:-20]) if len(closes) > 20 else rsi_now
            rsi_change    = rsi_now - rsi_20ago
            metrics["rsi_20d_ago"] = round(rsi_20ago, 1)
            if price_change > 0 and rsi_change < -5:
                signals.append(f"Bearish divergence: price up {price_change:.2f} but RSI fell {rsi_change:.1f}pts")
            elif price_change < 0 and rsi_change > 5:
                signals.append(f"Bullish divergence: price down {abs(price_change):.2f} but RSI rose {rsi_change:.1f}pts")
            else:
                signals.append(f"No strong divergence — price Δ {price_change:.2f}, RSI Δ {rsi_change:.1f}pts")
        if sma20 is not None:
            signals.append(f"Price vs SMA-20: {'above' if last > sma20 else 'below'} ({sma20:.2f})")

    elif strategy == "stochastic_oscillator":
        stoch = _stochastic(highs, lows, closes)
        metrics["stochastic"] = stoch
        if stoch["k"] is not None:
            k_label = "oversold" if stoch["k"] < 20 else "overbought" if stoch["k"] > 80 else "neutral"
            signals.append(f"%K(14): {stoch['k']} — {k_label}")
            if stoch["d"] is not None:
                cross = "bullish" if stoch["k"] > stoch["d"] else "bearish"
                signals.append(f"%K ({stoch['k']}) vs %D ({stoch['d']}) — {cross} stochastic cross")
        else:
            signals.append("Insufficient data for Stochastic")
        signals.append(f"RSI-14 (context): {rsi}")

    elif strategy == "williams_r":
        wr = _williams_r(highs, lows, closes)
        metrics["williams_r"] = wr
        if wr is not None:
            wr_label = "oversold" if wr < -80 else "overbought" if wr > -20 else "neutral"
            signals.append(f"Williams %R(14): {wr} ({wr_label}; oversold < -80, overbought > -20)")
            signals.append(f"RSI-14 confirmation: {rsi}")
        else:
            signals.append("Insufficient data for Williams %R")

    elif strategy == "cci":
        cci_val = _cci(highs, lows, closes, 20)
        metrics["cci20"] = cci_val
        if cci_val is not None:
            cci_label = "oversold" if cci_val < -100 else "overbought" if cci_val > 100 else "neutral"
            signals.append(f"CCI-20: {cci_val} ({cci_label}; extreme beyond ±100)")
            signals.append(f"RSI-14 (confirmation): {rsi}")
        else:
            signals.append("Insufficient data for CCI")
        if sma20:
            signals.append(f"Price vs SMA-20: {'above' if last > sma20 else 'below'} ({sma20:.2f})")

    # ── Momentum ───────────────────────────────────────────────────────────────
    elif strategy == "momentum":
        avg_vol = sum(volumes[-20:]) / 20 if len(volumes) >= 20 else None
        metrics.update({"rsi14": rsi})
        if avg_vol:
            vol_ratio = volumes[-1] / avg_vol
            metrics["vol_ratio"] = round(vol_ratio, 2)
            state = "high" if vol_ratio > 1.5 else "normal"
            signals.append(f"Volume Ratio: {vol_ratio:.2f}x 20d avg ({state} activity)")
        pct_high = round((last - high_52w) / high_52w * 100, 1)
        signals.append(f"Price is {pct_high}% from 52-week high ({high_52w:.2f})")
        macd_res = _macd(closes)
        metrics["macd"] = macd_res
        if macd_res["histogram"] is not None:
            m_val = macd_res["histogram"]
            signals.append(f"MACD momentum: {'bullish' if m_val > 0 else 'bearish'} (hist: {m_val})")

    elif strategy == "roc":
        roc10 = _roc(closes, 10)
        roc20 = _roc(closes, 20)
        roc60 = _roc(closes, 60)
        metrics.update({"roc10": roc10, "roc20": roc20, "roc60": roc60})
        for period_label, val in [("10d", roc10), ("20d", roc20), ("60d", roc60)]:
            if val is not None:
                label = "positive momentum" if val > 0 else "negative momentum"
                signals.append(f"ROC-{period_label}: {val:+.2f}% ({label})")

    elif strategy == "price_momentum":
        m1  = _roc(closes, 21)   # ~1 month
        m3  = _roc(closes, 63)   # ~3 months
        m6  = _roc(closes, 126)  # ~6 months
        m12 = _roc(closes, 252)  # ~12 months
        metrics.update({"momentum_1m": m1, "momentum_3m": m3, "momentum_6m": m6, "momentum_12m": m12})
        for label, val in [("1-Month", m1), ("3-Month", m3), ("6-Month", m6), ("12-Month", m12)]:
            if val is not None:
                signals.append(f"{label} Return: {val:+.2f}%")
        # Count positive horizons
        positives = [v for v in [m1, m3, m6, m12] if v is not None and v > 0]
        signals.append(f"Positive across {len(positives)} of {len([v for v in [m1, m3, m6, m12] if v is not None])} time horizons")

    elif strategy == "macd_histogram":
        macd_res = _macd(closes)
        metrics["macd"] = macd_res
        if macd_res["histogram"] is not None:
            h = macd_res["histogram"]
            signals.append(f"MACD Histogram: {h} ({'bullish' if h > 0 else 'bearish'} momentum)")
            signals.append(f"MACD Line: {macd_res['macd']} vs Signal: {macd_res['signal']}")
            # Histogram direction (slope)
            if len(closes) >= 36:
                prev_macd = _macd(closes[:-1])
                if prev_macd["histogram"] is not None:
                    slope = h - prev_macd["histogram"]
                    metrics["histogram_slope"] = round(slope, 4)
                    signals.append(f"Histogram slope: {slope:+.4f} ({'accelerating' if slope > 0 else 'decelerating'} {'bullish' if h > 0 else 'bearish'})")
        else:
            signals.append("Insufficient data for MACD (needs 35+ bars)")

    elif strategy == "tsi":
        tsi_res = _tsi(closes)
        metrics["tsi"] = tsi_res
        if tsi_res["tsi"] is not None:
            t = tsi_res["tsi"]
            t_label = "bullish" if t > 0 else "bearish"
            signals.append(f"TSI(25,13): {t} ({t_label}; above 0 = bullish)")
            if tsi_res["signal"] is not None:
                cross = "bullish" if t > tsi_res["signal"] else "bearish"
                signals.append(f"TSI vs Signal ({tsi_res['signal']}): {cross} crossover")
        else:
            signals.append("Insufficient data for TSI (needs ~43+ bars)")
        signals.append(f"RSI-14 (context): {rsi}")

    # ── Volatility ─────────────────────────────────────────────────────────────
    elif strategy == "bollinger_squeeze":
        std = _std_dev(closes, 20)
        kc  = _keltner_channel(highs, lows, closes)
        metrics.update({"sma20": sma20, "keltner": kc})
        if std is not None and sma20 is not None:
            bb_upper = sma20 + 2 * std
            bb_lower = sma20 - 2 * std
            bb_width = round((bb_upper - bb_lower) / sma20 * 100, 2)
            metrics.update({"bb_upper": round(bb_upper, 2), "bb_lower": round(bb_lower, 2), "bb_width_pct": bb_width})
            signals.append(f"Bollinger Band Width: {bb_width}% of SMA-20")
            if kc["upper"] is not None:
                squeeze = bb_upper < kc["upper"] and bb_lower > kc["lower"]
                signals.append(f"Bollinger Squeeze: {'ACTIVE (low volatility, potential breakout)' if squeeze else 'not active'}")
        signals.append(f"RSI-14: {rsi}")

    elif strategy == "atr_breakout":
        atr14 = _atr(highs, lows, closes, 14)
        metrics.update({"atr14": atr14, "sma20": sma20})
        if atr14 is not None and sma20 is not None:
            atr_pct = round(atr14 / last * 100, 2)
            metrics["atr_pct_of_price"] = atr_pct
            signals.append(f"ATR-14: {atr14:.2f} ({atr_pct}% of price)")
            # Price vs ATR channel from SMA-20
            upper_channel = sma20 + atr14
            lower_channel = sma20 - atr14
            pos = "above" if last > upper_channel else "below" if last < lower_channel else "within"
            signals.append(f"Price {pos} 1-ATR channel ({lower_channel:.2f} – {upper_channel:.2f})")
        else:
            signals.append("Insufficient data for ATR Breakout")

    elif strategy == "historical_volatility":
        hv20  = _historical_volatility(closes, 20)
        hv60  = _historical_volatility(closes, 60)
        hv252 = _historical_volatility(closes, 252)
        metrics.update({"hv20": hv20, "hv60": hv60, "hv252": hv252})
        for label, val in [("HV-20d", hv20), ("HV-60d", hv60), ("HV-252d (annual)", hv252)]:
            if val is not None:
                signals.append(f"{label}: {val}% annualised volatility")
        if hv20 is not None and hv252 is not None:
            regime = "elevated" if hv20 > hv252 else "compressed"
            signals.append(f"Short-term vol is {regime} vs long-term ({hv20}% vs {hv252}%)")

    elif strategy == "donchian_breakout":
        dc20 = _donchian(highs, lows, 20)
        dc55 = _donchian(highs, lows, 55)
        metrics.update({"donchian_20": dc20, "donchian_55": dc55})
        if dc20["upper"] is not None:
            pos20 = "AT 20D HIGH (breakout!)" if last >= dc20["upper"] else (
                    "AT 20D LOW (breakdown!)" if last <= dc20["lower"] else "within 20D channel")
            signals.append(f"Donchian-20: upper {dc20['upper']} / lower {dc20['lower']} — price is {pos20}")
        if dc55["upper"] is not None:
            pos55 = "AT 55D HIGH (turtle breakout!)" if last >= dc55["upper"] else (
                    "AT 55D LOW (turtle breakdown!)" if last <= dc55["lower"] else "within 55D channel")
            signals.append(f"Donchian-55: upper {dc55['upper']} / lower {dc55['lower']} — price is {pos55}")

    elif strategy == "volatility_ratio":
        hv5  = _historical_volatility(closes, 5)
        hv20 = _historical_volatility(closes, 20)
        metrics.update({"hv5": hv5, "hv20": hv20})
        if hv5 is not None and hv20 is not None and hv20 != 0:
            vr = round(hv5 / hv20, 2)
            metrics["volatility_ratio"] = vr
            regime = "high (potential reversal)" if vr > 1.5 else "low (trend continuation likely)" if vr < 0.8 else "normal"
            signals.append(f"Volatility Ratio (HV-5/HV-20): {vr} — {regime}")
            signals.append(f"HV-5d: {hv5}% | HV-20d: {hv20}%")
        else:
            signals.append("Insufficient data for Volatility Ratio")

    # ── Value / Cycle ──────────────────────────────────────────────────────────
    elif strategy == "52w_range":
        pct_high = round((last - high_52w) / high_52w * 100, 2)
        pct_low  = round((last - low_52w)  / low_52w  * 100, 2)
        rng      = high_52w - low_52w
        position = round((last - low_52w) / rng * 100, 1) if rng else 50.0
        metrics.update({"pct_from_52w_high": pct_high, "pct_from_52w_low": pct_low, "position_in_range_pct": position})
        signals.append(f"Price is {pct_high}% from 52-week high ({high_52w:.2f})")
        signals.append(f"Price is {pct_low:+.2f}% from 52-week low ({low_52w:.2f})")
        zone = "upper quartile" if position > 75 else "lower quartile" if position < 25 else "middle range"
        signals.append(f"Position in 52W range: {position}% — {zone}")

    elif strategy == "support_resistance":
        pp = _pivot_points(high_52w, low_52w, last)
        metrics["pivot_points"] = pp
        # More meaningful daily pivots from last 5 bars
        if len(highs) >= 2:
            recent_high = max(highs[-5:]) if len(highs) >= 5 else highs[-1]
            recent_low  = min(lows[-5:])  if len(lows)  >= 5 else lows[-1]
            daily_pp    = _pivot_points(recent_high, recent_low, closes[-1])
            metrics["daily_pivots"] = daily_pp
            signals.append(f"Daily Pivot Point: {daily_pp['pp']}")
            signals.append(f"Daily R1: {daily_pp['r1']} | S1: {daily_pp['s1']}")
            signals.append(f"Daily R2: {daily_pp['r2']} | S2: {daily_pp['s2']}")
        signals.append(f"52W Pivot PP: {pp['pp']}")

    elif strategy == "fibonacci":
        fib = _fibonacci(highs, lows, closes)
        metrics["fibonacci"] = fib
        signals.append(f"52W Swing: High {fib['high']} → Low {fib['low']}")
        for level, label in [("fib_382", "38.2%"), ("fib_500", "50%"), ("fib_618", "61.8%")]:
            val = fib[level]
            dist = round((last - val) / val * 100, 2)
            signals.append(f"Fib {label} retracement: {val} (price is {dist:+.2f}% away)")
        signals.append(f"Nearest Fibonacci level: {fib['nearest']}")

    elif strategy == "elder_ray":
        er = _elder_ray_hl(highs, lows, closes, 13)
        metrics["elder_ray"] = er
        if er["bull_power"] is not None:
            bull_label = "positive (bulls dominant)" if er["bull_power"] > 0 else "negative (bears dominant)"
            bear_label = "positive (weak bear power)" if er["bear_power"] > 0 else "negative (bears dominant)"
            signals.append(f"Bull Power: {er['bull_power']:.4f} — {bull_label}")
            signals.append(f"Bear Power: {er['bear_power']:.4f} — {bear_label}")
            signals.append(f"EMA-13 (spine): {er['ema']:.2f}")
        else:
            signals.append("Insufficient data for Elder Ray")
        signals.append(f"RSI-14 (context): {rsi}")

    elif strategy == "force_index":
        fi = _force_index(closes, volumes, 13)
        metrics["force_index"] = fi
        if fi["fi13"] is not None:
            fi13_label = "bullish (positive force)" if fi["fi13"] > 0 else "bearish (negative force)"
            fi2_label  = "bullish" if fi["fi2"] > 0 else "bearish"
            signals.append(f"Force Index (13): {fi['fi13']:.2f} — {fi13_label}")
            signals.append(f"Force Index (2): {fi['fi2']:.2f} — {fi2_label} (short-term)")
        else:
            signals.append("Insufficient data for Force Index")
        signals.append(f"RSI-14 (context): {rsi}")

    else:
        # Fallback: generic summary for unknown strategy IDs
        signals.append(f"Unknown strategy '{strategy}' — falling back to price summary")
        signals.append(f"SMA-50: {sma50} | SMA-200: {sma200}")
        signals.append(f"RSI-14: {rsi}")
        metrics.update({"sma50": sma50, "sma200": sma200, "rsi14": rsi})

    return {**metrics, "signals": signals}


# ══════════════════════════════════════════════════════════════════════════════
# Data fetch — OHLCV (now includes high + low)
# ══════════════════════════════════════════════════════════════════════════════

async def _fetch_ohlcv(symbol: str) -> list[dict] | None:
    url = _YAHOO_URL.format(symbol=symbol)
    async with httpx.AsyncClient(timeout=12) as client:
        try:
            r = await client.get(
                url,
                params={"interval": "1d", "range": "2y"},   # 2y for 252-bar indicators
                headers=_YAHOO_HEADERS,
            )
            r.raise_for_status()
            res = r.json()["chart"]["result"][0]
            quote   = res["indicators"]["quote"][0]
            closes  = quote.get("close",  [])
            highs   = quote.get("high",   [])
            lows    = quote.get("low",    [])
            volumes = quote.get("volume", [])
            return [
                {"close": c, "high": h, "low": l, "volume": v or 0}
                for c, h, l, v in zip(closes, highs, lows, volumes)
                if c is not None and h is not None and l is not None
            ]
        except Exception:
            return None


# ══════════════════════════════════════════════════════════════════════════════
# LLM synthesis
# ══════════════════════════════════════════════════════════════════════════════

_SYSTEM = """\
You are a quantitative technical analyst. Given computed technical indicators and a chosen strategy, \
produce structured BUY/HOLD/SELL verdicts for two time horizons.

STRATEGIES (25 total across 5 categories):

Trend Following:
  trend_following      — SMA-20/50/200 alignment + MACD.
  ema_crossover        — EMA-9/21/50 crossovers; short-term momentum.
  golden_death_cross   — SMA-50 vs SMA-200 golden/death cross; long-term regime.
  adx_trend            — ADX-14 strength (>25 = strong). +DI vs -DI direction.
  supertrend           — ATR-based Supertrend line; direction = bullish/bearish.

Mean Reversion:
  mean_reversion       — RSI-14 extremes + Bollinger Bands (buy dip / sell rip).
  rsi_divergence       — RSI vs price divergence (hidden/regular).
  stochastic_oscillator— %K/%D stochastic; overbought (>80) / oversold (<20).
  williams_r           — Williams %R; overbought (>-20) / oversold (<-80).
  cci                  — CCI-20; overbought (>100) / oversold (<-100).

Momentum:
  momentum             — Volume spikes + 52W range position + MACD.
  roc                  — Rate of Change 10/20/60d; positive = upward momentum.
  price_momentum       — 1/3/6/12-month returns; cross-horizon momentum profile.
  macd_histogram       — MACD histogram slope; acceleration of momentum.
  tsi                  — True Strength Index(25,13); above 0 = bullish.

Volatility:
  bollinger_squeeze    — BB vs Keltner Channel; squeeze = pending breakout.
  atr_breakout         — ATR-14 channel; price outside 1-ATR = potential breakout.
  historical_volatility— Annualised HV-20/60/252; rising short-term HV = caution.
  donchian_breakout    — Donchian-20/55 channel; breakout = Turtle strategy signal.
  volatility_ratio     — HV-5/HV-20 ratio; >1.5 = high-vol potential reversal.

Value / Cycle:
  52w_range            — Position within 52-week high/low range; quartile zone.
  support_resistance   — Pivot points (PP, R1/R2, S1/S2) nearest to current price.
  fibonacci            — Fibonacci 38.2/50/61.8% retracement levels from 52W swing.
  elder_ray            — Bull/Bear Power relative to EMA-13; bullish = positive bull power + negative bear power.
  force_index          — FI-2 (short-term) + FI-13 (long-term); positive = accumulation.

Rules:
1. Analyse ONLY through the lens of the provided STRATEGY. Mention only its relevant indicators.
2. Use ONLY provided indicator values. Never invent prices or data.
3. short_term = 1-4 weeks — weight current momentum and immediate indicator signals.
4. long_term  = 1+ year  — weight structural trends and 52-week positioning.
5. action must be exactly: "buy", "hold", "sell", or "insufficient_data".
6. confidence_pct: 50 = weak/mixed, 80+ = multiple converging signals.
7. rationale: 1-2 sentences citing specific computed values from the data.
8. indicators: 2-4 strings, each quoting an actual value from the indicators JSON.
9. key_levels.support / key_levels.resistance: nearest price levels, or null.
10. OUTPUT: single JSON object — no prose, no markdown fences.

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
}
"""


async def run_technical_analysis(symbol: str, strategy: str = "trend_following") -> TechnicalVerdict:
    now  = datetime.now(timezone.utc).isoformat()
    data = await _fetch_ohlcv(symbol)

    if not data or len(data) < 20:
        return TechnicalVerdict(
            symbol=symbol,
            as_of=now,
            short_term=_INSUFFICIENT,
            long_term=_INSUFFICIENT,
            key_levels=KeyLevels(),
        )

    indicators = _compute(data, strategy)
    user_msg = (
        f"SYMBOL: {symbol}\n"
        f"STRATEGY: {strategy}\n"
        f"AS_OF: {now}\n"
        f"INDICATORS:\n{json.dumps(indicators, indent=2)}\n\n"
        "Produce the TechnicalVerdict now."
    )

    async def _call() -> TechnicalVerdict:
        completion, _provider = await chat_with_failover(
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user",   "content": user_msg},
            ],
            kind="synthesis",
            temperature=0.1,
            response_format={"type": "json_object"},
            symbol=symbol,
        )
        parsed = json.loads(completion.choices[0].message.content or "")
        verdict = TechnicalVerdict.model_validate(parsed)
        verdict.symbol = symbol
        verdict.as_of  = now
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
