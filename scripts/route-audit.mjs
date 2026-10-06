import { canonicalRoutes, historicalRoutes, legacyRoutes, retiredMedia } from './site-contract.mjs';
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, values) => {
  if (value.startsWith("--")) pairs.push([value.slice(2), values[index + 1]]);
  return pairs;
}, []));

const baseUrl = (args["base-url"] || "http://127.0.0.1:4173").replace(/\/$/, "");
const errors = [];

const slashRoutes = [...canonicalRoutes, ...historicalRoutes].filter(r => r !== '/').map(r => [r+'/', r]);
const expandedLegacyRoutes = legacyRoutes.flatMap(([from,to]) => ['', '/', '.html'].map(suffix => [from+suffix,to]));
const allCanonical = [...canonicalRoutes, ...historicalRoutes];

async function request(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: { "user-agent": "McPherson-AI-local-route-audit/1.0" }
  });
  return {
    path,
    status: response.status,
    location: response.headers.get("location"),
    contentType: response.headers.get("content-type") || "",
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text()
  };
}

function locationTarget(result) {
  if (!result.location) return "";
  const destination = new URL(result.location, `${baseUrl}${result.path}`);
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

async function expectSingleRedirect(from, to, allowedStatuses = [301]) {
  const first = await request(from);
  if (!allowedStatuses.includes(first.status)) {
    errors.push(`${from}: expected redirect ${allowedStatuses.join("/")}, received ${first.status}`);
    return;
  }
  const actualTarget = locationTarget(first);
  if (actualTarget !== to) {
    errors.push(`${from}: expected Location ${to}, received ${first.location || "none"}`);
    return;
  }
  const terminal = await request(actualTarget);
  if (terminal.status !== 200) {
    errors.push(`${from}: redirect target ${actualTarget} did not terminate at 200 (received ${terminal.status})`);
  }
  if (terminal.location) {
    errors.push(`${from}: redirect target ${actualTarget} unexpectedly redirects again to ${terminal.location}`);
  }
}

for (const route of allCanonical) {
  const result = await request(route);
  if (result.status !== 200) errors.push(`${route}: canonical route returned ${result.status}, expected 200`);
  if (!result.contentType.startsWith("text/html")) {
    errors.push(`${route}: canonical route did not return HTML (${result.contentType || "missing content type"})`);
  }
}

for (const [from, to] of slashRoutes) await expectSingleRedirect(from, to);
for (const [from, to] of expandedLegacyRoutes) await expectSingleRedirect(from, to);
await expectSingleRedirect(
  "/observa-audit-mode-schema-v0.1.html",
  "/observa-audit-mode-schema-v0.1",
  [301, 302, 307, 308]
);

const preservedQuery = "?utm_source=route-audit&utm_medium=preview&ref=case-17";
const queryRedirects = [
  ...slashRoutes.map(([from, to]) => [`${from}${preservedQuery}`, `${to}${preservedQuery}`]),
  ...expandedLegacyRoutes.map(([from, to]) => [`${from}${preservedQuery}`, `${to}${preservedQuery}`]),
  [`/observa.html${preservedQuery}`, `/observa${preservedQuery}`],
  [
    `/observa-audit-mode-schema-v0.1.html${preservedQuery}`,
    `/observa-audit-mode-schema-v0.1${preservedQuery}`
  ]
];
for (const [from, to] of queryRedirects) {
  await expectSingleRedirect(from, to, [301, 302, 307, 308]);
}

const headerResult = await request("/");
for (const [name, expected] of [
  ["content-security-policy", "default-src 'self'"],
  ["permissions-policy", "camera=()"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"]
]) {
  if (!headerResult.headers[name]?.includes(expected)) {
    errors.push(`/: missing or incorrect ${name} defense-in-depth header`);
  }
}

for (const path of ["/this-route-does-not-exist"]) {
  const result = await request(path);
  if (result.status !== 404) errors.push(`${path}: expected 404, received ${result.status}`);
  if (!result.contentType.startsWith("text/html")) errors.push(`${path}: 404 response is not HTML`);
  if (!result.body.includes("<h1>Page not found.</h1>")) errors.push(`${path}: custom 404 page was not returned`);
  if (!/name=["']robots["']\s+content=["']noindex,\s*follow["']/i.test(result.body)) {
    errors.push(`${path}: 404 response is missing noindex, follow`);
  }
  if (result.body.includes("Agent says it worked. Observa checks reality.")) {
    errors.push(`${path}: unknown route silently returned the homepage`);
  }
}

for (const [from,to] of retiredMedia) await expectSingleRedirect(from,to);
for (const route of allCanonical.filter(r=>r !== '/')) await expectSingleRedirect(route+'.html',route,[301,302,307,308]);
for (const [from,to] of [['/index.html','/'],['/index','/']]) await expectSingleRedirect(from,to);
for (const path of ['/OBSERVA','/Evidence','/arbitrary-missing-page']) {
  const result=await request(path);
  if(result.status !== 404 || !result.body.includes('<h1>Page not found.</h1>')) errors.push(`${path}: expected custom 404`);
}

if (errors.length) {
  console.error(`Route audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Route audit passed against ${baseUrl}: ${allCanonical.length} canonical routes, ${slashRoutes.length} slash redirects, ${expandedLegacyRoutes.length} legacy variants, ${queryRedirects.length} query-preserving cases, ${retiredMedia.length} asset redirects, .html canonicalization, headers and custom 404s.`);
