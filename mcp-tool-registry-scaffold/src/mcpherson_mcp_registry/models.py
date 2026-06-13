"""Data models for the MCP Tool Registry Scaffold.

Everything in this module is fake-data-only. The fictional marker below must
appear on every fake tool result and every trace event.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional

FICTIONAL_MARKER = "SAMPLE ONLY — FICTIONAL — NOT REAL CLIENT DATA"

VALID_CATEGORIES = (
    "safe_read",
    "controlled_write",
    "approval_required",
    "always_blocked",
)

VALID_ACTION_TYPES = ("read", "write", "control", "outbound")


@dataclass
class ToolDefinition:
    name: str
    description: str
    category: str
    action_type: str
    risk_tier: str
    enabled: bool
    approval_required: bool
    allowed_modes: List[str]
    blocked_modes: List[str]
    can_read: bool
    can_write: bool
    can_outbound: bool
    fake_only: bool
    notes: str = ""

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ToolDefinition":
        return cls(
            name=d["name"],
            description=d.get("description", ""),
            category=d["category"],
            action_type=d["action_type"],
            risk_tier=d.get("risk_tier", "high"),
            enabled=bool(d.get("enabled", False)),  # fail closed
            approval_required=bool(d.get("approval_required", True)),  # fail closed
            allowed_modes=list(d.get("allowed_modes", [])),
            blocked_modes=list(d.get("blocked_modes", [])),
            can_read=bool(d.get("can_read", False)),
            can_write=bool(d.get("can_write", False)),
            can_outbound=bool(d.get("can_outbound", False)),
            fake_only=bool(d.get("fake_only", False)),
            notes=d.get("notes", ""),
        )


@dataclass
class ModePolicy:
    mode_name: str
    reads_allowed: bool
    writes_allowed: bool
    outbound_allowed: bool
    approval_tools_allowed: bool
    real_integrations_allowed: bool
    human_only: bool
    incident_restricted: bool
    notes: str = ""

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ModePolicy":
        # Missing fields fail closed (False), except human_only which fails
        # closed in the *blocking* direction would be True — but defaulting
        # human_only to True would block everything silently, so we require it.
        return cls(
            mode_name=d["mode_name"],
            reads_allowed=bool(d.get("reads_allowed", False)),
            writes_allowed=bool(d.get("writes_allowed", False)),
            outbound_allowed=bool(d.get("outbound_allowed", False)),
            approval_tools_allowed=bool(d.get("approval_tools_allowed", False)),
            real_integrations_allowed=bool(d.get("real_integrations_allowed", False)),
            human_only=bool(d["human_only"]),
            incident_restricted=bool(d.get("incident_restricted", False)),
            notes=d.get("notes", ""),
        )


@dataclass
class Approval:
    approval_id: str
    tool_name: str
    modes: List[str]
    approver: str
    expires_at: str
    fictional: bool
    notes: str = ""

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Approval":
        return cls(
            approval_id=d["approval_id"],
            tool_name=d["tool_name"],
            modes=list(d.get("modes", [])),
            approver=d.get("approver", ""),
            expires_at=d.get("expires_at", "1970-01-01T00:00:00+00:00"),
            fictional=bool(d.get("fictional", False)),
            notes=d.get("notes", ""),
        )


@dataclass
class Decision:
    allowed: bool
    tool_name: str
    requested_action: str
    category: Optional[str]
    current_mode: str
    reason: str
    approval_required: bool
    approval_present: bool
    risk_tier: Optional[str]
    should_log: bool = True
    fictional_marker: str = FICTIONAL_MARKER

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
