# Human-Only Mode

HUMAN_ONLY_MODE=true is the strongest single switch short of AGENT_ENABLED.
When active the agent: does not reply autonomously, does not write memory,
does not execute tools, does not send anything outbound. Every attempt
returns the safe pause message and is logged.

It deliberately overrides permissive flags: even with ALLOW_SQLITE_WRITES
true, human-only mode blocks the write. This makes it safe to pre-stage a
pilot's permissions while keeping the agent paused, then flip one switch at
go-live (after the readiness gate).
