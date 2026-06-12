# McPherson AI Governance Layer — Claude Code Audit Report

**Date:** 2026-06-12  
**Auditor:** Claude Code (claude-sonnet-4-6)  
**Repo audited:** mcpherson-governance-layer (Fable scaffold, zip upload)  
**Branch:** claude/mcpherson-governance-audit-073uur  

---

## Overall Verdict: APPROVED WITH PATCHES

One correctness bug in `can_go_live()` was patched. Two deferred decisions noted for Blake. Everything else passed.

---

## Test Results

- **Before patches:** 43/43 pytest tests passing, 18/18 eval cases passing
- **After patches:** **44/44 pytest tests passing**, 18/18 eval cases passing
- All demo scripts execute cleanly with correct output
- All export and packaging scripts run without errors

---

## Section-by-Section Results

### 1. Repo Safety Review — PASS

| Check | Result |
|---|---|
| Secrets / API keys / tokens | PASS — none found |
| Real client data / restaurant names | PASS — none found |
| Real employee names | PASS — none found |
| Real phone numbers | PASS — 555-xxx pattern only (clearly fake) |
| Real emails | PASS — fakemail.example domains only |
| Real SSNs | PASS — 123-45-6789 pattern only (fake test fixture) |
| Payroll / financial PII | PASS — none found |
| Production URLs | PASS — only docs.pytest.org in a pytest cache README |
| Live service credentials | PASS — none found |
| `.env.example` safe defaults | PASS — all deny-by-default |
| `.gitignore` covers `.env`, exports, dist, caches | PASS |
| README accurately describes scope | PASS |
| CLAUDE.md + AGENTS.md set correct boundaries | PASS |
| Safe to commit to private GitHub | YES |

### 2. Governance Registry Review — PASS

| Check | Result |
|---|---|
| All 10 asset types present | PASS — Agent, Prompt, Repo, Vendor, Model, Integration, Data Store, Workflow, Document, Pilot Deployment all enumerated |
| All 17 required fields enforced | PASS |
| Risk tier validation | PASS |
| Approval status validation | PASS |
| Fake assets load (14 assets) | PASS |
| Invalid assets fail clearly | PASS |
| Export (CSV + JSON) works | PASS |
| No private data in registry | PASS |
| All assets `live_status = not_live` | PASS |

Note: The fake registry has no "Prompt" or "Vendor" or "Document" asset instances, but those types are in `ASSET_TYPES`. This is correct — the scaffold demonstrates the shape, not full population.

### 3. Risk Tier and Approval Review — PASS (with patch)

| Check | Result |
|---|---|
| Tiers 0–4 documented and validated | PASS |
| Approval statuses validated | PASS |
| Invalid tier values fail | PASS |
| Invalid approval values fail | PASS |
| Approval status ≠ automatic deployment | PASS |
| Blake approval remains final gate | PASS |
| **`can_go_live()` excluded Tier 0** | **PATCHED** |

**Bug found and fixed:** `src/governance/approvals.py` `can_go_live()` returned `True` for Tier 0 (Draft only) assets if they ever received "Approved for Pilot" status. Tier 0 is defined as "Draft only — Cannot act" and must never be live-eligible. Fixed: `return risk_tier in (1, 2, 3, 4)`. Test added: `test_tier_0_never_live_eligible`.

### 4. Kill Switch Config Review — PASS

| Check | Result |
|---|---|
| All 9 required default flags present | PASS |
| All defaults deny-by-default | PASS |
| HUMAN_ONLY_MODE overrides everything | PASS |
| Only actor "blake" can touch kill switches | PASS |
| Unauthorized actors refused and logged | PASS |
| `emergency_stop()` locks everything | PASS |
| All blocked attempts logged | PASS |
| No automatic reactivation path | PASS |
| No live Telegram/OpenClaw/MCP integration | PASS |
| `.env.example` parses to safe defaults | PASS |

Demo output confirmed: all 4 action types blocked under defaults, unauthorized flip refused, Blake-authorized flip + emergency stop works correctly.

### 5. AI Eval Pack Review — PASS

| Check | Result |
|---|---|
| All 12 safety categories covered | PASS |
| 18 eval cases, all passing | PASS |
| FakeAgent never calls a real model | PASS |
| Failure modes are clear | PASS |
| Pass/fail output is human-readable | PASS |
| No real client data in eval cases | PASS |
| `scripts/run_evals.py` exits 0 | PASS |

Categories confirmed: prompt_injection, memory_poisoning, redaction, langfuse_outage_fallback, sqlite_read_only_mode, no_outbound_without_approval, kill_switch_active, metadata_only_trace, wrong_store_write_blocked, system_rule_modification_blocked, kill_switch_modification_blocked, hallucinated_store_fact_flagged.

### 6. Pilot Readiness Checklist Review — PASS

| Check | Result |
|---|---|
| 21 required sections | PASS |
| Blank template exists | PASS |
| Fake completed sample exists | PASS |
| Required sections validate | PASS |
| Blake approval block required | PASS |
| Single blocked section blocks go-live | PASS |
| No override path to go-live | PASS |
| Checklist does not deploy anything | PASS |

`is_approved_for_go_live()` requires every section Ready/Approved AND `approved_by: Blake` with a date. Both conditions tested and enforced.

### 7. Weekly Proof / Case Study Template Review — PASS

| Check | Result |
|---|---|
| All 19 required fields present | PASS |
| Private fields: private_notes, screenshots_evidence, operator_feedback | PASS |
| `to_public()` strips private fields | PASS |
| `validate_public()` rejects leaked private fields | PASS |
| `time_saved_estimate` must say "estimate" | PASS — validator enforces it |
| No fake customer quotes | PASS |
| No inflated ROI without estimate marker | PASS |
| Blank + fake sample templates exist | PASS |
| Publishing flow requires Blake approval | PASS |

