# Run Commands Record — Pilot ___

**Pilot ID:**
**Date:**

Record the exact commands run and a summary of output for each phase. Full output goes to 12_audit_reports/.

## SQLite module
| Command | Date | Result |
|---|---|---|
| `pip install pytest` | | |
| `python3 -m pytest` | | |
| `python3 -m src.agent_runtime_example` | | |

## Governance module
| Command | Date | Result |
|---|---|---|
| `python3 -m pytest` | | |
| `python3 scripts/run_evals.py` | | |
| `python3 scripts/demo_registry.py` | | |
| `python3 scripts/demo_kill_switches.py` | | |
| `python3 scripts/demo_human_only_mode.py` | | |
| `python3 scripts/export_registry.py` | | |

## Langfuse module (module-specific commands — record what was actually run)
| Step | Command used | Date | Result |
|---|---|---|---|
| Fake store trace | | | |
| Fake weekly summary trace | | | |
| Outage simulation | | | |
| Docker stack verification | | | |
