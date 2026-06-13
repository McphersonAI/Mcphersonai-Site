# McPherson AI — MCP Tool Registry Scaffold (v0.1)

**Private internal scaffold. Fake data only. No live integrations.**

## What this repo is

This repo defines the controlled tool boundary for future McPherson AI governed
restaurant/QSR pilot agents. It answers one question before any live pilot agent
is ever allowed to use tools:

> **What can the agent actually do?**

It contains:

- A **tool registry** (`data/tool_registry.json`) — every tool an agent may ever
  request, named, categorized, risk-tiered, and mode-gated.
- A **mode policy** (`data/mode_policy.json`) — six operating modes that gate
  reads, writes, outbound actions, and approval-required tools.
- A **deny-by-default policy engine** (`src/mcpherson_mcp_registry/policy_engine.py`)
  that evaluates every requested tool call and returns a structured allow/block
  decision.
- **Fake tools only** — every executable tool in v0.1 returns clearly labeled
  fictional output. Nothing touches a real system.
- **Fake approvals** — approval-required tools run only with a valid fake Blake
  approval; expired, wrong-tool, and wrong-mode approvals are rejected.
- **Trace-style events** — every decision produces a Langfuse-shaped event dict
  for future observability integration. No live Langfuse calls.
- A verification script, demo scripts, a pytest suite, a packaging script, and a
  Claude Code audit prompt.

## What this repo is NOT

- Not a live MCP server
- Not a live agent runtime
- Not a Telegram bot
- Not an OpenClaw connection
- Not a live SQLite integration
- Not a live Langfuse integration
- Not a production API or customer-facing product

## Why this layer exists

McPherson AI's governed pilot stack:

| Layer | Question it answers |
|---|---|
| Governance Layer | Is the agent approved? What risk tier? Kill switches? |
| SQLite Memory Layer | What does the store remember? |
| Langfuse Observability Layer | What did the agent actually do? |
| Governed Pilot Starter Pack | How is a pilot organized and deployed? |
| **MCP Tool Registry (this repo)** | **What is the agent allowed to do, right now, in this mode?** |

Without this layer, the agent risks becoming a loose chat assistant with unclear
powers. With it, every tool is registered, risk-tiered, mode-gated,
approval-gated, logged, blockable, testable, and documented.

## How it fits the future stack

```
Operator / Telegram / App Chat
        ↓
Agent Runtime Harness (future)
        ↓
Governance Check (separate layer)
        ↓
MCP Tool Registry  ← this repo
        ↓
Fake Tool Stub (v0.1) / Real Tool (later, after audit)
        ↓
SQLite / Langfuse / External System (later)
        ↓
Audit Log / Proof Record
```

## Quick start

```bash
# run tests
python -m pytest tests/ -v

# verify the scaffold
python scripts/verify_mcp_registry.py

# demos
python scripts/demo_tool_decisions.py
python scripts/demo_human_only_mode.py
python scripts/demo_incident_mode.py

# export registry + policy + examples
python scripts/export_registry.py

# package a clean zip
python scripts/package_mcp_registry_zip.py
```

No dependencies beyond Python 3.10+ and pytest. No network. No secrets.

## Why no live integrations

Every live integration (MCP server transport, SQLite writes, Langfuse
submission, Telegram, CRM/POS/payroll) is **deferred** and requires a separate
audit before it is built. See `docs/deferred_decisions.md` and
`docs/known_limits.md`. v0.1 exists to make the agent's *future* powers safer,
clearer, testable, and controllable — not to make the agent more powerful.

## Why Blake approval remains required

Approval-required tools (marking a pilot ready, enabling live mode,
reactivating after an incident, exporting public proof, changing logging
posture) are exactly the actions that change the *risk posture* of a pilot.
Those decisions stay human. The policy engine enforces this: no valid approval,
no execution — and in v0.1 even valid approvals are fake and clearly marked
fictional.
