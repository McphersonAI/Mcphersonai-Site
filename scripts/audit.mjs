import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "dist");
const errors = [];

const primaryPages = new Set([
  "index.html",
  "governance.html",
  "private-beta.html",
  "observa.html",
  "qsr-systems.html",
  "services.html",
  "proof.html",
  "contact.html"
]);

const prohibitedPhrases = [
  "It changes nothing your agents do",
  "Installing it can’t break your production workflow",
  "complete visibility",
  "compliance guaranteed",
  "fully enforced",
  "production enforcement",
  "plugin coming soon",
  "coming soon",
  "invite-only",
  "preparing the invite-only",
  "v0.6 private beta",
  "v0.6 shadow beta",
  "Join the design partners",
  "Observa is the McPherson AI accountability layer",
  "zero risk",
  "full control",
  "safe by default",
  "enterprise-ready"
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(fullPath));
    else paths.push(fullPath);
  }
  return paths;
}

function matches(html, expression) {
  return html.match(expression)?.[1]?.trim() || "";
}

function relativeLuminance(hex) {
  const channels = hex.match(/../g).map((channel) => Number.parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function localTarget(fromFile, rawValue) {
  const cleanValue = rawValue.split("#")[0].split("?")[0];
  if (!cleanValue || cleanValue.startsWith("#")) return null;
  if (/^(?:https?:|mailto:|tel:|sms:|data:|javascript:)/i.test(cleanValue)) return null;
  if (cleanValue === "/") return join(outputRoot, "index.html");

  let target = cleanValue.startsWith("/")
    ? join(outputRoot, cleanValue.slice(1))
    : resolve(dirname(fromFile), cleanValue);

  target = normalize(target);
  if (!target.startsWith(outputRoot)) return "__OUTSIDE__";
  return target;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const files = await walk(outputRoot);
const htmlFiles = files.filter((file) => extname(file) === ".html");
const indexableTitles = new Map();
const indexableCanonicals = new Map();
const htmlCache = new Map();

for (const forbiddenOutput of [
  "project-docs",
  "screenshots",
  ".git",
  "scripts",
  "package.json",
  "package-lock.json",
  "node_modules",
  ".env"
]) {
  if (files.some((file) => relative(outputRoot, file).split("/").includes(forbiddenOutput))) {
    errors.push(`forbidden internal output entered dist: ${forbiddenOutput}`);
  }
}

for (const file of htmlFiles) {
  const rel = relative(outputRoot, file);
  const html = await readFile(file, "utf8");
  const noindex = /<meta\s+name=["']robots["'][^>]*noindex/i.test(html);
  const title = matches(html, /<title>([\s\S]*?)<\/title>/i);
  const description = matches(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const h1Count = (html.match(/<h1(?:\s|>)/gi) || []).length;

  if (!title) errors.push(`${rel}: missing title`);
  for (const iconDeclaration of [
    '<link rel="icon" href="/favicon.ico" type="image/x-icon">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">'
  ]) {
    if (!html.includes(iconDeclaration)) errors.push(`${rel}: missing valid root icon declaration ${iconDeclaration}`);
  }
  if (!noindex) {
    if (!description) errors.push(`${rel}: missing meta description`);
    if (!/<link\s+rel=["']canonical["']/i.test(html)) errors.push(`${rel}: missing canonical`);
    if (!/<meta\s+property=["']og:title["']/i.test(html)) errors.push(`${rel}: missing og:title`);
    if (!/<meta\s+property=["']og:description["']/i.test(html)) errors.push(`${rel}: missing og:description`);
    if (!/<meta\s+property=["']og:url["']/i.test(html)) errors.push(`${rel}: missing og:url`);
    if (!/<meta\s+property=["']og:image["']/i.test(html)) errors.push(`${rel}: missing og:image`);
    if (h1Count !== 1) errors.push(`${rel}: expected one H1, found ${h1Count}`);
    if (indexableTitles.has(title)) {
      errors.push(`${rel}: duplicate title also used by ${indexableTitles.get(title)}`);
    } else {
      indexableTitles.set(title, rel);
    }
    const canonical = matches(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    if (!canonical.startsWith("https://mcphersonai.com/")) {
      errors.push(`${rel}: canonical is outside the public origin`);
    } else if (canonical.endsWith(".html")) {
      errors.push(`${rel}: canonical must use the clean extensionless route`);
    } else if (indexableCanonicals.has(canonical)) {
      errors.push(`${rel}: duplicate canonical also used by ${indexableCanonicals.get(canonical)}`);
    } else {
      indexableCanonicals.set(canonical, rel);
    }
  }

  if (primaryPages.has(rel)) {
    const expectedLabels = ["Home", "Governance", "Private Beta", "Observa", "QSR Systems", "Services", "Proof", "Contact"];
    for (const label of expectedLabels) {
      if (!new RegExp(`>${label}<`).test(html)) errors.push(`${rel}: missing primary navigation label ${label}`);
    }
    if (!html.includes("data-nav-toggle")) errors.push(`${rel}: missing responsive navigation toggle`);
    if (!html.includes("skip-link")) errors.push(`${rel}: missing skip link`);
  }

  const attributes = [...html.matchAll(/(?:^|\s)(?:href|src)=["']([^"']+)["']/gi)];
  for (const [, rawValue] of attributes) {
    const target = localTarget(file, rawValue);
    if (!target) continue;
    if (target === "__OUTSIDE__") {
      errors.push(`${rel}: local reference escapes output root: ${rawValue}`);
      continue;
    }
    let resolvedTarget = null;
    for (const candidate of [target, `${target}.html`, join(target, "index.html")]) {
      if (await exists(candidate)) {
        resolvedTarget = candidate;
        break;
      }
    }
    if (!resolvedTarget) {
      errors.push(`${rel}: missing internal target ${rawValue}`);
      continue;
    }
    const fragment = rawValue.includes("#")
      ? decodeURIComponent(rawValue.split("#")[1].split("?")[0])
      : "";
    if (fragment && extname(resolvedTarget) === ".html") {
      let targetHtml = htmlCache.get(resolvedTarget);
      if (!targetHtml) {
        targetHtml = await readFile(resolvedTarget, "utf8");
        htmlCache.set(resolvedTarget, targetHtml);
      }
      const escapedFragment = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`(?:id|name)=["']${escapedFragment}["']`).test(targetHtml)) {
        errors.push(`${rel}: missing internal fragment ${rawValue}`);
      }
    }
  }
}

const completeText = await Promise.all(files.map(async (file) => {
  if ([".html", ".js", ".css", ".xml", ".txt"].includes(extname(file)) || ["_redirects", "_headers"].includes(relative(outputRoot, file))) {
    return readFile(file, "utf8");
  }
  return "";
}));
const renderedText = completeText.join("\n");

for (const phrase of prohibitedPhrases) {
  if (renderedText.toLowerCase().includes(phrase.toLowerCase())) {
    errors.push(`prohibited or outdated phrase found: ${phrase}`);
  }
}

for (const privatePattern of [
  "/Users/",
  "internal-evidence",
  "governance-launch-independent-audit",
  "governance-launch-pre-deployment-repair-report",
  "FINAL_PUBLIC_RELEASE_AUDIT",
  "FINAL_CLEAN_PUBLIC_HISTORY_AUDIT",
  "BEGIN PRIVATE KEY"
]) {
  if (renderedText.includes(privatePattern)) errors.push(`private or internal pattern found: ${privatePattern}`);
}
for (const [label, pattern] of [
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/],
  ["OpenAI-style secret", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["bearer credential", /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/i],
  ["assigned API secret", /\b(?:api[_-]?key|api[_-]?token|client[_-]?secret|password)\s*[:=]\s*["'][^"']{12,}["']/i]
]) {
  if (pattern.test(renderedText)) errors.push(`possible ${label} found in production text output`);
}

const redirects = await readFile(join(outputRoot, "_redirects"), "utf8");
for (const expected of [
  "/governance/ /governance 301",
  "/private-beta/ /private-beta 301",
  "/observa/ /observa 301",
  "/qsr-systems/ /qsr-systems 301",
  "/services/ /services 301",
  "/proof/ /proof 301",
  "/contact/ /contact 301",
  "/observa-audit-mode-schema-v0.1/ /observa-audit-mode-schema-v0.1 301",
  "/what-we-build /services 301",
  "/what-we-build.html /services 301",
  "/resources /proof 301",
  "/resources.html /proof 301",
  "/when-agent-acts /when-the-agent-acts 301",
  "/when-agent-acts.html /when-the-agent-acts 301"
]) {
  if (!redirects.includes(expected)) errors.push(`missing redirect: ${expected}`);
}
if (/^\/observa-audit-mode-schema-v0\.1\s+\/observa-audit-mode-schema-v0\.1\.html(?:\s|$)/m.test(redirects)) {
  errors.push("schema redirect reverses the Cloudflare .html-to-extensionless canonicalization");
}

const redirectRules = redirects
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => {
    const [from, to, status = "302"] = line.split(/\s+/);
    return { from, to, status: Number(status) };
  });
const redirectBySource = new Map(redirectRules.map((rule) => [rule.from, rule]));
for (const rule of redirectRules) {
  if (!Number.isInteger(rule.status) || rule.status < 300 || rule.status > 399) {
    errors.push(`redirect uses a non-redirect status: ${rule.from} ${rule.to} ${rule.status}`);
  }
  const visited = new Set();
  let current = rule.from;
  while (redirectBySource.has(current)) {
    if (visited.has(current)) {
      errors.push(`redirect cycle detected from ${rule.from}`);
      break;
    }
    visited.add(current);
    current = redirectBySource.get(current).to;
  }
}

const statusSource = await readFile(join(outputRoot, "release-status.js"), "utf8");
const expectedClawHubUrl = "https://clawhub.ai/plugins/%40mcphersonai%2Fmcpherson-governance-openclaw";
const expectedGithubReleaseUrl = "https://github.com/McphersonAI/mcpherson-governance-openclaw/releases/tag/v0.7.3";
for (const [label, value] of [
  ["release version", 'publicVersion: "v0.7.3"'],
  ["numeric release version", 'publicVersionNumber: "0.7.3"'],
  ["public status", 'releaseStatus: "Public and verified"'],
  ["release label", 'releaseLabel: "Public release"'],
  ["primary CTA", 'primaryCtaLabel: "Install the Free Plugin"'],
  ["ClawHub URL", `clawHubListing: "${expectedClawHubUrl}"`],
  ["GitHub release URL", `githubRelease: "${expectedGithubReleaseUrl}"`],
  // v0.7.3's own package.json declares openclaw compat ">=2026.8.2".
  ["minimum OpenClaw version", 'openClawPluginApiMinimum: "2026.8.2"'],
  ["tested OpenClaw version", 'openClawTestedVersion: "2026.8.2"'],
  ["release commit", 'sourceCommit: "1237c59a70eb2c81318abc4b29d4724d0ad4d8ea"'],
  ["release tag", 'sourceTag: "v0.7.3"'],
  ["Local Node package", 'localNodeNpmPackage: "@mcpherson-ai/observa-local-node"'],
  ["Local Node version", 'localNodeVersion: "0.1.6"'],
  ["ClawHub security audit", 'clawHubSecurityAudit: "Safe"'],
  ["shadow-only authority", 'authority: "shadow-only"'],
  ["inactive enforcement", "activeEnforcement: false"],
  ["public install CTA mode", 'ctaMode: "public-install"']
]) {
  if (!statusSource.includes(value)) errors.push(`release status has incorrect ${label}`);
}
if (!renderedText.includes("Shadow mode is designed to evaluate policy without actively controlling production actions.")) {
  errors.push("exact shadow-mode authority language is missing");
}
if (!renderedText.includes("It has no authority to block, approve, deny, or rewrite your agents’ actions.")) {
  errors.push("exact shadow-only authority boundary is missing");
}
if (/\bv?0\.5\.0\b/.test(renderedText)) {
  errors.push("a stale v0.5.0 label remains in current public output");
}

// Superseded release identities must not reappear as CURRENT-facing claims.
// A clearly-labelled historical reference (a v0.6.2 deep link, or prose that
// names the v0.6.x line as history) is allowed; an unqualified one is not.
for (const file of htmlFiles) {
  const rel = relative(outputRoot, file);
  const html = htmlCache.get(file) ?? await readFile(file, "utf8");
  for (const [, context] of html.matchAll(/(.{0,120}v0\.6\.\d+.{0,60})/gs)) {
    const historical = /blob\/v0\.6\.\d+\/|\(v0\.6\.\d+\)|Historical|historical|v0\.6\.x line|earlier standalone|were supported by the historical/.test(context);
    if (!historical) errors.push(`${rel}: unqualified current-facing v0.6.x claim: ${context.replace(/\s+/g, " ").trim().slice(0, 90)}`);
  }
}
// v0.7.2 is superseded by v0.7.3. It may remain only as an explicitly
// historical reference (a v0.7.2 deep link, a parenthetical label, or prose
// naming it as the previous release); an unqualified one is current-facing.
for (const file of htmlFiles) {
  const rel = relative(outputRoot, file);
  const html = htmlCache.get(file) ?? await readFile(file, "utf8");
  for (const [, context] of html.matchAll(/(.{0,120}v?0\.7\.2.{0,60})/gs)) {
    const historical = /blob\/v0\.7\.2\/|releases\/tag\/v0\.7\.2|\(v0\.7\.2\)|Historical|historical|previous release|prior release|prior scanner|earlier release|upgrade history|superseded/.test(context);
    if (!historical) errors.push(`${rel}: unqualified current-facing v0.7.2 claim: ${context.replace(/\s+/g, " ").trim().slice(0, 90)}`);
  }
}
// Obsolete verifier / test counts from the v0.6.2 release line.
for (const pattern of [/\b42\s*\/\s*42\b/, /\b10\s*\/\s*10\s*packaged/, /\b31\s*\/\s*31\b/, /42 of 42 release verifiers/]) {
  if (pattern.test(renderedText)) errors.push(`an obsolete v0.6.2-era release count remains: ${pattern}`);
}
if (renderedText.includes("/releases/tag/v0.5.0") || renderedText.includes("/blob/v0.5.0/")) {
  errors.push("a stale v0.5.0 public release link remains");
}
if (/\bv?0\.5\.1\b/.test(renderedText)) {
  errors.push("a stale v0.5.1 label remains in current public output");
}
if (renderedText.includes("/releases/tag/v0.5.1") || renderedText.includes("/blob/v0.5.1/")) {
  errors.push("a stale v0.5.1 public release link remains");
}
if (/\bv?0\.6\.0\b/.test(renderedText) || /\bv?0\.6\.1\b/.test(renderedText)) {
  errors.push("a stale v0.6.0 or v0.6.1 label remains in current public output");
}
for (const page of ["index.html", "governance.html", "proof.html"]) {
  const html = await readFile(join(outputRoot, page), "utf8");
  const hasInstallCta = new RegExp(
    `<a[^>]+data-release-href=["']clawHubListing["'][^>]+data-release-text=["']primaryCtaLabel["'][^>]*>`
  ).test(html);
  if (!hasInstallCta) errors.push(`${page}: missing centralized Install the Free Plugin CTA`);
  if (!html.includes(`href="${expectedClawHubUrl}"`)) errors.push(`${page}: missing ClawHub CTA fallback URL`);
}

const css = await readFile(join(outputRoot, "styles.css"), "utf8");
if (!css.includes(":focus-visible")) errors.push("visible focus style missing");
if (!css.includes("@media (max-width: 760px)")) errors.push("mobile layout breakpoint missing");
if (!css.includes("prefers-reduced-motion")) errors.push("reduced-motion handling missing");
if (!css.includes(".section.navy .resource-links a")) errors.push("reusable dark-section link treatment missing");

const coreColorPairs = [
  ["primary text on white", "18243a", "ffffff"],
  ["secondary text on white", "58657a", "ffffff"],
  ["orange text on white", "963b08", "ffffff"],
  ["white text on orange CTA", "ffffff", "c6530d"],
  ["white text on navy", "ffffff", "0a172d"],
  ["bright orange link on navy", "ff9a4d", "0a172d"]
];
for (const [label, foreground, background] of coreColorPairs) {
  const ratio = contrastRatio(foreground, background);
  if (ratio < 4.5) errors.push(`${label}: ${ratio.toFixed(2)}:1 contrast is below 4.5:1`);
}

for (const [label, foreground, background, minimum] of [
  ["dark-callout eyebrow on navy", "ffc99f", "0a172d", 4.5],
  ["form-control boundary on white", "8391a5", "ffffff", 3],
  ["form placeholder on white", "657286", "ffffff", 4.5],
  ["form focus indicator on white", "c6530d", "ffffff", 3]
]) {
  const ratio = contrastRatio(foreground, background);
  if (ratio < minimum) errors.push(`${label}: ${ratio.toFixed(2)}:1 contrast is below ${minimum}:1`);
}
for (const requiredStyle of [
  ".split-callout .eyebrow",
  "border: 1px solid #8391a5",
  "color: #657286",
  ".field input:disabled",
  'input[aria-invalid="true"]',
  "outline: 3px solid var(--orange)"
]) {
  if (!css.includes(requiredStyle)) errors.push(`repaired contrast/state style missing: ${requiredStyle}`);
}

const contact = await readFile(join(outputRoot, "contact.html"), "utf8");
for (const contactHref of ["mailto:admin@mcphersonai.com", "tel:+16195679869", "sms:+16195679869"]) {
  if (!contact.includes(contactHref)) errors.push(`contact path missing: ${contactHref}`);
}

const privateBeta = await readFile(join(outputRoot, "private-beta.html"), "utf8");
for (const requiredBoundary of [
  "Authority remains <strong>NONE</strong>",
  "Enforcement remains <strong>OFF</strong>",
  "No public self-service signup",
  "No billing, payment flow, plans, or enforcement credits",
  "Applying does not create an account",
  "receives the information only to evaluate beta fit and reply",
  "data-beta-application",
  "https://mcphersonai.com/og-private-beta.png",
  "mailto:admin@mcphersonai.com",
  "data-beta-fallback",
  "data-beta-prepared",
  "data-beta-copy",
  "data-beta-copy-status",
  "Your application has been prepared for your email app",
  "admin@mcphersonai.com"
]) {
  if (!privateBeta.includes(requiredBoundary)) errors.push(`private beta boundary missing: ${requiredBoundary}`);
}

// ---------------------------------------------------------------------------
// Product demo.
//
// The video is a first-class product asset, not decoration: it must be present
// in the build, be real media, be embedded on every page that claims to show
// it, and never autoplay. Each of these is a way it could silently disappear
// from the deployed site, so each is checked.
// ---------------------------------------------------------------------------

const DEMO_VIDEO_SRC = "/assets/video/observa-product-demo.mp4";
const DEMO_POSTER_SRC = "/assets/video/observa-product-demo-poster.jpg";
const demoPages = ["index.html", "observa.html", "private-beta.html"];

for (const page of demoPages) {
  const html = await readFile(join(outputRoot, page), "utf8");
  for (const videoRequirement of [
    `<source src="${DEMO_VIDEO_SRC}" type="video/mp4">`,
    `poster="${DEMO_POSTER_SRC}"`,
    "controls",
    "playsinline",
    'preload="metadata"'
  ]) {
    if (!html.includes(videoRequirement)) errors.push(`${page}: demo video integration missing: ${videoRequirement}`);
  }
  // Never autoplay, and never loop or hide the controls.
  for (const [label, pattern] of [
    ["autoplay", /<video\b[^>]*\bautoplay\b/i],
    ["loop", /<video\b[^>]*\bloop\b/i],
    ["controls removed", /<video\b(?:(?!\bcontrols\b)[^>])*>/i]
  ]) {
    if (pattern.test(html)) errors.push(`${page}: demo video must not be ${label}`);
  }
  // A no-JS / unsupported-codec reader must still be able to reach the file.
  if (!html.includes(`<a href="${DEMO_VIDEO_SRC}">`)) {
    errors.push(`${page}: demo video has no direct download fallback`);
  }
  // The intrinsic size hint must match the real asset, or the browser reserves
  // a landscape box for a portrait video and the page jumps on load.
  if (!/<video\b[^>]*width="1080"/s.test(html) || !/<video\b[^>]*height="1920"/s.test(html)) {
    errors.push(`${page}: demo video intrinsic size hint is not the asset's 1080x1920`);
  }

  // Accessible name and a visible caption tied to the element.
  if (!/<video\b[^>]*aria-label="[^"]{20,}"/.test(html)) {
    errors.push(`${page}: demo video has no descriptive accessible name`);
  }
  if (!/<video\b[^>]*aria-describedby="([^"]+)"/.test(html)) {
    errors.push(`${page}: demo video is not associated with a visible caption`);
  } else {
    const captionId = html.match(/<video\b[^>]*aria-describedby="([^"]+)"/)[1];
    if (!new RegExp(`id="${captionId}"`).test(html)) {
      errors.push(`${page}: demo video aria-describedby points at no element`);
    }
  }
  // The asset carries an audio track, so the page must say so before a reader
  // presses play — and must promise that nothing plays on its own.
  if (!/has sound; nothing plays until you press play/i.test(html)) {
    errors.push(`${page}: demo video does not disclose that it has sound and never self-starts`);
  }
  if (/silent, with on-screen captions/i.test(html)) {
    errors.push(`${page}: demo video is described as silent, but the asset has an audio track`);
  }
  // No third-party social embed may stand in for the original asset.
  for (const [label, pattern] of [
    ["TikTok", /tiktok\.com/i],
    ["YouTube", /youtube\.com|youtu\.be/i],
    ["Vimeo", /vimeo\.com/i],
    ["iframe embed", /<iframe\b/i]
  ]) {
    if (pattern.test(html)) errors.push(`${page}: demo must use the local asset, not a ${label} embed`);
  }
}

// The section is built from two slots so a second demo can be added later
// without restructuring the page. Both slots must exist on the two product
// surfaces, in order.
for (const page of ["index.html", "observa.html"]) {
  const html = await readFile(join(outputRoot, page), "utf8");
  const slots = [...html.matchAll(/data-demo-slot="([a-z-]+)"/g)].map((match) => match[1]);
  if (slots.join(",") !== "product-walkthrough,governance-analysis") {
    errors.push(`${page}: demo slots are ${JSON.stringify(slots)}, expected the walkthrough then Governance Analysis`);
  }
  for (const value of ["WOULD_ALLOW", "WOULD_DENY", "WOULD_REQUIRE_APPROVAL"]) {
    if (!html.includes(value)) errors.push(`${page}: Governance Analysis slot omits ${value}`);
  }
  // Governance Analysis exists today; only its dedicated video is future work.
  if (/Governance Analysis[^<]{0,80}coming soon/i.test(html)) {
    errors.push(`${page}: Governance Analysis must not be described as unavailable`);
  }
  for (const cta of ['href="/private-beta">Explore the beta', 'href="/observa/getting-started">Read the docs']) {
    if (!html.includes(cta)) errors.push(`${page}: demo section is missing CTA: ${cta}`);
  }
  if (!html.includes("SHADOW ONLY &middot; AUTHORITY NONE &middot; ENFORCEMENT OFF")
    && !html.includes("SHADOW ONLY · AUTHORITY NONE · ENFORCEMENT OFF")) {
    errors.push(`${page}: demo section is missing the posture line`);
  }
}

// The media itself must survive the build as real, non-trivial media.
// Derived from the embed constants above, so the file checked on disk is
// always the file the pages actually reference.
const demoVideoPath = join(outputRoot, ...DEMO_VIDEO_SRC.split("/").filter(Boolean));
const demoPosterPath = join(outputRoot, ...DEMO_POSTER_SRC.split("/").filter(Boolean));
if (!await exists(demoVideoPath)) {
  errors.push("demo video asset is missing from dist");
} else {
  const video = await readFile(demoVideoPath);
  if (video.length < 1_000_000) errors.push("demo video asset in dist is unexpectedly small");
  // ISO base media file: an `ftyp` box must start the file.
  if (video.subarray(4, 8).toString("latin1") !== "ftyp") {
    errors.push("demo video asset in dist is not an ISO base media (MP4) file");
  }
  // A playable moov/mdat pair, so a truncated copy cannot pass as present.
  for (const box of ["moov", "mdat"]) {
    if (!video.includes(Buffer.from(box, "latin1"))) {
      errors.push(`demo video asset in dist has no ${box} box`);
    }
  }
  // Both tracks the page promises: an H.264 video track and an audio track.
  if (!video.includes(Buffer.from("avc1", "latin1"))) {
    errors.push("demo video asset in dist has no H.264 video track");
  }
  if (!video.includes(Buffer.from("mp4a", "latin1"))) {
    errors.push("demo video asset in dist has no audio track, but the page says it has sound");
  }
}
if (!await exists(demoPosterPath)) {
  errors.push("demo video poster is missing from dist");
} else {
  const poster = await readFile(demoPosterPath);
  if (poster.subarray(0, 2).toString("hex") !== "ffd8") {
    errors.push("demo video poster is not a valid JPEG");
  }
  if (poster.length < 20_000) errors.push("demo video poster in dist is unexpectedly small");
  // Portrait poster, matching the 9:16 source. Read the JPEG SOF dimensions.
  let offset = 2;
  let posterWidth = 0;
  let posterHeight = 0;
  while (offset < poster.length - 9) {
    if (poster[offset] !== 0xff) { offset += 1; continue; }
    const marker = poster[offset + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      posterHeight = poster.readUInt16BE(offset + 5);
      posterWidth = poster.readUInt16BE(offset + 7);
      break;
    }
    offset += 2 + poster.readUInt16BE(offset + 2);
  }
  if (!posterWidth || !posterHeight) {
    errors.push("demo video poster dimensions could not be read");
  } else if (posterWidth >= posterHeight) {
    errors.push(`demo video poster is ${posterWidth}x${posterHeight}; the source is portrait 9:16`);
  }
}

const privateBetaCard = await readFile(join(outputRoot, "og-private-beta.png"));
if (privateBetaCard.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
  errors.push("private beta social card is not a valid PNG");
} else {
  const cardWidth = privateBetaCard.readUInt32BE(16);
  const cardHeight = privateBetaCard.readUInt32BE(20);
  if (cardWidth !== 1200 || cardHeight !== 630) {
    errors.push(`private beta social card is ${cardWidth}x${cardHeight}; expected 1200x630`);
  }
}

const favicon = await readFile(join(outputRoot, "favicon.ico"));
if (favicon.length < 16 || favicon.subarray(0, 4).toString("hex") !== "00000100") {
  errors.push("root favicon.ico is missing or is not a valid ICO resource");
}
const faviconSvg = await readFile(join(outputRoot, "favicon.svg"), "utf8");
if (!faviconSvg.includes("#10213f") || !faviconSvg.includes("#ff9a4d")) {
  errors.push("favicon.svg does not preserve the McPherson AI navy/orange brand colors");
}

const siteSource = await readFile(join(outputRoot, "site.js"), "utf8");
for (const funnelRequirement of [
  'utm_campaign") === "governance-v6-shadow-beta"',
  'new URL("/private-beta", window.location.origin)',
  'betaUrl.search = window.location.search',
  'betaUrl.hash = "apply"',
  '"utm_content"',
  '"utm_term"',
  'event.key === "Escape" && nav.dataset.open === "true"',
  "navigator.clipboard.writeText(preparedText)",
  'document.execCommand("copy")',
  "Application copied. Email it to admin@mcphersonai.com.",
  "Copy failed. Select the prepared application"
]) {
  if (!siteSource.includes(funnelRequirement)) errors.push(`skill-funnel preservation missing: ${funnelRequirement}`);
}

if (siteSource.includes("Your mail app is opening") || siteSource.includes("mail app opened")) {
  errors.push("application experience still claims that an external mail handler opened");
}

const headers = await readFile(join(outputRoot, "_headers"), "utf8");
for (const headerRequirement of [
  "Content-Security-Policy: default-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "Permissions-Policy:",
  "Referrer-Policy: strict-origin-when-cross-origin",
  "X-Content-Type-Options: nosniff",
  "X-Frame-Options: DENY"
]) {
  if (!headers.includes(headerRequirement)) errors.push(`security header disposition missing: ${headerRequirement}`);
}
if (/script-src[^;\n]*'unsafe-inline'/.test(headers) || /default-src[^;\n]*\*/.test(headers)) {
  errors.push("security headers contain an unsafe broad script/default source allowance");
}

const readme = await readFile(join(projectRoot, "README.md"), "utf8");
const packageJson = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
for (const documentationRequirement of [
  `Node.js ${packageJson.engines.node.replace(">=", "")} or newer`,
  "`npm run build`",
  "`dist/`",
  "`npm run preview`",
  "The production branch",
  "assumption is `main`",
  "may trigger an externally managed",
  "requires Blake's explicit approval"
]) {
  if (!readme.includes(documentationRequirement)) {
    errors.push(`README build/deployment documentation missing: ${documentationRequirement}`);
  }
}
if (/no build step/i.test(readme)) errors.push("README still contradicts the authoritative build command");

const observa = await readFile(join(outputRoot, "observa.html"), "utf8");
const proof = await readFile(join(outputRoot, "proof.html"), "utf8");
const qsr = await readFile(join(outputRoot, "qsr-systems.html"), "utf8");
const whitePaper = await readFile(join(outputRoot, "white-paper.html"), "utf8");
const schema = await readFile(join(outputRoot, "observa-audit-mode-schema-v0.1.html"), "utf8");
const notFound = await readFile(join(outputRoot, "404.html"), "utf8");
const sitemap = await readFile(join(outputRoot, "sitemap.xml"), "utf8");
const schemaHref = 'href="/observa-audit-mode-schema-v0.1"';
const schemaCanonical = matches(schema, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
const expectedSchemaCanonical = "https://mcphersonai.com/observa-audit-mode-schema-v0.1";

if (!observa.includes(schemaHref)) errors.push("Observa schema card does not use the extensionless destination");
if (!proof.includes(schemaHref)) errors.push("Proof schema card does not use the extensionless destination");
if (observa.includes('href="/observa-audit-mode-schema-v0.1.html"') || proof.includes('href="/observa-audit-mode-schema-v0.1.html"')) {
  errors.push("an Observa or Proof schema link still uses the .html URL");
}
if (schemaCanonical !== expectedSchemaCanonical) {
  errors.push(`schema canonical is not extensionless: ${schemaCanonical || "missing"}`);
}
if (!sitemap.includes(`<loc>${expectedSchemaCanonical}</loc>`)) {
  errors.push("sitemap and schema canonical do not agree on the extensionless URL");
}
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (new Set(sitemapLocations).size !== sitemapLocations.length) errors.push("sitemap contains duplicate URLs");
for (const canonical of indexableCanonicals.keys()) {
  if (!sitemapLocations.includes(canonical)) errors.push(`sitemap is missing indexable canonical ${canonical}`);
}
for (const location of sitemapLocations) {
  if (!indexableCanonicals.has(location)) errors.push(`sitemap URL has no indexable canonical page: ${location}`);
}
if (!schema.includes("<h1>Audit Mode Schema</h1>") || !schema.includes('"case_id": "OBS-DEMO-2026-001"')) {
  errors.push("Observa schema destination is missing its intended schema content");
}
if (!schema.includes(":focus-visible")) errors.push("standalone schema page lacks explicit focus-visible styling");
if (!schema.includes("prefers-reduced-motion")) errors.push("standalone schema page lacks reduced-motion handling");
if (!schema.includes('class="skip-link"')) errors.push("standalone schema page lacks a keyboard skip link");

if (!notFound.includes("<h1>Page not found.</h1>")) errors.push("404 page is missing its clear Page not found message");
if (!/<meta\s+name=["']robots["']\s+content=["']noindex,\s*follow["']/i.test(notFound)) {
  errors.push("404 page must declare noindex, follow");
}
for (const href of ['href="/"', 'href="/governance"', 'href="/contact"']) {
  if (!notFound.includes(href)) errors.push(`404 page is missing required destination ${href}`);
}
if (!notFound.includes('class="skip-link"') || !notFound.includes("data-nav-toggle")) {
  errors.push("404 page is missing shared keyboard navigation affordances");
}
if (sitemap.includes("/404") || sitemap.includes("404.html")) errors.push("404 page must not appear in the sitemap");

const companyTrackedClaim = "Based on McPherson AI’s cumulative ClawHub download tracking, the public QSR skill suite surpassed 5,000 cumulative downloads as of July 2026.";
const evidenceBoundary = "dated company-tracked milestone, not a live counter";
if (!qsr.includes(companyTrackedClaim) || !qsr.includes(evidenceBoundary) || !qsr.includes("count of unique users")) {
  errors.push("QSR page is missing the dated, company-tracked 5,000+ evidence boundary");
}
if (!proof.includes("<h3>5,000+ cumulative downloads</h3>")) {
  errors.push("Proof page is missing the confirmed 5,000+ adoption claim");
}
if (!proof.includes(companyTrackedClaim) || !proof.includes(evidenceBoundary) || !proof.includes("count of unique users")) {
  errors.push("Proof page is missing the dated, company-tracked 5,000+ evidence boundary");
}
if (!whitePaper.includes(companyTrackedClaim) || !whitePaper.includes(evidenceBoundary) || !whitePaper.includes("do not independently prove the later total")) {
  errors.push("QSR adoption history does not distinguish the company-tracked current milestone from historical proof");
}
if (!whitePaper.includes("1,000 cumulative downloads on April 27, 2026") || !whitePaper.includes("3,000 cumulative downloads on June 4, 2026")) {
  errors.push("historical QSR milestones are not visibly dated");
}
if (/Documented adoption signal|documented proof/i.test(`${qsr}\n${proof}\n${whitePaper}`)) {
  errors.push("QSR claim uses an independent-proof label that the public destination cannot substantiate");
}
if (/latest dated proof states[^<]*3,000|<h3>3,000 cumulative downloads<\/h3>/i.test(`${qsr}\n${proof}`)) {
  errors.push("current-facing 3,000-download claim remains");
}

// ---------------------------------------------------------------------------
// Observa public help resources (/observa/*).
//
// These pages document a shipped CLI, so they are audited against facts rather
// than taste: the canonical Hosted origin has exactly one definition, the
// primary onboarding commands are literally copy/pasteable, the shadow-only
// posture is restated on every page, and no superseded version, package name
// or command spelling is allowed back in.
// ---------------------------------------------------------------------------

const observaHelpSlugs = [
  "getting-started", "cli", "pairing", "troubleshooting", "safety", "support"
];

// ONE definition of the Hosted origin, read out of the published status module.
const hostedBaseUrl = statusSource
  .match(/observaHostedBaseUrl:\s*"([^"]+)"/)?.[1] ?? "";
if (!/^https:\/\/[A-Za-z0-9.-]+$/.test(hostedBaseUrl)) {
  errors.push("release-status.js does not define a single https observaHostedBaseUrl");
}

const observaHelpPages = new Map();
for (const slug of observaHelpSlugs) {
  const file = join(outputRoot, "observa", `${slug}.html`);
  if (!await exists(file)) {
    errors.push(`Observa help page is missing from the build: observa/${slug}.html`);
    continue;
  }
  observaHelpPages.set(slug, await readFile(file, "utf8"));
}

for (const [slug, html] of observaHelpPages) {
  const canonical = matches(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (canonical !== `https://mcphersonai.com/observa/${slug}`) {
    errors.push(`observa/${slug}.html: canonical is not the exact help-resource URL`);
  }
  // The posture must be restated on every page, not only on the safety page.
  for (const token of ["SHADOW_ONLY", "AUTHORITY NONE", "ENFORCEMENT OFF"]) {
    if (!html.includes(token)) errors.push(`observa/${slug}.html: missing posture token ${token}`);
  }
  // Every help page reaches every other one.
  for (const other of observaHelpSlugs) {
    if (other === slug) continue;
    if (!html.includes(`href="/observa/${other}"`)) {
      errors.push(`observa/${slug}.html: no link to /observa/${other}`);
    }
  }
  // Only ONE Hosted origin may appear anywhere in a help page.
  for (const [, host] of html.matchAll(/https:\/\/([A-Za-z0-9.-]*\.ts\.net)/g)) {
    if (`https://${host}` !== hostedBaseUrl) {
      errors.push(`observa/${slug}.html: Hosted origin ${host} disagrees with observaHostedBaseUrl`);
    }
  }
  // Superseded identities must not reappear in current public help.
  for (const [label, pattern] of [
    ["superseded Local Node version", /observa-local-node@0\.1\.[0-5]\b|Local Node[^<]{0,24}0\.1\.[0-5]\b/],
    ["never-published internal package name", /@mcphersonai\/observa-cli/],
    ["superseded OpenClaw connector version", /\b0\.(?:6\.\d+|7\.[01])(?:-beta\.\d+)?\b/],
    ["enforcement described as on", /enforcement\s+(?:is\s+)?(?:on|enabled|active)\b/i],
    ["active enforcement claim", /\bactive enforcement\b|\bENFORCEMENT ON\b|\bAUTHORITY (?:FULL|SOME)\b/i],
    // Only an AFFIRMATIVE claim at the start of a sentence or block counts.
    // "It does not mean Observa blocked anything" must stay legal.
    ["claim that Observa blocked something",
      /(?:^|[.!?]\s+|<p[^>]*>|<li[^>]*>|<strong>)\s*Observa (?:blocks|blocked|prevents|prevented|denies|denied)\b/],
    ["runtime success sold as business success", /completion (?:proves|means) (?:the )?(?:business )?(?:outcome|success)/i]
  ]) {
    if (pattern.test(html)) errors.push(`observa/${slug}.html: ${label}`);
  }
}

for (const [slug, html] of observaHelpPages) {
  if (!html.includes("WOULD_DENY")) continue;
  if (!/does not mean|do not mean|does <em>not<\/em> mean|not <em>mean<\/em>|counterfactual/i.test(html)) {
    errors.push(`observa/${slug}.html: uses WOULD_DENY without disclaiming that nothing was blocked`);
  }
}

// The two commands a new user must be able to paste without editing anything.
const gettingStarted = observaHelpPages.get("getting-started") ?? "";
for (const command of [
  `observa request-access --api-url ${hostedBaseUrl}`,
  `observa pair --base-url ${hostedBaseUrl} --code-stdin`,
  "npm install -g @mcpherson-ai/observa-local-node",
  "observa inspect-workflow --file ./workflow.json",
  "observa n8n-setup"
]) {
  if (!gettingStarted.includes(command)) {
    errors.push(`observa/getting-started.html: missing copy/pasteable command: ${command}`);
  }
}
if (/observa (?:request-access|pair)[^<\n]*&lt;HOSTED_BASE_URL&gt;/.test(gettingStarted)) {
  errors.push("observa/getting-started.html: the onboarding path still asks users to substitute a placeholder");
}

// Flag spellings differ between the two shipped CLIs; the reference must not blur them.
const cliPage = observaHelpPages.get("cli") ?? "";
for (const [label, needle] of [
  ["Local Node pair flag", "observa pair --base-url &lt;https://host&gt; (--code-stdin | --code-file &lt;0600-file&gt;)"],
  ["request-access flag", "observa request-access --api-url &lt;https://host&gt;"],
  ["OpenClaw pair flag", "observa pair --api-url &lt;https://host&gt; [--code-file &lt;owner-only-file&gt;]"],
  ["OpenClaw replace-existing", "--replace-existing"]
]) {
  if (!cliPage.includes(needle)) errors.push(`observa/cli.html: missing ${label}`);
}
if (/observa pair --base-url[^<\n]*--replace-existing/.test(cliPage)
  || /observa pair --base-url[^<\n]*--api-url/.test(cliPage)) {
  errors.push("observa/cli.html: Local Node and OpenClaw pairing flags are mixed on one command line");
}

// The counterfactual vocabulary must be present AND explicitly disclaimed.
const safetyPage = observaHelpPages.get("safety") ?? "";
for (const value of ["WOULD_ALLOW", "WOULD_DENY", "WOULD_REQUIRE_APPROVAL", "ABSTAIN", "INDETERMINATE"]) {
  if (!safetyPage.includes(value)) errors.push(`observa/safety.html: missing SHADOW value ${value}`);
}
for (const claim of ["UNMAPPED", "UNEVALUATED", "OBSERVED", "AUTHORIZED"]) {
  if (!safetyPage.includes(claim)) errors.push(`observa/safety.html: missing boundary term ${claim}`);
}
if (!safetyPage.includes("inspect-workflow")
  || !/does <strong>not<\/strong>/.test(safetyPage)) {
  errors.push("observa/safety.html: the inspect-workflow non-claims are not stated");
}

// Support routes, and the never-post list, must both be explicit.
const supportPage = observaHelpPages.get("support") ?? "";
for (const route of [
  "https://github.com/McphersonAI/mcpherson-governance-openclaw/issues",
  "mailto:admin@mcphersonai.com",
  "https://mcphersonai.com/"
]) {
  if (!supportPage.includes(route)) errors.push(`observa/support.html: missing support route ${route}`);
}
for (const forbidden of ["Pairing codes", "API keys", "Access tokens", "runtime payloads"]) {
  if (!supportPage.includes(forbidden)) {
    errors.push(`observa/support.html: the do-not-send list omits ${forbidden}`);
  }
}

// The product page has to lead somewhere.
const observaPage = await readFile(join(outputRoot, "observa.html"), "utf8");
if (!observaPage.includes('href="/observa/getting-started"')) {
  errors.push("observa.html: no Docs and help entry point");
}

// ---------------------------------------------------------------------------
// Current product copy and onboarding.
//
// The site must surface what the product actually does today, and must not
// imply authority it does not have. These are the overclaims that matter.
// ---------------------------------------------------------------------------

const productSurfaces = ["index.html", "observa.html", "private-beta.html", "governance.html", "proof.html"];
for (const page of productSurfaces) {
  const html = await readFile(join(outputRoot, page), "utf8");
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  for (const [label, pattern] of [
    ["active enforcement", /\b(active enforcement|enforcement is (on|enabled|active)|ENFORCEMENT ON)\b/gi],
    ["automatic mapping of everything", /\b(automatically maps|maps every|all (tools|actions) are mapped|automatic mapping is (on|enabled))\b/gi],
    ["a decision for every action", /\bevery (runtime )?action (receives|gets) a (governance )?decision\b/gi],
    ["completion sold as verified", /\b(completed means verified|completion (proves|means) (the )?(business )?(outcome|success)|runtime success proves)\b/gi],
    ["observed sold as authorized", /\bobserved (means|equals|implies) authoriz/gi],
    ["blocking claim", /\bObserva (blocks|blocked|prevents|prevented|denies|denied|stops|stopped) (the|your|an|any|agent)/gi]
  ]) {
    for (const match of text.matchAll(pattern)) {
      // Only an AFFIRMATIVE claim counts. The site is expected to state each
      // of these as something it does NOT do, so a negated or disclaimed
      // occurrence is the correct copy, not a defect.
      const before = text.slice(Math.max(0, match.index - 90), match.index);
      const after = text.slice(match.index + match[0].length, match.index + match[0].length + 40);
      const negated = /\b(not|never|no|without|neither|nor|cannot|can't|does not|do not|remains? (false|off))\b[^.]*$/i.test(before)
        || /^\s*(remains?|is|stays?)\s+(false|off|none|inactive)\b/i.test(after);
      if (!negated) {
        errors.push(`${page}: overclaim (${label}): …${text.slice(Math.max(0, match.index - 60), match.index + match[0].length + 40).trim()}…`);
      }
    }
  }
}

// The current capability surface, named where a reader will look for it.
const observaProduct = await readFile(join(outputRoot, "observa.html"), "utf8");
for (const capability of ["WOULD_ALLOW", "WOULD_DENY", "WOULD_REQUIRE_APPROVAL", "Governance Analysis", "SHADOW"]) {
  if (!observaProduct.includes(capability)) errors.push(`observa.html: current capability not surfaced: ${capability}`);
}

// Onboarding: the obsolete founder-only framing is gone, and the real
// self-service-request / human-review path is shown with runnable commands.
const betaPage = await readFile(join(outputRoot, "private-beta.html"), "utf8");
for (const obsolete of [
  "There is no public self-service signup",
  "Applying starts a direct conversation with Blake"
]) {
  if (betaPage.includes(obsolete)) errors.push(`private-beta.html: obsolete onboarding framing remains: ${obsolete}`);
}
for (const required of [
  "Self-service request. Human-reviewed access.",
  "npm install -g @mcpherson-ai/observa-local-node",
  `observa request-access --api-url ${hostedBaseUrl}`,
  "observa request-status",
  "Email verification",
  "Human approval",
  "Pairing",
  "Runtime observation"
]) {
  if (!betaPage.includes(required)) errors.push(`private-beta.html: onboarding path is missing: ${required}`);
}
// Founder-assisted help must still be offered, not removed.
if (!/founder-assisted/i.test(betaPage)) {
  errors.push("private-beta.html: founder-assisted support is no longer offered anywhere");
}
// The homepage funnel shows the same real first command.
const homePage = await readFile(join(outputRoot, "index.html"), "utf8");
for (const required of [
  "npm install -g @mcpherson-ai/observa-local-node",
  `observa request-access --api-url ${hostedBaseUrl}`
]) {
  if (!homePage.includes(required)) errors.push(`index.html: onboarding command missing: ${required}`);
}

// No engagement or popularity claim may attach to the demo.
for (const page of demoPages) {
  const html = await readFile(join(outputRoot, page), "utf8");
  for (const [label, pattern] of [
    ["view/like counts", /\b\d[\d,.]*\s*(views|likes|plays|shares|followers)\b/i],
    ["viral framing", /\b(went viral|viral|trending|most[- ]watched|popular on)\b/i]
  ]) {
    if (pattern.test(html)) errors.push(`${page}: demo carries an engagement claim (${label})`);
  }
}

if (errors.length) {
  console.error(`Audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Audit passed: ${htmlFiles.length} HTML pages and ${files.length} public files; internal links/fragments, `
  + "v0.7.3 release state and CTAs, demo video integration, metadata, canonical/sitemap agreement, redirects, 404 inclusion, QSR evidence classification, "
  + "focus/reduced-motion rules, private paths, secret markers, and prohibited claims are clean; "
  + `Observa help: ${observaHelpSlugs.length} pages, one Hosted origin (${hostedBaseUrl}), pasteable onboarding commands, posture tokens and CLI flag spellings verified; `
  + `product demo: local asset on ${demoPages.length} pages, two demo slots, no autoplay/embed/engagement claim, real MP4 and poster in dist.`
);
