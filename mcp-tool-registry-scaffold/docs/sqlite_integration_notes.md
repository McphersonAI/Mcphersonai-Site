# SQLite Integration Notes

**Deferred.** v0.1 uses an in-memory `FakeStore` only — no SQLite file, no
database driver, no persistence.

When write tools eventually persist real pilot data, they must do so only
through the audited **SQLite Memory Layer** module (with its pruning,
compression, and recall governance) — not through ad-hoc database access from
this repo. That integration requires a separate audit before it is built.
