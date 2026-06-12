"""Database connection + migration utilities for mcpherson-agent-memory.

Every connection produced here has PRAGMA foreign_keys = ON and a
row_factory of sqlite3.Row so rows behave like dicts.
"""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path

# Default database location: <repo>/data/mcpherson_memory.db
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = PROJECT_ROOT / "data" / "mcpherson_memory.db"
MIGRATIONS_DIR = PROJECT_ROOT / "migrations"


def get_db_path() -> str:
    """Resolve the database path from MCPHERSON_DB_PATH or the default."""
    return os.environ.get("MCPHERSON_DB_PATH", str(DEFAULT_DB_PATH))


def get_connection(db_path: str | None = None) -> sqlite3.Connection:
    """Open a connection with foreign keys enforced and dict-like rows."""
    path = db_path or get_db_path()
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def run_migrations(conn: sqlite3.Connection, migrations_dir: str | Path | None = None) -> list[str]:
    """Apply all .sql files in migrations/ in sorted filename order.

    Migrations are idempotent (CREATE TABLE IF NOT EXISTS / CREATE INDEX
    IF NOT EXISTS), so re-running is safe. Returns the list of applied
    filenames.
    """
    mdir = Path(migrations_dir) if migrations_dir else MIGRATIONS_DIR
    applied = []
    for sql_file in sorted(mdir.glob("*.sql")):
        conn.executescript(sql_file.read_text(encoding="utf-8"))
        applied.append(sql_file.name)
    conn.commit()
    return applied


def init_db(db_path: str | None = None) -> str:
    """Create the database file (if needed) and run all migrations.

    Returns the path of the initialized database.
    """
    path = db_path or get_db_path()
    conn = get_connection(path)
    try:
        run_migrations(conn)
    finally:
        conn.close()
    return path
