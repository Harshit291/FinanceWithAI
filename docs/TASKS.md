# TASKS.md

> Central task tracker for FinAI. Synced with ROADMAP.md (backlog) and PROJECT_STATUS.md (current sprint state).
> "Currently Focused" in CLAUDE.md always mirrors the top of the **In Progress / Up Next** section here.

---

## ✅ Completed

### Session 1 — Kickoff (2026-04-27)
- [x] Create eight §9 living documents + CLAUDE.md + docs/PROJECT_INSTRUCTIONS.md
- [x] Scaffold Next.js 16 / React 19 / Tailwind v4 monorepo
- [x] Vitest 4 (vmThreads) + Playwright baseline configs
- [x] `.env.example` with all 11 env vars listed (all unset)
- [x] shadcn/ui peer packages installed manually (corporate SSL blocks CLI)
- [x] `components/ui/` — Button, Card, Badge
- [x] `components/ai-report/` — VerdictCard, HorizonCard, ConfidenceBar, SourceList, Disclaimer
- [x] `components/charts/TradingViewWidget.tsx` — embeds free widget; `// TODO(charting-library):` markers in place
- [x] `app/(app)/stocks/[symbol]/page.tsx` — mobile-first, stacked < 640px, 60/40 ≥ 640px
- [x] `lib/ai/llm.ts` — LLM adapter stub (returns mock §6 verdict)
- [x] `lib/data/symbol-search.ts` — exchange-aware dispatcher; 15-symbol hardcoded fallback
- [x] `lib/data/tv-symbol.ts` — RELIANCE.NS → NSE:RELIANCE format converter
- [x] `app/api/symbols/route.ts` + `app/api/reports/route.ts` — BFF stubs
- [x] `services/app/main.py` — FastAPI /health stub
- [x] Unit tests: 9/9 pass | TypeScript: clean | HTTP 200 at /, /stocks/AAPL, /stocks/RELIANCE.NS

---

## 🔲 In Progress / Up Next

### Pre-Session 2 (unblocked — needs user inputs)
- [ ] **ADR-0002a: Finnhub NSE/BSE smoke check**
  - Add `FINNHUB_API_KEY` to `.env.local`
  - Run: `curl "https://finnhub.io/api/v1/quote?symbol=RELIANCE.NS&token=<KEY>"`
  - If `"c" > 0`: Finnhub covers NSE on free tier → use as primary for India too
  - If `"c" == 0`: route India through IndianAPI.in → update `lib/data/symbol-search.ts` dispatch
  - Update `docs/DECISIONS.md` ADR-0002a with findings
- [ ] **TradingView Charting Library application (Step B)**
  - Go to https://www.tradingview.com/advanced-charts/ → "Get the library"
  - Provide: legal entity, contact email, public project URL, GitHub username
  - Update `docs/DECISIONS.md` ADR-0005 with submission date

### Session 2 — Real LLM Integration
- [x] Add `openai` + `zod` as explicit deps
- [x] Wire `lib/ai/llm.ts` to Groq (`llama-3.3-70b-versatile` via `LLM_SYNTHESIS_MODEL` env var) — swap to Anthropic when key available
- [x] Add Zod schema validation: validate every LLM response against the §6 shape; retry once on ZodError/SyntaxError
- [x] Build FastAPI synthesis pipeline (`services/app/pipeline/`):
  - `resolve.py` — symbol → exchange + company metadata (Finnhub/IndianAPI dispatch)
  - `fundamentals.py` — key ratios + last 4 quarters (Finnhub `stock/metric` + `stock/earnings`)
  - `news.py` — last 90 days headlines (Finnhub `company-news`, capped at 20)
  - `classify.py` — per-article sentiment + relevance using Groq classifier model
  - `peers.py` — 3-5 sector peers (Finnhub `stock/peers`)
  - `synthesize.py` — single Groq call with SYNTH_SYSTEM_V1 prompt; retry once on validation error
