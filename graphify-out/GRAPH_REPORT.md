# Graph Report - .  (2026-04-29)

## Corpus Check
- 122 files · ~89,865 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 467 nodes · 516 edges · 52 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 79 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Pipeline resolve→fundamentals→news→classify→peers→synthesize|Pipeline: resolve→fundamentals→news→classify→peers→synthesize]]
- [[_COMMUNITY_Session 2|Session 2]]
- [[_COMMUNITY__shared.py|_shared.py]]
- [[_COMMUNITY_HorizonCard Component|HorizonCard Component]]
- [[_COMMUNITY_main.py|main.py]]
- [[_COMMUNITY_PROVIDER_CATALOGUE|PROVIDER_CATALOGUE]]
- [[_COMMUNITY_FinAI Project|FinAI Project]]
- [[_COMMUNITY_technical_analysis.py|technical_analysis.py]]
- [[_COMMUNITY_VerdictReport TypeScript Interface|VerdictReport TypeScript Interface]]
- [[_COMMUNITY_toTvSymbol Function|toTvSymbol Function]]
- [[_COMMUNITY_libaillm.ts|lib/ai/llm.ts]]
- [[_COMMUNITY_SEBI + SEC Disclaimer|SEBI + SEC Disclaimer]]
- [[_COMMUNITY_SymbolResult Data Interface|SymbolResult Data Interface]]
- [[_COMMUNITY_StockPage()|StockPage()]]
- [[_COMMUNITY_cn Tailwind Class Merger|cn Tailwind Class Merger]]
- [[_COMMUNITY_apiKey()|apiKey()]]
- [[_COMMUNITY_SymbolSearch.tsx|SymbolSearch.tsx]]
- [[_COMMUNITY_TradingViewWidget()|TradingViewWidget()]]
- [[_COMMUNITY_FastAPI Service Requirements|FastAPI Service Requirements]]
- [[_COMMUNITY_ConfidenceBar()|ConfidenceBar()]]
- [[_COMMUNITY_apiKey()|apiKey()]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_FinnhubQuote Interface|FinnhubQuote Interface]]
- [[_COMMUNITY_FinnhubSearchResult Interface|FinnhubSearchResult Interface]]
- [[_COMMUNITY_System topology diagram|System topology diagram]]
- [[_COMMUNITY_Changelog lightweight-charts integration (2026-04-28)|Changelog: lightweight-charts integration (2026-04-28)]]
- [[_COMMUNITY_Root Layout (applayout.tsx)|Root Layout (app/layout.tsx)]]
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
5. `toTvSymbol Function` - 8 edges
6. `GET()` - 7 edges
7. `create_report()` - 7 edges
8. `VerdictReport TypeScript Interface` - 7 edges
9. `SEBI + SEC Disclaimer` - 7 edges
10. `chat_with_failover()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Groq OpenAI-compatible API (dev LLM)` --semantically_similar_to--> `ANTHROPIC_API_KEY env var`  [INFERRED] [semantically similar]
  services/app/pipeline/_shared.py → docs/ENV_VARIABLES.md
- `Synthesis system prompt (inline _SYSTEM)` --semantically_similar_to--> `SYNTH_SYSTEM_V1 synthesis prompt template`  [EXTRACTED] [semantically similar]
  services/app/pipeline/synthesize.py → docs/PROMPTS.md
- `Tata Motors Symbol Search Dropdown Screenshot` --references--> `toTvSymbol Function`  [INFERRED]
  tata-search.png → lib/data/tv-symbol.ts
- `Benchmark each configured LLM provider on the same fundamental-synthesis prompt` --uses--> `VerdictReport`  [INFERRED]
  services\scripts\rank_providers.py → services\app\models.py
- `Fill ``latency`` (0–10 pts) based on each provider's speed relative to     the s` --uses--> `VerdictReport`  [INFERRED]
  services\scripts\rank_providers.py → services\app\models.py

