# ENV_VARIABLES.md

> Every env var, what it does, where it's used, which environments need it. Updated when env vars change. Mirrors `.env.example` (which lives at repo root with all keys unset).

**Last updated:** 2026-04-27

---

## Required at runtime

| Variable | Purpose | Used in | Required in |
|---|---|---|---|
| `GROQ_API_KEY` | Auth for Groq API (OpenAI-compatible). Used in dev until `ANTHROPIC_API_KEY` is available. | `lib/ai/llm.ts` | dev |
| `ANTHROPIC_API_KEY` | Auth for the Claude Messages API (production target). Replace Groq key when available. | `lib/ai/llm.ts`, `services/app/pipeline/synthesis.py` | prod |
| `LLM_SYNTHESIS_MODEL` | Model ID for the per-stock synthesis call (§5.6). Dev default: `llama-3.3-70b-versatile`. Prod default: `claude-opus-4-7` (ADR-0004). Never hardcoded. | same as above | dev, prod |
| `LLM_CLASSIFIER_MODEL` | Model ID for the per-news classifier call (§5.4). Dev default: `llama-3.1-8b-instant`. Prod default: `claude-haiku-4-5` (ADR-0004). Never hardcoded. | `services/app/pipeline/classify.py` | dev, prod |
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
| `RATE_LIMIT_REPORTS_PER_DAY` | Per-user daily AI report quota (§7). Default: `20`. | Read by both Next.js BFF and FastAPI. |
| `EODHD_API_KEY` | Set only after upgrading to EODHD ALL-IN-ONE (ADR-0002 paid path). | Triggers the data-layer dispatcher to prefer EODHD. |

## Rules (per PROJECT_INSTRUCTIONS.md §7 and §14)

- **Never** commit `.env*` files. `.gitignore` covers `.env`, `.env.local`, `.env.*.local`.
- **Server-side only.** No `NEXT_PUBLIC_*` for API keys. All third-party keys live in server actions / route handlers / FastAPI env. The browser never sees them.
- **Model IDs are env vars, not constants.** Anywhere in code that needs `claude-opus-4-7` or `claude-haiku-4-5` reads from `LLM_SYNTHESIS_MODEL` / `LLM_CLASSIFIER_MODEL` (§3, §14).
- `.env.example` at the repo root lists every key in this table with empty values, so a fresh clone surfaces what's needed.
