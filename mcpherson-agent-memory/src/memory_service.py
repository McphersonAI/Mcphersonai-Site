"""Core store-memory service for mcpherson-agent-memory.

All writes use parameterized SQL. All functions accept an optional
`conn` (sqlite3.Connection); if omitted, a connection is opened against
the default database path and closed afterward.

trace_id fields exist for future Langfuse correlation but no Langfuse
integration is implemented here on purpose.
"""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone

from . import db
from .models import new_id, rows_to_dicts, row_to_dict


@contextmanager
def _conn_ctx(conn: sqlite3.Connection | None, db_path: str | None = None):
    """Yield a connection; only close it if we opened it ourselves."""
    if conn is not None:
        yield conn
    else:
        c = db.get_connection(db_path)
        try:
            yield c
        finally:
            c.close()


def init_db(path: str | None = None) -> str:
    """Create the database and apply migrations. Returns the db path."""
    return db.init_db(path)


# ---------------------------------------------------------------------------
# Stores + users
# ---------------------------------------------------------------------------

def create_store(name: str, location: str | None = None, concept_type: str | None = None,
                 conn: sqlite3.Connection | None = None) -> str:
    sid = new_id()
    with _conn_ctx(conn) as c:
        c.execute(
            "INSERT INTO stores (id, name, location, concept_type) VALUES (?, ?, ?, ?)",
            (sid, name, location, concept_type),
        )
        c.commit()
    return sid


def create_store_user(store_id: str, display_name: str, role: str,
                      contact_hint: str | None = None,
                      conn: sqlite3.Connection | None = None) -> str:
    uid = new_id()
    with _conn_ctx(conn) as c:
        c.execute(
            "INSERT INTO store_users (id, store_id, display_name, role, contact_hint) "
            "VALUES (?, ?, ?, ?, ?)",
            (uid, store_id, display_name, role, contact_hint),
        )
        c.commit()
    return uid


def get_store(store_id: str, conn: sqlite3.Connection | None = None) -> dict | None:
    with _conn_ctx(conn) as c:
        row = c.execute("SELECT * FROM stores WHERE id = ?", (store_id,)).fetchone()
    return row_to_dict(row)


# ---------------------------------------------------------------------------
# Shift notes / follow-ups / handoffs
# ---------------------------------------------------------------------------

def add_shift_note(store_id: str, shift_date: str, daypart: str, category: str,
                   summary: str, severity: str = "medium", source: str = "operator",
                   confidence: str = "medium",
                   conn: sqlite3.Connection | None = None) -> str:
    nid = new_id()
    with _conn_ctx(conn) as c:
        c.execute(
            "INSERT INTO shift_notes (id, store_id, shift_date, daypart, category, "
            "summary, severity, source, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (nid, store_id, shift_date, daypart, category, summary, severity, source, confidence),
        )
        c.commit()
    return nid


def add_follow_up(store_id: str, title: str, detail: str | None = None,
                  owner_role: str | None = None, due_date: str | None = None,
                  conn: sqlite3.Connection | None = None) -> str:
    fid = new_id()
    with _conn_ctx(conn) as c:
        c.execute(
            "INSERT INTO follow_ups (id, store_id, title, detail, owner_role, due_date) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (fid, store_id, title, detail, owner_role, due_date),
        )
        c.commit()
    return fid


def _set_follow_up_status(followup_id: str, status: str, completed: bool,
                          conn: sqlite3.Connection | None = None) -> bool:
    completed_at = datetime.now(timezone.utc).isoformat(timespec="seconds") if completed else None
    with _conn_ctx(conn) as c:
        cur = c.execute(
            "UPDATE follow_ups SET status = ?, completed_at = ? WHERE id = ?",
            (status, completed_at, followup_id),
        )
        c.commit()
    return cur.rowcount > 0


def complete_follow_up(followup_id: str, conn: sqlite3.Connection | None = None) -> bool:
    return _set_follow_up_status(followup_id, "done", completed=True, conn=conn)


def park_follow_up(followup_id: str, conn: sqlite3.Connection | None = None) -> bool:
    return _set_follow_up_status(followup_id, "parked", completed=False, conn=conn)


def get_open_followups(store_id: str, conn: sqlite3.Connection | None = None) -> list[dict]:
    with _conn_ctx(conn) as c:
        rows = c.execute(
            "SELECT * FROM follow_ups WHERE store_id = ? AND status = 'open' "
            "ORDER BY COALESCE(due_date, created_at)",
            (store_id,),
        ).fetchall()
    return rows_to_dicts(rows)


def add_handoff(store_id: str, shift_date: str, from_daypart: str, to_daypart: str,
                prep_status: str | None = None, equipment_issues: str | None = None,
                followups: str | None = None,
                conn: sqlite3.Connection | None = None) -> str:
    hid = new_id()
    with _conn_ctx(conn) as c:
        c.execute(
            "INSERT INTO handoffs (id, store_id, shift_date, from_daypart, to_daypart, "
            "prep_status, equipment_issues, followups) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (hid, store_id, shift_date, from_daypart, to_daypart,
             prep_status, equipment_issues, followups),
        )
        c.commit()
    return hid


