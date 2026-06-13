import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import package_env_pack_zip as pkg  # noqa: E402


def test_package_excludes_unsafe(tmp_path):
    out = pkg.build_zip(ROOT, out_path=tmp_path / "pack.zip")
    with zipfile.ZipFile(out) as zf:
        names = zf.namelist()
    assert names, "zip is empty"
    # .env.example allowed; no other .env; no caches/db
    bad = [n for n in names if Path(n).name == ".env"
           or n.endswith((".pyc", ".pyo", ".db", ".sqlite", ".sqlite3"))
           or "__pycache__" in n or "/dist/" in n or "/exports/" in n
           or "fake_environment_output" in n or "/.git/" in n]
    assert not bad, f"unsafe entries packaged: {bad}"
    assert any(n.endswith(".env.example") for n in names), ".env.example should be included"
    assert any(n.endswith("README.md") for n in names)
