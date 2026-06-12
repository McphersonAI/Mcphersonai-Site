from src.control.config import GovernanceConfig
from src.control.blocked_action_log import BlockedActionLog
from src.control.runtime_guard import RuntimeGuard


def test_writes_blocked_and_logged_when_disabled():
    config = GovernanceConfig({"HUMAN_ONLY_MODE": False, "ALLOW_SQLITE_WRITES": False})
    log = BlockedActionLog()
    guard = RuntimeGuard(config, log)
    d = guard.check_memory_write(detail="fake write")
    assert not d.allowed
    assert log.count("memory_write_blocked") == 1
    assert log.last["flag"] == "ALLOW_SQLITE_WRITES"


def test_writes_allowed_when_enabled():
    config = GovernanceConfig({"HUMAN_ONLY_MODE": False, "ALLOW_SQLITE_WRITES": True})
    guard = RuntimeGuard(config, BlockedActionLog())
    assert guard.check_memory_write().allowed
