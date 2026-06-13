"""Demo: human_only mode blocks every tool call, every category."""
import _path  # noqa: F401
from mcpherson_mcp_registry import (
    FakeStore, execute_tool_call, load_approvals, load_mode_policy, load_registry,
)

def main():
    registry = load_registry()
    modes = load_mode_policy()
    approvals = load_approvals()
    store = FakeStore()

    samples = [
        ("read_fake_store_profile", "read"),
        ("create_fake_shift_note", "write"),
        ("mark_fake_pilot_ready", "control"),
        ("send_real_text_message", "outbound"),
        ("totally_unknown_tool", "read"),
    ]
    print("Mode: human_only — all tool execution must be blocked.\n")
    all_blocked = True
    for name, action in samples:
        out = execute_tool_call(name, action, "human_only", registry, modes, approvals, store=store)
        blocked = not out["decision"]["allowed"]
        all_blocked = all_blocked and blocked
        print(f"  {name:35s} blocked={blocked}  reason: {out['decision']['reason']}")
    print("\nResult:", "ALL BLOCKED ✔" if all_blocked else "FAILURE — something was allowed ✘")

if __name__ == "__main__":
    main()
