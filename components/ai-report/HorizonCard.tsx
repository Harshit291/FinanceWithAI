import { TrendingDown, TrendingUp, Minus, HelpCircle } from "lucide-react";
import type { Horizon, Stance } from "@/lib/ai/schema";
import { ConfidenceBar } from "./ConfidenceBar";
import { cn } from "@/lib/utils";

interface HorizonCardProps {
  label: string;
  horizon: Horizon;
  window?: string;
}

const STANCE_ICON: Record<Stance, React.ReactNode> = {
  bullish: <TrendingUp className="h-3 w-3" />,
  bearish: <TrendingDown className="h-3 w-3" />,
  neutral: <Minus className="h-3 w-3" />,
  insufficient_data: <HelpCircle className="h-3 w-3" />,
};

const STANCE_LABEL: Record<Stance, string> = {
  bullish: "BULLISH",
  bearish: "BEARISH",
  neutral: "NEUTRAL",
  insufficient_data: "N/A",
};

const STANCE_COLOR: Record<Stance, { badge: string; value: string; bar: string }> = {
  bullish: {
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    value: "text-emerald-400",
    bar: "from-emerald-500/20 to-transparent",
  },
  bearish: {
    badge: "text-red-400 bg-red-500/10 border-red-500/20",
    value: "text-red-400",
    bar: "from-red-500/20 to-transparent",
  },
  neutral: {
    badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    value: "text-amber-400",
    bar: "from-amber-500/20 to-transparent",
  },
  insufficient_data: {
    badge: "text-slate-500 bg-slate-800 border-slate-700",
    value: "text-slate-600",
    bar: "from-slate-800 to-transparent",
  },
};

export function HorizonCard({ label, horizon }: HorizonCardProps) {
  const c = STANCE_COLOR[horizon.stance];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4",
        horizon.stance === "insufficient_data" && "opacity-60"
      )}
    >
      {/* Subtle left-edge accent */}
      <div className={cn("absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b", c.bar)} />

      {/* Top row: label + stance */}
      <div className="flex items-center justify-between mb-3 pl-2">
        <div>
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="text-[10px] font-mono text-slate-700 mt-0.5">{horizon.window}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-mono font-bold",
            c.badge
          )}
        >
          {STANCE_ICON[horizon.stance]}
          {STANCE_LABEL[horizon.stance]}
        </span>
      </div>

      {/* Return range — the hero number */}
      <div className="pl-2 mb-3">
        {horizon.expected_return_pct_range ? (
          <p className={cn("text-2xl font-bold font-mono tabular-nums leading-none", c.value)}>
            {horizon.expected_return_pct_range[0] > 0 ? "+" : ""}
            {horizon.expected_return_pct_range[0]}
            <span className="text-slate-600 mx-1 text-lg">→</span>
            {horizon.expected_return_pct_range[1] > 0 ? "+" : ""}
            {horizon.expected_return_pct_range[1]}%
          </p>
        ) : (
          <p className="text-sm font-mono text-slate-600">— unavailable —</p>
        )}
      </div>

      <ConfidenceBar value={horizon.confidence_pct} />

      {/* Drivers */}
      {horizon.key_drivers.length > 0 && (
        <div className="mt-3 pl-2">
          <p className="mb-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-emerald-600/70">
            Catalysts
          </p>
          <ul className="space-y-1">
            {horizon.key_drivers.slice(0, 3).map((d, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                <span className="mt-px text-emerald-500/50 shrink-0 font-mono">+</span>
                <span className="leading-snug">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {horizon.key_risks.length > 0 && (
        <div className="mt-3 pl-2">
          <p className="mb-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-red-600/70">
            Risks
          </p>
          <ul className="space-y-1">
            {horizon.key_risks.slice(0, 2).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                <span className="mt-px text-red-500/50 shrink-0 font-mono">−</span>
                <span className="leading-snug">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
