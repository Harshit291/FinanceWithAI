import type { VerdictReport } from "@/lib/ai/schema";
import { HorizonCard } from "./HorizonCard";
import { SourceList } from "./SourceList";
import { Disclaimer } from "./Disclaimer";
import { Sparkles } from "lucide-react";

interface VerdictCardProps {
  report: VerdictReport;
}

export function VerdictCard({ report }: VerdictCardProps) {
  return (
    <section aria-label="AI research report" className="space-y-3">
      {/* Three horizon panels */}
      <HorizonCard label="Short term" horizon={report.horizons.short_term} />
      <HorizonCard label="Medium term" horizon={report.horizons.medium_term} />
      <HorizonCard label="Long term" horizon={report.horizons.long_term} />

      {/* AI Insight */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
          <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500">
            AI Insight
          </p>
        </div>
        <p className="text-sm leading-relaxed text-slate-400">
          {report.summary_paragraph}
        </p>
      </div>

      <SourceList sources={report.data_sources} />
      <Disclaimer />
    </section>
  );
}
