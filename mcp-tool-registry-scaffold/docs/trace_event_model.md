# Trace Event Model

Every tool decision — allowed or blocked — produces a trace-style event dict:

```json
{
  "event_id": "uuid",
  "timestamp": "ISO-8601 UTC",
  "fake_pilot_id": "PILOT-FAKE-001",
  "tool_name": "...",
  "requested_action": "...",
  "current_mode": "...",
  "decision": "allowed | blocked",
  "reason": "...",
  "risk_tier": "...",
  "approval_required": true,
  "approval_present": false,
  "category": "...",
  "fictional_marker": "SAMPLE ONLY — FICTIONAL — NOT REAL CLIENT DATA"
}
```

These are **local dictionaries only**. Nothing calls Langfuse or the network.
The shape is designed so a future audited module can submit them to the
Langfuse Observability Layer with minimal mapping. See
`langfuse_integration_notes.md`.
