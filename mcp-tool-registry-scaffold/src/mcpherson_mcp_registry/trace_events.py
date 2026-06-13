"""Trace-style event creation.

These events are Langfuse-shaped dictionaries only. Nothing in this module
calls Langfuse, the network, or any external system. A future audited module
may submit these events to the Langfuse Observability Layer.
"""

from __future__ import annotations

import datetime
import uuid
from typing import Dict

from .models import Decision, FICTIONAL_MARKER

REQUIRED_TRACE_FIELDS = (
    "event_id",
    "timestamp",
    "fake_pilot_id",
    "tool_name",
    "requested_action",
    "current_mode",
    "decision",
    "reason",
    "risk_tier",
    "approval_required",
    "approval_present",
    "category",
    "fictional_marker",
)


def build_trace_event(decision: Decision, fake_pilot_id: str = "PILOT-FAKE-001") -> Dict:
    return {
        "event_id": str(uuid.uuid4()),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "fake_pilot_id": fake_pilot_id,
        "tool_name": decision.tool_name,
        "requested_action": decision.requested_action,
        "current_mode": decision.current_mode,
        "decision": "allowed" if decision.allowed else "blocked",
        "reason": decision.reason,
        "risk_tier": decision.risk_tier,
        "approval_required": decision.approval_required,
        "approval_present": decision.approval_present,
        "category": decision.category,
        "fictional_marker": FICTIONAL_MARKER,
    }
