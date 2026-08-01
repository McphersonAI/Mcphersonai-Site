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
const expectedGithubReleaseUrl = "https://github.com/McphersonAI/mcpherson-governance-openclaw/releases/tag/v0.5.1";
for (const [label, value] of [
  ["release version", 'publicVersion: "v0.5.1"'],
  ["numeric release version", 'publicVersionNumber: "0.5.1"'],
  ["public status", 'releaseStatus: "Public and verified"'],
  ["release label", 'releaseLabel: "Public release"'],
  ["primary CTA", 'primaryCtaLabel: "Install the Free Plugin"'],
  ["ClawHub URL", `clawHubListing: "${expectedClawHubUrl}"`],
  ["GitHub release URL", `githubRelease: "${expectedGithubReleaseUrl}"`],
  ["minimum OpenClaw version", 'openClawPluginApiMinimum: "2026.6.5"'],
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
if (renderedText.includes("/releases/tag/v0.5.0") || renderedText.includes("/blob/v0.5.0/")) {
  errors.push("a stale v0.5.0 public release link remains");
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
  "mailto:admin@mcphersonai.com"
]) {
  if (!privateBeta.includes(requiredBoundary)) errors.push(`private beta boundary missing: ${requiredBoundary}`);
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

const siteSource = await readFile(join(outputRoot, "site.js"), "utf8");
for (const funnelRequirement of [
  'utm_campaign") === "governance-v6-shadow-beta"',
  'new URL("/private-beta", window.location.origin)',
  'betaUrl.search = window.location.search',
  'betaUrl.hash = "apply"',
  '"utm_content"'
]) {
  if (!siteSource.includes(funnelRequirement)) errors.push(`skill-funnel preservation missing: ${funnelRequirement}`);
}

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

if (errors.length) {
  console.error(`Audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Audit passed: ${htmlFiles.length} HTML pages and ${files.length} public files; internal links/fragments, `
  + "v0.5.1 release state and CTAs, metadata, canonical/sitemap agreement, redirects, 404 inclusion, QSR evidence classification, "
  + "focus/reduced-motion rules, private paths, secret markers, and prohibited claims are clean."
);
