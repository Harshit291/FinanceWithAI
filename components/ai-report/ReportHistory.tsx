import type { VerdictReport, Stance } from "@/lib/ai/schema";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportHistoryProps {
  items: { id: string; createdAt: Date; report: VerdictReport }[];
  /** report_id of the verdict currently shown live; that row is hidden from history. */
  currentReportId?: string;
}

const STANCE_COLOR: Record<Stance, string> = {
  bullish: "text-emerald-400",
  bearish: "text-red-400",
  neutral: "text-amber-400",
  insufficient_data: "text-slate-600",
};

const STANCE_ABBREV: Record<Stance, string> = {
  bullish: "BULL",
  bearish: "BEAR",
  neutral: "NEUT",
  insufficient_data: "N/A",
};

function fmtDate(d: Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 16).replace("T", " ");
}

export function ReportHistory({ items, currentReportId }: ReportHistoryProps) {
  // Hide the row matching the live verdict (avoids duplication). When the live
  // verdict is a graceful-degradation (not persisted), no row matches and all
  // history entries remain visible.
  const past = currentReportId
    ? items.filter((i) => i.report.report_id !== currentReportId)
    : items.slice(1);
  if (past.length === 0) return null;

  return (
    <section aria-label="Past AI reports" className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-3 w-3 text-slate-600" />
        <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-slate-600">
          History · {past.length}
        </p>
      </div>
      <ul className="space-y-1.5">
        {past.map((item) => {
          const s = item.report.horizons.short_term;
          const m = item.report.horizons.medium_term;
          const l = item.report.horizons.long_term;
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-500 border-b border-slate-800/50 pb-1.5 last:border-b-0 last:pb-0"
            >
              <span className="text-slate-600 tabular-nums shrink-0">{fmtDate(item.createdAt)}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span title="Short term" className={cn("font-bold", STANCE_COLOR[s.stance])}>
                  S:{STANCE_ABBREV[s.stance]}
                </span>
                <span title="Medium term" className={cn("font-bold", STANCE_COLOR[m.stance])}>
                  M:{STANCE_ABBREV[m.stance]}
                </span>
                <span title="Long term" className={cn("font-bold", STANCE_COLOR[l.stance])}>
                  L:{STANCE_ABBREV[l.stance]}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
