# McPherson AI — Agent Runtime Harness Scaffold
# Claude Code Audit Report
**Date:** 2026-06-13
**Auditor:** Claude Code (claude-sonnet-4-6) — private internal use
**Repo:** mcpherson-agent-runtime-harness (Fable-generated scaffold)
**Branch:** claude/mcpherson-runtime-harness-audit-kq4oji
**Status:** APPROVED WITH PATCHES

---

## Overall Verdict

**APPROVED WITH PATCHES**

Three minimal patches were applied to close gap items found during the audit. No structural changes were made. The runtime harness is safe, testable, fake-data-only, deny-by-default, and traceable. It is ready to serve as the approved fake runtime loop for a future governed pilot dry-run after Blake approval.

---

## Test Result

**35 passed / 0 failed**

All 35 pytest tests pass after patches.

---

## Script Results

| Script | Result |
|---|---|
| `verify_runtime_harness.py` | PASS — all 49 checks passed |
| `demo_safe_read_request.py` | PASS — allowed, fictional marker present |
| `demo_fake_write_request.py` | PASS — allowed, [FAKE] prefix, fictional marker |
| `demo_approval_required_request.py` | PASS — blocked without approval, allowed with fake approval |
| `demo_human_only_mode.py` | PASS — all 10 scenarios blocked |
| `demo_incident_mode.py` | PASS — writes blocked, outbound blocked, incident read allowed |
| `demo_kill_switch_block.py` | PASS — memory write blocked |
| `demo_runtime_scenarios.py` | PASS — 10/10 scenarios, 10 trace events |
| `export_runtime_scenarios.py` | PASS — exports to exports/ (excluded from zip) |
| `package_runtime_harness_zip.py` | PASS — 65 files, 36 excluded |

---

## Safety Result

| Check | Result |
|---|---|
| Secrets found | None |
| API keys or tokens | None |
| Real client data | None |
| Real restaurant names or employees | None |
| Real phone numbers, emails, SSNs | None |
| Production URLs | None |
| Unsafe .env files | None (.env.example contains only comments and empty keys) |
| Committed .db / .sqlite / .sqlite3 files | None |
| Real model calls (Anthropic, OpenAI) | None |
| Network calls (requests, httpx, aiohttp, socket) | None |
| Live MCP calls | None |
| Live Telegram calls | None |
| Live Langfuse calls | None |
| Live OpenClaw calls | None |
| Live SQLite writes (sqlite3 import) | None |

---

## Runtime Result: ACCEPTABLE

The 15-step runtime loop in `runtime.py` is correctly sequenced:

`mode → governance → policy → approval → fake execution → trace → response`

Every request produces a trace event. No real outbound action is ever possible.

---

## Mode Result: ACCEPTABLE

All 6 modes verified:

| Mode | Reads | Writes | Outbound | Result |
|---|---|---|---|---|
| `local_fake` | allowed | allowed | blocked | PASS |
| `dry_run` | allowed | allowed | blocked | PASS |
| `pilot_prelaunch` | allowed | need policy | blocked | PASS |
| `pilot_live_restricted` | allowed | need policy | blocked | PASS |
| `human_only` | **blocked** | **blocked** | blocked | PASS — strongest override |
| `incident_mode` | incident-read-only | **blocked** | blocked | PASS |

Unknown mode defaults to deny-everything (blocks_everything=True). PASS.

---

## Fake Model Result: ACCEPTABLE

- No real model imports. No external calls. `external_call: False` in every response.
- Deterministic keyword mapping confirmed by `test_fake_model_is_deterministic.py`.
- Unknown intent → `INTENT_UNKNOWN` → deny-by-default blocked response. PASS.
- Dangerous categories (outbound, real_system_change) classified before safe categories. PASS.

---

## Governance Adapter Result: ACCEPTABLE

All governance checks verified:
- `agent_enabled`: disabled → blocks execution. PASS.
- `human_only` flag or mode: blocks everything. PASS.
- `incident_mode` flag or mode: blocks writes and outbound. PASS.
- `allow_memory_reads` / `allow_memory_writes`: gates read/write intents. PASS.
- `blake_approval_required_for` list: gates approval-required tools. PASS.
- `allow_outbound_actions` is `false` permanently in this scaffold. PASS.
- Deny-by-default catchall at end of evaluate_governance. PASS.

---

## MCP Adapter Result: ACCEPTABLE

- Unregistered tool → `tool_not_registered` → blocked. Deny by default. PASS.
- `always_blocked` tools (send_text_message, change_payroll): blocked in all modes. PASS.
- `human_only` mode rules block all tools. PASS.
- `incident_mode` read-only flag enforced correctly. PASS.
- Approval-required tools check approval_present before allowing. PASS.
- No path allows tool execution without a decision. PASS.

