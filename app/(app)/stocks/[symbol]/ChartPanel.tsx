"use client";
// TODO(charting-library): swap LightweightChart for self-hosted Advanced Charts once licence approved.

import { useEffect, useState } from "react";
import { LightweightChart } from "@/components/charts/LightweightChart";

interface ChartPanelProps {
  symbol: string;
}

function toCurrency(symbol: string): "INR" | "USD" {
  return symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "INR" : "USD";
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
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <LightweightChart symbol={symbol} currency={toCurrency(symbol)} isMobile={isMobile} />
    </div>
  );
}
