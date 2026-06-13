from mcpherson_mcp_registry.safety import data_files_marked_fictional, scan_for_secrets


def test_no_secret_patterns(repo_root):
    hits = scan_for_secrets(repo_root)
    assert hits == [], f"secret-like patterns found: {hits}"


def test_no_env_file(repo_root):
    assert not (repo_root / ".env").exists()


def test_all_data_files_marked_fictional(repo_root):
    missing = data_files_marked_fictional(repo_root / "data")
    assert missing == [], f"data files missing fictional marker: {missing}"


def test_all_approvals_fictional(approvals):
    assert all(a.fictional for a in approvals)
