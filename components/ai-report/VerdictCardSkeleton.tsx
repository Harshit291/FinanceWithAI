import { Loader2, Info } from "lucide-react";
import { SupportUsModal } from "./SupportUsModal";

export function VerdictCardSkeleton() {
  return (
    <section aria-label="Loading AI research report" className="space-y-6 animate-fade-in-up">
      {/* Transparency Message */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500/20 shrink-0">
            <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Generating AI Analysis...
            </h3>
            <p className="text-sm leading-relaxed text-slate-300 mb-4">
              We are running these heavy AI pipelines entirely for free to provide you with better service, so it can be slow at times (especially if the servers are waking up). Thank you for your patience!
            </p>
            <div className="flex items-center gap-3">
              <SupportUsModal />
            </div>
          </div>
        </div>
      </div>

      {/* AdSense Placeholder */}
      <div className="w-full h-64 rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden flex flex-col items-center justify-center text-slate-600">
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-50">
          <Info className="h-3 w-3" />
          <span className="text-[10px] font-mono uppercase tracking-widest">Sponsored</span>
        </div>
        <p className="text-sm font-mono">Google AdSense Placeholder</p>
        <p className="text-xs text-slate-700 mt-2">Displaying while AI finishes thinking...</p>
      </div>
      
    </section>
  );
}
