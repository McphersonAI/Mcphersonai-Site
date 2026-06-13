# Reusable Template Snapshot Rules

## The rule

Reusable template snapshots must stay clean and fake-data-only, forever. A
reusable snapshot is anything that could be used to spin up the next pilot or
the next environment.

## Before creating or reusing a snapshot

1. Run `scripts/scan_for_forbidden_files.py` against the snapshot source.
2. Run `scripts/scan_for_secret_patterns.py` against the snapshot source.
3. Confirm no real `.env`, secrets, client data, pilot databases, backups,
   logs, tokens, or customer exports are present.
4. Confirm fake artifacts are clearly marked fictional.
5. Record the result with `templates/snapshot_safety_record_blank.md`.

## If a reusable snapshot is contaminated

Treat it as an incident: enter `incident_mode`, preserve evidence, destroy or
quarantine the contaminated snapshot, rotate any exposed keys, and rebuild the
template from a verified clean state. Reactivation requires Blake approval.
