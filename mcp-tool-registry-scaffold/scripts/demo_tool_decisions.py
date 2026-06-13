"""Demo: allowed reads/writes, blocked tools, approval flow, trace events."""
import json

import _path  # noqa: F401
from mcpherson_mcp_registry import (
    FakeStore, execute_tool_call, load_approvals, load_mode_policy, load_registry,
)

def show(label, outcome):
    print(f"\n=== {label} ===")
    print("decision:", outcome["decision"]["allowed"], "—", outcome["decision"]["reason"])
    print("result:", json.dumps(outcome["result"], indent=2, ensure_ascii=False, default=str)[:400])
    print("trace_event decision:", outcome["trace_event"]["decision"])

def main():
    registry = load_registry()
    modes = load_mode_policy()
    approvals = load_approvals()
    store = FakeStore()

    show("Allowed fake read (dry_run)",
         execute_tool_call("read_fake_store_profile", "read", "dry_run", registry, modes, approvals, store=store))
    show("Allowed fake write (dry_run)",
         execute_tool_call("create_fake_shift_note", "write", "dry_run", registry, modes, approvals, store=store,
                           text="Fictional note from demo."))
    show("Blocked unregistered tool",
         execute_tool_call("totally_unknown_tool", "read", "dry_run", registry, modes, approvals, store=store))
    show("Blocked always-blocked tool",
         execute_tool_call("send_real_text_message", "outbound", "dry_run", registry, modes, approvals, store=store))
    show("Blocked approval-required tool WITHOUT approval",
         execute_tool_call("enable_fake_live_mode", "control", "dry_run", registry, modes, approvals, store=store))
    show("Allowed approval-required tool WITH valid fake approval",
         execute_tool_call("mark_fake_pilot_ready", "control", "dry_run", registry, modes, approvals, store=store))

if __name__ == "__main__":
    main()
