# Environment Matrix

The machine-readable source of truth is `data/environment_matrix.json`. The six
environments are: `local_fake`, `dry_run`, `pilot_prelaunch`,
`pilot_live_restricted`, `human_only`, `incident_mode`.

## Summary table

| Environment | Secrets | Real client data | Real .env | Live tools | Outbound | Reusable snapshot | Approval |
|---|---|---|---|---|---|---|---|
| local_fake | No | No | No (`.env.example` only) | No | No | Yes, if clean | None |
| dry_run | No | No | No | No | No | Yes, if clean | None |
| pilot_prelaunch | Private deployment machine only | Approved metadata only | Outside GitHub only | No | No | Only if free of real data/secrets | Blake |
| pilot_live_restricted | Pilot-specific machine only | Pilot environment only | Pilot VPS only | Restricted set | Blocked unless separately approved | No | Blake |
| human_only | Frozen, unused | Read-only if approved | Frozen | No | No | No | Blake (to reactivate) |
| incident_mode | Frozen | Read-only evidence | Frozen | No | No | No | Blake (to reactivate) |

## Environment definitions

### local_fake
Local development and fake examples. Allowed: fake data, fake store names,
fake users, `.env.example`, placeholder values. Forbidden: real secrets, real
client data, live tokens, production URLs, real pilot databases, real backups.

### dry_run
Full fake governed pilot rehearsal. Allowed: fake pilot folder, fake SQLite
data, fake governance registry, fake trace events, fake MCP decisions, fake
runtime scenarios. Forbidden: real secrets, real client data, live Telegram
token, live Langfuse production key, real pilot `.env`, real store database,
real customer backups.

### pilot_prelaunch
A real pilot is likely or approved, but before live traffic. Allowed:
client-specific folder, approved real pilot metadata, local secrets outside
GitHub, real `.env` stored only on the private deployment machine, restricted
test runs, Blake approval records. Forbidden: reusable snapshots containing
real secrets, GitHub commits with `.env`, public proof, outbound actions, live
autonomous behavior.

### pilot_live_restricted
Only after Blake approval for restricted live pilot use. Allowed: real pilot
`.env` on the client-specific VPS only, restricted live agent operation,
governed memory writes if approved, Langfuse metadata-only tracing if approved,
backups for that pilot only, weekly proof review. Forbidden: reusable template
snapshots containing real pilot data, public proof without approval, outbound
actions unless separately approved, broad live integrations, unrestricted tool
execution.

### human_only
The system must not execute agent/tool behavior. Allowed: human review,
read-only inspection if approved, incident documentation, manual operation.
Forbidden: tool execution, memory writes, outbound actions, reactivation
without Blake approval. See `human_only_mode.md`.

### incident_mode
Something must be paused, reviewed, preserved, restored, or investigated.
Allowed: incident copy, read-only review, backup identification, rollback
documentation, patch and retest process. Forbidden: writes, outbound actions,
live mode, reactivation without Blake approval, deleting incident evidence.
See `incident_mode.md`.
