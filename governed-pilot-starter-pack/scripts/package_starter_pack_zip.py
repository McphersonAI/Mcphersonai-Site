#!/usr/bin/env python3
"""Package the starter pack into dist/ as a zip, excluding unsafe paths.

EXCLUDED: .env files, __pycache__, .pyc, dist/, exports/, backups/, secrets/,
client_data/, logs/, fake_pilot_output/, git internals, and database files.
"""
import sys
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EXCLUDED_DIRS = {
    "dist", "exports", "backups", "secrets", "client_data", "logs",
    "fake_pilot_output", "__pycache__", ".git", ".pytest_cache",
}
EXCLUDED_SUFFIXES = {".pyc", ".pyo", ".db", ".sqlite", ".sqlite3"}


def excluded(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if any(part in EXCLUDED_DIRS for part in rel.parts):
        return True
    if path.suffix in EXCLUDED_SUFFIXES:
        return True
    if path.name == ".env" or (path.name.startswith(".env.") and path.name != ".env.example"):
        return True
    return False


def main():
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    zip_path = dist / f"mcpherson-governed-pilot-starter-pack_{date.today().isoformat()}.zip"

    count = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(ROOT.rglob("*")):
            if f.is_file() and not excluded(f):
                zf.write(f, f.relative_to(ROOT))
                count += 1

    print(f"Packaged {count} files -> {zip_path.relative_to(ROOT)}")
    print("Excluded: .env, __pycache__, .pyc, dist/, exports/, backups/, secrets/, client_data/, logs/, fake_pilot_output/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
