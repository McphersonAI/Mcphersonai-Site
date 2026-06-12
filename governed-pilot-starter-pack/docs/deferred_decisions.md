# Deferred Decisions

Decisions intentionally not made yet. Each requires its own evaluation — and where flagged, Blake approval — before implementation.

| Decision | Status | Notes |
|---|---|---|
| Sanitized content logging | Deferred | Metadata-only is the default; enabling sanitized content requires Blake approval |
| International phone redaction | Deferred | Current redaction scope is US-pattern only |
| Free-text PII scanning | Deferred | No automated PII scanner in v0.1; manual review applies |
| Live Telegram interface | Deferred | Requires Blake approval and its own governance registration |
| MCP tool layer | Deferred | Tool writes require Blake approval |
| App/console connector | Deferred | Out of scope for first pilot |
| Public case study approval | Deferred | Publishing proof requires Blake approval |
| Multi-store packaging | Deferred | Single-store pilots only in v0.1 |
| Langfuse hosting model | Deferred | Local Docker vs. approved private infra; decide per pilot |

Record new deferrals in `templates/deferred_decisions_blank.md` within the pilot folder.
