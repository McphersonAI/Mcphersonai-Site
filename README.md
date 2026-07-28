# McPherson AI — mcphersonai.com

Public marketing site for McPherson AI. Plain static HTML — no build step,
no framework, no server-side code. Every file committed here is publicly
visible, so nothing lands in this repo unless it is meant to be public.

## Live pages (linked from site navigation)

- `index.html` — home: Accountability for Automated Work
- `what-we-build.html` — services overview
- `observa.html` — Observa accountability layer + Audit Mode artifacts
- `observa-audit-mode-schema-v0.1.html` — Audit Mode schema (early public draft)
- `when-the-agent-acts.html` — "When the Agent Acts" white paper page
- `white-paper.html` — Agent Infrastructure white paper page
- `resources.html` — resources index
- `regulated-crm-proof.html` — regulated CRM proof-of-work
- `qsr-systems.html` — QSR systems proof lane
- `contact.html` — contact

## Direct-link pages (intentionally not in navigation)

- `pilot.html` — Founder Workflow Pilot offer (shared by direct link)
- `walkthrough.html` — QSR Workflow Map (shared by direct link)
- `when-agent-acts.html` — redirect stub to `when-the-agent-acts.html`;
  keeps the older URL working. Do not delete.

## Assets

- `assets/papers/` — downloadable white paper PDFs
- `observa-audit-mode-dogfood-demo-polished.pdf`, `sample-assessment.pdf`
  — public proof artifacts linked from pages
- `workflow-proof-panel.png`, `thumbnail.jpg` — images

## Deployment

No deployment configuration lives in this repo (no CI workflow, CNAME, or
host config file). Hosting is managed outside the repo; pushing here does
not by itself publish anything.

## Change policy

- Blake approves every change before merge, deploy, or public use.
- Do not commit backup copies, drafts, or dated page versions — git
  history already preserves every prior version of every file.
- Avoid `:` or trailing spaces in filenames; they break `git checkout`
  on Windows.
- Keep copy claims conservative: the site describes proof-of-work and an
  accountability method; it does not certify compliance or guarantee safety.
