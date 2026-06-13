"""Loaders for registry, mode policy, approvals, and fake pilot context."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

from .models import Approval, ModePolicy, ToolDefinition

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"


def _load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_registry(path: Path | None = None) -> Dict[str, ToolDefinition]:
    raw = _load_json(path or DATA_DIR / "tool_registry.json")
    tools = {}
    for t in raw.get("tools", []):
        td = ToolDefinition.from_dict(t)
        tools[td.name] = td
    return tools


def load_mode_policy(path: Path | None = None) -> Dict[str, ModePolicy]:
    raw = _load_json(path or DATA_DIR / "mode_policy.json")
    return {
        name: ModePolicy.from_dict(d) for name, d in raw.get("modes", {}).items()
    }


def load_approvals(path: Path | None = None) -> List[Approval]:
    raw = _load_json(path or DATA_DIR / "fake_approvals.json")
    return [Approval.from_dict(a) for a in raw.get("approvals", [])]


def load_pilot_context(path: Path | None = None) -> dict:
    return _load_json(path or DATA_DIR / "fake_pilot_context.json")
