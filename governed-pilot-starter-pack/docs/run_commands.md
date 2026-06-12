# Run Commands Reference

Commands below run **inside each module's own repo**, not in this starter pack, unless noted. Record actual output in the pilot folder's deployment log.

## Governance module commands

```bash
python3 -m pytest
python3 scripts/run_evals.py
python3 scripts/demo_registry.py
python3 scripts/demo_kill_switches.py
python3 scripts/demo_human_only_mode.py
python3 scripts/export_registry.py
python3 scripts/export_templates.py
python3 scripts/package_governance_zip.py
```

## SQLite module commands

```bash
pip install pytest
python3 -m pytest
python3 -m src.agent_runtime_example
```

## Langfuse module commands (module-specific — placeholders)

Do not invent exact commands. Use the commands documented in the Langfuse module repo for each of these steps:

- Run fake store trace — *module-specific*
- Run fake weekly summary trace — *module-specific*
- Run outage simulation — *module-specific*
- Verify Docker stack — *module-specific*

## Starter pack verification commands (run in this repo)

```bash
pip install pytest
python3 -m pytest
python3 scripts/verify_starter_pack.py
python3 scripts/create_fake_pilot_folder.py
python3 scripts/export_starter_pack_templates.py
python3 scripts/package_starter_pack_zip.py
```
