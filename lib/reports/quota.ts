import { cache } from "react";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 20;

function envLimit(): number {
  const raw = Number(process.env.RATE_LIMIT_REPORTS_PER_DAY);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_LIMIT;
}

export interface QuotaState {
  used: number;
  limit: number;
  allowed: boolean;
  resetsAt: Date;
}

/** Count AiReport rows persisted by this user in the last 24h.
 *  Returns `allowed=false` once `used >= limit`. Each call to
 *  `persistAiReport` adds 1 to the count; force_refresh + cache-miss
 *  syntheses are the only paths that create rows. */
export const checkQuota = cache(async function checkQuota(userId: string): Promise<QuotaState> {
  const limit = envLimit();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const used = await prisma.aiReport.count({
    where: { userId, createdAt: { gt: since } },
  });
  return {
    used,
    limit,
    allowed: used < limit,
    resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
});

export const checkAnonymousQuota = cache(async function checkAnonymousQuota(ipAddress: string): Promise<QuotaState> {
  const limit = 2; // Fixed limit for anonymous users
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const used = await prisma.anonymousReport.count({
    where: { ipAddress, createdAt: { gt: since } },
  });
  return {
    used,
    limit,
    allowed: used < limit,
    resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
});

export async function persistAnonymousReport(ipAddress: string): Promise<void> {
  await prisma.anonymousReport.create({
    data: { ipAddress },
  });
}
