"""Fake tool implementations.

Every tool here is a stub. Reads return clearly labeled fictional data.
Writes mutate only an in-memory FakeStore. Nothing here touches the network,
the filesystem outside fake_output/, a database, or any real system.
"""

from __future__ import annotations

import datetime
from typing import Any, Callable, Dict, List

from .models import FICTIONAL_MARKER


class FakeStore:
    """In-memory fake data store. Resets on every process start."""

    def __init__(self) -> None:
        self.shift_notes: List[dict] = []
        self.followups: List[dict] = [
            {"id": "FU-FAKE-001", "text": "Fictional follow-up: check fake walk-in temps.",
             "complete": False, "fictional_marker": FICTIONAL_MARKER},
        ]
        self.proof_events: List[dict] = []
        self.rollback_logs: List[dict] = []
        self.deferred_decisions: List[dict] = []


def _wrap(tool_name: str, fake_result: Any) -> Dict[str, Any]:
    return {
        "tool_name": tool_name,
        "fake_result": fake_result,
        "fictional_marker": FICTIONAL_MARKER,
    }


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


# ---- Safe read tools -------------------------------------------------------

def read_fake_store_profile(store: FakeStore, **kwargs) -> dict:
    return _wrap("read_fake_store_profile", {
        "store_name": "Cantina Del Sol (FICTIONAL SAMPLE STORE)",
        "fake_pilot_id": "PILOT-FAKE-001",
        "daypart_mix": {"lunch": 0.45, "dinner": 0.4, "late": 0.15},
        "note": "All values fictional.",
    })


def read_fake_shift_notes(store: FakeStore, **kwargs) -> dict:
    return _wrap("read_fake_shift_notes", {"shift_notes": list(store.shift_notes)})


def read_fake_followups(store: FakeStore, **kwargs) -> dict:
    return _wrap("read_fake_followups", {"followups": list(store.followups)})


def read_fake_weekly_proof(store: FakeStore, **kwargs) -> dict:
    return _wrap("read_fake_weekly_proof", {
        "week": "FAKE-WEEK-01",
        "caught_dollars": 0,
        "proof_events": list(store.proof_events),
        "note": "Fictional weekly proof summary.",
    })


def read_fake_pilot_status(store: FakeStore, **kwargs) -> dict:
    return _wrap("read_fake_pilot_status", {
        "fake_pilot_id": "PILOT-FAKE-001",
        "status": "scaffold_only",
        "live": False,
    })


def read_fake_governance_status(store: FakeStore, **kwargs) -> dict:
    return _wrap("read_fake_governance_status", {
        "approved_for_live": False,
        "kill_switch_active": False,
        "risk_tier": "scaffold",
        "note": "Governance Layer remains the authority; this is a fictional mirror.",
    })


# ---- Controlled write tools (in-memory only) -------------------------------

def create_fake_shift_note(store: FakeStore, text: str = "Fictional shift note.", **kwargs) -> dict:
    note = {"id": f"SN-FAKE-{len(store.shift_notes) + 1:03d}", "text": text,
            "created_at": _now(), "fictional_marker": FICTIONAL_MARKER}
    store.shift_notes.append(note)
    return _wrap("create_fake_shift_note", note)


def create_fake_followup(store: FakeStore, text: str = "Fictional follow-up.", **kwargs) -> dict:
    fu = {"id": f"FU-FAKE-{len(store.followups) + 1:03d}", "text": text,
          "complete": False, "created_at": _now(), "fictional_marker": FICTIONAL_MARKER}
    store.followups.append(fu)
    return _wrap("create_fake_followup", fu)


def mark_fake_followup_complete(store: FakeStore, followup_id: str = "FU-FAKE-001", **kwargs) -> dict:
    for fu in store.followups:
        if fu["id"] == followup_id:
            fu["complete"] = True
            return _wrap("mark_fake_followup_complete", fu)
    return _wrap("mark_fake_followup_complete",
                 {"error": f"No fictional follow-up with id {followup_id}."})


