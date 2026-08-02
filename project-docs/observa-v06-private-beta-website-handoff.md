# Observa / McPherson Governance v0.6 Private-Beta Website Handoff

Date: August 1, 2026
Status: READY_FOR_REVIEW
Production deployment: NOT PERFORMED
Connected dashboard beta: NOT ACTIVATED

## Isolation and starting point

- Source repository inspected: `/Users/bmcpherson/Documents/Mcphersonai-Site`
- Starting commit: `fc17bbf34539bb99bc58294706d181d8ce9ebc7f`
- Working branch: `codex/observa-v6-private-beta`
- Durable worktree: `/Users/bmcpherson/Documents/mcphersonai-site-observa-v6-beta`
- The deleted temporary project copy was recovered from its local session record into this durable Git worktree. The source checkout and its pre-existing untracked audit materials remained untouched.
- No commit, push, merge, Cloudflare change, DNS change, or production deployment was made.

## Authoritative claim review

Public copy was checked against:

- [McPherson Governance — Product Status, Gates, and Progress Tracker](https://docs.google.com/document/d/1ex7ZL1FZOUC3tO8wA7f2kmBkgQZ6SN7SWIxuIWtEeY8/edit)
- [McPherson AI Work Log — 2026-08-01](https://docs.google.com/document/d/1x1ileuNK29qsE5eVyFiz_unlHu8sUVzndvt4Np4csBQ/edit)

The website now preserves these boundaries:

- v0.6 includes local shadow discovery, AutoMap proposals, Governability Diagnosis, and operator-readable evidence.
- AutoMap proposals are non-authoritative.
- The product posture is shadow only, authority NONE, and enforcement OFF.
- Applying starts a qualification conversation; it does not create an account or grant dashboard access.
- Connected dashboard access is invite-only, manually approved, and still gated.
- There is no public self-service signup, anonymous connected dashboard, billing, payment flow, enforcement credits, automatic mapping activation, or v0.7 enforcement in this beta.
- OpenClaw is the first supported runtime, with exact-version compatibility and rollback readiness checked during preflight.
- Local account-free shadow use and connected dashboard access are presented as different paths.
- No PHI, healthcare workflow, payment action, destructive action, customer credential custody, or sensitive application material is requested.

## Website changes

- Added `/private-beta` as a first-class route and primary-navigation item.
- Changed the homepage and Governance hero hierarchy so private-beta application is the primary CTA while the current public v0.5.1 plugin remains directly available.
- Added a homepage beta callout and a contact-page beta path without removing QSR Systems, Workflow Services, Observa, Proof, or existing contact offers.
- Added a complete beta landing page covering scope, access phases, safety limits, supported OpenClaw positioning, design-partner fit, the OpenClaw-skill funnel, FAQ, and application form.
- Added a no-backend qualification form that prepares a structured email to Blake in the applicant's own mail app. It stores nothing and sends nothing automatically.
- Added a ClawHub/skills campaign route: `https://mcphersonai.com/private-beta?utm_source=clawhub&utm_medium=skill_readme&utm_campaign=observa_v06_beta`.
- Preserved the existing tracked `/contact` skill links. Visits carrying `utm_campaign=governance-v6-shadow-beta` continue to `/private-beta#apply` with source, medium, campaign, and per-skill content attribution intact; ordinary contact traffic remains on `/contact`.
- Added a dedicated 1200 × 630 private-beta social preview in the established McPherson AI navy/orange palette.
- Added the new route, redirect, sitemap entry, build inclusion, static assertions, route coverage, public-asset coverage, and responsive-browser coverage.

## Deployment setup found

- Dependency-free static HTML, CSS, and JavaScript.
- `npm run build` creates `dist/`.
- No repository-owned Cloudflare, Wrangler, CNAME, CI workflow, or Sites hosting configuration exists.
- The last verified release report says `main` was the externally managed Cloudflare publishing branch and that `git push origin main` triggered the production build.
- The hosting connection must be reconfirmed before an approved release. Do not invent or run a direct Cloudflare command from this repository.

## Verification evidence

- Static build and content audit: PASS — 18 HTML pages and 31 public files.
- Canonical route audit: PASS — 9 routes, 8 slash redirects, 6 legacy redirects, custom 404.
- Public-asset audit: PASS — 11 assets with expected content types and non-empty bodies.
- External-link audit: PASS — 8 distinct ClawHub and GitHub destinations.
- Isolated-browser responsive sweep: PASS — 22 route/viewport checks with zero unexpected browser errors at desktop and mobile widths.
- Mobile navigation: PASS — all 8 links open, Escape closes the menu, and focus returns to the toggle.
- Qualification form: PASS — native failure states reject empty and invalid-email submissions; all required fields accept a complete synthetic application and the boundary acknowledgement is required. No form was submitted.
- Accessibility: PASS — heading order, labels, skip links, keyboard focus, reduced motion, core contrast pairs, and responsive overflow checks passed.
- Private-beta social card: PASS — valid 1200 × 630 PNG, included in `dist`, and referenced by Open Graph and X metadata.
- `git diff --check`: PASS.

Screenshots:

- `project-docs/screenshots/observa-v6-beta/private-beta-desktop.png`
- `project-docs/screenshots/observa-v6-beta/private-beta-mobile.png`
- `project-docs/screenshots/observa-v6-beta/private-beta-application-mobile.png`

## Deployment checklist

1. Blake reviews and approves the public beta copy, qualification questions, email destination, and design-partner language.
2. Confirm the website is being released as an application/waitlist surface only; do not imply connected access is live.
3. Confirm the final independent dashboard-beta re-audit and all connected-access gates separately before inviting a tester into the dashboard.
4. Reconfirm that the repository's `main` branch is still connected to the intended Cloudflare production project and custom domain.
5. From the reviewed commit, rerun the build, static audit, external-link audit, route audit, asset audit, responsive sweep, and `git diff --check`.
6. Confirm `dist/` contains `private-beta.html` and `og-private-beta.png`, but no `project-docs`, local paths, secrets, credentials, or internal reports.
7. Merge the approved branch through the normal review path. Do not publish directly from the review worktree.
8. Trigger the externally managed production build only after approval.
9. Verify `/`, `/governance`, `/private-beta`, `/contact`, `/qsr-systems`, and `/services` at desktop and mobile sizes.
10. Verify `/private-beta/` redirects once to `/private-beta`, the social card returns 200, and the form prepares—without automatically sending—the application email.
11. Confirm QSR Systems and Workflow Services remain present in navigation and render unchanged apart from the added beta link.
12. If production verification fails, revert the release commit, rerun the audit suite, and publish the revert through the same reviewed `main` path.

## Final boundary

The marketing-site update is READY_FOR_REVIEW. The connected product beta remains gated and is not authorized by this website handoff.
