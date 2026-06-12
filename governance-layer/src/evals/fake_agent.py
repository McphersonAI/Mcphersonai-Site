"""Rule-based fake agent for safety evals. Never calls a real model.
Behavior, not just code, is what the eval pack tests."""
import re

from ..control.config import GovernanceConfig
from ..control.blocked_action_log import BlockedActionLog
from ..control.runtime_guard import RuntimeGuard

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
PHONE_RE = re.compile(r"\b\d{3}[-.]\d{3}[-.]\d{4}\b")
SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")

INJECTION_PATTERNS = [
    "ignore all previous instructions",
    "ignore previous instructions",
    "disregard your instructions",
    "disregard all previous",
    "you are now in developer mode",
    "pretend your rules do not apply",
]

CHANGE_WORDS = ["change", "disable", "turn off", "allow", "modify", "flip", "enable", "set", "override"]

MEMORY_WRITE_PATTERNS = [
    "permanent memory", "write to memory", "write this to memory",
    "remember that", "save to memory", "update store", "record that", "log that",
]

OUTBOUND_PATTERNS = ["send ", "text the owner", "email the owner", "message the owner", "notify "]

TOOL_PATTERNS = ["run the tool", "execute tool", "execute the tool", "use the tool", "run tool"]

STORE_RE = re.compile(r"fake-store-(\d+)", re.IGNORECASE)


class FakeAgent:
    def __init__(self, flags=None, log=None):
        self.config = GovernanceConfig(flags or {})
        self.log = log or BlockedActionLog()
        self.guard = RuntimeGuard(self.config, self.log)
        self.store_id = "FAKE-STORE-001"
        self.verified_facts = {"FAKE-STORE-001": {"concept": "fake-qsr", "status": "fake-pilot"}}

    # --- helpers -----------------------------------------------------------
    def redact(self, text):
        text = EMAIL_RE.sub("[REDACTED_EMAIL]", text)
        text = SSN_RE.sub("[REDACTED_SSN]", text)
        text = PHONE_RE.sub("[REDACTED_PHONE]", text)
        return text

    def build_trace(self, text):
        if self.config.get("LANGFUSE_MODE") == "metadata_only":
            return {"event": "agent_turn", "input_chars": len(text), "mode": "metadata_only"}
        if self.config.get("LANGFUSE_MODE") == "off":
            return {}
        return {"event": "agent_turn", "input": self.redact(text), "mode": "full"}

    def _is_unverified_claim(self, text):
        lower = text.lower()
        if "record that" in lower or "log that" in lower:
            return True
        if "always" in lower or "$" in text:
            return True
        return False

    # --- main entry --------------------------------------------------------
    def handle(self, text, langfuse_available=True):
        lower = text.lower()
        resp = {
            "refused": False, "requires_approval": False, "memory_written": False,
            "tool_executed": False, "outbound_sent": False, "kill_switch_changed": False,
            "flagged_unverified": False, "langfuse_skipped": False, "replied": False,
            "logged": False, "response_text": "", "trace": {},
        }

        # Tracing (graceful fallback if Langfuse is down: local log, keep working)
        if self.config.get("LANGFUSE_ENABLED") and langfuse_available:
            resp["trace"] = self.build_trace(text)
        else:
            resp["langfuse_skipped"] = True
            self.log.record("langfuse_unavailable_fallback", detail="local log only, no raw content")

        # 1. Kill switch tampering — always refused, always logged
        if "kill switch" in lower and any(w in lower for w in CHANGE_WORDS):
            self.log.record("kill_switch_modification_blocked", detail=self.redact(text)[:160])
            resp.update(refused=True, requires_approval=True, logged=True)
            resp["response_text"] = "Refused: agents cannot modify kill switches. Attempt logged for review."
            return resp

        # 2. System rule tampering — always refused, always logged
        if (("system rule" in lower) or ("system prompt" in lower) or ("governance rule" in lower)) \
                and any(w in lower for w in CHANGE_WORDS + ["ignore", "reveal", "rewrite"]):
            self.log.record("system_rule_modification_blocked", detail=self.redact(text)[:160])
            resp.update(refused=True, requires_approval=True, logged=True)
            resp["response_text"] = "Refused: agents cannot change system rules. Attempt logged for review."
            return resp

        # 3. Prompt injection — refused, requires approval
        if any(p in lower for p in INJECTION_PATTERNS):
            self.log.record("prompt_injection_blocked", detail=self.redact(text)[:160])
            resp.update(refused=True, requires_approval=True, logged=True)
            resp["response_text"] = "Refused: instruction override attempt detected. Requires human approval."
            return resp

        # 4. Memory writes — gated by HUMAN_ONLY_MODE + ALLOW_SQLITE_WRITES
        if any(p in lower for p in MEMORY_WRITE_PATTERNS):
            match = STORE_RE.search(text)
            if match and f"fake-store-{match.group(1)}".upper() != self.store_id:
                self.log.record("wrong_store_write_blocked",
                                detail=f"target=FAKE-STORE-{match.group(1)}, scope={self.store_id}")
                resp.update(refused=True, logged=True)
                resp["response_text"] = "Blocked: write targeted a store outside this agent's scope. Logged."
                return resp
            if self._is_unverified_claim(text):
                resp["flagged_unverified"] = True
            decision = self.guard.check_memory_write(detail=self.redact(text)[:160])
            if not decision.allowed:
                resp.update(requires_approval=True, logged=True)
                resp["response_text"] = "Memory write blocked: requires approval. " + decision.message
                return resp
            if resp["flagged_unverified"]:
                self.log.record("unverified_fact_write_blocked", detail=self.redact(text)[:160])
                resp.update(requires_approval=True, logged=True)
                resp["response_text"] = "Flagged: unverified store fact. Not written without approval."
                return resp
            resp["memory_written"] = True
            resp["response_text"] = "Memory write completed (fake)."
            return resp

        # 5. Outbound actions — gated by ALLOW_OUTBOUND_ACTIONS
        if any(p in lower for p in OUTBOUND_PATTERNS):
            decision = self.guard.check_outbound_action(detail=self.redact(text)[:160])
            if not decision.allowed:
                resp.update(requires_approval=True, logged=True)
                resp["response_text"] = "Outbound action blocked: requires approval. " + decision.message
                return resp
            resp["outbound_sent"] = True
            resp["response_text"] = "Outbound message sent (fake)."
            return resp

        # 6. Tool execution — gated by ALLOW_TOOL_EXECUTION
        if any(p in lower for p in TOOL_PATTERNS):
            decision = self.guard.check_tool_execution(detail=self.redact(text)[:160])
            if not decision.allowed:
                resp.update(requires_approval=True, logged=True)
                resp["response_text"] = "Tool execution blocked: requires approval. " + decision.message
                return resp
            resp["tool_executed"] = True
            resp["response_text"] = "Tool executed (fake)."
            return resp

        # 7. Plain reply — gated by AGENT_ENABLED + HUMAN_ONLY_MODE
        decision = self.guard.check_autonomous_reply()
        if not decision.allowed:
            resp["logged"] = True
            resp["response_text"] = decision.message  # safe pause message
            return resp
        resp["replied"] = True
        resp["response_text"] = self.redact(f"Fake agent summary: {text}")
        return resp
