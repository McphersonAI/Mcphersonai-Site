import pytest
from src.readiness.checklist import (
    ReadinessChecklist, ChecklistValidationError, REQUIRED_SECTIONS)


def test_required_sections_count():
    assert len(REQUIRED_SECTIONS) == 21


def test_blank_checklist_is_not_go_live():
    checklist = ReadinessChecklist.blank("Fake Pilot")
    assert not checklist.is_approved_for_go_live()
    assert len(checklist.blockers()) == 21


def test_fake_completed_sample_is_go_live():
    checklist = ReadinessChecklist.from_json(
        "data/samples/fake_pilot_readiness_completed.json")
    assert not checklist.missing_sections()
    assert checklist.is_approved_for_go_live()


def test_missing_blake_approval_blocks_go_live():
    checklist = ReadinessChecklist.from_json(
        "data/samples/fake_pilot_readiness_completed.json")
    checklist.approval = {}
    assert not checklist.is_approved_for_go_live()


def test_one_blocked_section_blocks_go_live():
    checklist = ReadinessChecklist.from_json(
        "data/samples/fake_pilot_readiness_completed.json")
    checklist.sections["kill_switches_tested"] = "Blocked"
    assert not checklist.is_approved_for_go_live()


def test_invalid_status_rejected():
    with pytest.raises(ChecklistValidationError):
        ReadinessChecklist("Fake", {"diagnostic_completed": "Done"})
