from src.control.config import GovernanceConfig
from src.control.blocked_action_log import BlockedActionLog
from src.control.runtime_guard import RuntimeGuard


def test_tools_blocked_and_logged_when_disabled():
    config = GovernanceConfig({"HUMAN_ONLY_MODE": False, "ALLOW_TOOL_EXECUTION": False})
    log = BlockedActionLog()
    guard = RuntimeGuard(config, log)
    assert not guard.check_tool_execution(detail="fake tool").allowed
    assert log.count("tool_execution_blocked") == 1


def test_tools_allowed_when_enabled():
    config = GovernanceConfig({"HUMAN_ONLY_MODE": False, "ALLOW_TOOL_EXECUTION": True})
    guard = RuntimeGuard(config, BlockedActionLog())
    assert guard.check_tool_execution().allowed
