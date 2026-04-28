/** Finnhub API client — primary provider for US + NSE (pending ADR-0002a smoke check). */

const BASE = "https://finnhub.io/api/v1";

function apiKey() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY is not set");
  return key;
}

export interface FinnhubSearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

export async function searchSymbols(query: string): Promise<FinnhubSearchResult[]> {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}&token=${apiKey()}`);
  if (!res.ok) throw new Error(`Finnhub search failed: ${res.status}`);
  const data = (await res.json()) as { result: FinnhubSearchResult[] };
  return data.result ?? [];
}

export interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // % change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
}

export async function getQuote(symbol: string): Promise<FinnhubQuote | null> {
  const res = await fetch(`${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey()}`);
  if (!res.ok) return null;
  const data = (await res.json()) as FinnhubQuote;
  // Finnhub returns { c: 0 } when symbol is unknown on free tier
  return data.c === 0 ? null : data;
}

export interface CandleBar {
  time: string; // "YYYY-MM-DD"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Fetch daily OHLCV candles for `days` trading days back. US symbols only on free tier. */
export async function getCandles(symbol: string, days = 365): Promise<CandleBar[]> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 24 * 60 * 60;

  const res = await fetch(
    `${BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${apiKey()}`,
    { next: { revalidate: 3600 } },
  );
  if (!res.ok) return [];

  const data = (await res.json()) as {
    c: number[]; h: number[]; l: number[]; o: number[]; t: number[]; v: number[]; s: string;
  };
  if (data.s !== "ok" || !data.t?.length) return [];

  return data.t.map((ts, i) => ({
    time: new Date(ts * 1000).toISOString().slice(0, 10),
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i],
  }));
}
