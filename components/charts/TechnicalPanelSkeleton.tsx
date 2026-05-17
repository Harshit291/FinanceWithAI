import { Skeleton } from "@/components/ui/Skeleton";

function SignalCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex-1 space-y-3">
      <div className="absolute inset-y-0 left-0 w-0.5 bg-slate-800" />
      <div className="flex items-start justify-between pl-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2 w-14" />
        </div>
        <Skeleton className="h-5 w-14 rounded" />
      </div>
      <div className="pl-2">
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className="pl-2 space-y-1.5">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-3/4" />
      </div>
      <div className="pl-2 space-y-1">
        <Skeleton className="h-2 w-5/6" />
        <Skeleton className="h-2 w-4/6" />
        <Skeleton className="h-2 w-3/6" />
      </div>
    </div>
  );
}

export function TechnicalPanelSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-800" />
        <Skeleton className="h-2.5 w-36" />
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SignalCardSkeleton />
        <SignalCardSkeleton />
      </div>

      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}
