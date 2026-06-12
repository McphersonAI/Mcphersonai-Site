# Agent Boundaries — McPherson AI Governance Layer

These boundaries apply to ANY agent (Fable, Claude Code, OpenClaw agents,
or future agents) working in or around this repo.

1. **No live integrations.** No live Telegram, OpenClaw, MCP, Langfuse,
   POS, or payroll connections. Mocked/local only.
2. **Fake data only.** No real client data, real restaurant names, real
   employee data, or private customer information — ever.
3. **No secrets.** No API keys, tokens, passwords, or credentials in code,
   data, docs, or git history. `.env` is gitignored; only `.env.example`
   ships, with safe defaults.
4. **No autonomous outbound actions.** Agents do not send messages, emails,
   or notifications. `ALLOW_OUTBOUND_ACTIONS=false` by default.
5. **No memory writes unless allowed.** Memory writes require
   `HUMAN_ONLY_MODE=false` and `ALLOW_SQLITE_WRITES=true`, set by Blake.
6. **No kill switch changes by any agent.** Only the human actor "blake"
   may flip flags via `KillSwitchPanel`. Agent attempts are refused and
   logged as `kill_switch_modification_blocked`.
7. **No public claims without approval.** Anything public-facing goes
   through the sanitized case study template and Blake approval.
8. **Deny by default.** When uncertain, block the action, log it, and
   return the safe pause message.
