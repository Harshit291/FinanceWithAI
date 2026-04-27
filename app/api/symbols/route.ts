import { NextRequest, NextResponse } from "next/server";
import { searchSymbols } from "@/lib/data/symbol-search";

/** GET /api/symbols?q=<query> — exchange-aware symbol search. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchSymbols(q);
  return NextResponse.json({ results });
}
