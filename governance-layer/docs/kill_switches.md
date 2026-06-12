# Kill Switches

Flags (defaults in parentheses — deny-by-default):

- AGENT_ENABLED (false) — master switch; off disables the whole runtime.
- TELEGRAM_ENABLED (false) — channel-specific outbound switch.
- HUMAN_ONLY_MODE (true) — blocks autonomous replies, memory writes, tools,
  and outbound even if their individual flags are on.
- ALLOW_SQLITE_WRITES (false) — memory write gate.
- ALLOW_TOOL_EXECUTION (false) — tool dispatch gate.
- ALLOW_OUTBOUND_ACTIONS (false) — outbound message gate.
- LANGFUSE_ENABLED (true) + LANGFUSE_MODE (metadata_only) — tracing on, but
  no raw content leaves the runtime.
- SANITIZED_CONTENT (false) — marks whether content has passed sanitization.

Rules: every blocked attempt is logged (`BlockedActionLog`); only the human
actor "blake" can change flags (`KillSwitchPanel`); agent attempts are
refused and logged; `emergency_stop()` flips everything restrictive at once.
