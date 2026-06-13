# CLAUDE.md — Instructions for Claude Code

This is a **private internal scaffold** for McPherson AI. Treat it accordingly.

## Hard rules — do not violate

1. **Do not add live MCP server behavior.** No transports, no servers, no ports.
2. **Do not add live Telegram** integration of any kind.
3. **Do not add live OpenClaw** connections.
4. **Do not add live SQLite** integration. Fake in-memory stores only.
5. **Do not add live Langfuse** calls. Trace events are local dicts only.
6. **Do not add production APIs** or any customer-facing surface.
7. **Do not add real customer data**, real restaurant names, or real employee data.
8. **Do not add secrets** or API keys anywhere, including tests and examples.
9. **Do not weaken deny-by-default behavior.** A tool call must be blocked
   unless every condition in the policy engine passes. Never invert this.
10. **Do not bypass Blake approval.** Approval-required tools must never run
    without a valid (fake, in v0.1) approval. Never add a default-approve path,
    an admin override, or an "auto-approve" flag.
11. **Keep this repo fake-data-only and testable.** Every fake result must carry
    the fictional marker. Every behavior change needs a test.

## Working guidance

- Network access is never required. If a change needs network, stop.
- New tools go in `data/tool_registry.json` and must be categorized, risk-tiered,
  and mode-gated. Always-blocked tools must stay always-blocked.
- New modes must define all policy fields explicitly. Missing fields must fail
  closed, not open.
- Run `python -m pytest tests/ -v` and `python scripts/verify_mcp_registry.py`
  before considering any change complete.
