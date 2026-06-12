"""Sanitized public case study: only public-safe fields ever leave the repo."""
from .weekly_template import REQUIRED_FIELDS, PRIVATE_FIELDS, ProofValidationError

PUBLIC_FIELDS = [f for f in REQUIRED_FIELDS if f not in PRIVATE_FIELDS]


def to_public(record):
    """Strip private fields. Raises if a private field would leak."""
    public = {k: record[k] for k in PUBLIC_FIELDS if k in record}
    leaked = PRIVATE_FIELDS.intersection(public.keys())
    if leaked:
        raise ProofValidationError(f"Private fields leaked into public output: {sorted(leaked)}")
    return public


def validate_public(record):
    present_private = PRIVATE_FIELDS.intersection(record.keys())
    if present_private:
        raise ProofValidationError(
            f"Public case study contains private fields: {sorted(present_private)}")
    return True
