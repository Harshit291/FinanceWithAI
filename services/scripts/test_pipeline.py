"""End-to-end pipeline smoke test: fundamentals + news + classify chain."""
import asyncio, sys, json
sys.path.insert(0, ".")

from services.app.pipeline.fundamentals import fetch_fundamentals
from services.app.pipeline.news import fetch_news
from services.app.pipeline.classify import classify_articles

async def test(symbol: str, company_name: str):
    print(f"\n{'='*60}")
    print(f"  {symbol}")
    print(f"{'='*60}")

    # Fundamentals
    fund = await fetch_fundamentals(symbol)
    m = fund.get("metrics", {})
    e = fund.get("earnings", [])
    print(f"\nFundamentals: {len(m)} metrics, {len(e)} quarters")
    for k in ["peRatio", "netMargins", "returnOnEquity", "debtToEquity", "epsTrailing"]:
        if k in m:
            print(f"  {k}: {m[k]}")
    if e:
        print(f"  Latest quarter: {e[0]}")

    # News
    news = await fetch_news(symbol, company_name=company_name)
    print(f"\nNews: {len(news)} articles")
    for a in news[:3]:
        print(f"  recency={a['recency_score']:.2f} | {a['source']}: {a['headline'][:70]}")

    # Classify (only first 5 to save API calls in test)
    classified = await classify_articles(symbol, news[:5])
    print(f"\nClassified (top 5 by |signed_recency_score|):")
    for a in classified:
        sr = a.get("signed_recency_score", 0)
        sent = a.get("sentiment", "?")
        rat = a.get("rationale", "")[:70]
        print(f"  [{sr:+.2f}] {sent:8s} | {rat}")

asyncio.run(test("RELIANCE.NS", "Reliance Industries"))
asyncio.run(test("AAPL", "Apple Inc"))
