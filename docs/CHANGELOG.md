# CHANGELOG.md

> Human-readable changelog by date. Newest first.

---

## 2026-04-29 — Session 5: multi-provider LLM failover + watchlist

### Added
- **Multi-provider LLM failover** (ADR-0007). `services/app/pipeline/_shared.py` defines `PROVIDER_CATALOGUE` with four OpenAI-compatible providers (Groq, Cerebras, SambaNova, OpenRouter); `chat_with_failover()` walks the chain on 429/timeout/5xx, fails fast on auth/bad-request, re-raises last exception when exhausted so existing graceful-degradation paths still trigger. Per-provider `AsyncOpenAI` client cache.
- `services/scripts/rank_providers.py` — benchmark every active provider on the same fundamental-synthesis prompt for a given symbol, score per rubric (schema 25 / completeness 20 / depth 20 / specificity 20 / latency 10 / calibration 5), write `services/providers.ranked.json` (gitignored) consumed by `load_provider_order()` at startup. Per-provider raw + parsed JSON in `services/scripts/benchmark_outputs/`.
- **Watchlist CRUD.** `POST/GET/DELETE /api/watchlist` (auth-gated via NextAuth `auth()`, 50/user cap, Prisma `P2002` → 409). `components/watchlist/WatchlistToggle.tsx` with optimistic update + rollback. `components/watchlist/WatchlistRemoveButton.tsx` for the watchlist page. `app/(app)/watchlist/page.tsx` auth-gated grid with hover-only remove buttons + empty state.
- Nav link in `app/(app)/layout.tsx` — toggles between "Watchlist" and "Sign in" based on session.

### Changed
- `synthesize.py` / `technical_analysis.py` / `classify.py` — swap `groq_client()` calls for `chat_with_failover(kind=...)`. Classifier capped at `max_providers=2` so per-article calls don't burn OpenRouter's 200 RPD. Synthesis report's `model` field now reports `<provider>:<model>` for traceability.
- `app/(app)/stocks/[symbol]/page.tsx` — adds `WatchlistToggle` in editorial header (top-right), with server-side initial-saved state via Prisma `findUnique` on `userId_symbol` compound key.
- `services/app/main.py` — `logging.basicConfig(force=True)` so app-level INFO logs (provider routing) surface under uvicorn.
- `.env.example` — adds `CEREBRAS_API_KEY` / `SAMBANOVA_API_KEY` / `OPENROUTER_API_KEY`. `.gitignore` excludes `services/providers.ranked.json` and `services/scripts/benchmark_outputs/`.
- `docs/ENV_VARIABLES.md` — documents new provider keys; legacy `LLM_SYNTHESIS_MODEL` / `LLM_CLASSIFIER_MODEL` no longer read by the multi-provider helper (per-provider models live in catalogue).
- `docs/DECISIONS.md` — ADR-0007 documenting the failover chain, scoring rubric, and OpenRouter privacy trade-off.

### Verified (Playwright + curl)
- `POST /technical-analysis` AAPL: still 200 OK, log shows `llm.ok provider=groq kind=synthesis symbol=AAPL`.
- `POST /reports` AAPL: classifier looped over Groq fine, synthesis hit Groq TPD limit, log shows `llm.transient ... 429 ... failing over → llm.exhausted → insufficient_data` — graceful path intact.
- Watchlist UX: register `watchtest@example.com`, sign in, click "Save" on `/stocks/AAPL` → toggle becomes "Saved" (cyan). Navigate to `/watchlist` → grid shows AAPL card with US · Equities tag and "Added 2026-04-29".
- TypeScript: clean (`tsc --noEmit`).

---

## 2026-04-29 — Session 4: AI technical analysis panel

