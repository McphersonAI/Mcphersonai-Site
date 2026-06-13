from mcpherson_mcp_registry.models import VALID_ACTION_TYPES, VALID_CATEGORIES


def test_registry_loads(registry):
    assert len(registry) >= 30
    for tool in registry.values():
        assert tool.category in VALID_CATEGORIES
        assert tool.action_type in VALID_ACTION_TYPES
        assert tool.fake_only is True


def test_all_required_categories_present(registry):
    cats = {t.category for t in registry.values()}
    assert cats == {"safe_read", "controlled_write", "approval_required", "always_blocked"}
