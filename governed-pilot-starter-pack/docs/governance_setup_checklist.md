# Governance Setup Checklist

Governance is **required for every governed deployment.** No exceptions.

## Checks

- [ ] Pilot deployment is registered
- [ ] Agent is registered
- [ ] SQLite module is registered
- [ ] Langfuse module is registered
- [ ] Telegram or chat interface is registered (if used)
- [ ] Prompt version is registered
- [ ] Risk tier is assigned
- [ ] Approval status is correct
- [ ] Allowed tools are defined
- [ ] Forbidden tools are defined
- [ ] Kill switch behavior is tested
- [ ] Human-only mode is tested
- [ ] Evals pass
- [ ] Blake approval is recorded

## Placement

Governance registry exports and test results go to `06_governance/`; kill switch test records to `07_kill_switches/`; eval results to `08_eval_results/`.
