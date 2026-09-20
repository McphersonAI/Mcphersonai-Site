/*
 * Public release status for McPherson AI's two public Observa packages.
 *
 * Update this file only after the referenced public evidence is live, and
 * keep every claim here to something a reader can independently check.
 *
 * Verified on 2026-09-20 against GitHub:
 *   - annotated tag v0.7.3 -> commit 1237c59a70eb2c81318abc4b29d4724d0ad4d8ea
 *   - the release is marked Latest and is not a prerelease
 *   - the published .tgz.sha256 asset reads
 *     0d8242a07352eedab32904a722d85de6186b289875a1c72c12066cf9b2184a14,
 *     which equals a deterministic local rebuild of the same package
 *   - the v0.7.3 package.json declares openclaw compat ">=2026.8.2" and was
 *     built against OpenClaw 2026.8.2
 *
 * Unlike v0.7.2, the repository default branch `main` is NOT yet at the tagged
 * v0.7.3 commit: it remains at d0fe213c, the v0.7.2 release commit. No page
 * therefore claims that the tag and the default branch point at the same
 * commit. Restore that claim only once `main` actually advances to 1237c59a.
 *
 * Deliberately ABSENT: release-verifier / packaged-test / regression-test
 * counts. The v0.6.2-era counts (42/10/31) describe a superseded release and
 * there is no current authoritative evidence for exact replacements, so the
 * reproducible-build digest above carries the verification claim instead.
 */
window.MCPHERSON_RELEASE_STATUS = Object.freeze({
  publicVersion: "v0.7.3",
  publicVersionNumber: "0.7.3",
  publicSeries: "v0.7.x",
  releaseStatus: "Public and verified",
  releaseLabel: "Public release",
  primaryCtaLabel: "Install the Free Plugin",
  releaseType: "Observa v0.7 SHADOW governance evidence release",
  githubRepository: "https://github.com/McphersonAI/mcpherson-governance-openclaw",
  githubRelease: "https://github.com/McphersonAI/mcpherson-governance-openclaw/releases/tag/v0.7.3",
  clawHubListing: "https://clawhub.ai/plugins/%40mcphersonai%2Fmcpherson-governance-openclaw",
  installationRecommendation: "Available through ClawHub",
  ctaMode: "public-install",
  // v0.7.3 declares openclaw compat ">=2026.8.2" and was built against 2026.8.2.
  openClawPluginApiMinimum: "2026.8.2",
  openClawTestedVersion: "2026.8.2",
  authority: "shadow-only",
  activeEnforcement: false,
  clawHubStatus: "clean",
  // External ClawHub security audit result for the published v0.7.3 package.
  // This is ClawHub's own scanner verdict for this listing, nothing broader.
  clawHubSecurityAudit: "Safe",
  clawHubAuditLabel: "OpenClaw v0.7.3 · ClawHub Security Audit: Safe",
  releaseCheckSummary:
    "The published v0.7.3 archive is reproducible: its GitHub .sha256 asset equals a deterministic rebuild of the same package.",
  sourceCommit: "1237c59a70eb2c81318abc4b29d4724d0ad4d8ea",
  sourceTag: "v0.7.3",

  // Canonical Hosted Observa beta origin. This is the single source of truth
  // for the copy/pasteable onboarding commands on the /observa/* help pages.
  // Change it here; `npm test` fails if any published page disagrees.
  observaHostedBaseUrl: "https://governance-plane-observa.tailb473db.ts.net",

  // The second public package: the Local Node installer CLI, on npm.
  localNodeNpmPackage: "@mcpherson-ai/observa-local-node",
  localNodeVersion: "0.1.6",
  localNodeRegistry: "https://www.npmjs.com/package/@mcpherson-ai/observa-local-node",

  verifiedProof: Object.freeze({
    release: "v0.7.3",
    releaseCommit: "1237c59a",
    archiveSha256: "0d8242a07352eedab32904a722d85de6186b289875a1c72c12066cf9b2184a14",
    reproducibleBuildVerified: true,
    shadowAuthorityBoundaryVerified: true,
    publicPackageAvailable: true,
    publicPackageClean: true,
    localNodeRelease: "0.1.6"
  })
});
