# PROJECT INSTRUCTIONS — Finance with AI (FinAI)

> This is the canonical, evergreen rulebook for the FinAI project. It was originally written for the Anthropic claude.ai "Project Instructions" field. In this Claude Code repo it lives here, and [CLAUDE.md](../CLAUDE.md) auto-loads a slim orientation that points back to this file. Update the "Living Documents" section (§9) whenever architecture, scope, or stack decisions change.

---

## 1. PROJECT IDENTITY

**Product name (working):** FinAI
**One-line pitch:** A mobile-responsive web app that combines TradingView's professional charting (technicals, indicators, backtesting, Pine Script) with an AI-powered fundamental research engine that issues a structured short / medium / long-term outlook for any listed stock, with a confidence score.

**Target user:** Retail traders and investors who want institutional-grade technical tooling and AI-synthesized fundamental research in one place, on desktop or phone.

**Non-negotiable principles:**
- Mobile-first responsive UI. If it doesn't work cleanly on a 375px viewport, it isn't done.
- Every AI output that touches money must show its sources, its reasoning, its confidence, and a clear "not financial advice" disclaimer.
- No fabricated numbers. If data isn't available, the UI says so — it never guesses a price, EPS, or return.
- Performance budget: First Contentful Paint < 2s on a mid-tier mobile on 4G. Lazy-load charts and AI panels.

---

## 2. SCOPE — WHAT WE ARE AND ARE NOT BUILDING

### In scope (MVP)
1. **Stock search + watchlist** (symbol search across NSE/BSE/NYSE/NASDAQ — pick your initial market in `decisions.md`).
2. **Technical analysis surface** powered by TradingView:
   - Embedded **Advanced Real-Time Chart Widget** as the default (no licensing friction).
   - Upgrade path to **Charting Library / Advanced Charts** (self-hosted) once a license is approved — required for custom data feeds, saved layouts, and Pine-like custom indicators.
   - Indicator library, drawing tools, multi-timeframe.
3. **AI Fundamental Research Engine** per stock, producing:
   - Company snapshot (sector, market cap, key ratios — pulled from a real data API, never invented).
   - News sentiment digest (last 7 / 30 / 90 days, with source links).
   - Earnings & results summary (last 4 quarters, YoY/QoQ deltas).
   - Peer comparison (3–5 peers on key ratios).
   - **Final structured verdict** with the schema in §6.
4. **Auth**: email + password and Google OAuth. **No** "log in with TradingView" — that product doesn't exist publicly (see §4).
5. **User dashboard**: watchlist, recent AI reports, saved chart layouts (when Charting Library is live).
6. **Mobile responsive** across all screens.

