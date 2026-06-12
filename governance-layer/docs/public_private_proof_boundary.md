# Public / Private Proof Boundary

Private fields that must never appear in public output:
`private_notes`, `screenshots_evidence`, `operator_feedback`.

`src/proof/case_study_template.py` enforces this: `to_public()` strips
private fields and raises if any would leak; `validate_public()` rejects
any record containing them. Tests assert the boundary
(`tests/test_weekly_proof_template.py`).

Publishing flow: private weekly record → `to_public()` → human review →
Blake approval → publish. Nothing public skips the approval step.
