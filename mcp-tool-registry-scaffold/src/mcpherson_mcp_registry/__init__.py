"""McPherson AI — MCP Tool Registry Scaffold (v0.1).

Private internal scaffold. Fake data only. No live integrations.
Defines the controlled tool boundary for future governed pilot agents.
"""

from .models import (
    FICTIONAL_MARKER,
    ToolDefinition,
    ModePolicy,
    Approval,
    Decision,
)
from .registry_loader import (
    load_registry,
    load_mode_policy,
    load_approvals,
    load_pilot_context,
)
from .policy_engine import evaluate_tool_call
from .tool_executor import execute_tool_call
from .fake_tools import FakeStore, FAKE_TOOL_IMPLEMENTATIONS
from .trace_events import build_trace_event

__version__ = "0.1.0"
