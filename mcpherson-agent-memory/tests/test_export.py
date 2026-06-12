"""Tests for JSON export and backup/restore. All data fictional."""

import json
from datetime import date

from src import db, export_service as es, memory_service as ms

TODAY = date.today().isoformat()


def test_export_store_memory_to_json(conn, store_id, tmp_path):
    ms.add_shift_note(store_id, TODAY, "am", "ops", "Exportable note", conn=conn)
    ms.add_follow_up(store_id, "Exportable follow-up", conn=conn)

    out = tmp_path / "exports" / "store.json"
    path = es.export_store_memory_to_json(store_id, str(out), conn=conn)

    data = json.loads(out.read_text())
    assert path == str(out)
    assert data["store"]["id"] == store_id
    assert data["shift_notes"][0]["summary"] == "Exportable note"
    assert data["follow_ups"][0]["title"] == "Exportable follow-up"


def test_export_all_stores_to_json(conn, tmp_path):
    s1 = ms.create_store("Fake Store A", conn=conn)
    s2 = ms.create_store("Fake Store B", conn=conn)
    ms.add_shift_note(s1, TODAY, "am", "ops", "A note", conn=conn)

    out = tmp_path / "all.json"
    es.export_all_stores_to_json(str(out), conn=conn)

    data = json.loads(out.read_text())
    assert data["store_count"] == 2
    assert s1 in data["stores"] and s2 in data["stores"]
    assert data["stores"][s1]["shift_notes"][0]["summary"] == "A note"


def test_backup_and_restore_roundtrip(tmp_db, conn, store_id, tmp_path):
    ms.add_shift_note(store_id, TODAY, "am", "ops", "Survives backup", conn=conn)
    conn.commit()

    backup_path = es.create_backup(db_path=tmp_db, backup_dir=str(tmp_path / "backups"))

    restored_path = str(tmp_path / "restored" / "memory.db")
    es.restore_backup(backup_path, restored_path)

    c2 = db.get_connection(restored_path)
    try:
        row = c2.execute("SELECT summary FROM shift_notes WHERE store_id = ?",
                         (store_id,)).fetchone()
        assert row["summary"] == "Survives backup"
        # FK pragma still applies on restored database connections
        assert c2.execute("PRAGMA foreign_keys").fetchone()[0] == 1
    finally:
        c2.close()
