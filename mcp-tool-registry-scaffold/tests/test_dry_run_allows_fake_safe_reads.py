from mcpherson_mcp_registry import execute_tool_call
from mcpherson_mcp_registry.models import FICTIONAL_MARKER


def test_dry_run_allows_all_enabled_safe_reads(registry, modes, approvals, store):
    reads = [t for t in registry.values()
             if t.category == "safe_read" and t.enabled]
    assert reads
    for tool in reads:
        out = execute_tool_call(tool.name, "read", "dry_run", registry, modes, approvals, store=store)
        assert out["decision"]["allowed"] is True
        assert out["result"]["fictional_marker"] == FICTIONAL_MARKER
        assert "fake_result" in out["result"]
