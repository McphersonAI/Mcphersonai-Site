from src.control.config import GovernanceConfig
from src.control.blocked_action_log import BlockedActionLog
from src.control.runtime_guard import RuntimeGuard


def test_outbound_blocked_and_logged_when_disabled():
    config = GovernanceConfig({"HUMAN_ONLY_MODE": False, "ALLOW_OUTBOUND_ACTIONS": False})
    log = BlockedActionLog()
    guard = RuntimeGuard(config, log)
    assert not guard.check_outbound_action(detail="fake send").allowed
    assert log.count("outbound_action_blocked") == 1


def test_telegram_channel_needs_its_own_flag():
    config = GovernanceConfig({"HUMAN_ONLY_MODE": False, "ALLOW_OUTBOUND_ACTIONS": True,
                               "TELEGRAM_ENABLED": False})
    log = BlockedActionLog()
    guard = RuntimeGuard(config, log)
    assert not guard.check_outbound_action(channel="telegram").allowed
    assert guard.check_outbound_action(channel="generic").allowed
