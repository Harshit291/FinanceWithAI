"""Pydantic models mirroring the §6 TypeScript VerdictReport schema."""
from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone

Stance = Literal["bullish", "neutral", "bearish", "insufficient_data"]

DISCLAIMER = (
    "Not investment advice. Educational research only. "
    "Past performance is not indicative of future results. "
    "Consult a SEBI/SEC-registered advisor before investing."
)


class DataSource(BaseModel):
    name: str
    url: str
    fetched_at: str  # ISO-8601


class Horizon(BaseModel):
    window: str
    stance: Stance
    expected_return_pct_range: tuple[float, float] | None = None
    confidence_pct: float = Field(..., ge=0, le=100)
    key_drivers: list[str]
    key_risks: list[str]


class Horizons(BaseModel):
    short_term: Horizon
    medium_term: Horizon
    long_term: Horizon


class VerdictReport(BaseModel):
    report_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    as_of: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    model: str
    data_sources: list[DataSource] = Field(default_factory=list)
    horizons: Horizons
    summary_paragraph: str
    disclaimer: str = DISCLAIMER
