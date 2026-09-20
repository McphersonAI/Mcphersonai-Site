import { createReadStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
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
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

// Resolve a request path to a FILE, case-sensitively, never escaping the root.
// The final segment must be a file: a route like /observa may name both
// `observa.html` and an `observa/` directory of sub-pages, and the page is the
// file. Returning the directory here would make the server try to stream it.
async function resolveExactPath(relativePath) {
  const segments = relativePath.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  let current = root;
  for (const [index, segment] of segments.entries()) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return null;
    }
    const match = entries.find((entry) => entry.name === segment);
    if (!match) return null;
    const last = index === segments.length - 1;
    if (last && !match.isFile()) return null;
    if (!last && !match.isDirectory()) return null;
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
    if (!filePath) filePath = await resolveExactPath(`${cleanPath}/index.html`);

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

    // Byte-range support. A <video> element asks for ranges; answering every
    // request with a chunked 200 makes the browser abort the media fetch and
    // breaks seeking, so the preview mirrors what the host actually does.
    const contentType = contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
    const { size } = await stat(filePath);
    const rangeHeader = request.headers.range;
    const rangeMatch = typeof rangeHeader === "string" && /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());

    if (rangeMatch) {
      const [, rawStart, rawEnd] = rangeMatch;
      let start;
      let end;
      if (rawStart === "") {
        // Suffix range: the last N bytes.
        const suffix = Number(rawEnd);
        if (!Number.isFinite(suffix) || suffix <= 0) {
          response.writeHead(416, responseHeaders(pathname, {
            "Content-Range": `bytes */${size}`,
            "Content-Type": contentType
          }));
          response.end();
          return;
        }
        start = Math.max(0, size - suffix);
        end = size - 1;
      } else {
        start = Number(rawStart);
        end = rawEnd === "" ? size - 1 : Number(rawEnd);
      }
      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
        response.writeHead(416, responseHeaders(pathname, {
          "Content-Range": `bytes */${size}`,
          "Content-Type": contentType
        }));
        response.end();
        return;
      }
      end = Math.min(end, size - 1);
      response.writeHead(206, responseHeaders(pathname, {
        "Content-Type": contentType,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store"
      }));
      if (request.method === "HEAD") {
        response.end();
        return;
      }
      const partial = createReadStream(filePath, { start, end });
      partial.on("error", () => response.destroy());
      response.on("close", () => partial.destroy());
      partial.pipe(response);
      return;
    }

    response.writeHead(200, responseHeaders(pathname, {
      "Content-Type": contentType,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store"
    }));
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    const stream = createReadStream(filePath);
    // A browser that has read enough of a media file simply closes the
    // connection; that is normal, not a server error.
    stream.on("error", () => response.destroy());
    response.on("close", () => stream.destroy());
    stream.pipe(response);
  } catch (error) {
    response.writeHead(500, responseHeaders("/", { "Content-Type": "text/plain; charset=utf-8" }));
    response.end("Preview server error");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Local preview: http://127.0.0.1:${port}`);
});
