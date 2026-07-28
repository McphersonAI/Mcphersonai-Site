import { readFile, readdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, values) => {
  if (value.startsWith("--")) pairs.push([value.slice(2), values[index + 1]]);
  return pairs;
}, []));

const outputRoot = resolve(process.cwd(), args.directory || "dist");
const errors = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path));
    else paths.push(path);
  }
  return paths;
}

const htmlFiles = (await walk(outputRoot)).filter((file) => extname(file) === ".html");
const destinations = new Set();

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["'](https?:\/\/[^"'#]+)(?:#[^"']*)?["']/gi)) {
    destinations.add(match[1]);
  }
}

for (const destination of [...destinations].sort()) {
  try {
    let response = await fetch(destination, {
      method: "HEAD",
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 McPherson-AI-link-audit/1.0" },
      signal: AbortSignal.timeout(20000)
    });
    if ([403, 405].includes(response.status)) {
      response = await fetch(destination, {
        method: "GET",
        redirect: "follow",
        headers: { "user-agent": "Mozilla/5.0 McPherson-AI-link-audit/1.0" },
        signal: AbortSignal.timeout(20000)
      });
    }
    if (!response.ok) errors.push(`${destination}: HTTP ${response.status}`);
  } catch (error) {
    errors.push(`${destination}: ${error.message}`);
  }
}

if (errors.length) {
  console.error(`External-link audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`External-link audit passed: ${destinations.size} distinct public destinations resolved.`);
