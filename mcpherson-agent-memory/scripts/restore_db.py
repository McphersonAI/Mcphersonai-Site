#!/usr/bin/env python3
"""Restore a SQLite backup over a target database file.

Usage: python scripts/restore_db.py <backup_path> <target_path>
WARNING: overwrites target_path.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src import export_service  # noqa: E402

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    target = export_service.restore_backup(sys.argv[1], sys.argv[2])
    print(f"Restored to: {target}")
