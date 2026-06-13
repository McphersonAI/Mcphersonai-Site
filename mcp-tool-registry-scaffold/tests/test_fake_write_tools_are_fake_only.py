from mcpherson_mcp_registry import execute_tool_call
from mcpherson_mcp_registry.models import FICTIONAL_MARKER


def test_fake_writes_mutate_only_in_memory_store(registry, modes, approvals, store):
    before = len(store.shift_notes)
    out = execute_tool_call("create_fake_shift_note", "write", "dry_run",
                            registry, modes, approvals, store=store,
                            text="Fictional test note.")
    assert out["decision"]["allowed"] is True
    assert out["result"]["fictional_marker"] == FICTIONAL_MARKER
    assert len(store.shift_notes) == before + 1
    assert store.shift_notes[-1]["fictional_marker"] == FICTIONAL_MARKER


def test_all_write_tools_marked_fake_only(registry):
    for tool in registry.values():
        if tool.category == "controlled_write":
            assert tool.fake_only is True


def test_followup_complete_flow(registry, modes, approvals, store):
    out = execute_tool_call("mark_fake_followup_complete", "write", "dry_run",
                            registry, modes, approvals, store=store,
                            followup_id="FU-FAKE-001")
    assert out["decision"]["allowed"] is True
    assert store.followups[0]["complete"] is True
