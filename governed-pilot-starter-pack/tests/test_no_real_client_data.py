import re

EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@(?!example\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE = re.compile(r"\(\d{3}\)\s?\d{3}-\d{4}")
SSN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")


def scan(root, dirs):
    hits = []
    for d in dirs:
        for f in (root / d).rglob("*"):
            if f.is_file() and f.suffix in {".md", ".json"}:
                text = f.read_text(errors="ignore")
                for pat in (EMAIL, PHONE, SSN):
                    if pat.search(text):
                        hits.append((str(f), pat.pattern))
    return hits


def test_no_real_client_data_in_templates(root):
    hits = scan(root, ["templates", "data"])
    assert not hits, f"Possible real client data found: {hits}"


def test_fake_manifest_is_fictional(root):
    text = (root / "data" / "fake_pilot_manifest.json").read_text().lower()
    assert "fictional" in text or "fake" in text
