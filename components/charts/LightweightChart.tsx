"use client";
// TODO(charting-library): replace with self-hosted TradingView Advanced Charts once licence approved.
// Apply at https://www.tradingview.com/advanced-charts/ — see docs/DECISIONS.md ADR-0005.

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
} from "lightweight-charts";
import type { CandleBar } from "@/lib/data/finnhub";

interface Props {
  symbol: string;
  currency?: "INR" | "USD";
  isMobile?: boolean;
}

type Status = "loading" | "ok" | "empty" | "error";

export function LightweightChart({ symbol, currency = "USD", isMobile = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const height = isMobile ? 350 : 500;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let mounted = true;
    setStatus("loading");

    // --- build chart ---
    const chart = createChart(el, {
      autoSize: true,   // fills the container's CSS dimensions automatically
      layout: {
        background: { color: "#ffffff" },
        textColor: "#52525b",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      grid: {
        vertLines: { color: "#f4f4f5" },
        horzLines: { color: "#f4f4f5" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "#e4e4e7",
        scaleMargins: { top: 0.08, bottom: 0.28 },
      },
      timeScale: {
        borderColor: "#e4e4e7",
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: (p: number) => {
          // Volume values are large integers — show as compact number without currency
          if (p >= 100_000) {
            return p >= 1_000_000
              ? (p / 1_000_000).toFixed(1) + "M"
              : (p / 1_000).toFixed(0) + "K";
          }
          return currency === "INR"
            ? "₹" + p.toLocaleString("en-IN", { maximumFractionDigits: 2 })
            : "$" + p.toLocaleString("en-US", { maximumFractionDigits: 2 });
        },
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });

    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });

    // --- fetch candles ---
    fetch(`/api/candles/${encodeURIComponent(symbol)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ candles: CandleBar[] }>;
      })
      .then(({ candles }) => {
        if (!mounted) return;
        if (!candles.length) {
          setStatus("empty");
          return;
        }

        candleSeries.setData(
          candles.map((c) => ({
            time: c.time as Parameters<typeof candleSeries.setData>[0][0]["time"],
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })),
        );

        volumeSeries.setData(
          candles.map((c) => ({
            time: c.time as Parameters<typeof volumeSeries.setData>[0][0]["time"],
            value: c.volume,
            color: c.close >= c.open ? "#bbf7d0" : "#fecaca",
          })),
        );

        chart.timeScale().fitContent();
        setStatus("ok");
      })
      .catch(() => {
        if (mounted) setStatus("error");
      });

    return () => {
      mounted = false;
      chart.remove();
      chartRef.current = null;
    };
  }, [symbol, currency, height]);

  const showOverlay = status !== "ok";
  const overlayText =
    status === "loading"
      ? "Loading chart…"
      : status === "empty"
        ? `Chart data unavailable for ${symbol}`
        : "Chart temporarily unavailable";

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Chart container — always mounted so ResizeObserver stays live */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading / empty / error overlay */}
      {showOverlay && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-white text-sm text-zinc-400 ${
            status === "loading" ? "animate-pulse" : ""
          }`}
        >
          {overlayText}
        </div>
      )}
    </div>
  );
}
