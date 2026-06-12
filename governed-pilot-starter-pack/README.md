# McPherson AI — Governed Pilot Starter Pack

**Version:** v0.1 (pre-audit)
**Status:** Built by Fable. Awaiting Claude Code audit. Awaiting Blake approval.

---

## What this is

The Governed Pilot Starter Pack is the **deployment wrapper** that ties the three audited McPherson AI infrastructure modules into one repeatable, controlled pilot setup process:

1. **SQLite Memory Layer** — approved operational memory, follow-ups, handoffs, proof events, weekly summaries
2. **Langfuse Observability Layer** — agent trace / black box recorder
3. **Governance Layer** — asset registry, risk tiers, kill switches, evals, pilot readiness, Blake approval

This repo sits in the operating path here:

```
Operator Diagnostic → Written Assessment → Pilot Scope →
[ THIS PACK: Governed Pilot Setup ] → Live Pilot → Weekly Proof Review
```

It begins after pilot scope is defined and ends when Blake signs the go-live approval.

## What this is NOT

- Not a customer-facing product
- Not a public SaaS dashboard
- Not a live Telegram bot, MCP server, or app connector
- Not production deployment automation
- Not a rebuild of SQLite, Langfuse, or Governance modules
- Not a substitute for Blake approval

## Why it exists

The build phase created the pieces. The deployment phase needs an operating procedure. Without this pack, every deployment would be improvised. With it, McPherson AI can say: **"This is how we prepare a governed pilot."**

## How it fits after SQLite, Langfuse, and Governance

Each module ships separately and is audited separately. This pack does not contain their code — it contains the **map** for assembling them: folder structure, deployment order, setup checklists, dry-run proof, go-live gate, and rollback path. See `docs/deployment_overview.md` and `docs/deployment_order.md`.

## How to use the templates

1. Read `docs/pilot_folder_structure.md`.
2. Run `python3 scripts/create_fake_pilot_folder.py` to generate a fake pilot folder from `templates/pilot_001_folder/` (fake data only).
3. For a real pilot, copy `templates/pilot_001_folder/` to a private location, rename to `pilot_NNN_store_name/`, and fill the blank templates (`*_blank.md`). Fake samples (`*_fake_sample.md`) show what a completed artifact looks like.

## How to run tests

```bash
pip install pytest
python3 -m pytest
```

## How to verify the starter pack

```bash
python3 scripts/verify_starter_pack.py
```

Checks required docs, required templates, the pilot folder template, required checklist sections, and scans templates for secrets or real-client-data patterns.

## How to export templates

```bash
python3 scripts/export_starter_pack_templates.py
```

Copies `templates/` into a dated folder under `exports/` (gitignored).

## How to package the starter pack zip

```bash
python3 scripts/package_starter_pack_zip.py
```

Creates `dist/mcpherson-governed-pilot-starter-pack_<date>.zip`, excluding `.env`, `__pycache__`, `.pyc`, `dist/`, `exports/`, `backups/`, `secrets/`, `client_data/`, `logs/`, and `fake_pilot_output/`. The zip is what gets archived in the Proof Library.

## Why Blake approval remains the gate

This pack makes deployment more controlled, not more autonomous. No checklist, script, or test here can put a pilot live. Go-live, reactivation after incident, sanitized content logging, live Telegram, MCP tool writes, client-facing reports, and public proof all require recorded Blake approval. See `docs/blake_approval_rules.md`. **Fable builds. Claude Code audits. Blake approves. Only then does a pilot go live.**

## Repo map

- `docs/` — deployment overview, order, setup checklists, dry-run, go-live, rollback, archive rules, limits, deferred decisions, approval rules, audit prompt
- `templates/` — pilot folder template (15 numbered subfolders, each with a README) plus blank + fake-sample artifacts
- `scripts/` — verify, create fake pilot folder, export templates, package zip
- `tests/` — pytest suite enforcing the definition of done
- `data/` — fake manifests and required-sections definitions
