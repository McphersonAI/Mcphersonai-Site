# McPherson AI — Secrets / Environment Deployment Pack

Private internal safety pack. Documentation-first, fully testable, **fake-data-only**.

## What this repo is

This pack defines the environment, secrets, `.env`, deployment promotion, and
snapshot safety rules for McPherson AI. It answers:

- what environments exist (`local_fake`, `dry_run`, `pilot_prelaunch`, `pilot_live_restricted`, `human_only`, `incident_mode`)
- what each environment allows and forbids
- what secret classes exist (Class 0–3)
- where `.env` files may live, and where they must never live
- what never goes to GitHub
- what never goes into reusable snapshots
- how promotion between environments works, and who approves it (Blake)
- how to pause into `human_only` mode and how `incident_mode` works
- how keys are rotated
- how to scan for forbidden files and secret-like patterns
- how to package a clean zip

## What this repo is NOT

- not a live secret manager
- not production deployment automation
- not a live agent, Telegram bot, MCP server, OpenClaw connection, or Langfuse integration
- not a cloud deployment tool
- not a customer-facing product

It stores **no real secrets**, **no real client data**, **no real `.env` files**.

## Why this pack exists

McPherson AI already has the governed pilot infrastructure modules:
SQLite Memory Layer, Langfuse Observability Layer, Governance Layer,
Governed Pilot Starter Pack, Pilot Dry-Run / Snapshot Rehearsal,
MCP Tool Registry Scaffold, and Agent Runtime Harness.

The missing operational layer was a clear system for environments, secrets,
deployment states, and safe promotion from fake/local work into a real governed
pilot. This pack is that layer. The other modules answer *what memory exists*,
*what gets traced*, *what is approved or blocked*, *how a pilot folder is
organized*, *how requests flow*, and *what tools are allowed*. This pack answers
*where secrets live, where they must never live, which environment is active,
and how promotion is approved*.

## How it fits with the other modules

| Module | Question it answers |
|---|---|
| SQLite Memory Layer | what memory exists |
| Langfuse Observability Layer | what gets traced |
| Governance Layer | what is approved or blocked |
| Governed Pilot Starter Pack | how a pilot folder is organized |
| Agent Runtime Harness | how requests flow |
| MCP Tool Registry Scaffold | what tools are allowed |
| **Secrets / Environment Deployment Pack** | **where secrets live, which environment is active, how promotion is approved** |

## How to run everything

```bash
# run the test suite
pytest tests/ -q

# run full pack verification
python3 scripts/verify_env_pack.py

# scan for forbidden file names
python3 scripts/scan_for_forbidden_files.py

# scan for secret-like patterns
python3 scripts/scan_for_secret_patterns.py

# create a fake environment folder (fake data only)
python3 scripts/create_fake_environment_folder.py

# export templates to exports/
python3 scripts/export_env_templates.py

# package a clean zip into dist/
python3 scripts/package_env_pack_zip.py
```

All scripts are offline: no network, no real secrets, no live APIs, no live systems.

## Why no real secrets or client data are included

Real secrets and real client data live only on private deployment machines, in
the correct environment, after the correct promotion gate. This repo is a
template and rulebook. If a real secret ever appears here it is, by definition,
a leak — the scan scripts and tests treat any such finding as a failure.

## Why Blake approval remains required

Promotion into `pilot_prelaunch`, `pilot_live_restricted`, and reactivation out
of `human_only` / `incident_mode` always requires Blake's explicit approval.
No script in this repo can grant, simulate, or bypass that approval. The pack
makes deployment **safer**, not more automatic.

## mcpherson-ai-core preparation

After Claude Code audit and patching, this module is intended for later
inclusion in the private `mcpherson-ai-core` repo at:

```
modules/secrets_env_deployment_pack/
```

See `docs/claude_code_audit_prompt.md` for what to include/exclude and
integration notes. Do not modify `mcpherson-ai-core` directly unless Blake
explicitly asks.
