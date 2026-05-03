import { cn } from "@/lib/utils";

interface QuotaMeterProps {
  used: number;
  limit: number;
}

export function QuotaMeter({ used, limit }: QuotaMeterProps) {
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const tone =
    pct >= 95
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : pct >= 80
        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
        : "border-slate-800 bg-slate-900/60 text-slate-500";

  return (
    <span
      title={`${used} of ${limit} AI reports used in the last 24h. Resets continuously.`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider tabular-nums",
        tone,
      )}
    >
      <span>{used}</span>
      <span className="opacity-50">/</span>
      <span>{limit} today</span>
    </span>
  );
}
