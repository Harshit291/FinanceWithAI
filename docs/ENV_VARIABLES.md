# ENV_VARIABLES.md

> Every env var, what it does, where it's used, which environments need it. Updated when env vars change. Mirrors `.env.example` (which lives at repo root with all keys unset).

**Last updated:** 2026-04-29

---

## Required at runtime

| Variable | Purpose | Used in | Required in |
|---|---|---|---|
| `GROQ_API_KEY` | Auth for Groq API (OpenAI-compatible). One of four LLM providers in the failover chain (ADR-0007). | `services/app/pipeline/_shared.py` (PROVIDER_CATALOGUE) | dev (any one provider key required) |
| `CEREBRAS_API_KEY` | Auth for Cerebras Inference. OpenAI-compatible. 1 M tokens/day free tier. | `services/app/pipeline/_shared.py` | optional |
| `SAMBANOVA_API_KEY` | Auth for SambaNova Cloud. OpenAI-compatible. $5 starting credit. | `services/app/pipeline/_shared.py` | optional |
| `OPENROUTER_API_KEY` | Auth for OpenRouter. OpenAI-compatible. **Free tier may train on prompt data** (ADR-0007). Last in failover chain. | `services/app/pipeline/_shared.py` | optional |
| `FASTAPI_URL` | Base URL of the FastAPI pipeline service. Default: `http://localhost:8000`. | `lib/ai/llm.ts` | dev, prod |
| `ANTHROPIC_API_KEY` | Auth for the Claude Messages API (production target). Will join the failover chain when wired. | `lib/ai/llm.ts`, `services/app/pipeline/_shared.py` | prod |
| `LLM_SYNTHESIS_MODEL` | Legacy. Per-provider model names now live in `services/app/pipeline/_shared.py` `PROVIDER_CATALOGUE`. Kept in `.env.example` for backwards compat — not read by the new failover helper. | n/a | optional |
| `LLM_CLASSIFIER_MODEL` | Legacy (same as above). | n/a | optional |
| `FINNHUB_API_KEY` | Primary market-data + news provider (ADR-0002). Free tier 60/min. | `lib/data/finnhub.ts`, `services/app/pipeline/*` | dev, prod |
| `INDIANAPI_API_KEY` | India-deep supplement for NSE/BSE fundamentals (ADR-0002). | `lib/data/indianapi.ts`, `services/app/pipeline/*` | dev, prod |
| `DATABASE_URL` | Postgres connection string (Supabase or Neon — TBD session 3). | `lib/db/*`, `services/app/db.py` | dev, staging, prod |
| `REDIS_URL` | Redis connection string (likely Upstash). Used for pipeline-stage caches and rate limits. | `lib/db/redis.ts`, `services/app/cache.py` | dev, staging, prod |
| `NEXTAUTH_SECRET` | NextAuth.js session encryption key. Generate with `openssl rand -base64 32`. | `lib/auth/*` | dev, prod |
| `NEXTAUTH_URL` | Public canonical URL of the app (e.g., `http://localhost:3000` in dev, the Vercel URL in prod). | `lib/auth/*` | dev, prod |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID. | `lib/auth/*` | dev, prod |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret. | `lib/auth/*` | dev, prod |

## Optional / forthcoming

| Variable | Purpose | Notes |
|---|---|---|
| `SENTRY_DSN` | Error monitoring. | Add when we wire Sentry (session 4). |
| `RATE_LIMIT_REPORTS_PER_DAY` | Per-user daily AI report quota — counts AiReport rows persisted in last 24h rolling window. Default: `20`. Read by `lib/reports/quota.ts`; gates `POST /api/reports` and stock-page synthesis. | Active. Optional. |
| `EODHD_API_KEY` | Set only after upgrading to EODHD ALL-IN-ONE (ADR-0002 paid path). | Triggers the data-layer dispatcher to prefer EODHD. |

## Rules (per PROJECT_INSTRUCTIONS.md §7 and §14)

- **Never** commit `.env*` files. `.gitignore` covers `.env`, `.env.local`, `.env.*.local`.
- **Server-side only.** No `NEXT_PUBLIC_*` for API keys. All third-party keys live in server actions / route handlers / FastAPI env. The browser never sees them.
- **Model IDs are env vars, not constants.** Anywhere in code that needs `claude-opus-4-7` or `claude-haiku-4-5` reads from `LLM_SYNTHESIS_MODEL` / `LLM_CLASSIFIER_MODEL` (§3, §14).
- `.env.example` at the repo root lists every key in this table with empty values, so a fresh clone surfaces what's needed.