### Added
- `services/app/pipeline/technical_analysis.py` — pure-Python indicator engine (RSI-14, SMA-20/50/200, MACD) from Yahoo Finance 1y OHLCV; LLM synthesizes BUY/HOLD/SELL with confidence score for two horizons.
- `FastAPI POST /technical-analysis` — new endpoint; reuses `ReportRequest` model.
- `TechnicalVerdict` + `TechnicalSignal` + `KeyLevels` Pydantic models in `services/app/models.py`.
- `TechnicalVerdict` TypeScript types + Zod schema in `lib/ai/schema.ts`.
- `lib/ai/technical.ts` — `synthesiseTechnical(symbol)` adapter; mirrors `synthesiseVerdict` pattern.
- `components/charts/TechnicalPanel.tsx` — two side-by-side signal cards (short-term 1-4w / long-term 1y+), each with BUY/HOLD/SELL badge, confidence bar, indicator bullets, rationale; key support/resistance row; disclaimer strip.

### Changed
- `app/(app)/stocks/[symbol]/page.tsx` — `Promise.all([synthesiseVerdict, synthesiseTechnical])` in parallel; `TechnicalPanel` renders below `ChartPanel`. Technical call wrapped in `.catch(() => null)` so a failure never breaks the page.
- `.env.local` — fixed `FASTAPI_URL` port mismatch (was `8001`, should be `8000`).

### Verified (Playwright + curl)
- `POST /technical-analysis` AAPL: RSI 62.7, MACD 0.8356, SMA-200 254.21, key levels support 260.56 / resistance 286.19. BUY short-term 80%, BUY long-term 90%.
- Stock page renders: `TechnicalPanel` visible below chart with real data.
- TypeScript: clean (`tsc --noEmit`).

---

## 2026-04-28 — Session 3: auth foundation + "Precision Terminal" redesign

### Added
- `prisma/schema.prisma` — full NextAuth adapter tables (User, Account, Session, VerificationToken) + app models (WatchlistItem, AiReport).
- `prisma/migrations/` — initial SQLite migration.
- `lib/prisma.ts` — Prisma 7 singleton using `PrismaBetterSqlite3` adapter; resolves absolute DB path.
- `lib/auth/config.edge.ts` — Edge-safe NextAuth config (JWT only, no Prisma); used by middleware.
- `lib/auth/config.ts` — Full NextAuth config (PrismaAdapter, Credentials + Google providers, bcrypt).
- `app/api/auth/[...nextauth]/route.ts` — NextAuth API route (handlers from full config).
- `app/api/auth/register/route.ts` — Registration endpoint: bcrypt hash, duplicate-email check, 201/400/409.
- `middleware.ts` — Edge middleware guarding `/app/*`; redirects unauthenticated users to `/login?callbackUrl=...`.
- `app/(auth)/login/page.tsx` + `app/(auth)/register/page.tsx` — Dark auth pages with FinAI logo, glassmorphism card.
- `components/auth/LoginForm.tsx` + `components/auth/RegisterForm.tsx` — Dark forms with cyan CTA, monospace labels.
- `components/ui/FinAILogo.tsx` — Blue square candlestick icon + "Fin**AI**" wordmark.
- `app/page.tsx` — Full redesign: asymmetric left-aligned hero, CSS ticker tape, stats table, numbered feature strip.
- `app/(app)/layout.tsx` — Dark sticky nav with FinAILogo.
- `app/(auth)/layout.tsx` — Dark centered layout with subtle grid background.

### Changed
- `app/globals.css` — dark theme base (`--background: #020617`), ticker tape keyframe animation.
- `app/layout.tsx` — `bg-slate-950 text-slate-100` body classes.
- `components/ai-report/HorizonCard.tsx` — left-edge gradient accent bar, monospace return range numbers, Catalysts/Risks sections.
- `components/ai-report/VerdictCard.tsx` — stacked HorizonCards, AI Insight box with Sparkles icon.
- `components/ai-report/ConfidenceBar.tsx` — dark track, glowing fill.
- `components/ai-report/Disclaimer.tsx` — amber-tinted dark border style.
- `components/ui/badge.tsx` + `components/ui/card.tsx` — dark opacity variants.
- `components/charts/TradingViewWidget.tsx` — `theme: "dark"`.
- `app/(app)/stocks/[symbol]/ChartPanel.tsx` — `border-slate-800 bg-slate-900` wrapper.
- `app/(app)/stocks/[symbol]/page.tsx` — editorial header with font-mono; centered "Fundamental Analysis" divider.

