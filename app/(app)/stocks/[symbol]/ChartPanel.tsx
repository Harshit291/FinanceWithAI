"use client";
// TODO(charting-library): swap widget for self-hosted Advanced Charts once licence approved.
// Apply at https://www.tradingview.com/advanced-charts/ — see docs/DECISIONS.md ADR-0005.

import { useEffect, useState } from "react";
import { LightweightChart } from "@/components/charts/LightweightChart";

interface ChartPanelProps {
  symbol: string;
  strategy?: string;
}

export function ChartPanel({ symbol, strategy = "trend_following" }: ChartPanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isIndianStock = symbol.toUpperCase().endsWith(".NS") || symbol.toUpperCase().endsWith(".BO");

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <LightweightChart
        symbol={symbol}
        strategy={strategy}
        isMobile={isMobile}
        currency={isIndianStock ? "INR" : "USD"}
      />
    </div>
  );
}
