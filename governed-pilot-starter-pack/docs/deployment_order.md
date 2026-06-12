# Deployment Order

Deploy in this order. Do not skip steps. Do not reorder steps 12–16.

1. Create pilot folder (copy `templates/pilot_001_folder/`, rename)
2. Copy approved SQLite Memory Layer into `04_sqlite_memory/`
3. Initialize SQLite with **fake/test data first**
4. Register the pilot in Governance
5. Assign risk tier and approval status
6. Verify kill switch defaults
7. Run Governance tests and evals
8. Prepare Langfuse observability
9. Run fake trace examples
10. Confirm metadata-only trace behavior
11. Confirm NullTrace/fallback behavior
12. Replace fake pilot values with approved real pilot values **only when ready**
13. Create first backup
14. Complete Pilot Readiness Checklist
15. Save deployment log (`templates/deployment_log_blank.md`)
16. **Blake approves go-live** (recorded in `13_go_live_approval/`)
17. Begin restricted pilot mode
18. Schedule weekly proof review

## Why this order

- Fake data first (step 3) means every verification step happens with zero client risk.
- Governance registration (steps 4–7) happens before observability so nothing untracked ever runs.
- Real values enter only at step 12, after every safety check has passed on fake data.
- Step 16 is a human gate. Nothing automates past it.
