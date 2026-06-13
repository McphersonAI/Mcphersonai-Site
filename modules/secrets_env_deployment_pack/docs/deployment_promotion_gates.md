# Deployment Promotion Gates

Machine-readable source of truth: `data/promotion_gates.json`. Every promotion
is documented with `templates/environment_promotion_record_blank.md`.

## local_fake → dry_run

Requires: fake data only, tests pass, no secrets, no real client data, package
clean. Approval: none.

## dry_run → pilot_prelaunch

Requires: dry-run completed, starter pack checklist completed, no-secrets scan
passed, reusable template snapshot clean. Approval: **Blake**.

## pilot_prelaunch → pilot_live_restricted

Requires: pilot scope approved, real `.env` created outside GitHub, secrets
stored only on deployment machine, governance approval recorded, kill switches
tested, rollback tested, backups tested, Langfuse mode approved. Approval:
**Blake**.

## pilot_live_restricted → human_only (immediate)

Can happen immediately if a safety concern appears. Blocks tool execution,
memory writes, and outbound actions. Exit requires Blake approval.

## pilot_live_restricted → incident_mode (immediate)

Can happen immediately on: unsafe behavior, bad memory write, incorrect tool
call, trace issue, operator pause request, or Blake decision. Evidence is
preserved; writes and outbound actions are blocked. Exit requires Blake
approval.

## incident_mode → pilot_live_restricted

Requires: issue documented, evidence preserved, patch applied, tests rerun,
rollback/restore verified if needed. Approval: **Blake reactivation approval**.

## Non-negotiable

No script, agent, or checklist in this pack can grant, simulate, or bypass
Blake approval.
