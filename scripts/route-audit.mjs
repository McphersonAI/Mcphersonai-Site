const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, values) => {
  if (value.startsWith("--")) pairs.push([value.slice(2), values[index + 1]]);
  return pairs;
}, []));

const baseUrl = (args["base-url"] || "http://127.0.0.1:4173").replace(/\/$/, "");
const errors = [];

const canonicalRoutes = [
  "/",
  "/governance",
  "/observa",
  "/qsr-systems",
  "/services",
  "/proof",
  "/contact",
  "/observa-audit-mode-schema-v0.1"
];

const slashRoutes = canonicalRoutes
  .filter((route) => route !== "/")
  .map((route) => [`${route}/`, route]);

const legacyRoutes = [
  ["/what-we-build", "/services"],
  ["/what-we-build.html", "/services"],
  ["/resources", "/proof"],
  ["/resources.html", "/proof"],
  ["/when-agent-acts", "/when-the-agent-acts"],
  ["/when-agent-acts.html", "/when-the-agent-acts"]
];

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
    body: await response.text()
  };
}

function locationPath(result) {
  if (!result.location) return "";
  return new URL(result.location, `${baseUrl}${result.path}`).pathname;
}

async function expectSingleRedirect(from, to, allowedStatuses = [301]) {
  const first = await request(from);
  if (!allowedStatuses.includes(first.status)) {
    errors.push(`${from}: expected redirect ${allowedStatuses.join("/")}, received ${first.status}`);
    return;
  }
  const actualTarget = locationPath(first);
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

for (const route of canonicalRoutes) {
  const result = await request(route);
  if (result.status !== 200) errors.push(`${route}: canonical route returned ${result.status}, expected 200`);
  if (!result.contentType.startsWith("text/html")) {
    errors.push(`${route}: canonical route did not return HTML (${result.contentType || "missing content type"})`);
  }
}

for (const [from, to] of slashRoutes) await expectSingleRedirect(from, to);
for (const [from, to] of legacyRoutes) await expectSingleRedirect(from, to);
await expectSingleRedirect(
  "/observa-audit-mode-schema-v0.1.html",
  "/observa-audit-mode-schema-v0.1",
  [301, 302, 307, 308]
);

for (const path of ["/this-route-does-not-exist"]) {
  const result = await request(path);
  if (result.status !== 404) errors.push(`${path}: expected 404, received ${result.status}`);
  if (!result.contentType.startsWith("text/html")) errors.push(`${path}: 404 response is not HTML`);
  if (!result.body.includes("<h1>Page not found.</h1>")) errors.push(`${path}: custom 404 page was not returned`);
  if (!/name=["']robots["']\s+content=["']noindex,\s*follow["']/i.test(result.body)) {
    errors.push(`${path}: 404 response is missing noindex, follow`);
  }
  if (result.body.includes("Know what your AI agents did, what policy says")) {
    errors.push(`${path}: unknown route silently returned the homepage`);
  }
}

for (const [path, expectedPageText] of [
  ["/Governance", "See what your OpenClaw agents did before you give governance the power to stop them."],
  ["/OBSERVA", "Turn agent evidence into something an operator can actually review."]
]) {
  const result = await request(path);
  const returnedHomepage = result.body.includes("Know what your AI agents did, what policy says");
  if (returnedHomepage) errors.push(`${path}: case-mismatched route silently returned the homepage`);
  if (result.status === 404) {
    if (!result.body.includes("<h1>Page not found.</h1>")) errors.push(`${path}: 404 did not use the custom page`);
  } else if (result.status === 200) {
    if (!result.body.includes(expectedPageText)) {
      errors.push(`${path}: case-insensitive local response was not the matching canonical page`);
    }
  } else {
    errors.push(`${path}: expected a 404 or local case-insensitive 200, received ${result.status}`);
  }
}

if (errors.length) {
  console.error(`Route audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Route audit passed against ${baseUrl}: ${canonicalRoutes.length} canonical 200 routes, `
  + `${slashRoutes.length} one-step slash redirects, ${legacyRoutes.length} one-step legacy redirects, `
  + "Cloudflare-compatible schema .html canonicalization, a custom unknown-route 404, and no case mismatch returned the homepage."
);
