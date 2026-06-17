import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

// GET /api/quotes?symbols=AAPL,RELIANCE.NS,TSLA
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 50); // safety cap

  if (symbols.length === 0)
    return NextResponse.json({ quotes: {} });

  const quotes: Record<string, { price: number | null; change: number | null; changePercent: number | null }> = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const yf: any = new YahooFinance();
        const q = await yf.quote(symbol);
        quotes[symbol] = {
          price: q?.regularMarketPrice ?? null,
          change: q?.regularMarketChange ?? null,
          changePercent: q?.regularMarketChangePercent ?? null,
        };
      } catch {
        quotes[symbol] = { price: null, change: null, changePercent: null };
      }
    })
  );

  return NextResponse.json({ quotes }, {
    headers: {
      // Cache for 30 seconds on the CDN edge
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
