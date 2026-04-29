# DECISIONS.md

> ADR-style log: every non-trivial decision with date, context, options considered, choice, consequences. Settled ADRs should not be relitigated without a new ADR superseding them.

---

## ADR-0007 — Multi-provider LLM failover with quality-ranked ordering

**Date:** 2026-04-29
**Status:** Accepted

**Context.** FinAI's FastAPI pipeline relied on Groq alone for every LLM call (synthesis, technical, classifier). When Groq's free-tier RPD or TPM quota was exhausted, the user saw `insufficient_data` for all three horizons — observed live on `/stocks/AAPL` after a routine session of testing. Single-provider dependency is also a liability for vendor outages.

Several free-tier providers offer the **same OpenAI Chat Completions API shape** (drop-in `base_url` swap), so we can chain them as a failover sequence behind the existing OpenAI SDK with zero new dependencies.

**Options considered.**
- **Add Anthropic Claude as a paid backup** — no persistent free tier; defers cost to later.
- **Round-robin across providers** — wastes quota on requests that would succeed on the cheapest provider; complicates observability.
- **Quota-aware routing** — needs a Redis counter and book-keeping; premature without observed exhaustion patterns.
- **Ordered failover, quality-ranked** *(chosen)* — pick the highest-quality provider first; on transient error (429/timeout/5xx), drop to next. Quality is benchmarked, not assumed.

**Decision.**
1. **Provider catalogue** in `services/app/pipeline/_shared.py` defining four OpenAI-compatible providers: Groq, Cerebras, SambaNova, OpenRouter. Each has a per-kind model map (`synthesis` 70B, `classifier` 8B).
2. **`chat_with_failover()` helper** wraps `AsyncOpenAI.chat.completions.create()`, walks the active provider list (filters by `<X>_API_KEY` presence), drops to next on `RateLimitError` / `APITimeoutError` / `APIConnectionError` / `InternalServerError`, and **fails fast** on `AuthenticationError` / `BadRequestError` (config bugs).
3. **Quality-ranked order** — `services/scripts/rank_providers.py` benchmarks every active provider on the same fundamental-synthesis prompt for `AAPL` (or any symbol), scores each output (schema validity 25 pts, completeness 20, depth 20, specificity 20, latency 10, confidence calibration 5), and writes `services/providers.ranked.json` (gitignored). The helper loads this file at startup; falls back to a hardcoded default if missing.
4. **Classifier capped at 2 providers** (`max_providers=2`) so per-article classification (10–20 calls per stock report) doesn't burn OpenRouter's 200 RPD on a low-stakes path that already has a graceful neutral fallback.

**Consequences.**
- Combined free quota across 4 providers ≈ **5× single-provider capacity**. Survives single-vendor 429.
- The first hit on a fresh search uses the highest-quality provider per the latest benchmark; later hits gracefully degrade as the top provider's quota burns through the day.
- Each call logs which provider served it (`llm.ok provider=cerebras kind=synthesis symbol=AAPL`), so we can see the chain hopping in real time.
- Pydantic validation already in place catches per-provider JSON drift; existing one-retry logic at each call site stays intact (do not advance providers on bad-JSON 200s — that burns quota).
- **Privacy trade-off:** OpenRouter's free tier may train on prompt data. We send: ticker, computed indicators, public news headlines, public fundamentals — **no PII, no user identifiers**. OpenRouter is last in chain so it's only reached when all other providers 429. Documented here as accepted.
- **Benchmark drift:** the scoring rubric is heuristic, not ground-truth. The user can manually reorder `providers.ranked.json` if intuition disagrees with the score.
- **Re-ranking cadence:** manual today (run `python -m services.scripts.rank_providers` whenever credentials change or model versions update). Schedule via cron when Redis lands in session 5.

**Implementation cost.** ~410 lines added, ~37 changed across 9 files. No new dependencies (reuses `openai` SDK).

**Supersedes.** Sole-Groq dependency in `_shared.py` (legacy `groq_client()` kept as deprecated alias).

---

## ADR-0006 — OHLCV chart data source

**Date:** 2026-04-28
**Status:** Accepted

**Context.** `LightweightChart` needs 1-year daily OHLCV candles for both US and India symbols. Finnhub was the initial candidate but the smoke-check showed its free tier blocks both `/stock/candle` (HTTP 403 paywalled) and NSE/BSE quotes (ADR-0002a).

