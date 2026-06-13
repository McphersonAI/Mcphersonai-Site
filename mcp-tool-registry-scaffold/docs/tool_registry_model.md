# Tool Registry Model

Each tool in `data/tool_registry.json` defines:

| Field | Meaning |
|---|---|
| `name` | Unique tool name an agent would request |
| `description` | What the tool does |
| `category` | `safe_read`, `controlled_write`, `approval_required`, or `always_blocked` |
| `action_type` | `read`, `write`, `control`, or `outbound` — gated per mode |
| `risk_tier` | `low` / `medium` / `high` / `critical` |
| `enabled` | Disabled tools are always blocked. Missing value fails closed (disabled). |
| `approval_required` | If true, a valid (fake in v0.1) Blake approval must exist. Missing value fails closed (required). |
| `allowed_modes` | Explicit allow list. A mode not listed here blocks the tool. |
| `blocked_modes` | Explicit deny list. Checked in addition to allowed_modes. |
| `can_read` / `can_write` / `can_outbound` | Capability flags for documentation and audit |
| `fake_only` | Must be `true` for every tool in v0.1; the engine blocks non-fake tools |
| `notes` | Human notes |

The registry also includes one intentionally **disabled** demo tool
(`read_fake_disabled_demo`) so "disabled tools are blocked" has live test coverage.
