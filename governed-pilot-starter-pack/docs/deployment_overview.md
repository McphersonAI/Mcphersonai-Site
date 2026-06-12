# Deployment Overview

## Purpose

The Governed Pilot Starter Pack ties the audited McPherson AI infrastructure modules together into one repeatable pilot deployment process. **It does not rebuild those modules.**

The three modules and their roles:

| Module | Role |
|---|---|
| SQLite Memory Layer | Stores approved operational memory, follow-ups, handoffs, proof events, weekly summaries |
| Langfuse Observability Layer | Traces agent behavior; the black box recorder |
| Governance Layer | Tracks assets, risk tiers, kill switches, evals, pilot readiness, proof templates, Blake approval |

## Strategic position

```
Operator Diagnostic → Written Assessment → Pilot Scope →
GOVERNED PILOT SETUP (this pack) → Live Pilot → Weekly Proof Review
```

The pack begins after pilot scope is defined and before the live agent launches. Its job is to make deployment **controlled, repeatable, and auditable**.

## What it supports

- First governed pilot setup
- A repeatable deployment process for every pilot after it
- The checklist between "the modules exist" and "the pilot is ready"

## What it does not do

- It does not create new agent behavior
- It does not add live Telegram, MCP, customer portal, app store, billing, POS, or payroll integrations
- It does not make the system more autonomous

## Final rule

Repeatable governed pilot setup, not more product features. Fable builds the pack. Claude Code audits it. Blake approves it.
