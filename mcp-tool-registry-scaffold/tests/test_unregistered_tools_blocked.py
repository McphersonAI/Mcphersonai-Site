from mcpherson_mcp_registry import evaluate_tool_call


def test_unregistered_tool_blocked_in_every_mode(registry, modes, approvals):
    for mode in modes:
        d = evaluate_tool_call("totally_unknown_tool", "read", mode, registry, modes, approvals)
        assert d.allowed is False
        assert d.should_log is True


def test_unknown_mode_blocked(registry, modes, approvals):
    d = evaluate_tool_call("read_fake_store_profile", "read", "nonexistent_mode", registry, modes, approvals)
    assert d.allowed is False
    assert "not recognized" in d.reason
