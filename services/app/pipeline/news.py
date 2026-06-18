"""News fetcher: 3-layer cascade with recency weighting.

Layer 1 — Yahoo Finance news (no API key, covers NSE/BSE + US perfectly).
Layer 2 — Google News RSS (no API key, Google-indexed, great for Indian stocks).
Layer 3 — DuckDuckGo News (no API key, comprehensive web coverage).

All layers are merged, deduplicated by URL, and sorted newest-first.
Each article gets a `recency_score` (0.0–1.0) using exponential decay with
a 14-day half-life — so a 1-day-old article scores ~0.95 while a 60-day-old
article scores ~0.08.  The synthesizer prompt already up-weights recent signals
for short-term horizons, and this field makes the ordering explicit.
"""
from __future__ import annotations

import logging
import math
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

import httpx

log = logging.getLogger(__name__)

# Yahoo Finance unofficial news endpoint (same infra we use for price data)
_YF_NEWS_URL = "https://query2.finance.yahoo.com/v2/finance/news"

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; FinAI/1.0; research-only)",
    "Accept": "application/json, application/xml, */*",
}

# Exponential decay half-life for recency scoring
_HALF_LIFE_DAYS = 14.0

# Window — 90 days (as agreed; more recent articles surface first via recency_score)
_WINDOW_DAYS = 90


# ── Recency helpers ───────────────────────────────────────────────────────────

def _parse_dt(raw: str | int | None) -> datetime | None:
    """Parse ISO-8601 string, Unix timestamp int, or RFC-2822 string → UTC datetime."""
    if raw is None:
        return None
    try:
        if isinstance(raw, (int, float)):
            return datetime.fromtimestamp(float(raw), tz=timezone.utc)
        # Try ISO-8601 first
        return datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        pass
    try:
        # RFC-2822 (used by RSS)
        return parsedate_to_datetime(str(raw)).astimezone(timezone.utc)
    except Exception:
        return None


def _recency_score(published_dt: datetime | None) -> float:
    """Exponential decay: score = 0.5^(age_days / half_life).
    Returns 0.5 (neutral) when date is unknown; 0.0 when older than window."""
    if published_dt is None:
        return 0.5
    now = datetime.now(timezone.utc)
    age_days = max(0.0, (now - published_dt).total_seconds() / 86400.0)
    if age_days > _WINDOW_DAYS:
        return 0.0
    return math.pow(0.5, age_days / _HALF_LIFE_DAYS)


def _within_window(published_dt: datetime | None) -> bool:
    if published_dt is None:
        return True  # keep unknowns; score will be 0.5
    cutoff = datetime.now(timezone.utc) - timedelta(days=_WINDOW_DAYS)
    return published_dt >= cutoff


# ── Layer 1: Yahoo Finance news ───────────────────────────────────────────────

async def _yahoo_news(symbol: str) -> list[dict]:
    """Fetch news from Yahoo Finance's unofficial v2 news endpoint.

    Works for both NSE/BSE (RELIANCE.NS) and US (AAPL) symbols.
    No API key required.  Returns up to 20 normalised articles.
    """
    try:
        async with httpx.AsyncClient(timeout=10, headers=_HEADERS) as client:
            r = await client.get(
                _YF_NEWS_URL,
                params={"symbols": symbol, "newsCount": 25, "region": "US"},
            )
        if r.status_code != 200:
            log.warning("yahoo_news: HTTP %s for %s", r.status_code, symbol)
            return []

        payload = r.json()
        # Yahoo v2 structure: {"items": {"result": [...]}}  OR  {"data": [...]}
        items = (
            payload.get("items", {}).get("result")
            or payload.get("data")
            or []
        )
        if not items:
            # Try alternative key layouts Yahoo sometimes returns
            items = payload.get("result", [])

        articles: list[dict] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            published_ts = item.get("providerPublishTime") or item.get("publishTime")
            published_dt = _parse_dt(published_ts)
            if not _within_window(published_dt):
                continue

            articles.append({
                "headline": item.get("title", ""),
                "summary": (item.get("summary") or item.get("description") or "")[:2000],
                "source": item.get("publisher") or item.get("providerName", "Yahoo Finance"),
                "published_at": published_dt.isoformat() if published_dt else "",
                "url": item.get("link") or item.get("url", ""),
                "recency_score": round(_recency_score(published_dt), 3),
                "_source_layer": "yahoo",
            })

        # Sort newest-first before returning
        articles.sort(key=lambda a: a["recency_score"], reverse=True)
        log.info("yahoo_news: %d articles for %s", len(articles), symbol)
        return articles[:20]

    except Exception as exc:
        log.warning("yahoo_news: exception for %s — %s", symbol, exc)
        return []


