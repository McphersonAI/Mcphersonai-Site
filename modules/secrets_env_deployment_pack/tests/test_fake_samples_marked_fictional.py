from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER = "SAMPLE ONLY — FICTIONAL — NOT REAL SECRET — NOT REAL CLIENT DATA — NOT APPROVED FOR LIVE USE"


def test_all_fake_samples_carry_marker():
    samples = list((ROOT / "templates").glob("*_fake_sample.md"))
    assert samples, "no fake samples found"
    for s in samples:
        assert MARKER in s.read_text("utf-8"), f"{s.name} missing marker"
