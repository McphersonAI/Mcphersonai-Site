"""Export the registry to exports/ for backup / Proof Library storage."""
import _path  # noqa: F401
from _path import ROOT
from src.governance.registry import GovernanceRegistry
from src.governance.export_registry import to_csv, to_json

reg = GovernanceRegistry.from_json(ROOT / "data" / "fake_registry_assets.json")
csv_path = to_csv(reg, ROOT / "exports" / "governance_registry_export.csv")
json_path = to_json(reg, ROOT / "exports" / "governance_registry_export.json")
print(f"Exported {len(reg.assets)} assets:\n  {csv_path}\n  {json_path}")
