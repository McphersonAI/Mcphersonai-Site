"""Copy templates/ into exports/templates/ for distribution or archival."""
import shutil
import _path  # noqa: F401
from _path import ROOT

src = ROOT / "templates"
dst = ROOT / "exports" / "templates"
if dst.exists():
    shutil.rmtree(dst)
shutil.copytree(src, dst)
print(f"Copied {len(list(dst.iterdir()))} templates to {dst}")
