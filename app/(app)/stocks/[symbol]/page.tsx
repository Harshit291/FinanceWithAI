import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { VerdictCardSkeleton } from "@/components/ai-report/VerdictCardSkeleton";
import { TechnicalPanelSkeleton } from "@/components/charts/TechnicalPanelSkeleton";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { MarketSearch } from "@/components/ui/MarketSearch";
import { ChartPanel } from "./ChartPanel";
import { HeaderActions } from "./HeaderActions";
import { TechnicalSection } from "./TechnicalSection";
import { AiAnalysisSection } from "./AiAnalysisSection";
import { CompanyProfileSection } from "./CompanyProfileSection";

interface Props {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ strategy?: string }>;
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

export default async function StockPage({ params, searchParams }: Props) {
  const { symbol } = await params;
  const { strategy = "trend_following" } = await searchParams;
  const decodedSymbol = decodeURIComponent(symbol).toUpperCase();
  if (!decodedSymbol || decodedSymbol.length > 20) notFound();

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isAuthenticated = !!userId;
  const exchange = exchangeLabel(decodedSymbol);

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

      {/* Clean editorial header */}
      <header className="mb-5 pb-5 border-b border-slate-800/40">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Left: symbol identity */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest bg-slate-800 text-slate-400 border border-slate-700">
                {exchange} · Equities
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-mono text-white">
              {decodedSymbol}
            </h1>
            <p className="mt-1.5 text-sm font-mono text-slate-500">
              Technical + AI Fundamental Research
            </p>
          </div>

          {/* Right: actions + inline search */}
          <div className="flex flex-col items-end gap-3">
            <Suspense fallback={<HeaderActionsSkeleton />}>
              <HeaderActions symbol={decodedSymbol} userId={userId} isAuthenticated={isAuthenticated} />
            </Suspense>
            <div className="w-64">
              <Suspense fallback={<div className="h-24 rounded-xl bg-slate-900/60 animate-pulse" />}>
                <MarketSearch
                  size="compact"
                  defaultMarket={exchange === "NSE" || exchange === "BSE" ? "IN" : "US"}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </header>

      {/* Full-width chart */}
      <div className="mb-5 rounded-2xl overflow-hidden border border-slate-800/60">
        <Suspense fallback={<ChartSkeleton />}>
          <ChartPanel symbol={decodedSymbol} strategy={strategy} />
        </Suspense>
      </div>

      {/* Two-column content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5">

        {/* Left: Technical Analysis + Company Profile */}
        <div className="flex flex-col">
          <Suspense fallback={<TechnicalPanelSkeleton />}>
            <TechnicalSection symbol={decodedSymbol} strategy={strategy} />
          </Suspense>
          
          <Suspense fallback={<div className="mt-8 h-64 rounded-2xl bg-slate-900/60 animate-pulse" />}>
            <CompanyProfileSection symbol={decodedSymbol} />
          </Suspense>
        </div>

        {/* Right: AI Fundamental Analysis */}
        <div>
          <Suspense fallback={<VerdictCardSkeleton />}>
            <AiAnalysisSection symbol={decodedSymbol} userId={userId} />
          </Suspense>
        </div>

      </div>
    </main>
  );
}
