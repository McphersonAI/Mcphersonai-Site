# Pilot-Specific Config Process

Real pilot configuration is added only AFTER a pilot-specific environment has
been spun up from a clean reusable template. Never the other way around.

## Process

1. Verify the reusable template is clean: run both scans and record a
   snapshot safety record showing no real secrets/data.
2. Spin up the pilot-specific environment (VPS or private deployment machine)
   from that clean template.
3. Enter `pilot_prelaunch` with a Blake-approved environment approval record.
4. Create the real `.env` directly on the pilot machine — never in GitHub,
   never copied through the template, never through a zip.
5. Register every secret in a secret inventory record (name, class, location,
   owner, rotation cadence).
6. Add approved real pilot metadata to the client-specific folder only.
7. Before `pilot_live_restricted`: complete the promotion gate (kill switches,
   rollback, backups, Langfuse mode, governance record, Blake approval).

## Rule

Pilot config flows one way: clean template → pilot machine. Nothing flows back
from a pilot machine into templates, reusable snapshots, GitHub, or zips.
