import { prisma } from "@/lib/prisma";
import type { VerdictReport } from "@/lib/ai/schema";

const MAX_REPORTS_PER_USER = 200;

/** Persist a synthesised verdict for an authenticated user.
 *  Idempotent on (userId, report.report_id) so repeated views within the
 *  Next.js fetch cache window don't create duplicate rows.
 *  Skips persistence for graceful-degradation reports (model marker
 *  "all_providers_exhausted" or all-insufficient_data horizons). */
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