**Options considered.**
- **Finnhub `/stock/candle`** — discarded, requires paid plan.
- **Alpha Vantage `TIME_SERIES_DAILY`** — 25 requests/day free; too low for any real usage.
- **Polygon.io** — US only, free tier is previous-day data only.
- **TwelveData** — 800 free API calls/day; viable but needs a key and sign-up.
- **Yahoo Finance v8 chart API** — unofficial, free, no key, supports US + India (`.NS`/`.BO`), 1-year daily. Widely used by open-source libraries (yfinance, etc.).

**Decision.** **Yahoo Finance v8 chart API** (`query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1y`). No API key. `lib/data/yahoo.ts` wraps the call; BFF `/api/candles/[symbol]` caches for 1 hour.

**Consequences.**
- India charts now work (RELIANCE.NS, TCS.NS, etc.) — fixes the gap from ADR-0002a for the chart layer.
- No official SLA; Yahoo has historically rate-limited scrapers. Add `User-Agent` header; back off on HTTP 429.
- Upgrade trigger: if Yahoo becomes unreliable, switch to TwelveData (800/day free) or Polygon (US) + IndianAPI.in (India).
- Chart data is **independent** of AI verdict data — verdict still uses Finnhub (US) and will use IndianAPI.in (India) once key is available.

---

## ADR-0001 — Initial market scope

**Date:** 2026-04-27
**Status:** Accepted

**Context.** §15 kickoff requires picking initial market(s). The §6 sample symbol `RELIANCE.NS` and §7 SEBI disclaimer hinted India-first, but the user is willing to take on broader scope.

**Options considered.**
1. NSE/BSE only — smallest scope, fastest to ship; Indian fundamentals data on free tiers is thin.
2. US (NYSE/NASDAQ) only — easiest data layer (Polygon, Finnhub, Alpha Vantage all generous free tiers); SEC-only disclaimer.
3. India + US day one — maximum reach; doubles symbol-resolution complexity, currency formatting, market-hours logic.

**Decision.** Option 3: India + US day one.

**Consequences.**
- Symbol-resolution layer must handle suffixes `.NS` (NSE), `.BO` (BSE), and unsuffixed US tickers.
- Disclaimer references **both** SEBI and SEC.
- Currency formatting is per-symbol (INR vs USD) — no global toggle.
- Market-hours logic is exchange-aware.
- Provider stack must cover both regions (drives ADR-0002).

---

## ADR-0002 — Market data + news provider stack

**Date:** 2026-04-27
**Status:** Accepted

**Context.** Need fundamentals + news + intraday quotes for both NSE/BSE and US, on a "free tier now, identified paid upgrade path" budget.

**Options considered (after web research).**
- **Polygon** — discarded, US-only.
- **Tiingo** — discarded, no native NSE.
- **Marketstack** — discarded, weak fundamentals/news.
- **Alpha Vantage** — discarded, 25/day free unusable, thin NSE.
- **Twelve Data** — discarded, no fundamentals on free.
- **Financial Modeling Prep** — discarded, NSE depth limited.
- **Finnhub** — 60 calls/min free, US + basic NSE, news bodies, basic fundamentals on free.
- **IndianAPI.in** — native NSE/BSE fundamentals + 4-quarter results + news.
- **EODHD ALL-IN-ONE** (~$99.99/mo) — single-vendor paid upgrade covering both.

**Decision.** Free-tier MVP uses **Finnhub as primary** + **IndianAPI.in as India supplement**. Identified paid upgrade is **EODHD ALL-IN-ONE**.

**Upgrade triggers (any one).**
- Finnhub free-tier 60/min ceiling hit > 3× per day.
- A coverage gap in NSE/BSE blocks an AI verdict (e.g., fundamentals missing).
- Projected daily report generation > 50.

**Consequences.**
- `lib/data/` has separate `finnhub.ts` and `indianapi.ts` adapters with a `symbol-search.ts` dispatcher that picks per `.NS`/`.BO`/unsuffixed.
- ADR-0002a will resolve whether Finnhub's free NSE/BSE coverage is usable, after the smoke check in session 1 step C.

---

## ADR-0002a — Finnhub free-tier NSE/BSE coverage

**Date:** 2026-04-28
**Status:** Accepted

