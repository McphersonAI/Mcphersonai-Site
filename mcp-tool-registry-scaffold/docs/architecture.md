# Architecture

## Conceptual stack (future state)

```
Operator / Chat Input
        ↓
Future Agent Runtime Harness
        ↓
Governance Layer (separate repo — approval, risk tier, kill switches, evals)
        ↓
MCP Tool Registry  ← this repo
        ↓
Fake Tool Stub (v0.1) / Real Tool (later, after separate audit)
        ↓
Trace Event Shape (Langfuse-shaped dicts, local only in v0.1)
        ↓
SQLite Memory Layer / Langfuse Observability (later)
        ↓
Audit Log / Proof Record
```

## v0.1 call flow

1. Caller (test, demo, or future runtime) invokes `execute_tool_call(...)`.
2. `policy_engine.evaluate_tool_call` runs the deny-by-default chain.
3. If blocked: a structured blocked result is returned, plus a trace event.
4. If allowed: the fake tool implementation runs against an in-memory
   `FakeStore`, returns fictional output with the marker, plus a trace event.
5. Every decision — allowed or blocked — produces a trace-style event dict.

## Modules

| Module | Role |
|---|---|
| `models.py` | Dataclasses + fictional marker; missing fields fail closed |
| `registry_loader.py` | Loads registry / mode policy / approvals / context JSON |
| `policy_engine.py` | The deny-by-default decision chain |
| `approvals.py` | Fake Blake-approval validation (tool, mode, expiry, approver) |
| `fake_tools.py` | In-memory fake tool implementations |
| `tool_executor.py` | Decision → fake execution → trace event |
| `trace_events.py` | Langfuse-shaped event dicts (local only) |
| `safety.py` | Secret scanning + fictional-marker verification |
