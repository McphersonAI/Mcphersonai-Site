"""Deny-by-default policy engine.

A tool call is blocked unless ALL of these are true:

1. the current mode exists in the mode policy
2. human-only mode is not active
3. the tool is registered
4. the tool is enabled
5. the tool is not in the always_blocked category
6. the tool is fake_only (v0.1 hard rule)
7. the current mode is not in the tool's blocked_modes
8. the current mode is in the tool's allowed_modes
9. the mode allows the tool's action type (read/write/control/outbound)
10. incident restrictions do not block it
11. a valid approval exists, if approval is required

If any condition fails, the engine returns a blocked Decision that explains
why, and the decision is always loggable.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from .approvals import find_valid_approval
from .models import Approval, Decision, ModePolicy, ToolDefinition


def _blocked(
    tool_name: str,
    requested_action: str,
    current_mode: str,
    reason: str,
    category: Optional[str] = None,
    risk_tier: Optional[str] = None,
    approval_required: bool = False,
    approval_present: bool = False,
) -> Decision:
    return Decision(
        allowed=False,
        tool_name=tool_name,
        requested_action=requested_action,
        category=category,
        current_mode=current_mode,
        reason=reason,
        approval_required=approval_required,
        approval_present=approval_present,
        risk_tier=risk_tier,
        should_log=True,
    )


def evaluate_tool_call(
    tool_name: str,
    requested_action: str,
    current_mode: str,
    registry: Dict[str, ToolDefinition],
    mode_policies: Dict[str, ModePolicy],
    approvals: Optional[List[Approval]] = None,
) -> Decision:
    approvals = approvals or []

    # 1. Mode must exist.
    mode = mode_policies.get(current_mode)
    if mode is None:
        return _blocked(tool_name, requested_action, current_mode,
                        f"Mode '{current_mode}' is not recognized. Deny by default.")

    # 2. Human-only overrides everything.
    if mode.human_only:
        return _blocked(tool_name, requested_action, current_mode,
                        "human_only mode is active: all tool execution is blocked.")

    # 3. Tool must be registered.
    tool = registry.get(tool_name)
    if tool is None:
        return _blocked(tool_name, requested_action, current_mode,
                        f"Tool '{tool_name}' is not registered. Deny by default.")

    base = dict(category=tool.category, risk_tier=tool.risk_tier,
                approval_required=tool.approval_required)

    # 4. Always-blocked category never runs (checked before 'enabled' so the
    #    block reason names the stronger policy, not the weaker flag).
    if tool.category == "always_blocked":
        return _blocked(tool_name, requested_action, current_mode,
                        f"Tool '{tool_name}' is always blocked in v0.1. "
                        "No mode or approval can enable it.", **base)

    # 5. Tool must be enabled.
    if not tool.enabled:
        return _blocked(tool_name, requested_action, current_mode,
                        f"Tool '{tool_name}' is disabled.", **base)

    # 6. v0.1 hard rule: only fake tools may execute.
    if not tool.fake_only:
        return _blocked(tool_name, requested_action, current_mode,
                        "Non-fake tools are not allowed in v0.1.", **base)

    # 7. Explicit blocked modes.
    if current_mode in tool.blocked_modes:
        return _blocked(tool_name, requested_action, current_mode,
                        f"Mode '{current_mode}' is in this tool's blocked_modes.", **base)

    # 8. Explicit allow list of modes.
    if current_mode not in tool.allowed_modes:
        return _blocked(tool_name, requested_action, current_mode,
                        f"Mode '{current_mode}' is not in this tool's allowed_modes.", **base)

    # 9. Action-type gating by mode.
    if tool.action_type == "read" and not mode.reads_allowed:
        return _blocked(tool_name, requested_action, current_mode,
                        "Reads are not allowed in this mode.", **base)
    if tool.action_type == "write" and not mode.writes_allowed:
        return _blocked(tool_name, requested_action, current_mode,
                        "Writes are not allowed in this mode.", **base)
    if tool.action_type == "outbound" and not mode.outbound_allowed:
        return _blocked(tool_name, requested_action, current_mode,
                        "Outbound actions are not allowed in this mode.", **base)

    # 10. Incident restrictions.
    if mode.incident_restricted:
        if tool.action_type in ("write", "control", "outbound"):
            return _blocked(tool_name, requested_action, current_mode,
                            "incident_mode blocks writes, control actions, and "
                            "outbound actions until Blake approval outside this layer.",
                            **base)

    # 11. Approval-required tools.
    approval_present = False
    if tool.approval_required:
        if not mode.approval_tools_allowed:
            return _blocked(tool_name, requested_action, current_mode,
                            "Approval-required tools are blocked in this mode.", **base)
        match = find_valid_approval(approvals, tool_name, current_mode)
        if match is None:
            return _blocked(tool_name, requested_action, current_mode,
                            "Approval required but no valid approval is present "
                            "(must match tool, mode, be unexpired, and carry a "
                            "Blake approval marker).", **base)
        approval_present = True

    return Decision(
        allowed=True,
        tool_name=tool_name,
        requested_action=requested_action,
        category=tool.category,
        current_mode=current_mode,
        reason="All deny-by-default conditions passed.",
        approval_required=tool.approval_required,
        approval_present=approval_present,
        risk_tier=tool.risk_tier,
        should_log=True,
    )
