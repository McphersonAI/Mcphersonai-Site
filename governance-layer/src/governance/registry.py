"""Governance Registry: the control map for all McPherson AI assets."""
import json
from pathlib import Path

from .risk_tiers import validate_risk_tier
from .approvals import validate_approval_status

ASSET_TYPES = [
    "Agent", "Prompt", "Repo", "Vendor", "Model", "Integration",
    "Data Store", "Workflow", "Document", "Pilot Deployment",
]

REQUIRED_FIELDS = [
    "asset_name", "asset_type", "repo_or_location", "owner", "purpose",
    "risk_tier", "live_status", "data_access", "allowed_tools",
    "forbidden_tools", "memory_access", "trace_layer", "kill_switch",
    "rollback_method", "approval_status", "last_reviewed", "notes",
]


class RegistryValidationError(ValueError):
    pass


class GovernanceRegistry:
    def __init__(self):
        self.assets = []

    def add_asset(self, asset):
        missing = [f for f in REQUIRED_FIELDS if f not in asset]
        if missing:
            raise RegistryValidationError(
                f"Asset {asset.get('asset_name', '<unnamed>')!r} missing fields: {missing}")
        if asset["asset_type"] not in ASSET_TYPES:
            raise RegistryValidationError(
                f"Asset {asset['asset_name']!r} has invalid asset_type: {asset['asset_type']!r}")
        if not validate_risk_tier(asset["risk_tier"]):
            raise RegistryValidationError(
                f"Asset {asset['asset_name']!r} has invalid risk_tier: {asset['risk_tier']!r}")
        if not validate_approval_status(asset["approval_status"]):
            raise RegistryValidationError(
                f"Asset {asset['asset_name']!r} has invalid approval_status: {asset['approval_status']!r}")
        if self.get(asset["asset_name"]) is not None:
            raise RegistryValidationError(
                f"Duplicate asset name: {asset['asset_name']!r}")
        self.assets.append(asset)
        return asset

    @classmethod
    def from_json(cls, path):
        registry = cls()
        data = json.loads(Path(path).read_text())
        for asset in data:
            registry.add_asset(asset)
        return registry

    def get(self, asset_name):
        return next((a for a in self.assets if a["asset_name"] == asset_name), None)

    def by_tier(self, tier):
        return [a for a in self.assets if a["risk_tier"] == tier]

    def by_status(self, status):
        return [a for a in self.assets if a["approval_status"] == status]

    def by_type(self, asset_type):
        return [a for a in self.assets if a["asset_type"] == asset_type]

    def validate_all(self):
        """Assets are validated on add; re-validate defensively."""
        seen = set()
        for asset in self.assets:
            for f in REQUIRED_FIELDS:
                if f not in asset:
                    raise RegistryValidationError(f"{asset.get('asset_name')!r} missing {f}")
            if asset["asset_name"] in seen:
                raise RegistryValidationError(f"Duplicate: {asset['asset_name']!r}")
            seen.add(asset["asset_name"])
        return True
