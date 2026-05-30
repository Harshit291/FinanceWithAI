"""Full synthesis: calls the LLM with all pipeline data, returns a validated VerdictReport."""
from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone

from openai import RateLimitError, APIError
from pydantic import ValidationError

from ..models import DISCLAIMER, VerdictReport, Horizon, Horizons
from ._shared import chat_with_failover

_SYSTEM = """\
You are a neutral, analytical equity research assistant. Your job is to synthesize a structured, evidence-based research report \
for a single listed stock from the data provided to you.

Strict rules — these are non-negotiable:

1. USE ONLY THE DATA PROVIDED in the user message. Do not draw on outside knowledge of the company beyond what is in the data block. Do not invent prices, ratios, EPS, returns, news headlines, dates, or quotations. If a field is not present in the data, set it to "unavailable" or use the schema's null/insufficient_data sentinel.

2. NO BIAS. You are neither bullish nor bearish by default. Reach conclusions only when the data supports them. If the evidence is mixed or thin, say so via stance="neutral" or stance="insufficient_data".

3. SHOW YOUR REASONING in the key_drivers and key_risks fields, citing specific data points (e.g., "Q3 revenue +12% YoY"; "operating margin compressed 180 bps QoQ").

4. CONFIDENCE CALIBRATION. confidence_pct must reflect the strength and freshness of the evidence, not your model uncertainty. Sparse data → lower confidence. Recent earnings beat with strong news sentiment → higher confidence. Anchor: 50 = "evenly balanced or weak signal", 80+ = "multiple converging strong signals".

5. HORIZON DISCIPLINE. Short-term (1-4 weeks) leans on news + technicals + recent results. Medium-term (1-6 months) leans on earnings trajectory + valuation + sector flow. Long-term (1-3 years) leans on competitive moat + balance sheet + sustained margins. Do not collapse all three into one stance — they should differ when the data calls for it.

6. THE summary_paragraph IS PLAIN ENGLISH (max 120 words). No jargon explanation needed — assume a retail reader who knows the basics. End with the disclaimer string verbatim.

7. THE disclaimer FIELD MUST BE EXACTLY: "Not investment advice. Educational research only. Past performance is not indicative of future results. Consult a SEBI/SEC-registered advisor before investing."

8. OUTPUT FORMAT. Return a single JSON object that conforms exactly to the VerdictReport schema given to you. Do not wrap it in prose, do not add fields, do not omit fields. The application will reject malformed responses and retry once.
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

    # Updated user message to align with SYNTH_USER_V1
    user_msg = (
        f"SYMBOL: {symbol}\n"
        f"AS_OF: {now}\n"
        f"EXCHANGE: {exchange}\n"
        f"CURRENCY: {currency}\n\n"
        f"COMPANY SNAPSHOT:\n{fund_str}\n\n"
        f"PEERS (3-5):\n{peers_str}\n\n"
        f"NEWS (last 90 days, with per-article sentiment+relevance tags):\n{news_str}\n\n"
        f"SCHEMA:\n"
        f"{{\n"
        f"  \"report_id\": \"string\",\n"
        f"  \"symbol\": \"string\",\n"
        f"  \"as_of\": \"ISO-8601\",\n"
        f"  \"model\": \"string\",\n"
        f"  \"data_sources\": [{{ \"name\":\"string\",\"url\":\"string\",\"fetched_at\":\"ISO-8601\" }}],\n"
        f"  \"horizons\": {{\n"
        f"    \"short_term\":  {{ \"window\":\"string\",\"stance\":\"bullish|neutral|bearish|insufficient_data\", \"expected_return_pct_range\":[number,number]|null, \"confidence_pct\":0-100,\"key_drivers\":[\"string\"],\"key_risks\":[\"string\"] }},\n"
        f"    \"medium_term\": {{ \"window\":\"string\",\"stance\":\"bullish|neutral|bearish|insufficient_data\", \"expected_return_pct_range\":[number,number]|null, \"confidence_pct\":0-100,\"key_drivers\":[\"string\"],\"key_risks\":[\"string\"] }},\n"
        f"    \"long_term\":   {{ \"window\":\"string\",\"stance\":\"bullish|neutral|bearish|insufficient_data\", \"expected_return_pct_range\":[number,number]|null, \"confidence_pct\":0-100,\"key_drivers\":[\"string\"],\"key_risks\":[\"string\"] }}\n"
        f"  }},\n"
        f"  \"summary_paragraph\": \"string\",\n"
        f"  \"disclaimer\": \"string\"\n"
        f"}}\n\n"
        f"Produce the VerdictReport now."
    )

    async def _call() -> VerdictReport:
        completion, provider_name = await chat_with_failover(
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": user_msg},
            ],
            kind="synthesis",
            temperature=0.2,
            response_format={"type": "json_object"},
            symbol=symbol,
        )
        data = json.loads(completion.choices[0].message.content or "")
        report = VerdictReport.model_validate(data)
        report.report_id = report_id
        report.symbol = symbol
        report.as_of = now
        report.model = f"{provider_name}:{completion.model}" if completion.model else provider_name
        report.disclaimer = DISCLAIMER
        return report

    try:
        return await _call()
    except (ValidationError, ValueError, json.JSONDecodeError):
        return await _call()  # retry once on bad JSON / schema drift
    except Exception as exc:
        reason = "rate_limit" if "rate_limit" in str(exc).lower() else "api_error"
        insufficient = Horizon(
            window="unavailable",
            stance="insufficient_data",
            expected_return_pct_range=None,
            confidence_pct=0,
            key_drivers=[],
            key_risks=[],
        )
        return VerdictReport(
            report_id=report_id,
            symbol=symbol,
            as_of=now,
            model="all_providers_exhausted",
            data_sources=[],
            horizons=Horizons(
                short_term=insufficient,
                medium_term=insufficient,
                long_term=insufficient,
            ),
            summary_paragraph=f"AI analysis temporarily unavailable ({reason}). Please try again later.",
            disclaimer=DISCLAIMER,
        )
