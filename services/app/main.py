"""FinAI research pipeline service — FastAPI.

Session 2: /health + POST /reports
(§5 pipeline: resolve → fundamentals → news → classify → peers → synthesize)
"""
from __future__ import annotations
import asyncio
import logging
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent / ".env.local")

# Surface app-level INFO logs (provider failover, etc.) under uvicorn.
# `force=True` overrides uvicorn's preconfigured root handlers.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
    force=True,
)
logging.getLogger("services.app.pipeline._shared").setLevel(logging.INFO)

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from .pipeline.resolve import resolve  # noqa: E402
from .pipeline.fundamentals import fetch_fundamentals  # noqa: E402
from .pipeline.news import fetch_news  # noqa: E402
from .pipeline.classify import classify_articles  # noqa: E402
from .pipeline.peers import fetch_peers  # noqa: E402
from .pipeline.synthesize import synthesize  # noqa: E402
from .pipeline.technical_analysis import run_technical_analysis  # noqa: E402

app = FastAPI(title="FinAI Research Pipeline", version="0.2.0")


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse(
        {
            "status": "ok",
            "version": "0.2.0",
            "providers": {
                "nvidia":    "configured" if os.getenv("NVIDIA_API_KEY")    else "missing_key",
                "groq":      "configured" if os.getenv("GROQ_API_KEY")      else "missing_key",
                "finnhub":   "configured" if os.getenv("FINNHUB_API_KEY")   else "missing_key",
                "indianapi": "configured" if os.getenv("INDIANAPI_API_KEY") else "missing_key",
            },
        }
    )


class ReportRequest(BaseModel):
    symbol: str
    strategy: str = "trend_following"


@app.post("/reports")
async def create_report(req: ReportRequest):
    symbol = req.symbol.strip().upper()
    if not symbol or len(symbol) > 20:
        raise HTTPException(status_code=422, detail="Invalid symbol")

    meta = await resolve(symbol)
    fundamentals, news, peers = await asyncio.gather(
        fetch_fundamentals(symbol),
        fetch_news(symbol, company_name=meta.company_name),
        fetch_peers(symbol),
    )
    classified_news = await classify_articles(symbol, news[:8])
    report = await synthesize(
        symbol=symbol,
        exchange=meta.exchange,
        currency=meta.currency,
        company_name=meta.company_name,
        fundamentals=fundamentals,
        peers=peers,
        classified_news=classified_news,
    )
    return report


@app.post("/technical-analysis")
async def technical_analysis(req: ReportRequest):
    symbol = req.symbol.strip().upper()
    if not symbol or len(symbol) > 20:
        raise HTTPException(status_code=422, detail="Invalid symbol")
    return await run_technical_analysis(symbol, strategy=req.strategy)


@app.get("/fundamentals/{symbol}")
async def get_fundamentals(symbol: str):
    symbol = symbol.strip().upper()
    if not symbol or len(symbol) > 20:
        raise HTTPException(status_code=422, detail="Invalid symbol")
    
    try:
        fund_data = await fetch_fundamentals(symbol)
        return fund_data
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/debug/finnhub/{symbol}")
async def debug_finnhub(symbol: str):
    import os
    import httpx
    api_key = os.getenv("FINNHUB_API_KEY")
    if not api_key:
        return {"error": "FINNHUB_API_KEY is missing"}
    
    base = symbol.split(".")[0]
    async with httpx.AsyncClient(timeout=10) as client:
        r1 = await client.get(
            "https://finnhub.io/api/v1/stock/profile2",
            params={"symbol": symbol, "token": api_key},
        )
        r2 = None
        if r1.status_code != 200:
            r2 = await client.get(
                "https://finnhub.io/api/v1/stock/profile2",
                params={"symbol": base, "token": api_key},
            )
        
        return {
            "key_length": len(api_key),
            "key_repr": repr(api_key),
            "r1_status": r1.status_code,
            "r1_body": r1.text,
            "r2_status": r2.status_code if r2 else None,
            "r2_body": r2.text if r2 else None
        }

@app.get("/debug/yfinance/{symbol}")
async def debug_yfinance(symbol: str):
    import yfinance as yf
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return {"success": True, "info_keys": list(info.keys()), "info": info}
    except Exception as e:
        import traceback
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


