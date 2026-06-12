# mcpherson-agent-memory

SQLite store-memory backbone for McPherson AI agent infrastructure. This is the lightweight, local-first data layer that lets a phone/chat restaurant operations agent remember per-store operational context: shift notes, handoffs, follow-ups, waste, receiving issues, labor notes, weekly summaries, pilot proof events, and agent event logs.

## What this layer does

- Stores private operational memory per store in a single SQLite file
- Returns recent memory as JSON or a compact text block for an agent prompt
- Tracks follow-ups through open → done/parked lifecycles
- Logs agent events with a `trace_id` field reserved for future Langfuse correlation
- Exports any store's full memory to JSON for review, backups, or case studies
- Backs up and restores the database safely using SQLite's online backup API

## What this layer does NOT do

- No customer portal, POS integration, payroll integration, billing, or multi-tenant SaaS auth
- No live LLM API calls (the agent runtime example uses a placeholder response)
- No Langfuse implementation yet (trace_id fields exist; wiring comes later)
- No Telegram bot or MCP server yet (this is the layer those will call into)
- No secrets, API keys, payroll data, or real customer/employee data — ever

## Requirements

- Python 3.10+ (uses only the standard library: `sqlite3`, `uuid`, `json`, `pathlib`)
- `pytest` for the test suite: `pip install pytest`

Optional: the `sqlite3` CLI for manual inspection (`sudo apt install sqlite3` on Ubuntu, usually preinstalled on macOS).

## Install

```bash
git clone <your-repo-url> mcpherson-agent-memory   # or copy the folder
cd mcpherson-agent-memory
pip install pytest
```

No other dependencies. The database lives at `data/mcpherson_memory.db` by default; override with the `MCPHERSON_DB_PATH` environment variable (see `.env.example`).

## Initialize the database

```bash
python scripts/init_db.py
# or a custom path:
python scripts/init_db.py /path/to/custom.db
```

Migrations in `migrations/` run in filename order and are idempotent — re-running is safe.

## Seed demo data (fictional)

```bash
python -m src.seed_demo
```

Creates one fully populated fake store ("Demo Bagel Co. #001") with shift notes, a handoff, follow-ups, waste/receiving/labor entries, a weekly summary, a pilot proof event, and an agent event. All data is fictional.

## Try the fake agent flow

```bash
python -m src.agent_runtime_example
```

Seeds a demo store, simulates an operator message, prints the compact context block an agent would receive, writes the message back as a shift note, and logs an `agent_events` row with a trace_id — no LLM call involved.

## Inspect the database

```bash
python scripts/inspect_db.py
# or with the sqlite3 CLI:
sqlite3 data/mcpherson_memory.db ".tables"
sqlite3 data/mcpherson_memory.db "SELECT name, status FROM stores;"
```

## Run tests

```bash
pytest
```

Tests cover schema creation, foreign key enforcement, every helper function, the seed script, JSON export, backup/restore round-trips, and the fake agent runtime flow. Everything runs against throwaway temp databases with fictional data and requires no API keys.

## Back up the database

```bash
python scripts/backup_db.py                # writes to data/backups/
python scripts/backup_db.py /mnt/backups   # custom directory
```

Backups are timestamped (`mcpherson_memory_20260611T193000Z.db`) and use SQLite's online backup API, which is safe even while the database is in use.

## Restore from backup

```bash
python scripts/restore_db.py data/backups/mcpherson_memory_20260611T193000Z.db data/mcpherson_memory.db
```

Warning: this overwrites the target path.

## Export store memory to JSON

```python
from src import export_service
export_service.export_store_memory_to_json("<store-id>", "exports/store.json")
export_service.export_all_stores_to_json("exports/all_stores.json")
```

## Using it from agent code

```python
from src import memory_service as ms

ms.init_db()
store_id = ms.create_store("My Pilot Store", location="San Diego, CA", concept_type="qsr")
ms.add_shift_note(store_id, "2026-06-11", "am", "equipment", "Espresso machine leaking.", severity="high")
ms.add_follow_up(store_id, "Call espresso vendor", due_date="2026-06-12")

context = ms.get_recent_memory_text(store_id, days=14)   # paste into agent prompt
ms.log_agent_event(store_id, "message_handled", skill_name="ops_assistant", trace_id="...")
```

## How this connects to the rest of the stack later

- **Telegram**: the bot handler resolves the operator's store_id, calls `get_recent_memory_text()` for context, and writes notable items back via the `add_*` helpers.
- **Langfuse**: generate a trace at the start of each agent run and store its id in `agent_events.trace_id` (the index already exists). SQLite stays the memory layer; Langfuse handles observability separately.
- **MCP tool layer**: each helper function maps cleanly to an MCP tool (e.g., `add_follow_up`, `get_open_followups`), so an MCP server can wrap `memory_service` directly.
- **Diagnostic & Proof Console**: reads `pilot_proof_events` and `weekly_summaries` (or the JSON exports) to build before/after pilot evidence. This repo is the data layer, not that app.

## Safety notes

- Never store API keys, tokens, or secrets in this database or repo. `.env.example` is a template only — real `.env` files stay out of version control.
- Never store payroll data, customer private data, or employee personal data. `contact_hint` is for non-sensitive hints (e.g., a Telegram handle), not phone numbers or addresses.
- All seed and test data must remain fictional. If you connect a real pilot store, keep its database file out of any shared or public repo and back it up to a private location.

## Allowed data

- Fictional store names, fictional operator display names, fictional vendor names (e.g. "Fictional Produce Co.")
- Operational notes describing generic equipment issues, shift observations, waste events, receiving issues, labor trends
- Contact hints that are non-sensitive (e.g., a Telegram handle, not a phone number or personal email)
- Aggregated estimates (dollar amounts, hours) derived from visible operational data

## Forbidden data

- API keys, tokens, secrets, passwords, or credentials of any kind
- Real employee names, SSNs, payroll records, or HR data
- Real customer names, financial data, or personally identifiable information
- Real restaurant chain names or franchisee identity unless explicitly approved and anonymized
- Production database files committed to any repository
- Live POS data, live sales data, or live inventory records
- Any data that identifies a real individual by name + location + role combination

## Blake approval required before live pilot use

This repository is **fake/local development only** until Blake McPherson reviews and approves it for a governed pilot dry-run. The following gates must be satisfied before this layer may be connected to a real pilot store:

1. This audit (or a subsequent one) must be marked APPROVED or APPROVED WITH PATCHES.
2. Blake must review the audit report and sign off on the memory layer design.
3. A real pilot store's database file must never be committed to any shared or public repository.
4. The governed pilot dry-run plan must be reviewed and approved separately.

Do not bypass these gates. Do not add live integrations, real API keys, or real store data until Blake explicitly approves the transition from fake/local to governed pilot use.
