"""Demo: incident_mode allows safe incident reads only; everything else blocked."""
import _path  # noqa: F401
from mcpherson_mcp_registry import (
    FakeStore, execute_tool_call, load_approvals, load_mode_policy, load_registry,
)

def main():
    registry = load_registry()
    modes = load_mode_policy()
    approvals = load_approvals()
    store = FakeStore()

    print("Mode: incident_mode\n")
    cases = [
        ("read_fake_shift_notes", "read", "safe incident-review read — should be ALLOWED"),
        ("create_fake_shift_note", "write", "write — should be BLOCKED"),
        ("mark_fake_pilot_ready", "control", "approval-required action — should be BLOCKED"),
        ("reactivate_fake_after_incident", "control", "reactivation — should be BLOCKED without Blake approval"),
    ]
    for name, action, label in cases:
        out = execute_tool_call(name, action, "incident_mode", registry, modes, approvals, store=store)
        print(f"  {label}")
        print(f"    -> allowed={out['decision']['allowed']}  reason: {out['decision']['reason']}\n")

if __name__ == "__main__":
    main()
