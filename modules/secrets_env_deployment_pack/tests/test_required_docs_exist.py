from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "overview", "environment_matrix", "secret_classification", "env_file_policy",
    "github_safety_policy", "snapshot_safety_policy", "deployment_promotion_gates",
    "key_rotation_checklist", "no_secrets_scan_process", "pilot_specific_config_process",
    "reusable_template_snapshot_rules", "human_only_mode", "incident_mode",
    "known_limits", "deferred_decisions", "claude_code_audit_prompt",
]


def test_required_docs_exist():
    missing = [d for d in REQUIRED if not (ROOT / "docs" / f"{d}.md").is_file()]
    assert not missing, f"missing docs: {missing}"


def test_top_level_files_exist():
    for f in ["README.md", "CLAUDE.md", "AGENTS.md", ".env.example", ".gitignore"]:
        assert (ROOT / f).is_file(), f"missing {f}"
