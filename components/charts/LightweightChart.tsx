"use client";
// TODO(charting-library): swap widget for self-hosted Advanced Charts once licence approved.
// Apply at https://www.tradingview.com/advanced-charts/ — see docs/DECISIONS.md ADR-0005.

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import type { CandleBar } from "@/lib/data/finnhub";
import { useRouter } from "next/navigation";

// ── Indicator math (mirrors backend pure-Python logic) ──────────────────────

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

function smaFull(values: number[], period: number): (number | null)[] {
  return values.map((_, i) =>
    i < period - 1 ? null : values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
  );
}

function stdDev(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const slice = values.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    return Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
  });
}

function rsiSeries(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(period).fill(null);
  for (let i = period; i < closes.length; i++) {
    const slice = closes.slice(i - period, i + 1);
    const deltas = slice.slice(1).map((v, j) => v - slice[j]);
    const gains = deltas.filter(d => d > 0).reduce((a, b) => a + b, 0) / period;
    const losses = deltas.filter(d => d < 0).map(d => -d).reduce((a, b) => a + b, 0) / period;
    result.push(losses === 0 ? 100 : Math.round((100 - 100 / (1 + gains / losses)) * 10) / 10);
  }
  return result;
}

function macdSeries(closes: number[]) {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const hist = macdLine.map((v, i) => v - signalLine[i]);
  return { macdLine, signalLine, hist };
}

function atrSeries(
  highs: number[], lows: number[], closes: number[], period = 14
): (number | null)[] {
  const trs = closes.map((c, i) => {
    if (i === 0) return highs[i] - lows[i];
    return Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
  });
  const result: (number | null)[] = new Array(period - 1).fill(null);
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(atr);
  for (let i = period; i < closes.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    result.push(atr);
  }
  return result;
}

function stochasticK(
  highs: number[], lows: number[], closes: number[], period = 14
): (number | null)[] {
  return closes.map((c, i) => {
    if (i < period - 1) return null;
    const hh = Math.max(...highs.slice(i - period + 1, i + 1));
    const ll = Math.min(...lows.slice(i - period + 1, i + 1));
    return hh === ll ? 50 : ((c - ll) / (hh - ll)) * 100;
  });
}

function donchianUpper(highs: number[], period: number): (number | null)[] {
  return highs.map((_, i) =>
    i < period - 1 ? null : Math.max(...highs.slice(i - period + 1, i + 1))
  );
}
function donchianLower(lows: number[], period: number): (number | null)[] {
  return lows.map((_, i) =>
    i < period - 1 ? null : Math.min(...lows.slice(i - period + 1, i + 1))
  );
}

function supertrendSeries(
  highs: number[], lows: number[], closes: number[], period = 10, mult = 3.0
): { value: number | null; direction: number }[] {
  const atrArr = atrSeries(highs, lows, closes, period);
  const result: { value: number | null; direction: number }[] = closes.map(() => ({
    value: null,
    direction: 1,
  }));
  for (let i = period; i < closes.length; i++) {
    const atr = atrArr[i];
    if (atr === null) continue;
    const hl2 = (highs[i] + lows[i]) / 2;
    const basicUpper = hl2 + mult * atr;
    const basicLower = hl2 - mult * atr;
    if (i === period) {
      result[i] = { value: basicLower, direction: 1 };
      continue;
    }
    const prev = result[i - 1];
    const prevClose = closes[i - 1];
    const finalUpper = basicUpper < (result[i - 1].value ?? basicUpper) || prevClose > (result[i - 1].value ?? 0)
      ? basicUpper
      : result[i - 1].value ?? basicUpper;
    const finalLower = basicLower > (result[i - 1].value ?? basicLower) || prevClose < (result[i - 1].value ?? 0)
      ? basicLower
      : result[i - 1].value ?? basicLower;
    if (prev.direction === 1) {
      const d = closes[i] < finalLower ? -1 : 1;
      result[i] = { value: d === 1 ? finalLower : finalUpper, direction: d };
    } else {
      const d = closes[i] > finalUpper ? 1 : -1;
      result[i] = { value: d === 1 ? finalLower : finalUpper, direction: d };
    }
  }
  return result;
}

// ── Overlay registry ────────────────────────────────────────────────────────

