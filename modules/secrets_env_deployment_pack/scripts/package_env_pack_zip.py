#!/usr/bin/env python3
"""Package the repo into a clean zip in dist/, excluding unsafe files.

Offline. No network. The exclusion list is a hard safety rule — do not weaken.
"""
import fnmatch
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

EXCLUDE_DIRS = {
    "__pycache__", "dist", "exports", "backups", "secrets", "client_data",
    "logs", "fake_environment_output", ".git", ".pytest_cache",
}
EXCLUDE_FILE_PATTERNS = [
    ".env", ".env.*", "*.pyc", "*.pyo", "*.db", "*.sqlite", "*.sqlite3", ".DS_Store",
]
ALLOW_FILES = {".env.example"}


def is_excluded(rel: Path) -> bool:
    if any(part in EXCLUDE_DIRS for part in rel.parts[:-1]):
        return True
    name = rel.name
    if name in EXCLUDE_DIRS and len(rel.parts) >= 1:
        return True
    if name in ALLOW_FILES:
        return False
    return any(fnmatch.fnmatch(name, pat) for pat in EXCLUDE_FILE_PATTERNS)


def build_zip(root: Path = ROOT, out_path: Path | None = None) -> Path:
    if out_path is None:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        out_dir = root / "dist"
        out_dir.mkdir(exist_ok=True)
        out_path = out_dir / f"mcpherson-secrets-env-deployment-pack_{stamp}.zip"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(root.rglob("*")):
            if not path.is_file():
                continue
            rel = path.relative_to(root)
            if rel.parts and rel.parts[0] in EXCLUDE_DIRS:
                continue
            if is_excluded(rel):
                continue
            try:
                if out_path.exists() and path.samefile(out_path):
                    continue
            except OSError:
                pass
            zf.write(path, arcname=str(Path("mcpherson-secrets-env-deployment-pack") / rel))
    return out_path


def main() -> int:
    out = build_zip()
    print(f"Clean zip created: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
