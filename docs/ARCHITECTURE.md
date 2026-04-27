# ARCHITECTURE.md

> High-level architecture, folder layout, data flow, and deploy topology. Updated when architecture changes.

**Last updated:** 2026-04-27

---

## Topology

```
┌──────────────────────┐       ┌────────────────────────┐
│  Browser (Next.js)   │ ◀────▶│  Next.js BFF           │
│  /app + /components  │       │  /app/api route handlers│
└──────────────────────┘       └──────────┬─────────────┘
                                          │
                       ┌──────────────────┼──────────────────┐
                       │                  │                  │
                ┌──────▼─────┐    ┌──────▼─────┐    ┌───────▼────────┐
                │ PostgreSQL │    │   Redis    │    │ FastAPI service│
                │ (users,    │    │ (caches,   │    │ /services      │
                │ watchlist, │    │  rate      │    │ (research      │
                │ reports)   │    │  limiting) │    │  pipeline,     │
                └────────────┘    └────────────┘    │  LLM calls)    │
                                                    └───┬────────┬───┘
                                                        │        │
                                              ┌─────────▼──┐  ┌──▼──────────────┐
                                              │ Anthropic  │  │ Market data:    │
                                              │ Claude API │  │ Finnhub (US+NSE)│
                                              │ (opus-4-7, │  │ IndianAPI.in    │
                                              │  haiku-4-5)│  │ (NSE/BSE deep)  │
                                              └────────────┘  └─────────────────┘
```

## Repo layout (single monorepo, ADR-0003)

```
/app                  # Next.js App Router
  /(marketing)        # public landing
  /(app)              # authed pages
    /dashboard
    /stocks/[symbol]  # workhorse page
  /api                # BFF route handlers (Next.js)
/components
  /ui                 # shadcn primitives
  /charts             # TradingView wrappers
  /ai-report          # verdict cards, source list, confidence bar, disclaimer
/lib
  /ai                 # llm adapter, prompt templates, schema validators
  /data               # market data clients (finnhub, indianapi), news, symbol-search
  /db                 # prisma/drizzle (session 3)
  /auth               # NextAuth config (session 3)
/services             # FastAPI research pipeline (Python)
  /app
    /pipeline         # symbol resolve → fundamentals → news → classify → peers → synthesize
    /prompts          # prompt templates (mirrors /docs/PROMPTS.md)
  /tests
/docs                 # the eight living documents from PROJECT_INSTRUCTIONS.md §9
/tests
  /e2e                # Playwright
```

## Data flow — generating an AI report (per §5)

1. User opens `/stocks/[symbol]`. Next.js page server-renders the chart shell + reads any cached report from Postgres.
2. If user clicks "Generate fresh report", Next.js BFF posts `{symbol, force: false}` to FastAPI `POST /reports`.
3. FastAPI pipeline runs (each step caches in Redis with the §5 TTLs):
   - symbol resolve → Finnhub (US) or IndianAPI.in/Finnhub (NSE/BSE) per ADR-0002 dispatch.
   - fundamentals → Finnhub `stock/metric` + `stock/financials-reported`, supplemented by IndianAPI.in for NSE/BSE.
   - news → Finnhub `company-news` (90-day window).
   - classify each news item with Claude **Haiku 4.5** (cheap, fast).
   - peer set → Finnhub `stock/peers`.
   - synthesize → single Claude **Opus 4.7** call with structured-output enforcement against §6 schema.
4. FastAPI persists the report in Postgres (immutable; refresh creates a new row), returns it.
5. Next.js BFF streams the report back to the browser, which renders horizon cards via `components/ai-report/`.

## Deploy topology

- **Frontend:** Vercel (Next.js).
- **FastAPI service:** Render or Fly.io (decide in session 3 when we provision).
- **Postgres:** Supabase or Neon (decide in session 3).
- **Redis:** Upstash (serverless, generous free tier) — likely choice; confirm in session 3.

## Cross-cutting concerns

- **Secrets:** all third-party keys live server-side only (Next.js server actions / route handlers, FastAPI env). Browser never sees them.
- **Schema validation:** every Claude response is validated against the §6 schema using Zod (frontend) and Pydantic (backend). One retry on validation failure, then graceful error to UI.
- **Caching keys** include: `symbol`, `pipeline_stage`, `data_version`, `model_version` — so a model upgrade invalidates synthesis caches automatically.
- **Disclaimer rendering:** shared `components/ai-report/Disclaimer.tsx` referenced from every page that shows AI commentary; references both SEBI and SEC.
