"""Export registry, mode policy, blocked tools, approval examples, and sample
trace events to exports/ for review. Local files only; no network."""
import json
from pathlib import Path

import _path  # noqa: F401
from mcpherson_mcp_registry import (
    FakeStore, execute_tool_call, load_approvals, load_mode_policy, load_registry,
)

REPO_ROOT = Path(__file__).resolve().parents[1]
EXPORTS = REPO_ROOT / "exports"

def main():
    EXPORTS.mkdir(exist_ok=True)
    for name in ("tool_registry.json", "mode_policy.json",
                 "blocked_tools.json", "fake_approvals.json"):
        (EXPORTS / name).write_text(
            (REPO_ROOT / "data" / name).read_text(encoding="utf-8"), encoding="utf-8")

    registry = load_registry()
    modes = load_mode_policy()
    approvals = load_approvals()
    store = FakeStore()
    events = []
    for name, action, mode in [
        ("read_fake_store_profile", "read", "dry_run"),
        ("send_real_text_message", "outbound", "dry_run"),
        ("mark_fake_pilot_ready", "control", "dry_run"),
        ("create_fake_shift_note", "write", "incident_mode"),
        ("read_fake_pilot_status", "read", "human_only"),
    ]:
        out = execute_tool_call(name, action, mode, registry, modes, approvals, store=store)
        events.append(out["trace_event"])
    (EXPORTS / "trace_event_examples.json").write_text(
        json.dumps(events, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Exported registry, policy, blocked tools, approvals, and "
          f"{len(events)} sample trace events to {EXPORTS}/")

if __name__ == "__main__":
    main()