---

## Memory Adapter Result: ACCEPTABLE

- No sqlite3 import. No database files. No file-backed persistence. PASS.
- All fake writes are in-process (Python list) and vanish on process exit. PASS.
- All results include `fictional_marker: "SAMPLE ONLY — FICTIONAL — NOT REAL CLIENT DATA"`. PASS.
- Outbound tools (send_text_message) have no registered fake executor — deny by default even if policy bugs occur. PASS.
- Store name: "Sample Bagel Shop #000 (FICTIONAL)". No real restaurant name. PASS.

---

## Trace Event Result: ACCEPTABLE

All 14 required fields present in every trace event:
`event_id`, `timestamp`, `request_id`, `fake_pilot_id`, `mode`, `intent`,
`requested_tool`, `governance_decision`, `mcp_decision`, `final_decision`,
`reason`, `approval_required`, `approval_present`, `fictional_marker`.

Trace events created for both allowed and blocked requests. PASS.
No Langfuse call — events are local dicts only. PASS.

---

## Response Contract Result: ACCEPTABLE

All 11 required response fields present:
`request_id`, `fake_pilot_id`, `mode`, `intent`, `allowed`, `blocked_reason`,
`requested_tool`, `fake_tool_result`, `trace_event`, `final_message`, `fictional_marker`.

- Blocked responses: `allowed=False`, `blocked_reason` populated, `fake_tool_result=None`. PASS.
- human_only responses: "Human review is required" in final_message. PASS.
- incident_mode blocked responses: "Incident mode is active. Reactivation requires Blake approval." PASS.
- Outbound blocked: "always blocked in the runtime harness. No real outbound action was taken." PASS.
- Unknown intent: "safe draft-only response with no execution." PASS.

---

## Documentation Result: ACCEPTABLE

All 16 required docs present and reviewed:

| Doc | Status |
|---|---|
| overview.md | PASS |
| runtime_architecture.md | PASS |
| runtime_loop.md | PASS |
| operating_modes.md | PASS |
| fake_model_placeholder.md | PASS |
| fake_governance_adapter.md | PASS |
| fake_mcp_adapter.md | PASS |
| fake_memory_adapter.md | PASS |
| trace_event_model.md | PASS |
| response_contract.md | PASS |
| scenario_catalog.md | PASS |
| integration_boundaries.md | PASS |
| dry_run_usage.md | PASS |
| known_limits.md | PASS |
| deferred_decisions.md | PASS |
| claude_code_audit_prompt.md | PASS |

No doc implies the runtime is live or production-ready. All consistently state fake-data-only, no live integrations, Blake approval required before live use.

---

## Root Files Result: ACCEPTABLE

- **README.md**: Explains what the harness is and is not, how it fits each McPherson AI module, all run commands, why no live integrations, why Blake approval is required. PASS.
- **CLAUDE.md**: All 12 hard rules present (no live model calls, no Telegram, no OpenClaw, no live MCP, no SQLite, no Langfuse, no production APIs, no real data, no secrets, no weakening deny-by-default, no bypassing Blake approval, keep fake-data-only). PASS.
- **AGENTS.md**: States this repo does not run a live agent, does not connect to external systems, only simulates the governed loop, fake model output is deterministic, future agents may use this shape only after Governance approval, all real integrations are deferred. PASS.
- **.env.example**: All keys commented out, no values. PASS.
- **.gitignore**: Required patterns present after patch. PASS.

---

## Packaging Result

**Final zip:** `dist/mcpherson-agent-runtime-harness_2026-06-13.zip`
**Size:** 49,986 bytes (48.8 KB)
**Files included:** 65
**Files excluded:** 36

Confirmed exclusions (none of the following appear in zip):
- `.env`, `.env.*` (except `.env.example`)
- `__pycache__/`, `*.pyc`, `*.pyo`
- `dist/`, `exports/`, `backups/`, `secrets/`, `client_data/`, `logs/`, `fake_output/`
- `*.db`, `*.sqlite`, `*.sqlite3`
- `.git/`, `.pytest_cache/`
- `.DS_Store`

Confirmed inclusions: README.md, CLAUDE.md, AGENTS.md, .env.example, .gitignore, all 16 docs, all 6 data files, all 11 source files, all 11 scripts, all 15 test files.

---

## Critical Issues

**None found.** Three minor gap items were patched (see below).

---

## Patches Applied

| # | File | Change | Reason |
|---|---|---|---|
| 1 | `.gitignore` | Added `*.sqlite3` and `*.pyo` | Audit spec requires both; `.sqlite` alone was present |
| 2 | `scripts/package_runtime_harness_zip.py` | Added `.sqlite3` and `.pyo` to `EXCLUDED_SUFFIXES`; added `.DS_Store` to `EXCLUDED`; added date suffix to zip name | Closes matching gap in package exclusions; audit spec requires dated zip name |
| 3 | `tests/test_package_excludes_unsafe_files.py` | Added `.DS_Store` to required set; added test assertions for `.pyo`, `.sqlite3`, `.DS_Store` | Keeps test coverage current with patched exclusions |

