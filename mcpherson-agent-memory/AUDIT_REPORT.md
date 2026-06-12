# McPherson AI SQLite Memory Layer — Audit Report

**Auditor:** Claude Code (claude-sonnet-4-6)
**Date:** 2026-06-12
**Repo audited:** `mcpherson-agent-memory` (uploaded as `mcphersonagentmemory.zip`)
**Branch:** `claude/mcpherson-sqlite-audit-zhtchu`

---

## Overall Verdict

**APPROVED WITH PATCHES**

Three minimal patches were applied (see §Patches Applied). All 24 tests pass after patching. No secrets, no real client data, no live integrations found.

---

## Test Result

**24 passed / 0 failed**

```
tests/test_agent_runtime_example.py   4 passed
tests/test_export.py                  3 passed
tests/test_memory_service.py         11 passed
tests/test_schema.py                  6 passed
```

---

## Script Results

| Script | Result |
|--------|--------|
| `python3 scripts/init_db.py` | CLEAN |
| `python3 -m src.seed_demo` | CLEAN |
| `python3 -m src.agent_runtime_example` | CLEAN |
| `python3 scripts/inspect_db.py` | CLEAN |
| `python3 scripts/backup_db.py` | CLEAN |
| `python3 scripts/restore_db.py <backup> <target>` | CLEAN |

All scripts use fake data, create only local output, require no secrets, and connect to no external services.

---

## Safety Result

- **Secrets found:** None
- **API keys found:** None
- **Tokens found:** None (`.env.example` has commented-out placeholder names only)
- **Real client data found:** None
- **Real restaurant names found:** None (all store names clearly fictional: "Demo Bagel Co. #001", "Faketown, CA")
- **Real employee names found:** None ("Pat Demo" is clearly fictional)
- **Real phone numbers / emails / SSNs / payroll data:** None
- **Production URLs found:** None
- **Unsafe `.env` files found:** None
- **Committed `.db` / `.sqlite` files (with data):** None (`.gitignore` covers `data/*.db` and `data/backups/`)

---

## Schema Result

**Acceptable**

Tables audited: `stores`, `store_users`, `shift_notes`, `follow_ups`, `handoffs`, `waste_logs`, `receiving_logs`, `labor_notes`, `weekly_summaries`, `pilot_proof_events`, `agent_events`

- All tables have UUID primary keys. ✅
- All child tables have foreign keys referencing `stores(id)` with cascade behavior. ✅
- `PRAGMA foreign_keys = ON` is set on every connection in `src/db.py`. ✅
- Timestamps (`created_at`) on every table. ✅
- Status fields constrained via `CHECK` clauses (`severity`, `role`, `status`). ✅
- All tables scoped to `store_id`. ✅
- No table stores API keys, tokens, or passwords. ✅
- `contact_hint` field is explicitly documented as non-sensitive hints only (not phone numbers or emails). ✅
- Schema versioning: migrations run in sorted filename order and are idempotent (`CREATE TABLE IF NOT EXISTS`). Acceptable for v0.1. ✅
- `agent_events.metadata_json` stores serialized JSON — no raw prompt/response logging by default. ✅

Minor schema note: `agent_events.store_id` allows `NULL` (correct for system-level events without a store context). Intentional.

---

## SQL Safety Result

**Parameterized — safe**

All INSERT, UPDATE, and SELECT statements use `?` parameter placeholders for all user-supplied values.

Five locations use f-string table/column name interpolation:

| Location | Variable | Source |
|----------|----------|--------|
| `memory_service.py:289` | `table`, `date_col` | `_RECENT_TABLES` (module constant) |
| `memory_service.py:369` | `table` | `STORE_SCOPED_TABLES` (module constant) |
| `memory_service.py:386` | `table` | `STORE_SCOPED_TABLES` (module constant) |
| `scripts/inspect_db.py:20` | `t` | `TABLES` (module constant) |
| `tests/test_memory_service.py:151` | `table` | hardcoded list literal |

All five use hardcoded internal module constants — never user input. There is no SQL injection risk. A defensive comment was added to `memory_service.py` above `_RECENT_TABLES` explaining this.

---

## Backup/Restore Result

**Acceptable**

- Backup uses SQLite's online backup API — safe under concurrent use. ✅
- Backup filename is timestamped (`mcpherson_memory_20260612T234519Z.db`). ✅
- Backup destination is local (`data/backups/` default, overridable). ✅
- No automatic cloud upload. ✅
- Backup files are gitignored via `data/backups/`. ✅
- Restore requires explicit source path and target path — no silent defaults. ✅
- Restore prints a warning ("WARNING: overwrites target_path.") in script docstring. ✅
- `test_backup_and_restore_roundtrip` verifies data survives the round-trip. ✅

---

## Export Result

**Acceptable**

- JSON export (`export_store_memory_to_json`, `export_all_stores_to_json`) writes to a caller-specified local path. ✅
- Export directory is created by `Path.mkdir(parents=True, exist_ok=True)` — no silent cloud upload. ✅
- `exports/` folder is gitignored. ✅
- No secrets or API keys exported. ✅
- Export contains only operational memory fields. ✅
- Export is documented as private/internal in README. ✅
- No "public proof approval" language in export output. ✅

---

## Agent Event / Audit Event Result

**Acceptable**

