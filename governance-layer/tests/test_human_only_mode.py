from src.control.config import GovernanceConfig
from src.control.blocked_action_log import BlockedActionLog
from src.control.runtime_guard import RuntimeGuard
from src.control.safe_pause import SAFE_PAUSE_MESSAGE
from src.evals.fake_agent import FakeAgent


def test_human_only_blocks_everything_even_if_agent_enabled():
    config = GovernanceConfig({"AGENT_ENABLED": True, "HUMAN_ONLY_MODE": True,
                               "ALLOW_SQLITE_WRITES": True,
                               "ALLOW_TOOL_EXECUTION": True,
                               "ALLOW_OUTBOUND_ACTIONS": True})
    log = BlockedActionLog()
    guard = RuntimeGuard(config, log)
    assert not guard.check_autonomous_reply().allowed
    assert not guard.check_memory_write().allowed
    assert not guard.check_tool_execution().allowed
    assert not guard.check_outbound_action().allowed
    assert log.count() == 4


def test_safe_pause_message_returned():
    agent = FakeAgent()
    resp = agent.handle("What were sales yesterday?")
    assert resp["replied"] is False
    assert resp["response_text"] == SAFE_PAUSE_MESSAGE
    assert resp["logged"] is True