# ── Layer 2: Google News RSS ──────────────────────────────────────────────────

def _build_google_rss_url(symbol: str, company_name: str | None) -> str:
    """Build a locale-aware Google News RSS query for a stock."""
    is_indian = symbol.endswith(".NS") or symbol.endswith(".BO")

    # Build search terms: prefer company name; fall back to raw symbol
    base_name = (company_name or symbol.replace(".NS", "").replace(".BO", "").replace(".", " "))

    if is_indian:
        query = f'"{base_name}" (earnings OR results OR quarterly OR deal OR acquisition OR revenue OR profit)'
        return (
            f"https://news.google.com/rss/search"
            f"?q={query.replace(' ', '+')}"
            f"&hl=en-IN&gl=IN&ceid=IN:en"
        )
    else:
        query = f'"{base_name}" (earnings OR results OR revenue OR acquisition OR quarterly)'
        return (
            f"https://news.google.com/rss/search"
            f"?q={query.replace(' ', '+')}"
            f"&hl=en-US&gl=US&ceid=US:en"
        )


async def _google_rss_news(symbol: str, company_name: str | None) -> list[dict]:
    """Fetch news via Google News RSS — no API key, no rate limit enforced.

    Parses the RSS XML with Python's built-in xml.etree (no extra dependencies).
    """
    url = _build_google_rss_url(symbol, company_name)
    try:
        async with httpx.AsyncClient(
            timeout=12,
            headers={**_HEADERS, "Accept": "application/rss+xml, application/xml, */*"},
            follow_redirects=True,
        ) as client:
            r = await client.get(url)

        if r.status_code != 200:
            log.warning("google_rss: HTTP %s for %s", r.status_code, symbol)
            return []

        root = ET.fromstring(r.text)
        ns = {"media": "http://search.yahoo.com/mrss/"}  # namespace sometimes used

        articles: list[dict] = []
        for item in root.findall(".//item"):
            title = (item.findtext("title") or "").strip()
            link  = (item.findtext("link")  or "").strip()
            desc  = (item.findtext("description") or "").strip()
            pub   = (item.findtext("pubDate") or "").strip()
            src_el = item.find("source")
            source = src_el.text.strip() if src_el is not None and src_el.text else "Google News"

            published_dt = _parse_dt(pub)
            if not _within_window(published_dt):
                continue

            articles.append({
                "headline": title,
                "summary": desc[:2000],
                "source": source,
                "published_at": published_dt.isoformat() if published_dt else "",
                "url": link,
                "recency_score": round(_recency_score(published_dt), 3),
                "_source_layer": "google_rss",
            })

        articles.sort(key=lambda a: a["recency_score"], reverse=True)
        log.info("google_rss: %d articles for %s", len(articles), symbol)
        return articles[:20]

    except ET.ParseError as exc:
        log.warning("google_rss: XML parse error for %s — %s", symbol, exc)
        return []
    except Exception as exc:
        log.warning("google_rss: exception for %s — %s", symbol, exc)
        return []


# ── Layer 3: DuckDuckGo News ──────────────────────────────────────────────────

