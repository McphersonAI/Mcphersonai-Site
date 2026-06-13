from mcpherson_mcp_registry import evaluate_tool_call


def test_blocked_without_approval(registry, modes, approvals):
    d = evaluate_tool_call("enable_fake_live_mode", "control", "dry_run", registry, modes, approvals)
    assert d.allowed is False
    assert d.approval_required is True
    assert d.approval_present is False


def test_allowed_with_valid_fake_approval(registry, modes, approvals):
    d = evaluate_tool_call("mark_fake_pilot_ready", "control", "dry_run", registry, modes, approvals)
    assert d.allowed is True
    assert d.approval_present is True


def test_wrong_tool_approval_does_not_work(registry, modes, approvals):
    # APPR-FAKE-003 covers an unregistered tool; it must not enable anything,
    # and the unregistered tool itself must stay blocked.
    d = evaluate_tool_call("some_unregistered_tool", "control", "dry_run", registry, modes, approvals)
    assert d.allowed is False


def test_wrong_mode_approval_does_not_work(registry, modes, approvals):
    # APPR-FAKE-004 covers enable_fake_live_mode only in pilot_prelaunch.
    d = evaluate_tool_call("enable_fake_live_mode", "control", "dry_run", registry, modes, approvals)
    assert d.allowed is False
    d2 = evaluate_tool_call("enable_fake_live_mode", "control", "pilot_prelaunch", registry, modes, approvals)
    assert d2.allowed is True


def test_expired_approval_does_not_work(registry, modes, approvals):
    # APPR-FAKE-002 for change_fake_approval_status expired in 2020.
    d = evaluate_tool_call("change_fake_approval_status", "control", "dry_run", registry, modes, approvals)
    assert d.allowed is False


def test_no_approvals_at_all_blocks(registry, modes):
    d = evaluate_tool_call("mark_fake_pilot_ready", "control", "dry_run", registry, modes, approvals=None)
    assert d.allowed is False
