"""Pilot Readiness Checklist: the final gate before go-live."""
import json
from pathlib import Path

from .status import STATUS_VALUES, validate_status

REQUIRED_SECTIONS = [
    "client_pilot_identity",
    "diagnostic_completed",
    "written_assessment_completed",
    "pilot_scope_approved",
    "risk_tier_assigned",
    "agent_identity_defined",
    "agent_permissions_defined",
    "prompt_version_approved",
    "langfuse_tracing_ready",
    "sqlite_memory_ready",
    "backup_created",
    "restore_tested",
    "kill_switches_tested",
    "human_only_mode_tested",
    "api_cost_expectations_defined",
    "weekly_review_scheduled",
    "secrets_checked",
    "no_real_data_in_github",
    "fake_evals_passed",
    "go_live_acceptance_ready",
    "blake_approval_recorded",
]

GO_LIVE_OK = {"Ready", "Approved"}


class ChecklistValidationError(ValueError):
    pass


class ReadinessChecklist:
    def __init__(self, pilot_name, sections, approval=None):
        self.pilot_name = pilot_name
        self.sections = dict(sections)
        self.approval = approval or {}
        for section, status in self.sections.items():
            if not validate_status(status):
                raise ChecklistValidationError(
                    f"Section {section!r} has invalid status {status!r}; "
                    f"must be one of {STATUS_VALUES}")

    @classmethod
    def from_json(cls, path):
        data = json.loads(Path(path).read_text())
        return cls(data.get("pilot_name", "<unnamed>"), data["sections"], data.get("approval"))

    @classmethod
    def blank(cls, pilot_name="<pilot>"):
        return cls(pilot_name, {s: "Not Started" for s in REQUIRED_SECTIONS})

    def missing_sections(self):
        return [s for s in REQUIRED_SECTIONS if s not in self.sections]

    def blockers(self):
        return [(s, v) for s, v in self.sections.items()
                if s in REQUIRED_SECTIONS and v not in GO_LIVE_OK]

    def approval_recorded(self):
        return (str(self.approval.get("approved_by", "")).strip().lower() == "blake"
                and bool(str(self.approval.get("date", "")).strip()))

    def is_approved_for_go_live(self):
        """Every required section green AND Blake approval recorded with a date."""
        return (not self.missing_sections()
                and not self.blockers()
                and self.approval_recorded())

    def report(self):
        lines = [f"Pilot Readiness — {self.pilot_name}"]
        for s in REQUIRED_SECTIONS:
            lines.append(f"  {s:<34} {self.sections.get(s, 'MISSING')}")
        lines.append(f"  approval recorded: {self.approval_recorded()}")
        lines.append(f"  GO-LIVE APPROVED:  {self.is_approved_for_go_live()}")
        return "\n".join(lines)