def create_fake_proof_event(store: FakeStore, description: str = "Fictional proof event.", **kwargs) -> dict:
    ev = {"id": f"PE-FAKE-{len(store.proof_events) + 1:03d}", "description": description,
          "created_at": _now(), "fictional_marker": FICTIONAL_MARKER}
    store.proof_events.append(ev)
    return _wrap("create_fake_proof_event", ev)


def create_fake_rollback_log(store: FakeStore, reason: str = "Fictional rollback.", **kwargs) -> dict:
    rb = {"id": f"RB-FAKE-{len(store.rollback_logs) + 1:03d}", "reason": reason,
          "created_at": _now(), "fictional_marker": FICTIONAL_MARKER}
    store.rollback_logs.append(rb)
    return _wrap("create_fake_rollback_log", rb)


def create_fake_deferred_decision(store: FakeStore, decision: str = "Fictional deferred decision.", **kwargs) -> dict:
    dd = {"id": f"DD-FAKE-{len(store.deferred_decisions) + 1:03d}", "decision": decision,
          "created_at": _now(), "fictional_marker": FICTIONAL_MARKER}
    store.deferred_decisions.append(dd)
    return _wrap("create_fake_deferred_decision", dd)


# ---- Approval-required tools (fake state changes only) ---------------------

def mark_fake_pilot_ready(store: FakeStore, **kwargs) -> dict:
    return _wrap("mark_fake_pilot_ready",
                 {"fake_pilot_id": "PILOT-FAKE-001", "ready": True,
                  "note": "Fictional readiness flag only. No real pilot affected."})


def change_fake_approval_status(store: FakeStore, **kwargs) -> dict:
    return _wrap("change_fake_approval_status",
                 {"note": "Fictional approval status change recorded in memory only."})


def enable_fake_live_mode(store: FakeStore, **kwargs) -> dict:
    return _wrap("enable_fake_live_mode",
                 {"live_mode": "FAKE", "note": "No real live mode exists in v0.1."})


def reactivate_fake_after_incident(store: FakeStore, **kwargs) -> dict:
    return _wrap("reactivate_fake_after_incident",
                 {"note": "Fictional reactivation only."})


def export_fake_public_proof(store: FakeStore, **kwargs) -> dict:
    return _wrap("export_fake_public_proof",
                 {"note": "Fictional export. Nothing published anywhere."})


def enable_fake_sanitized_content_logging(store: FakeStore, **kwargs) -> dict:
    return _wrap("enable_fake_sanitized_content_logging",
                 {"logging_posture": "FAKE-sanitized-content",
                  "note": "Fictional logging posture change."})


FAKE_TOOL_IMPLEMENTATIONS: Dict[str, Callable[..., dict]] = {
    "read_fake_store_profile": read_fake_store_profile,
    "read_fake_shift_notes": read_fake_shift_notes,
    "read_fake_followups": read_fake_followups,
    "read_fake_weekly_proof": read_fake_weekly_proof,
    "read_fake_pilot_status": read_fake_pilot_status,
    "read_fake_governance_status": read_fake_governance_status,
    "create_fake_shift_note": create_fake_shift_note,
    "create_fake_followup": create_fake_followup,
    "mark_fake_followup_complete": mark_fake_followup_complete,
    "create_fake_proof_event": create_fake_proof_event,
    "create_fake_rollback_log": create_fake_rollback_log,
    "create_fake_deferred_decision": create_fake_deferred_decision,
    "mark_fake_pilot_ready": mark_fake_pilot_ready,
    "change_fake_approval_status": change_fake_approval_status,
    "enable_fake_live_mode": enable_fake_live_mode,
    "reactivate_fake_after_incident": reactivate_fake_after_incident,
    "export_fake_public_proof": export_fake_public_proof,
    "enable_fake_sanitized_content_logging": enable_fake_sanitized_content_logging,
}
