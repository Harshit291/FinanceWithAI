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

### Pending
- ADR-0002a: Finnhub free-tier NSE/BSE coverage smoke check.
- TradingView Charting Library application submission (awaiting user inputs).
- Repo scaffold (step C).
- `/stocks/[symbol]` feature shell (step D).
