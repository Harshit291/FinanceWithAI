"""Shared constants and client factory for pipeline modules."""
from __future__ import annotations
import os
from openai import AsyncOpenAI

FINNHUB_BASE = "https://finnhub.io/api/v1"


def groq_client() -> AsyncOpenAI:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")
    return AsyncOpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
