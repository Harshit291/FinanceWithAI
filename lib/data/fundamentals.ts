const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export interface FundamentalsData {
  metrics: Record<string, any>;
  earnings: any[];
}

export async function fetchFundamentals(symbol: string): Promise<FundamentalsData | null> {
  try {
    const res = await fetch(`${FASTAPI_URL}/fundamentals/${symbol}`, {
      next: { revalidate: 21600 }, // Cache for 6 hours like the AI report
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
