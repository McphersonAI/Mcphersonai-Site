# Claude Code Audit Prompt

Paste the following into Claude Code when auditing this repo:

---

You are auditing the **mcpherson-governed-pilot-starter-pack** repo — a private, documentation-first deployment wrapper for McPherson AI governed pilots. Read `CLAUDE.md` and `AGENTS.md` first and treat their rules as binding.

Audit for:

1. **Missing checklists or sections** — compare every checklist doc against `data/required_sections.json` and the deployment write-up
2. **Unsafe assumptions** — anything implying automation can replace Blake approval, or that dry-run/go-live/rollback steps can be skipped or reordered
3. **Secrets** — any key-like, token-like, or credential-like strings anywhere in the repo, including templates and fake samples
4. **Real client data** — any real restaurant names, employee names, phone numbers, emails, or addresses; fake samples must be obviously fake
5. **Incomplete go-live rules** — `docs/go_live_checklist.md` must require recorded Blake approval as the final gate
6. **Incomplete rollback path** — `docs/rollback_checklist.md` must cover all listed triggers and end with Blake approving reactivation
7. **Scope creep** — any live integration code, autonomous behavior, or product features (forbidden; this is a deployment wrapper only)
8. **Test and script integrity** — run `python3 -m pytest` and `python3 scripts/verify_starter_pack.py`; confirm the package script's exclusion list is enforced

Deliver: a findings list (severity-ranked), a pass/fail call on each of the eight areas, and a clear statement of whether the pack is ready for Blake approval.

---
