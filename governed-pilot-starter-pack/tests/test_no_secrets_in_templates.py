import re

SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9]{16,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"-----BEGIN (RSA |EC )?PRIVATE KEY-----"),
    re.compile(r"(?i)\b(api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['\"]?[A-Za-z0-9/+]{16,}"),
]


def test_no_secrets_anywhere(root):
    hits = []
    for d in ["templates", "docs", "data", "scripts"]:
        for f in (root / d).rglob("*"):
            if f.is_file() and f.suffix in {".md", ".json", ".py"} and "secret" not in f.name.lower() and f.name not in {"verify_starter_pack.py"}:
                text = f.read_text(errors="ignore")
                for pat in SECRET_PATTERNS:
                    if pat.search(text):
                        hits.append((str(f), pat.pattern))
    assert not hits, f"Secret-like strings found: {hits}"


def test_env_example_has_no_real_values(root):
    text = (root / ".env.example").read_text()
    assert "PLACEHOLDER" in text
    assert "sk-" not in text


def test_gitignore_blocks_env(root):
    text = (root / ".gitignore").read_text()
    assert ".env" in text and "secrets/" in text
