/*
 * Public release status for McPherson AI's two public Observa packages.
 *
 * Update this file only after the referenced public evidence is live, and
 * keep every claim here to something a reader can independently check.
 *
 * Verified on 2026-09-19 against GitHub:
 *   - annotated tag v0.7.2 -> commit d0fe213c6b0c50896645a9a7ad7cc162bd758d81
 *   - repository default branch `main` is the same commit
 *   - the release is marked Latest and is not a prerelease
 *   - the published .tgz.sha256 asset reads
 *     1449021c2a27248f203970c0788fce0eb6ea4b687c99a5d99e3f69280765ef48,
 *     which equals a deterministic local rebuild of the same package
 *   - the v0.7.2 package.json declares openclaw compat ">=2026.8.2"
 *
 * Deliberately ABSENT: release-verifier / packaged-test / regression-test
 * counts. The v0.6.2-era counts (42/10/31) describe a superseded release and
 * there is no current authoritative evidence for exact replacements, so the
 * reproducible-build digest above carries the verification claim instead.
 */
window.MCPHERSON_RELEASE_STATUS = Object.freeze({
  publicVersion: "v0.7.2",
  publicVersionNumber: "0.7.2",
  publicSeries: "v0.7.x",
  releaseStatus: "Public and verified",
  releaseLabel: "Public release",
  primaryCtaLabel: "Install the Free Plugin",
  releaseType: "Observa v0.7 SHADOW governance evidence release",
  githubRepository: "https://github.com/McphersonAI/mcpherson-governance-openclaw",
  githubRelease: "https://github.com/McphersonAI/mcpherson-governance-openclaw/releases/tag/v0.7.2",
  clawHubListing: "https://clawhub.ai/plugins/%40mcphersonai%2Fmcpherson-governance-openclaw",
  installationRecommendation: "Available through ClawHub",
  ctaMode: "public-install",
  // v0.7.2 declares openclaw compat ">=2026.8.2" and was built against 2026.8.2.
  openClawPluginApiMinimum: "2026.8.2",
  openClawTestedVersion: "2026.8.2",
  authority: "shadow-only",
  activeEnforcement: false,
  clawHubStatus: "clean",
  releaseCheckSummary:
    "The published v0.7.2 archive is reproducible: its GitHub .sha256 asset equals a deterministic rebuild of the same package.",
  sourceCommit: "d0fe213c6b0c50896645a9a7ad7cc162bd758d81",
  sourceTag: "v0.7.2",

  // Canonical Hosted Observa beta origin. This is the single source of truth
  // for the copy/pasteable onboarding commands on the /observa/* help pages.
  // Change it here; `npm test` fails if any published page disagrees.
  observaHostedBaseUrl: "https://governance-plane-observa.tailb473db.ts.net",

  // The second public package: the Local Node installer CLI, on npm.
  localNodeNpmPackage: "@mcpherson-ai/observa-local-node",
  localNodeVersion: "0.1.6",
  localNodeRegistry: "https://www.npmjs.com/package/@mcpherson-ai/observa-local-node",

  verifiedProof: Object.freeze({
    release: "v0.7.2",
    releaseCommit: "d0fe213c",
    archiveSha256: "1449021c2a27248f203970c0788fce0eb6ea4b687c99a5d99e3f69280765ef48",
    reproducibleBuildVerified: true,
    shadowAuthorityBoundaryVerified: true,
    publicPackageAvailable: true,
    publicPackageClean: true,
    localNodeRelease: "0.1.6"
  })
});
