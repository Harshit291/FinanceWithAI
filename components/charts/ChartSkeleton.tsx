import { Skeleton } from "@/components/ui/Skeleton";

export function ChartSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="flex flex-col items-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-500" />
        <span className="text-xs font-mono text-slate-600 uppercase tracking-wider">
          Loading chart…
        </span>
      </div>
    </div>
  );
}
