# Pilot Folder Structure

Every new pilot gets a **local/private** folder (never committed to GitHub with client data) using this structure:

```
pilot_001_store_name/
  00_admin/
  01_diagnostic/
  02_written_assessment/
  03_pilot_scope/
  04_sqlite_memory/
  05_langfuse_observability/
  06_governance/
  07_kill_switches/
  08_eval_results/
  09_backups/
  10_exports/
  11_weekly_proof/
  12_audit_reports/
  13_go_live_approval/
  14_known_limits/
```

A ready-to-copy template lives at `templates/pilot_001_folder/`. **Each subfolder contains a README explaining what belongs there and what must never be stored there.** Read those READMEs before filling a real pilot folder.

## Rules

- One folder per pilot, numbered sequentially (`pilot_001_...`, `pilot_002_...`)
- Real pilot folders stay local/private; only sanitized, approved artifacts move to the Proof Library
- No secrets in any subfolder; module `.env` files stay with the modules
- Backups containing client data never leave `09_backups/` and never reach GitHub
