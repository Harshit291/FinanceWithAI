import { NextRequest, NextResponse } from "next/server";
import { synthesiseVerdict } from "@/lib/ai/llm";

/** POST /api/reports — generate (or fetch cached) verdict for a symbol. */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { symbol?: string; force_refresh?: boolean };
  const symbol = body.symbol?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required", code: "MISSING_SYMBOL" }, { status: 400 });
  }

  // TODO(session-2): check Postgres cache; call FastAPI pipeline for real synthesis
  const report = await synthesiseVerdict(symbol);
  return NextResponse.json(report);
}
