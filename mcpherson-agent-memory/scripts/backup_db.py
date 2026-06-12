#!/usr/bin/env python3
"""Back up the SQLite database using the online backup API.

Usage: python scripts/backup_db.py [backup_dir]   (default: data/backups)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src import export_service  # noqa: E402

if __name__ == "__main__":
    backup_dir = sys.argv[1] if len(sys.argv) > 1 else "data/backups"
    dest = export_service.create_backup(backup_dir=backup_dir)
    print(f"Backup written: {dest}")
