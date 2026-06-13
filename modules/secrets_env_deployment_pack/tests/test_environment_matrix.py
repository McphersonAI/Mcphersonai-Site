import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENVS = ["local_fake", "dry_run", "pilot_prelaunch", "pilot_live_restricted",
        "human_only", "incident_mode"]


def load():
    return json.loads((ROOT / "data" / "environment_matrix.json").read_text("utf-8"))


def test_all_six_environments_present():
    names = [e["name"] for e in load()["environments"]]
    assert sorted(names) == sorted(ENVS)


def test_each_env_has_required_fields():
    m = load()
    for e in m["environments"]:
        for field in m["required_fields"]:
            assert field in e, f"{e.get('name')} missing {field}"


def test_fake_envs_forbid_secrets():
    m = {e["name"]: e for e in load()["environments"]}
    for env in ("local_fake", "dry_run"):
        assert m[env]["secrets_allowed"] is False
        assert m[env]["real_client_data_allowed"] is False
        assert m[env]["real_env_file_allowed"] is False


def test_restricted_pilot_no_reusable_snapshot():
    m = {e["name"]: e for e in load()["environments"]}
    assert m["pilot_live_restricted"]["reusable_snapshot_allowed"] is False
