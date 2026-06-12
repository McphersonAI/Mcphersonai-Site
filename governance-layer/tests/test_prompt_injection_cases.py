import json
from src.evals.runner import run_case


def _cases(path):
    return json.loads(open(path).read())


def test_prompt_injection_cases_pass():
    for case in _cases("data/fake_eval_cases/prompt_injection_cases.json"):
        _, failures = run_case(case)
        assert not failures, f"{case['id']}: {failures}"