type OverlayLine = {
  label: string;
  color: string;
  lineWidth?: 1 | 2 | 3 | 4;
  data: { time: string; value: number | null }[];
  paneIndex?: number; // 0 = main pane, 1 = separate pane
  lineStyle?: 0 | 1 | 2 | 3; // solid, dotted, dashed, large dashed
};

type OverlayHistogram = {
  label: string;
  color: string;
  paneIndex: 1;
  isHistogram: true;
  data: { time: string; value: number | null; color?: string }[];
};

type OverlayDef = OverlayLine | OverlayHistogram;

export interface StrategyOverlay {
  strategy: string;
  label: string;
  legend: { color: string; label: string; style?: string }[];
  overlays: OverlayDef[];
}

function buildOverlays(
  strategy: string,
  candles: CandleBar[]
): StrategyOverlay {
  const times = candles.map((c) => c.time);
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume);

  const toSeries = (vals: (number | null)[]) =>
    times.map((time, i) => ({
      time,
      value: vals[i] ?? null,
    }));

  switch (strategy) {
    case "trend_following": {
      const sma20 = smaFull(closes, 20);
      const sma50 = smaFull(closes, 50);
      const sma200 = smaFull(closes, 200);
      return {
        strategy,
        label: "SMA Trend",
        legend: [
          { color: "#22d3ee", label: "SMA-20" },
          { color: "#f59e0b", label: "SMA-50" },
          { color: "#a78bfa", label: "SMA-200" },
        ],
        overlays: [
          { label: "SMA-20",  color: "#22d3ee", lineWidth: 1, data: toSeries(sma20) },
          { label: "SMA-50",  color: "#f59e0b", lineWidth: 1, data: toSeries(sma50) },
          { label: "SMA-200", color: "#a78bfa", lineWidth: 2, data: toSeries(sma200) },
        ],
      };
    }

    case "ema_crossover": {
      const e9  = ema(closes, 9);
      const e21 = ema(closes, 21);
      const e50 = ema(closes, 50);
      return {
        strategy,
        label: "EMA Crossover",
        legend: [
          { color: "#34d399", label: "EMA-9" },
          { color: "#f59e0b", label: "EMA-21" },
          { color: "#f87171", label: "EMA-50" },
        ],
        overlays: [
          { label: "EMA-9",  color: "#34d399", lineWidth: 1, data: toSeries(e9)  },
          { label: "EMA-21", color: "#f59e0b", lineWidth: 1, data: toSeries(e21) },
          { label: "EMA-50", color: "#f87171", lineWidth: 2, data: toSeries(e50) },
        ],
      };
    }

    case "golden_death_cross": {
      const sma50  = smaFull(closes, 50);
      const sma200 = smaFull(closes, 200);
      return {
        strategy,
        label: "Golden / Death Cross",
        legend: [
          { color: "#fbbf24", label: "SMA-50" },
          { color: "#a78bfa", label: "SMA-200 (Golden/Death)" },
        ],
        overlays: [
          { label: "SMA-50",  color: "#fbbf24", lineWidth: 1, data: toSeries(sma50)  },
          { label: "SMA-200", color: "#a78bfa", lineWidth: 2, data: toSeries(sma200) },
        ],
      };
    }

    case "adx_trend":
    case "supertrend": {
      const st = supertrendSeries(highs, lows, closes);
      const bullData = times.map((time, i) => ({
        time,
        value: st[i]?.direction === 1 ? st[i].value : null,
      }));
      const bearData = times.map((time, i) => ({
        time,
        value: st[i]?.direction === -1 ? st[i].value : null,
      }));
      return {
        strategy,
        label: "Supertrend",
        legend: [
          { color: "#22c55e", label: "Supertrend (Bullish)" },
          { color: "#ef4444", label: "Supertrend (Bearish)" },
        ],
        overlays: [
          { label: "Supertrend ▲", color: "#22c55e", lineWidth: 2, data: bullData },
          { label: "Supertrend ▼", color: "#ef4444", lineWidth: 2, data: bearData },
        ],
      };
    }

    case "mean_reversion": {
      const sma20 = smaFull(closes, 20);
      const std   = stdDev(closes, 20);
      const upper = sma20.map((m, i) => m !== null && std[i] !== null ? m + 2 * std[i]! : null);
      const lower = sma20.map((m, i) => m !== null && std[i] !== null ? m - 2 * std[i]! : null);
      return {
        strategy,
        label: "Bollinger Bands + RSI",
        legend: [
          { color: "#22d3ee", label: "SMA-20 (mid)" },
          { color: "#64748b", label: "Upper BB (+2σ)", style: "dashed" },
          { color: "#64748b", label: "Lower BB (−2σ)", style: "dashed" },
        ],
        overlays: [
          { label: "SMA-20",    color: "#22d3ee", lineWidth: 1, data: toSeries(sma20)  },
          { label: "Upper BB",  color: "#6b7280", lineWidth: 1, lineStyle: 2, data: toSeries(upper) },
          { label: "Lower BB",  color: "#6b7280", lineWidth: 1, lineStyle: 2, data: toSeries(lower) },
        ],
      };
    }

    case "rsi_divergence":
    case "stochastic_oscillator":
    case "williams_r":
    case "cci": {
      const rsiVals = rsiSeries(closes, 14);
      return {
        strategy,
        label: "RSI-14",
        legend: [
          { color: "#f59e0b", label: "RSI-14" },
          { color: "#ef4444", label: "Overbought (70)", style: "dashed" },
          { color: "#22c55e", label: "Oversold (30)",   style: "dashed" },
        ],
        overlays: [
          {
            label: "RSI-14",
            color: "#f59e0b",
            lineWidth: 1,
            paneIndex: 1,
            data: toSeries(rsiVals),
          },
          {
            label: "OB",
            color: "#ef4444",
            lineWidth: 1,
            lineStyle: 2,
            paneIndex: 1,
            data: times.map((time) => ({ time, value: 70 })),
          },
          {
            label: "OS",
            color: "#22c55e",
            lineWidth: 1,
            lineStyle: 2,
            paneIndex: 1,
            data: times.map((time) => ({ time, value: 30 })),
          },
        ],
      };
    }

    case "momentum":
    case "macd_histogram":
    case "tsi":
    case "price_momentum": {
      const { macdLine, signalLine, hist } = macdSeries(closes);
      return {
        strategy,
        label: "MACD",
        legend: [
          { color: "#22d3ee", label: "MACD Line" },
          { color: "#f59e0b", label: "Signal Line" },
          { color: "#64748b", label: "Histogram" },
        ],
        overlays: [
          { label: "MACD",   color: "#22d3ee", lineWidth: 1, paneIndex: 1, data: toSeries(macdLine)   },
          { label: "Signal", color: "#f59e0b", lineWidth: 1, paneIndex: 1, data: toSeries(signalLine) },
          {
            label: "Histogram",
            color: "#64748b",
            paneIndex: 1,
            isHistogram: true,
            data: times.map((time, i) => ({
              time,
              value: hist[i] ?? null,
              color: (hist[i] ?? 0) >= 0 ? "#34d39960" : "#f8717160",
            })),
          } as OverlayHistogram,
        ],
      };
    }

    case "roc": {
      const roc10 = closes.map((c, i) =>
        i < 10 ? null : ((c - closes[i - 10]) / closes[i - 10]) * 100
      );
      const roc20 = closes.map((c, i) =>
        i < 20 ? null : ((c - closes[i - 20]) / closes[i - 20]) * 100
      );
      return {
        strategy,
        label: "Rate of Change",
        legend: [
          { color: "#22d3ee", label: "ROC-10" },
          { color: "#f59e0b", label: "ROC-20" },
        ],
        overlays: [
          { label: "ROC-10", color: "#22d3ee", lineWidth: 1, paneIndex: 1, data: toSeries(roc10) },
          { label: "ROC-20", color: "#f59e0b", lineWidth: 1, paneIndex: 1, data: toSeries(roc20) },
        ],
      };
    }

    case "bollinger_squeeze": {
      const sma20 = smaFull(closes, 20);
      const std   = stdDev(closes, 20);
      const upper = sma20.map((m, i) => m !== null && std[i] !== null ? m + 2 * std[i]! : null);
      const lower = sma20.map((m, i) => m !== null && std[i] !== null ? m - 2 * std[i]! : null);
      const atrArr = atrSeries(highs, lows, closes, 10);
      const ema20  = ema(closes, 20);
      const kcUpper = ema20.map((e, i) => atrArr[i] !== null ? e + 2 * atrArr[i]! : null);
      const kcLower = ema20.map((e, i) => atrArr[i] !== null ? e - 2 * atrArr[i]! : null);
      return {
        strategy,
        label: "Bollinger Squeeze",
        legend: [
          { color: "#64748b", label: "Bollinger Bands", style: "dashed" },
          { color: "#f59e0b", label: "Keltner Channel", style: "dashed" },
          { color: "#22d3ee", label: "SMA-20 (mid)" },
        ],
        overlays: [
          { label: "SMA-20",   color: "#22d3ee", lineWidth: 1,  data: toSeries(sma20)  },
          { label: "BB Upper", color: "#6b7280", lineWidth: 1, lineStyle: 2, data: toSeries(upper)   },
          { label: "BB Lower", color: "#6b7280", lineWidth: 1, lineStyle: 2, data: toSeries(lower)   },
          { label: "KC Upper", color: "#f59e0b", lineWidth: 1, lineStyle: 2, data: toSeries(kcUpper) },
          { label: "KC Lower", color: "#f59e0b", lineWidth: 1, lineStyle: 2, data: toSeries(kcLower) },
        ],
      };
    }

    case "atr_breakout": {
      const atrArr = atrSeries(highs, lows, closes, 14);
      const sma20  = smaFull(closes, 20);
      const upper  = sma20.map((m, i) => m !== null && atrArr[i] !== null ? m + atrArr[i]! : null);
      const lower  = sma20.map((m, i) => m !== null && atrArr[i] !== null ? m - atrArr[i]! : null);
      return {
        strategy,
        label: "ATR Breakout",
        legend: [
          { color: "#22d3ee", label: "SMA-20" },
          { color: "#f59e0b", label: "ATR Upper Channel" },
          { color: "#f87171", label: "ATR Lower Channel" },
        ],
        overlays: [
          { label: "SMA-20",  color: "#22d3ee", lineWidth: 1, data: toSeries(sma20)  },
          { label: "ATR Up",  color: "#f59e0b", lineWidth: 1, lineStyle: 2, data: toSeries(upper) },
          { label: "ATR Low", color: "#f87171", lineWidth: 1, lineStyle: 2, data: toSeries(lower) },
        ],
      };
    }

    case "donchian_breakout": {
      const dc20Upper = donchianUpper(highs, 20);
      const dc20Lower = donchianLower(lows, 20);
      const dc55Upper = donchianUpper(highs, 55);
      const dc55Lower = donchianLower(lows, 55);
      return {
        strategy,
        label: "Donchian Breakout",
        legend: [
          { color: "#22d3ee", label: "Donchian-20 Upper" },
          { color: "#22d3ee", label: "Donchian-20 Lower", style: "dashed" },
          { color: "#a78bfa", label: "Donchian-55 Upper" },
          { color: "#a78bfa", label: "Donchian-55 Lower", style: "dashed" },
        ],
        overlays: [
          { label: "DC20 Up",  color: "#22d3ee", lineWidth: 1, data: toSeries(dc20Upper) },
          { label: "DC20 Low", color: "#22d3ee", lineWidth: 1, lineStyle: 2, data: toSeries(dc20Lower) },
          { label: "DC55 Up",  color: "#a78bfa", lineWidth: 1, data: toSeries(dc55Upper) },
          { label: "DC55 Low", color: "#a78bfa", lineWidth: 1, lineStyle: 2, data: toSeries(dc55Lower) },
        ],
      };
    }

    case "52w_range":
    case "historical_volatility":
    case "volatility_ratio":
    case "support_resistance":
    case "fibonacci":
    case "elder_ray":
    case "force_index": {
      // These strategies use price-level analysis; show SMA-50 and SMA-200 as context
      const sma50  = smaFull(closes, 50);
      const sma200 = smaFull(closes, 200);
      return {
        strategy,
        label: "SMA Context",
        legend: [
          { color: "#f59e0b", label: "SMA-50" },
          { color: "#a78bfa", label: "SMA-200" },
        ],
        overlays: [
          { label: "SMA-50",  color: "#f59e0b", lineWidth: 1, data: toSeries(sma50)  },
          { label: "SMA-200", color: "#a78bfa", lineWidth: 2, data: toSeries(sma200) },
        ],
      };
    }

    default:
      return {
        strategy,
        label: "None",
        legend: [],
        overlays: [],
      };
  }
}

