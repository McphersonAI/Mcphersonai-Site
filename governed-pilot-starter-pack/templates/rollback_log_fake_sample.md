# Rollback / Incident Log — FAKE SAMPLE (fictional incident for training)

**Pilot ID:** pilot_999_fake_taco_test_store
**Incident date/time:** 2026-01-15 09:42 (fake)
**Detected by:** Weekly trace review (fake)
**Trigger:** Bad memory write (fake — a test shift note was written to the wrong fake store record)

## Rollback steps executed

- [x] 1. Stop agent behavior — 09:45
- [x] 2. Enable human-only mode — 09:45
- [x] 3. Block SQLite writes
- [x] 4. Block tool execution
- [x] 5. Block outbound actions
- [x] 6. Preserve incident copy — 09_backups/incident_2026-01-15/
- [x] 7. Restore last known good backup — backup FAKE-BK-003
- [x] 8. Document incident (this log)
- [x] 9. Patch and retest — store-record guard added; retest passed on fake data

## Incident description
Fake scenario: agent event logger wrote a fake shift note under the wrong fake store ID during dry-run testing.

## Root cause
Fake: store ID not validated against registered pilot ID before write.

## Patch and retest evidence
Fake: validation added; eval suite re-run; all pass.

## Reactivation approval
**Approved by:** Blake McPherson — **Signature:** [SAMPLE ONLY — NOT SIGNED] — **Date:** 2026-01-16 (fake)
