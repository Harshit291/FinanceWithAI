"""FinAI research pipeline service — FastAPI.

Session 1: /health endpoint only.
Session 2: adds /reports (full §5 pipeline: resolve → fundamentals → news → classify → peers → synthesize).
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="FinAI Research Pipeline", version="0.1.0")


@app.get("/health")
async def health() -> JSONResponse:
    """Liveness check for the research pipeline service."""
    return JSONResponse(
        {
            "status": "ok",
            "version": "0.1.0",
            "providers": {
                "finnhub": "not_checked",   # TODO(session-2): probe provider
                "indianapi": "not_checked",
                "anthropic": "not_checked",
            },
        }
    )
