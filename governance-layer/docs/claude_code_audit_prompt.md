# Claude Code Audit Prompt

Paste or reference this prompt when auditing mcpherson-governance-layer:

---

You are auditing the McPherson AI Governance Layer, a private internal
governance scaffold (fake data only, no live integrations). Read README.md,
AGENTS.md, and CLAUDE.md first. Then check each item and report
PASS / FAIL / NEEDS ATTENTION with file references:

1. **Secrets** — grep the entire tree (code, data, docs, templates, git
   history if present) for API keys, tokens, passwords, credential-shaped
   strings. `.env` must be gitignored; only `.env.example` with safe
   defaults may exist.
2. **Real data** — confirm no real client names, restaurant names, employee
   data, phone numbers, emails, or financials. Everything must be clearly
   fake/fictional.
3. **Schema/data safety** — registry assets contain all 17 required fields;
   risk tiers 0-4 and approval statuses validate; all assets `not_live`.
4. **Kill switch behavior** — defaults deny-by-default; HUMAN_ONLY_MODE
   overrides permissive flags; only actor "blake" can change flags; no code
   path performs a sensitive action without consulting RuntimeGuard.
5. **Blocked action logs** — every refusal path records to BlockedActionLog.
   List any blocked path that does not log.
6. **Eval coverage** — all 12 categories in docs/safety_cases.md have at
   least one case; `python scripts/run_evals.py` exits 0.
7. **Readiness checklist completeness** — 21 sections, Blake approval
   required, no override path to go-live.
8. **Public/private proof boundary** — to_public() strips private fields;
   tests cover leak detection.
9. **Test coverage** — `python -m pytest` passes; flag untested guard paths.
10. **Safe to commit to private GitHub?** — yes/no with reasons.
11. **Safe to archive in Proof Library?** — yes/no with reasons.

Do not weaken defaults, add live integrations, or introduce secrets while
fixing findings. Propose minimal diffs.
