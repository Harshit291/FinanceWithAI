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

/** Cached synthesis (6h Next.js fetch cache). Use on stock page renders. */
export async function synthesiseVerdict(symbol: string): Promise<VerdictReport> {
  return callFastapi(symbol, { next: { revalidate: 21600 } });
}

/** Bypass cache for explicit user-triggered refresh. */
export async function synthesiseVerdictFresh(symbol: string): Promise<VerdictReport> {
  return callFastapi(symbol, { cache: "no-store" });
}
