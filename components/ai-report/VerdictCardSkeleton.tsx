import { Skeleton } from "@/components/ui/Skeleton";

function HorizonCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <div className="absolute inset-y-0 left-0 w-0.5 bg-slate-800" />
      <div className="flex items-start justify-between pl-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded" />
      </div>
      <div className="pl-2">
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="pl-2 space-y-1.5">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-4/5" />
        <Skeleton className="h-2.5 w-3/5" />
      </div>
    </div>
  );
}

export function VerdictCardSkeleton() {
  return (
    <section aria-label="Loading AI research report" className="space-y-3">
      <HorizonCardSkeleton />
      <HorizonCardSkeleton />
      <HorizonCardSkeleton />

      {/* AI Insight block */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      </div>
    </section>
  );
}
