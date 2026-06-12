"""Schema-level tests: clean init, all tables present, FK enforcement."""

import sqlite3

import pytest

from src import db, memory_service as ms
from src.models import TABLES


def test_database_initializes_cleanly(tmp_path):
    path = str(tmp_path / "fresh.db")
    out = ms.init_db(path)
    assert out == path
    # Re-running migrations must be safe (idempotent)
    ms.init_db(path)


def test_all_tables_exist(conn):
    rows = conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table'"
    ).fetchall()
    names = {r["name"] for r in rows}
    for table in TABLES:
        assert table in names, f"missing table: {table}"


def test_indexes_exist(conn):
    rows = conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'index'"
    ).fetchall()
    names = {r["name"] for r in rows}
    expected = {
        "idx_shift_notes_store_date",
        "idx_follow_ups_store_status",
        "idx_agent_events_trace",
        "idx_pilot_proof_store_date",
        "idx_weekly_summaries_store_week",
    }
    assert expected <= names


def test_foreign_keys_enforced(conn):
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute(
            "INSERT INTO shift_notes (id, store_id, shift_date, summary) "
            "VALUES ('x', 'no-such-store', '2026-01-01', 'orphan note')"
        )


def test_foreign_keys_pragma_on_every_connection(tmp_db):
    c = db.get_connection(tmp_db)
    try:
        assert c.execute("PRAGMA foreign_keys").fetchone()[0] == 1
    finally:
        c.close()


def test_cascade_delete_removes_child_rows(conn, store_id):
    ms.add_shift_note(store_id, "2026-06-01", "am", "test", "note", conn=conn)
    conn.execute("DELETE FROM stores WHERE id = ?", (store_id,))
    conn.commit()
    remaining = conn.execute(
        "SELECT COUNT(*) AS n FROM shift_notes WHERE store_id = ?", (store_id,)
    ).fetchone()["n"]
    assert remaining == 0