### Explicitly out of scope (do not build unless the user says so in chat)
- Real money order execution / brokerage integration.
- Pine Script *authoring* UI inside our app (TradingView's editor is theirs; we surface widgets that already include their tools).
- Backtesting *engine* of our own — we surface TradingView's Strategy Tester via the Charting Library; we do not write a backtester from scratch in MVP.
- Social features, copy trading, paper trading.
- Crypto and forex (can be added post-MVP).

If a request would expand scope, Claude must flag it as a scope change, propose adding it to `roadmap.md`, and ask for confirmation before coding.

---

## 3. TECH STACK (default — change only via a logged decision in `decisions.md`)

- **Frontend:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui.
- **State:** React Query for server state, Zustand for local UI state. No Redux.
- **Backend:** Next.js Route Handlers for the BFF layer; a separate FastAPI (Python) service for the AI/research pipeline (LLM calls, news scraping, ratio crunching, caching).
- **Database:** PostgreSQL (Supabase or Neon) for users, watchlists, cached AI reports. Redis for hot caches and rate limiting.
- **Auth:** NextAuth.js (Auth.js) with email/password + Google.
- **AI:** Anthropic Claude API as primary LLM. Use the latest production model identifiers — never hardcode an old model string. Wrap all calls behind a single `llm.ts` adapter so the model is swappable.
- **Market data:** A licensed provider (e.g., a real fundamentals + news API — to be chosen and recorded in `decisions.md`). Never scrape data the ToS forbids.
- **Charts:** TradingView Advanced Real-Time Chart Widget (Phase 1) → Charting Library (Phase 2, after license approval).
- **Hosting:** Vercel (frontend), Render or Fly.io (FastAPI), managed Postgres + Redis.
- **Testing:** Vitest + React Testing Library (unit), Playwright (E2E on critical flows: login, search, AI report generation).

---

## 4. TRADINGVIEW INTEGRATION — THE TRUTH

Claude must not pretend TradingView offers things it doesn't. Here are the real options, in order of friction:

| Option | Cost | What you get | What you DON'T get |
|---|---|---|---|
| **Widgets** (Advanced Chart, Symbol Overview, Technical Analysis, Screener, Ticker Tape) | Free, attribution required | Full TradingView UI inside an iframe, all built-in indicators, drawing tools | No custom data feed, no programmatic access to chart state, can't save user layouts to *our* DB |
| **Advanced Charts / Charting Library** | Free for non-commercial; commercial use requires written permission from TradingView | Self-hosted JS library, custom data feeds via UDF/JS API, save/load layouts, Strategy Tester for backtesting, custom studies | Pine Script editor is NOT included — Pine is proprietary to tradingview.com |
| **Trading Platform** | Paid, enterprise | Full broker integration, order routing | Heavy compliance lift |

**Decision for MVP:** Start with Widgets. In parallel, **submit the Charting Library application on day one** at the official TradingView page (approval can take weeks). When approved, migrate. There is **no "login with TradingView account"** — do not design flows that depend on it. If a user wants their TradingView watchlist, the workaround is manual symbol entry or CSV import.

Claude must add a banner in any chart-related component: `// TODO(charting-library): swap widget for self-hosted Advanced Charts once license is approved.`

---

## 5. AI FUNDAMENTAL RESEARCH PIPELINE

For any stock, the pipeline must run in this order. Each stage caches its output (Redis, TTL per stage) so a re-run on the same stock within the TTL is cheap.

1. **Resolve symbol** → exchange + ticker + company metadata. (TTL: 30 days)
2. **Fetch fundamentals** → key ratios, last 4 quarters of results, balance sheet basics, ownership. (TTL: 24h, force-refresh on earnings day)
3. **Fetch news** → last 90 days of headlines + summaries from a real news API. Deduplicate. (TTL: 1h)
4. **Per-news sentiment + relevance scoring** → cheap LLM call or a classifier; tag each article (bullish/bearish/neutral, high/medium/low relevance).
5. **Peer set** → 3–5 sector peers with the same ratios. (TTL: 7 days)
6. **Synthesis** → a single Claude call with a strict structured-output schema (§6). The prompt to Claude must include all data verbatim, and explicitly instruct: *"Use only the data provided. If a field is missing, mark it 'unavailable'. Do not invent numbers. Show your reasoning."*
7. **Persist report** with timestamp, input hashes, and model version. Reports are immutable; a "refresh" creates a new report row.

**Hard rule:** The synthesis step must never receive instructions like "be bullish" or "find reasons to buy." The system prompt is neutral and analytical. Bias = bug.

---

## 6. AI VERDICT — STRUCTURED OUTPUT SCHEMA

Every report ends with a verdict object. The schema is fixed; never let the model invent fields.

```json
{
  "report_id": "uuid",
  "symbol": "RELIANCE.NS",
  "as_of": "ISO-8601 timestamp",
  "model": "claude-...-version",
  "data_sources": [{ "name": "string", "url": "string", "fetched_at": "ISO-8601" }],
  "horizons": {
    "short_term":  { "window": "1-4 weeks",   "stance": "bullish|neutral|bearish|insufficient_data", "expected_return_pct_range": [number, number] | null, "confidence_pct": 0-100, "key_drivers": ["string"], "key_risks": ["string"] },
    "medium_term": { "window": "1-6 months",  "stance": "...", "expected_return_pct_range": "...", "confidence_pct": 0-100, "key_drivers": [], "key_risks": [] },
    "long_term":   { "window": "1-3 years",   "stance": "...", "expected_return_pct_range": "...", "confidence_pct": 0-100, "key_drivers": [], "key_risks": [] }
  },
  "summary_paragraph": "string, max 120 words, plain English",
  "disclaimer": "Not investment advice. Educational research only. Past performance is not indicative of future results. Consult a SEBI/SEC-registered advisor before investing."
}
```

**UI contract:** every horizon card on the frontend must render the `confidence_pct` as a visible number AND a colored bar, must list at least one driver and one risk, and must link out to the `data_sources`. If `stance == "insufficient_data"`, the card greys out the return range and shows *why* data was insufficient.

---

## 7. SECURITY, COMPLIANCE, AND DISCLAIMERS

- Every page that shows a stance, return range, or AI commentary must render the disclaimer string from §6 — visible, not collapsed.
- No PII in logs. Hash user IDs in analytics.
- Secrets in environment variables only. Never commit `.env*`. The repo must contain a `.env.example` with every key listed but unset.
- Rate-limit the AI report endpoint per user (e.g., 20/day on free tier) to control LLM cost. Show the remaining quota in the UI.
- Store API keys for the LLM and data providers server-side only. The browser must never see them.
- GDPR/DPDP basics: data export and account deletion endpoints from MVP.

---

## 8. MOBILE-RESPONSIVE REQUIREMENTS (NON-NEGOTIABLE)

- Tailwind breakpoints: design for `sm` first, scale up.
- Charts: on viewports < 640px, the TradingView widget must use a reduced toolbar (`hide_side_toolbar: true`, `hide_top_toolbar: false` only on the essential buttons) and a stacked layout below the AI panel — not side-by-side.
- Tap targets ≥ 44×44px.
- Test every new screen at 375×667 (iPhone SE) and 390×844 (iPhone 14) before declaring it done. Claude must explicitly confirm this in the PR/commit notes.
- No horizontal scroll anywhere except inside intentionally scrollable tables.

---

## 9. PROJECT MANAGEMENT — LIVING DOCUMENTS (READ THESE EVERY SESSION)

The repo's `/docs` folder contains files that act as the project's memory across Claude chat sessions. **At the start of every new chat in this project, Claude must:**

1. Ask the user to paste (or attach) the current contents of these files if not already present in context.
2. Read them before writing any code.
3. Update them at the end of any session that changes the project.

| File | Purpose | Updated when |
|---|---|---|
| `docs/PROJECT_STATUS.md` | The single source of truth for "where are we right now". Sections: *Current sprint goal, Last session summary, In progress, Blocked, Next up, Open questions for the user.* | End of every working session |
| `docs/ARCHITECTURE.md` | High-level diagram (in text or Mermaid), folder layout, data flow, deploy topology | When architecture changes |
| `docs/DECISIONS.md` | ADR-style log: every non-trivial decision with date, context, options considered, choice, consequences | Every decision |
| `docs/ROADMAP.md` | Ordered backlog of features with status (idea → planned → in progress → done). MVP first, post-MVP second. | When scope changes |
| `docs/CHANGELOG.md` | Human-readable changelog by date | Every shipped change |
| `docs/API_CONTRACTS.md` | Exact request/response shapes for every internal API and the AI report schema | When any contract changes |
| `docs/PROMPTS.md` | Every system prompt and user prompt template the app sends to Claude in production, with version numbers | When prompts change |
| `docs/ENV_VARIABLES.md` | Every env var, what it does, where it's used, which environments need it | When env vars change |

**Session-end protocol (Claude must do this without being asked, at the end of any session that produced changes):**
> "Here are the updates to apply to the living documents:
> - `PROJECT_STATUS.md`: …
> - `DECISIONS.md`: …
> - `CHANGELOG.md`: …
> Please paste these into the files (or let me know if you want a single combined diff)."

**Session-start protocol (Claude must run this checklist before any new work):**
1. Confirm the latest `PROJECT_STATUS.md` is in context. If not, ask for it.
2. Restate the *current sprint goal* and *next up* in one paragraph so the user can confirm we're aligned.
3. Flag any *open questions for the user* before coding.

---

## 10. CODE QUALITY STANDARDS

- TypeScript strict mode on. No `any` without a `// eslint-disable` line that explains why.
- All AI calls go through `lib/ai/llm.ts`. All market-data calls through `lib/data/`. No direct `fetch` to third parties from components.
- Components: max ~200 lines. If bigger, decompose.
- Co-locate tests next to source files (`Foo.tsx` + `Foo.test.tsx`).
- Use the `Result<T, E>` pattern (or `neverthrow`) for any I/O that can fail. No swallowed errors.
- Every public function gets a JSDoc one-liner.
- Accessibility: semantic HTML, `aria-*` where needed, color contrast AA minimum. Charts get text-alternative summaries (the AI summary paragraph can serve double duty).

---

## 11. FOLDER STRUCTURE (default)

```
/app                  # Next.js App Router
  /(marketing)        # public pages
  /(app)              # authed pages
    /dashboard
    /stocks/[symbol]  # the workhorse: chart + AI panel
  /api                # route handlers (BFF)
/components
  /ui                 # shadcn primitives
  /charts             # TradingView wrappers
  /ai-report          # verdict cards, source list, confidence bar
/lib
  /ai                 # llm adapter, prompt templates, schema validators
  /data               # market data clients, news clients
  /db                 # prisma/drizzle
  /auth
/services             # FastAPI service for the research pipeline
  /pipeline
  /prompts
  /tests
/docs                 # the living documents from §9
/tests
  /e2e
```

---

## 12. HOW CLAUDE SHOULD COMMUNICATE IN THIS PROJECT

- **Default to plans before code** for any task that touches more than one file. Show the plan, get a yes, then code.
- **Ask one clarifying question at a time** when something is ambiguous — don't bury me in five.
- **Cite reality.** If a library version, an API, or a TradingView feature is uncertain, search the web before answering. Don't guess.
- **Honesty over agreement.** If my idea is bad or unsafe (especially around financial recommendations), say so plainly with reasons. Don't sycophant.
- **Small diffs.** Prefer many small reviewable changes over one giant rewrite.
- **Show file paths** in code blocks: ` ```ts // app/stocks/[symbol]/page.tsx `.
- **End every coding session** by listing what changed, what's untested, and what to update in the living documents.

---

## 13. DEFINITION OF DONE (per feature)

A feature is "done" only when *all* of these are true:
- [ ] Works on desktop (1440px) and mobile (375px) — verified by Claude in the response.
- [ ] No TypeScript errors, no ESLint errors.
- [ ] Has at least one unit test for non-trivial logic; critical user flows have an E2E test.
- [ ] All user-facing strings are clean English, no Lorem Ipsum, no console.logs left behind.
- [ ] AI outputs (if any) include sources + disclaimer + confidence.
- [ ] `PROJECT_STATUS.md`, `CHANGELOG.md`, and any other relevant living doc are updated.
- [ ] No secrets in code or commits.

---

## 14. ANTI-PATTERNS — DO NOT DO THESE

- Do not invent market data, prices, ratios, or news content.
- Do not hardcode model names — read from env / config.
- Do not promise users guaranteed returns. Frame everything as a *signal*, not advice.
- Do not design flows that assume "log in with TradingView" — it does not exist.
- Do not let the LLM choose the schema. The app validates every response against §6 and rejects malformed outputs (with one retry, then a graceful error).
- Do not skip the living-document updates because "it's a small change". Small undocumented changes are how projects rot.
- Do not add a new dependency without recording it in `DECISIONS.md` with a one-line justification.

---

## 15. FIRST-SESSION KICKOFF CHECKLIST (run this once)

When I start the very first chat in this project, before any code, walk me through:
1. Picking the initial market (NSE/BSE only? Add US? Pick one to start.)
2. Picking the market-data + news provider (pros/cons of 2–3 realistic options with current pricing — search the web).
3. Submitting the TradingView Charting Library application (give me the link and a checklist of what they ask).
4. Creating the eight files in `/docs` from §9 with starter content.
5. Scaffolding the Next.js + FastAPI repos with the folder structure from §11.

Then, and only then, the first feature: **stock search + symbol page with embedded TradingView widget + a mocked AI report card** (real LLM integration follows in session 2).

---

*End of project instructions. When in doubt, re-read §1 (principles) and §14 (anti-patterns).*
