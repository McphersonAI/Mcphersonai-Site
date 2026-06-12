"""Append-only log of blocked actions. Every refusal leaves a trace."""
import json
import time


class BlockedActionLog:
    def __init__(self, path=None):
        self.path = path
        self.entries = []

    def record(self, action_type, detail="", flag=None):
        entry = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "action_type": action_type,
            "detail": detail,
            "flag": flag,
        }
        self.entries.append(entry)
        if self.path:
            with open(self.path, "a") as f:
                f.write(json.dumps(entry) + "\n")
        return entry

    def count(self, action_type=None):
        if action_type is None:
            return len(self.entries)
        return sum(1 for e in self.entries if e["action_type"] == action_type)

    @property
    def last(self):
        return self.entries[-1] if self.entries else None
