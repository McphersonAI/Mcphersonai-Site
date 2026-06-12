# McPherson AI Governance Layer

Private internal governance scaffold for McPherson AI. This repo is the gate
between "we built it" and "it is allowed to run."

## What this repo is

- A **Governance Registry** that tracks every McPherson AI asset (agents,
  prompts, repos, vendors, models, integrations, data stores, workflows,
  documents, pilot deployments) with risk tiers, permissions, kill switches,
  rollback methods, and approval status.
- A **Kill Switch Config Layer** with deny-by-default flags, a runtime guard
  that blocks agent replies / memory writes / tool execution / outbound
  actions, human-only mode, safe pause messaging, and a blocked-action log.
- An **AI Eval Pack** that runs fake safety cases (prompt injection, memory
  poisoning, redaction, kill switch tampering, etc.) against a rule-based
  `FakeAgent`. No real model is called.
- A **Pilot Readiness Checklist** (blank + fake completed sample) that acts
  as the final go-live gate, ending in recorded Blake approval.
- **Weekly Proof / Case Study templates** (private + sanitized public) with a
  hard public/private boundary.

## What this repo is NOT

- Not a customer-facing product, public dashboard, or SaaS admin panel.
- Not a live Telegram bot, live OpenClaw integration, live MCP server, or
  live Langfuse connection.
- No billing, no customer login, no POS/payroll integration.
- No real client data, no real restaurant names, no real employee data,
  no secrets, no API keys. **Fake data only.**

## Install

Python 3.10+ and pytest are the only requirements.

```
pip install pytest
```

No other dependencies. Everything runs locally with the standard library.

## Run tests

```
python -m pytest
```

## Run demos

```
python scripts/demo_registry.py
python scripts/demo_kill_switches.py
python scripts/demo_human_only_mode.py
```

## Run the AI eval pack

```
python scripts/run_evals.py
```

Exits non-zero if any fake safety case fails.

## Export the registry

```
python scripts/export_registry.py     # writes exports/governance_registry_export.csv + .json
python scripts/export_templates.py    # copies templates/ into exports/templates/
```

## Package the repo for the Proof Library

```
python scripts/package_governance_zip.py   # writes dist/mcpherson-governance-layer.zip
```

## Using the readiness checklist

1. Copy `templates/pilot_readiness_blank.md` per pilot.
2. Work every section to `Ready` or `Approved` (see
   `data/samples/fake_pilot_readiness_completed.json` for a machine-readable
   fake sample validated by `src/readiness/checklist.py`).
3. No agent goes live until `is_approved_for_go_live()` is true — which
   requires every section green **and** Blake approval recorded with a date.

## Using the weekly proof templates

- Private proof: `templates/weekly_proof_blank.md` — full detail, internal only.
- Public proof: `templates/sanitized_case_study_blank.md` — only public-safe
  fields. `src/proof/case_study_template.py` strips private fields and fails
  if any leak.
- Estimates must be marked as estimates; the validator enforces this on
  `time_saved_estimate`.

## How this later connects to the live stack

This scaffold is interface-shaped for the real stack but never touches it:

- **SQLite**: `RuntimeGuard.check_memory_write()` becomes the write gate in
  front of the real SQLite memory layer.
- **Langfuse**: `LANGFUSE_MODE=metadata_only` defines the tracing contract;
  swap the fake trace builder for the real client, keeping the no-raw-content
  rule.
- **MCP / tools**: `check_tool_execution()` wraps real tool dispatch.
- **Telegram**: `TELEGRAM_ENABLED` + `check_outbound_action()` gate the real
  bot send path.
- **Diagnostic Console**: reads the registry and readiness checklist as its
  source of truth for what is allowed to run.

## Why Blake approval remains the gate

Every automated check here can pass and the pilot still must not go live
without a recorded human approval. The registry, kill switches, evals, and
checklist reduce risk; they do not transfer accountability. Blake owns the
go/no-go decision, the registry records it, and the Proof Library archives it.
