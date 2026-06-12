"""Private weekly proof record: full detail, internal only."""

REQUIRED_FIELDS = [
    "pilot_name", "store_type", "week_number", "starting_problem",
    "diagnostic_finding", "pilot_scope", "agent_contribution",
    "operator_action", "signal_caught_early", "time_saved_estimate",
    "issue_prevented", "follow_up_completed", "proof_event",
    "operator_feedback", "screenshots_evidence", "what_changed_this_week",
    "next_action", "public_safe_summary", "private_notes",
]

# Fields that must NEVER appear in public output.
PRIVATE_FIELDS = {"private_notes", "screenshots_evidence", "operator_feedback"}


class ProofValidationError(ValueError):
    pass


def validate_record(record):
    missing = [f for f in REQUIRED_FIELDS if f not in record]
    if missing:
        raise ProofValidationError(f"Weekly proof record missing fields: {missing}")
    estimate = str(record["time_saved_estimate"]).lower()
    if estimate and "estimate" not in estimate:
        raise ProofValidationError(
            "time_saved_estimate must be explicitly marked as an estimate "
            "(unverified numbers must say 'estimate').")
    return True