### 8. Script and Packaging Review — PASS

| Script | Result |
|---|---|
| `demo_registry.py` | PASS |
| `demo_kill_switches.py` | PASS |
| `demo_human_only_mode.py` | PASS |
| `run_evals.py` | PASS — exits 0 |
| `export_registry.py` | PASS — 14 assets exported |
| `export_templates.py` | PASS — 8 templates copied |
| `package_governance_zip.py` | PASS — 81 files packaged |

Packaging excludes: `.git`, `__pycache__`, `.pytest_cache`, `dist`, `exports`, `.env`, `.pyc`. Correct.

### 9. Test Coverage Review — PASS

44 tests covering:

- Registry fake asset loading ✓
- Required fields validation ✓
- Risk tier validation (valid + invalid + bool rejection) ✓
- Approval status validation ✓
- Kill switch behavior ✓
- Human-only mode (overrides all other flags) ✓
- SQLite write blocking ✓
- Tool execution blocking ✓
- Outbound action blocking (including Telegram-specific flag) ✓
- Blocked action logging ✓
- Eval runner ✓
- Prompt injection cases ✓
- Memory poisoning cases ✓
- Redaction (email, phone, SSN) ✓
- Metadata-only trace (no raw content) ✓
- Readiness checklist required sections ✓
- Weekly proof template required fields ✓
- Public/private proof boundary ✓
- **Tier 0 never live-eligible (added by this audit)** ✓

### 10. Documentation Review — PASS

| Doc | Result |
|---|---|
| README.md | PASS — covers what/not-what, install, all run commands, future stack connections, Blake approval rationale |
| CLAUDE.md | PASS — clear audit and hardening instructions |
| AGENTS.md | PASS — 8 clear agent boundaries |
| docs/governance_overview.md | PASS |
| docs/registry_fields.md | PASS |
| docs/risk_tiers.md | PASS |
| docs/approval_status.md | PASS |
| docs/kill_switches.md | PASS |
| docs/human_only_mode.md | PASS |
| docs/eval_pack.md | PASS |
| docs/safety_cases.md | PASS |
| docs/pilot_readiness.md | PASS |
| docs/weekly_proof_rules.md | PASS |
| docs/public_private_proof_boundary.md | PASS |
| docs/claude_code_audit_prompt.md | PASS — self-contained audit prompt exists |

---

## Patches Applied

### Patch 1 — `src/governance/approvals.py`

```python
# Before
return risk_tier in (0, 1, 2, 3, 4)

# After
return risk_tier in (1, 2, 3, 4)
```

Tier 0 (Draft only / Cannot act) was live-eligible if it ever received "Approved for Pilot" status. This contradicts the definition. Patch: exclude Tier 0 from live eligibility.

### Patch 2 — `tests/test_approval_status.py`

Added `test_tier_0_never_live_eligible()` asserting `can_go_live("Approved for Pilot", 0)` is `False`.

---

## Deferred Decisions for Blake

### D1 — `SANITIZED_CONTENT` flag is a stub with no implementation

The flag exists in `config.py`, `.env.example`, and `docs/kill_switches.md` but is never read or checked anywhere in the codebase. It is currently inert (value=false, which is safe). **Decision needed:** what action or content gate should consult this flag? Options: gate FakeAgent `replied=True` responses, gate public proof publishing, or remove the flag until it is designed. Do not implement until the scope is defined.

### D2 — `RuntimeGuard.check_agent_runtime()` is defined but never called

The method correctly blocks when `AGENT_ENABLED=False`, but it is never invoked anywhere. It may be intended as a future wrapper for a broader agent runtime check distinct from `check_autonomous_reply()`. **Decision needed:** is this a deliberate placeholder hook for when agent runtime checks (e.g., rate limits, scheduled windows) are added, or should it be removed to avoid dead code?

---

## Definition-of-Done Checklist

| Item | Status |
|---|---|
| Repo initializes locally | **PASS** |
| Fake registry assets load | **PASS** — 14 assets, all validated |
| Risk tiers documented and validated | **PASS** |
| Approval statuses documented and validated | **PASS** |
| Kill switch flags work | **PASS** |
| Human-only mode works | **PASS** |
| Blocked actions are logged | **PASS** |
| AI eval runner works with fake cases | **PASS** — 18/18 |
| Pilot readiness checklist: blank + fake sample | **PASS** |
| Weekly proof template: blank + fake sample | **PASS** |
| Docs explain governance boundaries | **PASS** |
| Tests pass | **PASS** — 44/44 after patch |
| No secrets included | **PASS** |
| No real client data included | **PASS** |
| Repo can be zipped for Proof Library storage | **PASS** — `package_governance_zip.py` works |
| Repo is ready for Claude Code audit completion | **PASS** |
| Repo is safe to commit to private GitHub after Blake approval | **YES** |

---

## Summary

| Item | Value |
|---|---|
| **Overall verdict** | APPROVED WITH PATCHES |
| **Tests** | 44 passed / 0 failed |
| **Evals** | 18 passed / 0 failed |
| **Critical issues** | None |
| **Patches applied** | 2 (can_go_live Tier 0 fix + test) |
| **Deferred decisions for Blake** | 2 (SANITIZED_CONTENT stub, check_agent_runtime dead method) |
| **Safe to commit to private GitHub** | Yes — after Blake review of this report |
| **Safe to archive in Proof Library** | Yes |
| **Ready to join Governed Pilot Starter Pack v0.1** | Yes |
| **Recommended next step** | Blake reviews this report → approves → commits governance layer to its own private GitHub repo → archives zip in Proof Library |
