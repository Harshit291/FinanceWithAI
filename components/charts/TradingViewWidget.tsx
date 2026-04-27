"use client";
// TODO(charting-library): swap widget for self-hosted Advanced Charts once license is approved.
// Apply at https://www.tradingview.com/advanced-charts/ — see docs/DECISIONS.md ADR-0005.

import { useEffect, useRef } from "react";
import { toTvSymbol } from "@/lib/data/tv-symbol";

interface TradingViewWidgetProps {
  symbol: string; // internal format: RELIANCE.NS, AAPL, etc.
  isMobile?: boolean;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TradingView global
    TradingView: any;
  }
}

/** Embeds the TradingView Advanced Real-Time Chart Widget (free, attribution required). */
export function TradingViewWidget({ symbol, isMobile = false }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<unknown>(null);
  const tvSymbol = toTvSymbol(symbol);

  useEffect(() => {
    // Dynamically load the TradingView widget script
    const scriptId = "tradingview-widget-script";
    const existing = document.getElementById(scriptId);

    function initWidget() {
      if (!containerRef.current || !window.TradingView) return;
      // Destroy previous widget if symbol changed
      containerRef.current.innerHTML = "";

      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "light",
        style: "1",
        locale: "en",
        // §8 mobile toolbar tweaks
        hide_side_toolbar: isMobile,
        allow_symbol_change: true,
        container_id: containerRef.current.id,
      });
    }

    if (!existing) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [tvSymbol, isMobile]);

  return (
    <div
      id="tv-widget-container"
      ref={containerRef}
      className="w-full"
      style={{ height: isMobile ? "350px" : "500px" }}
      aria-label={`TradingView chart for ${symbol}`}
    />
  );
}
