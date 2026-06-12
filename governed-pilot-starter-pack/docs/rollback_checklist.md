# Rollback Checklist

## Rollback triggers

Roll back for any of these:

- Bad memory write
- Bad prompt behavior
- Langfuse outage
- SQLite corruption
- Unauthorized outbound action attempt
- Incorrect pilot scope
- Wrong store record
- Accidental sensitive data capture
- Need to return to human-only mode

## Rollback steps (in order)

1. Stop agent behavior
2. Enable human-only mode
3. Block SQLite writes
4. Block tool execution
5. Block outbound actions
6. Preserve incident copy (do not overwrite evidence)
7. Restore last known good backup if needed
8. Document the incident (`templates/rollback_log_blank.md`)
9. Patch and retest before reactivation
10. **Blake approves reactivation** — recorded in writing

## Rule

Reactivation is never automatic. The pilot stays in human-only mode until step 10 is complete.
