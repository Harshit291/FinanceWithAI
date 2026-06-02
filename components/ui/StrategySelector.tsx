"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useTransition } from "react";
import Image from "next/image";

// ── Strategy registry ────────────────────────────────────────────────────────
const STRATEGY_GROUPS = [
  {
    label: "Trend Following",
    strategies: [
      { id: "trend_following",    label: "SMA Trend (20/50/200 + MACD)" },
      { id: "ema_crossover",      label: "EMA Crossover (9/21/50)" },
      { id: "golden_death_cross", label: "Golden / Death Cross (50/200)" },
      { id: "adx_trend",          label: "ADX Trend Strength" },
      { id: "supertrend",         label: "Supertrend (ATR-based)" },
    ],
  },
  {
    label: "Mean Reversion",
    strategies: [
      { id: "mean_reversion",         label: "RSI + Bollinger Bands" },
      { id: "rsi_divergence",         label: "RSI Divergence" },
      { id: "stochastic_oscillator",  label: "Stochastic Oscillator (%K/%D)" },
      { id: "williams_r",             label: "Williams %R" },
      { id: "cci",                    label: "Commodity Channel Index (CCI-20)" },
    ],
  },
  {
    label: "Momentum",
    strategies: [
      { id: "momentum",        label: "Volume + 52W Breakout + MACD" },
      { id: "roc",             label: "Rate of Change (10/20/60d)" },
      { id: "price_momentum",  label: "Price Momentum (1/3/6/12M)" },
      { id: "macd_histogram",  label: "MACD Histogram Slope" },
      { id: "tsi",             label: "True Strength Index (25,13)" },
    ],
  },
  {
    label: "Volatility",
    strategies: [
      { id: "bollinger_squeeze",     label: "Bollinger Squeeze (BB vs KC)" },
      { id: "atr_breakout",         label: "ATR Breakout Channel" },
      { id: "historical_volatility", label: "Historical Volatility (HV-20/60/252)" },
      { id: "donchian_breakout",    label: "Donchian Channel Breakout (20/55)" },
      { id: "volatility_ratio",     label: "Volatility Ratio (HV-5/HV-20)" },
    ],
  },
  {
    label: "Value / Cycle",
    strategies: [
      { id: "52w_range",           label: "52-Week Range Position" },
      { id: "support_resistance",  label: "Pivot Points (S1/R1/S2/R2)" },
      { id: "fibonacci",           label: "Fibonacci Retracement (38.2/50/61.8%)" },
      { id: "elder_ray",           label: "Elder Ray (Bull/Bear Power)" },
      { id: "force_index",         label: "Force Index (FI-2 / FI-13)" },
    ],
  },
] as const;

// Derive the union type from all strategy IDs
type StrategyId = (typeof STRATEGY_GROUPS)[number]["strategies"][number]["id"];

// Helper: get the display label for any strategy ID
function getStrategyLabel(id: string): string {
  for (const group of STRATEGY_GROUPS) {
    for (const s of group.strategies) {
      if (s.id === id) return s.label;
    }
  }
  return id;
}

interface Props {
  /** Server-rendered current strategy, avoids flicker on first paint. */
  currentStrategy?: string;
}

export function StrategySelector({ currentStrategy = "trend_following" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Prefer live client value; fall back to server-provided prop
  const active = searchParams.get("strategy") ?? currentStrategy;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("strategy", e.target.value);
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px flex-1 bg-slate-800" />
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 shrink-0">
          Analysis Strategy
        </p>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="relative">
        {/* Gradient accent left border */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-cyan-500/60 via-cyan-500/20 to-transparent" />

        <select
          id="strategy-selector"
          value={active}
          onChange={handleChange}
          className="
            w-full pl-4 pr-8 py-2.5
            bg-slate-900 border border-slate-700/80
            rounded-lg
            text-sm font-mono text-slate-200
            appearance-none cursor-pointer
            focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20
            transition-colors duration-150
          "
        >
          {STRATEGY_GROUPS.map((group) => (
            <optgroup
              key={group.label}
              label={`── ${group.label} ──`}
              className="text-slate-500 font-mono"
            >
              {group.strategies.map((s) => (
                <option key={s.id} value={s.id} className="text-slate-200 bg-slate-900">
                  {s.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Custom chevron icon */}
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-500"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Active strategy pill */}
      <p className="mt-1.5 pl-4 text-xs font-mono text-slate-500">
        Active:{" "}
        <span className="text-cyan-400">{getStrategyLabel(active)}</span>
      </p>

      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-32 h-32 mb-6 animate-pulse">
            <Image
              src="/bull_loader.png"
              alt="Loading..."
              fill
              className="object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]"
            />
          </div>
          <div className="flex flex-col items-center space-y-2">
            <h3 className="text-xl font-bold font-mono text-slate-100 tracking-widest uppercase">
              Analyzing
            </h3>
            <p className="text-sm font-mono text-cyan-400 animate-pulse tracking-widest">
              Re-evaluating technical strategy...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