### Design system
- Aesthetic: "Precision Terminal" — cyan accent (`#06b6d4`), slate-950 base, monospace numbers throughout.
- Differentiated from generic AI pattern (no purple gradients, no centered hero, no icon card grids).

### Tech notes (Prisma 7 breaking changes for future reference)
- No `url` field in `schema.prisma` datasource — connection URL lives in `prisma.config.ts` only.
- `PrismaClient` constructor requires `adapter` or `accelerateUrl` — bare `new PrismaClient()` throws.
- Correct export: `PrismaBetterSqlite3` from `@prisma/adapter-better-sqlite3` (not `PrismaLibSQL`).
- Adapter takes `{ url: absolutePath }` config object.

### Verified
- TypeScript: clean (`tsc --noEmit`).
- Login page: dark card, grid background, cyan "Sign in" button, FinAI logo.
- Register page: same aesthetic, 3-field form, "Create account" CTA.
- Landing page: ticker tape, left hero, stats table, feature strip.
- Stock page: monospace header, "Fundamental Analysis" divider, dark HorizonCards.

---

## 2026-04-28 — Session 2 (continued): Lightweight Charts integration

### Added
- `lightweight-charts@5.2.0` — open-source TradingView chart library (Apache 2.0, no licence required).
- `lib/data/yahoo.ts` — Yahoo Finance v8 chart API adapter; 1-year daily OHLCV for US + India symbols (free, no key).
- `app/api/candles/[symbol]/route.ts` — BFF endpoint returning `CandleBar[]` from Yahoo Finance; cached 1 h.
- `components/charts/LightweightChart.tsx` — client component: candlestick + volume series, INR/USD price formatter, `autoSize` fill, loading/empty/error states.

### Changed
- `app/(app)/stocks/[symbol]/ChartPanel.tsx` — swapped `TradingViewWidget` for `LightweightChart`; passes `currency` derived from symbol suffix.
- Removed `TradingViewWidget` from ChartPanel (widget kept in codebase under `TODO(charting-library)` for eventual Advanced Charts swap).

### Why Yahoo Finance for OHLCV
- Finnhub free tier blocks both `/stock/candle` (paywalled) and NSE/BSE quotes (ADR-0002a).
- Yahoo Finance v8 chart API is free, requires no key, and covers US + India (`.NS`/`.BO`) symbols.
- Not production SLA — switch to paid provider when volume justifies it (ADR-0002 upgrade trigger).

### Verified (Playwright)
- AAPL desktop: full 1-year candlestick, volume "15.8M", price $269.84, search + navigate works.
- RELIANCE.NS desktop: full 1-year NSE candlestick, ₹ prices, volume "41.0M".
- AAPL mobile 375×667: 350px chart, stacked layout, all content visible.

---

## 2026-04-28 — Session 2 (continued): FastAPI pipeline + symbol search

### Added
- `services/app/pipeline/` — full §5 pipeline: `resolve.py`, `fundamentals.py`, `news.py`, `classify.py`, `peers.py`, `synthesize.py`.
- `services/app/models.py` — Pydantic `VerdictReport` / `Horizon` / `DataSource` models mirroring the TypeScript §6 schema.
- `lib/ai/llm.ts` — rewired to call FastAPI (`FASTAPI_URL/reports`); Zod validates every FastAPI response.
- `components/ui/SymbolSearch.tsx` — debounced client-side search input; calls `/api/symbols`, shows dropdown, navigates on selection.
- Symbol search input added to `/stocks/[symbol]` page header (desktop: right-aligned; mobile: full-width below title).

