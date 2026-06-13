"""Fake approval validation.

In v0.1 all approvals are fake and clearly marked fictional. The checks below
mirror the future real Blake-approval model: an approval must exist for the
exact tool, be valid for the current mode, be unexpired, carry a Blake (or
fake-Blake) approver marker, and be flagged fictional in v0.1.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from .models import Approval


def _parse_expiry(value: str) -> datetime:
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        # Unparseable expiry fails closed: treat as already expired.
        return datetime(1970, 1, 1, tzinfo=timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def is_valid_approval(
    approval: Approval,
    tool_name: str,
    current_mode: str,
    now: Optional[datetime] = None,
) -> bool:
    now = now or datetime.now(timezone.utc)
    if approval.tool_name != tool_name:
        return False
    if current_mode not in approval.modes:
        return False
    if not approval.fictional:
        # v0.1 only accepts approvals explicitly marked fictional.
        return False
    approver = (approval.approver or "").lower()
    if "blake" not in approver:
        return False
    if _parse_expiry(approval.expires_at) <= now:
        return False
    return True


def find_valid_approval(
    approvals: List[Approval],
    tool_name: str,
    current_mode: str,
    now: Optional[datetime] = None,
) -> Optional[Approval]:
    for a in approvals:
        if is_valid_approval(a, tool_name, current_mode, now=now):
            return a
    return None
