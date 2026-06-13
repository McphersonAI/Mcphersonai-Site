"""Package the scaffold into a clean zip, excluding unsafe/transient files."""
import zipfile
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

EXCLUDE_DIR_NAMES = {
    "__pycache__", ".git", ".pytest_cache", "dist", "exports",
    "backups", "secrets", "client_data", "logs", "fake_output",
}
EXCLUDE_SUFFIXES = {".pyc", ".pyo", ".db", ".sqlite", ".sqlite3"}

def is_excluded(path: Path) -> bool:
    rel = path.relative_to(REPO_ROOT)
    if any(part in EXCLUDE_DIR_NAMES for part in rel.parts):
        return True
    if path.suffix in EXCLUDE_SUFFIXES:
        return True
    name = path.name
    if name == ".env" or (name.startswith(".env.") and name != ".env.example"):
        return True
    return False

def build_zip(output_path: Path | None = None) -> Path:
    dist = REPO_ROOT / "dist"
    dist.mkdir(exist_ok=True)
    if output_path is None:
        stamp = date.today().strftime("%Y-%m-%d")
        output_path = dist / f"mcpherson-mcp-tool-registry-scaffold_{stamp}.zip"
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(REPO_ROOT.rglob("*")):
            if not path.is_file() or is_excluded(path):
                continue
            zf.write(path, Path("mcpherson-mcp-tool-registry-scaffold") / path.relative_to(REPO_ROOT))
    return output_path

if __name__ == "__main__":
    out = build_zip()
    print(f"Packaged clean zip: {out}")
