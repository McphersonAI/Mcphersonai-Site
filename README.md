# McPherson AI — mcphersonai.com

Public static HTML website. No framework, CMS, database or application server is
required. Every committed file is public; keep credentials, private documents,
private infrastructure identifiers and unapproved customer material out of this
repository.

## Local build and checks

Node.js 22 or newer is required (the browser audit uses Node's WebSocket client).
`npm run build` produces the explicit public file set in `dist/`.
`npm run preview` serves it at `http://127.0.0.1:4173` and mirrors the checked-in
redirects, security headers and custom 404. Restart preview after changing
`_redirects` or `_headers`, which it reads on startup.

Run every release-candidate check:

```sh
npm run build
npm run test
npm run audit
npm run audit:routes
npm run audit:assets
npm run audit:external
npm run audit:browser
```

The route and asset audits need the local preview. External links need network
access. The browser audit needs an isolated Chromium instance with remote
debugging on port 9223; `--debug-port` and `--base-url` can override the defaults.
Use a temporary browser profile, not a personal browsing session. Optional
`--screenshots /temporary/output/directory` saves review images outside the repo.
Screenshots and downloaded release archives are not website source files.

The static audit checks all pages for navigation, footer, metadata, links and
fragments, redirects, publication boundaries, release identities, form privacy,
headers and asset signatures. The browser audit adds four responsive widths,
contrast, keyboard controls, actual navigation, legacy routing, a no-network
application-preparation flow, clipboard failure, no-JavaScript behavior and
reduced motion. Failed or unavailable checks remain unresolved.

## Current routes

| Route | Role |
| --- | --- |
| `/` | Buyer and product explanation |
| `/founding` | Founding Builder application and commercial qualification |
| `/how-it-works` | Ownership, written criteria and deployment scope |
| `/observa` | Released software and product boundaries |
| `/evidence` | Release identities, benchmark standard and canonical limitations |
| `/trust` | Factual data, authority, credential and operator-control boundaries |
| `/about` | Founder and workflow-first company story |
| `/getting-started` | Technical evaluation and activation |
| `/docs` | Technical documentation index |
| `/observa/cli` | Package-specific command reference |
| `/observa/pairing` | Access and pairing lifecycle |
| `/observa/troubleshooting` | Evidence and configuration troubleshooting |
| `/observa/support` | Support and security-report routing |
| `/contact` | Other inquiries and escalation |
| `/privacy` | Static-site information handling |
| `/terms` | Software, service and commercial scope |
| `/qsr-systems` | QSR origin, outside primary navigation |

Primary navigation: How It Works, Observa, Evidence, Trust, About. The primary
commercial CTA is Apply as a Founding Builder. Getting Started is the separate
technical utility. Every page shares the launch footer: Docs, Getting Started,
Evidence, Support, Contact, Privacy, Terms.

## Historical routes and compatibility

| Old route | Disposition / current destination |
| --- | --- |
| `/`, `/observa`, `/contact` | Retained and updated |
| `/observa/cli`, `/observa/pairing`, `/observa/troubleshooting`, `/observa/support` | Retained and updated as technical utilities |
| `/qsr-systems` | Retained and updated; removed from primary navigation |
| `/white-paper`, `/when-the-agent-acts` | Historical direct-link pages; noindex |
| `/observa-audit-mode-schema-v0.1` | Historical direct-link schema; noindex |
| `/proof`, `/resources`, `/regulated-crm-proof` | Redirected to `/evidence` |
| `/governance` | Redirected to `/observa` |
| `/private-beta`, `/observa/getting-started` | Redirected to `/getting-started` |
| `/services`, `/what-we-build` | Redirected to `/how-it-works` |
| `/pilot` | Redirected to `/founding` |
| `/walkthrough` | Redirected to `/qsr-systems` |
| `/observa/safety` | Redirected to `/trust` |
| `/when-agent-acts` | Redirected to `/when-the-agent-acts` |
| `/404` | Retained custom error page; noindex |

All superseded HTML files remain as static fallback stubs. Their clean, trailing
slash and `.html` URLs redirect directly to the current destination. Prior
fragment IDs remain on the corresponding current pages. Query strings survive
host redirects. The old technical-access campaign on `/contact` goes to
`/getting-started#access`, preserving its query string.

The two legacy video URLs under `assets/video/` redirect to `/observa`; their
poster URLs redirect to the retained governance social image. The retired media
is excluded from the repository and build because it does not meet the current
publication boundary. Original historical PDFs and the legacy social image
remain available. The legacy `/thumbnail.jpg` URL redirects to `/thumbnail.png`,
matching the original image’s actual PNG encoding. No historical HTML address
was deleted.

## Public evidence maintenance

`release-status.js` records public release identities. Update the source HTML and
its static fallbacks together after checking the actual public release and
archive. Never derive a current release claim from old website copy. A package
hash identifies bytes; it does not establish independent audit or safety.

`/evidence#limitations` is the single limitations source. Benchmark families
appear only with an actual publishable result conforming to the standard on that
page. Do not add empty result sections, future dates or a public roadmap.

## Deployment boundary

Hosting is managed outside the repository. The production branch assumption is
`main`: a push there may trigger an externally managed deployment. Any push,
merge or deployment requires Blake's explicit approval. Local builds, previews
and commits do not authorize publication. No hosting or DNS management commands
are part of this workflow.
