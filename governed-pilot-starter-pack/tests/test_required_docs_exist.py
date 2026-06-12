REQUIRED_DOCS = [
    "deployment_overview.md", "pilot_folder_structure.md", "deployment_order.md",
    "sqlite_setup_checklist.md", "langfuse_setup_checklist.md",
    "governance_setup_checklist.md", "run_commands.md", "dry_run_checklist.md",
    "go_live_checklist.md", "rollback_checklist.md", "proof_library_archive.md",
    "private_github_archive.md", "known_limits.md", "deferred_decisions.md",
    "blake_approval_rules.md", "claude_code_audit_prompt.md",
]


def test_required_docs_exist(root):
    missing = [d for d in REQUIRED_DOCS if not (root / "docs" / d).is_file()]
    assert not missing, f"Missing docs: {missing}"


def test_root_files_exist(root):
    for f in ["README.md", "CLAUDE.md", "AGENTS.md", ".env.example", ".gitignore"]:
        assert (root / f).is_file(), f"Missing root file: {f}"
