import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { synthesiseVerdict } from "@/lib/ai/llm";
import { synthesiseTechnical } from "@/lib/ai/technical";
import { persistAiReport } from "@/lib/reports/persist";
import { VerdictCard } from "@/components/ai-report/VerdictCard";
import { ReportHistory } from "@/components/ai-report/ReportHistory";
import { RefreshButton } from "@/components/ai-report/RefreshButton";
import { TechnicalPanel } from "@/components/charts/TechnicalPanel";
import { WatchlistToggle } from "@/components/watchlist/WatchlistToggle";
import { ChartPanel } from "./ChartPanel";

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

export default async function StockPage({ params }: Props) {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol).toUpperCase();
  if (!decodedSymbol || decodedSymbol.length > 20) notFound();

  const session = await auth();
  const [report, technical, savedItem] = await Promise.all([
    synthesiseVerdict(decodedSymbol),
    synthesiseTechnical(decodedSymbol).catch(() => null),
    session?.user?.id
      ? prisma.watchlistItem.findUnique({
          where: { userId_symbol: { userId: session.user.id, symbol: decodedSymbol } },
          select: { symbol: true },
        })
      : Promise.resolve(null),
  ]);
  const exchange = exchangeLabel(decodedSymbol);
  const isAuthenticated = !!session?.user?.id;
  const isSaved = !!savedItem;

  // Auto-persist for authenticated users (idempotent on report_id within cache window).
  let history: Array<{ id: string; createdAt: Date; report: import("@/lib/ai/schema").VerdictReport }> = [];
  if (session?.user?.id) {
    await persistAiReport(session.user.id, decodedSymbol, report).catch(() => {});
    const rows = await prisma.aiReport.findMany({
      where: { userId: session.user.id, symbol: decodedSymbol },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, createdAt: true, reportJson: true },
    });
    history = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      report: JSON.parse(r.reportJson) as import("@/lib/ai/schema").VerdictReport,
    }));
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

      {/* Editorial stock header */}
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
            <div className="flex items-center gap-2">
              <RefreshButton symbol={decodedSymbol} isAuthenticated={isAuthenticated} />
              <WatchlistToggle
                symbol={decodedSymbol}
                initialIsSaved={isSaved}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Layout: chart (3/5) + analysis (2/5) */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

        {/* Chart + Technical Analysis */}
        <div className="w-full sm:w-[60%]">
          <Suspense
            fallback={
              <div className="flex h-[420px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-xs font-mono text-slate-600 sm:h-[540px]">
                Loading chart…
              </div>
            }
          >
            <ChartPanel symbol={decodedSymbol} />
          </Suspense>
          {technical && <TechnicalPanel verdict={technical} />}
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
          <VerdictCard report={report} />
          {history.length > 0 && (
            <ReportHistory items={history} currentReportId={report.report_id} />
          )}
        </div>

      </div>
    </main>
  );
}
