# Overview

## Purpose

The Secrets / Environment Deployment Pack is the operational safety layer that
lets McPherson AI move from fake/local development to restricted live pilot use
without contaminating the core repo, reusable snapshots, zip artifacts, or
proof artifacts with secrets, real client data, or live configuration.

It defines:

- six environments and what each allows/forbids (`environment_matrix.md`)
- four secret classes (`secret_classification.md`)
- where `.env` files live and never live (`env_file_policy.md`)
- what may and may never be committed (`github_safety_policy.md`)
- snapshot rules (`snapshot_safety_policy.md`)
- promotion gates with Blake approval (`deployment_promotion_gates.md`)
- key rotation, scanning, incident handling, and known limits

## Boundaries

This pack is documentation-first and testable, and it is **fake-data-only**:

- not a live secret manager
- not production deployment automation
- not a live agent, bot, MCP server, or tracing integration
- not a cloud deployment tool
- not a customer-facing product
- stores no real secrets, no real client data, no real `.env`

## Final rule

This pack does not make deployment more automatic. It makes deployment safer.
No secret, no real data, no live config, and no reusable snapshot contamination
unless Blake explicitly approves the correct environment transition.
