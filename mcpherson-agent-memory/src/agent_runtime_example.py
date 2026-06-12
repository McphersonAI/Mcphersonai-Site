"""Fake agent runtime flow for mcpherson-agent-memory.

Demonstrates the intended integration pattern WITHOUT calling a real LLM:

    operator message -> store lookup -> SQLite memory retrieval
        -> compact context block -> placeholder response
        -> optional memory write-back -> agent_events log row

A trace_id is generated and stored so this slots into Langfuse later,
but no Langfuse code exists here on purpose.

Run:  python -m src.agent_runtime_example
"""

from __future__ import annotations

import sqlite3
import uuid
from datetime import date

from . import db, memory_service as ms

PROMPT_VERSION = "demo-v0.1"
SKILL_NAME = "store_memory_demo"


def handle_operator_message(store_id: str, operator_message: str,
                            conn: sqlite3.Connection | None = None) -> dict:
    """Process one fake operator message end-to-end. Returns a result dict."""
    own_conn = conn is None
    c = conn or db.get_connection()
    trace_id = str(uuid.uuid4())
    try:
        # 1-3. Identify store + retrieve recent memory
        memory_text = ms.get_recent_memory_text(store_id, days=14, conn=c)
        open_followups = ms.get_open_followups(store_id, conn=c)

        # 4. Build a compact context block (what would be prepended to an LLM prompt)
        context_block = (
            f"[CONTEXT v{PROMPT_VERSION}]\n{memory_text}\n"
            f"[OPERATOR MESSAGE]\n{operator_message}"
        )

        # 5. Placeholder "model" response — deterministic, no LLM call
        response = (
            f"(placeholder response) Noted. You currently have "
            f"{len(open_followups)} open follow-up(s). "
            f"Logged your message for store memory."
        )

        # 6. Optional memory write-back: store the operator message as a shift note
        note_id = None
        if operator_message.strip():
            note_id = ms.add_shift_note(
                store_id, date.today().isoformat(), "unknown", "operator_message",
                operator_message, severity="low", source="agent_runtime_example",
                conn=c,
            )

        # 7. Log the agent event with trace_id reserved for Langfuse later
        event_id = ms.log_agent_event(
            store_id, "operator_message_handled",
            skill_name=SKILL_NAME, prompt_version=PROMPT_VERSION,
            trace_id=trace_id, status="ok",
            metadata={
                "context_chars": len(context_block),
                "open_followups": len(open_followups),
                "note_written": note_id is not None,
            },
            conn=c,
        )

        return {
            "trace_id": trace_id,
            "context_block": context_block,
            "response": response,
            "note_id": note_id,
            "event_id": event_id,
            "open_followups_count": len(open_followups),
        }
    finally:
        if own_conn:
            c.close()


if __name__ == "__main__":
    from .seed_demo import seed

    ids = seed()
    result = handle_operator_message(
        ids["store_id"],
        "Walk-in cooler running warm at 44F this morning, moved dairy to reach-in.",
    )
    print("=== CONTEXT BLOCK ===")
    print(result["context_block"])
    print("\n=== PLACEHOLDER RESPONSE ===")
    print(result["response"])
    print(f"\ntrace_id: {result['trace_id']}")
    print(f"agent_event id: {result['event_id']}")
