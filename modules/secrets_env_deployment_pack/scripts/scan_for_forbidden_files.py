#!/usr/bin/env python3
"""Scan the repo tree for forbidden file names and directory names.

Offline. No network. No real secrets. Exit 0 = clean, 1 = findings.
"""
import fnmatch
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERNS_FILE = ROOT / "data" / "forbidden_file_patterns.json"


def load_rules(root: Path = ROOT) -> dict:
    return json.loads((root / "data" / "forbidden_file_patterns.json").read_text(encoding="utf-8"))


def scan(root: Path = ROOT, rules: dict | None = None) -> list[str]:
    """Return a list of relative paths that violate the forbidden file rules."""
    rules = rules or load_rules(root)
    forbidden_names = set(rules["forbidden_filenames"])
    glob_patterns = rules["forbidden_glob_patterns"]
    forbidden_dirs = set(rules["forbidden_directory_names"])
    allow = set(rules["allowlist_filenames"])
    ignore_dirs = set(rules["scan_ignore_directories"])

    findings: list[str] = []
    for path in sorted(root.rglob("*")):
        rel = path.relative_to(root)
        parts = rel.parts
        if any(p in ignore_dirs for p in parts[:-1]) or (path.is_dir() and parts and parts[-1] in ignore_dirs):
            continue
        name = path.name
        if path.is_dir():
            if name in forbidden_dirs:
                findings.append(f"{rel}/  (forbidden directory name)")
            continue
        if name in allow:
            continue
        if name in forbidden_names:
            findings.append(f"{rel}  (forbidden filename)")
            continue
        for pat in glob_patterns:
            if fnmatch.fnmatch(name, pat):
                findings.append(f"{rel}  (matches forbidden pattern '{pat}')")
                break
    return findings


def main() -> int:
    findings = scan()
    if findings:
        print("FORBIDDEN FILE SCAN: FAIL")
        for f in findings:
            print(f"  - {f}")
        return 1
    print("FORBIDDEN FILE SCAN: PASS (no forbidden files found)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
