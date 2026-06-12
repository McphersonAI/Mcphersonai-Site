"""Export the registry for backup / Proof Library storage."""
import csv
import json
from pathlib import Path

from .registry import REQUIRED_FIELDS


def _flatten(value):
    if isinstance(value, list):
        return "; ".join(str(v) for v in value)
    return value


def to_csv(registry, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=REQUIRED_FIELDS)
        writer.writeheader()
        for asset in registry.assets:
            writer.writerow({k: _flatten(asset.get(k, "")) for k in REQUIRED_FIELDS})
    return path


def to_json(registry, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(registry.assets, indent=2))
    return path
