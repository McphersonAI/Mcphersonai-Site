from src.governance.risk_tiers import validate_risk_tier, describe_risk_tier, RISK_TIERS


def test_valid_tiers():
    for tier in range(5):
        assert validate_risk_tier(tier)


def test_invalid_tiers():
    for bad in [-1, 5, "3", 3.0, None, True]:
        assert not validate_risk_tier(bad)


def test_all_tiers_documented():
    assert set(RISK_TIERS) == {0, 1, 2, 3, 4}
    assert "Draft" in describe_risk_tier(0)
