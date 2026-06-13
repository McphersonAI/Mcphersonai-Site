# Secret Classification

Machine-readable source of truth: `data/secret_classes.json`.

## Class 0 — No Secret

Fake values, placeholders, sample IDs, fake pilot names, fake store names.
Safe for docs, examples, GitHub, reusable snapshots, and zip artifacts. Must be
obviously fake or marked with a placeholder like `__PLACEHOLDER_DO_NOT_USE__`
or `REPLACE_ME`.

## Class 1 — Local Developer Secret

Local test-only `.env`, local-only dev key, private sandbox token. Allowed only
on Blake's local/private machine. Never committed, never packaged, never placed
in a reusable snapshot.

## Class 2 — Pilot Deployment Secret

Telegram bot token, Langfuse secret key, model provider API key,
client-specific database path (if sensitive), webhook secret. Allowed only on
the pilot-specific VPS or private deployment machine. Never in GitHub,
snapshots, or zips. Rotation is documented with a key rotation record.

## Class 3 — Restricted Production Secret

Live model provider key, production tracing key, production deployment
credential, cloud provider token, payment or billing credential if ever added.
Requires the highest care: Blake approval to create, place, or rotate; never in
GitHub, snapshots, zips, or logs; rotation requires a record and Blake sign-off.
