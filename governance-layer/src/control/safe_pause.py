"""Safe pause message returned whenever the agent is not allowed to act."""

SAFE_PAUSE_MESSAGE = (
    "[SAFE PAUSE] Human-only mode or a kill switch is active. "
    "No autonomous reply, memory write, tool execution, or outbound action "
    "will occur. A human operator (Blake) must review and approve this request."
)


def safe_pause(log=None, context=""):
    if log is not None:
        log.record("safe_pause", detail=context)
    return SAFE_PAUSE_MESSAGE
