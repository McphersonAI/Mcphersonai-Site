from mcpherson_mcp_registry import execute_tool_call
from mcpherson_mcp_registry.models import FICTIONAL_MARKER
from mcpherson_mcp_registry.trace_events import REQUIRED_TRACE_FIELDS


def test_trace_event_fields_on_allowed_call(registry, modes, approvals, store):
    out = execute_tool_call("read_fake_store_profile", "read", "dry_run",
                            registry, modes, approvals, store=store)
    ev = out["trace_event"]
    for field in REQUIRED_TRACE_FIELDS:
        assert field in ev, f"missing trace field: {field}"
    assert ev["decision"] == "allowed"
    assert ev["fictional_marker"] == FICTIONAL_MARKER


def test_trace_event_fields_on_blocked_call(registry, modes, approvals, store):
    out = execute_tool_call("send_real_email", "outbound", "dry_run",
                            registry, modes, approvals, store=store)
    ev = out["trace_event"]
    for field in REQUIRED_TRACE_FIELDS:
        assert field in ev
    assert ev["decision"] == "blocked"
