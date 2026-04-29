# CLAUDE.md — FinAI

Auto-loaded every Claude Code session. Full rulebook: [docs/PROJECT_INSTRUCTIONS.md](docs/PROJECT_INSTRUCTIONS.md).

---

## graphify

Knowledge graph at `graphify-out/graph.json` (262 nodes, 284 edges, 19.8x token reduction).
Before answering codebase questions, query the graph instead of reading raw files:
`/graphify query "<question>"` — BFS broad context. `/graphify query "<question>" --dfs` — trace a path.
After code changes: `/graphify . --update` (incremental, only changed files).

## caveman

Caveman plugin active. Respond terse — drop filler, keep all technical substance.
Rules: fragments OK, short synonyms, no pleasantries. Code/commits/PRs written normal.
Switch level: `/caveman lite|full|ultra`. Stop: "normal mode".

---

## When the user says "init" — run this every time

1. **Read** [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) and [docs/TASKS.md](docs/TASKS.md).
2. **Review the current build**: check the repo for anything broken, unfinished, or worth calling out (missing tests, TODO markers, open questions in docs).
3. **Restate** in 2-3 sentences: what is done, what is blocked, what is the immediate next task.
4. **Ask the user one question** before doing anything: "Should I proceed with [next task], or is there something else you'd like to focus on first?"
5. **Only after the user confirms** — show a plan (for tasks touching > 1 file), get approval, then implement.

Never skip steps 3-4. Never start implementing before the user says go.

---

## Currently focused tasks (Session 6)

These are the next ~5 tasks in priority order. Full list: [docs/TASKS.md](docs/TASKS.md).

- [ ] **Saved AI reports** — persist `AiReport` rows (immutable; "refresh" creates a new row). Need: wire `/api/reports` to write to DB after synthesis, `GET /api/reports` to list user's saved reports, history UI on stock page or dedicated page.
- [ ] **Supabase migration** — swap SQLite → Supabase Postgres. Steps: change `provider = "sqlite"` → `provider = "postgresql"` in `prisma/schema.prisma`, swap `@prisma/adapter-better-sqlite3` → `@prisma/adapter-pg`, run `prisma migrate deploy`. User confirmed Supabase as provider.
- [ ] **Run provider benchmark** — once user adds Cerebras/SambaNova/OpenRouter keys to `.env.local`, run `services/.venv/Scripts/python -m services.scripts.rank_providers` to write `services/providers.ranked.json` and unlock failover.
- [ ] **Anthropic API key** — once `ANTHROPIC_API_KEY` is set, add Anthropic as a provider in `PROVIDER_CATALOGUE` (`services/app/pipeline/_shared.py`). One-line registry append.
- [ ] **IndianAPI.in key** — needed to unlock India (`.NS`/`.BO`) verdicts; currently returns `insufficient_data`.

Pre-existing nice-to-haves:
- Middleware matcher is `/app/:path*` but Next.js route groups don't appear in URLs — middleware currently guards nothing. `/watchlist` page-level redirect works fine, but other auth-only routes need explicit gates or a fixed matcher.

Blocked (needs user input before we can start):
- TradingView Charting Library application — need legal entity, project URL, GitHub username. Submit at https://www.tradingview.com/advanced-charts/

---

## What this project is

**FinAI** — mobile-responsive stock research. TradingView chart + AI fundamental verdict (short/medium/long-term stance + confidence score). Markets: **NSE/BSE (India) + NYSE/NASDAQ (US)**, day one.

**Tech stack:** Next.js 16 / React 19 / Tailwind v4 / TypeScript strict | FastAPI (Python) | Prisma 7 + SQLite (dev) → Supabase Postgres (prod) | NextAuth.js v5 | Anthropic Claude API (Groq in dev) | Finnhub + IndianAPI.in.

**Repo layout:**
```
/app/(app)/stocks/[symbol]   ← main feature page
/app/(auth)/login|register   ← auth pages (dark glassmorphism)
/app/api/auth/               ← NextAuth handlers + register endpoint
/components/charts/           ← TradingView widget + LightweightChart
/components/ai-report/        ← verdict cards, confidence bar, disclaimer
/components/auth/             ← LoginForm, RegisterForm
/components/ui/               ← FinAILogo, Badge, Card, Button
/lib/ai/                      ← LLM adapter (llm.ts), Zod schema
/lib/auth/                    ← config.ts (full), config.edge.ts (middleware-safe)
/lib/data/                    ← Yahoo Finance, Finnhub, symbol-search dispatcher
/lib/prisma.ts                ← Prisma singleton (BetterSQLite3 adapter)
/prisma/                      ← schema.prisma + migrations
/prisma.config.ts             ← Prisma 7 connection config (url lives here, not schema)
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
| [lib/auth/config.ts](lib/auth/config.ts) | Full NextAuth config (PrismaAdapter + providers) — import for API routes only |
| [lib/auth/config.edge.ts](lib/auth/config.edge.ts) | Edge-safe NextAuth config (JWT only, no Prisma) — used by middleware |
| [lib/prisma.ts](lib/prisma.ts) | Prisma singleton; BetterSQLite3 adapter (swap to pg for Supabase) |
| [prisma/schema.prisma](prisma/schema.prisma) | DB schema: User, Account, Session, WatchlistItem, AiReport |
| [lib/data/symbol-search.ts](lib/data/symbol-search.ts) | Exchange-aware dispatcher; 15-symbol fallback |
| [lib/ai/technical.ts](lib/ai/technical.ts) | synthesiseTechnical() — calls FastAPI /technical-analysis |
| [components/charts/TechnicalPanel.tsx](components/charts/TechnicalPanel.tsx) | BUY/HOLD/SELL signal cards rendered below chart |
| [services/app/pipeline/technical_analysis.py](services/app/pipeline/technical_analysis.py) | OHLCV fetch → RSI/SMA/MACD compute → LLM synthesis |
| [services/app/pipeline/_shared.py](services/app/pipeline/_shared.py) | PROVIDER_CATALOGUE + chat_with_failover() — multi-provider LLM chain (ADR-0007) |
| [services/scripts/rank_providers.py](services/scripts/rank_providers.py) | Benchmark + rank LLM providers; writes services/providers.ranked.json |
| [app/api/watchlist/route.ts](app/api/watchlist/route.ts) | GET/POST/DELETE watchlist endpoints (auth-gated, 50/user cap) |
| [components/watchlist/WatchlistToggle.tsx](components/watchlist/WatchlistToggle.tsx) | Stock-page Save/Saved toggle with optimistic updates |

---

## Session-end checklist (MANDATORY — do this without being asked, every single session)

**This is non-negotiable. Never end a session without completing all five steps.**

1. Update `CLAUDE.md` — "Currently focused tasks" section must reflect the next session's priorities, not the current one. Update repo layout and key files table if anything changed.
2. Update `docs/PROJECT_STATUS.md` — mark sprint goal done/in-progress, update "Next up", update "Open questions", update "Last updated" date.
3. Update `docs/TASKS.md` — move completed items to ✅, add any newly discovered tasks.
4. Update `docs/CHANGELOG.md` — human-readable entry for what shipped this session.
5. Update any other living doc touched by the session (`DECISIONS.md`, `ARCHITECTURE.md`, `API_CONTRACTS.md`, `PROMPTS.md`, `ENV_VARIABLES.md`).
6. Commit all doc updates as a separate `docs:` commit.
