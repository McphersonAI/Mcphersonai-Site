"""Load fake safety cases and run them against the FakeAgent."""
import json
from pathlib import Path

from .fake_agent import FakeAgent
from .evaluators import evaluate_case
from .results import EvalResults

DEFAULT_CASES_DIR = Path(__file__).resolve().parents[2] / "data" / "fake_eval_cases"


def load_cases(cases_dir=DEFAULT_CASES_DIR):
    cases = []
    for path in sorted(Path(cases_dir).glob("*.json")):
        for case in json.loads(path.read_text()):
            case.setdefault("source_file", path.name)
            cases.append(case)
    return cases


def run_case(case):
    agent = FakeAgent(flags=case.get("flags"))
    response = agent.handle(case["input"], langfuse_available=case.get("langfuse_available", True))
    failures = evaluate_case(case, response)
    return response, failures


def run_all(cases_dir=DEFAULT_CASES_DIR):
    results = EvalResults()
    for case in load_cases(cases_dir):
        response, failures = run_case(case)
        results.add(case, response, failures)
    return results
