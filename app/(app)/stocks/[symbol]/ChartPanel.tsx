"use client";
// TODO(charting-library): swap widget for self-hosted Advanced Charts once licence approved.
// Apply at https://www.tradingview.com/advanced-charts/ — see docs/DECISIONS.md ADR-0005.

import { useEffect, useState } from "react";
import { TradingViewWidget } from "@/components/charts/TradingViewWidget";

interface ChartPanelProps {
  symbol: string;
}

export function ChartPanel({ symbol }: ChartPanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <TradingViewWidget symbol={symbol} isMobile={isMobile} />
    </div>
  );
}
