# Incident Mode

## Activation

`incident_mode` can be entered immediately on: unsafe behavior, a bad memory
write, an incorrect tool call, a trace issue, an operator pause request, or a
Blake decision. Record the activation with
`templates/incident_mode_activation_record_blank.md`.

## Evidence preservation

- make an incident copy before anything else; never delete incident evidence
- identify relevant backups
- review is read-only; writes and outbound actions are blocked
- incident copies are sensitive and are never reused as templates

## Patch / retest / reactivation

1. Document the issue.
2. Preserve evidence.
3. Apply the patch.
4. Rerun tests and scans.
5. Verify rollback/restore if it was needed.
6. Obtain Blake reactivation approval before returning to
   `pilot_live_restricted`.
