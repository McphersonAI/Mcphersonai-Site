"""Tests for memory_service helper functions. All data fictional."""

import json
from datetime import date, timedelta

from src import memory_service as ms

TODAY = date.today().isoformat()


def test_create_store_and_user(conn):
    sid = ms.create_store("Fake Store", location="Nowhere, CA",
                          concept_type="qsr", conn=conn)
    assert isinstance(sid, str) and len(sid) == 36  # UUID string
    store = ms.get_store(sid, conn=conn)
    assert store["name"] == "Fake Store"
    assert store["status"] == "active"

    uid = ms.create_store_user(sid, "Fake GM", role="gm",
                               contact_hint="telegram:@fake", conn=conn)
    row = conn.execute("SELECT * FROM store_users WHERE id = ?", (uid,)).fetchone()
    assert row["role"] == "gm"
    assert row["store_id"] == sid


def test_shift_notes_add_and_retrieve(conn, store_id):
    ms.add_shift_note(store_id, TODAY, "am", "equipment",
                      "Oven igniter slow on bay 2.", severity="high", conn=conn)
    mem = ms.get_recent_memory(store_id, days=7, conn=conn)
    assert len(mem["shift_notes"]) == 1
    assert mem["shift_notes"][0]["summary"].startswith("Oven igniter")
    assert mem["shift_notes"][0]["severity"] == "high"


def test_follow_ups_lifecycle(conn, store_id):
    f1 = ms.add_follow_up(store_id, "Call vendor", detail="gasket leak",
                          owner_role="gm", due_date=TODAY, conn=conn)
    f2 = ms.add_follow_up(store_id, "Count paper goods", conn=conn)
    f3 = ms.add_follow_up(store_id, "Review schedule", conn=conn)

    assert len(ms.get_open_followups(store_id, conn=conn)) == 3

    assert ms.complete_follow_up(f2, conn=conn)
    assert ms.park_follow_up(f3, conn=conn)

    open_items = ms.get_open_followups(store_id, conn=conn)
    assert [f["id"] for f in open_items] == [f1]

    done = conn.execute("SELECT * FROM follow_ups WHERE id = ?", (f2,)).fetchone()
    assert done["status"] == "done"
    assert done["completed_at"] is not None
    parked = conn.execute("SELECT * FROM follow_ups WHERE id = ?", (f3,)).fetchone()
    assert parked["status"] == "parked"
    assert parked["completed_at"] is None


def test_handoffs(conn, store_id):
    hid = ms.add_handoff(store_id, TODAY, "am", "pm",
                         prep_status="cream cheese at 80%",
                         equipment_issues="espresso leak",
                         followups="verify produce credit", conn=conn)
    row = conn.execute("SELECT * FROM handoffs WHERE id = ?", (hid,)).fetchone()
    assert row["from_daypart"] == "am" and row["to_daypart"] == "pm"


def test_waste_receiving_labor(conn, store_id):
    wid = ms.add_waste_log(store_id, TODAY, "plain bagels", amount="24 ct",
                           reason="over-proofed", estimated_cost=18.5, conn=conn)
    rid = ms.add_receiving_issue(store_id, TODAY, vendor="Fictional Produce Co.",
                                 issue_type="short_case", detail="3 of 4 cases",
                                 estimated_cost=22.0, credit_requested=True, conn=conn)
    lid = ms.add_labor_note(store_id, week_start=TODAY, note_type="overtime_risk",
                            detail="Opener trending to OT", estimated_hours=4.5,
                            estimated_cost=85.0, conn=conn)

    assert conn.execute("SELECT estimated_cost FROM waste_logs WHERE id = ?",
                        (wid,)).fetchone()[0] == 18.5
    assert conn.execute("SELECT credit_requested FROM receiving_logs WHERE id = ?",
                        (rid,)).fetchone()[0] == 1
    assert conn.execute("SELECT estimated_hours FROM labor_notes WHERE id = ?",
                        (lid,)).fetchone()[0] == 4.5


def test_weekly_summary_counts_open_followups(conn, store_id):
    ms.add_follow_up(store_id, "A", conn=conn)
    ms.add_follow_up(store_id, "B", conn=conn)
    sid = ms.create_weekly_summary(store_id, TODAY, "Steady week.",
                                   patterns="none", recommended_actions="none",
                                   conn=conn)
    row = conn.execute("SELECT * FROM weekly_summaries WHERE id = ?", (sid,)).fetchone()
    assert row["open_followups_count"] == 2


def test_pilot_proof_events(conn, store_id):
    pid = ms.add_pilot_proof_event(store_id, TODAY, "credit_recovered",
                                   "Caught short case at receiving.",
                                   before_after_note="before/after",
                                   value_estimate="$22", conn=conn)
    row = conn.execute("SELECT * FROM pilot_proof_events WHERE id = ?", (pid,)).fetchone()
    assert row["event_type"] == "credit_recovered"


def test_agent_events_with_metadata(conn, store_id):
    eid = ms.log_agent_event(store_id, "test_event", skill_name="unit_test",
                             prompt_version="v1", trace_id="trace-123",
                             status="ok", metadata={"k": "v"}, conn=conn)
    row = conn.execute("SELECT * FROM agent_events WHERE id = ?", (eid,)).fetchone()
    assert row["trace_id"] == "trace-123"
    assert json.loads(row["metadata_json"]) == {"k": "v"}


def test_recent_memory_json_and_text(conn, store_id):
    ms.add_shift_note(store_id, TODAY, "am", "ops", "Recent note", conn=conn)
    old_date = (date.today() - timedelta(days=60)).isoformat()
    ms.add_shift_note(store_id, old_date, "am", "ops", "Old note", conn=conn)
    ms.add_follow_up(store_id, "Open item", due_date=TODAY, conn=conn)

    mem = ms.get_recent_memory(store_id, days=14, format="json", conn=conn)
    summaries = [n["summary"] for n in mem["shift_notes"]]
    assert "Recent note" in summaries and "Old note" not in summaries
    assert len(mem["open_followups"]) == 1

    text = ms.get_recent_memory_text(store_id, days=14, conn=conn)
    assert "Recent note" in text
    assert "Open item" in text
    assert "Old note" not in text
    assert text == ms.get_recent_memory(store_id, days=14, format="text", conn=conn)


def test_store_snapshot(conn, store_id):
    ms.add_shift_note(store_id, TODAY, "am", "ops", "note", conn=conn)
    snap = ms.get_store_snapshot(store_id, conn=conn)
    assert snap["store"]["id"] == store_id
    assert snap["counts"]["shift_notes"] == 1


def test_seed_demo_is_fictional_and_complete(tmp_path):
    from src.seed_demo import seed

    db_path = str(tmp_path / "seed.db")
    ids = seed(db_path)
    from src import db as dbmod
    c = dbmod.get_connection(db_path)
    try:
        store = c.execute("SELECT * FROM stores WHERE id = ?",
                          (ids["store_id"],)).fetchone()
        assert "Demo" in store["name"]  # clearly fictional
        for table in ["shift_notes", "handoffs", "follow_ups", "waste_logs",
                      "receiving_logs", "labor_notes", "weekly_summaries",
                      "pilot_proof_events", "agent_events"]:
            n = c.execute(f"SELECT COUNT(*) AS n FROM {table}").fetchone()["n"]
            assert n >= 1, f"seed missing rows in {table}"
    finally:
        c.close()
