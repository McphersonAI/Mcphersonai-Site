"""Demo: load the fake governance registry and print the control map."""
import _path  # noqa: F401
from _path import ROOT
from src.governance.registry import GovernanceRegistry
from src.governance.risk_tiers import describe_risk_tier

reg = GovernanceRegistry.from_json(ROOT / "data" / "fake_registry_assets.json")
reg.validate_all()
print(f"Governance Registry — {len(reg.assets)} fake assets\n")
print(f"{'Asset':<34} {'Type':<18} {'Tier':<6} {'Approval':<26} Live")
print("-" * 96)
for a in reg.assets:
    print(f"{a['asset_name']:<34} {a['asset_type']:<18} {a['risk_tier']:<6} "
          f"{a['approval_status']:<26} {a['live_status']}")
print("\nTier breakdown:")
for tier in range(5):
    assets = reg.by_tier(tier)
    if assets:
        print(f"  {describe_risk_tier(tier)}: {len(assets)}")
print("\nNothing in this registry is live. Fake data only.")
