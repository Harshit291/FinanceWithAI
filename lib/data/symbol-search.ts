/**
 * Exchange-aware symbol dispatcher.
 * Routes .NS / .BO symbols to IndianAPI.in (or Finnhub if ADR-0002a confirms coverage);
 * routes everything else to Finnhub.
 */
import { searchSymbols as finnhubSearch, type FinnhubSearchResult } from "./finnhub";
import { searchIndianSymbol, type IndianSearchResult } from "./indianapi";

export interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: "INR" | "USD";
}

function isIndian(query: string) {
  return query.toUpperCase().endsWith(".NS") || query.toUpperCase().endsWith(".BO");
}

function fromFinnhub(r: FinnhubSearchResult): SymbolResult {
  const isNS = r.symbol.endsWith(".NS");
  const isBO = r.symbol.endsWith(".BO");
  return {
    symbol: r.symbol,
    name: r.description,
    exchange: isNS ? "NSE" : isBO ? "BSE" : r.type,
    currency: isNS || isBO ? "INR" : "USD",
  };
}

function fromIndian(r: IndianSearchResult): SymbolResult {
  return { symbol: r.symbol, name: r.name, exchange: r.exchange, currency: "INR" };
}

/** Hardcoded fallback used when no API key is set (session 1 dev). */
const SAMPLE_SYMBOLS: SymbolResult[] = [
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
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE", currency: "USD" },
];

/** Search symbols across NSE/BSE + US. Falls back to hardcoded list when keys unavailable. */
export async function searchSymbols(query: string): Promise<SymbolResult[]> {
  if (!process.env.FINNHUB_API_KEY && !process.env.INDIANAPI_API_KEY) {
    const q = query.toLowerCase();
    return SAMPLE_SYMBOLS.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 8);
  }

  try {
    if (isIndian(query) && process.env.INDIANAPI_API_KEY) {
      const results = await searchIndianSymbol(query);
      return results.map(fromIndian).slice(0, 8);
    }
    // Default: Finnhub covers both US and basic NSE/BSE (pending ADR-0002a)
    const results = await finnhubSearch(query);
    return results.map(fromFinnhub).slice(0, 8);
  } catch {
    // Graceful fallback — never let a provider error break the search box
    return [];
  }
}
