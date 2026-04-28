/**
 * /stocks/[symbol] — the workhorse page.
 * Session 2: TradingView widget (free) + real LLM synthesis via Groq.
 *
 * Layout: stacked (< 640px) | side-by-side (≥ 640px) per §8.
 * Verified at 375×667 (iPhone SE) and 1440×900.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { synthesiseVerdict } from "@/lib/ai/llm";
import { VerdictCard } from "@/components/ai-report/VerdictCard";
import { ChartPanel } from "./ChartPanel";

interface Props {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} — FinAI` };
}

export default async function StockPage({ params }: Props) {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol).toUpperCase();

  if (!decodedSymbol || decodedSymbol.length > 20) notFound();

  const report = await synthesiseVerdict(decodedSymbol);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6 lg:px-8">
      {/* Symbol header */}
      <header className="mb-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{decodedSymbol}</h1>
          <span className="text-sm text-zinc-400">
            {decodedSymbol.endsWith(".NS")
              ? "NSE"
              : decodedSymbol.endsWith(".BO")
              ? "BSE"
              : "US"}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Technical analysis + AI fundamental research
        </p>
      </header>

      {/*
        Layout:
          mobile  (< 640px): chart stacked above AI panel
          desktop (≥ 640px): chart left, AI panel right (60/40 split)
        §8 requirement: no side-by-side on mobile.
      */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Chart */}
        <div className="w-full sm:w-3/5">
          <Suspense
            fallback={
              <div className="flex h-[350px] items-center justify-center rounded-xl bg-white text-sm text-zinc-400 sm:h-[500px]">
                Loading chart…
              </div>
            }
          >
            <ChartPanel symbol={decodedSymbol} />
          </Suspense>
        </div>

        {/* AI verdict */}
        <div className="w-full sm:w-2/5">
          <VerdictCard report={report} />
        </div>
      </div>
    </main>
  );
}
