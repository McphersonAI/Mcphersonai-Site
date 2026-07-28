# McPherson AI Governance Launch — Local Build Report

Date: July 27, 2026
Status: Ready for Blake review; local preview only
Production deployment: Not performed

## Repository and starting state

- Repository: `/Users/bmcpherson/Documents/Mcphersonai-Site`
- Git remote: `git@github.com:McphersonAI/Mcphersonai-Site.git`
- Starting branch: `main`
- Starting commit: `39e10004c242d5d84799b1c1215f21abdcc4afc4`
- Starting working tree: clean
- Working branch: `website/governance-launch`
- Framework: dependency-free static HTML, CSS, and JavaScript
- Build system added for validation: Node.js scripts invoked through npm
- Existing tests before redesign: none
- Existing deployment configuration before redesign: no Wrangler, Cloudflare Pages, or package build configuration in the repository
- Live hosting evidence: the apex domain returns Cloudflare response headers. The repository's `main` branch is treated as the production publishing branch.
- Excluded plugin repository: `/Users/bmcpherson/Documents/McPherson-AI/v0.5-public-release/publish-ready/mcpherson-governance-openclaw` was not modified.

## Files added

- `.gitignore`
- `_headers`
- `_redirects`
- `governance.html`
- `proof.html`
- `services.html`
- `styles.css`
- `site.js`
- `release-status.js`
- `og-governance.png`
- `robots.txt`
- `sitemap.xml`
- `package.json`
- `package-lock.json`
- `scripts/build.mjs`
- `scripts/audit.mjs`
- `scripts/browser-audit.mjs`
- `scripts/capture-screenshot.mjs`
- `scripts/serve.mjs`
- `project-docs/governance-launch-build-report.md`
- Six required screenshots under `project-docs/screenshots/`

The social-preview image was generated with the built-in ImageGen tool for this redesign and saved as `og-governance.png` at 1200 × 630. The source prompt requested a McPherson AI navy-and-orange editorial product graphic with an abstract evidence path and the exact approved Governance headline.

## Files modified

- `index.html`
- `observa.html`
- `qsr-systems.html`
- `contact.html`
- `what-we-build.html`
- `resources.html`
- `white-paper.html`
- `when-the-agent-acts.html`
- `when-agent-acts.html`
- `observa-audit-mode-schema-v0.1.html`
- `regulated-crm-proof.html`
- `pilot.html`
- `walkthrough.html`

## Routes and navigation

Primary navigation now reads:

1. Home
2. Governance
3. Observa
4. QSR Systems
5. Services
6. Proof
7. Contact

Primary routes:

- `/`
- `/governance`
- `/observa`
- `/qsr-systems`
- `/services`
- `/proof`
- `/contact`

Cloudflare-compatible redirects:

- `/what-we-build` → `/services` (301)
- `/what-we-build.html` → `/services` (301)
- `/resources` → `/proof` (301)
- `/resources.html` → `/proof` (301)
- `/when-agent-acts` and its `.html` form → `/when-the-agent-acts` (301)

Noindex compatibility pages remain for old `.html` URLs so links also degrade safely on static hosts that do not process `_redirects`.

## Content hierarchy changes

- Governance now leads the homepage and has a first-class product page.
- Governance is explained as the OpenClaw plugin, policy service, and Observa reporting/evidence layer.
- Observa is repositioned as the reporting and evidence layer inside McPherson Governance.
- Workflow Services retains the existing offers and published pricing but is no longer the company's primary identity.
- QSR Systems retains the sixteen-year operating story and is connected to the Governance operating principle.
- Proof leads with Governance verification and releases, followed by Observa, QSR, white papers, and regulated case work.
- Contact now offers two explicit paths: Founding Governance Setup and Map a Business Workflow.
- Shared navigation, footer, responsive behavior, focus states, metadata patterns, and release status are standardized.

## Release-status and claims review

`release-status.js` is the obvious update point for:

- current public version and series
- GitHub repository and release URLs
- stable ClawHub listing
- installation recommendation
- broad-install recommendation state
- verified proof numbers
- public CTA mode
- supported and tested OpenClaw versions

Public evidence was rechecked on July 27, 2026:

