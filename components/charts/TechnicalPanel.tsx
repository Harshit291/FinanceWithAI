import type { TechnicalVerdict, TechnicalSignal, Action } from "@/lib/ai/schema";
import { ConfidenceBar } from "@/components/ai-report/ConfidenceBar";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, HelpCircle, ShieldAlert } from "lucide-react";

interface TechnicalPanelProps {
  verdict: TechnicalVerdict;
}

const ACTION_CONFIG: Record<
  Action,
  { label: string; badge: string; value: string; bar: string; icon: React.ReactNode }
> = {
  buy: {
    label: "BUY",
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    value: "text-emerald-400",
    bar: "from-emerald-500/20 to-transparent",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
  },
  hold: {
    label: "HOLD",
    badge: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    value: "text-amber-400",
    bar: "from-amber-500/20 to-transparent",
    icon: <Minus className="h-3.5 w-3.5" />,
  },
  sell: {
    label: "SELL",
    badge: "text-red-400 bg-red-500/10 border-red-500/30",
    value: "text-red-400",
    bar: "from-red-500/20 to-transparent",
    icon: <TrendingDown className="h-3.5 w-3.5" />,
  },
  insufficient_data: {
    label: "N/A",
    badge: "text-slate-500 bg-slate-800 border-slate-700",
    value: "text-slate-600",
    bar: "from-slate-800 to-transparent",
    icon: <HelpCircle className="h-3.5 w-3.5" />,
  },
};

function SignalCard({
  label,
  window,
  signal,
}: {
  label: string;
  window: string;
  signal: TechnicalSignal;
}) {
  const c = ACTION_CONFIG[signal.action];
  const isInsufficient = signal.action === "insufficient_data";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex-1",
        isInsufficient && "opacity-60"
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b", c.bar)} />

      <div className="flex items-start justify-between mb-3 pl-2">
        <div>
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="text-[10px] font-mono text-slate-700 mt-0.5">{window}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-mono font-bold shrink-0",
            c.badge
          )}
        >
          {c.icon}
          {c.label}
        </span>
      </div>

      <div className="pl-2 mb-3">
        <ConfidenceBar value={signal.confidence_pct} />
      </div>

      {signal.rationale && (
        <p className="pl-2 mb-3 text-[11px] leading-snug text-slate-500">{signal.rationale}</p>
      )}

      {signal.indicators.length > 0 && (
        <ul className="pl-2 space-y-1">
          {signal.indicators.slice(0, 4).map((ind, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[10px] text-slate-600">
              <span className={cn("mt-px shrink-0 font-mono", c.value)}>·</span>
              <span className="leading-snug font-mono">{ind}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TechnicalPanel({ verdict }: TechnicalPanelProps) {
  const hasLevels =
    verdict.key_levels.support !== null || verdict.key_levels.resistance !== null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-800" />
        <p className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-slate-600 shrink-0">
          Technical Analysis · AI
        </p>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SignalCard label="Short term" window="1–4 weeks" signal={verdict.short_term} />
        <SignalCard label="Long term" window="1+ year" signal={verdict.long_term} />
      </div>

      {hasLevels && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 flex items-center gap-6">
          <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-slate-600 shrink-0">
            Key Levels
          </p>
          {verdict.key_levels.support !== null && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-600">
                Support
              </span>
              <span className="text-sm font-mono font-bold tabular-nums text-emerald-400">
                {verdict.key_levels.support}
              </span>
            </div>
          )}
          {verdict.key_levels.resistance !== null && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-600">
                Resistance
              </span>
              <span className="text-sm font-mono font-bold tabular-nums text-red-400">
                {verdict.key_levels.resistance}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2">
        <ShieldAlert className="h-3 w-3 text-amber-500/70 mt-0.5 shrink-0" />
        <p className="text-[9px] font-mono text-amber-500/70 leading-relaxed">
          Technical signals are based on price history only. Not investment advice.
        </p>
      </div>
    </div>
  );
}
