import sys
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "scripts"))

from package_mcp_registry_zip import build_zip  # noqa: E402


def test_package_excludes_unsafe_files(tmp_path, repo_root):
    # Plant transient unsafe files that must be excluded.
    planted_env = repo_root / ".env"
    planted_fake_out = repo_root / "fake_output"
    planted_db = repo_root / "fake_output" / "test.sqlite"
    try:
        planted_env.write_text("SHOULD_NEVER_SHIP=1\n", encoding="utf-8")
        planted_fake_out.mkdir(exist_ok=True)
        planted_db.write_text("fake", encoding="utf-8")

        out = build_zip(tmp_path / "test-package.zip")
        names = zipfile.ZipFile(out).namelist()

        assert names, "zip is empty"
        bad = [n for n in names if
               n.endswith("/.env") or "/fake_output/" in n or
               "__pycache__" in n or n.endswith(".sqlite") or
               "/dist/" in n or "/exports/" in n or "/.pytest_cache/" in n]
        assert bad == [], f"unsafe files in package: {bad}"
        # .env.example IS allowed.
        assert any(n.endswith(".env.example") for n in names)
        # Core files are present.
        assert any(n.endswith("README.md") for n in names)
        assert any("tool_registry.json" in n for n in names)
    finally:
        planted_env.unlink(missing_ok=True)
        planted_db.unlink(missing_ok=True)
        if planted_fake_out.exists() and not any(planted_fake_out.iterdir()):
            planted_fake_out.rmdir()
