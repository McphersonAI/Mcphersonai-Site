# Claude Code Audit Prompt

Copy the prompt below into Claude Code from the repo root.

---

You are auditing the private McPherson AI repo
`mcpherson-secrets-env-deployment-pack`. Read `CLAUDE.md` and `AGENTS.md`
first and obey them. This repo must remain fake-data-only, offline, and
testable. Audit the following and report findings with file paths:

1. **Environment matrix** — `data/environment_matrix.json` and
   `docs/environment_matrix.md`: all six environments present (`local_fake`,
   `dry_run`, `pilot_prelaunch`, `pilot_live_restricted`, `human_only`,
   `incident_mode`), each with all required fields, consistent between JSON
   and docs.
2. **Secret classes** — Classes 0–3 defined, consistent, with correct
   allowed locations.
3. **.env policy** — `.env.example` only; all real `.env` variants forbidden
   in GitHub, snapshots, and zips; `.gitignore` enforces it.
4. **GitHub safety** — allowed/forbidden lists complete and enforced by scans.
5. **Snapshot safety** — reusable template rules vs pilot-specific rules
   correct; contamination handled as an incident.
6. **Promotion gates** — all six gates present, requirements complete, Blake
   approval never bypassable, immediate safety transitions preserved.
7. **Key rotation** — 10-step checklist present and reflected in the record
   template.
8. **No-secrets scans** — `scripts/scan_for_secret_patterns.py` patterns
   reasonable, allowlist not overly broad, exit codes correct.
9. **Forbidden file scans** — `scripts/scan_for_forbidden_files.py` covers
   all forbidden names/dirs, allowlists only `.env.example`.
10. **Fake-only templates** — every `*_fake_sample.md` carries the marker:
    `SAMPLE ONLY — FICTIONAL — NOT REAL SECRET — NOT REAL CLIENT DATA — NOT APPROVED FOR LIVE USE`
11. **Package exclusions** — `scripts/package_env_pack_zip.py` excludes
    `.env`, `.env.*`, `__pycache__`, `*.pyc`, `*.pyo`, `dist/`, `exports/`,
    `backups/`, `secrets/`, `client_data/`, `logs/`,
    `fake_environment_output/`, `*.db`, `*.sqlite`, `*.sqlite3`, `.git`,
    `.pytest_cache`, `.DS_Store`.
12. **No real secrets** — run both scans; confirm zero findings.
13. **No real client data** — confirm all names/stores/clients are fictional.
14. **No live integrations** — confirm no network calls, no Telegram,
    OpenClaw, MCP, Langfuse, or cloud APIs anywhere in scripts.
15. **Tests** — `pytest tests/ -q` passes; `python3 scripts/verify_env_pack.py`
    passes.
16. **Final zip path** — `python3 scripts/package_env_pack_zip.py` produces a
    clean zip under `dist/` and report its path.

Patch any failures (without weakening safety rules), rerun tests and scans,
and summarize changes.

## mcpherson-ai-core preparation

After audit and patching, prepare this repo so the approved module can later
be added to Blake's private `mcpherson-ai-core` repo.

- **Suggested destination path:** `modules/secrets_env_deployment_pack/`
- **Files to include:** `README.md`, `CLAUDE.md`, `AGENTS.md`,
  `.env.example`, `.gitignore`, `docs/`, `templates/`, `data/`, `scripts/`,
  `tests/`
- **Files to exclude:** `dist/`, `exports/`, `fake_environment_output/`,
  `__pycache__/`, `.pytest_cache/`, any generated zips
- **Integration notes:** keep this module's `.gitignore` rules merged into
  the core repo's root `.gitignore`; wire `verify_env_pack.py` into any core
  repo verification routine; the environment matrix and promotion gates are
  the source of truth for all other modules' environment references.
- **Deferred decisions:** carry `docs/deferred_decisions.md` forward
  unchanged until each item is separately approved by Blake.

Do not modify `mcpherson-ai-core` directly unless Blake explicitly asks.