`agent_events` table captures:
- UUID id, timestamp, store_id, event_name, skill_name, prompt_version, trace_id, status, metadata_json ✅
- `source` is represented via `skill_name` and `prompt_version` fields ✅
- Fake runtime events tagged with `skill_name="seed_demo"` / `"store_memory_demo"` ✅
- `trace_id` reserved for future Langfuse correlation — not wired yet (intentional) ✅
- `metadata_json` stores structured dicts (serialized), not raw prompt/response text by default ✅
- No raw unrestricted prompt logging ✅

---

## Integration Boundary Result

**Clean — no live integrations**

This module does NOT implement:
- Live LLM API calls (placeholder response used) ✅
- Telegram bot ✅
- MCP server ✅
- Langfuse integration (trace_id field reserved only) ✅
- OpenClaw connection ✅
- Customer portal / public dashboard ✅
- POS / payroll / billing integration ✅

README clearly explains that Telegram, Langfuse, and MCP tool layer are deferred future integrations that will call into this layer — this is the data layer only. ✅

---

## Patches Applied

### 1. `.gitignore` — Added missing required exclusions

Added: `.env.*`, `dist/`, `secrets/`, `client_data/`, `logs/`, `*.sqlite`, `*.sqlite3`, `.DS_Store`, `*.pyo`

**Before:** only excluded `.env`, `data/*.db`, `data/backups/`, `exports/`, `__pycache__/`, `*.pyc`, `.pytest_cache/`

**After:** full set of exclusions matching McPherson AI safety requirements

### 2. `README.md` — Added explicit Blake approval gate and data boundary sections

Added three new sections:
- **Allowed data** — explicit list of what is permitted
- **Forbidden data** — explicit list of what is never permitted (API keys, SSNs, payroll, PII, real restaurant identity, production DB files)
- **Blake approval required before live pilot use** — four explicit gates that must be satisfied before connecting to a real pilot store

### 3. `src/memory_service.py` — Defensive comment on f-string table name interpolation

Added a two-line comment above `_RECENT_TABLES` explaining that table and column name interpolation uses only internal module constants (never user input) and that all SQL parameters use `?` placeholders. This protects future developers from accidentally extending the pattern unsafely.

---

## Definition-of-Done Verification

| Item | Result |
|------|--------|
| Repo initializes locally | PASS |
| Required root docs exist (README, .gitignore, .env.example) | PASS |
| SQLite database initializes | PASS |
| Schema is clear and scoped | PASS |
| Foreign keys are enabled | PASS |
| SQL uses parameterized queries | PASS |
| Fake store profile works | PASS |
| Fake shift notes work | PASS |
| Fake follow-ups work | PASS |
| Fake proof events work | PASS |
| Fake weekly summaries work | PASS |
| Fake agent events work | PASS |
| JSON export works | PASS |
| Backup works | PASS |
| Restore works | PASS |
| Tests pass | PASS (24/24) |
| Scripts run cleanly | PASS |
| Package script creates clean zip | N/A (no package script present) |
| No secrets included | PASS |
| No real client data included | PASS |
| No unsafe database files committed | PASS |
| Backups are gitignored | PASS |
| Exports are gitignored | PASS |
| No live integrations | PASS |
| README explains boundaries | PASS (after patch) |
| Blake approval required before live pilot use | PASS (after patch) |
| Safe to commit to private GitHub after Blake approval | PASS |
| Safe to archive in Proof Library | PASS |

---

## Critical Issues

None found.

---

## Deferred Decisions for Blake

1. **Schema versioning strategy**: Migrations are currently filename-ordered and idempotent but there is no migration version tracking table. For v0.1 this is acceptable; before a governed pilot with schema evolution, consider adding a `schema_migrations` table.

2. **`contact_hint` field scope**: The field allows any string (e.g., Telegram handle). No validation is enforced at the DB layer. If real pilot use begins, a policy decision is needed on what is and isn't acceptable in this field.

3. **`agent_events.metadata_json` unbounded**: The metadata field can store any JSON. No size limit or schema constraint exists. Acceptable for v0.1; review before high-volume use.

4. **Package/distribution script**: No package script exists. If this layer needs to be distributed as a zip for governed pilot operators, a `scripts/package_memory_zip.py` should be added with appropriate exclusions. Deferred to Blake's direction.

5. **Restore safety UI**: The restore script overwrites the target silently (with only a docstring warning). Before live pilot use, consider adding an interactive confirmation prompt or a `--confirm` flag.

---

## Summary

| Category | Status |
|----------|--------|
| Overall verdict | APPROVED WITH PATCHES |
| Tests | 24 / 24 passed |
| Scripts | All 6 ran cleanly |
| Secrets | None found |
| Real client data | None found |
| Committed DB files | None |
| Schema | Acceptable |
| SQL safety | Parameterized (f-strings use internal constants only) |
| Backup/restore | Acceptable |
| Export | Acceptable |
| Live integrations | None |
| Critical issues | None |
| Patches applied | 3 (gitignore, README approval gate, memory_service comment) |
| Safe to commit to private GitHub | Yes |
| Safe to archive in Proof Library | Yes |
| Ready as McPherson AI SQLite Memory Layer v0.1 | Yes — after Blake approval for governed pilot dry-run |

**Recommended next step:** Archive in Proof Library, commit to private GitHub, then schedule governed pilot dry-run review with Blake.
