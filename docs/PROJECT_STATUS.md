# PROJECT_STATUS.md

> Single source of truth for "where are we right now". Updated at the end of every working session.

**Last updated:** 2026-04-27 (session 1 complete)

---

## Current sprint goal

✅ **Session 1 goal achieved.** Living documents created, monorepo scaffolded, `/stocks/[symbol]` feature shell live with TradingView widget + mocked §6 verdict card for both NSE and US symbols.

Next sprint goal: **Session 2 — real LLM integration.** Wire `lib/ai/llm.ts` to the Anthropic API, build the FastAPI synthesis pipeline (symbol resolve → fundamentals → news → classify → peers → synthesize), and drop the mock verdict.

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

Nothing. Session 1 is complete.

## Blocked

- **TradingView Charting Library application:** awaiting from user:
  - Legal entity name (personal or company?)
  - Public project URL (exists yet, or defer until landing page is live?)
  - GitHub username (for the repo invite)
  - Contact email
  Once provided, submit at https://www.tradingview.com/advanced-charts/. Tracked in DECISIONS.md ADR-0005 and ROADMAP.md item #3.
- **Finnhub free-tier NSE/BSE smoke check (ADR-0002a):** requires a Finnhub API key. Once the user adds `FINNHUB_API_KEY` to `.env.local`, run: `curl "https://finnhub.io/api/v1/quote?symbol=RELIANCE.NS&token=<YOUR_KEY>"` for a few NSE/BSE tickers. If `c > 0` is returned, Finnhub free tier covers it; otherwise route India through IndianAPI.in. Update ADR-0002a in DECISIONS.md with findings.

## Next up (session 2 — in order)

1. Add Anthropic API key to `.env.local`; update `lib/ai/llm.ts` to call the real API using `claude-opus-4-7`.
2. Build the FastAPI synthesis pipeline: `services/app/pipeline/` — symbol resolve → fundamentals → news → classify (haiku-4-5) → peers → synthesize (opus-4-7).
3. Wire `POST /api/reports` BFF to forward to FastAPI pipeline; remove the mock.
4. Add schema validation (Zod on TS side, Pydantic on Python side) for every Claude response.
5. Confirm ADR-0002a (Finnhub NSE coverage) and update data layer dispatch accordingly.
6. Add the symbol search input to the stock page header (currently hardcoded two links on the landing page).
7. Run Playwright E2E smoke tests end-to-end (need `npx playwright install` first).

## Open questions for the user

1. **TradingView Charting Library application:** what legal entity, project URL, GitHub username?
2. **Hosting region:** Vercel default (US-East) or India-region for NSE latency? Affects session 3 infra choices.
3. **Anthropic API key:** do you have one, or should we plan for a sign-up step before session 2?
4. **Finnhub API key:** do you have one? (Smoke check for ADR-0002a is fast once we have it.)
5. **Python environment:** `uv` or `venv+pip` for the FastAPI service? (Both work; `uv` is faster.)
