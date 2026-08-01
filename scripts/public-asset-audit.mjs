const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, values) => {
  if (value.startsWith("--")) pairs.push([value.slice(2), values[index + 1]]);
  return pairs;
}, []));

const baseUrl = (args["base-url"] || "http://127.0.0.1:4173").replace(/\/$/, "");
const assets = [
  ["/styles.css", "text/css"],
  ["/release-status.js", "javascript"],
  ["/site.js", "javascript"],
  ["/og-governance.png", "image/png"],
  ["/og-private-beta.png", "image/png"],
  ["/observa-audit-mode-dogfood-demo-polished.pdf", "application/pdf"],
  ["/sample-assessment.pdf", "application/pdf"],
  ["/assets/papers/McPherson_AI_Agent_Infrastructure_White_Paper_v1.0.pdf", "application/pdf"],
  ["/assets/papers/McPherson_AI_When_the_Agent_Acts_Final_Navy_Orange.pdf", "application/pdf"],
  ["/robots.txt", "text/plain"],
  ["/sitemap.xml", "application/xml"]
];
const errors = [];

for (const [path, expectedType] of assets) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  const contentType = response.headers.get("content-type") || "";
  if (response.status !== 200) errors.push(`${path}: expected 200, received ${response.status}`);
  if (!contentType.includes(expectedType)) {
    errors.push(`${path}: expected ${expectedType}, received ${contentType || "no content type"}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0) errors.push(`${path}: response body is empty`);
}

if (errors.length) {
  console.error(`Public-asset audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Public-asset audit passed against ${baseUrl}: ${assets.length} supporting assets returned 200 with expected content types and non-empty bodies.`);
