# Mode Policy Model

Each mode in `data/mode_policy.json` defines:

| Field | Meaning |
|---|---|
| `mode_name` | One of: local_fake, dry_run, pilot_prelaunch, pilot_live_restricted, human_only, incident_mode |
| `reads_allowed` | Whether read-type tools may run |
| `writes_allowed` | Whether write-type tools may run |
| `outbound_allowed` | Whether outbound tools may run (false in every v0.1 mode) |
| `approval_tools_allowed` | Whether approval-required tools may run *with* a valid approval |
| `real_integrations_allowed` | False in every v0.1 mode |
| `human_only` | If true, all tool execution is blocked, overriding everything |
| `incident_restricted` | If true, writes/control/outbound are blocked regardless of other flags |
| `notes` | Human notes |

Missing boolean fields fail closed (treated as false / blocking).

## Mode summary

| Mode | Reads | Writes | Approval tools | Outbound |
|---|---|---|---|---|
| local_fake | ✔ | ✔ (fake) | with fake approval | ✘ |
| dry_run | ✔ | ✔ (fake) | with fake approval | ✘ |
| pilot_prelaunch | ✔ | ✔ (fake/approved) | with approval | ✘ |
| pilot_live_restricted | ✔ | policy-gated | with Blake approval | ✘ (v0.1) |
| human_only | ✘ | ✘ | ✘ | ✘ |
| incident_mode | ✔ (incident review only) | ✘ | ✘ | ✘ |
