import asyncio, sys
sys.path.insert(0, '.')
from services.app.pipeline.news import fetch_news

async def test():
    print("--- Testing RELIANCE.NS (Indian) ---")
    arts = await fetch_news("RELIANCE.NS", company_name="Reliance Industries")
    print(f"Articles found: {len(arts)}")
    for a in arts[:3]:
        score = a.get("recency_score", 0)
        src = a.get("source", "")
        hl = a.get("headline", "")[:80]
        print(f"  [{score:.2f}] {src}: {hl}")

    print()
    print("--- Testing AAPL (US) ---")
    arts2 = await fetch_news("AAPL", company_name="Apple Inc")
    print(f"Articles found: {len(arts2)}")
    for a in arts2[:3]:
        score = a.get("recency_score", 0)
        src = a.get("source", "")
        hl = a.get("headline", "")[:80]
        print(f"  [{score:.2f}] {src}: {hl}")

    print()
    print("--- Testing TCS.NS (Indian, smaller coverage) ---")
    arts3 = await fetch_news("TCS.NS", company_name="Tata Consultancy Services")
    print(f"Articles found: {len(arts3)}")
    for a in arts3[:3]:
        score = a.get("recency_score", 0)
        src = a.get("source", "")
        hl = a.get("headline", "")[:80]
        print(f"  [{score:.2f}] {src}: {hl}")

asyncio.run(test())
