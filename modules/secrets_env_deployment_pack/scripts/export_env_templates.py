#!/usr/bin/env python3
"""Copy templates/ into exports/templates/ for use elsewhere. Offline."""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def export(root: Path = ROOT) -> Path:
    src = root / "templates"
    dst = root / "exports" / "templates"
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    return dst


def main() -> int:
    dst = export()
    print(f"Templates exported to: {dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