## Hyperedges (group relationships)
- **LLM Failover Chain (4 providers)** — provider_groq, provider_cerebras, provider_sambanova, provider_openrouter, code_chat_with_failover [EXTRACTED 1.00]
- **FastAPI synthesis pipeline stages** — code_resolve_py, code_fundamentals_py, code_news_py, code_classify_py, code_peers_py, code_synthesize_py [EXTRACTED 1.00]
- **NextAuth + Prisma auth stack** — tech_nextauth, tech_prisma7, code_lib_auth_config_ts, code_lib_auth_config_edge_ts, code_middleware, code_api_register [EXTRACTED 1.00]

## Communities

### Community 0 - "Pipeline: resolve→fundamentals→news→classify→peers→synthesize"
Cohesion: 0.08
Nodes (37): POST /api/reports contract, VerdictReport canonical schema (§6), Data flow for AI report generation, Changelog: Groq LLM integration (2026-04-28), Changelog: FastAPI pipeline + symbol search (2026-04-28), CLAUDE.md — session orientation rulebook, VerdictReport (§6 schema concept), Groq OpenAI-compatible API (dev LLM) (+29 more)

### Community 1 - "Session 2"
Cohesion: 0.08
Nodes (35): Session 1, Session 2, /api/candles/[symbol] route, ChartPanel, classify.py, fundamentals.py, lib/data/finnhub.ts, lib/data/indianapi.ts (+27 more)

### Community 2 - "_shared.py"
Cohesion: 0.09
Nodes (30): _any_provider_configured(), classify_articles(), _classify_one(), Per-article sentiment + relevance classifier using the LLM classifier model. Ski, _active_providers(), chat_with_failover(), close_all_clients(), _get_client() (+22 more)

### Community 3 - "HorizonCard Component"
Cohesion: 0.09
Nodes (29): API Route: GET /api/candles/[symbol], API Route: POST /api/reports, API Route: GET /api/symbols, Home Page (app/page.tsx), ConfidenceBar Component, Disclaimer Component, HorizonCard Component, LightweightChart Component (+21 more)

