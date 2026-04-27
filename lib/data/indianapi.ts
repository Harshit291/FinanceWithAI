/** IndianAPI.in client — India-deep supplement for NSE/BSE fundamentals. */

const BASE = "https://api.indianapi.in"; // confirm live base URL from docs

function apiKey() {
  const key = process.env.INDIANAPI_API_KEY;
  if (!key) throw new Error("INDIANAPI_API_KEY is not set");
  return key;
}

export interface IndianSearchResult {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
}

/** Search for an Indian stock by name or ticker. */
export async function searchIndianSymbol(query: string): Promise<IndianSearchResult[]> {
  // TODO(session-2): confirm exact endpoint from https://indianapi.in/indian-stock-market docs
  const res = await fetch(`${BASE}/v1/search?q=${encodeURIComponent(query)}`, {
    headers: { "X-Api-Key": apiKey() },
  });
  if (!res.ok) return [];
  return (await res.json()) as IndianSearchResult[];
}
