from mcpherson_mcp_registry import evaluate_tool_call


def test_disabled_tool_blocked(registry, modes, approvals):
    assert "read_fake_disabled_demo" in registry
    assert registry["read_fake_disabled_demo"].enabled is False
    d = evaluate_tool_call("read_fake_disabled_demo", "read", "dry_run", registry, modes, approvals)
    assert d.allowed is False
    assert "disabled" in d.reason
