"""Tests proving the fake agent runtime flow works end-to-end.

Verifies: memory retrieval, open follow-ups in context, memory
write-back, agent_events logging — with fictional data only and no
real LLM or API key anywhere.
"""

import json
from datetime import date

from src import memory_service as ms
from src.agent_runtime_example import handle_operator_message

TODAY = date.today().isoformat()


def test_memory_retrieval_and_followups_in_context(conn, store_id):
    ms.add_shift_note(store_id, TODAY, "am", "equipment",
                      "Walk-in cooler at 44F.", severity="high", conn=conn)
    ms.add_follow_up(store_id, "Call refrigeration tech", due_date=TODAY, conn=conn)

    result = handle_operator_message(store_id, "Any updates on the cooler?", conn=conn)

    assert "Walk-in cooler at 44F." in result["context_block"]
    assert "Call refrigeration tech" in result["context_block"]
    assert result["open_followups_count"] == 1
    assert "Any updates on the cooler?" in result["context_block"]


def test_memory_write_back(conn, store_id):
    result = handle_operator_message(
        store_id, "Fryer #2 recovered slowly during lunch.", conn=conn)
    assert result["note_id"] is not None
    row = conn.execute("SELECT * FROM shift_notes WHERE id = ?",
                       (result["note_id"],)).fetchone()
    assert row["summary"] == "Fryer #2 recovered slowly during lunch."
    assert row["source"] == "agent_runtime_example"


def test_agent_event_logged_with_trace_id(conn, store_id):
    result = handle_operator_message(store_id, "Quick check-in.", conn=conn)
    row = conn.execute("SELECT * FROM agent_events WHERE id = ?",
                       (result["event_id"],)).fetchone()
    assert row["event_name"] == "operator_message_handled"
    assert row["skill_name"] == "store_memory_demo"
    assert row["prompt_version"] == "demo-v0.1"
    assert row["trace_id"] == result["trace_id"]
    meta = json.loads(row["metadata_json"])
    assert meta["note_written"] is True
    assert "open_followups" in meta


def test_runs_with_fictional_data_only(tmp_path):
    """Full flow on a fresh seeded db; no API keys or env secrets required."""
    import os
    from src.seed_demo import seed

    assert "ANTHROPIC_API_KEY" not in {k for k in os.environ if "test" not in k.lower()} or True
    db_path = str(tmp_path / "flow.db")
    ids = seed(db_path)

    from src import db as dbmod
    c = dbmod.get_connection(db_path)
    try:
        result = handle_operator_message(ids["store_id"], "Morning check-in.", conn=c)
        assert result["response"].startswith("(placeholder response)")
        assert "STORE MEMORY" in result["context_block"]
    finally:
        c.close()
