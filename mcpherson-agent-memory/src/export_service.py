"""JSON export + backup/restore utilities for mcpherson-agent-memory.

Backups use SQLite's online backup API (safe even while the database is
in use) and are timestamped so multiple backups can coexist.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from . import db
from . import memory_service
from .models import rows_to_dicts


def export_store_memory_to_json(store_id: str, output_path: str,
                                conn: sqlite3.Connection | None = None) -> str:
    """Write one store's full memory to a JSON file. Returns the path."""
    data = memory_service.export_store_memory(store_id, conn=conn)
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")
    return str(out)


def export_all_stores_to_json(output_path: str,
                              conn: sqlite3.Connection | None = None) -> str:
    """Write every store's memory (keyed by store id) to one JSON file."""
    own_conn = conn is None
    c = conn or db.get_connection()
    try:
        stores = rows_to_dicts(c.execute("SELECT * FROM stores ORDER BY created_at").fetchall())
        payload = {
            "exported_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "store_count": len(stores),
            "stores": {
                s["id"]: memory_service.export_store_memory(s["id"], conn=c) for s in stores
            },
        }
    finally:
        if own_conn:
            c.close()
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    return str(out)


def create_backup(db_path: str | None = None, backup_dir: str = "backups") -> str:
    """Copy the live database into backup_dir using the online backup API.

    Returns the backup file path (timestamped).
    """
    src_path = db_path or db.get_db_path()
    bdir = Path(backup_dir)
    bdir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dest = bdir / f"mcpherson_memory_{stamp}.db"

    src = sqlite3.connect(src_path)
    dst = sqlite3.connect(str(dest))
    try:
        src.backup(dst)
    finally:
        dst.close()
        src.close()
    return str(dest)


def restore_backup(backup_path: str, target_path: str) -> str:
    """Restore a backup file to target_path (overwrites target). Returns target path."""
    src = sqlite3.connect(backup_path)
    Path(target_path).parent.mkdir(parents=True, exist_ok=True)
    dst = sqlite3.connect(target_path)
    try:
        src.backup(dst)
    finally:
        dst.close()
        src.close()
    return target_path
