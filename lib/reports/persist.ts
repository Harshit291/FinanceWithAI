import { prisma } from "@/lib/prisma";
import type { VerdictReport } from "@/lib/ai/schema";

const MAX_REPORTS_PER_USER = 200;

/** Persist a synthesised verdict for an authenticated user.
 *  De-duplicates: if a report for the same user+symbol already exists
 *  within the last 24 hours, the new one is silently discarded.
 *  Skips persistence for graceful-degradation reports. */
export async function persistAiReport(
  userId: string,
  symbol: string,
  report: VerdictReport,
): Promise<void> {
  const allInsufficient =
    report.horizons.short_term.stance === "insufficient_data" &&
    report.horizons.medium_term.stance === "insufficient_data" &&
    report.horizons.long_term.stance === "insufficient_data";
  if (allInsufficient || report.model === "all_providers_exhausted") return;

  // ── Deduplication: skip if this user already has a report for this symbol in the last 24h ──
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await prisma.aiReport.count({
    where: { userId, symbol, createdAt: { gt: since } },
  });
  if (recentCount > 0) return; // Already saved one today — don't save duplicates

  // Trim oldest if over cap
  const count = await prisma.aiReport.count({ where: { userId } });
  if (count >= MAX_REPORTS_PER_USER) {
    const excess = count - MAX_REPORTS_PER_USER + 1;
    const oldest = await prisma.aiReport.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: excess,
      select: { id: true },
    });
    if (oldest.length) {
      await prisma.aiReport.deleteMany({ where: { id: { in: oldest.map((r) => r.id) } } });
    }
  }

  await prisma.aiReport.upsert({
    where: { userId_reportId: { userId, reportId: report.report_id } },
    create: {
      userId,
      symbol,
      reportId: report.report_id,
      reportJson: JSON.stringify(report),
    },
    update: {}, // immutable: no changes on conflict
  });
}
