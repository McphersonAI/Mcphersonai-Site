from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SLUGS = [
    "environment_approval_record", "secret_inventory", "environment_promotion_record",
    "key_rotation_record", "no_secrets_scan_record", "snapshot_safety_record",
    "incident_mode_activation_record", "human_only_activation_record",
]


def test_blank_and_sample_exist():
    for s in SLUGS:
        assert (ROOT / "templates" / f"{s}_blank.md").is_file(), f"missing {s}_blank.md"
        assert (ROOT / "templates" / f"{s}_fake_sample.md").is_file(), f"missing {s}_fake_sample.md"