- GitHub latest release: `v0.5.0`
- GitHub release URL: `https://github.com/McphersonAI/mcpherson-governance-openclaw/releases/tag/v0.5.0`
- Stable ClawHub URL resolves to the current listing, whose metadata identifies version `0.5.0`
- Public plugin documentation requires OpenClaw plugin API `>=2026.6.5` and says it was built and tested against `2026.6.5`

The site therefore:

- describes the public product as a shadow-governance connector, not completed self-service SaaS
- uses the required no-authority and shadow-mode boundaries
- does not claim v0.5.1 is public
- does not recommend broad installation
- does not claim active enforcement, compliance, safety, or complete visibility
- identifies all numerical Governance proof as verified v0.5.0 release evidence
- presents Blake’s confirmed `5,000+` cumulative QSR adoption milestone as a dated proof point, while preserving the earlier 3,000 milestone only as historical context

## Intentionally omitted or constrained content

- Ediz Guney testimonial: omitted because no exact approved quotation was found in repository content or history.
- QSR skill listing links: omitted because no trustworthy specific public URLs were stored in the repository.
- v0.5.1 copy and “Install the Free Plugin” primary CTA: omitted because GitHub and ClawHub still show v0.5.0 and broad clean-install recommendation is not verified.
- Fictional pricing tiers: not added.
- New form backend: not added. The contact paths use structured mailto links plus verified phone/text methods.
- Stock images, fake dashboards, certification badges, and invented product screenshots: not added.

## Build, audit, and accessibility results

Commands:

```sh
npm run audit
npm run preview -- --port 4173
npm run audit:browser -- --debug-port 9223 --base-url http://127.0.0.1:4173
```

Results:

- Production build completed: 26 files and one asset directory emitted to `dist/`
- Static audit passed: 16 HTML pages and 28 public files
- No broken internal links or missing local assets
- No duplicate indexable titles
- Primary metadata, canonical URLs, Open Graph fields, and one H1 per indexable page verified
- Required old-route redirects verified through the local preview
- GitHub repository, GitHub v0.5.0 release, and stable ClawHub destinations verified
- Seven primary routes passed browser checks at 390px and 1440px
- Mobile navigation opens from its control and closes with Escape
- First keyboard Tab reaches a visible skip link
- Visible focus styles and reduced-motion handling are present
- No horizontal overflow at tested mobile or desktop widths
- Core color pairs pass WCAG AA normal-text contrast; the lowest tested pair is white on the orange CTA at 4.52:1
- Contact email, phone, and text links verified
- Rendered output contains none of the prohibited or outdated marketing phrases
- Rendered output contains no local user path, private-key marker, internal audit filename, or production credential

## Screenshots

- `project-docs/screenshots/homepage-desktop.png` — 1440 × 1200
- `project-docs/screenshots/homepage-mobile.png` — 390 × 844
- `project-docs/screenshots/governance-desktop.png` — 1440 × 1200
- `project-docs/screenshots/governance-mobile.png` — 390 × 844
- `project-docs/screenshots/observa-desktop.png` — 1440 × 1200
- `project-docs/screenshots/contact-desktop.png` — 1440 × 1200

All six captures were visually inspected for clipping, overlap, whitespace, legibility, card layout, CTA hierarchy, content density, and header/navigation behavior. No unresolved visual defect remains.

## Local preview

```sh
npm run preview -- --port 4173
```

Preview URL: `http://127.0.0.1:4173`

## Deployment method and exact post-approval command

The site is a static repository-root deployment and the live apex domain is served through Cloudflare. No Cloudflare project identifier or Wrangler configuration exists in the repository, so no direct Cloudflare CLI command should be invented or run.

After Blake approves the local result and the reviewed commit is merged to `main`, the production trigger is:

```sh
git push origin main
```

Nothing was pushed, merged, deployed, or changed in Cloudflare during this work.

## Rollback procedure

If the approved Governance launch commit must be rolled back after deployment:

```sh
git switch main
git revert <governance-launch-commit>
npm run audit
git push origin main
```

This preserves public history and creates a reviewable rollback commit.

## Unresolved external items

- Broad public installation remains in review mode until clean-install verification is complete and a public release supports changing that recommendation.
- The exact Cloudflare Pages project settings are not stored in this repository.
- `https://www.mcphersonai.com` returned a Cloudflare 530 response during discovery; the apex `https://mcphersonai.com` remained live. DNS/hostname repair is outside this local redesign and was not attempted.

## Review readiness

The local Governance launch redesign is ready for Blake review. Production remains unchanged.
