"""Governance config flags. Deny-by-default."""
from pathlib import Path

DEFAULT_FLAGS = {
    "AGENT_ENABLED": False,
    "TELEGRAM_ENABLED": False,
    "HUMAN_ONLY_MODE": True,
    "ALLOW_SQLITE_WRITES": False,
    "ALLOW_TOOL_EXECUTION": False,
    "ALLOW_OUTBOUND_ACTIONS": False,
    "LANGFUSE_ENABLED": True,
    "LANGFUSE_MODE": "metadata_only",
    "SANITIZED_CONTENT": False,
}

VALID_LANGFUSE_MODES = {"metadata_only", "full", "off"}


def coerce_flag(name, value):
    if name not in DEFAULT_FLAGS:
        raise KeyError(f"Unknown governance flag: {name!r}")
    if isinstance(DEFAULT_FLAGS[name], bool):
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in ("true", "1", "yes", "on")
    return str(value).strip()


class GovernanceConfig:
    def __init__(self, overrides=None):
        self.flags = dict(DEFAULT_FLAGS)
        for name, value in (overrides or {}).items():
            self.flags[name] = coerce_flag(name, value)
        if self.flags["LANGFUSE_MODE"] not in VALID_LANGFUSE_MODES:
            raise ValueError(f"Invalid LANGFUSE_MODE: {self.flags['LANGFUSE_MODE']!r}")

    def get(self, name):
        if name not in self.flags:
            raise KeyError(f"Unknown governance flag: {name!r}")
        return self.flags[name]

    def as_dict(self):
        return dict(self.flags)

    @classmethod
    def from_env_file(cls, path):
        overrides = {}
        for line in Path(path).read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            if key in DEFAULT_FLAGS:
                overrides[key] = value.strip()
        return cls(overrides)
