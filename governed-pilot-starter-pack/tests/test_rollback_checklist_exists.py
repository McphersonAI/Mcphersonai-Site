def test_rollback_checklist_exists(root):
    assert (root / "docs" / "rollback_checklist.md").is_file()


def test_rollback_covers_triggers_and_steps(root):
    text = (root / "docs" / "rollback_checklist.md").read_text().lower()
    for item in [
        # All 9 triggers
        "bad memory write",
        "bad prompt behavior",
        "langfuse outage",
        "sqlite corruption",
        "unauthorized outbound action attempt",
        "incorrect pilot scope",
        "wrong store record",
        "accidental sensitive data capture",
        "need to return to human-only mode",
        # Rollback steps
        "stop agent behavior",
        "enable human-only mode",
        "preserve incident copy",
        "blake approves reactivation",
    ]:
        assert item in text, f"rollback_checklist.md missing: {item}"