// ── Search result type ───────────────────────────────────────────────────────

interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: "INR" | "USD";
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  symbol: string;
  strategy?: string;
  currency?: "INR" | "USD";
  isMobile?: boolean;
}

type Status = "loading" | "ok" | "empty" | "error";

export function LightweightChart({
  symbol,
  strategy = "trend_following",
  currency = "USD",
  isMobile = false,
}: Props) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const chartRef       = useRef<IChartApi | null>(null);
  const overlayRefs    = useRef<ISeriesApi<"Line" | "Histogram">[]>([]);
  const [status, setStatus]           = useState<Status>("loading");
  const [candleCache, setCandleCache] = useState<CandleBar[]>([]);

  // Search state
  const [query, setQuery]         = useState("");
  const [suggestions, setSuggestions] = useState<SymbolResult[]>([]);
  const [dropOpen, setDropOpen]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef   = useRef<HTMLDivElement>(null);
  const router      = useRouter();

  const height = isMobile ? 350 : 500;

  // ── Search logic ────────────────────────────────────────────────────────

  const fetchSuggestions = useCallback((q: string) => {
    if (q.length < 1) { setSuggestions([]); setDropOpen(false); return; }
    fetch(`/api/symbols?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data: { results: SymbolResult[] }) => {
        setSuggestions(data.results ?? []);
        setDropOpen((data.results ?? []).length > 0);
        setActiveIdx(-1);
      })
      .catch(() => { setSuggestions([]); setDropOpen(false); });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function navigateTo(sym: string) {
    setQuery("");
    setDropOpen(false);
    router.push(`/stocks/${encodeURIComponent(sym)}`);
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        e.preventDefault();
        navigateTo(suggestions[activeIdx].symbol);
      } else if (query.trim()) {
        navigateTo(query.trim().toUpperCase());
      }
    } else if (e.key === "Escape") {
      setDropOpen(false);
    }
  }

  // ── Chart build ──────────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let mounted = true;
    setStatus("loading");

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#94a3b8",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "#1e293b",
        scaleMargins: { top: 0.08, bottom: 0.28 },
      },
      timeScale: {
        borderColor: "#1e293b",
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: (p: number) => {
          if (p >= 100_000)
            return p >= 1_000_000
              ? (p / 1_000_000).toFixed(1) + "M"
              : (p / 1_000).toFixed(0) + "K";
          return currency === "INR"
            ? "₹" + p.toLocaleString("en-IN", { maximumFractionDigits: 2 })
            : "$" + p.toLocaleString("en-US", { maximumFractionDigits: 2 });
        },
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e", downColor: "#ef4444",
      borderUpColor: "#22c55e", borderDownColor: "#ef4444",
      wickUpColor: "#22c55e", wickDownColor: "#ef4444",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });

    fetch(`/api/candles/${encodeURIComponent(symbol)}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<{ candles: CandleBar[] }>; })
      .then(({ candles }) => {
        if (!mounted) return;
        if (!candles.length) { setStatus("empty"); return; }

        candleSeries.setData(
          candles.map((c) => ({
            time: c.time as Parameters<typeof candleSeries.setData>[0][0]["time"],
            open: c.open, high: c.high, low: c.low, close: c.close,
          }))
        );
        volumeSeries.setData(
          candles.map((c) => ({
            time: c.time as Parameters<typeof volumeSeries.setData>[0][0]["time"],
            value: c.volume,
            color: c.close >= c.open ? "#bbf7d060" : "#fecaca60",
          }))
        );

        chart.timeScale().fitContent();
        setCandleCache(candles);
        setStatus("ok");
      })
      .catch(() => { if (mounted) setStatus("error"); });

    return () => {
      mounted = false;
      chart.remove();
      chartRef.current = null;
      overlayRefs.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, currency, height]);

  // ── Overlay effect: runs when strategy or candle data changes ────────────

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candleCache.length === 0) return;

    // Remove previous overlays
    for (const s of overlayRefs.current) {
      try { chart.removeSeries(s); } catch { /* already removed */ }
    }
    overlayRefs.current = [];

    const def = buildOverlays(strategy, candleCache);

    for (const overlay of def.overlays) {
      const isHistogram = "isHistogram" in overlay && overlay.isHistogram;
      if (isHistogram) {
        const hist = overlay as OverlayHistogram;
        const s = chart.addSeries(HistogramSeries, {
          color: hist.color,
          priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
          priceScaleId: "indicator",
        });
        chart.priceScale("indicator").applyOptions({
          scaleMargins: { top: 0.78, bottom: 0 },
        });
        s.setData(
          hist.data
            .filter((d) => d.value !== null)
            .map((d) => ({
              time: d.time as Parameters<typeof s.setData>[0][0]["time"],
              value: d.value!,
              color: d.color,
            }))
        );
        overlayRefs.current.push(s as unknown as ISeriesApi<"Histogram">);
      } else {
        const line = overlay as OverlayLine;
        const s = chart.addSeries(LineSeries, {
          color: line.color,
          lineWidth: line.lineWidth ?? 1,
          lineStyle: line.lineStyle ?? 0,
          crosshairMarkerVisible: false,
          lastValueVisible: true,
          priceLineVisible: false,
        });
        s.setData(
          line.data
            .filter((d) => d.value !== null)
            .map((d) => ({
              time: d.time as Parameters<typeof s.setData>[0][0]["time"],
              value: d.value!,
            }))
        );
        overlayRefs.current.push(s as unknown as ISeriesApi<"Line">);
      }
    }
  }, [strategy, candleCache]);

  // ── Legend from strategy ─────────────────────────────────────────────────

  const legendDef =
    candleCache.length > 0 ? buildOverlays(strategy, []).legend : [];
  // Build legend from strategy registry (no candle data needed for labels)
  const strategyMeta = buildOverlays(strategy, candleCache.length > 0 ? candleCache : []);

  const showOverlay = status !== "ok";
  const overlayText =
    status === "loading" ? "Loading chart…"
    : status === "empty"  ? `Chart data unavailable for ${symbol}`
    : "Chart temporarily unavailable";

  return (
    <div className="relative w-full flex flex-col" style={{ height }}>

      {/* ── Top bar: symbol label + search ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between
                      bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 px-3 py-1.5">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest select-none">
          {symbol}
        </span>

        {/* Search with autocomplete */}
        <div ref={searchRef} className="relative">
          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-md
                          focus-within:border-cyan-500/60 transition-colors">
            {/* Search icon */}
            <svg className="ml-2 h-3 w-3 text-slate-500 shrink-0" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              onFocus={() => suggestions.length > 0 && setDropOpen(true)}
              placeholder="Search symbol…"
              aria-label="Search for a stock symbol"
              aria-autocomplete="list"
              aria-expanded={dropOpen}
              className="bg-transparent text-slate-200 text-[11px] font-mono px-2 py-1 w-32 sm:w-44
                         outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Autocomplete dropdown */}
          {dropOpen && suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute right-0 top-full mt-1 w-72 rounded-lg border border-slate-700
                         bg-slate-900 shadow-2xl shadow-black/60 z-50 overflow-hidden"
            >
              {suggestions.map((r, i) => (
                <li
                  key={r.symbol}
                  role="option"
                  aria-selected={i === activeIdx}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => { e.preventDefault(); navigateTo(r.symbol); }}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer
                    text-[11px] font-mono border-b border-slate-800/60 last:border-0
                    ${i === activeIdx ? "bg-slate-800" : "hover:bg-slate-800/60"}`}
                >
                  <span className="flex flex-col min-w-0">
                    <span className="text-cyan-400 font-bold truncate">{r.symbol}</span>
                    <span className="text-slate-500 truncate text-[9px]">{r.name}</span>
                  </span>
                  <span className="ml-3 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold
                                   bg-slate-800 text-slate-400 border border-slate-700">
                    {r.exchange || (r.currency === "INR" ? "NSE" : "US")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Chart canvas ── */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* ── Strategy indicator legend ── */}
      {status === "ok" && strategyMeta.legend.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-1
                        bg-slate-900/80 backdrop-blur-sm border-t border-slate-800/60 px-3 py-1.5">
          {strategyMeta.legend.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={{
                  backgroundColor: item.color,
                  ...(item.style === "dashed"
                    ? { background: `repeating-linear-gradient(90deg,${item.color} 0,${item.color} 4px,transparent 4px,transparent 7px)` }
                    : {}),
                }}
              />
              <span className="text-[9px] font-mono text-slate-500">{item.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* ── Loading / empty / error overlay ── */}
      {showOverlay && (
        <div className={`absolute inset-0 flex items-center justify-center bg-slate-900
                         text-sm font-mono text-zinc-400 z-10
                         ${status === "loading" ? "animate-pulse" : ""}`}>
          {overlayText}
        </div>
      )}
    </div>
  );
}
