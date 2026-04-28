/**
 * Yahoo Finance v8 chart API — used for OHLCV candle data only.
 * Free, no API key required. Supports US (NYSE/NASDAQ) and India (NSE/BSE .NS/.BO) symbols.
 * Unofficial API — no SLA; switch to a paid provider when ADR-0002 upgrade triggers are met.
 */
import type { CandleBar } from "./finnhub";

const YF_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

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
