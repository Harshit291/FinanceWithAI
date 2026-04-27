import Link from "next/link";

/** Marketing / landing page. The real work is at /stocks/[symbol]. */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">FinAI</h1>
      <p className="mt-4 max-w-md text-lg text-zinc-500">
        Professional charting + AI fundamental research for Indian and US equities.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/stocks/RELIANCE.NS"
          className="inline-flex h-11 min-w-44 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Try RELIANCE.NS (NSE)
        </Link>
        <Link
          href="/stocks/AAPL"
          className="inline-flex h-11 min-w-44 items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
        >
          Try AAPL (NASDAQ)
        </Link>
      </div>
      <p className="mt-6 text-xs text-zinc-400">
        Not investment advice. Educational research only. Consult a SEBI/SEC-registered advisor.
      </p>
    </main>
  );
}
