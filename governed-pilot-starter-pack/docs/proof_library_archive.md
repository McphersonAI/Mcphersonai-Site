# Proof Library Archive

The Proof Library is the permanent artifact history for McPherson AI. After each milestone, save these to the Proof Library:

- Starter pack zip (`dist/mcpherson-governed-pilot-starter-pack_<date>.zip`)
- Module zips (SQLite, Langfuse, Governance — packaged from their own repos)
- Audit reports (Claude Code audit output, saved from `12_audit_reports/`)
- Run verification records (command output from setup checklists)
- Deployment logs (completed `deployment_log` templates)
- Go-live approval records (signed Blake approvals)
- Weekly proof reviews (completed `weekly_proof_review` templates)
- Deferred decisions (current snapshot)
- Known limits (current snapshot)

## Rules

- Proof Library artifacts are versioned and dated; nothing is overwritten
- Anything containing client data is sanitized or kept local-only before archiving
- The Proof Library keeps history; private GitHub keeps approved working code (see `private_github_archive.md`)
