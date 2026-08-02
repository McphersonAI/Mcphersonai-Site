# Observa V6 private-beta website audit repair

Date: 2026-08-01

## Candidate identity and scope

- Repair worktree: `/Users/bmcpherson/Documents/mcphersonai-site-observa-v6-repair`
- Branch: `repair/observa-v6-website-audit-20260801`
- Audited starting commit: `6c92f8ed9e635bbdb7737d980c75de8d686b52e9`
- Audited starting tree: `b42abe7c29b755d6cd9a41653e003d31999fa3d5`
- Authoritative base: `fc17bbf34539bb99bc58294706d181d8ce9ebc7f`
- Identity gate: passed before any repair. The path, branch, commit, tree, index, and tracked worktree matched; no unrelated untracked files were present.
- Product boundary: unchanged. The site advertises and collects applications for an invite-only private shadow beta with manual review, no automatic account or connected access, AUTHORITY NONE, ENFORCEMENT OFF, no billing, no governance credits, no automatic mapping activation, and no production-readiness claim. QSR and Services remain public content lanes.

## Findings, root causes, and repairs

### 1. Missing favicon

Root cause: the public root had no `favicon.ico`, no explicit icon declarations, and no build or public-asset coverage for a favicon. A cold browser's conventional `/favicon.ico` request therefore returned 404.

Repair:

- Added a real 256×256 ICO resource at `/favicon.ico` and a scalable `/favicon.svg` companion using McPherson AI navy (`#10213f`) and orange (`#ff9a4d`).
- Added production-relative ICO and SVG icon declarations to all 18 public HTML sources, including compatibility and 404 pages.
- Added both assets to the authoritative build and public-asset audit.
- Added source/build validation for the ICO signature, SVG brand colors, declarations, local targets, content types, response bodies, and direct HTTP status.

Evidence: before, the independently observed cold request returned 404. After repair, the asset audit and every cold-browser page case received a non-empty `image/x-icon` response with HTTP 200. The final fresh Chrome profile recorded zero failed required assets and no favicon 404.

### 2. Dark split-callout eyebrow contrast

Root cause: `.split-callout` inherited the ordinary-page eyebrow foreground `#963b08` over navy `#0a172d`, producing 2.49:1 contrast across seven unique labels.

Repair: split callouts now use the existing light-orange brand color `#ffc99f` for label text and `#ff9a4d` for the decorative rule. The hierarchy, navy background, typography, and orange brand signal remain intact.

Evidence: 2.49:1 before; 12.02:1 after. The browser regression located all seven unique labels and tested their computed foreground/background combination in each of four viewports (28 label/viewport checks) with no failure.

### 3. Form-control contrast and states

Root cause: the control border `#bac5d4` over white was 1.75:1, and placeholder `#707c8f` over white was 4.23:1. The field-specific translucent focus outline also weakened the otherwise visible global focus treatment. Disabled and explicit error states lacked dedicated styling.

Repair:

- Control boundary: `#8391a5` over white, 3.20:1.
- Placeholder: `#657286` over white, 4.88:1, with explicit opacity 1.
- Focus: solid `#c6530d` outline over white, 4.52:1, three pixels wide with a two-pixel offset.
- Explicit error border: `#a3342d` over white, 6.80:1.
- Disabled text: `#58657a` over `#eef1f5`, 5.21:1, plus a 3.20:1 outer boundary, `not-allowed` cursor, and opacity 1.
- Native checkboxes retain the branded orange accent, visible 19×19 geometry, and associated text labels.

Evidence: browser checks covered all seven text/select/textarea controls in two private-beta route variants across four viewports (56 boundary checks), both placeholders in those cases (16 checks), 16 checkbox instances, and eight checks each for focus, disabled, error, primary-button, validation, and no-network form behavior.

### 4. Escape focus defect

Root cause: the document-level handler always ran `closeNav()` and `button.focus()` for Escape, without checking whether the controlled menu was open.

Repair: Escape closes and refocuses only when `nav.dataset.open === "true"`. The existing accessible toggle state and link-close behavior remain in place.