async def _duckduckgo_news(symbol: str, company_name: str | None) -> list[dict]:
    """Fetch news via DuckDuckGo Search — no API key, very lenient rate limits.

    Degrades gracefully if the `duckduckgo-search` package is not installed.
    """
    try:
        from duckduckgo_search import DDGS  # noqa: PLC0415 — lazy import for optional dep
    except ImportError:
        log.warning("ddg_news: duckduckgo-search not installed — skipping layer 3")
        return []

    base_name = (company_name or symbol.replace(".NS", "").replace(".BO", "").replace(".", " "))
    query = f"{base_name} stock news"

    import asyncio

    def _fetch():
        results = []
        try:
            with DDGS() as ddgs:
                # DDGS.news() yields dicts: {'date', 'title', 'body', 'url', 'source'}
                for r in ddgs.news(query, max_results=10):
                    results.append(r)
        except Exception as exc:
            log.warning("ddg_news: exception for %s — %s", symbol, exc)
        return results

    loop = asyncio.get_running_loop()
    raw_results = await loop.run_in_executor(None, _fetch)

    articles: list[dict] = []
    for item in raw_results:
        published_dt = _parse_dt(item.get("date"))
        if not _within_window(published_dt):
            continue

        articles.append({
            "headline": item.get("title", ""),
            "summary": item.get("body", "")[:2000],
            "source": item.get("source", "DuckDuckGo News"),
            "published_at": published_dt.isoformat() if published_dt else "",
            "url": item.get("url", ""),
            "recency_score": round(_recency_score(published_dt), 3),
            "_source_layer": "ddg",
        })

    articles.sort(key=lambda a: a["recency_score"], reverse=True)
    log.info("ddg_news: %d articles for %s", len(articles), symbol)
    return articles


# ── Merge + dedup ─────────────────────────────────────────────────────────────

def _merge_dedup(yahoo: list[dict], rss: list[dict]) -> list[dict]:
    """Merge two article lists, deduplicate by URL, sort by recency_score desc."""
    seen_urls: set[str] = set()
    merged: list[dict] = []
    for article in yahoo + rss:
        url = article.get("url", "")
        # Normalise URL: strip trailing slashes and query strings for dedup
        url_key = url.split("?")[0].rstrip("/")
        if url_key and url_key in seen_urls:
            continue
        if url_key:
            seen_urls.add(url_key)
        merged.append(article)

    merged.sort(key=lambda a: a.get("recency_score", 0.0), reverse=True)
    return merged


# ── Public entry point ────────────────────────────────────────────────────────

async def fetch_news(symbol: str, company_name: str | None = None) -> list[dict]:
    """2-layer news cascade with recency weighting.

    Layer 1: Yahoo Finance news (best coverage for both NSE/BSE and US).
    Layer 2: Google News RSS — always run; supplements Yahoo, especially for
             smaller Indian names where Yahoo's coverage can be sparse.

    Returns up to 20 articles sorted newest-first with a `recency_score`
    field (1.0 = today, ~0.5 = 14 days ago, ~0.08 = 60 days ago).
    Articles older than 90 days are excluded.
    """
    # Run all 3 layers concurrently for speed
    import asyncio
    yahoo_articles, rss_articles, ddg_articles = await asyncio.gather(
        _yahoo_news(symbol),
        _google_rss_news(symbol, company_name),
        _duckduckgo_news(symbol, company_name),
    )

    combined = _merge_dedup(_merge_dedup(yahoo_articles, rss_articles), ddg_articles)

    if not combined:
        log.warning("fetch_news: no articles found for %s", symbol)
        return []

    # Strip internal bookkeeping key before returning to classify step
    for a in combined:
        a.pop("_source_layer", None)

    log.info(
        "fetch_news: %d total articles for %s (yahoo=%d, rss=%d, ddg=%d)",
        len(combined), symbol, len(yahoo_articles), len(rss_articles), len(ddg_articles)
    )
    return combined[:20]
