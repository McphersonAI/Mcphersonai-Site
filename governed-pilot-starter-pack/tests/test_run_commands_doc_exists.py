def test_run_commands_doc_exists(root):
    path = root / "docs" / "run_commands.md"
    assert path.is_file()
    text = path.read_text()
    for cmd in [
        "python3 -m pytest",
        "python3 scripts/run_evals.py",
        "python3 scripts/demo_kill_switches.py",
        "python3 scripts/demo_human_only_mode.py",
        "python3 -m src.agent_runtime_example",
    ]:
        assert cmd in text, f"run_commands.md missing: {cmd}"


def test_langfuse_commands_are_placeholders(root):
    text = (root / "docs" / "run_commands.md").read_text().lower()
    assert "module-specific" in text, "Langfuse commands must be marked module-specific, not invented"
