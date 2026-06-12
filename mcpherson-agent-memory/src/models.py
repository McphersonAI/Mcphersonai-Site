"""Lightweight model helpers for mcpherson-agent-memory.

This project deliberately avoids an ORM. models.py centralizes:
- the canonical list of tables (used by tests and exports)
- ID + timestamp generation
- row -> dict conversion
"""

from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone

# Canonical table registry. Order matters for export readability.
TABLES = [
    "stores",
    "store_users",
    "shift_notes",
    "follow_ups",
    "handoffs",
    "waste_logs",
    "receiving_logs",
    "labor_notes",
    "weekly_summaries",
    "pilot_proof_events",
    "agent_events",
]

# Tables included in per-store memory exports (everything keyed by store_id).
STORE_SCOPED_TABLES = [t for t in TABLES if t != "stores"]


def new_id() -> str:
    """Return a UUID4 string for use as a primary key."""
    return str(uuid.uuid4())


def utcnow() -> str:
    """UTC timestamp in ISO 8601 (seconds precision), e.g. 2026-06-11T19:30:00+00:00."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def row_to_dict(row: sqlite3.Row | None) -> dict | None:
    """Convert a sqlite3.Row to a plain dict (None passes through)."""
    if row is None:
        return None
    return dict(row)


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict]:
    return [dict(r) for r in rows]
