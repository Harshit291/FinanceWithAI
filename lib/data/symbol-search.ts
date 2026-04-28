/**
 * Exchange-aware symbol dispatcher.
 * Uses Yahoo Finance search as primary (free, no key, covers US + India correctly).
 * Falls back to hardcoded sample list if Yahoo search fails.
 */
import { searchYahooSymbols } from "./yahoo";

export interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: "INR" | "USD";
}

/** Hardcoded fallback used when Yahoo search is unavailable. */
const SAMPLE_SYMBOLS: SymbolResult[] = [
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd", exchange: "NSE", currency: "INR" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd", exchange: "NSE", currency: "INR" },
  { symbol: "INFY.NS", name: "Infosys Ltd", exchange: "NSE", currency: "INR" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd", exchange: "NSE", currency: "INR" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", exchange: "NSE", currency: "INR" },
  { symbol: "ITC.NS", name: "ITC Ltd", exchange: "NSE", currency: "INR" },
  { symbol: "RELIANCE.BO", name: "Reliance Industries Ltd", exchange: "BSE", currency: "INR" },
  { symbol: "HDFCBANK.BO", name: "HDFC Bank Ltd", exchange: "BSE", currency: "INR" },
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", currency: "USD" },
  { symbol: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ", currency: "USD" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", currency: "USD" },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", currency: "USD" },
  { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ", currency: "USD" },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", currency: "USD" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", currency: "USD" },
];

/** Search symbols across NSE/BSE + US via Yahoo Finance. Falls back to hardcoded list on failure. */
export async function searchSymbols(query: string): Promise<SymbolResult[]> {
  try {
    const results = await searchYahooSymbols(query);
    if (results.length > 0) return results;
  } catch {
    // fall through to sample list
  }

  const q = query.toLowerCase();
  return SAMPLE_SYMBOLS.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  ).slice(0, 8);
}
