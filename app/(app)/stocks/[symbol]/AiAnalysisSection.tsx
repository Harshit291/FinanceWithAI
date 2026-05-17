import { prisma } from "@/lib/prisma";
import { synthesiseVerdict } from "@/lib/ai/llm";
import { persistAiReport } from "@/lib/reports/persist";
import { checkQuota } from "@/lib/reports/quota";
import { VerdictCard } from "@/components/ai-report/VerdictCard";
import { ReportHistory } from "@/components/ai-report/ReportHistory";
import { QuotaExceededBanner } from "@/components/ai-report/QuotaExceededBanner";
import type { VerdictReport } from "@/lib/ai/schema";

interface AiAnalysisSectionProps {
  symbol: string;
  userId: string | null;
}

export async function AiAnalysisSection({ symbol, userId }: AiAnalysisSectionProps) {
  const quota = userId ? await checkQuota(userId) : null;
  const allowSynthesis = !quota || quota.allowed;

  const report = allowSynthesis
    ? await synthesiseVerdict(symbol).catch(() => null)
    : null;

  let history: Array<{ id: string; createdAt: Date; report: VerdictReport }> = [];
  if (userId) {
    if (report) await persistAiReport(userId, symbol, report).catch(() => {});
    const rows = await prisma.aiReport.findMany({
      where: { userId, symbol },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, createdAt: true, reportJson: true },
    });
    history = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      report: JSON.parse(r.reportJson) as VerdictReport,
    }));
  }

  if (report) {
    return (
      <>
        <VerdictCard report={report} />
        {history.length > 0 && (
          <ReportHistory items={history} currentReportId={report.report_id} />
        )}
      </>
    );
  }

  if (quota && !quota.allowed) {
    return (
      <>
        <QuotaExceededBanner used={quota.used} limit={quota.limit} resetsAt={quota.resetsAt} />
        {history.length > 0 && <ReportHistory items={history} />}
      </>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-xs font-mono text-slate-500">
      AI fundamental analysis temporarily unavailable. Please try again later.
    </div>
  );
}
