import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
SRC = REPO_ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from mcpherson_mcp_registry import (  # noqa: E402
    FakeStore, load_approvals, load_mode_policy, load_registry,
)


@pytest.fixture(scope="session")
def registry():
    return load_registry()


@pytest.fixture(scope="session")
def modes():
    return load_mode_policy()


@pytest.fixture(scope="session")
def approvals():
    return load_approvals()


@pytest.fixture()
def store():
    return FakeStore()


@pytest.fixture(scope="session")
def repo_root():
    return REPO_ROOT
