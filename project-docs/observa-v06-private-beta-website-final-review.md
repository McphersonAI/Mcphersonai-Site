# Observa / McPherson Governance v0.6 Website Candidate — Final Review

Date: August 1, 2026
Result at freeze: WEBSITE_CANDIDATE_COMMITTED
Push status: NOT PUSHED
Merge status: NOT MERGED
Deployment status: NOT DEPLOYED

## Repository and immutable target

- Real repository: `/Users/bmcpherson/Documents/Mcphersonai-Site`
- Stable worktree: `/Users/bmcpherson/Documents/mcphersonai-site-observa-v6-beta`
- Branch: `codex/observa-v6-private-beta`
- Authoritative base: `fc17bbf34539bb99bc58294706d181d8ce9ebc7f`
- Base determination: current `main` and `origin/main` both resolve to the authoritative base. `2e92368a3eb9972c439ea0e0e62dc0b5b6a6f78c` is a legitimate older ancestor, not a newer base.
- Final commit reference: `codex/observa-v6-private-beta^{commit}`
- Final tree reference: `codex/observa-v6-private-beta^{tree}`

The exact final commit and tree values are recorded in the freeze response after Git creates the commit. A tracked file cannot contain its own final commit or tree hash because adding either value changes the tree and therefore both hashes.

The original checkout had no tracked edits. Its pre-existing untracked website audit reports and screenshots were not changed, moved, staged, or deleted.

## Recovery sources

- Current public website at the authoritative base commit.
- The prior candidate's local Codex session record, used to recover the exact recorded patches for the page, site integration, styles, scripts, checks, and initial handoff.
- The surviving original social-card generation at `/Users/bmcpherson/.codex/generated_images/019fbf67-0899-7a43-aba0-da9fd9408760/exec-35d97822-6891-414b-830b-a754e3e73a49.png`, restored as an exact 1200 × 630 PNG.
- Fresh screenshots generated from the final local `dist` preview.

No private-beta copy was invented during recovery. Reconstruction used the recovered patches and current website; only the documented, evidence-backed repairs below were added.

## Product and application boundary

The candidate advertises an invite-only application/waitlist only. It preserves:

- v0.6 shadow discovery, non-authoritative AutoMap proposals, Governability Diagnosis, and operator-readable evidence;
- AUTHORITY NONE and ENFORCEMENT OFF;
- no public signup, billing, payments, enforcement credits, automatic mapping activation, or active v0.7 enforcement;
- no claim that applying grants an account or connected dashboard access;
- no blanket OpenClaw compatibility claim;
- no implication that a separate product or security gate authorizes outside users or enforcement;
- no request for secrets, credentials, tokens, raw prompts, message contents, customer records, PHI, payment data, or other sensitive material.

The application uses no backend. It prepares a structured email to `admin@mcphersonai.com` in the visitor's own mail application, sends nothing automatically, and states how submitted application information is used.

## Exact files changed

Content and routes:

- `404.html`
- `contact.html`
- `governance.html`
- `index.html`
- `observa.html`
- `private-beta.html`
- `proof.html`
- `qsr-systems.html`
- `services.html`

Design, behavior, and public asset:

- `styles.css`
- `site.js`
- `og-private-beta.png`

Build, routing, audits, and metadata:

- `README.md`
- `_redirects`
- `sitemap.xml`
- `scripts/audit.mjs`
- `scripts/browser-audit.mjs`
- `scripts/build.mjs`
- `scripts/public-asset-audit.mjs`
- `scripts/route-audit.mjs`

Review records:

- `project-docs/observa-v06-private-beta-website-handoff.md`
- `project-docs/observa-v06-private-beta-website-final-review.md`
- `project-docs/screenshots/observa-v6-beta/private-beta-desktop.png`
- `project-docs/screenshots/observa-v6-beta/private-beta-mobile.png`
- `project-docs/screenshots/observa-v6-beta/private-beta-application-mobile.png`

QSR Systems and Services retain their existing content. Their only changes are the shared Private Beta navigation and footer links.

## Findings and repairs

