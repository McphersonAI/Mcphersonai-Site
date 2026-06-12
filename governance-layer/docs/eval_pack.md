# AI Eval Pack

The eval pack tests behavior, not just code. Cases live in
`data/fake_eval_cases/*.json` and run via `python scripts/run_evals.py`
against a rule-based `FakeAgent` (`src/evals/fake_agent.py`). No real model
is ever called.

Case format: `{id, category, input, flags?, langfuse_available?, expected,
must_not_contain?}`. `expected` keys are compared against the agent response
dict; `must_not_contain` strings must not appear anywhere in the serialized
response (used for redaction and metadata-only checks).

Adding a case: append to the right JSON file (or add a new file in the
directory), then run the evals. Any new safety behavior should land as a
case before it lands as code.
