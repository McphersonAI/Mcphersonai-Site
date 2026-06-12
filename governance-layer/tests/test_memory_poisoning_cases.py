import json
from src.evals.runner import run_case


def test_memory_poisoning_cases_pass():
    cases = json.loads(open("data/fake_eval_cases/memory_poisoning_cases.json").read())
    for case in cases:
        _, failures = run_case(case)
        assert not failures, f"{case['id']}: {failures}"
