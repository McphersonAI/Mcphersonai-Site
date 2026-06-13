# Dry-Run Usage

From the repo root:

```bash
# full test suite
python -m pytest tests/ -v

# scaffold verification (files, loads, secrets, fictional markers)
python scripts/verify_mcp_registry.py

# decision walkthrough: allowed reads/writes, blocks, approval flow
python scripts/demo_tool_decisions.py

# prove human_only blocks everything
python scripts/demo_human_only_mode.py

# prove incident_mode allows incident reads only
python scripts/demo_incident_mode.py

# export registry/policy/examples to exports/ (gitignored, package-excluded)
python scripts/export_registry.py

# build a clean zip in dist/
python scripts/package_mcp_registry_zip.py
```

Everything runs offline with stdlib + pytest. No environment variables required.
