"""Verify the MCP Tool Registry Scaffold is complete and safe.

Checks: required docs/data exist, registry/policy/approvals load, no secrets,
no real data markers missing, fake data clearly marked fictional.
Exit code 0 = pass, 1 = fail.
"""
import json
import sys
from pathlib import Path

import _path  # noqa: F401
from mcpherson_mcp_registry import load_approvals, load_mode_policy, load_registry
from mcpherson_mcp_registry.safety import data_files_marked_fictional, scan_for_secrets

REPO_ROOT = Path(__file__).resolve().parents[1]

def main() -> int:
    failures = []

    req = json.loads((REPO_ROOT / "data" / "required_sections.json").read_text(encoding="utf-8"))
    for rel in req["required_docs"] + req["required_data"] + req["required_root"]:
        if not (REPO_ROOT / rel).exists():
            failures.append(f"MISSING: {rel}")

    try:
        registry = load_registry()
        assert registry, "registry is empty"
        print(f"[ok] tool registry loads ({len(registry)} tools)")
    except Exception as e:
        failures.append(f"registry failed to load: {e}")

    try:
        modes = load_mode_policy()
        for m in ("local_fake", "dry_run", "pilot_prelaunch",
                  "pilot_live_restricted", "human_only", "incident_mode"):
            assert m in modes, f"missing mode {m}"
        print(f"[ok] mode policy loads ({len(modes)} modes)")
    except Exception as e:
        failures.append(f"mode policy failed to load: {e}")

    try:
        approvals = load_approvals()
        assert approvals, "no fake approvals"
        assert all(a.fictional for a in approvals), "non-fictional approval found"
        print(f"[ok] fake approvals load ({len(approvals)} approvals, all fictional)")
    except Exception as e:
        failures.append(f"approvals failed to load: {e}")

    blocked_path = REPO_ROOT / "data" / "blocked_tools.json"
    if blocked_path.exists():
        blocked = json.loads(blocked_path.read_text(encoding="utf-8"))
        if not blocked.get("tools"):
            failures.append("blocked_tools.json has no tools")
        else:
            print(f"[ok] blocked tools list present ({len(blocked['tools'])} tools)")

    hits = scan_for_secrets(REPO_ROOT)
    if hits:
        for f, p in hits:
            failures.append(f"SECRET PATTERN: {f} matched {p}")
    else:
        print("[ok] no secret patterns found")

    if (REPO_ROOT / ".env").exists():
        failures.append(".env file exists — must not be present")
    else:
        print("[ok] no .env file present")

    missing_marker = data_files_marked_fictional(REPO_ROOT / "data")
    if missing_marker:
        for m in missing_marker:
            failures.append(f"data file missing fictional marker: {m}")
    else:
        print("[ok] all data files carry the fictional marker")

    if failures:
        print("\nVERIFICATION FAILED:")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("\nVERIFICATION PASSED — scaffold is complete, fake-only, and secret-free.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
