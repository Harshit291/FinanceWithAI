import type { VerdictReport } from "@/lib/ai/schema";
import { HorizonCard } from "./HorizonCard";
import { SourceList } from "./SourceList";
import { Disclaimer } from "./Disclaimer";

interface VerdictCardProps {
  report: VerdictReport;
  isMock?: boolean;
}

/** Top-level AI verdict panel. Renders the full §6 structured report. */
export function VerdictCard({ report, isMock = false }: VerdictCardProps) {
  return (
    <section aria-label="AI research report" className="space-y-4">
      {isMock && (
        <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-center text-xs text-zinc-500">
          Sample report — LLM integration ships in session 2
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HorizonCard label="Short term" horizon={report.horizons.short_term} />
        <HorizonCard label="Medium term" horizon={report.horizons.medium_term} />
        <HorizonCard label="Long term" horizon={report.horizons.long_term} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-700">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Summary
        </p>
        {report.summary_paragraph}
      </div>

      <SourceList sources={report.data_sources} />
      <Disclaimer />
    </section>
  );
}
