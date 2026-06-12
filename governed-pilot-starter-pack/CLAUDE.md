# CLAUDE.md — Instructions for Claude Code

## What this repo is

A **private internal deployment wrapper** for the first McPherson AI governed pilot. It documents and templates how to assemble the already-audited SQLite Memory Layer, Langfuse Observability Layer, and Governance Layer into a safe, repeatable pilot setup. Documentation-first. Solo founder. Keep it simple.

## Hard rules

- **Treat this as a private deployment wrapper.** It is not customer-facing and not a product.
- **Do not add live integrations.** No live Telegram, no live MCP, no live OpenClaw, no live Langfuse API calls, no POS, no payroll, no app store, no billing, no customer portal, no multi-tenant SaaS auth, no production deployment automation.
- **Do not add real customer data.** No real restaurant names, no real employee data, no real client records. Fake samples must be obviously fake (e.g., "Fake Taco Test Store").
- **Do not add automation that bypasses Blake approval.** No automatic go-live, no automatic reactivation, no scripted approval. Blake approval is a human gate, recorded in writing.
- **No secrets.** No API keys, no tokens, no `.env` committed. `.env.example` carries placeholders only.

## What to audit for

1. Missing checklists or checklist sections (compare against `data/required_sections.json` and the docs list in `scripts/verify_starter_pack.py`)
2. Unsafe assumptions (anything implying automation can replace Blake approval, or that the dry-run can be skipped)
3. Secrets or secret-looking strings anywhere in docs, templates, scripts, or data
4. Real client data or realistic PII in templates or fake samples
5. Incomplete go-live rules (`docs/go_live_checklist.md` must require recorded Blake approval)
6. Incomplete rollback path (`docs/rollback_checklist.md` must end with Blake approving reactivation)
7. Package script exclusion list (`scripts/package_starter_pack_zip.py`)

## Style

Keep the repo documentation-first, plain markdown, minimal Python, pytest only. Do not expand scope. The goal is repeatable governed pilot setup, not new product features.
