#!/usr/bin/env python3
"""Initialize the SQLite database and run migrations.

Usage: python scripts/init_db.py [optional/path/to.db]
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src import memory_service as ms  # noqa: E402

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else None
    db_path = ms.init_db(path)
    print(f"Database initialized: {db_path}")
