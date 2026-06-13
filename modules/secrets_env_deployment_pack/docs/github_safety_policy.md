# GitHub Safety Policy

## Allowed in GitHub

- docs
- templates
- fake samples (clearly marked fictional)
- tests
- scripts
- `.env.example`
- placeholder configs
- fake environment manifests
- verification and package scripts

## Never allowed in GitHub

- `.env`, `.env.local`, `.env.production`, `.env.pilot`, any real `.env.*`
- real API keys, real bot tokens, real Langfuse keys
- real customer/client data
- real pilot databases
- real backups
- logs containing sensitive content
- client exports
- production credentials

## Enforcement

`.gitignore` plus `scripts/scan_for_forbidden_files.py` and
`scripts/scan_for_secret_patterns.py` must both pass before any commit or
package. Any finding is treated as a leak and blocks promotion.