### Changed
- `.env.local` — fixed duplicate `FINNHUB_API_KEY` (removed stale empty line; key now set once).
- `app/(app)/stocks/[symbol]/page.tsx` — added `SymbolSearch`; fixed page title (was "AAPL — FinAI — FinAI", now "AAPL — FinAI").
- `app/api/reports/route.ts` — removed stale session-2 TODO comment.
- `lib/data/symbol-search.ts` — updated inline comment to reflect ADR-0002a resolution.
- `.mcp.json` — reverted to default (Chrome installed; `--browser msedge` workaround no longer needed).

### Verified (Playwright)
- `/stocks/AAPL` — chart loads, real Groq verdict (bullish long term), symbol search dropdown functional.
- `/stocks/MSFT` — news-driven verdict (bearish short, neutral medium, bullish long), navigation via search works.
- Mobile 375×667 — stacked layout, full-width search, disclaimer visible.

### ADR-0002a — resolved
- Finnhub free tier: US stocks ✅ (`c > 0`), NSE/BSE ❌ (`"You don't have access"`).
- India symbols return `insufficient_data` until `INDIANAPI_API_KEY` is set.

---

## 2026-04-28 — Session 2: real LLM integration (Groq)

### Added
- `openai` + `zod` as explicit dependencies.
- Zod runtime schemas in `lib/ai/schema.ts` (`VerdictReportSchema`) — validates every LLM response; parse fails throw `ZodError`.
- `GROQ_API_KEY` env var — Groq free-tier key used in dev while Anthropic key is pending.

### Changed
- `lib/ai/llm.ts` — rewrote from mock stub to real LLM call via Groq's OpenAI-compatible API (`llama-3.3-70b-versatile`). Retries once on `ZodError`/`SyntaxError`. Model IDs still read from env, never hardcoded.
- `components/ai-report/VerdictCard.tsx` — removed `isMock` prop and "Sample report" banner. Component now only renders real data.
- `app/(app)/stocks/[symbol]/page.tsx` — removed `isMock` pass-through.
- `docs/ENV_VARIABLES.md` — added `GROQ_API_KEY`; clarified dev vs prod defaults for `LLM_SYNTHESIS_MODEL` / `LLM_CLASSIFIER_MODEL`.
- `.env.local` — updated model defaults to Groq model names for dev.

### Technical notes
- FastAPI data pipeline not yet connected; Groq returns `insufficient_data` stances for all horizons (correct — no fabricated numbers).
- Switching to Anthropic: set `ANTHROPIC_API_KEY` in `.env.local`, update `baseURL` + model names in `.env.local`, refactor `llm.ts` to use the Anthropic SDK.

---

## 2026-04-27 — Session 1: kickoff

### Added
- `CLAUDE.md` at repo root — slim orientation that auto-loads in every Claude Code session, pointing back to the canonical docs.
- `docs/PROJECT_INSTRUCTIONS.md` — full Project Instructions document, preserved verbatim from the user's original Claude.ai project field.
- The eight §9 living documents:
  - `docs/PROJECT_STATUS.md` — current sprint, in-progress, blocked, next up, open questions.
  - `docs/ARCHITECTURE.md` — topology diagram, repo layout, data flow for `/reports`.
  - `docs/DECISIONS.md` — ADR-0001 through ADR-0005 (market scope, provider stack, monorepo, Claude models, charting strategy).
  - `docs/ROADMAP.md` — ordered MVP backlog with session targets.
  - `docs/CHANGELOG.md` (this file).
  - `docs/API_CONTRACTS.md` — §6 verdict schema as canonical source plus internal API contracts.
  - `docs/PROMPTS.md` — v1 synthesis prompt skeleton + v1 classifier prompt.
  - `docs/ENV_VARIABLES.md` — every env var with purpose, surface, and required-by-environment.

