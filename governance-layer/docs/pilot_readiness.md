# Pilot Readiness

The 21-section checklist (`src/readiness/checklist.py`,
`templates/pilot_readiness_blank.md`) is the final gate. Go-live requires:
every required section present, every section Ready or Approved, and the
final approval block recorded with `approved_by: Blake` and a date.

`is_approved_for_go_live()` enforces this in code; the fake sample at
`data/samples/fake_pilot_readiness_completed.json` shows a passing state.
A single Blocked or In Progress section blocks go-live. There is no
override path by design.
