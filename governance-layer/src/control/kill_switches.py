"""Kill switch panel. Only the human actor 'blake' may change flags.
Agent attempts are refused and logged."""
from .config import DEFAULT_FLAGS, coerce_flag

AUTHORIZED_ACTORS = {"blake"}


class KillSwitchPanel:
    def __init__(self, config, log):
        self.config = config
        self.log = log

    def set_flag(self, name, value, actor):
        if str(actor).strip().lower() not in AUTHORIZED_ACTORS:
            self.log.record(
                "kill_switch_modification_blocked",
                detail=f"actor={actor!r} tried to set {name}={value!r}",
                flag=name,
            )
            return False
        if name not in DEFAULT_FLAGS:
            raise KeyError(f"Unknown governance flag: {name!r}")
        self.config.flags[name] = coerce_flag(name, value)
        return True

    def emergency_stop(self, actor):
        """Flip everything to the most restrictive state."""
        ok = True
        for name, value in [
            ("AGENT_ENABLED", False), ("TELEGRAM_ENABLED", False),
            ("HUMAN_ONLY_MODE", True), ("ALLOW_SQLITE_WRITES", False),
            ("ALLOW_TOOL_EXECUTION", False), ("ALLOW_OUTBOUND_ACTIONS", False),
        ]:
            ok = self.set_flag(name, value, actor) and ok
        return ok

    def status(self):
        return self.config.as_dict()
