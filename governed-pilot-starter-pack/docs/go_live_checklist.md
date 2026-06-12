# Go-Live Checklist

**A pilot does not go live unless every item below is checked.** There is no partial go-live. There is no automated go-live.

- [ ] Diagnostic is completed
- [ ] Written assessment is completed
- [ ] Pilot scope is approved
- [ ] Pilot is registered in Governance
- [ ] Risk tier is assigned
- [ ] SQLite is ready (full setup checklist passed)
- [ ] Backup is created
- [ ] Restore path is tested
- [ ] Governance tests pass
- [ ] Evals pass
- [ ] Kill switches are tested
- [ ] Human-only mode is tested
- [ ] Langfuse or approved trace fallback is ready
- [ ] Secrets are checked (none stored, none committed)
- [ ] No real data is committed to GitHub
- [ ] Weekly proof review is scheduled
- [ ] **Blake approval is recorded** (signed record in `13_go_live_approval/`)

## The gate

The final item is a human gate. Blake approval must be recorded in writing using `templates/go_live_approval_blank.md`. No script, agent, or checklist completion substitutes for it.
