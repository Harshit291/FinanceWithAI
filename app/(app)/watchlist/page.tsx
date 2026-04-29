import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { WatchlistRemoveButton } from "@/components/watchlist/WatchlistRemoveButton";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = { title: "Watchlist" };

export default async function WatchlistPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/watchlist");
  }

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: "desc" },
    select: { symbol: true, exchange: true, addedAt: true },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">
      <header className="mb-6 pb-5 border-b border-slate-800/60">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-600 mb-1">
          Saved · {items.length}/50
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono text-slate-100">
          Watchlist
        </h1>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-10 text-center">
          <p className="text-sm font-mono text-slate-500 mb-4">No saved symbols yet.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/15 transition"
          >
            Browse stocks <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.symbol}
              className="group relative rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition"
            >
              <Link href={`/stocks/${encodeURIComponent(item.symbol)}`} className="block">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-600 mb-1">
                  {item.exchange} · Equities
                </p>
                <p className="text-xl font-bold font-mono tracking-tight text-slate-100 mb-3">
                  {item.symbol}
                </p>
                <p className="text-[10px] font-mono text-slate-700">
                  Added {new Date(item.addedAt).toISOString().slice(0, 10)}
                </p>
              </Link>
              <WatchlistRemoveButton symbol={item.symbol} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
