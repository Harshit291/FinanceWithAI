import { NextRequest, NextResponse } from "next/server";
import { searchSymbols, type Market } from "@/lib/data/symbol-search";

/** GET /api/symbols?q=<query>&market=IN|US|ALL */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const rawMarket = req.nextUrl.searchParams.get("market") ?? "ALL";
  const market: Market = rawMarket === "IN" || rawMarket === "US" ? rawMarket : "ALL";

  const results = await searchSymbols(q, market);
  return NextResponse.json({ results });
}
