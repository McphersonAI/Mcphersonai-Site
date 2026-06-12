"""Shared pytest fixtures. Every test runs against a throwaway temp database."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src import db, memory_service as ms  # noqa: E402


@pytest.fixture()
def tmp_db(tmp_path, monkeypatch):
    """Initialize a fresh database in a temp dir and point the default path at it."""
    db_path = str(tmp_path / "test_memory.db")
    monkeypatch.setenv("MCPHERSON_DB_PATH", db_path)
    ms.init_db(db_path)
    return db_path


@pytest.fixture()
def conn(tmp_db):
    c = db.get_connection(tmp_db)
    yield c
    c.close()


@pytest.fixture()
def store_id(conn):
    return ms.create_store("Test Bagel Co.", location="Testville, CA",
                           concept_type="qsr_bagel", conn=conn)
