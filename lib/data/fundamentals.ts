const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export interface FundamentalsData {
  metrics: Record<string, any>;
  earnings: any[];
}

export async function fetchFundamentals(symbol: string): Promise<FundamentalsData | null> {
  try {
    const res = await fetch(`${FASTAPI_URL}/fundamentals/${symbol}?_cb=1`, {
      next: { revalidate: 3600, tags: ['fundamentals', symbol] },
      signal: AbortSignal.timeout(15000), // Wait up to 15s for Render to wake up
    });
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(`Failed to fetch fundamentals for ${symbol}:`, error);
    return null;
  }
}
