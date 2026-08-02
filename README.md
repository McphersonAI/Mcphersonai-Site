# McPherson AI — mcphersonai.com

Public marketing site for McPherson AI. It uses plain static HTML with no
framework or server-side application code. The authoritative build copies and
validates the public surface before preview or release. Every file committed
here is potentially visible to repository readers, so nothing lands in this
repo unless it is appropriate for that audience.

## Build and local preview

- Node.js 20 or newer is required.
- Run `npm run build` to create the production candidate in `dist/`.
- Run `npm run preview` to serve `dist/` at `http://127.0.0.1:4173`.
- Run `npm run audit` and the route, asset, external-link, and browser audits
  before approving a release candidate.

## Live pages (linked from site navigation)

- `index.html` — home: Accountability for Automated Work
- `governance.html` — McPherson Governance product and OpenClaw release boundary
- `private-beta.html` — v0.6 invite-only shadow-beta application and qualification path
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
host config file). Hosting is managed outside the repo. The production branch
assumption is `main`: pushing `main` may trigger an externally managed
Cloudflare deployment. Any push or merge that could update `main` therefore
requires Blake's explicit approval. Reconfirm the hosting connection before
an approved deployment; do not invent or run a direct Cloudflare command from
this repository.

## Change policy

- Blake approves every change before merge, deploy, or public use.
- Do not commit backup copies, drafts, or dated page versions — git
  history already preserves every prior version of every file.
- Avoid `:` or trailing spaces in filenames; they break `git checkout`
  on Windows.
- Keep copy claims conservative: the site describes proof-of-work and an
  accountability method; it does not certify compliance or guarantee safety.
