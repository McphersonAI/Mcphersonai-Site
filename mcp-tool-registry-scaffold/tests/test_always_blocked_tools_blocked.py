from mcpherson_mcp_registry import evaluate_tool_call


def test_always_blocked_tools_blocked_in_every_mode(registry, modes, approvals):
    blocked = [t for t in registry.values() if t.category == "always_blocked"]
    assert len(blocked) == 15
    for tool in blocked:
        for mode in modes:
            d = evaluate_tool_call(tool.name, tool.action_type, mode, registry, modes, approvals)
            assert d.allowed is False, f"{tool.name} was allowed in {mode}!"
