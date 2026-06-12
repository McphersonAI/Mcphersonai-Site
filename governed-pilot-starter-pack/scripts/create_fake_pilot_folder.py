#!/usr/bin/env python3
"""Create a fake pilot folder from templates using FAKE DATA ONLY.

Copies templates/pilot_001_folder/ to fake_pilot_output/<fake_pilot_id>/ and
drops the fake-sample artifacts into their corresponding subfolders. Never
touches real client data; never connects to anything.
"""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PLACEMENTS = {
    "deployment_log_fake_sample.md": "00_admin",
    "run_commands_fake_sample.md": "12_audit_reports",
    "go_live_approval_fake_sample.md": "13_go_live_approval",
    "rollback_log_fake_sample.md": "12_audit_reports",
    "deferred_decisions_fake_sample.md": "14_known_limits",
    "weekly_proof_review_fake_sample.md": "11_weekly_proof",
}


def main():
    manifest = json.loads((ROOT / "data" / "fake_pilot_manifest.json").read_text())
    pilot_id = manifest["pilot_id"]
    src = ROOT / "templates" / "pilot_001_folder"
    dest = ROOT / "fake_pilot_output" / pilot_id

    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)

    for fname, sub in PLACEMENTS.items():
        shutil.copy2(ROOT / "templates" / fname, dest / sub / fname)

    (dest / "00_admin" / "fake_pilot_manifest.json").write_text(
        json.dumps(manifest, indent=2)
    )

    print(f"Fake pilot folder created: {dest.relative_to(ROOT)}")
    print("All contents are fictional. This folder is gitignored and excluded from packaging.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
