# PROJECT_STATUS.md

> Single source of truth for "where are we right now". Updated at the end of every working session.

**Last updated:** 2026-04-29 (session 4 complete)

---

## Current sprint goal

✅ **Session 4 complete.** AI technical analysis panel shipped: FastAPI `/technical-analysis` computes RSI-14/SMA-20/50/200/MACD from 1y Yahoo Finance OHLCV, LLM synthesizes BUY/HOLD/SELL for short-term (1-4w) and long-term (1y+) with confidence score. `TechnicalPanel` renders below chart on stock page.

Next sprint goal: **Session 5 — persistence features.** Watchlist CRUD, saved AI reports, Supabase Postgres migration.

## Last session summary (2026-04-28 — session 3 partial)

**Auth foundation + full dark redesign.**

- **Auth:** NextAuth.js v5 (Credentials + Google) wired. Prisma 7 + SQLite (BetterSQLite3 adapter). Schema: User, Account, Session, VerificationToken, WatchlistItem, AiReport. Register endpoint with bcrypt. Edge/Node config split so middleware doesn't hit Node.js APIs.
- **Redesign — "Precision Terminal" aesthetic:** cyan accent, monospace data, left-edge gradient bars, dark glassmorphism auth cards, CSS ticker tape on landing page, left-aligned asymmetric hero, numbered feature strip. All pages consistent: landing, `/stocks/[symbol]`, `/login`, `/register`.
- **DB migration path:** SQLite locally → Supabase (PostgreSQL) for production. Just swap provider + adapter in `prisma.config.ts`.
- **TypeScript:** clean (`tsc --noEmit`). All auth pages, forms, middleware verified.

**Notable Prisma 7 gotchas:**
- No `url` in `schema.prisma` datasource (moved to `prisma.config.ts`).
- `PrismaClient` requires either `adapter` or `accelerateUrl` — bare constructor fails.
- Correct export from `@prisma/adapter-better-sqlite3` is `PrismaBetterSqlite3` (not `PrismaLibSQL`).
- Adapter takes `{ url: absolutePath }` config object, not a Database instance.

## Last session summary (2026-04-27)

**Session 1 — Kickoff. All four steps completed and committed.**

- **Step A:** Created all eight §9 living documents + CLAUDE.md + docs/PROJECT_INSTRUCTIONS.md. Committed as `docs: add eight living documents and CLAUDE.md`.
- **Step B:** Deferred — user needs to provide legal entity, public project URL, and GitHub username to submit the TradingView Charting Library application. Widget path is live and unblocked.
- **Step C:** Scaffolded Next.js 16.2.4 / React 19 / Tailwind v4 monorepo. Node 25, npm 11, pnpm 10. Added Vitest 4 (vmThreads pool — `forks` pool times out on Windows + Node 25), Playwright, ESLint v9 flat config. Created `.env.example` with all §ENV_VARIABLES.md keys unset. Committed as `chore: scaffold Next.js 16 + Tailwind v4 monorepo`.
- **Step D:** Built `/stocks/[symbol]` page. Mobile-first (stacked < 640px, 60/40 split ≥ 640px). TradingViewWidget + mocked VerdictCard (all §6 fields). Symbol format adapter (RELIANCE.NS → NSE:RELIANCE etc). FastAPI /health stub. 9/9 unit tests pass. TypeScript clean. HTTP 200 at /, /stocks/AAPL, /stocks/RELIANCE.NS. Committed as `feat: /stocks/[symbol] page with TradingView widget + mocked AI verdict`.

**Notable tech notes:**
- `create-next-app@16.2.4` generates `AGENTS.md` with a Next.js "this is not the Next.js you know" warning for AI agents. Kept at root.
- `shadcn@latest init` failed due to corporate SSL inspection — installed shadcn/ui peer packages manually and hand-wrote components.
- Tailwind v4 uses `@import "tailwindcss"` in CSS, no `tailwind.config.ts` needed.
- Line-ending warnings (LF → CRLF) on every commit — Windows git default. Add `.gitattributes` in session 2 if desired.

## In progress

Nothing. Session 4 complete and committed.

## Blocked

- **TradingView Charting Library application:** awaiting from user:
  - Legal entity name (personal or company?)
  - Public project URL (exists yet, or defer until landing page is live?)
  - GitHub username (for the repo invite)
  - Contact email
  Once provided, submit at https://www.tradingview.com/advanced-charts/. Tracked in DECISIONS.md ADR-0005 and ROADMAP.md item #3.
- **Finnhub free-tier NSE/BSE smoke check (ADR-0002a):** requires a Finnhub API key. Once the user adds `FINNHUB_API_KEY` to `.env.local`, run: `curl "https://finnhub.io/api/v1/quote?symbol=RELIANCE.NS&token=<YOUR_KEY>"` for a few NSE/BSE tickers. If `c > 0` is returned, Finnhub free tier covers it; otherwise route India through IndianAPI.in. Update ADR-0002a in DECISIONS.md with findings.

## Next up (session 4 — in order)

1. **Watchlist CRUD** — POST/DELETE `/api/watchlist`, bookmark toggle on stock page. `WatchlistItem` table already in schema.
2. **Saved AI reports** — write `AiReport` row after synthesis; `GET /api/reports` to list user's history.
3. **Supabase migration** — swap `provider = "sqlite"` → `"postgresql"` + `@prisma/adapter-pg`; run `prisma migrate deploy`.
4. **Redis (Upstash)** — cache synthesised reports for 1 h to avoid redundant LLM calls.
5. **Anthropic API key** — set `ANTHROPIC_API_KEY` in `.env.local`; update `_shared.py` `baseURL` + model.

## Open questions for the user

1. **TradingView Charting Library application:** what legal entity, project URL, GitHub username?
2. **Hosting region:** Vercel default (US-East) or India-region for NSE latency?
3. **Anthropic API key:** swap Groq → Claude once key is available — set `ANTHROPIC_API_KEY` in `.env.local`, update `baseURL` + model in `services/app/pipeline/_shared.py`.
4. **IndianAPI.in key:** needed to unlock India (`.NS`/`.BO`) verdicts — currently returns `insufficient_data`.
