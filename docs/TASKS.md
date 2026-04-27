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
- [ ] Add Anthropic SDK: `npm install @anthropic-ai/sdk`
- [ ] Wire `lib/ai/llm.ts` to real API (`claude-opus-4-7` via `LLM_SYNTHESIS_MODEL` env var)
- [ ] Add Zod schema validation: validate every Claude response against the §6 shape; retry once on failure; graceful error on second failure
- [ ] Build FastAPI synthesis pipeline (`services/app/pipeline/`):
  - `resolve.py` — symbol → exchange + company metadata (Finnhub/IndianAPI dispatch)
  - `fundamentals.py` — key ratios + last 4 quarters (Finnhub `stock/metric` + `stock/financials-reported` + IndianAPI)
  - `news.py` — last 90 days headlines + bodies (Finnhub `company-news`)
  - `classify.py` — per-article sentiment + relevance using `claude-haiku-4-5`
  - `peers.py` — 3-5 sector peers (Finnhub `stock/peers`)
  - `synthesize.py` — single `claude-opus-4-7` call with SYNTH_SYSTEM_V1 prompt from PROMPTS.md
- [ ] Add Pydantic models in FastAPI mirroring the §6 TypeScript schema
- [ ] Wire `POST /api/reports` BFF → forward to FastAPI pipeline; drop mock
- [ ] Add `GET /api/reports/:report_id` endpoint (fetch from Postgres cache — Postgres not live yet; use Redis TTL cache as interim)
- [ ] Remove "Sample report — LLM integration ships in session 2" banner from VerdictCard once real LLM is live
- [ ] Add symbol search input to the `/stocks/[symbol]` page header (currently only hardcoded landing page links)
- [ ] Run `npx playwright install` + verify Playwright E2E smoke spec passes

### Session 3 — Auth + Persistence
- [ ] Auth: NextAuth.js (email+password + Google OAuth) — `lib/auth/`, `app/api/auth/[...nextauth]/`
- [ ] Postgres provisioning (Supabase or Neon — decide in session 3)
- [ ] Redis provisioning (Upstash — likely choice)
- [ ] Prisma/Drizzle schema: users, watchlists, ai_reports
- [ ] Watchlist CRUD: add/remove symbols, persist per user
- [ ] Saved AI reports (immutable rows; "refresh" creates new row per §5.7)
- [ ] Guard `/app/*` routes — redirect unauthenticated users to `/login`

### Session 4 — Polish + Safety
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
