# Blake Visual Review Repair Pass

Date: July 27, 2026
Branch: `website/governance-launch`
Baseline commit: `a895cb21bf918e1887e13600d4de5e6e67c3ad1c`
Status: Ready for Blake review; local preview only

## Repairs

### Observa schema destination

- The Observa and Proof cards now link directly to `/observa-audit-mode-schema-v0.1.html`.
- The destination is the existing public-safe HTML artifact `observa-audit-mode-schema-v0.1.html`.
- The production preview returns HTTP 200 with `text/html; charset=utf-8`.
- The page contains the intended “Audit Mode Schema” heading and v0.1 case structure.
- The former extensionless route redirects to the `.html` artifact with HTTP 301.
- Static and rendered-browser audits now assert the exact destination, content type, schema heading, and example case object.

### Dark-section proof link

- A reusable `.section.navy .resource-links a` treatment scopes the repair to links inside navy sections.
- Default color: `#ff9a4d`, with underline and 8.51:1 contrast against `#0a172d`.
- Hover and keyboard-focus color: `#ffc99f`.
- Hover increases underline thickness.
- Keyboard focus retains the global three-pixel `#ffad57` outline and uses the brighter link color.
- Light-background links are unchanged.

### QSR adoption language

Current wording:

> The public QSR skill suite has surpassed 5,000 cumulative downloads. That figure reflects adoption across McPherson AI’s public restaurant-operations tools and is presented as a dated proof point, not a live counter.

- The same 5,000+ status is reflected on the Proof page.
- The white-paper overview preserves the 1,000 and 3,000 dated milestones as historical context, then states that the suite has since surpassed 5,000.
- The proof-link label is now “Read the QSR adoption history,” so the historical destination is not presented as a standalone source for only the newer count.

## Files changed

- `_redirects`
- `observa.html`
- `proof.html`
- `qsr-systems.html`
- `white-paper.html`
- `styles.css`
- `scripts/audit.mjs`
- `scripts/browser-audit.mjs`
- `scripts/build.mjs`
- `scripts/capture-screenshot.mjs`
- `project-docs/governance-launch-build-report.md`
- `project-docs/visual-review-repair-report.md`
- Five review screenshots under `project-docs/screenshots/`

## Verification

- `npm run audit`
  - Production build completed: 26 files and one asset directory
  - Static audit passed: 16 HTML pages and 28 public files
  - Internal links and local assets passed
  - Specific schema link/content assertions passed
  - QSR 5,000+ and stale-current-copy assertions passed
  - Dark-link selector and contrast assertions passed
- `npm run audit:browser -- --debug-port 9223 --base-url http://127.0.0.1:4173`
  - Eight routes passed at 390px and 1440px
  - Schema destination returned the intended HTML artifact
  - QSR computed link color, underline, and keyboard-focus outline passed
  - No horizontal overflow
  - Mobile menu, Escape behavior, and first-Tab skip link passed
- Production preview:
  - `/observa-audit-mode-schema-v0.1.html` → HTTP 200, HTML
  - `/observa-audit-mode-schema-v0.1` → HTTP 301 to the `.html` artifact
  - `/qsr-systems` → HTTP 200

## Screenshots

- `project-docs/screenshots/repair-observa-schema-card-desktop.png`
- `project-docs/screenshots/repair-observa-schema-destination-desktop.png`
- `project-docs/screenshots/repair-qsr-evidence-card-desktop.png`
- `project-docs/screenshots/repair-observa-schema-card-mobile.png`
- `project-docs/screenshots/repair-qsr-evidence-card-mobile.png`

All captures were inspected for clipping, overlap, link visibility, content hierarchy, and mobile card layout.

## Deployment boundary

Nothing was pushed, merged, deployed, or changed in Cloudflare Pages.
