import { prisma } from "@/lib/prisma";
import { synthesiseVerdict } from "@/lib/ai/llm";
import { persistAiReport } from "@/lib/reports/persist";
import { checkQuota, checkAnonymousQuota, persistAnonymousReport } from "@/lib/reports/quota";
import { VerdictCard } from "@/components/ai-report/VerdictCard";
import { ReportHistory } from "@/components/ai-report/ReportHistory";
import { QuotaExceededBanner } from "@/components/ai-report/QuotaExceededBanner";
import { SignInRequiredBanner } from "@/components/ai-report/SignInRequiredBanner";
import type { VerdictReport } from "@/lib/ai/schema";
import { headers } from "next/headers";

interface AiAnalysisSectionProps {
  symbol: string;
  userId: string | null;
}

export async function AiAnalysisSection({ symbol, userId }: AiAnalysisSectionProps) {
  let quota;
  let ipAddress = "";

  if (userId) {
    quota = await checkQuota(userId);
  } else {
    // Get IP for unauthenticated users
    const headersList = await headers();
    ipAddress = headersList.get("x-forwarded-for") || "unknown";
    quota = await checkAnonymousQuota(ipAddress);
  }

  const allowSynthesis = !quota || quota.allowed;

  let report: VerdictReport | null = null;

  if (allowSynthesis) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingGlobalReport = await prisma.aiReport.findFirst({
      where: {
        symbol,
        createdAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingGlobalReport) {
      report = JSON.parse(existingGlobalReport.reportJson) as VerdictReport;
    } else {
      report = await synthesiseVerdict(symbol).catch(() => null);
    }
  }

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
  } else if (report && ipAddress !== "unknown") {
    // Persist anonymous report usage
    await persistAnonymousReport(ipAddress).catch(() => {});
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
    if (userId) {
      return (
        <>
          <QuotaExceededBanner used={quota.used} limit={quota.limit} resetsAt={quota.resetsAt} />
          {history.length > 0 && <ReportHistory items={history} />}
        </>
      );
    } else {
      return (
        <SignInRequiredBanner used={quota.used} limit={quota.limit} />
      );
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-xs font-mono text-slate-500">
      AI fundamental analysis temporarily unavailable. Please try again later.
    </div>
  );
}
