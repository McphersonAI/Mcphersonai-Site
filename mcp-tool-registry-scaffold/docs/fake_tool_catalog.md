# Fake Tool Catalog

Every fake result is wrapped as
`{tool_name, fake_result, fictional_marker}` with the marker
`SAMPLE ONLY — FICTIONAL — NOT REAL CLIENT DATA`.

## Safe reads
- `read_fake_store_profile` — fictional "Cantina Del Sol" profile with daypart mix
- `read_fake_shift_notes` — fictional shift notes from the in-memory store
- `read_fake_followups` — fictional follow-up items
- `read_fake_weekly_proof` — fictional weekly proof summary
- `read_fake_pilot_status` — fictional pilot status (`scaffold_only`, never live)
- `read_fake_governance_status` — fictional governance mirror (never approved for live)
- `read_fake_disabled_demo` — intentionally disabled; always blocked (test coverage)

## Controlled writes (in-memory only)
- `create_fake_shift_note`, `create_fake_followup`, `mark_fake_followup_complete`,
  `create_fake_proof_event`, `create_fake_rollback_log`, `create_fake_deferred_decision`
  — each appends/updates a record in the in-memory `FakeStore` and returns it.

## Approval-required (fake state changes only)
- `mark_fake_pilot_ready`, `change_fake_approval_status`, `enable_fake_live_mode`,
  `reactivate_fake_after_incident`, `export_fake_public_proof`,
  `enable_fake_sanitized_content_logging` — each returns a fictional confirmation.
  Nothing real changes anywhere.

## Always blocked
See `data/blocked_tools.json` and `blocked_tool_policy.md`. These have no
implementations and can never execute.
