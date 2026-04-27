# CHANGELOG.md

> Human-readable changelog by date. Newest first.

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
