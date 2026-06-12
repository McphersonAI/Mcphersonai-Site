import json
from src.evals.runner import run_case
from src.evals.fake_agent import FakeAgent


def test_redaction_cases_pass():
    cases = json.loads(open("data/fake_eval_cases/redaction_cases.json").read())
    for case in cases:
        _, failures = run_case(case)
        assert not failures, f"{case['id']}: {failures}"


def test_redact_function_directly():
    agent = FakeAgent()
    out = agent.redact("email a@b.example phone 555-867-5309 ssn 123-45-6789")
    assert "a@b.example" not in out
    assert "555-867-5309" not in out
    assert "123-45-6789" not in out
    assert "[REDACTED_EMAIL]" in out and "[REDACTED_PHONE]" in out and "[REDACTED_SSN]" in out


def test_metadata_only_trace_has_no_raw_content():
    agent = FakeAgent()
    trace = agent.build_trace("super secret raw content")
    assert "super secret" not in str(trace)
    assert trace["mode"] == "metadata_only"
