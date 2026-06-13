#!/usr/bin/env python3
"""Create a fake environment folder using fake data only.

Offline. No network. Output goes to fake_environment_output/ (git-ignored,
excluded from packaging, but still subject to the forbidden file scan).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def create(root: Path = ROOT, out_base: Path | None = None) -> Path:
    manifest = json.loads((root / "data" / "fake_environment_manifest.json").read_text(encoding="utf-8"))
    marker = manifest["marker"]
    out = (out_base or root / "fake_environment_output") / manifest["name"]
    out.mkdir(parents=True, exist_ok=True)
    for folder in manifest["folders"]:
        (out / folder).mkdir(parents=True, exist_ok=True)

    for spec in manifest["files"]:
        target = out / spec["path"]
        kind = spec["kind"]
        if kind == "manifest":
            target.write_text(json.dumps({"marker": marker, "name": manifest["name"],
                                          "fictional": True}, indent=2), encoding="utf-8")
        elif kind == "env_example":
            target.write_text(
                f"# {marker}\n"
                "# Copy of placeholder env values. Never put real values here.\n"
                "MCPAI_ENVIRONMENT=dry_run\n"
                "TELEGRAM_BOT_TOKEN=__PLACEHOLDER_DO_NOT_USE__\n"
                "LANGFUSE_SECRET_KEY=__PLACEHOLDER_DO_NOT_USE__\n"
                "MODEL_PROVIDER_API_KEY=__PLACEHOLDER_DO_NOT_USE__\n",
                encoding="utf-8")
        elif kind == "fake_metadata":
            data = dict(manifest["fake_metadata"])
            data["marker"] = marker
            target.write_text(json.dumps(data, indent=2), encoding="utf-8")
        elif kind == "records_readme":
            target.write_text(
                f"# Records (Fake Environment)\n\n{marker}\n\n"
                "Copies of completed blank templates for this fake environment go here.\n",
                encoding="utf-8")
    return out


def main() -> int:
    out = create()
    print(f"Fake environment folder created: {out}")
    print("All contents are fictional and marked as such.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
