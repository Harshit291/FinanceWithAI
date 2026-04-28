import { NextRequest, NextResponse } from "next/server";
import { getYahooCandles } from "@/lib/data/yahoo";

/** GET /api/candles/[symbol] — 1-year daily OHLCV from Yahoo Finance. US + India supported. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const s = decodeURIComponent(symbol).toUpperCase();

  try {
    const candles = await getYahooCandles(s);
    return NextResponse.json(
      { candles },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
    );
  } catch {
    return NextResponse.json({ candles: [], reason: "fetch_error" });
  }
}
