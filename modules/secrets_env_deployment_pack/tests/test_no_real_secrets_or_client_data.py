import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import scan_for_secret_patterns as sp  # noqa: E402
import scan_for_forbidden_files as ff  # noqa: E402


def test_no_secret_patterns():
    assert sp.scan(ROOT) == []


def test_no_forbidden_files():
    assert ff.scan(ROOT) == []
