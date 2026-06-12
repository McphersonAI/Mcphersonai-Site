# Registry Fields

Every asset requires all 17 fields (see `src/governance/registry.py`):

asset_name, asset_type, repo_or_location, owner, purpose, risk_tier,
live_status, data_access, allowed_tools, forbidden_tools, memory_access,
trace_layer, kill_switch, rollback_method, approval_status, last_reviewed,
notes.

Asset types: Agent, Prompt, Repo, Vendor, Model, Integration, Data Store,
Workflow, Document, Pilot Deployment.

Conventions: `live_status` stays `not_live` for everything in this scaffold;
`kill_switch` names the flag(s) that can stop the asset; `rollback_method`
must be concrete and tested before any pilot.
