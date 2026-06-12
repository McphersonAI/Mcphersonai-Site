SUBFOLDERS = [
    "00_admin", "01_diagnostic", "02_written_assessment", "03_pilot_scope",
    "04_sqlite_memory", "05_langfuse_observability", "06_governance",
    "07_kill_switches", "08_eval_results", "09_backups", "10_exports",
    "11_weekly_proof", "12_audit_reports", "13_go_live_approval", "14_known_limits",
]


def test_pilot_folder_template_exists(root):
    base = root / "templates" / "pilot_001_folder"
    assert base.is_dir()
    for sub in SUBFOLDERS:
        assert (base / sub).is_dir(), f"Missing subfolder: {sub}"


def test_every_subfolder_has_readme(root):
    base = root / "templates" / "pilot_001_folder"
    for sub in SUBFOLDERS:
        readme = base / sub / "README.md"
        assert readme.is_file(), f"Missing README in {sub}"
        text = readme.read_text()
        assert "What belongs here" in text and "NOT" in text, (
            f"{sub}/README.md must state what belongs and what must not be stored"
        )
