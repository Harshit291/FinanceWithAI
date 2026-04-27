# ROADMAP.md

> Ordered backlog of features with status: idea → planned → in progress → done. MVP first, post-MVP second.

**Last updated:** 2026-04-27

---

## MVP

| # | Feature | Status | Session | Notes |
|---|---|---|---|---|
| 1 | `/docs` living documents + CLAUDE.md | **done** | 1 | 3 commits, 2026-04-27. |
| 2 | Monorepo scaffold (Next.js 16 + Tailwind v4 + shadcn/ui + FastAPI) | **done** | 1 | Next.js 16.2.4 / React 19 / TS strict. |
| 3 | TradingView Charting Library application submitted | **blocked** | 1 | Awaiting legal entity, project URL, GitHub username from user. |
| 4 | `/stocks/[symbol]` page — TradingView widget + mocked verdict card | **done** | 1 | HTTP 200, NSE + US, mobile-first, SEBI+SEC disclaimer. |
| 5 | Symbol search (Finnhub primary + IndianAPI.in fallback) | **in progress** | 1/2 | Stub + 15-symbol fallback live. Pending ADR-0002a API key smoke check. |
| 6 | Anthropic Claude integration in FastAPI synthesis pipeline | planned | 2 | Drops the mock verdict; full §5 pipeline behind a feature flag. |
| 7 | News fetch + per-article classification (Haiku 4.5) | planned | 2 | Per §5.3–5.4. |
| 8 | Fundamentals + peers + 4-quarter results | planned | 2 | Finnhub + IndianAPI.in. |
| 9 | Auth (NextAuth + Google + email/password) | planned | 3 | §3 stack. |
| 10 | Postgres + Redis provisioning + Prisma/Drizzle | planned | 3 | Choice of Supabase vs Neon, Upstash for Redis. |
| 11 | Watchlist persistence | planned | 3 | Per §2 MVP item 1. |
| 12 | Saved AI reports (immutable rows; refresh creates new) | planned | 3 | Per §5.7. |
| 13 | Rate limiting per user (e.g., 20 reports/day free tier) + UI quota meter | planned | 4 | §7. |
| 14 | GDPR/DPDP data export + account deletion endpoints | planned | 4 | §7. |
| 15 | Migrate widget → Advanced Charts (Charting Library) | **blocked** | post-approval | Save/load layouts, Strategy Tester. |
| 16 | E2E tests on critical flows (login, search, report generation) | planned | 3+ | Playwright. |

## Post-MVP (ideas)

- Crypto + forex coverage.
- CSV-import for porting a TradingView watchlist.
- Notification system: alert when an existing AI verdict materially shifts.
- Sector-level dashboards.
- Multi-symbol comparison view.

## Explicitly out of scope (per PROJECT_INSTRUCTIONS.md §2)

- Real money order execution / brokerage integration.
- Pine Script authoring UI inside our app.
- Our own backtesting engine (we surface TradingView's Strategy Tester via Charting Library).
- Social features, copy trading, paper trading.
