# Langfuse Setup Checklist

Langfuse is optional for internal fake dry-runs but **strongly recommended for any live agent pilot**. For live agents interacting with real store workflow, Langfuse or an equivalent trace layer is treated as **required**.

## Checks

- [ ] Docker stack starts locally or on approved private infrastructure
- [ ] Required services are documented
- [ ] Credentials are stored safely
- [ ] `.env` is not committed
- [ ] Metadata-only mode is the default
- [ ] Sanitized content is not enabled without Blake approval
- [ ] Fake trace examples run
- [ ] Outage fallback works
- [ ] NullTrace works
- [ ] No raw client/operator content logs by default
- [ ] No public exposure unless explicitly approved

## Placement

Langfuse setup notes and trace verification records go to `05_langfuse_observability/` of the pilot folder.