**Context.** Needed empirical verification of whether Finnhub free tier covers NSE/BSE before wiring symbol dispatch.

**Smoke-check results (2026-04-28).**
- `AAPL` (US): ✅ `{"c":267.61,"d":-3.45,...}` — full quote returned.
- `RELIANCE.NS` (NSE): ❌ `{"error":"You don't have access to this resource."}` — free tier blocks NSE.

**Decision.** Finnhub free tier covers **US only**. India symbols (`.NS`, `.BO`) must route through **IndianAPI.in** for fundamentals, news, and quotes.

**Consequences.**
- `services/app/pipeline/` Finnhub calls are US-only. India path will be added once `INDIANAPI_API_KEY` is available (session 2 continuation).
- `lib/data/symbol-search.ts` dispatcher already separates by suffix — no architecture change needed, just wire the IndianAPI.in adapter for `.NS`/`.BO` paths.
- Until IndianAPI.in is wired, India symbols return `insufficient_data` (graceful degradation, no fabricated numbers).

---

## ADR-0003 — Repo layout

**Date:** 2026-04-27
**Status:** Accepted

**Context.** PROJECT_INSTRUCTIONS.md §11 shows Next.js at root and FastAPI in `services/`, but doesn't mandate a single repo.

**Options considered.**
1. Single monorepo (Next.js root + `services/` FastAPI).
2. Two separate repos (`finai-web`, `finai-research`).

**Decision.** Option 1: single monorepo.

**Consequences.**
- One git history; one PR per cross-cutting change.
- Type-sharing between TS and Python requires either codegen (e.g., generate Pydantic from Zod) or duplicated definitions kept in sync via API_CONTRACTS.md as canonical source. Will revisit if/when contract drift becomes painful.
- CI will need to detect path changes and run web vs services jobs accordingly (deferred until session 3).

---

## ADR-0004 — Anthropic Claude model selection

**Date:** 2026-04-27
**Status:** Accepted

**Context.** §3 mandates "the latest production model identifiers — never hardcode an old model string." Verified current IDs against https://platform.claude.com/docs/en/about-claude/models/overview on 2026-04-27.

**Decision.**
- **Synthesis (verdict step §5.6):** `claude-opus-4-7` ($5/$25 per MTok, 1M context, 128k max output).
- **Classifier (per-news sentiment §5.4):** `claude-haiku-4-5` ($1/$5 per MTok, 200k context, 64k max output).

**Pinning policy.**
- Both IDs live in env vars `LLM_SYNTHESIS_MODEL` and `LLM_CLASSIFIER_MODEL`. **Never hardcoded in source.**
- All Claude calls go through [`lib/ai/llm.ts`](../lib/ai/llm.ts). Frontend or FastAPI services that need an LLM call import from there or its FastAPI mirror.
- When Anthropic announces a deprecation that touches our pinned IDs, open a new ADR (ADR-0004-bump-N) with the new ID and migration steps.

**Note (deprecation watch).** `claude-opus-4-20250514` and `claude-sonnet-4-20250514` retire 2026-06-15 per Anthropic — neither is used here, but anyone copy-pasting from old Anthropic examples should be redirected to ADR-0004.

---

## ADR-0005 — Charting strategy

**Date:** 2026-04-27
**Status:** Accepted

**Context.** §4 lays out the three TradingView tiers. We need a chart in MVP without waiting on the Charting Library application.

**Decision.**
- **MVP (now):** TradingView Advanced Real-Time Chart **Widget** (free, attribution required, iframe-embedded).
- **Phase 2:** Migrate to **Advanced Charts (Charting Library)** after the application at https://www.tradingview.com/advanced-charts/ is approved (delivered as a private GitHub repo invite).
- **Fallback if license is denied:** Lightweight Charts (Apache-2.0). Feature set is much narrower (no Strategy Tester, no built-in indicator library) — only used if Advanced Charts is unattainable.

**Consequences.**
- Every chart-related component carries the marker comment `// TODO(charting-library): swap widget for self-hosted Advanced Charts once license is approved.` — project-wide grep token.
- Saved chart layouts and Strategy Tester (backtesting) are **not** available until Phase 2 — track in ROADMAP.md.
- Application is gated on having a public commercial-web project URL — see PROJECT_STATUS.md "Open questions".
