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
    <section aria-label="AI research report" className="space-y-4 animate-fade-in-up">

      {/* Section divider — bumped to text-sm */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
        <p className="text-sm font-mono font-bold uppercase tracking-widest text-slate-500 shrink-0">
          Fundamental Analysis · AI
        </p>
        <div className="h-px flex-1 bg-gradient-to-l from-slate-800 to-transparent" />
      </div>

      {/* Three horizon cards stacked */}
      <div className="space-y-3">
        <HorizonCard label="Short term"  horizon={report.horizons.short_term}  />
        <HorizonCard label="Medium term" horizon={report.horizons.medium_term} />
        <HorizonCard label="Long term"   horizon={report.horizons.long_term}   />
      </div>

      {/* AI Insight — cyan glassmorphic card */}
      <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.04] p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-cyan-500/15 border border-cyan-500/20 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          {/* Bumped from text-[9px] → text-xs */}
          <p className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-cyan-500">
            AI Insight
          </p>
        </div>
        {/* Bumped from text-[12px] → text-sm */}
        <p className="text-sm leading-relaxed text-slate-400">
          {report.summary_paragraph}
        </p>
      </div>

      <SourceList sources={report.data_sources} />
      <Disclaimer />
    </section>
  );
}
