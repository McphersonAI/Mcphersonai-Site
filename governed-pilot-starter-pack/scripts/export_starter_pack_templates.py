#!/usr/bin/env python3
"""Copy templates/ into a dated export folder under exports/ (gitignored)."""
import shutil
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    dest = ROOT / "exports" / f"templates_export_{date.today().isoformat()}"
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(ROOT / "templates", dest)
    print(f"Templates exported to: {dest.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
