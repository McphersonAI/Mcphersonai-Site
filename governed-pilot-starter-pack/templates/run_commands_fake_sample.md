# Run Commands Record — FAKE SAMPLE (fictional results)

**Pilot ID:** pilot_999_fake_taco_test_store
**Date:** 2026-01-06 to 2026-01-07 (fake)

## SQLite module
| Command | Date | Result |
|---|---|---|
| `pip install pytest` | 2026-01-06 | OK |
| `python3 -m pytest` | 2026-01-06 | 24 passed (fake count) |
| `python3 -m src.agent_runtime_example` | 2026-01-06 | Fake store profile created; fake shift note written |

## Governance module
| Command | Date | Result |
|---|---|---|
| `python3 -m pytest` | 2026-01-06 | All pass (fake) |
| `python3 scripts/run_evals.py` | 2026-01-06 | All evals pass (fake) |
| `python3 scripts/demo_kill_switches.py` | 2026-01-06 | Defaults safe (fake) |
| `python3 scripts/demo_human_only_mode.py` | 2026-01-06 | Human-only mode engages (fake) |
| `python3 scripts/export_registry.py` | 2026-01-07 | Registry exported to 06_governance/ (fake) |

## Langfuse module
| Step | Command used | Date | Result |
|---|---|---|---|
| Fake store trace | (module-specific, per Langfuse repo docs) | 2026-01-07 | Metadata-only trace confirmed (fake) |
| Outage simulation | (module-specific) | 2026-01-07 | NullTrace fallback OK (fake) |
| Docker stack verification | (module-specific) | 2026-01-07 | All services up (fake) |
