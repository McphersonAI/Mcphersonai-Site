# AGENTS.md

## What this repo does NOT do

- This repo does **not run agents**.
- This repo does **not connect to external systems** (no Telegram, no Langfuse,
  no OpenClaw, no MCP servers, no cloud providers, no model provider APIs).
- This repo does **not manage real secrets**. It only documents how real
  secrets must be classified, located, rotated, and kept out of GitHub,
  snapshots, and zip artifacts.
- This repo does **not deploy anything**. There is no deployment automation.

## What this repo does

- It documents and tests the environment / secrets / `.env` / snapshot safety
  rules for McPherson AI, with fake data only.
- It provides offline verification and scan scripts plus a clean packaging
  command.

## Deferral

All real secret management (secret manager choice, VPS storage method, key
handling for Telegram / Langfuse / model providers) is **deferred** until it is
separately scoped, audited, and explicitly approved by Blake. See
`docs/deferred_decisions.md`.
