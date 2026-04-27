# PROJECT_STATUS.md

> Single source of truth for "where are we right now". Updated at the end of every working session.

**Last updated:** 2026-04-27 (session 1 — kickoff)

---

## Current sprint goal

Land the §15 first-session kickoff: living documents in place, scaffold complete, and a `/stocks/[symbol]` page that renders a TradingView widget alongside a §6-shaped *mocked* AI verdict card for both NSE and US symbols. Real Claude API integration is **session 2**.

## Last session summary (2026-04-27)

- Captured full Project Instructions document into [docs/PROJECT_INSTRUCTIONS.md](PROJECT_INSTRUCTIONS.md) and added [CLAUDE.md](../CLAUDE.md) so future Claude Code sessions auto-load orientation.
- Resolved 5 ADRs (see [DECISIONS.md](DECISIONS.md)): India + US day-one, Finnhub + IndianAPI.in provider stack, monorepo, Claude model picks, TradingView widget→Charting Library path.
- Web-researched and locked in current TradingView Charting Library application URL, current Anthropic model IDs (`claude-opus-4-7`, `claude-haiku-4-5`), and the data-provider shortlist.
- Created the eight §9 living documents with seed content.
- (Pending in this session) Repo scaffold and `/stocks/[symbol]` feature shell.

## In progress

- Step C: scaffold Next.js + Tailwind + shadcn/ui at root, FastAPI in `services/`. Held pending user checkpoint per the approved plan.

## Blocked

- **TradingView Charting Library application:** awaiting user-supplied legal entity, contact email, public project URL, and GitHub username before we can submit. In the interim the `/stocks/[symbol]` page uses the free Advanced Real-Time Chart **Widget**. Marker comment: `// TODO(charting-library):`.
- **Finnhub free-tier NSE/BSE coverage:** unverified. Smoke check is part of step C; outcome will be recorded in [DECISIONS.md](DECISIONS.md) ADR-0002a.

## Next up (in order)

1. Confirm scaffold checkpoint with user; run `git init` and bootstrap Next.js + FastAPI per [docs/ARCHITECTURE.md](ARCHITECTURE.md).
2. Build `/stocks/[symbol]` with widget + mocked verdict card; verify at 375×667 and 1440×900.
3. Session-end updates to PROJECT_STATUS.md, CHANGELOG.md, DECISIONS.md.
4. **Session 2:** real Anthropic Claude integration — wire `lib/ai/llm.ts` and the FastAPI synthesis endpoint, drop the mock.
5. **Session 3:** auth (NextAuth + Google), Postgres + Redis provisioning, watchlist persistence.

## Open questions for the user

- For the Charting Library application: what legal entity should we list (personal name? a company?)? Do you have a public project URL ready to provide, or should we defer the submission until after a marketing landing page exists?
- Hosting region preference: Vercel default (US-East) or India-region for lower latency on NSE/BSE users?
- Anthropic API key: do you have one already, or should we plan for a sign-up step before session 2?
