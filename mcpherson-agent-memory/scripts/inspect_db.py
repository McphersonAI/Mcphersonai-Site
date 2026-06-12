#!/usr/bin/env python3
"""Quick inspection of the database: tables, row counts, stores, open follow-ups.

Usage: python scripts/inspect_db.py [optional/path/to.db]
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src import db, memory_service as ms  # noqa: E402
from src.models import TABLES  # noqa: E402

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else None
    conn = db.get_connection(path)
    try:
        print(f"Database: {path or db.get_db_path()}\n")
        print("Row counts:")
        for t in TABLES:
            n = conn.execute(f"SELECT COUNT(*) AS n FROM {t}").fetchone()["n"]
            print(f"  {t:<22} {n}")
        stores = conn.execute("SELECT id, name, location, status FROM stores").fetchall()
        print(f"\nStores ({len(stores)}):")
        for s in stores:
            print(f"  {s['id']}  {s['name']}  [{s['status']}]")
            for f in ms.get_open_followups(s["id"], conn=conn):
                print(f"    open follow-up: {f['title']} (due {f['due_date'] or 'n/a'})")
    finally:
        conn.close()
