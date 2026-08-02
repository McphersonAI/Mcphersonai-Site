import { createReadStream } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const directoryArgument = process.argv[2] || "dist";
const portIndex = process.argv.indexOf("--port");
const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 4173;
const root = resolve(process.cwd(), directoryArgument);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

async function resolveExactPath(relativePath) {
  const segments = relativePath.split("/").filter(Boolean);
  let current = root;
  for (const segment of segments) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return null;
    }
    const match = entries.find((entry) => entry.name === segment);
    if (!match) return null;
    current = join(current, match.name);
  }
  return current;
}

const redirectRules = (await readFile(join(root, "_redirects"), "utf8"))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => {
    const [from, to, statusCode = "302"] = line.split(/\s+/);
    return { from, to, statusCode: Number(statusCode) };
  });

const headerRules = (await readFile(join(root, "_headers"), "utf8"))
  .split(/\r?\n/)
  .reduce((rules, line) => {
    if (!line.trim() || line.trim().startsWith("#")) return rules;
    if (!/^\s/.test(line)) {
      rules.push({ pattern: line.trim(), headers: {} });
      return rules;
    }
    const separator = line.indexOf(":");
    if (separator > 0 && rules.length) {
      rules.at(-1).headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
    return rules;
  }, []);

function matchesHeaderPattern(pattern, pathname) {
  if (pattern === "/*") return true;
  if (pattern.endsWith("*")) return pathname.startsWith(pattern.slice(0, -1));
  return pathname === pattern;
}

function responseHeaders(pathname, additional = {}) {
  const headers = {};
  for (const rule of headerRules) {
    if (matchesHeaderPattern(rule.pattern, pathname)) Object.assign(headers, rule.headers);
  }
  return { ...headers, ...additional };
}

function redirectLocation(target, search) {
  const destination = new URL(target, "http://127.0.0.1");
  if (!destination.search) destination.search = search;
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(requestUrl.pathname);
    const redirect = redirectRules.find((rule) => rule.from === pathname);
    if (redirect) {
      response.writeHead(redirect.statusCode, responseHeaders(pathname, {
        Location: redirectLocation(redirect.to, requestUrl.search)
      }));
      response.end();
      return;
    }

    if (pathname.endsWith(".html")) {
      const htmlRelativePath = pathname.replace(/^\/+/, "");
      const htmlFile = await resolveExactPath(htmlRelativePath);
      if (htmlFile) {
        const extensionless = pathname.slice(0, -5) || "/";
        response.writeHead(301, responseHeaders(pathname, {
          Location: redirectLocation(extensionless, requestUrl.search)
        }));
        response.end();
        return;
      }
    }

    const cleanPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const normalizedPath = normalize(join(root, cleanPath));
    if (!normalizedPath.startsWith(root)) {
      response.writeHead(403, responseHeaders(pathname));
      response.end("Forbidden");
      return;
    }

    let filePath = await resolveExactPath(cleanPath);
    if (!filePath) filePath = await resolveExactPath(`${cleanPath}.html`);

    if (!filePath) {
      const notFoundPath = await resolveExactPath("404.html");
      response.writeHead(404, responseHeaders(pathname, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      }));
      if (notFoundPath) createReadStream(notFoundPath).pipe(response);
      else response.end("Not found");
      return;
    }

    response.writeHead(200, responseHeaders(pathname, {
      "Content-Type": contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    }));
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, responseHeaders("/", { "Content-Type": "text/plain; charset=utf-8" }));
    response.end("Preview server error");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Local preview: http://127.0.0.1:${port}`);
});
