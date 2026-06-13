# Governance Integration Notes

The Governance Layer remains the **authority**. It answers:

- Is the agent approved? What risk tier is it?
- Is it allowed to go live? Are kill switches active?
- Are evals passing? Has Blake approved this state?

The MCP Tool Registry answers a narrower question downstream of governance:

- Is this *specific tool* allowed, in this *specific mode*, for this *specific action*, right now?

In the future stack, the runtime harness checks Governance **first**; only if
governance permits the agent to act at all does the registry evaluate the tool
call. This registry never overrides governance — a governance kill switch or
human-only state must always win, and the `human_only` mode here mirrors that
behavior at the tool layer.
