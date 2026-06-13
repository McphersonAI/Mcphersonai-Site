#!/usr/bin/env python3
"""Scan text files for obvious secret-like strings.

Offline. No network. Lines containing allowlisted placeholder substrings are
skipped. Exit 0 = clean, 1 = findings.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_rules(root: Path = ROOT) -> dict:
    return json.loads((root / "data" / "forbidden_secret_patterns.json").read_text(encoding="utf-8"))


def scan(root: Path = ROOT, rules: dict | None = None) -> list[str]:
    """Return findings as 'relpath:lineno: pattern_name' strings."""
    rules = rules or load_rules(root)
    patterns = [(p["name"], re.compile(p["regex"])) for p in rules["patterns"]]
    allowlist = rules["placeholder_allowlist"]
    exempt = set(rules["scan_exempt_files"])
    ignore_dirs = set(rules["scan_ignore_directories"])
    text_exts = set(rules["text_extensions"])

    findings: list[str] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(root)
        if any(p in ignore_dirs for p in rel.parts[:-1]):
            continue
        if str(rel).replace("\\", "/") in exempt:
            continue
        if path.suffix.lower() not in text_exts and path.name != ".env.example":
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except (UnicodeDecodeError, OSError):
            continue
        for lineno, line in enumerate(lines, 1):
            if any(a.lower() in line.lower() for a in allowlist):
                continue
            for name, rx in patterns:
                if rx.search(line):
                    findings.append(f"{rel}:{lineno}: {name}")
    return findings


def main() -> int:
    findings = scan()
    if findings:
        print("SECRET PATTERN SCAN: FAIL")
        for f in findings:
            print(f"  - {f}")
        return 1
    print("SECRET PATTERN SCAN: PASS (no secret-like patterns found)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
