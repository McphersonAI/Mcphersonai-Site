# Private GitHub Archive

## What goes to private GitHub

**Only approved/audited code and documentation.** GitHub keeps approved working code; the Proof Library keeps the artifact history.

## What never goes to GitHub

- Secrets of any kind
- `.env` files (only `.env.example` with placeholders)
- Real client data, real restaurant names, real employee data
- Backups containing client data
- Pilot folders filled with real pilot values

## Workflow

1. Build locally
2. Verify (`scripts/verify_starter_pack.py`) and test (`pytest`)
3. Claude Code audit
4. Commit approved state to the private repo
5. Package zip → Proof Library

If in doubt whether a file is safe to commit: it isn't. Keep it local and ask the question in the deployment log.