### Decided
- ADR-0001: India + US day one.
- ADR-0002: Finnhub primary + IndianAPI.in supplement; EODHD ALL-IN-ONE as identified paid upgrade.
- ADR-0003: Single monorepo (Next.js root + `services/` FastAPI).
- ADR-0004: `claude-opus-4-7` synthesis, `claude-haiku-4-5` classifier (env-pinned, never hardcoded).
- ADR-0005: TradingView widget for MVP, migrate to Advanced Charts (Charting Library) post-approval; Lightweight Charts as fallback.

### Technical notes (for future reference)
- Next.js 16 / React 19 / Tailwind v4 — all cutting-edge. `AGENTS.md` at root warns about breaking changes.
- `shadcn@latest init` blocked by corporate SSL; shadcn/ui peer packages installed manually.
- Tailwind v4: CSS-based config (`@import "tailwindcss"` in globals.css), no `tailwind.config.ts`.
- Vitest 4 `forks` pool times out on Windows + Node 25; switched to `vmThreads`.
- `.gitattributes` not set — CRLF conversion warnings on every Windows commit (cosmetic).

### Pending / blocked
- ADR-0002a: Finnhub free-tier NSE/BSE coverage smoke check (needs API key).
- TradingView Charting Library application submission (awaiting user inputs — see PROJECT_STATUS.md).
- Session 2: real LLM integration.

---

## 2026-04-27 — Session 1: scaffold and feature shell

### Added
- Next.js 16.2.4 + React 19 + Tailwind v4 + TypeScript strict monorepo scaffold.
- Vitest 4 + Testing Library + Playwright baseline configs.
- `.env.example` with all 11 required env vars (all unset).
- shadcn/ui peer packages (manually): `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/react-slot`, `@radix-ui/react-progress`, `@radix-ui/react-separator`.
- `components/ui/`: Button, Card, Badge (shadcn-style).
- `components/ai-report/`: VerdictCard, HorizonCard, ConfidenceBar, SourceList, Disclaimer.
- `components/charts/TradingViewWidget.tsx` — embeds TradingView Advanced Real-Time Chart Widget with `// TODO(charting-library):` marker; symbol-format adapter converts RELIANCE.NS → NSE:RELIANCE etc.
- `app/(app)/stocks/[symbol]/page.tsx` — mobile-first (stacked ≤ 640px, 60/40 split ≥ 640px); mocked §6 verdict card; SEBI+SEC disclaimer always visible.
- `app/page.tsx` — minimal landing page with links to RELIANCE.NS and AAPL.
- `app/api/symbols/route.ts` — symbol search BFF (dispatches to Finnhub/IndianAPI/fallback).
- `app/api/reports/route.ts` — report generation BFF (mock in session 1).
- `lib/ai/schema.ts` — TypeScript types for the §6 VerdictReport.
- `lib/ai/llm.ts` — LLM adapter stub returning mock verdict (real API in session 2).
- `lib/ai/mock-verdict.ts` — static §6-shaped RELIANCE.NS mock report.
- `lib/data/symbol-search.ts` — exchange-aware dispatcher; 15-symbol hardcoded fallback.
- `lib/data/tv-symbol.ts` — internal symbol → TradingView format converter.
- `lib/data/finnhub.ts`, `lib/data/indianapi.ts` — provider adapter stubs.
- `services/app/main.py` — FastAPI `/health` endpoint stub.
- `tests/e2e/smoke.spec.ts` — Playwright smoke spec for landing + NSE + US symbol pages.
- `lib/ai/schema.test.ts`, `lib/data/tv-symbol.test.ts` — 9 Vitest unit tests (all pass).
- `.gitignore` updated: allows `.env.example`, covers Python/FastAPI artifacts.

### Verified
- TypeScript: clean (`tsc --noEmit`).
- Unit tests: 9/9 pass.
- Dev server: HTTP 200 at `/`, `/stocks/AAPL`, `/stocks/RELIANCE.NS`.
