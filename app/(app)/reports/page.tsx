import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import type { VerdictReport, Stance } from "@/lib/ai/schema";
import { ReportRowDeleteButton } from "@/components/ai-report/ReportRowDeleteButton";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocalTime } from "@/components/LocalTime";

export const metadata: Metadata = { title: "Reports" };

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

const STANCE_COLOR: Record<Stance, string> = {
  bullish: "text-emerald-400",
  bearish: "text-red-400",
  neutral: "text-amber-400",
  insufficient_data: "text-slate-600",
};

const STANCE_ABBREV: Record<Stance, string> = {
  bullish: "BULL",
  bearish: "BEAR",
  neutral: "NEUT",
  insufficient_data: "N/A",
};

export default async function ReportsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/reports");
  }

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    prisma.aiReport.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: PAGE_SIZE,
      select: { id: true, symbol: true, createdAt: true, reportJson: true },
    }),
    prisma.aiReport.count({ where: { userId: session.user.id } }),
  ]);

  const items = rows.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    createdAt: r.createdAt,
    report: JSON.parse(r.reportJson) as VerdictReport,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">
      <header className="mb-6 pb-5 border-b border-slate-800/60">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-600 mb-1">
          Reports · {total} saved · cap 200
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono text-slate-100">
          Saved Analyses
        </h1>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-10 text-center">
          <p className="text-sm font-mono text-slate-500 mb-4">No saved reports yet.</p>
          <p className="text-xs font-mono text-slate-700 mb-4">
            Reports are saved automatically when you view a stock while signed in.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/15 transition"
          >
            Browse stocks <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((item) => {
              const s = item.report.horizons.short_term;
              const m = item.report.horizons.medium_term;
              const l = item.report.horizons.long_term;
              return (
                <li
                  key={item.id}
                  className="group relative rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/stocks/${encodeURIComponent(item.symbol)}`}
                        className="inline-flex items-center gap-2 group/link"
                      >
                        <span className="text-lg font-bold font-mono tracking-tight text-slate-100 group-hover/link:text-cyan-400 transition">
                          {item.symbol}
                        </span>
                        <ArrowUpRight className="h-3 w-3 text-slate-700 group-hover/link:text-cyan-400" />
                      </Link>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        <LocalTime date={item.createdAt} />
                        {" · "}
                        {item.report.model}
                      </p>
                      <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-slate-300 max-w-3xl">
                        <Sparkles className="h-4 w-4 text-cyan-500/70 mt-0.5 shrink-0" />
                        <span>{item.report.summary_paragraph}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span title="Short term" className={cn("font-bold", STANCE_COLOR[s.stance])}>
                          S:{STANCE_ABBREV[s.stance]} {Math.round(s.confidence_pct)}%
                        </span>
                        <span title="Medium term" className={cn("font-bold", STANCE_COLOR[m.stance])}>
                          M:{STANCE_ABBREV[m.stance]} {Math.round(m.confidence_pct)}%
                        </span>
                        <span title="Long term" className={cn("font-bold", STANCE_COLOR[l.stance])}>
                          L:{STANCE_ABBREV[l.stance]} {Math.round(l.confidence_pct)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <ReportRowDeleteButton id={item.id} />
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-between text-xs font-mono text-slate-500">
              {page > 1 ? (
                <Link
                  href={`/reports?page=${page - 1}`}
                  className="rounded border border-slate-800 bg-slate-900 px-3 py-1.5 hover:text-cyan-400 hover:border-cyan-500/30 transition"
                >
                  ← Prev
                </Link>
              ) : (
                <span />
              )}
              <span>
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/reports?page=${page + 1}`}
                  className="rounded border border-slate-800 bg-slate-900 px-3 py-1.5 hover:text-cyan-400 hover:border-cyan-500/30 transition"
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
