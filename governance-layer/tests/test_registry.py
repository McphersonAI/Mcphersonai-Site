import pytest
from src.governance.registry import GovernanceRegistry, RegistryValidationError, REQUIRED_FIELDS

ASSETS_PATH = "data/fake_registry_assets.json"


def test_fake_assets_load():
    reg = GovernanceRegistry.from_json(ASSETS_PATH)
    assert len(reg.assets) >= 14
    assert reg.validate_all()


def test_required_fields_present_on_every_asset():
    reg = GovernanceRegistry.from_json(ASSETS_PATH)
    for asset in reg.assets:
        for field in REQUIRED_FIELDS:
            assert field in asset, f"{asset['asset_name']} missing {field}"


def test_known_assets_exist():
    reg = GovernanceRegistry.from_json(ASSETS_PATH)
    for name in ["Sterling Agent", "Telegram", "OpenClaw",
                 "Pilot Store 001 Fake Deployment", "Kill Switch Config Layer",
                 "AI Eval Pack"]:
        assert reg.get(name) is not None


def test_missing_field_rejected():
    reg = GovernanceRegistry()
    with pytest.raises(RegistryValidationError):
        reg.add_asset({"asset_name": "Broken"})


def test_nothing_is_live():
    reg = GovernanceRegistry.from_json(ASSETS_PATH)
    assert all(a["live_status"] == "not_live" for a in reg.assets)
