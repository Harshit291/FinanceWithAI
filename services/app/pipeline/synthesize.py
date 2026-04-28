"""Full synthesis: calls the LLM with all pipeline data, returns a validated VerdictReport."""
from __future__ import annotations
import json
import os
import uuid
from datetime import datetime, timezone

from pydantic import ValidationError

from ..models import DISCLAIMER, VerdictReport
from ._shared import groq_client

SYNTHESIS_MODEL = os.getenv("LLM_SYNTHESIS_MODEL", "llama-3.3-70b-versatile")

_SYSTEM = """\
You are a neutral, analytical equity research assistant. Synthesize a structured, evidence-based report \
for a single listed stock from the data provided.

Rules:
1. USE ONLY DATA PROVIDED. Never invent prices, ratios, EPS, returns, or headlines. \
   If data is absent, use stance="insufficient_data" and null for numeric ranges.
2. NO BIAS. Reach conclusions only when data supports them.
3. SHOW REASONING in key_drivers and key_risks with specific data points.
4. CONFIDENCE: 50 = weak/balanced signal, 80+ = multiple converging strong signals.
5. HORIZONS: short_term (1-4 wks) leans on news/recent results; \
   medium_term (1-6 mo) on earnings/valuation; long_term (1-3 yr) on moat/balance sheet.
6. summary_paragraph: plain English, max 120 words.
7. disclaimer MUST BE EXACTLY: "Not investment advice. Educational research only. \
   Past performance is not indicative of future results. \
   Consult a SEBI/SEC-registered advisor before investing."
8. OUTPUT: a single JSON object — no prose, no markdown fences.

Schema:
{
  "report_id": "string",
  "symbol": "string",
  "as_of": "ISO-8601",
  "model": "string",
  "data_sources": [{"name":"string","url":"string","fetched_at":"ISO-8601"}],
  "horizons": {
    "short_term":  {"window":"string","stance":"bullish|neutral|bearish|insufficient_data",
                    "expected_return_pct_range":[number,number]|null,
                    "confidence_pct":0-100,"key_drivers":["string"],"key_risks":["string"]},
    "medium_term": {"window":"string","stance":"bullish|neutral|bearish|insufficient_data",
                    "expected_return_pct_range":[number,number]|null,
                    "confidence_pct":0-100,"key_drivers":["string"],"key_risks":["string"]},
    "long_term":   {"window":"string","stance":"bullish|neutral|bearish|insufficient_data",
                    "expected_return_pct_range":[number,number]|null,
                    "confidence_pct":0-100,"key_drivers":["string"],"key_risks":["string"]}
  },
  "summary_paragraph": "string",
  "disclaimer": "string"
}\
"""


async def synthesize(
    symbol: str,
    exchange: str,
    currency: str,
    company_name: str | None,
    fundamentals: dict,
    peers: list[str],
    classified_news: list[dict],
) -> VerdictReport:
    report_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    fund_str = json.dumps(fundamentals, indent=2) if fundamentals else "unavailable"
    peers_str = json.dumps(peers) if peers else "unavailable"
    news_str = json.dumps(classified_news, indent=2) if classified_news else "unavailable"

    user_msg = (
        f"SYMBOL: {symbol}\n"
        f"AS_OF: {now}\n"
        f"EXCHANGE: {exchange}\n"
        f"CURRENCY: {currency}\n"
        f"COMPANY: {company_name or 'unknown'}\n"
        f"REPORT_ID: {report_id}\n\n"
        f"COMPANY FUNDAMENTALS + EARNINGS:\n{fund_str}\n\n"
        f"PEERS:\n{peers_str}\n\n"
        f"NEWS (last 90 days, with sentiment tags):\n{news_str}\n\n"
        "Produce the VerdictReport now."
    )

    client = groq_client()

    async def _call() -> VerdictReport:
        completion = await client.chat.completions.create(
            model=SYNTHESIS_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        data = json.loads(completion.choices[0].message.content or "")
        report = VerdictReport.model_validate(data)
        report.report_id = report_id
        report.symbol = symbol
        report.as_of = now
        report.model = SYNTHESIS_MODEL
        report.disclaimer = DISCLAIMER
        return report

    try:
        return await _call()
    except (ValidationError, ValueError, json.JSONDecodeError):
        return await _call()  # retry once
