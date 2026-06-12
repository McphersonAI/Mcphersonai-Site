TEMPLATES = [
    "deployment_log_blank.md", "deployment_log_fake_sample.md",
    "go_live_approval_blank.md", "go_live_approval_fake_sample.md",
    "rollback_log_blank.md", "rollback_log_fake_sample.md",
    "deferred_decisions_blank.md", "deferred_decisions_fake_sample.md",
    "run_commands_blank.md", "run_commands_fake_sample.md",
    "weekly_proof_review_blank.md", "weekly_proof_review_fake_sample.md",
]


def test_required_templates_exist(root):
    missing = [t for t in TEMPLATES if not (root / "templates" / t).is_file()]
    assert not missing, f"Missing templates: {missing}"


def test_fake_samples_are_marked_fake(root):
    for t in TEMPLATES:
        if "fake_sample" in t:
            text = (root / "templates" / t).read_text().lower()
            assert "fake" in text and ("fictional" in text or "sample" in text), (
                f"{t} must be clearly marked as fake/fictional"
            )
