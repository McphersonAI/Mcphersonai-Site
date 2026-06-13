#!/usr/bin/env python3
"""Verify the Secrets / Environment Deployment Pack is complete and clean.

Offline. No network. Exit 0 = all checks pass, 1 = failures.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import scan_for_forbidden_files as ff  # noqa: E402
import scan_for_secret_patterns as sp  # noqa: E402

REQUIRED_DOCS = [
    "overview", "environment_matrix", "secret_classification", "env_file_policy",
    "github_safety_policy", "snapshot_safety_policy", "deployment_promotion_gates",
    "key_rotation_checklist", "no_secrets_scan_process", "pilot_specific_config_process",
    "reusable_template_snapshot_rules", "human_only_mode", "incident_mode",
    "known_limits", "deferred_decisions", "claude_code_audit_prompt",
]
REQUIRED_TEMPLATE_SLUGS = [
    "environment_approval_record", "secret_inventory", "environment_promotion_record",
    "key_rotation_record", "no_secrets_scan_record", "snapshot_safety_record",
    "incident_mode_activation_record", "human_only_activation_record",
]
REQUIRED_DATA = [
    "environment_matrix.json", "secret_classes.json", "forbidden_file_patterns.json",
    "forbidden_secret_patterns.json", "promotion_gates.json", "required_sections.json",
    "fake_environment_manifest.json",
]
ENVIRONMENTS = ["local_fake", "dry_run", "pilot_prelaunch", "pilot_live_restricted",
                "human_only", "incident_mode"]
MARKER = "SAMPLE ONLY — FICTIONAL — NOT REAL SECRET — NOT REAL CLIENT DATA — NOT APPROVED FOR LIVE USE"


def check(results, ok, msg):
    results.append((ok, msg))


def run(root: Path = ROOT):
    results = []

    for d in REQUIRED_DOCS:
        check(results, (root / "docs" / f"{d}.md").is_file(), f"doc exists: docs/{d}.md")
    for s in REQUIRED_TEMPLATE_SLUGS:
        check(results, (root / "templates" / f"{s}_blank.md").is_file(), f"template: {s}_blank.md")
        check(results, (root / "templates" / f"{s}_fake_sample.md").is_file(), f"template: {s}_fake_sample.md")
    for d in REQUIRED_DATA:
        check(results, (root / "data" / d).is_file(), f"data exists: data/{d}")

    # required sections in docs
    req = json.loads((root / "data" / "required_sections.json").read_text("utf-8"))["sections"]
    for relpath, needles in req.items():
        p = root / relpath
        text = p.read_text("utf-8") if p.is_file() else ""
        for n in needles:
            check(results, n in text, f"section present in {relpath}: '{n[:40]}'")

    # environment matrix
    matrix = json.loads((root / "data" / "environment_matrix.json").read_text("utf-8"))
    names = [e["name"] for e in matrix["environments"]]
    for env in ENVIRONMENTS:
        check(results, env in names, f"environment present: {env}")
    for e in matrix["environments"]:
        for field in matrix["required_fields"]:
            check(results, field in e, f"env '{e.get('name','?')}' has field '{field}'")

    # secret classes 0-3
    classes = json.loads((root / "data" / "secret_classes.json").read_text("utf-8"))["classes"]
    ids = {c["id"] for c in classes}
    for i in (0, 1, 2, 3):
        check(results, i in ids, f"secret class present: Class {i}")

    # promotion gates
    gates = json.loads((root / "data" / "promotion_gates.json").read_text("utf-8"))["gates"]
    pairs = {(g["from"], g["to"]) for g in gates}
    expected = [
        ("local_fake", "dry_run"), ("dry_run", "pilot_prelaunch"),
        ("pilot_prelaunch", "pilot_live_restricted"),
        ("pilot_live_restricted", "human_only"),
        ("pilot_live_restricted", "incident_mode"),
        ("incident_mode", "pilot_live_restricted"),
    ]
    for pr in expected:
        check(results, pr in pairs, f"promotion gate present: {pr[0]} -> {pr[1]}")

    # fake samples marked fictional
    for s in REQUIRED_TEMPLATE_SLUGS:
        p = root / "templates" / f"{s}_fake_sample.md"
        check(results, p.is_file() and MARKER in p.read_text("utf-8"),
              f"fake sample marked fictional: {s}_fake_sample.md")

    # scans
    check(results, scan_clean(ff.scan(root)), "forbidden file scan: no findings")
    check(results, scan_clean(sp.scan(root)), "secret pattern scan: no findings")

    return results


def scan_clean(findings):
    return len(findings) == 0


def main() -> int:
    results = run()
    failures = [m for ok, m in results if not ok]
    for ok, m in results:
        print(f"  [{'PASS' if ok else 'FAIL'}] {m}")
    print(f"\n{len(results) - len(failures)}/{len(results)} checks passed.")
    if failures:
        print("VERIFY: FAIL")
        return 1
    print("VERIFY: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
