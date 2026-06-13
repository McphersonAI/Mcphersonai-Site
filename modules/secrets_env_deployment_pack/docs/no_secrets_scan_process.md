# No-Secrets Scan Process

## Automated scans

1. `python3 scripts/scan_for_forbidden_files.py` — scans the repo tree for
   forbidden file names and directory names (`.env`, `.env.*` variants,
   `*.db`, `*.sqlite*`, `secrets/`, `client_data/`, `backups/`, `logs/`,
   `real_client/`, `production/`). `.env.example` is allowlisted.
2. `python3 scripts/scan_for_secret_patterns.py` — scans text files for
   secret-like strings (API keys, bot tokens, bearer tokens, private key
   blocks, AWS/OpenAI/Anthropic/Langfuse/GitHub/Slack/Stripe-style keys,
   JWT-like tokens, password assignments). Lines containing allowlisted
   placeholders (`__PLACEHOLDER_DO_NOT_USE__`, `REPLACE_ME`, `fake_`,
   `sample_`, `SAMPLE ONLY`, `FICTIONAL`) are skipped.
3. `python3 scripts/verify_env_pack.py` — runs both scans plus structural
   checks.

Both scans exit non-zero on any finding. A finding blocks commits, packaging,
and promotion until resolved and re-scanned.

A small allowlist of files is exempt from the secret-pattern scan because they
intentionally contain pattern definitions or detection test fixtures (the
pattern data file, the scanner itself, and the two secret-pattern test files).
The exempt list lives in `data/forbidden_secret_patterns.json` under
`scan_exempt_files`.

## Manual review

Automated scans cannot catch everything. Before any promotion past `dry_run`:

- skim diffs for anything that looks real (names, tokens, URLs, store data)
- review new files in `templates/`, `data/`, and any pilot folders
- confirm fake samples carry the fictional marker line
- record the result with `templates/no_secrets_scan_record_blank.md`
