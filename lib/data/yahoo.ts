/**
 * Yahoo Finance APIs — OHLCV candle data + symbol search.
 * Free, no API key required. Supports US (NYSE/NASDAQ) and India (NSE/BSE .NS/.BO) symbols.
 * Unofficial API — no SLA; switch to a paid provider when ADR-0002 upgrade triggers are met.
 */
import type { CandleBar } from "./finnhub";

const YF_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const YF_SEARCH_BASE = "https://query2.finance.yahoo.com/v1/finance/search";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; FinAI/1.0; +https://github.com/finai)",
  Accept: "application/json",
};

interface YfChartResponse {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }> | null;
    error: { code: string; description: string } | null;
  };
}

export interface YahooSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
}

interface YfSearchResponse {
  quotes: Array<{
    symbol: string;
    shortname?: string;
    longname?: string;
    exchDisp?: string;
    quoteType?: string;
  }>;
}

/** Search symbols via Yahoo Finance. Works for US and India symbols — no API key required. */
export async function searchYahooSymbols(query: string): Promise<YahooSearchResult[]> {
  const url = `${YF_SEARCH_BASE}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];

  const json = (await res.json()) as YfSearchResponse;
  if (!json.quotes?.length) return [];

  return json.quotes
    .filter((q) => q.quoteType === "EQUITY" && q.symbol)
    .map((q) => {
      const isNS = q.symbol.endsWith(".NS");
      const isBO = q.symbol.endsWith(".BO");
      return {
        symbol: q.symbol,
        name: q.longname ?? q.shortname ?? q.symbol,
        exchange: q.exchDisp ?? (isNS ? "NSE" : isBO ? "BSE" : "US"),
        currency: isNS || isBO ? "INR" : "USD", // legacy fallback, not strictly enforced elsewhere
      };
    })
    .slice(0, 8);
}

/** Fetch 1-year daily OHLCV candles from Yahoo Finance. Works for US and India symbols. */
export async function getYahooCandles(symbol: string): Promise<CandleBar[]> {
  const url = `${YF_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1y`;

  const res = await fetch(url, {
    headers: HEADERS,
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const json = (await res.json()) as YfChartResponse;
  const result = json.chart?.result?.[0];
  if (!result?.timestamp?.length) return [];

  const { timestamp } = result;
  const q = result.indicators.quote[0];

  return timestamp
    .map((ts, i) => {
      const o = q.open[i];
      const h = q.high[i];
      const l = q.low[i];
      const c = q.close[i];
      const v = q.volume[i];
      if (o == null || h == null || l == null || c == null) return null;
      return {
        time: new Date(ts * 1000).toISOString().slice(0, 10),
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v ?? 0,
      };
    })
    .filter((bar): bar is CandleBar => bar !== null);
}
