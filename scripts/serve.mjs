import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const directoryArgument = process.argv[2] || "dist";
const portIndex = process.argv.indexOf("--port");
const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 4173;
const root = resolve(process.cwd(), directoryArgument);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const redirectRules = (await readFile(join(root, "_redirects"), "utf8"))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => {
    const [from, to, statusCode = "302"] = line.split(/\s+/);
    return { from, to, statusCode: Number(statusCode) };
  });

createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(requestUrl.pathname);
    const redirect = redirectRules.find((rule) => rule.from === pathname);
    if (redirect) {
      response.writeHead(redirect.statusCode, { Location: redirect.to });
      response.end();
      return;
    }

    const cleanPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    let filePath = normalize(join(root, cleanPath));
    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (!(await exists(filePath)) && !extname(filePath) && await exists(`${filePath}.html`)) {
      filePath = `${filePath}.html`;
    } else if (await exists(filePath) && (await stat(filePath)).isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    if (!(await exists(filePath))) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Preview server error");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Local preview: http://127.0.0.1:${port}`);
});
