import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "dist");

const publicFiles = [
  "index.html",
  "governance.html",
  "observa.html",
  "qsr-systems.html",
  "services.html",
  "proof.html",
  "contact.html",
  "what-we-build.html",
  "resources.html",
  "white-paper.html",
  "when-the-agent-acts.html",
  "when-agent-acts.html",
  "regulated-crm-proof.html",
  "observa-audit-mode-schema-v0.1.html",
  "pilot.html",
  "walkthrough.html",
  "styles.css",
  "release-status.js",
  "site.js",
  "observa-audit-mode-dogfood-demo-polished.pdf",
  "sample-assessment.pdf",
  "og-governance.png",
  "_redirects",
  "_headers",
  "robots.txt",
  "sitemap.xml"
];

const publicDirectories = ["assets"];

const routeByFile = {
  "index.html": "/",
  "governance.html": "/governance",
  "observa.html": "/observa",
  "qsr-systems.html": "/qsr-systems",
  "services.html": "/services",
  "proof.html": "/proof",
  "contact.html": "/contact",
  "what-we-build.html": "/services",
  "resources.html": "/proof",
  "white-paper.html": "/white-paper",
  "when-the-agent-acts.html": "/when-the-agent-acts",
  "when-agent-acts.html": "/when-the-agent-acts",
  "regulated-crm-proof.html": "/regulated-crm-proof",
  "observa-audit-mode-schema-v0.1.html": "/observa-audit-mode-schema-v0.1.html",
  "pilot.html": "/services",
  "walkthrough.html": "/qsr-systems"
};

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function matchContent(html, expression) {
  return html.match(expression)?.[1]?.trim() || "";
}

function enrichMetadata(html, fileName) {
  if (/<meta\s+name=["']robots["'][^>]*noindex/i.test(html)) return html;

  const title = matchContent(html, /<title>([\s\S]*?)<\/title>/i).replace(/<[^>]+>/g, "");
  const description = matchContent(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const route = routeByFile[fileName];
  const canonical = `https://mcphersonai.com${route}`;
  const tags = [];

  if (!/<link\s+rel=["']canonical["']/i.test(html)) {
    tags.push(`<link rel="canonical" href="${canonical}">`);
  }
  if (!/<meta\s+property=["']og:type["']/i.test(html)) {
    tags.push('<meta property="og:type" content="website">');
  }
  if (!/<meta\s+property=["']og:site_name["']/i.test(html)) {
    tags.push('<meta property="og:site_name" content="McPherson AI">');
  }
  if (!/<meta\s+property=["']og:title["']/i.test(html)) {
    tags.push(`<meta property="og:title" content="${escapeAttribute(title)}">`);
  }
  if (!/<meta\s+property=["']og:description["']/i.test(html)) {
    tags.push(`<meta property="og:description" content="${escapeAttribute(description)}">`);
  }
  if (!/<meta\s+property=["']og:url["']/i.test(html)) {
    tags.push(`<meta property="og:url" content="${canonical}">`);
  }
  if (!/<meta\s+property=["']og:image["']/i.test(html)) {
    tags.push('<meta property="og:image" content="https://mcphersonai.com/og-governance.png">');
    tags.push('<meta property="og:image:alt" content="McPherson AI governance evidence flow for action-taking AI agents">');
  }
  if (!/<meta\s+name=["']twitter:card["']/i.test(html)) {
    tags.push('<meta name="twitter:card" content="summary_large_image">');
    tags.push(`<meta name="twitter:title" content="${escapeAttribute(title)}">`);
    tags.push(`<meta name="twitter:description" content="${escapeAttribute(description)}">`);
    tags.push('<meta name="twitter:image" content="https://mcphersonai.com/og-governance.png">');
  }

  if (tags.length === 0) return html;
  return html.replace("</head>", `${tags.join("\n")}\n</head>`);
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const relativePath of publicFiles) {
  const sourcePath = join(projectRoot, relativePath);
  const destinationPath = join(outputRoot, relativePath);
  await mkdir(dirname(destinationPath), { recursive: true });

  if (relativePath.endsWith(".html")) {
    const source = await readFile(sourcePath, "utf8");
    await writeFile(destinationPath, enrichMetadata(source, relativePath), "utf8");
  } else {
    await cp(sourcePath, destinationPath);
  }
}

for (const relativePath of publicDirectories) {
  await cp(join(projectRoot, relativePath), join(outputRoot, relativePath), { recursive: true });
}

console.log(`Built ${publicFiles.length} files and ${publicDirectories.length} asset directory into dist/.`);
