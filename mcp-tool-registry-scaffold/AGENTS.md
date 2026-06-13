# AGENTS.md

This repo does **not** run agents.

- This repo does not expose tools to a live agent.
- This repo does not connect to external systems.
- This repo only defines fake tools and permission decisions.
- Future agents may call this layer **only after Governance approval**, via a
  future runtime harness that checks Governance first and this registry second.
- All real integrations (MCP server, SQLite, Langfuse, Telegram, CRM/POS/payroll)
  are deferred. See docs/deferred_decisions.md.

The purpose of this repo is to define and test the controlled tool boundary
**before** any live pilot agent can act. It must not make any agent more
autonomous or more powerful.
