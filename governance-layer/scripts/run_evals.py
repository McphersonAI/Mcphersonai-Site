"""Run the full AI eval pack against the FakeAgent. Exits 1 on any failure."""
import sys
import _path  # noqa: F401
from src.evals.runner import run_all

results = run_all()
print(results.summary())
sys.exit(0 if results.all_passed else 1)
