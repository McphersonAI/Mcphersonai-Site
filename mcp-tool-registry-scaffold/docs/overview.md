# Overview

The MCP Tool Registry Scaffold defines the **controlled tool boundary** for
future McPherson AI governed pilot agents. It answers, before any agent ever
touches a real system: *what can the agent actually do?*

## Boundaries

This repo is a private internal scaffold. It is:

- **Documentation-first** — every model (tools, modes, approvals, traces) is documented before code.
- **Deny-by-default** — a tool call is blocked unless every condition passes.
- **Fake-data-only** — every result carries the fictional marker. No real stores, clients, or employees.
- **Offline** — no network calls, no secrets, no live integrations.

It is NOT a live MCP server, agent runtime, Telegram bot, OpenClaw connection,
SQLite integration, Langfuse integration, or customer-facing product.

## Why it exists

Without a tool boundary, a pilot agent is a loose chat assistant with unclear
powers. With this layer, every tool is registered, named, risk-tiered,
mode-gated, approval-gated, logged, blockable, testable, and documented —
which turns tool access into a controlled pilot asset.