No behavioral changes were made. All 35 tests pass before and after patches.

---

## Definition-of-Done Checklist

| Item | Result |
|---|---|
| Repo initializes locally | PASS |
| Required root docs exist | PASS |
| Required docs exist (16/16) | PASS |
| Required data files exist (6/6) | PASS |
| Required source files exist (11/11) | PASS |
| Fake runtime context loads | PASS |
| Fake scenarios load (10/10) | PASS |
| Runtime processes a fake request | PASS |
| Fake model output is deterministic | PASS |
| Fake governance adapter blocks unsafe states | PASS |
| Fake MCP adapter blocks unsafe tools | PASS |
| Human-only mode blocks all execution | PASS |
| Incident mode blocks writes and outbound actions | PASS |
| Kill switch blocks memory writes | PASS |
| Approval-required actions require fake approval | PASS |
| Trace-style events are generated | PASS |
| Response contract is consistent | PASS |
| Verification script passes | PASS — 49/49 checks |
| Demo scripts run cleanly | PASS — all 8 demos |
| Tests pass | PASS — 35/35 |
| Package script creates a clean zip | PASS |
| No secrets included | PASS |
| No real client data included | PASS |
| No live integrations exist | PASS |
| No real model calls exist | PASS |
| Safe to commit to private GitHub after Blake approval | YES |
| Safe to archive in Proof Library | YES |
| Prepared for later inclusion in mcpherson-ai-core | YES (see below) |

---

## Deferred Decisions for Blake

1. **Real model provider** — which model powers the live runtime, prompt/caching strategy.
2. **Live Telegram interface** — bot architecture, auth, rate limits.
3. **Real MCP registry import** — when and how the audited MCP Tool Registry replaces the fake adapter.
4. **SQLite write integration** — schema ownership, migration path from fake memory records.
5. **Langfuse trace submission** — which module forwards local trace events, batching, redaction policy.
6. **App / console connector** — any operator UI beyond chat.
7. **Multi-store runtime permissions** — how mode and policy vary per store under one operator.
8. **Per-client isolation** — droplet-per-client vs shared runtime, least-privilege allowlist.
9. **Production hosting model** — where the live runtime runs and how it is monitored.

**None of these are required for this scaffold to function as a governed dry-run tool.**

---

## mcpherson-ai-core Preparation

**Suggested destination path:** `modules/agent_runtime_harness/`

**Files to include:**
- `README.md`, `CLAUDE.md`, `AGENTS.md`, `.env.example`, `.gitignore`
- `docs/` (all 16 docs)
- `data/` (all 6 JSON files)
- `src/mcpherson_runtime_harness/` (all 11 source files)
- `scripts/` (all 11 scripts)
- `tests/` (conftest + 14 test files)

**Files to exclude from mcpherson-ai-core inclusion:**
- `dist/` (generated artifact — use the zip directly)
- `exports/` (generated at runtime)
- `__pycache__/`, `*.pyc`, `*.pyo`

**Integration notes:**
- Import path after inclusion: `from modules.agent_runtime_harness.src.mcpherson_runtime_harness import RuntimeHarness, RuntimeRequest`
- The four integration seams (governance_adapter, mcp_adapter, memory_adapter, trace_events) each expose a single function/class boundary. Live modules slot in at those seams without touching the runtime loop.
- Each seam requires a separate Claude Code audit before live use.
- Blake approval required before any seam is activated.

**Recommended rule:**
- Fable output → staging artifact
- Claude Code audit → quality gate
- mcpherson-ai-core → approved internal code only
- Proof Library → historical evidence / zip / audit reports

---

## Final Disposition

| Question | Answer |
|---|---|
| Safe to commit to private GitHub | YES — after Blake approval |
| Safe to archive in Proof Library | YES |
| Ready to serve as McPherson AI Agent Runtime Harness v0.1 | YES — after Blake approval |

**Recommended next step:**
1. Archive this zip + report in Proof Library.
2. Blake reviews and approves.
3. Commit to private GitHub (`mcpherson-ai-core` at `modules/agent_runtime_harness/`).
4. Use as the runtime loop baseline for the first governed pilot dry-run.
5. For each real integration (model, Telegram, MCP registry, SQLite, Langfuse): run a separate Claude Code audit at that integration's seam before activating.

---

*End of audit report.*
*This report was generated by Claude Code (claude-sonnet-4-6) for McPherson AI internal use only.*
*Do not distribute outside McPherson AI without Blake approval.*
