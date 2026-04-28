# PROJECT_STATUS.md

> Single source of truth for "where are we right now". Updated at the end of every working session.

**Last updated:** 2026-04-28 (session 2 complete)

---

## Current sprint goal

✅ **Session 2 goal achieved.** FastAPI synthesis pipeline live (resolve → fundamentals → news → classify → peers → synthesize). Next.js BFF forwards to FastAPI; real Groq LLM verdicts on US stocks. Symbol search input in page header. ADR-0002a resolved: Finnhub free tier is US-only.

Next sprint goal: **Session 3 — auth + persistence.** NextAuth.js, Postgres (Supabase/Neon), Redis (Upstash), Prisma schema, watchlists, saved AI reports.

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

Nothing. Session 2 is complete.

## Blocked

- **TradingView Charting Library application:** awaiting from user:
  - Legal entity name (personal or company?)
  - Public project URL (exists yet, or defer until landing page is live?)
  - GitHub username (for the repo invite)
  - Contact email
  Once provided, submit at https://www.tradingview.com/advanced-charts/. Tracked in DECISIONS.md ADR-0005 and ROADMAP.md item #3.
- **Finnhub free-tier NSE/BSE smoke check (ADR-0002a):** requires a Finnhub API key. Once the user adds `FINNHUB_API_KEY` to `.env.local`, run: `curl "https://finnhub.io/api/v1/quote?symbol=RELIANCE.NS&token=<YOUR_KEY>"` for a few NSE/BSE tickers. If `c > 0` is returned, Finnhub free tier covers it; otherwise route India through IndianAPI.in. Update ADR-0002a in DECISIONS.md with findings.

## Next up (session 3 — in order)

1. Auth: NextAuth.js (email+password + Google OAuth) — `lib/auth/`, `app/api/auth/[...nextauth]/`.
2. Postgres provisioning (Supabase or Neon — decide at session start).
3. Redis provisioning (Upstash).
4. Prisma/Drizzle schema: users, watchlists, ai_reports.
5. Watchlist CRUD: add/remove symbols, persist per user.
6. Saved AI reports (immutable rows; "refresh" creates new row).
7. Guard `/app/*` routes — redirect unauthenticated users to `/login`.
8. Wire `ANTHROPIC_API_KEY` once available; swap Groq → Claude in `.env.local`.

## Open questions for the user

1. **TradingView Charting Library application:** what legal entity, project URL, GitHub username?
2. **Hosting region:** Vercel default (US-East) or India-region for NSE latency? Affects session 3 infra choices.
3. **Anthropic API key:** swap Groq → Claude once key is available — just set `ANTHROPIC_API_KEY` in `.env.local` and update `GROQ_API_KEY` usage in `services/app/pipeline/_shared.py`.
4. **IndianAPI.in key:** needed to unlock India (`.NS`/`.BO`) verdicts — currently returns `insufficient_data`.
5. **Postgres provider:** Supabase or Neon for session 3?
