/**
 * LLM adapter — delegates to the FastAPI pipeline service which handles
 * data fetching (Finnhub / IndianAPI) + LLM classify + synthesize.
 */
import type { VerdictReport } from "./schema";
import { VerdictReportSchema } from "./schema";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

async function callFastapi(symbol: string, init: RequestInit): Promise<VerdictReport> {
  const res = await fetch(`${FASTAPI_URL}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`FastAPI pipeline error ${res.status}: ${text}`);
  }
  return VerdictReportSchema.parse(await res.json());
}

import { unstable_cache } from "next/cache";

/** Cached synthesis (24h Next.js cache, keyed per symbol). Use on stock page renders. */
export const synthesiseVerdict = (symbol: string): Promise<VerdictReport> =>
  unstable_cache(
    () => callFastapi(symbol, { cache: "no-store" }),
    ["ai-report-cache-v1", symbol],
    { revalidate: 86400, tags: ["ai-report"] },
  )();

/** Bypass cache for explicit user-triggered refresh. */
export async function synthesiseVerdictFresh(symbol: string): Promise<VerdictReport> {
  return callFastapi(symbol, { cache: "no-store" });
}

