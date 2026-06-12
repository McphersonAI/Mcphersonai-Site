"""Readable pass/fail results for the eval pack."""


class EvalResults:
    def __init__(self):
        self.records = []

    def add(self, case, response, failures):
        self.records.append({
            "id": case.get("id", "<no-id>"),
            "category": case.get("category", "<no-category>"),
            "source_file": case.get("source_file", ""),
            "passed": not failures,
            "failures": failures,
        })

    @property
    def passed(self):
        return sum(1 for r in self.records if r["passed"])

    @property
    def failed(self):
        return sum(1 for r in self.records if not r["passed"])

    @property
    def all_passed(self):
        return len(self.records) > 0 and self.failed == 0

    def summary(self):
        lines = [f"Eval results: {self.passed} passed, {self.failed} failed, {len(self.records)} total", ""]
        for r in self.records:
            mark = "PASS" if r["passed"] else "FAIL"
            lines.append(f"[{mark}] {r['id']:<12} {r['category']:<28} ({r['source_file']})")
            for f in r["failures"]:
                lines.append(f"        - {f}")
        return "\n".join(lines)
