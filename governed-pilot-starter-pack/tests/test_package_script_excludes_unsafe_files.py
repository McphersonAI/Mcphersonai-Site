def test_package_script_excludes_unsafe_files(root):
    text = (root / "scripts" / "package_starter_pack_zip.py").read_text()
    for item in ["dist", "exports", "backups", "secrets", "client_data", "logs", "__pycache__", ".pyc", ".env"]:
        assert item in text, f"package script missing exclusion: {item}"
