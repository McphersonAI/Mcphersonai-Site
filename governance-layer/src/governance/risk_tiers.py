"""Risk tiers for McPherson AI assets."""

RISK_TIERS = {
    0: "Draft only",
    1: "Internal tool",
    2: "Assisted workflow",
    3: "Live agent",
    4: "External action agent",
}


def validate_risk_tier(tier):
    """Risk tier must be an int 0-4 (bool is rejected)."""
    return isinstance(tier, int) and not isinstance(tier, bool) and tier in RISK_TIERS


def describe_risk_tier(tier):
    if not validate_risk_tier(tier):
        raise ValueError(f"Invalid risk tier: {tier!r}")
    return f"Tier {tier} — {RISK_TIERS[tier]}"
