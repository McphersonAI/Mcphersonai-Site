# Deferred Decisions

Decisions intentionally not made in v0.1:

- Real MCP server implementation (which SDK/framework)
- Transport method (stdio vs HTTP/SSE vs other)
- Authentication model for tool callers
- SQLite write integration (must go through the audited Memory Layer)
- Langfuse trace submission (batching, sampling, retention)
- Telegram interface design and channel governance
- App/console connector
- Multi-store permissions model
- Per-client isolation (data, approvals, registries per operator)
- Production hosting model

Each of these requires its own write-up, audit, and Blake approval before any
implementation work begins.
