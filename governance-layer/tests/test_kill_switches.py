from src.control.config import GovernanceConfig, DEFAULT_FLAGS
from src.control.blocked_action_log import BlockedActionLog
from src.control.runtime_guard import RuntimeGuard
from src.control.kill_switches import KillSwitchPanel


def make():
    config = GovernanceConfig()
    log = BlockedActionLog()
    return config, log, RuntimeGuard(config, log), KillSwitchPanel(config, log)


def test_defaults_are_locked_down():
    assert DEFAULT_FLAGS["AGENT_ENABLED"] is False
    assert DEFAULT_FLAGS["HUMAN_ONLY_MODE"] is True
    assert DEFAULT_FLAGS["ALLOW_SQLITE_WRITES"] is False
    assert DEFAULT_FLAGS["ALLOW_TOOL_EXECUTION"] is False
    assert DEFAULT_FLAGS["ALLOW_OUTBOUND_ACTIONS"] is False
    assert DEFAULT_FLAGS["LANGFUSE_MODE"] == "metadata_only"


def test_agent_disabled_blocks_reply_and_logs():
    _, log, guard, _ = make()
    d = guard.check_autonomous_reply()
    assert not d.allowed
    assert log.count("autonomous_reply_blocked") == 1


def test_unauthorized_actor_cannot_flip_switch():
    config, log, _, panel = make()
    assert panel.set_flag("ALLOW_OUTBOUND_ACTIONS", True, actor="fake-agent") is False
    assert config.get("ALLOW_OUTBOUND_ACTIONS") is False
    assert log.count("kill_switch_modification_blocked") == 1


def test_blake_can_flip_switch_and_emergency_stop():
    config, _, _, panel = make()
    assert panel.set_flag("AGENT_ENABLED", True, actor="blake")
    assert config.get("AGENT_ENABLED") is True
    assert panel.emergency_stop(actor="blake")
    assert config.get("AGENT_ENABLED") is False
    assert config.get("HUMAN_ONLY_MODE") is True


def test_env_example_parses_to_safe_defaults():
    config = GovernanceConfig.from_env_file(".env.example")
    assert config.get("AGENT_ENABLED") is False
    assert config.get("HUMAN_ONLY_MODE") is True
    assert config.get("LANGFUSE_MODE") == "metadata_only"
