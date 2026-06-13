# Claude Code Audit Prompt

Copy-paste the following into Claude Code from the repo root:

---

You are auditing the McPherson AI **MCP Tool Registry Scaffold v0.1**, a
private, fake-data-only internal scaffold that defines the controlled tool
boundary for future governed pilot agents. Read README.md, CLAUDE.md,
AGENTS.md, docs/, data/, src/, scripts/, and tests/ before reporting.

Audit and report on each of the following, with file/line references:

1. **Safety posture** — Is the repo genuinely offline? Any network call,
   socket, subprocess, or live integration anywhere?
2. **Deny-by-default** — Walk the policy engine. Is there any path where a
   tool runs without passing every condition (mode exists, not human_only,
   registered, enabled, not always-blocked, fake_only, mode allowed, action
   type allowed, incident restrictions, approval)? Do missing config fields
   fail closed?
3. **Approval-required behavior** — Can any approval-required tool run without
   a valid approval? Do wrong-tool, wrong-mode, and expired approvals get
   rejected? Is there any override, default-approve, or bypass path?
4. **Human-only mode** — Does it block every tool, every category, even with
   valid approvals present?
5. **Incident mode** — Are writes, control actions, outbound actions, and
   reactivation blocked? Are only safe reads allowed?
6. **Fake-only tool behavior** — Does any tool touch the filesystem outside
   fake_output/, a database, or the network? Does every result carry the
   fictional marker?
7. **Trace event shape** — Do all required fields appear on both allowed and
   blocked decisions? Any live Langfuse call?
8. **No live integrations** — Confirm no MCP server, Telegram, OpenClaw,
   SQLite, Langfuse, CRM/POS/payroll code exists.
9. **No secrets** — Run scripts/verify_mcp_registry.py and review
   src/mcpherson_mcp_registry/safety.py pattern coverage. Suggest additions.
10. **No real client data** — Confirm all sample data is fictional and marked.
11. **Package exclusions** — Verify scripts/package_mcp_registry_zip.py
    excludes .env, caches, dist/, exports/, fake_output/, *.db/*.sqlite, .git.
12. **Test coverage** — Run pytest. Identify untested block paths or edge
    cases (e.g., malformed JSON, duplicate tool names, case sensitivity).

Conclude with: (a) a pass/fail per item, (b) a ranked list of risks, and
(c) concrete fixes. Do not add features, live integrations, or autonomy —
this audit hardens the boundary, it does not expand it.
