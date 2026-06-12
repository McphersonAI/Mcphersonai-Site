import json
import pytest
from src.proof.weekly_template import (
    validate_record, ProofValidationError, REQUIRED_FIELDS, PRIVATE_FIELDS)
from src.proof.case_study_template import to_public, validate_public, PUBLIC_FIELDS


def _sample():
    return json.loads(open("data/samples/fake_weekly_proof_sample.json").read())


def test_sample_validates():
    assert validate_record(_sample())


def test_missing_field_rejected():
    record = _sample()
    del record["public_safe_summary"]
    with pytest.raises(ProofValidationError):
        validate_record(record)


def test_unmarked_estimate_rejected():
    record = _sample()
    record["time_saved_estimate"] = "2 hours per week"
    with pytest.raises(ProofValidationError):
        validate_record(record)


def test_public_private_boundary():
    public = to_public(_sample())
    for field in PRIVATE_FIELDS:
        assert field not in public
    assert validate_public(public)
    assert "PRIVATE" not in json.dumps(public)


def test_public_fields_exclude_private():
    assert not set(PUBLIC_FIELDS) & PRIVATE_FIELDS
    assert set(PUBLIC_FIELDS) | PRIVATE_FIELDS == set(REQUIRED_FIELDS)


def test_validate_public_catches_leak():
    record = _sample()
    with pytest.raises(ProofValidationError):
        validate_public(record)