Evidence: at 320, 390, and 768 pixels on both private-beta variants, Escape was exercised while the closed menu had focus in an input, textarea, select, and button (24 closed-menu control checks); focus remained on the original control. Six keyboard-open menu cases then confirmed that Escape closed an actually open menu, returned focus to the toggle, and did not trap subsequent Tab navigation.

### 5. Mailto honesty and fallback

Root cause: successful form preparation set `window.location.href` to a mailto URL while stating that the mail app was opening. A static page cannot confirm that a mail handler exists or opened.

Repair:

- The status now states: “Your application has been prepared for your email app. If it does not open, copy the application below and email it to admin@mcphersonai.com.”
- A visible post-preparation fallback shows `admin@mcphersonai.com`, a read-only complete application, an “Open prepared email” link, and a native keyboard-accessible “Copy application” button.
- The copied text contains To, Subject, every intended application field, the workflow/review goal, the acknowledged boundary, and standard UTM source/medium/campaign/term/content attribution when present.
- Clipboard success and failure are announced through a `role="status"`, polite, atomic live region. If the modern clipboard API fails, a scoped legacy copy attempt runs; if that also fails, the user receives an honest select-and-copy instruction.
- Nothing is sent automatically, no network form action was added, and the mailto remains user-controlled.

Evidence: eight form/viewport cases verified fallback visibility and content, mailto recipient/subject/body, all prepared fields, UTM preservation, keyboard activation, complete clipboard-success data, accessible success status, deterministic clipboard failure, and accessible failure status. No message claims that a mail app opened.

### A. Preview redirect query preservation

Root cause: the preview server constructed `Location` from the destination path only, dropping `requestUrl.search` for `_redirects` rules and generic `.html` canonicalization.

Repair: a single redirect-location helper now carries the original query when the target does not define its own query. It applies to trailing-slash, legacy, and `.html` redirects.

Evidence: the route audit passed 16 query-preservation cases: all eight slash redirects, all six legacy redirects, a primary `.html` canonical redirect, and the schema `.html` canonical redirect. The cold-browser matrix also verified slash and `.html` examples at all four viewports without losing `utm_source` or `ref`.

### B. README build contradiction

Root cause: README said there was no build step even though `package.json` defines `npm run build` as the production-candidate builder.

Repair: README now documents Node.js 20+, `npm run build`, `dist/`, `npm run preview`, the audit family, the `main` production-branch assumption, and that pushing or merging to `main` may trigger externally managed Cloudflare deployment and requires Blake's explicit approval.

Evidence: the committed source audit compares the README with the Node engine/build assumptions and rejects the former “no build step” contradiction.

### C. Static security headers

Disposition:

- Added Content-Security-Policy with self-only defaults, scripts, connections, fonts, forms, images/media, `base-uri 'self'`, `object-src 'none'`, and `frame-ancestors 'none'`.
- Added Permissions-Policy disabling accelerometer, autoplay, camera, geolocation, gyroscope, magnetometer, microphone, payment, and USB.
- Added `Referrer-Policy: strict-origin-when-cross-origin`.
- Added `X-Content-Type-Options: nosniff`.
- Added both CSP `frame-ancestors 'none'` and `X-Frame-Options: DENY` for frame restriction compatibility.
- Script policy does not permit unsafe inline script or broad wildcard sources. `style-src 'unsafe-inline'` is intentionally retained because current public standalone artifacts and a small number of marketing elements contain committed inline CSS; removing it requires a separate style extraction and visual-equivalence change.
- HSTS is intentionally omitted here because TLS termination and production edge policy are externally managed by Cloudflare and were not changed or validated in this repair.

Evidence: the preview server now applies `_headers`, the route audit passed five header checks, and the full browser audit completed with zero CSP/browser-log errors and no broken local asset, mailto fallback, QSR, Services, or PDF destination.

## Verification evidence

Final passing commands and results:

- `npm run build` — built 31 listed files plus one asset directory into a clean `dist/`; final inventory is 33 files.
- `npm test` — 18 HTML pages and 33 public files passed source/output, metadata, link, claim, secret-marker, favicon, contrast, form-state, security-header, and README checks.
- `npm run audit` — authoritative build plus test passed.
- `npm run preview -- --port 43817` — new production-preview process used for route, asset, and browser work.
- `npm run audit:routes -- --base-url http://127.0.0.1:43817` — 9 canonical 200 routes, 8 slash redirects, 6 legacy redirects, 16 query-preserving cases, Cloudflare-compatible `.html` canonicalization, 5 security-header checks, custom 404, and case-mismatch checks passed.
- `npm run audit:assets -- --base-url http://127.0.0.1:43817` — 13 required public assets returned 200 with correct content types and non-empty bodies.
- `npm run audit:browser -- --base-url http://127.0.0.1:43817 --debug-port 9461` — passed 14 routes × 4 viewports (56 page/viewport cases) using a brand-new temporary Chrome profile and unused debug port. Console errors: 0. JavaScript exceptions: 0. Browser-log errors: 0. Failed required assets: 0.
- `npm run audit:external` — 8 distinct public HTTP destinations resolved.
- `npm audit --omit=dev --json` — 0 info, low, moderate, high, critical, or total vulnerabilities.
- `npm ls --all` — dependency tree is empty.
- `git diff --check` — passed.

Browser routes:

- `/`
- `/governance`
- `/private-beta`
- `/observa`
- `/observa-audit-mode-schema-v0.1`
- `/qsr-systems`
- `/services`
- `/proof`
- `/contact`
- tracked `/contact` governance-beta UTM example, redirected to `/private-beta` with query and `#apply`
- tracked `/private-beta` UTM source/medium/campaign/term/content example
- `/governance/` query-preserving slash example
- `/governance.html` query-preserving `.html` example
- deliberate `/this-route-does-not-exist` 404, narrowly classified only for its expected document 404

Viewports: 320×720, 390×844, 768×1024, and 1440×1200.

Accessibility/browser totals include 56 skip-link/focus/order/label/heading/overflow page cases, 28 dark-callout label/viewport contrast checks, 56 form-boundary checks, 16 placeholder checks, 16 checkbox checks, eight complete form-state/fallback/copy-success/copy-failure cases, 24 closed-menu Escape control checks, six keyboard menu-open/Escape/focus-return/no-trap cases, and four QSR dark-link normal/hover/focus sets.

## Production output inspection

The clean `dist/` contains 33 intended files totaling 2,015,232 bytes. It includes both favicon assets, 18 HTML documents, shared CSS/JavaScript, redirects/headers/robots/sitemap files, two 1200×630 PNG social cards, four intended PDF artifacts, and no other directory beyond `assets/papers`.

The output contains no project docs, screenshots, audit reports, local filesystem paths, secret markers, logs, browser profiles, `node_modules`, source maps, environment files, customer data, or personal application data. Both `og-governance.png` and `og-private-beta.png` retain valid PNG signatures and exact 1200×630 dimensions.

QSR and Services were each loaded at all four viewports with no console, JavaScript, asset, overflow, clipping, navigation, heading, or accessibility failure. The QSR evidence classification and 5,000+ dated company-tracked boundary remain intact. Private-beta product claims continue to reject automatic signup, connected access from applying, billing, credits, enforcement, authority, and automatic activation.

## Remaining limitations

- A static site cannot prove that an external mail client exists or opened; the repair makes that limitation explicit and provides retry, copy, and manual selection paths.
- Clipboard access can be denied by browser or user policy; success and failure are both announced, and the complete prepared application remains visible for manual copying.
- External-link results are point-in-time checks of third-party destinations.
- Local preview emulates committed redirect and header behavior, but no Cloudflare configuration, production traffic, deployment, merge, or push was performed.
- HSTS remains an external edge/TLS responsibility, and inline styles remain narrowly allowed until a separately approved style-extraction change.

Next action: a fresh independent website re-audit of the single committed repair candidate.
