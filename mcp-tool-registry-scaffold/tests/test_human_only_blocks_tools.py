from mcpherson_mcp_registry import evaluate_tool_call


def test_human_only_blocks_every_registered_tool(registry, modes, approvals):
    for tool in registry.values():
        d = evaluate_tool_call(tool.name, tool.action_type, "human_only", registry, modes, approvals)
        assert d.allowed is False, f"{tool.name} allowed in human_only!"
        assert "human_only" in d.reason


def test_human_only_blocks_even_with_valid_approval(registry, modes, approvals):
    d = evaluate_tool_call("mark_fake_pilot_ready", "control", "human_only", registry, modes, approvals)
    assert d.allowed is False
