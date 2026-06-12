# AGENTS.md

## This repo does not run agents

This starter pack contains **documentation, templates, scripts, and tests only**. There is no agent runtime here, and none should be added.

## Non-negotiables

- No autonomous behavior of any kind
- No live Telegram bot or Telegram API calls
- No live MCP server or MCP tool connections
- No live OpenClaw connection
- No live Langfuse API calls (fake trace examples are documented in the module repos, not executed here)
- No real customer data, real restaurant names, or real employee data
- No secrets, API keys, or tokens

## What this pack does

It documents deployment and readiness steps for assembling the audited SQLite, Langfuse, and Governance modules into a governed pilot. Every path through this pack terminates at a **human gate: recorded Blake approval**. Nothing in this repo can put an agent live, and nothing should be added that can.