# ---------------------------------------------------------------------------
# Waste / receiving / labor
# ---------------------------------------------------------------------------

def add_waste_log(store_id: str, log_date: str, item: str, amount: str | None = None,
                  reason: str | None = None, estimated_cost: float | None = None,
                  conn: sqlite3.Connection | None = None) -> str:
    wid = new_id()
    with _conn_ctx(conn) as c:
        c.execute(
            "INSERT INTO waste_logs (id, store_id, log_date, item, amount, reason, estimated_cost) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (wid, store_id, log_date, item, amount, reason, estimated_cost),
        )
        c.commit()
    return wid


def add_receiving_issue(store_id: str, log_date: str, vendor: str | None = None,
                        issue_type: str | None = None, detail: str | None = None,
                        estimated_cost: float | None = None, credit_requested: bool = False,
                        conn: sqlite3.Connection | None = None) -> str:
    rid = new_id()
    with _conn_ctx(conn) as c:
        c.execute(
            "INSERT INTO receiving_logs (id, store_id, log_date, vendor, issue_type, detail, "
            "estimated_cost, credit_requested) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (rid, store_id, log_date, vendor, issue_type, detail,
             estimated_cost, 1 if credit_requested else 0),
        )
        c.commit()
    return rid


def add_labor_note(store_id: str, week_start: str | None = None, note_type: str | None = None,
                   detail: str | None = None, estimated_hours: float | None = None,
                   estimated_cost: float | None = None,
                   conn: sqlite3.Connection | None = None) -> str:
    lid = new_id()
    with _conn_ctx(conn) as c:
        c.execute(
            "INSERT INTO labor_notes (id, store_id, week_start, note_type, detail, "
            "estimated_hours, estimated_cost) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (lid, store_id, week_start, note_type, detail, estimated_hours, estimated_cost),
        )
        c.commit()
    return lid


# ---------------------------------------------------------------------------
# Summaries / pilot proof / agent events
# ---------------------------------------------------------------------------

def create_weekly_summary(store_id: str, week_start: str, summary: str,
                          patterns: str | None = None, recommended_actions: str | None = None,
                          conn: sqlite3.Connection | None = None) -> str:
    sid = new_id()
    with _conn_ctx(conn) as c:
        open_count = c.execute(
            "SELECT COUNT(*) AS n FROM follow_ups WHERE store_id = ? AND status = 'open'",
            (store_id,),
        ).fetchone()["n"]
        c.execute(
            "INSERT INTO weekly_summaries (id, store_id, week_start, summary, "
            "open_followups_count, patterns, recommended_actions) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (sid, store_id, week_start, summary, open_count, patterns, recommended_actions),
        )
        c.commit()
    return sid


def add_pilot_proof_event(store_id: str, event_date: str, event_type: str, detail: str,
                          before_after_note: str | None = None, value_estimate: str | None = None,
                          conn: sqlite3.Connection | None = None) -> str:
    pid = new_id()
    with _conn_ctx(conn) as c:
        c.execute(
            "INSERT INTO pilot_proof_events (id, store_id, event_date, event_type, detail, "
            "before_after_note, value_estimate) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (pid, store_id, event_date, event_type, detail, before_after_note, value_estimate),
        )
        c.commit()
    return pid


def log_agent_event(store_id: str | None, event_name: str, skill_name: str | None = None,
                    prompt_version: str | None = None, trace_id: str | None = None,
                    status: str = "ok", metadata: dict | None = None,
                    conn: sqlite3.Connection | None = None) -> str:
    eid = new_id()
    metadata_json = json.dumps(metadata) if metadata is not None else None
    with _conn_ctx(conn) as c:
        c.execute(
            "INSERT INTO agent_events (id, store_id, event_name, skill_name, prompt_version, "
            "trace_id, status, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (eid, store_id, event_name, skill_name, prompt_version, trace_id, status, metadata_json),
        )
        c.commit()
    return eid


# ---------------------------------------------------------------------------
# Memory retrieval for agent context
# ---------------------------------------------------------------------------

# Table and column names below are internal module constants — never user input.
# The f-string interpolation is safe; all SQL parameters use ? placeholders.
_RECENT_TABLES = {
    "shift_notes": "shift_date",
    "handoffs": "shift_date",
    "waste_logs": "log_date",
    "receiving_logs": "log_date",
    "labor_notes": "week_start",
    "weekly_summaries": "week_start",
    "pilot_proof_events": "event_date",
}


def get_recent_memory(store_id: str, days: int = 14, format: str = "json",
                      conn: sqlite3.Connection | None = None) -> dict | str:
    """Return recent store memory for an agent context block.

    format="json" -> dict with one key per table plus open_followups.
    format="text" -> compact text block (delegates to get_recent_memory_text).
    """
    if format == "text":
        return get_recent_memory_text(store_id, days=days, conn=conn)

    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    memory: dict = {"store_id": store_id, "window_days": days, "cutoff_date": cutoff}

    with _conn_ctx(conn) as c:
        store = c.execute("SELECT * FROM stores WHERE id = ?", (store_id,)).fetchone()
        memory["store"] = row_to_dict(store)
        for table, date_col in _RECENT_TABLES.items():
            rows = c.execute(
                f"SELECT * FROM {table} WHERE store_id = ? "
                f"AND COALESCE({date_col}, created_at) >= ? "
                f"ORDER BY COALESCE({date_col}, created_at) DESC",
                (store_id, cutoff),
            ).fetchall()
            memory[table] = rows_to_dicts(rows)
        memory["open_followups"] = get_open_followups(store_id, conn=c)
    return memory


