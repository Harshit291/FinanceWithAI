# CLAUDE.md — FinAI

Auto-loaded every Claude Code session. Full rulebook: [docs/PROJECT_INSTRUCTIONS.md](docs/PROJECT_INSTRUCTIONS.md).

---

## When the user says "init" — run this every time

1. **Read** [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) and [docs/TASKS.md](docs/TASKS.md).
2. **Review the current build**: check the repo for anything broken, unfinished, or worth calling out (missing tests, TODO markers, open questions in docs).
3. **Restate** in 2-3 sentences: what is done, what is blocked, what is the immediate next task.
4. **Ask the user one question** before doing anything: "Should I proceed with [next task], or is there something else you'd like to focus on first?"
5. **Only after the user confirms** — show a plan (for tasks touching > 1 file), get approval, then implement.

Never skip steps 3-4. Never start implementing before the user says go.

---

## Currently focused tasks (Session 2)

These are the next ~5 tasks in priority order. Full list: [docs/TASKS.md](docs/TASKS.md).

- [ ] **ADR-0002a:** Finnhub free-tier NSE/BSE smoke check — needs `FINNHUB_API_KEY` in `.env.local`. Once done, update `docs/DECISIONS.md` ADR-0002a and possibly reroute India symbols in `lib/data/symbol-search.ts`.
- [ ] **Real LLM:** install `@anthropic-ai/sdk`, wire `lib/ai/llm.ts` to `claude-opus-4-7` (via `LLM_SYNTHESIS_MODEL` env), add Zod validation on every response.
- [ ] **FastAPI pipeline:** build `services/app/pipeline/` — resolve → fundamentals → news → classify (haiku-4-5) → peers → synthesize (opus-4-7). Full §5 order.
- [ ] **Drop mock:** wire `POST /api/reports` to FastAPI; remove the "Sample report" banner from `VerdictCard.tsx`.
- [ ] **Symbol search input:** add a search box to the `/stocks/[symbol]` page header backed by `GET /api/symbols`.

Blocked (needs user input before we can start):
- TradingView Charting Library application — need legal entity, project URL, GitHub username. Submit at https://www.tradingview.com/advanced-charts/

---

## What this project is

**FinAI** — mobile-responsive stock research. TradingView chart + AI fundamental verdict (short/medium/long-term stance + confidence score). Markets: **NSE/BSE (India) + NYSE/NASDAQ (US)**, day one.

**Tech stack:** Next.js 16 / React 19 / Tailwind v4 / TypeScript strict | FastAPI (Python) | Postgres + Redis (session 3) | Anthropic Claude API | Finnhub + IndianAPI.in.

**Repo layout:**
```
/app/(app)/stocks/[symbol]   ← main feature page
/components/charts/           ← TradingView widget wrapper
/components/ai-report/        ← verdict cards, confidence bar, disclaimer
/lib/ai/                      ← LLM adapter (llm.ts), schema (schema.ts), mock
/lib/data/                    ← Finnhub, IndianAPI.in, symbol-search dispatcher
/services/app/                ← FastAPI pipeline
/docs/                        ← living documents (read first, update last)
```

---

## Non-negotiable rules

- **No fabricated numbers.** Prices, ratios, EPS — never invent. Show "unavailable" instead.
- **Disclaimer always visible.** Every page with AI commentary shows the §6 disclaimer (SEBI + SEC). Never collapsed.
- **Mobile-first.** Verify every screen at 375×667 (iPhone SE) before calling it done.
- **No hardcoded model names.** All Claude calls read `LLM_SYNTHESIS_MODEL` / `LLM_CLASSIFIER_MODEL` from env. Everything goes through `lib/ai/llm.ts`.
- **Secrets in env only.** Never commit `.env.local`. `.env.example` is committed (all keys unset).
- **Plans before code** for tasks touching > 1 file. Show the plan, wait for approval, then implement.
- **`// TODO(charting-library):`** marker on every chart component — grep token for the widget → Charting Library migration.

---

## Key files to know

| File | Purpose |
|---|---|
| [docs/TASKS.md](docs/TASKS.md) | ✅ completed / 🔲 pending task tracker — updated every session |
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | Current sprint goal, blocked, open questions |
| [docs/DECISIONS.md](docs/DECISIONS.md) | ADR log — settled decisions, don't relitigate |
| [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) | §6 verdict schema (canonical) + internal API shapes |
| [docs/PROMPTS.md](docs/PROMPTS.md) | Production prompt templates (SYNTH_SYSTEM_V1, CLASSIFY_SYSTEM_V1) |
| [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) | Every env var, purpose, required environment |
| [lib/ai/schema.ts](lib/ai/schema.ts) | TypeScript §6 VerdictReport types |
| [lib/ai/mock-verdict.ts](lib/ai/mock-verdict.ts) | Static mock verdict (remove in session 2) |
| [lib/data/symbol-search.ts](lib/data/symbol-search.ts) | Exchange-aware dispatcher; 15-symbol fallback |

---

## Session-end checklist (do this without being asked)

After every session that produces changes:
1. Update `docs/TASKS.md` — move completed items to ✅, add any newly discovered tasks.
2. Update `docs/PROJECT_STATUS.md` — new sprint goal, blocked, open questions.
3. Update `docs/CHANGELOG.md` — human-readable entry.
4. Update any other living doc touched by the session (`DECISIONS.md`, `ARCHITECTURE.md`, `API_CONTRACTS.md`, `PROMPTS.md`, `ENV_VARIABLES.md`).
5. Commit the doc updates as a separate `docs:` commit.
