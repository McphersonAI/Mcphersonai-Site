from src.governance.approvals import (
    APPROVAL_STATUSES, validate_approval_status, can_go_live)


def test_valid_statuses():
    for s in APPROVAL_STATUSES:
        assert validate_approval_status(s)


def test_invalid_statuses():
    for bad in ["approved", "LIVE", "", None, "Approved"]:
        assert not validate_approval_status(bad)


def test_go_live_requires_pilot_approval():
    assert can_go_live("Approved for Pilot", 3)
    assert not can_go_live("Approved for Internal Use", 3)
    assert not can_go_live("Draft", 1)
    assert not can_go_live("Blocked", 3)


def test_tier_0_never_live_eligible():
    # Tier 0 = Draft only / Cannot act — never live-eligible regardless of approval status.
    assert not can_go_live("Approved for Pilot", 0)
