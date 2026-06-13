# CLAUDE.md — Instructions for Claude Code

Treat this repo as a **private internal safety scaffold** for McPherson AI.

## Hard rules

- Do NOT add real secrets of any kind.
- Do NOT add real `.env` files (`.env`, `.env.local`, `.env.production`, `.env.pilot`, or any `.env.*` other than `.env.example`).
- Do NOT add live secret manager integration.
- Do NOT add live deployment automation.
- Do NOT add cloud provider APIs.
- Do NOT add Telegram integration.
- Do NOT add OpenClaw integration.
- Do NOT add a live MCP server.
- Do NOT add live Langfuse integration.
- Do NOT add real client data, real pilot databases, real backups, or real logs.
- Do NOT weaken the GitHub safety rules, snapshot safety rules, forbidden file
  patterns, or secret pattern scans.
- Do NOT bypass, simulate, or auto-grant Blake approval anywhere.

## Working rules

- Keep the repo fake-data-only and fully testable (`pytest tests/` must pass).
- Every fake sample template must keep the marker line:
  `SAMPLE ONLY — FICTIONAL — NOT REAL SECRET — NOT REAL CLIENT DATA — NOT APPROVED FOR LIVE USE`
- Scripts must remain offline: no network calls, no real APIs, no live systems.
- After any change, run: `pytest tests/ -q && python3 scripts/verify_env_pack.py`
- The audit prompt lives at `docs/claude_code_audit_prompt.md`.
