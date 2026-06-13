"""Safety helpers: secret scanning and fictional-marker verification.

Used by the verification script and the test suite to keep this repo
fake-data-only with no secrets.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import List, Tuple

from .models import FICTIONAL_MARKER

SECRET_PATTERNS = [
    r"sk-ant-[A-Za-z0-9_\-]{8,}",        # Anthropic-style keys
    r"sk-[A-Za-z0-9]{20,}",               # generic sk- keys
    r"AKIA[0-9A-Z]{16}",                  # AWS access keys
    r"-----BEGIN (RSA |EC )?PRIVATE KEY-----",
    r"xox[baprs]-[A-Za-z0-9\-]{10,}",     # Slack tokens
    r"ghp_[A-Za-z0-9]{20,}",              # GitHub PATs
    r"(?i)password\s*=\s*['\"][^'\"]+['\"]",
]

SCAN_EXTENSIONS = {".py", ".json", ".md", ".txt", ".example", ".gitignore"}

SKIP_DIRS = {"__pycache__", ".git", ".pytest_cache", "dist", "exports",
             "fake_output", "logs", "backups", "secrets", "client_data"}


def iter_text_files(root: Path):
    for path in root.rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.is_file() and (path.suffix in SCAN_EXTENSIONS or path.name in (".gitignore", ".env.example")):
            yield path


def scan_for_secrets(root: Path) -> List[Tuple[str, str]]:
    """Return (file, pattern) hits. Empty list means clean."""
    hits: List[Tuple[str, str]] = []
    for path in iter_text_files(root):
        # safety.py defines the patterns themselves; skip self-matches.
        if path.name == "safety.py":
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for pattern in SECRET_PATTERNS:
            if re.search(pattern, text):
                hits.append((str(path), pattern))
    return hits


def data_files_marked_fictional(data_dir: Path) -> List[str]:
    """Return list of data JSON files missing the fictional marker."""
    missing = []
    for path in sorted(data_dir.glob("*.json")):
        text = path.read_text(encoding="utf-8")
        if FICTIONAL_MARKER not in text:
            missing.append(str(path))
    return missing
