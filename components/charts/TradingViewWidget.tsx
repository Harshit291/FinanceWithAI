"use client";
// TODO(charting-library): swap widget for self-hosted Advanced Charts once license is approved.
// Apply at https://www.tradingview.com/advanced-charts/ — see docs/DECISIONS.md ADR-0005.

import { useEffect, useRef, useState } from "react";
import { toTvSymbol } from "@/lib/data/tv-symbol";
import { ChartSkeleton } from "./ChartSkeleton";

interface TradingViewWidgetProps {
  symbol: string; // internal format: RELIANCE.NS, AAPL, etc.
  isMobile?: boolean;
  onSymbolChange?: (newSymbol: string) => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TradingView global
    TradingView: any;
  }
}

/** Embeds the TradingView Advanced Real-Time Chart Widget (free, attribution required). */
export function TradingViewWidget({ symbol, isMobile = false, onSymbolChange }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const tvSymbol = toTvSymbol(symbol);

  // Stable refs so closures never capture stale values.
  const onSymbolChangeRef = useRef(onSymbolChange);
  useEffect(() => { onSymbolChangeRef.current = onSymbolChange; }, [onSymbolChange]);
  const currentSymbolRef = useRef(symbol.toUpperCase());
  useEffect(() => { currentSymbolRef.current = symbol.toUpperCase(); }, [symbol]);
  // Prevent firing router.push multiple times before the new symbol prop arrives.
  const navigatingRef = useRef(false);
  useEffect(() => { navigatingRef.current = false; }, [symbol]);

  // Listen for quoteUpdate postMessages from the TradingView iframe.
  // The free tv.js widget does NOT expose onChartReady / chart() — those are
  // Charting Library APIs. All communication goes through window.postMessage.
  // When the user picks a new symbol, TradingView fires quoteUpdate with the
  // new short_name + exchange before the price ticks start.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      try {
        const msg = (typeof event.data === "string" ? JSON.parse(event.data) : event.data) as {
          name?: string;
          data?: { short_name?: string; exchange?: string };
        };
        if (msg?.name !== "quoteUpdate" || !msg.data?.short_name) return;

        const { short_name, exchange } = msg.data;
        let incoming = short_name!.toUpperCase();
        if (exchange === "NSE") incoming += ".NS";
        else if (exchange === "BSE") incoming += ".BO";

        if (incoming !== currentSymbolRef.current && !navigatingRef.current) {
          navigatingRef.current = true;
          onSymbolChangeRef.current?.(incoming);
        }
      } catch { /* malformed message — ignore */ }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []); // intentionally empty — uses refs for current values

  useEffect(() => {
    setIsLoaded(false);
    // Dynamically load the TradingView widget script
    const scriptId = "tradingview-widget-script";
    const existing = document.getElementById(scriptId);

    function initWidget() {
      if (!containerRef.current || !window.TradingView) return;
      containerRef.current.innerHTML = "";
      new window.TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        hide_side_toolbar: isMobile,
        allow_symbol_change: true,
        container_id: containerRef.current.id,
      });
      setIsLoaded(true);
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
    <div className="relative w-full" style={{ height: isMobile ? "350px" : "500px" }}>
      {!isLoaded && (
        <div className="absolute inset-0 z-10">
          <ChartSkeleton />
        </div>
      )}
      <div
        id="tv-widget-container"
        ref={containerRef}
        className="w-full h-full"
        aria-label={`TradingView chart for ${symbol}`}
      />
    </div>
  );
}
