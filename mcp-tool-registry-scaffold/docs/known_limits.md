# Known Limits (v0.1)

- Not a live MCP server — no transport, no ports, no protocol implementation
- Not live tool execution — every executable tool is a fake stub
- Not connected to real systems — no POS, payroll, CRM, Telegram, OpenClaw
- Fake data only — every record carries the fictional marker
- No secrets — verified by tests and the verification script
- No real client data — fictional "Cantina Del Sol" sample context only
- No external calls — fully offline; trace events are local dicts
- No production deployment — no hosting, auth, or multi-tenant anything
- **Future integration requires a separate audit** — connecting this registry
  to a real MCP server, SQLite, Langfuse, or any live channel is out of scope
  for v0.1 and must not be added without its own review.