def get_recent_memory_text(store_id: str, days: int = 14,
                           conn: sqlite3.Connection | None = None) -> str:
    """Compact, prompt-friendly text rendering of recent memory."""
    mem = get_recent_memory(store_id, days=days, format="json", conn=conn)
    store = mem.get("store") or {}
    lines = [
        f"STORE MEMORY ({mem['window_days']}d) — {store.get('name', 'unknown store')}"
        + (f" / {store['location']}" if store.get("location") else "")
    ]

    if mem["open_followups"]:
        lines.append("OPEN FOLLOW-UPS:")
        for f in mem["open_followups"]:
            due = f" (due {f['due_date']})" if f.get("due_date") else ""
            lines.append(f"- {f['title']}{due}")

    if mem["shift_notes"]:
        lines.append("RECENT SHIFT NOTES:")
        for n in mem["shift_notes"]:
            lines.append(f"- [{n['shift_date']} {n.get('daypart') or ''} {n.get('severity')}] {n['summary']}")

    if mem["handoffs"]:
        lines.append("RECENT HANDOFFS:")
        for h in mem["handoffs"]:
            extras = "; ".join(x for x in [h.get("prep_status"), h.get("equipment_issues"), h.get("followups")] if x)
            lines.append(f"- [{h['shift_date']} {h.get('from_daypart')}→{h.get('to_daypart')}] {extras}")

    if mem["waste_logs"]:
        lines.append("WASTE:")
        for w in mem["waste_logs"]:
            cost = f" (~${w['estimated_cost']:.2f})" if w.get("estimated_cost") is not None else ""
            lines.append(f"- [{w['log_date']}] {w['item']} {w.get('amount') or ''} — {w.get('reason') or 'n/a'}{cost}")

    if mem["receiving_logs"]:
        lines.append("RECEIVING ISSUES:")
        for r in mem["receiving_logs"]:
            cost = f" (~${r['estimated_cost']:.2f})" if r.get("estimated_cost") is not None else ""
            credit = " [credit requested]" if r.get("credit_requested") else ""
            lines.append(f"- [{r['log_date']}] {r.get('vendor') or 'vendor?'}: {r.get('detail') or r.get('issue_type')}{cost}{credit}")

    if mem["labor_notes"]:
        lines.append("LABOR NOTES:")
        for l in mem["labor_notes"]:
            lines.append(f"- [{l.get('week_start') or 'n/a'}] {l.get('note_type') or ''}: {l.get('detail') or ''}")

    if mem["weekly_summaries"]:
        lines.append("WEEKLY SUMMARIES:")
        for s in mem["weekly_summaries"]:
            lines.append(f"- [{s['week_start']}] {s['summary']} (open follow-ups at time: {s['open_followups_count']})")

    if mem["pilot_proof_events"]:
        lines.append("PILOT PROOF:")
        for p in mem["pilot_proof_events"]:
            val = f" — est. value {p['value_estimate']}" if p.get("value_estimate") else ""
            lines.append(f"- [{p['event_date']}] {p.get('event_type')}: {p['detail']}{val}")

    return "\n".join(lines)


def get_store_snapshot(store_id: str, conn: sqlite3.Connection | None = None) -> dict:
    """Counts per table + store profile. Useful for quick health checks."""
    snapshot: dict = {}
    with _conn_ctx(conn) as c:
        snapshot["store"] = row_to_dict(
            c.execute("SELECT * FROM stores WHERE id = ?", (store_id,)).fetchone()
        )
        from .models import STORE_SCOPED_TABLES
        counts = {}
        for table in STORE_SCOPED_TABLES:
            counts[table] = c.execute(
                f"SELECT COUNT(*) AS n FROM {table} WHERE store_id = ?", (store_id,)
            ).fetchone()["n"]
        snapshot["counts"] = counts
        snapshot["open_followups"] = counts and len(get_open_followups(store_id, conn=c))
    return snapshot


def export_store_memory(store_id: str, conn: sqlite3.Connection | None = None) -> dict:
    """Full (not time-windowed) memory export for one store as a dict."""
    from .models import STORE_SCOPED_TABLES
    out: dict = {}
    with _conn_ctx(conn) as c:
        out["store"] = row_to_dict(
            c.execute("SELECT * FROM stores WHERE id = ?", (store_id,)).fetchone()
        )
        for table in STORE_SCOPED_TABLES:
            rows = c.execute(
                f"SELECT * FROM {table} WHERE store_id = ? ORDER BY created_at", (store_id,)
            ).fetchall()
            out[table] = rows_to_dicts(rows)
    return out
