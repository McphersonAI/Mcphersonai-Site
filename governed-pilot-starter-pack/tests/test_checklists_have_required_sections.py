def test_checklists_have_required_sections(root, required_sections):
    missing = []
    for doc, sections in required_sections.items():
        path = root / doc
        assert path.is_file(), f"Missing checklist doc: {doc}"
        text = path.read_text().lower()
        for s in sections:
            if s.lower() not in text:
                missing.append((doc, s))
    assert not missing, f"Missing required sections: {missing}"
