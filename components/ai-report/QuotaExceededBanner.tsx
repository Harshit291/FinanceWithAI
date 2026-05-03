import Link from "next/link";
import { ShieldAlert, History } from "lucide-react";

interface QuotaExceededBannerProps {
  used: number;
  limit: number;
  resetsAt: Date;
}

function fmtRelative(target: Date): string {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return "any moment";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours <= 0) return `${mins} min`;
  return `${hours}h ${mins}m`;
}

export function QuotaExceededBanner({ used, limit, resetsAt }: QuotaExceededBannerProps) {
  return (
    <section
      aria-label="Daily AI report quota exceeded"
      className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5"
    >
      <div className="flex items-start gap-3 mb-3">
        <ShieldAlert className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-amber-400 mb-1">
            Daily quota reached
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            You&apos;ve used{" "}
            <span className="font-mono font-bold tabular-nums text-amber-400">
              {used}/{limit}
            </span>{" "}
            AI reports in the last 24 hours. New analyses pause until the rolling window opens up.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-7 mb-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Next slot in
        </span>
        <span className="text-xs font-mono font-bold tabular-nums text-slate-300">
          ~{fmtRelative(resetsAt)}
        </span>
      </div>

      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition ml-7"
      >
        <History className="h-3 w-3" />
        View saved reports
      </Link>
    </section>
  );
}
