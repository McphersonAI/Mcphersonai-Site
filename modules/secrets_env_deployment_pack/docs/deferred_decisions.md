# Deferred Decisions

These are intentionally NOT decided in this pack:

1. Real secret manager choice (e.g., file-based vs dedicated tooling).
2. VPS secret storage method for pilot machines.
3. Cloud provider strategy.
4. Per-pilot environment naming convention.
5. Key rotation cadence per key type.
6. Langfuse key handling (modes, scopes, rotation specifics).
7. Telegram token handling (per-pilot bots vs shared, rotation specifics).
8. Model provider key handling (per-pilot keys vs shared, spend limits).
9. Backup encryption approach.
10. Incident evidence retention policy (duration, storage, access).

Each of these requires its own write-up, audit, and Blake approval before
implementation. Until decided, the conservative defaults in this pack apply.
