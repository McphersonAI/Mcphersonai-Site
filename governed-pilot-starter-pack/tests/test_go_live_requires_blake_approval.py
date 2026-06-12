def test_go_live_requires_blake_approval(root):
    text = (root / "docs" / "go_live_checklist.md").read_text().lower()
    assert "blake approval is recorded" in text


def test_go_live_states_human_gate(root):
    text = (root / "docs" / "go_live_checklist.md").read_text().lower()
    assert "no automated go-live" in text or "human gate" in text


def test_approval_rules_doc_covers_all_gates(root):
    text = (root / "docs" / "blake_approval_rules.md").read_text().lower()
    for gate in ["go-live", "reactivation", "sanitized content", "telegram", "mcp tool writes", "client-facing reports", "public proof"]:
        assert gate in text, f"blake_approval_rules.md missing gate: {gate}"
