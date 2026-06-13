EXPECTED = {"local_fake", "dry_run", "pilot_prelaunch",
            "pilot_live_restricted", "human_only", "incident_mode"}


def test_mode_policy_loads(modes):
    assert set(modes) == EXPECTED


def test_no_mode_allows_outbound_or_real_integrations(modes):
    for m in modes.values():
        assert m.outbound_allowed is False
        assert m.real_integrations_allowed is False