- [x] Add Pydantic models in FastAPI mirroring the §6 TypeScript schema (`services/app/models.py`)
- [x] Wire `POST /api/reports` BFF → forward to FastAPI pipeline; removed session-2 TODO comment
- [x] Remove "Sample report" banner from VerdictCard (was removed in earlier session 2 work)
- [x] Add symbol search input to the `/stocks/[symbol]` page header (`components/ui/SymbolSearch.tsx`)
- [x] Playwright browser testing — Chrome installed; verified AAPL, MSFT, mobile 375×667
- [x] Integrate `lightweight-charts@5.2.0` — real candlestick + volume chart, US + India symbols, mobile-responsive
- [x] `lib/data/yahoo.ts` + `/api/candles/[symbol]` — Yahoo Finance v8 OHLCV (free, no key, US+NSE/BSE)
- [ ] Add `GET /api/reports/:report_id` endpoint (deferred to session 3 with Postgres/Redis)
- [ ] TradingView Advanced Charts licence — submit application (legal entity + GitHub username needed)

### Session 3 — Auth + Persistence
- [x] Auth: NextAuth.js v5 (email+password + Google OAuth) — `lib/auth/`, `app/api/auth/[...nextauth]/`
- [x] Prisma 7 + SQLite (BetterSQLite3 adapter) — local dev DB; schema: users, accounts, sessions, watchlist, ai_reports
- [x] `app/api/auth/register/route.ts` — bcrypt password hashing, duplicate-email guard
- [x] Edge/Node auth split — `lib/auth/config.edge.ts` (JWT, no Prisma) for middleware; `lib/auth/config.ts` (full) for API routes
- [x] `middleware.ts` — guards `/app/*` routes; redirects unauthenticated to `/login?callbackUrl=...`
- [x] Full "Precision Terminal" dark redesign — landing page, stock page, auth pages, nav, all AI report components
- [x] Auth pages (`/login`, `/register`) — dark glassmorphism card, grid background, cyan CTA, monospace labels
- [ ] Postgres migration (Supabase) — swap adapter when ready for production
- [ ] Redis provisioning (Upstash — likely choice)
- [ ] Watchlist CRUD: add/remove symbols, persist per user
- [ ] Saved AI reports (immutable rows; "refresh" creates new row per §5.7)

### Session 4 — Technical Analysis
- [x] `services/app/pipeline/technical_analysis.py` — fetch 1y OHLCV from Yahoo Finance, compute RSI-14/SMA-20/50/200/MACD in pure Python, LLM synthesizes BUY/HOLD/SELL
- [x] `FastAPI POST /technical-analysis` route
- [x] `TechnicalVerdict` / `TechnicalSignal` schema in Python (`models.py`) + TypeScript (`schema.ts`) + Zod
- [x] `lib/ai/technical.ts` — `synthesiseTechnical()` adapter
- [x] `components/charts/TechnicalPanel.tsx` — short/long term signal cards with BUY/HOLD/SELL badge, confidence bar, indicator bullets, key levels
- [x] Stock page: `Promise.all` for both analyses, `TechnicalPanel` below chart
- [x] Fixed `FASTAPI_URL` port mismatch in `.env.local` (8001 → 8000)

### Session 5 — Polish + Safety
- [ ] Rate limiting: 20 AI reports/day on free tier; quota meter in UI
- [ ] GDPR/DPDP: data export endpoint (`GET /api/user/export`) + account deletion (`DELETE /api/user`)
- [ ] Error states: handle provider failures gracefully (data missing → `stance: "insufficient_data"`)
- [ ] Loading skeletons for chart and AI panel
- [ ] Performance: verify FCP < 2s on simulated 4G (Lighthouse CI)
- [ ] Accessibility pass: `aria-*` audit, color contrast AA, tap targets ≥ 44px verification
- [ ] Add `.gitattributes` to fix CRLF warnings on Windows

### Post-MVP (ideas — not scheduled)
- [ ] TradingView widget → Charting Library migration (gated on license approval)
- [ ] Crypto + forex coverage
- [ ] CSV import for TradingView watchlist
- [ ] Sector-level dashboards
- [ ] Notification system (alert when AI verdict shifts)

---

## 🚫 Explicitly Out of Scope (per PROJECT_INSTRUCTIONS.md §2)
- Real money order execution / brokerage integration
- Pine Script authoring UI inside our app
- Our own backtesting engine
- Social features, copy trading, paper trading
