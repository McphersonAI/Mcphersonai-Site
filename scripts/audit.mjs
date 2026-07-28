import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "dist");
const errors = [];

const primaryPages = new Set([
  "index.html",
  "governance.html",
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
  }

  if (primaryPages.has(rel)) {
    const expectedLabels = ["Home", "Governance", "Observa", "QSR Systems", "Services", "Proof", "Contact"];
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
    if (await exists(target)) continue;
    if (await exists(`${target}.html`) || await exists(join(target, "index.html"))) continue;
    errors.push(`${rel}: missing internal target ${rawValue}`);
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

for (const privatePattern of ["/Users/", "internal-evidence", "FINAL_PUBLIC_RELEASE_AUDIT", "FINAL_CLEAN_PUBLIC_HISTORY_AUDIT", "BEGIN PRIVATE KEY"]) {
  if (renderedText.includes(privatePattern)) errors.push(`private or internal pattern found: ${privatePattern}`);
}

const redirects = await readFile(join(outputRoot, "_redirects"), "utf8");
for (const expected of [
  "/what-we-build /services 301",
  "/what-we-build.html /services 301",
  "/resources /proof 301",
  "/resources.html /proof 301"
]) {
  if (!redirects.includes(expected)) errors.push(`missing redirect: ${expected}`);
}

const statusSource = await readFile(join(outputRoot, "release-status.js"), "utf8");
if (!statusSource.includes('publicVersion: "v0.5.0"')) errors.push("release status is not pinned to verified public v0.5.0");
if (!statusSource.includes("broadInstallationRecommended: false")) errors.push("broad installation recommendation must remain false");
if (!statusSource.includes('ctaMode: "founding-setup"')) errors.push("CTA mode must remain founding-setup");

const css = await readFile(join(outputRoot, "styles.css"), "utf8");
if (!css.includes(":focus-visible")) errors.push("visible focus style missing");
if (!css.includes("@media (max-width: 760px)")) errors.push("mobile layout breakpoint missing");
if (!css.includes("prefers-reduced-motion")) errors.push("reduced-motion handling missing");

const coreColorPairs = [
  ["primary text on white", "18243a", "ffffff"],
  ["secondary text on white", "58657a", "ffffff"],
  ["orange text on white", "963b08", "ffffff"],
  ["white text on orange CTA", "ffffff", "c6530d"],
  ["white text on navy", "ffffff", "0a172d"]
];
for (const [label, foreground, background] of coreColorPairs) {
  const ratio = contrastRatio(foreground, background);
  if (ratio < 4.5) errors.push(`${label}: ${ratio.toFixed(2)}:1 contrast is below 4.5:1`);
}

const contact = await readFile(join(outputRoot, "contact.html"), "utf8");
for (const contactHref of ["mailto:admin@mcphersonai.com", "tel:+16195679869", "sms:+16195679869"]) {
  if (!contact.includes(contactHref)) errors.push(`contact path missing: ${contactHref}`);
}

if (errors.length) {
  console.error(`Audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Audit passed: ${htmlFiles.length} HTML pages, ${files.length} public files, no broken local links or prohibited claims.`);
