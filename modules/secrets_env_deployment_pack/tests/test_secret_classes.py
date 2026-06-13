import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_classes_0_to_3_present():
    classes = json.loads((ROOT / "data" / "secret_classes.json").read_text("utf-8"))["classes"]
    ids = sorted(c["id"] for c in classes)
    assert ids == [0, 1, 2, 3]


def test_each_class_has_examples_and_rules():
    classes = json.loads((ROOT / "data" / "secret_classes.json").read_text("utf-8"))["classes"]
    for c in classes:
        assert c["examples"], f"class {c['id']} has no examples"
        assert c["allowed_locations"], f"class {c['id']} has no allowed_locations"
