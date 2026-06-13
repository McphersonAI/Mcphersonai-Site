import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = [
    ("local_fake", "dry_run"), ("dry_run", "pilot_prelaunch"),
    ("pilot_prelaunch", "pilot_live_restricted"),
    ("pilot_live_restricted", "human_only"),
    ("pilot_live_restricted", "incident_mode"),
    ("incident_mode", "pilot_live_restricted"),
]


def load():
    return json.loads((ROOT / "data" / "promotion_gates.json").read_text("utf-8"))["gates"]


def test_all_gates_present():
    pairs = {(g["from"], g["to"]) for g in load()}
    for e in EXPECTED:
        assert e in pairs, f"missing gate {e}"


def test_pilot_gates_require_blake():
    for g in load():
        if g["to"] in ("pilot_prelaunch", "pilot_live_restricted"):
            assert "Blake" in g["approval_required"], f"{g['from']}->{g['to']} missing Blake approval"


def test_incident_reactivation_requires_blake():
    g = next(x for x in load() if x["from"] == "incident_mode" and x["to"] == "pilot_live_restricted")
    assert "Blake" in g["approval_required"]
