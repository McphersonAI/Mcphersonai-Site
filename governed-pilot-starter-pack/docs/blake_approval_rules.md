# Blake Approval Rules

Blake approval is a recorded, written, human decision. It is never implied, never scripted, and never automated.

**Blake approval is required for:**

1. Go-live of any pilot
2. Reactivation after any incident or rollback
3. Enabling sanitized content logging (metadata-only is the default)
4. Adding a live Telegram interface
5. Adding MCP tool writes
6. Sending client-facing reports
7. Publishing public proof (case studies, screenshots, metrics)

## How approval is recorded

Use `templates/go_live_approval_blank.md` (or the rollback log's reactivation block). The record names the pilot, the scope approved, the date, and Blake's explicit sign-off. The record is stored in `13_go_live_approval/` and archived in the Proof Library.

## What approval is not

- Not a checklist auto-completing
- Not a passing test suite
- Not an agent or script output
- Not verbal-only
