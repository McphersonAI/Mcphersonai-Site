"""RuntimeGuard: every sensitive action consults this before happening."""
from dataclasses import dataclass

from .safe_pause import SAFE_PAUSE_MESSAGE


@dataclass
class GuardDecision:
    allowed: bool
    reason: str
    message: str = ""


class RuntimeGuard:
    def __init__(self, config, log):
        self.config = config
        self.log = log

    def _block(self, action_type, flag, detail=""):
        self.log.record(action_type, detail=detail, flag=flag)
        return GuardDecision(False, f"blocked_by_{flag}", SAFE_PAUSE_MESSAGE)

    def check_agent_runtime(self, detail=""):
        if not self.config.get("AGENT_ENABLED"):
            return self._block("agent_runtime_blocked", "AGENT_ENABLED", detail)
        return GuardDecision(True, "agent_enabled")

    def check_autonomous_reply(self, detail=""):
        if not self.config.get("AGENT_ENABLED"):
            return self._block("autonomous_reply_blocked", "AGENT_ENABLED", detail)
        if self.config.get("HUMAN_ONLY_MODE"):
            return self._block("autonomous_reply_blocked", "HUMAN_ONLY_MODE", detail)
        return GuardDecision(True, "reply_allowed")

    def check_memory_write(self, detail=""):
        if self.config.get("HUMAN_ONLY_MODE"):
            return self._block("memory_write_blocked", "HUMAN_ONLY_MODE", detail)
        if not self.config.get("ALLOW_SQLITE_WRITES"):
            return self._block("memory_write_blocked", "ALLOW_SQLITE_WRITES", detail)
        return GuardDecision(True, "memory_write_allowed")

    def check_tool_execution(self, detail=""):
        if self.config.get("HUMAN_ONLY_MODE"):
            return self._block("tool_execution_blocked", "HUMAN_ONLY_MODE", detail)
        if not self.config.get("ALLOW_TOOL_EXECUTION"):
            return self._block("tool_execution_blocked", "ALLOW_TOOL_EXECUTION", detail)
        return GuardDecision(True, "tool_execution_allowed")

    def check_outbound_action(self, detail="", channel="generic"):
        if self.config.get("HUMAN_ONLY_MODE"):
            return self._block("outbound_action_blocked", "HUMAN_ONLY_MODE", detail)
        if not self.config.get("ALLOW_OUTBOUND_ACTIONS"):
            return self._block("outbound_action_blocked", "ALLOW_OUTBOUND_ACTIONS", detail)
        if channel == "telegram" and not self.config.get("TELEGRAM_ENABLED"):
            return self._block("outbound_action_blocked", "TELEGRAM_ENABLED", detail)
        return GuardDecision(True, "outbound_allowed")
