# Snapshot Safety Policy

## Reusable template snapshots — may include

- audited modules
- docs
- tests
- scripts
- fake data
- `.env.example`
- placeholder config
- empty folders
- fake dry-run artifacts, only if clearly marked fictional

## Reusable template snapshots — must NOT include

- real `.env`
- real secrets
- real client data
- real pilot databases
- real pilot backups
- real logs
- real tokens / production keys
- customer exports

## Pilot-specific snapshots

Pilot-specific snapshots may contain real pilot state only if ALL of:

1. they are never reused as templates
2. they remain private to that pilot
3. they are labeled clearly as pilot-specific and sensitive
4. Blake approves their creation
5. they are treated as sensitive (storage, access, retention)

Use `templates/snapshot_safety_record_blank.md` to document every snapshot
decision. See also `reusable_template_snapshot_rules.md`.
