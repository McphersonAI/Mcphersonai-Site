import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import scan_for_secret_patterns as sp  # noqa: E402


def test_patterns_data_present():
    rules = json.loads((ROOT / "data" / "forbidden_secret_patterns.json").read_text("utf-8"))
    assert rules["patterns"]
    assert "__PLACEHOLDER_DO_NOT_USE__" in rules["placeholder_allowlist"]


def test_clean_repo_passes():
    assert sp.scan(ROOT) == []


def _mini(tmp_path, content):
    (tmp_path / "data").mkdir()
    (tmp_path / "data" / "forbidden_secret_patterns.json").write_text(
        (ROOT / "data" / "forbidden_secret_patterns.json").read_text("utf-8"))
    (tmp_path / "note.md").write_text(content)
    return sp.scan(tmp_path)


def test_detects_aws_key(tmp_path):
    assert _mini(tmp_path, "key = AKIAIOSFODNN7EXAMPLE\n")


def test_detects_private_key_block(tmp_path):
    assert _mini(tmp_path, "-----BEGIN RSA PRIVATE KEY-----\n")


def test_placeholder_not_flagged(tmp_path):
    assert _mini(tmp_path, "TELEGRAM_BOT_TOKEN=__PLACEHOLDER_DO_NOT_USE__\n") == []
