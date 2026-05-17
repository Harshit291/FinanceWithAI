import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { VerdictCardSkeleton } from "@/components/ai-report/VerdictCardSkeleton";
import { TechnicalPanelSkeleton } from "@/components/charts/TechnicalPanelSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChartPanel } from "./ChartPanel";
import { HeaderActions } from "./HeaderActions";
import { TechnicalSection } from "./TechnicalSection";
import { AiAnalysisSection } from "./AiAnalysisSection";

interface Props {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  return { title: symbol.toUpperCase() };
}

function exchangeLabel(symbol: string) {
  if (symbol.endsWith(".NS")) return "NSE";
  if (symbol.endsWith(".BO")) return "BSE";
  return "US";
}

function HeaderActionsSkeleton() {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <Skeleton className="h-7 w-20 rounded-md" />
      <Skeleton className="h-7 w-20 rounded-md" />
      <Skeleton className="h-7 w-16 rounded-md" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-[420px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 sm:h-[540px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-500" />
        <span className="text-xs font-mono text-slate-600 uppercase tracking-wider">
          Loading chart…
        </span>
      </div>
    </div>
  );
}

export default async function StockPage({ params }: Props) {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol).toUpperCase();
  if (!decodedSymbol || decodedSymbol.length > 20) notFound();

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isAuthenticated = !!userId;
  const exchange = exchangeLabel(decodedSymbol);

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

      {/* Editorial stock header — renders immediately */}
      <header className="mb-6 pb-5 border-b border-slate-800/60">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-600 mb-1">
              {exchange} · Equities
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono text-slate-100">
              {decodedSymbol}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs font-mono text-slate-600 uppercase tracking-wider">
              Technical + AI Research
            </p>
            <Suspense fallback={<HeaderActionsSkeleton />}>
              <HeaderActions
                symbol={decodedSymbol}
                userId={userId}
                isAuthenticated={isAuthenticated}
              />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Layout: chart (3/5) + analysis (2/5) */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

        {/* Chart + Technical Analysis */}
        <div className="w-full sm:w-[60%]">
          <Suspense fallback={<ChartSkeleton />}>
            <ChartPanel symbol={decodedSymbol} />
          </Suspense>
          <Suspense fallback={<TechnicalPanelSkeleton />}>
            <TechnicalSection symbol={decodedSymbol} />
          </Suspense>
        </div>

        {/* AI fundamental analysis */}
        <div className="w-full sm:w-[40%]">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-slate-800" />
            <p className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-slate-600 shrink-0">
              Fundamental Analysis
            </p>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          <Suspense fallback={<VerdictCardSkeleton />}>
            <AiAnalysisSection symbol={decodedSymbol} userId={userId} />
          </Suspense>
        </div>

      </div>
    </main>
  );
}
