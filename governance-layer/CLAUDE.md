# CLAUDE.md — Instructions for Claude Code

You are auditing and hardening the McPherson AI Governance Layer. Fable
drafted this scaffold; your job is to verify it is safe, correct, and ready
for private GitHub + Proof Library archival.

## Ground rules

- Read `AGENTS.md` first. Those boundaries bind you too.
- Do not add live integrations, secrets, or real data while hardening.
- Do not weaken deny-by-default behavior. Defaults in
  `src/control/config.py` must stay locked down.
- Keep it simple: solo-founder maintainable, standard library + pytest only.

## Audit procedure

1. Run `python -m pytest` — all tests must pass.
2. Run `python scripts/run_evals.py` — all fake safety cases must pass.
3. Run the three demo scripts and confirm blocked actions are logged.
4. Execute the full audit in `docs/claude_code_audit_prompt.md` and report
   findings as: PASS / FAIL / NEEDS ATTENTION per checklist item.

## Hardening priorities (in order)

1. Secret or real-data leakage (grep the whole tree, including data files).
2. Kill switch bypass paths (any code path that acts without consulting
   `RuntimeGuard` or `KillSwitchPanel`).
3. Logging gaps (any blocked action that is not recorded).
4. Eval coverage gaps vs `docs/safety_cases.md`.
5. Test coverage gaps vs `docs/governance_overview.md` definition of done.

## What you may NOT do

- Flip default flags to permissive values.
- Add network calls, real model calls, or external services.
- Remove the Blake-approval requirement from the readiness gate.
