"""Approval statuses and go-live eligibility rules."""

APPROVAL_STATUSES = [
    "Draft",
    "Needs Review",
    "Approved for Internal Use",
    "Approved for Pilot",
    "Blocked",
    "Retired",
]

# Only assets explicitly approved for pilot may be considered for live use,
# and Tier 3/4 assets additionally require the pilot readiness gate.
LIVE_ELIGIBLE_STATUSES = {"Approved for Pilot"}


def validate_approval_status(status):
    return status in APPROVAL_STATUSES


def can_go_live(approval_status, risk_tier):
    """Eligibility check only. Final gate is the Pilot Readiness Checklist
    with recorded Blake approval. Tier 0 (Draft only) is never live-eligible."""
    if approval_status not in LIVE_ELIGIBLE_STATUSES:
        return False
    return risk_tier in (1, 2, 3, 4)
