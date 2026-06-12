#!/usr/bin/env python3
"""Verify the Governed Pilot Starter Pack is complete and safe.

Checks: required docs exist, required templates exist, pilot folder template
exists, required checklist sections present, no secrets, no real-client-data
patterns in templates. Exits 0 on full pass, 1 on any failure.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

REQUIRED_DOCS = [
    "deployment_overview.md", "pilot_folder_structure.md", "deployment_order.md",
    "sqlite_setup_checklist.md", "langfuse_setup_checklist.md",
    "governance_setup_checklist.md", "run_commands.md", "dry_run_checklist.md",
    "go_live_checklist.md", "rollback_checklist.md", "proof_library_archive.md",
    "private_github_archive.md", "known_limits.md", "deferred_decisions.md",
    "blake_approval_rules.md", "claude_code_audit_prompt.md",
]

REQUIRED_TEMPLATES = [
    "deployment_log_blank.md", "deployment_log_fake_sample.md",
    "go_live_approval_blank.md", "go_live_approval_fake_sample.md",
    "rollback_log_blank.md", "rollback_log_fake_sample.md",
    "deferred_decisions_blank.md", "deferred_decisions_fake_sample.md",
    "run_commands_blank.md", "run_commands_fake_sample.md",
    "weekly_proof_review_blank.md", "weekly_proof_review_fake_sample.md",
]

PILOT_SUBFOLDERS = [
    "00_admin", "01_diagnostic", "02_written_assessment", "03_pilot_scope",
    "04_sqlite_memory", "05_langfuse_observability", "06_governance",
    "07_kill_switches", "08_eval_results", "09_backups", "10_exports",
    "11_weekly_proof", "12_audit_reports", "13_go_live_approval", "14_known_limits",
]

SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9]{16,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"(?i)\b(api[_-]?key|secret[_-]?key|access[_-]?token|password)\s*[:=]\s*['\"]?[A-Za-z0-9/+_\-]{12,}"),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"-----BEGIN (RSA |EC )?PRIVATE KEY-----"),
]

# Real-client-data heuristics: real-looking emails/phones are forbidden in templates.
CLIENT_DATA_PATTERNS = [
    re.compile(r"[A-Za-z0-9._%+-]+@(?!example\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    re.compile(r"\(\d{3}\)\s?\d{3}-\d{4}"),
    re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),  # SSN-shaped
]


def check(label, ok, failures):
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}")
    if not ok:
        failures.append(label)


def main():
    failures = []

    print("Required docs:")
    for d in REQUIRED_DOCS:
        check(f"docs/{d}", (ROOT / "docs" / d).is_file(), failures)

    print("Required templates:")
    for t in REQUIRED_TEMPLATES:
        check(f"templates/{t}", (ROOT / "templates" / t).is_file(), failures)

    print("Pilot folder template:")
    for sub in PILOT_SUBFOLDERS:
        p = ROOT / "templates" / "pilot_001_folder" / sub
        check(f"{sub}/ with README", p.is_dir() and (p / "README.md").is_file(), failures)

    print("Required checklist sections:")
    sections = json.loads((ROOT / "data" / "required_sections.json").read_text())
    for doc, needed in sections.items():
        text = (ROOT / doc).read_text() if (ROOT / doc).is_file() else ""
        for s in needed:
            check(f"{doc} contains '{s}'", s.lower() in text.lower(), failures)

    print("Secret scan (docs, templates, data, scripts):")
    scan_dirs = ["docs", "templates", "data", "scripts"]
    secret_hits = []
    for dname in scan_dirs:
        for f in (ROOT / dname).rglob("*"):
            if f.is_file() and f.suffix in {".md", ".json", ".py", ".txt"} and f.name != "verify_starter_pack.py":
                text = f.read_text(errors="ignore")
                for pat in SECRET_PATTERNS:
                    if pat.search(text):
                        secret_hits.append(f"{f.relative_to(ROOT)} matches {pat.pattern}")
    check("no secret-like strings found", not secret_hits, failures)
    for h in secret_hits:
        print(f"      -> {h}")

    print("Real-client-data scan (templates, data):")
    data_hits = []
    for dname in ["templates", "data"]:
        for f in (ROOT / dname).rglob("*"):
            if f.is_file() and f.suffix in {".md", ".json"}:
                text = f.read_text(errors="ignore")
                for pat in CLIENT_DATA_PATTERNS:
                    if pat.search(text):
                        data_hits.append(f"{f.relative_to(ROOT)} matches {pat.pattern}")
    check("no real-client-data patterns found", not data_hits, failures)
    for h in data_hits:
        print(f"      -> {h}")

    print()
    if failures:
        print(f"VERIFY FAILED: {len(failures)} issue(s).")
        return 1
    print("VERIFY PASSED: starter pack is complete and safe.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
