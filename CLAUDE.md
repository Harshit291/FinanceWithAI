# CLAUDE.md — FinAI

This file auto-loads in every Claude Code session in this repo. It is a slim orientation. The full rulebook lives at [docs/PROJECT_INSTRUCTIONS.md](docs/PROJECT_INSTRUCTIONS.md) — read it before doing non-trivial work.

## What this project is

FinAI: a mobile-responsive web app combining TradingView's professional charting with an AI-powered fundamental research engine that issues a structured short / medium / long-term verdict for any listed stock, with a confidence score. Markets covered day-one: **NSE/BSE (India) + NYSE/NASDAQ (US)**.

## Session-start protocol (do this every session)

1. Read [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) — single source of truth for "where are we now".
2. Restate the *current sprint goal* and *next up* in one paragraph. Confirm with the user before coding.
3. Flag any *open questions* in PROJECT_STATUS.md before proceeding.
4. If a decision touches architecture, scope, or stack, check [docs/DECISIONS.md](docs/DECISIONS.md) first — don't relitigate settled ADRs.

## Session-end protocol (do this without being asked)

After any session that produced changes, update:
- [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) — what shipped, what's untested, what's blocked, what's next.
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — human-readable entry by date.
- [docs/DECISIONS.md](docs/DECISIONS.md) — any new ADR.
- Any other living doc that the change touched (`API_CONTRACTS.md`, `PROMPTS.md`, `ENV_VARIABLES.md`, `ROADMAP.md`, `ARCHITECTURE.md`).

## Non-negotiable rules (full list in PROJECT_INSTRUCTIONS.md §1, §7, §14)

- **No fabricated numbers.** Prices, ratios, EPS, returns, news content — never invent. If a value isn't available, the UI shows "unavailable" and the AI verdict marks the field accordingly.
- **Disclaimer everywhere.** Every page that shows a stance, return range, or AI commentary renders the §6 disclaimer (referencing **both** SEBI and SEC because we cover both markets) — visible, not collapsed.
- **Mobile-first.** If it doesn't work cleanly at 375×667, it isn't done. Verify at 375 and 1440 before declaring complete.
- **No hardcoded model names.** All Claude calls go through [lib/ai/llm.ts](lib/ai/llm.ts) and read model IDs from env (`LLM_SYNTHESIS_MODEL`, `LLM_CLASSIFIER_MODEL`).
- **Schema-validate every LLM response** against the §6 verdict shape. One retry, then a graceful error — never let the model invent fields.
- **Never design "log in with TradingView"** flows — that product doesn't exist publicly.
- **Secrets in env only.** `.env.example` lists every key, all unset. Never commit `.env*`.

## How Claude communicates here

- Plans before code for any task touching more than one file.
- One clarifying question at a time when ambiguous.
- Cite reality. If a library version, API, or TradingView feature is uncertain, search the web — don't guess.
- Honesty over agreement, especially on financial-recommendation safety.
- Small reviewable diffs over giant rewrites.
- File paths in code blocks (e.g., `app/(app)/stocks/[symbol]/page.tsx`).

## Folder map (canonical — see PROJECT_INSTRUCTIONS.md §11 for full)

```
/app           # Next.js App Router (frontend + BFF route handlers)
/components    # ui (shadcn) / charts / ai-report
/lib           # ai/ (llm adapter + prompts), data/ (provider clients), db/, auth/
/services      # FastAPI research pipeline (Python)
/docs          # the eight living documents — read first, update last
/tests         # /e2e
```
