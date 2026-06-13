"""Tool executor: policy decision -> fake execution -> trace event.

This is the function a future agent runtime harness would call. In v0.1 it
only ever executes fake tools, and only when the deny-by-default policy
engine allows the call.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .fake_tools import FAKE_TOOL_IMPLEMENTATIONS, FakeStore
from .models import Approval, ModePolicy, ToolDefinition
from .policy_engine import evaluate_tool_call
from .trace_events import build_trace_event


def execute_tool_call(
    tool_name: str,
    requested_action: str,
    current_mode: str,
    registry: Dict[str, ToolDefinition],
    mode_policies: Dict[str, ModePolicy],
    approvals: Optional[List[Approval]] = None,
    store: Optional[FakeStore] = None,
    fake_pilot_id: str = "PILOT-FAKE-001",
    **tool_kwargs: Any,
) -> Dict[str, Any]:
    """Evaluate, optionally execute (fake only), and trace a tool call.

    Returns: {"decision": dict, "result": dict|None, "trace_event": dict}
    """
    decision = evaluate_tool_call(
        tool_name, requested_action, current_mode, registry, mode_policies, approvals
    )
    trace_event = build_trace_event(decision, fake_pilot_id=fake_pilot_id)

    if not decision.allowed:
        blocked = {
            "allowed": False,
            "tool_name": decision.tool_name,
            "current_mode": decision.current_mode,
            "reason_blocked": decision.reason,
            "approval_required": decision.approval_required,
            "approval_present": decision.approval_present,
            "should_log": True,
            "fictional_marker": decision.fictional_marker,
        }
        return {"decision": decision.to_dict(), "result": blocked,
                "trace_event": trace_event}

    impl = FAKE_TOOL_IMPLEMENTATIONS.get(tool_name)
    if impl is None:
        # Registered and allowed but no fake implementation: fail closed.
        blocked = {
            "allowed": False,
            "tool_name": tool_name,
            "current_mode": current_mode,
            "reason_blocked": "No fake implementation exists for this tool. Deny by default.",
            "approval_required": decision.approval_required,
            "approval_present": decision.approval_present,
            "should_log": True,
            "fictional_marker": decision.fictional_marker,
        }
        decision.allowed = False
        decision.reason = blocked["reason_blocked"]
        trace_event = build_trace_event(decision, fake_pilot_id=fake_pilot_id)
        return {"decision": decision.to_dict(), "result": blocked,
                "trace_event": trace_event}

    result = impl(store or FakeStore(), **tool_kwargs)
    return {"decision": decision.to_dict(), "result": result,
            "trace_event": trace_event}
