# Graph Report - .  (2026-04-29)

## Corpus Check
- 110 files · ~64,319 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 510 nodes · 570 edges · 51 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 93 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Session 2|Session 2]]
- [[_COMMUNITY_main.py|main.py]]
- [[_COMMUNITY_Pipeline resolve→fundamentals→news→classify→peers→synthesize|Pipeline: resolve→fundamentals→news→classify→peers→synthesize]]
- [[_COMMUNITY__shared.py|_shared.py]]
- [[_COMMUNITY_FinAI Project|FinAI Project]]
- [[_COMMUNITY_AiReport Prisma Model|AiReport Prisma Model]]
- [[_COMMUNITY_HorizonCard Component|HorizonCard Component]]
- [[_COMMUNITY_VerdictReport TypeScript Interface|VerdictReport TypeScript Interface]]
- [[_COMMUNITY_PROVIDER_CATALOGUE|PROVIDER_CATALOGUE]]
- [[_COMMUNITY_synthesiseVerdict()|synthesiseVerdict()]]
- [[_COMMUNITY_toTvSymbol Function|toTvSymbol Function]]
- [[_COMMUNITY_SEBI + SEC Disclaimer|SEBI + SEC Disclaimer]]
- [[_COMMUNITY_SymbolResult Data Interface|SymbolResult Data Interface]]
- [[_COMMUNITY_searchSymbols()|searchSymbols()]]
- [[_COMMUNITY_cn Tailwind Class Merger|cn Tailwind Class Merger]]
- [[_COMMUNITY_apiKey()|apiKey()]]
- [[_COMMUNITY_SymbolSearch.tsx|SymbolSearch.tsx]]
- [[_COMMUNITY_TradingViewWidget()|TradingViewWidget()]]
- [[_COMMUNITY_FastAPI Service Requirements|FastAPI Service Requirements]]
- [[_COMMUNITY_ConfidenceBar()|ConfidenceBar()]]
- [[_COMMUNITY_apiKey()|apiKey()]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_FinnhubSearchResult Interface|FinnhubSearchResult Interface]]
- [[_COMMUNITY_FinnhubQuote Interface|FinnhubQuote Interface]]
- [[_COMMUNITY_System topology diagram|System topology diagram]]
- [[_COMMUNITY_Changelog lightweight-charts integration (2026-04-28)|Changelog: lightweight-charts integration (2026-04-28)]]
- [[_COMMUNITY_VerdictReport Schema (libaischema.ts)|VerdictReport Schema (lib/ai/schema.ts)]]
- [[_COMMUNITY_Horizons Pydantic Model|Horizons Pydantic Model]]
- [[_COMMUNITY_README.md — Next.js project bootstrap|README.md — Next.js project bootstrap]]
- [[_COMMUNITY_GET apisymbolssearch contract|GET /api/symbols/search contract]]
- [[_COMMUNITY_GET health contract (FastAPI)|GET /health contract (FastAPI)]]
- [[_COMMUNITY_Deploy topology (Vercel + RenderFly|Deploy topology (Vercel + Render/Fly]]
- [[_COMMUNITY_Changelog session 1 kickoff (2026-04-27)|Changelog: session 1 kickoff (2026-04-27)]]
- [[_COMMUNITY_ADR-0005 TradingView widget MVP →|ADR-0005: TradingView widget MVP →]]
- [[_COMMUNITY_HTTPX HTTP Client Dependency|HTTPX HTTP Client Dependency]]
- [[_COMMUNITY_Python Dotenv Dependency|Python Dotenv Dependency]]
- [[_COMMUNITY_OpenAI SDK Dependency|OpenAI SDK Dependency]]
- [[_COMMUNITY_Redis (Upstash)|Redis (Upstash)]]
- [[_COMMUNITY_Vitest 4|Vitest 4]]
- [[_COMMUNITY_Playwright|Playwright]]
- [[_COMMUNITY_FastAPI main.py|FastAPI main.py]]
- [[_COMMUNITY_prisma.config.ts|prisma.config.ts]]
- [[_COMMUNITY_apireports route|/api/reports route]]
- [[_COMMUNITY_FinAILogo component|FinAILogo component]]
- [[_COMMUNITY_SYNTH_SYSTEM_V1 prompt|SYNTH_SYSTEM_V1 prompt]]
- [[_COMMUNITY_CLASSIFY_SYSTEM_V1 prompt|CLASSIFY_SYSTEM_V1 prompt]]
- [[_COMMUNITY_DATABASE_URL|DATABASE_URL]]
- [[_COMMUNITY_REDIS_URL|REDIS_URL]]
- [[_COMMUNITY_EODHD_API_KEY|EODHD_API_KEY]]
- [[_COMMUNITY_SENTRY_DSN|SENTRY_DSN]]
- [[_COMMUNITY_RATE_LIMIT_REPORTS_PER_DAY|RATE_LIMIT_REPORTS_PER_DAY]]

## God Nodes (most connected - your core abstractions)
1. `Session 2` - 14 edges
2. `FinAI Project` - 11 edges
3. `Session 3` - 10 edges
4. `PROVIDER_CATALOGUE` - 10 edges
5. `AiReport Prisma Model` - 9 edges
6. `toTvSymbol Function` - 8 edges
7. `GET()` - 7 edges
8. `create_report()` - 7 edges
9. `VerdictReport TypeScript Interface` - 7 edges
10. `SEBI + SEC Disclaimer` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Groq OpenAI-compatible API (dev LLM)` --semantically_similar_to--> `ANTHROPIC_API_KEY env var`  [INFERRED] [semantically similar]
  services/app/pipeline/_shared.py → docs/ENV_VARIABLES.md
- `Synthesis system prompt (inline _SYSTEM)` --semantically_similar_to--> `SYNTH_SYSTEM_V1 synthesis prompt template`  [EXTRACTED] [semantically similar]
  services/app/pipeline/synthesize.py → docs/PROMPTS.md
- `Tata Motors Symbol Search Dropdown Screenshot` --references--> `toTvSymbol Function`  [INFERRED]
  tata-search.png → lib/data/tv-symbol.ts
- `200-row per-user cap (oldest-eviction)` --rationale_for--> `AiReport Prisma Model`  [INFERRED]
  lib/reports/persist.ts → prisma/schema.prisma
- `Benchmark each configured LLM provider on the same fundamental-synthesis prompt` --uses--> `VerdictReport`  [INFERRED]
  services\scripts\rank_providers.py → services\app\models.py

## Hyperedges (group relationships)
- **Saved AI Reports stack (session 6)** — ai_report_model, persist_ai_report, api_reports_route, report_history_component, reports_page [EXTRACTED 0.95]
- **Report UI components** — report_history_component, refresh_button_component, report_row_delete_button, verdict_card [EXTRACTED 0.90]
- **Force-refresh flow** — refresh_button_component, api_reports_post, force_refresh_param, synthesise_verdict_fresh [EXTRACTED 0.90]

## Communities

### Community 0 - "Session 2"
Cohesion: 0.06
Nodes (49): Session 1, Session 2, Session 4, /api/candles/[symbol] route, ChartPanel, fundamentals.py, lib/ai/llm.ts, lib/ai/schema.ts (+41 more)

### Community 1 - "main.py"
Cohesion: 0.09
Nodes (33): create_report(), FinAI research pipeline service — FastAPI.  Session 2: /health + POST /reports (, ReportRequest, technical_analysis(), DataSource, Horizon, Horizons, KeyLevels (+25 more)

### Community 2 - "Pipeline: resolve→fundamentals→news→classify→peers→synthesize"
Cohesion: 0.08
Nodes (37): POST /api/reports contract, VerdictReport canonical schema (§6), Data flow for AI report generation, Changelog: Groq LLM integration (2026-04-28), Changelog: FastAPI pipeline + symbol search (2026-04-28), CLAUDE.md — session orientation rulebook, VerdictReport (§6 schema concept), Groq OpenAI-compatible API (dev LLM) (+29 more)

### Community 3 - "_shared.py"
Cohesion: 0.09
Nodes (30): _any_provider_configured(), classify_articles(), _classify_one(), Per-article sentiment + relevance classifier using the LLM classifier model. Ski, _active_providers(), chat_with_failover(), close_all_clients(), _get_client() (+22 more)

### Community 4 - "FinAI Project"
Cohesion: 0.07
Nodes (32): Caveman Plugin, FinAI Project, Graphify Knowledge Graph, Session 3, Session 6, /api/auth/register route, lib/auth/config.edge.ts (edge-safe), lib/auth/config.ts (full) (+24 more)

### Community 5 - "AiReport Prisma Model"
Cohesion: 0.09
Nodes (25): @@index([userId, symbol, createdAt]), AiReport Prisma Model, @@unique([userId, reportId]), DELETE /api/reports, GET /api/reports, POST /api/reports, App layout (nav), force_refresh query param (+17 more)

### Community 6 - "HorizonCard Component"
Cohesion: 0.09
Nodes (29): API Route: GET /api/candles/[symbol], /api/reports route handlers, API Route: GET /api/symbols, Home Page (app/page.tsx), ConfidenceBar Component, Disclaimer Component, HorizonCard Component, LightweightChart Component (+21 more)

### Community 7 - "VerdictReport TypeScript Interface"
Cohesion: 0.11
Nodes (22): Badge CVA Variants (bullish/bearish/neutral/insufficient_data), classify_articles Pipeline Step, CandleBar Interface, Finnhub getCandles, fetch_fundamentals Pipeline Step, synthesiseVerdict LLM Adapter, FastAPI Application (main.py), POST /reports Endpoint (+14 more)

### Community 8 - "PROVIDER_CATALOGUE"
Cohesion: 0.15
Nodes (19): Session 5, /api/watchlist route, chat_with_failover(), classify.py, PROVIDER_CATALOGUE, synthesize.py, /watchlist page, WatchlistRemoveButton component (+11 more)

### Community 9 - "synthesiseVerdict()"
Cohesion: 0.17
Nodes (10): callFastapi(), synthesiseVerdict(), synthesiseVerdictFresh(), synthesiseTechnical(), persistAiReport(), DELETE(), GET(), POST() (+2 more)

### Community 10 - "toTvSymbol Function"
Cohesion: 0.22
Nodes (16): MOCK_VERDICT Export, DISCLAIMER Export from schema.ts, toTvSymbol Function, After-Fix UI Screenshot — AAPL Chart with Rate Limit Error, Tata Motors Symbol Search Dropdown Screenshot, Confidence Percentage Range Test, Disclaimer String Equality Test, Horizon Drivers and Risks Presence Test (+8 more)

### Community 11 - "SEBI + SEC Disclaimer"
Cohesion: 0.19
Nodes (13): AGENTS.md — Next.js agent warning, Disclaimer component, HorizonCard, VerdictCard, FinAI — product concept, SEBI + SEC Disclaimer, Mobile-first 375px rule, ADR-0001: India + US market scope (+5 more)

### Community 12 - "SymbolResult Data Interface"
Cohesion: 0.22
Nodes (10): IndianSearchResult Interface, IndianAPI searchIndianSymbol, SAMPLE_SYMBOLS Fallback List, SymbolResult Interface (UI), SymbolResult Data Interface, SymbolSearch UI Component, searchSymbols Dispatcher, toTvSymbol Converter (+2 more)

### Community 13 - "searchSymbols()"
Cohesion: 0.29
Nodes (4): searchSymbols(), getYahooCandles(), searchYahooSymbols(), GET()

### Community 14 - "cn Tailwind Class Merger"
Cohesion: 0.29
Nodes (7): Badge Component, Button Component, Card Component, CardContent Component, CardHeader Component, CardTitle Component, cn Tailwind Class Merger

### Community 15 - "apiKey()"
Cohesion: 0.7
Nodes (4): apiKey(), getCandles(), getQuote(), searchSymbols()

### Community 16 - "SymbolSearch.tsx"
Cohesion: 0.67
Nodes (2): navigate(), onKeyDown()

### Community 17 - "TradingViewWidget()"
Cohesion: 0.5
Nodes (2): TradingViewWidget(), toTvSymbol()

### Community 18 - "FastAPI Service Requirements"
Cohesion: 0.5
Nodes (4): Chart Error Screenshot — FastAPI 500 Runtime Error in llm.ts, FastAPI Service Requirements, Pydantic Data Validation Dependency, Uvicorn ASGI Server Dependency

### Community 19 - "ConfidenceBar()"
Cohesion: 1.0
Nodes (2): ConfidenceBar(), confidenceColor()

### Community 20 - "apiKey()"
Cohesion: 1.0
Nodes (2): apiKey(), searchIndianSymbol()

### Community 32 - "ESLint Config"
Cohesion: 1.0
Nodes (2): ESLint Config, Next.js Config

### Community 33 - "FinnhubSearchResult Interface"
Cohesion: 1.0
Nodes (2): FinnhubSearchResult Interface, Finnhub searchSymbols

### Community 34 - "FinnhubQuote Interface"
Cohesion: 1.0
Nodes (2): FinnhubQuote Interface, Finnhub getQuote

### Community 35 - "System topology diagram"
Cohesion: 1.0
Nodes (2): System topology diagram, ADR-0003: Single monorepo layout

### Community 36 - "Changelog: lightweight-charts integration (2026-04-28)"
Cohesion: 1.0
Nodes (2): Changelog: lightweight-charts integration (2026-04-28), ADR-0006: Yahoo Finance v8 for OHLCV chart data

### Community 66 - "VerdictReport Schema (lib/ai/schema.ts)"
Cohesion: 1.0
Nodes (1): VerdictReport Schema (lib/ai/schema.ts)

### Community 67 - "Horizons Pydantic Model"
Cohesion: 1.0
Nodes (1): Horizons Pydantic Model

### Community 68 - "README.md — Next.js project bootstrap"
Cohesion: 1.0
Nodes (1): README.md — Next.js project bootstrap

### Community 69 - "GET /api/symbols/search contract"
Cohesion: 1.0
Nodes (1): GET /api/symbols/search contract

### Community 70 - "GET /health contract (FastAPI)"
Cohesion: 1.0
Nodes (1): GET /health contract (FastAPI)

### Community 71 - "Deploy topology (Vercel + Render/Fly"
Cohesion: 1.0
Nodes (1): Deploy topology (Vercel + Render/Fly + Supabase/Neon + Upstash)

### Community 72 - "Changelog: session 1 kickoff (2026-04-27)"
Cohesion: 1.0
Nodes (1): Changelog: session 1 kickoff (2026-04-27)

### Community 73 - "ADR-0005: TradingView widget MVP →"
Cohesion: 1.0
Nodes (1): ADR-0005: TradingView widget MVP → Charting Library phase 2

### Community 74 - "HTTPX HTTP Client Dependency"
Cohesion: 1.0
Nodes (1): HTTPX HTTP Client Dependency

### Community 75 - "Python Dotenv Dependency"
Cohesion: 1.0
Nodes (1): Python Dotenv Dependency

### Community 76 - "OpenAI SDK Dependency"
Cohesion: 1.0
Nodes (1): OpenAI SDK Dependency

### Community 100 - "Redis (Upstash)"
Cohesion: 1.0
Nodes (1): Redis (Upstash)

### Community 101 - "Vitest 4"
Cohesion: 1.0
Nodes (1): Vitest 4

### Community 102 - "Playwright"
Cohesion: 1.0
Nodes (1): Playwright

### Community 103 - "FastAPI main.py"
Cohesion: 1.0
Nodes (1): FastAPI main.py

### Community 104 - "prisma.config.ts"
Cohesion: 1.0
Nodes (1): prisma.config.ts

### Community 105 - "/api/reports route"
Cohesion: 1.0
Nodes (1): /api/reports route

### Community 106 - "FinAILogo component"
Cohesion: 1.0
Nodes (1): FinAILogo component

### Community 107 - "SYNTH_SYSTEM_V1 prompt"
Cohesion: 1.0
Nodes (1): SYNTH_SYSTEM_V1 prompt

### Community 108 - "CLASSIFY_SYSTEM_V1 prompt"
Cohesion: 1.0
Nodes (1): CLASSIFY_SYSTEM_V1 prompt

### Community 109 - "DATABASE_URL"
Cohesion: 1.0
Nodes (1): DATABASE_URL

### Community 110 - "REDIS_URL"
Cohesion: 1.0
Nodes (1): REDIS_URL

### Community 111 - "EODHD_API_KEY"
Cohesion: 1.0
Nodes (1): EODHD_API_KEY

### Community 112 - "SENTRY_DSN"
Cohesion: 1.0
Nodes (1): SENTRY_DSN

### Community 113 - "RATE_LIMIT_REPORTS_PER_DAY"
Cohesion: 1.0
Nodes (1): RATE_LIMIT_REPORTS_PER_DAY

## Knowledge Gaps
- **133 isolated node(s):** `FinAI research pipeline service — FastAPI.  Session 2: /health + POST /reports (`, `Pydantic models mirroring the §6 TypeScript VerdictReport schema.`, `Per-article sentiment + relevance classifier using the LLM classifier model. Ski`, `Key financial ratios + last 4 quarters from Finnhub. Returns empty dict when FIN`, `Last 90 days of company news from Finnhub. Returns empty list when FINNHUB_API_K` (+128 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `SymbolSearch.tsx`** (4 nodes): `SymbolSearch.tsx`, `navigate()`, `onClickOutside()`, `onKeyDown()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TradingViewWidget()`** (4 nodes): `TradingViewWidget()`, `TradingViewWidget.tsx`, `toTvSymbol()`, `tv-symbol.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ConfidenceBar()`** (3 nodes): `ConfidenceBar()`, `confidenceColor()`, `ConfidenceBar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `apiKey()`** (3 nodes): `apiKey()`, `searchIndianSymbol()`, `indianapi.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (2 nodes): `ESLint Config`, `Next.js Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FinnhubSearchResult Interface`** (2 nodes): `FinnhubSearchResult Interface`, `Finnhub searchSymbols`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FinnhubQuote Interface`** (2 nodes): `FinnhubQuote Interface`, `Finnhub getQuote`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `System topology diagram`** (2 nodes): `System topology diagram`, `ADR-0003: Single monorepo layout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Changelog: lightweight-charts integration (2026-04-28)`** (2 nodes): `Changelog: lightweight-charts integration (2026-04-28)`, `ADR-0006: Yahoo Finance v8 for OHLCV chart data`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `VerdictReport Schema (lib/ai/schema.ts)`** (1 nodes): `VerdictReport Schema (lib/ai/schema.ts)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Horizons Pydantic Model`** (1 nodes): `Horizons Pydantic Model`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `README.md — Next.js project bootstrap`** (1 nodes): `README.md — Next.js project bootstrap`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `GET /api/symbols/search contract`** (1 nodes): `GET /api/symbols/search contract`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `GET /health contract (FastAPI)`** (1 nodes): `GET /health contract (FastAPI)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Deploy topology (Vercel + Render/Fly`** (1 nodes): `Deploy topology (Vercel + Render/Fly + Supabase/Neon + Upstash)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Changelog: session 1 kickoff (2026-04-27)`** (1 nodes): `Changelog: session 1 kickoff (2026-04-27)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ADR-0005: TradingView widget MVP →`** (1 nodes): `ADR-0005: TradingView widget MVP → Charting Library phase 2`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HTTPX HTTP Client Dependency`** (1 nodes): `HTTPX HTTP Client Dependency`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Python Dotenv Dependency`** (1 nodes): `Python Dotenv Dependency`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `OpenAI SDK Dependency`** (1 nodes): `OpenAI SDK Dependency`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Redis (Upstash)`** (1 nodes): `Redis (Upstash)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest 4`** (1 nodes): `Vitest 4`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Playwright`** (1 nodes): `Playwright`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FastAPI main.py`** (1 nodes): `FastAPI main.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `prisma.config.ts`** (1 nodes): `prisma.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `/api/reports route`** (1 nodes): `/api/reports route`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FinAILogo component`** (1 nodes): `FinAILogo component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SYNTH_SYSTEM_V1 prompt`** (1 nodes): `SYNTH_SYSTEM_V1 prompt`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CLASSIFY_SYSTEM_V1 prompt`** (1 nodes): `CLASSIFY_SYSTEM_V1 prompt`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DATABASE_URL`** (1 nodes): `DATABASE_URL`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `REDIS_URL`** (1 nodes): `REDIS_URL`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `EODHD_API_KEY`** (1 nodes): `EODHD_API_KEY`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SENTRY_DSN`** (1 nodes): `SENTRY_DSN`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `RATE_LIMIT_REPORTS_PER_DAY`** (1 nodes): `RATE_LIMIT_REPORTS_PER_DAY`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SEBI + SEC Disclaimer` connect `SEBI + SEC Disclaimer` to `Session 2`, `Pipeline: resolve→fundamentals→news→classify→peers→synthesize`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `ADR-0001 Initial Market Scope (India + US)` connect `Session 2` to `SEBI + SEC Disclaimer`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `AiReport Prisma Model` (e.g. with `GET /api/reports` and `DELETE /api/reports`) actually correct?**
  _`AiReport Prisma Model` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `FinAI research pipeline service — FastAPI.  Session 2: /health + POST /reports (`, `Pydantic models mirroring the §6 TypeScript VerdictReport schema.`, `Per-article sentiment + relevance classifier using the LLM classifier model. Ski` to the rest of the system?**
  _133 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Session 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Pipeline: resolve→fundamentals→news→classify→peers→synthesize` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._