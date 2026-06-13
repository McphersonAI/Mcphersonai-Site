import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import scan_for_forbidden_files as ff  # noqa: E402


def test_patterns_data_present():
    rules = json.loads((ROOT / "data" / "forbidden_file_patterns.json").read_text("utf-8"))
    for key in ("forbidden_filenames", "forbidden_glob_patterns", "forbidden_directory_names"):
        assert rules[key]
    assert ".env.example" in rules["allowlist_filenames"]


def test_clean_repo_passes():
    assert ff.scan(ROOT) == []


def test_detects_planted_env(tmp_path):
    (tmp_path / "data").mkdir()
    for f in ["environment_matrix.json", "secret_classes.json", "forbidden_file_patterns.json",
              "forbidden_secret_patterns.json", "promotion_gates.json", "required_sections.json",
              "fake_environment_manifest.json"]:
        (tmp_path / "data" / f).write_text((ROOT / "data" / f).read_text("utf-8"))
    (tmp_path / ".env").write_text("X=1")
    (tmp_path / "secrets").mkdir()
    findings = ff.scan(tmp_path)
    assert any(".env" in f for f in findings)
    assert any("secrets" in f for f in findings)


def test_allowlists_env_example(tmp_path):
    (tmp_path / "data").mkdir()
    (tmp_path / "data" / "forbidden_file_patterns.json").write_text(
        (ROOT / "data" / "forbidden_file_patterns.json").read_text("utf-8"))
    (tmp_path / ".env.example").write_text("X=__PLACEHOLDER_DO_NOT_USE__")
    assert ff.scan(tmp_path) == []
