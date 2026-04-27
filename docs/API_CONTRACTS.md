# API_CONTRACTS.md

> Exact request/response shapes for every internal API and the AI report schema. Updated when any contract changes.

**Last updated:** 2026-04-27

---

## §6 Verdict schema (canonical — DO NOT MODIFY without an ADR)

This is the structured-output schema enforced on every Claude synthesis call. Every horizon card in the UI renders directly from this shape. Treat it as the single source of truth.

```ts
// lib/ai/schema.ts (Zod) and services/app/schemas.py (Pydantic) must mirror this exactly.

type Stance = "bullish" | "neutral" | "bearish" | "insufficient_data";

interface Horizon {
  window: string;                                  // e.g., "1-4 weeks"
  stance: Stance;
  expected_return_pct_range: [number, number] | null; // null when stance=insufficient_data
  confidence_pct: number;                          // 0-100
  key_drivers: string[];                           // at least 1 unless insufficient_data
  key_risks: string[];                             // at least 1 unless insufficient_data
}

interface DataSource {
  name: string;
  url: string;
  fetched_at: string; // ISO-8601
}

interface VerdictReport {
  report_id: string;     // uuid
  symbol: string;        // e.g., "RELIANCE.NS", "AAPL"
  as_of: string;         // ISO-8601
  model: string;         // e.g., "claude-opus-4-7"
  data_sources: DataSource[];
  horizons: {
    short_term: Horizon;   // 1-4 weeks
    medium_term: Horizon;  // 1-6 months
    long_term: Horizon;    // 1-3 years
  };
  summary_paragraph: string;  // max 120 words, plain English
  disclaimer: string;         // exact §6 string referencing SEBI and SEC
}
```

**UI contract** (per PROJECT_INSTRUCTIONS.md §6):
- Every horizon card renders `confidence_pct` as both a number and a colored bar.
- Each card lists ≥1 driver and ≥1 risk (unless `stance == "insufficient_data"`).
- Each card links out to the relevant `data_sources`.
- If `stance == "insufficient_data"`: grey out the return range, show *why* data was insufficient.
- Disclaimer is always visible (not collapsed) and references **both** SEBI and SEC.

**Validation behavior** (per §14): every Claude response is validated; on failure, retry once with a clarifying message; on second failure, return a graceful error to the UI — never let a malformed response through.

---

## Internal APIs

### `POST /api/reports` (Next.js BFF → FastAPI)

Generate or fetch a research report for a stock.

**Request**
```json
{
  "symbol": "RELIANCE.NS",
  "force_refresh": false
}
```

**Response (200)**
A `VerdictReport` (see schema above).

**Response (202, async — for long-running pipelines)**
```json
{ "job_id": "uuid", "status_url": "/api/reports/jobs/<uuid>" }
```

**Response (4xx)**
```json
{ "error": "string", "code": "SYMBOL_NOT_FOUND" | "RATE_LIMITED" | "DATA_UNAVAILABLE" }
```

### `GET /api/reports/:report_id` (Next.js BFF → Postgres)

Fetch a previously persisted immutable report.

**Response (200)** — `VerdictReport`.
**Response (404)** — `{"error": "Not found", "code": "REPORT_NOT_FOUND"}`.

### `GET /api/symbols/search?q=<query>` (Next.js BFF → Finnhub/IndianAPI dispatcher)

Symbol search across NSE/BSE/NYSE/NASDAQ.

**Response (200)**
```json
{
  "results": [
    { "symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd", "exchange": "NSE", "currency": "INR" },
    { "symbol": "AAPL",        "name": "Apple Inc.",              "exchange": "NASDAQ", "currency": "USD" }
  ]
}
```

### `GET /health` (FastAPI)

```json
{ "status": "ok", "version": "0.1.0", "providers": { "finnhub": "ok", "indianapi": "ok", "anthropic": "ok" } }
```

---

## Provider contracts (third-party — kept here as reminders, not authoritative)

- **Finnhub**: `GET https://finnhub.io/api/v1/{search,quote,stock/metric,stock/financials-reported,company-news,stock/peers}` with `?token=<FINNHUB_API_KEY>`. Free tier: 60 calls/min.
- **IndianAPI.in**: India-specific NSE/BSE fundamentals + 4-quarter results + news. Engaged via `lib/data/indianapi.ts`. Endpoint shapes to be filled in session 2 when implementation lands.
- **Anthropic Messages API**: see `lib/ai/llm.ts`. Always uses model IDs from env (`LLM_SYNTHESIS_MODEL`, `LLM_CLASSIFIER_MODEL`) — never hardcoded.
