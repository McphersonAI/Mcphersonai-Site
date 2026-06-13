# Langfuse Integration Notes

**Deferred.** v0.1 generates Langfuse-shaped trace event dictionaries locally
and never contacts a Langfuse server.

When observability goes live, a separate audited module will batch and submit
these events to the **Langfuse Observability Layer**. The event shape in
`trace_event_model.md` is intentionally stable so that integration is a
transport problem, not a redesign. Logging posture changes (e.g.,
metadata-only → sanitized-content) remain approval-required actions.