1. **Recovered candidate was missing from the temporary project mirror.** Recovered the exact prior patches from the durable local session record into a stable Git worktree.
2. **The private-beta social card survived only as the original generated image.** Restored it as `og-private-beta.png`, normalized it to 1200 × 630, visually reviewed it, included it in the build, and added a binary dimension/signature assertion.
3. **Tracked skill links lost per-skill attribution after continuing from `/contact` to the beta page.** Only legacy links carrying the exact `governance-v6-shadow-beta` campaign now transfer to `/private-beta#apply`; all query parameters remain intact and `utm_content` is included in the prepared application email. Ordinary contact traffic is unchanged.
4. **The form described local handling but not post-send use.** Added the narrow statement that McPherson AI uses a sent application only to evaluate beta fit and reply.
5. **Automated visual checks did not explicitly fail on console errors, unlabeled controls, heading jumps, social-card dimensions, or internal `dist` content.** Strengthened the existing audits for each case.
6. **The first strengthened browser check had a nested-template syntax defect.** Reproduced and replaced it with an equivalent safe selector expression.
7. **The new console check initially classified the intentionally tested 404 document as unexpected.** Narrowed the exception to the exact custom-404 URL while retaining failures for every other 404, missing asset, console error, or runtime exception.

No other candidate defect was found. No optional redesign was performed.

## Test commands and final results

- `npm run audit` — PASS; built 29 root files plus one asset directory, then audited 18 HTML pages and 31 public files.
- `npm run audit:routes` — PASS; 9 canonical routes, 8 one-step slash redirects, 6 one-step legacy redirects, schema canonicalization, custom 404, and case-mismatch behavior.
- `npm run audit:assets` — PASS; 11 public assets returned 200 with expected content types and non-empty bodies.
- `npm run audit:external` — PASS; 8 distinct public ClawHub and GitHub destinations resolved.
- `npm run audit:browser -- --debug-port 9223 --base-url http://127.0.0.1:4173` — PASS; 11 routes at 390 px and 1440 px, or 22 responsive page checks.
- `npm audit --omit=dev` — PASS; 0 vulnerabilities.
- `npm ls --all` — PASS; dependency tree is empty.
- `git diff --check` — PASS.
- `sips -g pixelWidth -g pixelHeight -g format og-private-beta.png` — PASS; PNG, 1200 × 630.

## Browser and accessibility results

- Zero unexpected browser console, log, or runtime errors.
- No horizontal overflow or viewport clipping at 390 px or 1440 px.
- Mobile navigation exposes all eight links; Escape closes it and returns focus to the toggle.
- First Tab reaches the visible skip link, which targets `#main`.
- No positive tabindex values, unlabeled controls, or heading-level jumps.
- Core navy/orange/white contrast pairs meet the repository's 4.5:1 audit threshold.
- Private-beta native validation rejects an empty form and invalid email, then accepts a complete synthetic application with required boundary acknowledgement.
- No real email or application submission occurred.
- Tracked skill-funnel navigation preserves source, medium, campaign, and per-skill content values.
- Custom 404 behavior passed; only the exact intentional 404 document response is excluded from the unexpected-console-error rule.

## Production package

- `dist/`: 31 files, approximately 1.9 MB.
- Includes `private-beta.html`, `og-private-beta.png`, shared CSS/JavaScript, redirects, headers, robots, sitemap, approved PDFs, and approved public pages.
- Excludes `project-docs`, screenshots, local absolute paths, Git data, source scripts, tests, package files, environment files, logs, caches, source maps, credentials, and secret signatures.

## Local preview

From the stable worktree:

```text
npm run audit
npm run preview
```

Preview URL: `http://127.0.0.1:4173`
Private-beta URL: `http://127.0.0.1:4173/private-beta`

## Remaining limitations

- Connected dashboard access remains separately gated and is not activated by this website candidate.
- The application depends on the visitor's local mail application; there is no website form backend or delivery guarantee.
- OpenClaw compatibility remains version- and channel-specific and is reviewed during preflight.
- The 5.6k skills figure is not hard-coded into public copy; tracked campaign attribution is preserved instead.
- Cloudflare, production publishing, DNS, merge, and push were not touched.

## Required next action

Blake reviews this committed candidate. A fresh independent session then audits the exact final commit and tree before any merge, push, or deployment decision.
