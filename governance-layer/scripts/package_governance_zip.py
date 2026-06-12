"""Package the repo into dist/mcpherson-governance-layer.zip for the
Proof Library. Excludes caches, exports, dist, and any .env."""
import zipfile
import _path  # noqa: F401
from _path import ROOT

EXCLUDE_DIRS = {".git", "__pycache__", ".pytest_cache", "dist", "exports"}
EXCLUDE_FILES = {".env"}

dist = ROOT / "dist"
dist.mkdir(exist_ok=True)
zip_path = dist / "mcpherson-governance-layer.zip"

count = 0
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if any(part in EXCLUDE_DIRS for part in rel.parts):
            continue
        if rel.name in EXCLUDE_FILES or rel.suffix == ".pyc":
            continue
        zf.write(path, f"mcpherson-governance-layer/{rel}")
        count += 1
print(f"Packaged {count} files -> {zip_path}")
