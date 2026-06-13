# Runtime Harness Integration Notes

The future agent runtime harness should call this layer like so:

1. Runtime receives an operator request.
2. Runtime asks the **Governance Layer** whether the agent may act at all.
3. If yes, runtime calls `execute_tool_call(tool_name, action, mode, ...)` here.
4. The policy engine approves or blocks (deny-by-default).
5. The fake tool executes, or a structured blocked result is returned.
6. The runtime logs the trace event and returns the response to the user.

The harness must never call fake tool implementations directly — every call
goes through `execute_tool_call` so that policy and tracing cannot be skipped.
