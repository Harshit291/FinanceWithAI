"use client";
// TODO(charting-library): swap TradingViewWidget for self-hosted Advanced Charts once license is approved.

import { useEffect, useState } from "react";
import { TradingViewWidget } from "@/components/charts/TradingViewWidget";

interface ChartPanelProps {
  symbol: string;
}

/** Detects viewport width to apply §8 mobile toolbar rules. */
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
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <TradingViewWidget symbol={symbol} isMobile={isMobile} />
    </div>
  );
}
