from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_snapshot_policy_forbids_real_data():
    text = (ROOT / "docs" / "snapshot_safety_policy.md").read_text("utf-8")
    assert "must NOT include" in text
    for forbidden in ["real `.env`", "real secrets", "real client data", "real pilot databases"]:
        assert forbidden in text, f"snapshot policy missing: {forbidden}"


def test_reusable_rules_mention_clean_and_incident():
    text = (ROOT / "docs" / "reusable_template_snapshot_rules.md").read_text("utf-8")
    assert "clean and fake-data-only" in text
    assert "incident_mode" in text
