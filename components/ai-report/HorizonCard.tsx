import { TrendingDown, TrendingUp, Minus, HelpCircle } from "lucide-react";
import type { Horizon, Stance } from "@/lib/ai/schema";
import { ConfidenceBar } from "./ConfidenceBar";
import { cn } from "@/lib/utils";

const STANCE_CONFIG: Record<
  Stance,
  {
    icon: React.ReactNode;
    label: string;
    badge: string;
    value: string;
    border: string;
    gradientFrom: string;
  }
> = {
  bullish: {
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    label: "BULLISH",
    badge: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    value: "text-emerald-400",
    border: "border-l-emerald-500/50",
    gradientFrom: "from-emerald-500/[0.04]",
  },
  bearish: {
    icon: <TrendingDown className="h-3.5 w-3.5" />,
    label: "BEARISH",
    badge: "text-red-300 bg-red-500/15 border-red-500/30",
    value: "text-red-400",
    border: "border-l-red-500/50",
    gradientFrom: "from-red-500/[0.04]",
  },
  neutral: {
    icon: <Minus className="h-3.5 w-3.5" />,
    label: "NEUTRAL",
    badge: "text-amber-300 bg-amber-500/15 border-amber-500/30",
    value: "text-amber-400",
    border: "border-l-amber-500/50",
    gradientFrom: "from-amber-500/[0.04]",
  },
  insufficient_data: {
    icon: <HelpCircle className="h-3.5 w-3.5" />,
    label: "N/A",
    badge: "text-slate-500 bg-slate-800 border-slate-700",
    value: "text-slate-600",
    border: "border-l-slate-700",
    gradientFrom: "from-slate-800/30",
  },
};

interface HorizonCardProps {
  label: string;
  horizon: Horizon;
  window?: string;
}

export function HorizonCard({ label, horizon }: HorizonCardProps) {
  const c = STANCE_CONFIG[horizon.stance];
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-slate-800/60 border-l-2 p-4 overflow-hidden",
        "bg-gradient-to-b to-transparent transition-all duration-200 hover:border-slate-700/60",
        c.border,
        c.gradientFrom,
        horizon.stance === "insufficient_data" && "opacity-50"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          {/* Bumped from text-[9px] → text-xs */}
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-slate-400">
            {label}
          </p>
          <p className="text-xs font-mono text-slate-600 mt-0.5">{horizon.window}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold shrink-0",
            c.badge
          )}
        >
          {c.icon}
          {c.label}
        </span>
      </div>

      {/* Expected return — hero number */}
      {horizon.expected_return_pct_range ? (
        <p className={cn("text-2xl font-bold font-mono tabular-nums leading-none mb-3", c.value)}>
          {horizon.expected_return_pct_range[0] > 0 ? "+" : ""}
          {horizon.expected_return_pct_range[0]}
          <span className="text-slate-700 mx-1 text-lg">→</span>
          {horizon.expected_return_pct_range[1] > 0 ? "+" : ""}
          {horizon.expected_return_pct_range[1]}%
        </p>
      ) : (
        <p className="text-sm font-mono text-slate-600 mb-3">— unavailable —</p>
      )}

      <ConfidenceBar value={horizon.confidence_pct} />

      {/* Catalysts — bumped from text-[10px] → text-sm */}
      {horizon.key_drivers.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {horizon.key_drivers.slice(0, 2).map((d, i) => (
            <li key={i} className="flex gap-1.5 text-sm text-slate-500 leading-snug">
              <span className="text-emerald-500/60 shrink-0 font-mono mt-px">+</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Risks */}
      {horizon.key_risks.length > 0 && (
        <ul className="mt-2 space-y-1">
          {horizon.key_risks.slice(0, 1).map((r, i) => (
            <li key={i} className="flex gap-1.5 text-sm text-slate-500 leading-snug">
              <span className="text-red-500/60 shrink-0 font-mono mt-px">−</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
