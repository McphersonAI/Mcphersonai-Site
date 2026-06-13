from mcpherson_mcp_registry import evaluate_tool_call


def test_incident_mode_blocks_all_writes(registry, modes, approvals):
    writes = [t for t in registry.values() if t.category == "controlled_write"]
    for tool in writes:
        d = evaluate_tool_call(tool.name, "write", "incident_mode", registry, modes, approvals)
        assert d.allowed is False


def test_incident_mode_blocks_approval_required_tools(registry, modes, approvals):
    for name in ("mark_fake_pilot_ready", "reactivate_fake_after_incident"):
        d = evaluate_tool_call(name, "control", "incident_mode", registry, modes, approvals)
        assert d.allowed is False


def test_incident_mode_allows_safe_read(registry, modes, approvals):
    d = evaluate_tool_call("read_fake_shift_notes", "read", "incident_mode", registry, modes, approvals)
    assert d.allowed is True