### Community 4 - "main.py"
Cohesion: 0.09
Nodes (18): create_report(), FinAI research pipeline service — FastAPI.  Session 2: /health + POST /reports (, ReportRequest, technical_analysis(), searchSymbols(), getYahooCandles(), searchYahooSymbols(), fetch_fundamentals() (+10 more)

### Community 5 - "PROVIDER_CATALOGUE"
Cohesion: 0.1
Nodes (26): Session 5, Session 6, /api/watchlist route, chat_with_failover(), load_provider_order(), prisma/schema.prisma, PROVIDER_CATALOGUE, providers.ranked.json (+18 more)

### Community 6 - "FinAI Project"
Cohesion: 0.09
Nodes (25): Caveman Plugin, FinAI Project, Graphify Knowledge Graph, Session 3, /api/auth/register route, lib/auth/config.edge.ts (edge-safe), lib/auth/config.ts (full), lib/prisma.ts (+17 more)

### Community 7 - "technical_analysis.py"
Cohesion: 0.19
Nodes (19): DataSource, Horizon, Horizons, KeyLevels, Pydantic models mirroring the §6 TypeScript VerdictReport schema., TechnicalSignal, TechnicalVerdict, VerdictReport (+11 more)

### Community 8 - "VerdictReport TypeScript Interface"
Cohesion: 0.11
Nodes (22): Badge CVA Variants (bullish/bearish/neutral/insufficient_data), classify_articles Pipeline Step, CandleBar Interface, Finnhub getCandles, fetch_fundamentals Pipeline Step, synthesiseVerdict LLM Adapter, FastAPI Application (main.py), POST /reports Endpoint (+14 more)

### Community 9 - "toTvSymbol Function"
Cohesion: 0.22
Nodes (16): MOCK_VERDICT Export, DISCLAIMER Export from schema.ts, toTvSymbol Function, After-Fix UI Screenshot — AAPL Chart with Rate Limit Error, Tata Motors Symbol Search Dropdown Screenshot, Confidence Percentage Range Test, Disclaimer String Equality Test, Horizon Drivers and Risks Presence Test (+8 more)

### Community 10 - "lib/ai/llm.ts"
Cohesion: 0.19
Nodes (14): Session 4, lib/ai/llm.ts, lib/ai/schema.ts, lib/ai/technical.ts, models.py (Pydantic), Stock detail page, SymbolSearch component, technical_analysis.py (+6 more)

### Community 11 - "SEBI + SEC Disclaimer"
Cohesion: 0.19
Nodes (13): AGENTS.md — Next.js agent warning, Disclaimer component, HorizonCard, VerdictCard, FinAI — product concept, SEBI + SEC Disclaimer, Mobile-first 375px rule, ADR-0001: India + US market scope (+5 more)

### Community 12 - "SymbolResult Data Interface"
Cohesion: 0.22
Nodes (10): IndianSearchResult Interface, IndianAPI searchIndianSymbol, SAMPLE_SYMBOLS Fallback List, SymbolResult Interface (UI), SymbolResult Data Interface, SymbolSearch UI Component, searchSymbols Dispatcher, toTvSymbol Converter (+2 more)

### Community 13 - "StockPage()"
Cohesion: 0.22
Nodes (5): synthesiseVerdict(), synthesiseTechnical(), POST(), exchangeLabel(), StockPage()

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

### Community 31 - "ESLint Config"
Cohesion: 1.0
Nodes (2): ESLint Config, Next.js Config

### Community 32 - "FinnhubQuote Interface"
Cohesion: 1.0
Nodes (2): FinnhubQuote Interface, Finnhub getQuote

### Community 33 - "FinnhubSearchResult Interface"
Cohesion: 1.0
Nodes (2): FinnhubSearchResult Interface, Finnhub searchSymbols

### Community 34 - "System topology diagram"
Cohesion: 1.0
Nodes (2): System topology diagram, ADR-0003: Single monorepo layout

### Community 35 - "Changelog: lightweight-charts integration (2026-04-28)"
Cohesion: 1.0
Nodes (2): Changelog: lightweight-charts integration (2026-04-28), ADR-0006: Yahoo Finance v8 for OHLCV chart data

### Community 63 - "Root Layout (app/layout.tsx)"
Cohesion: 1.0
Nodes (1): Root Layout (app/layout.tsx)

### Community 64 - "VerdictReport Schema (lib/ai/schema.ts)"
Cohesion: 1.0
Nodes (1): VerdictReport Schema (lib/ai/schema.ts)

### Community 65 - "Horizons Pydantic Model"
Cohesion: 1.0
Nodes (1): Horizons Pydantic Model

### Community 66 - "README.md — Next.js project bootstrap"
Cohesion: 1.0
Nodes (1): README.md — Next.js project bootstrap

### Community 67 - "GET /api/symbols/search contract"
Cohesion: 1.0
Nodes (1): GET /api/symbols/search contract

### Community 68 - "GET /health contract (FastAPI)"
Cohesion: 1.0
Nodes (1): GET /health contract (FastAPI)

### Community 69 - "Deploy topology (Vercel + Render/Fly"
Cohesion: 1.0
Nodes (1): Deploy topology (Vercel + Render/Fly + Supabase/Neon + Upstash)

### Community 70 - "Changelog: session 1 kickoff (2026-04-27)"
Cohesion: 1.0
Nodes (1): Changelog: session 1 kickoff (2026-04-27)

### Community 71 - "ADR-0005: TradingView widget MVP →"
Cohesion: 1.0
Nodes (1): ADR-0005: TradingView widget MVP → Charting Library phase 2

### Community 72 - "HTTPX HTTP Client Dependency"
Cohesion: 1.0
Nodes (1): HTTPX HTTP Client Dependency

### Community 73 - "Python Dotenv Dependency"
Cohesion: 1.0
Nodes (1): Python Dotenv Dependency

### Community 74 - "OpenAI SDK Dependency"
Cohesion: 1.0
Nodes (1): OpenAI SDK Dependency

### Community 98 - "Redis (Upstash)"
Cohesion: 1.0
Nodes (1): Redis (Upstash)

### Community 99 - "Vitest 4"
Cohesion: 1.0
Nodes (1): Vitest 4

### Community 100 - "Playwright"
Cohesion: 1.0
Nodes (1): Playwright

### Community 101 - "FastAPI main.py"
Cohesion: 1.0
Nodes (1): FastAPI main.py

### Community 102 - "prisma.config.ts"
Cohesion: 1.0
Nodes (1): prisma.config.ts

### Community 103 - "/api/reports route"
Cohesion: 1.0
Nodes (1): /api/reports route

### Community 104 - "FinAILogo component"
Cohesion: 1.0
Nodes (1): FinAILogo component

### Community 105 - "SYNTH_SYSTEM_V1 prompt"
Cohesion: 1.0
Nodes (1): SYNTH_SYSTEM_V1 prompt

### Community 106 - "CLASSIFY_SYSTEM_V1 prompt"
Cohesion: 1.0
Nodes (1): CLASSIFY_SYSTEM_V1 prompt

### Community 107 - "DATABASE_URL"
Cohesion: 1.0
Nodes (1): DATABASE_URL

### Community 108 - "REDIS_URL"
Cohesion: 1.0
Nodes (1): REDIS_URL

### Community 109 - "EODHD_API_KEY"
Cohesion: 1.0
Nodes (1): EODHD_API_KEY

### Community 110 - "SENTRY_DSN"
Cohesion: 1.0
Nodes (1): SENTRY_DSN

### Community 111 - "RATE_LIMIT_REPORTS_PER_DAY"
Cohesion: 1.0
Nodes (1): RATE_LIMIT_REPORTS_PER_DAY

## Knowledge Gaps
- **126 isolated node(s):** `FinAI research pipeline service — FastAPI.  Session 2: /health + POST /reports (`, `Pydantic models mirroring the §6 TypeScript VerdictReport schema.`, `Per-article sentiment + relevance classifier using the LLM classifier model. Ski`, `Key financial ratios + last 4 quarters from Finnhub. Returns empty dict when FIN`, `Last 90 days of company news from Finnhub. Returns empty list when FINNHUB_API_K` (+121 more)
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
- **Thin community `FinnhubQuote Interface`** (2 nodes): `FinnhubQuote Interface`, `Finnhub getQuote`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FinnhubSearchResult Interface`** (2 nodes): `FinnhubSearchResult Interface`, `Finnhub searchSymbols`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `System topology diagram`** (2 nodes): `System topology diagram`, `ADR-0003: Single monorepo layout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Changelog: lightweight-charts integration (2026-04-28)`** (2 nodes): `Changelog: lightweight-charts integration (2026-04-28)`, `ADR-0006: Yahoo Finance v8 for OHLCV chart data`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Root Layout (app/layout.tsx)`** (1 nodes): `Root Layout (app/layout.tsx)`
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

- **Why does `SEBI + SEC Disclaimer` connect `SEBI + SEC Disclaimer` to `Pipeline: resolve→fundamentals→news→classify→peers→synthesize`, `Session 2`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `ADR-0001 Initial Market Scope (India + US)` connect `Session 2` to `SEBI + SEC Disclaimer`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `Session 1` connect `Session 2` to `FinAI Project`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `FinAI research pipeline service — FastAPI.  Session 2: /health + POST /reports (`, `Pydantic models mirroring the §6 TypeScript VerdictReport schema.`, `Per-article sentiment + relevance classifier using the LLM classifier model. Ski` to the rest of the system?**
  _126 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Pipeline: resolve→fundamentals→news→classify→peers→synthesize` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Session 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `_shared.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._