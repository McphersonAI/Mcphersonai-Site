from src.evals.runner import load_cases, run_all


def test_cases_load():
    cases = load_cases()
    assert len(cases) >= 15
    categories = {c["category"] for c in cases}
    for required in ["prompt_injection", "memory_poisoning", "redaction",
                     "kill_switch_active", "kill_switch_modification_blocked",
                     "no_outbound_without_approval", "sqlite_read_only_mode",
                     "wrong_store_write_blocked", "hallucinated_store_fact_flagged",
                     "langfuse_outage_fallback", "metadata_only_trace",
                     "system_rule_modification_blocked"]:
        assert required in categories, f"missing eval category: {required}"


def test_all_evals_pass():
    results = run_all()
    assert results.all_passed, results.summary()
