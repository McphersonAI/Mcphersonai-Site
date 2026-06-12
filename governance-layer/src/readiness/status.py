"""Status values for the Pilot Readiness Checklist."""

STATUS_VALUES = ["Not Started", "In Progress", "Ready", "Blocked", "Approved"]


def validate_status(status):
    return status in STATUS_VALUES
