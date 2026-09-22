"use client";

import { useEffect } from "react";

export default function StockError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[StockPage] Error boundary caught:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-800/60 bg-slate-900/60 p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 mx-auto">
          <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-100">Something went wrong</h1>
        <p className="text-sm text-slate-400">
          Could not load the stock page. This is usually a temporary issue with data providers.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-slate-600">Error: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-2 px-5 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
