import { writeFile } from "node:fs/promises";

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, values) => {
  if (value.startsWith("--")) pairs.push([value.slice(2), values[index + 1]]);
  return pairs;
}, []));

const debugPort = Number(args["debug-port"] || 9223);
const targetUrl = args.url;
const outputPath = args.out;
const width = Number(args.width || 390);
const height = Number(args.height || 844);

if (!targetUrl || !outputPath) {
  throw new Error("Usage: node scripts/capture-screenshot.mjs --url URL --out FILE [--width 390 --height 844]");
}

const targetResponse = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(targetUrl)}`, { method: "PUT" });
if (!targetResponse.ok) throw new Error(`Could not create Chrome target: ${targetResponse.status}`);
const target = await targetResponse.json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let nextId = 1;

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width <= 500,
  screenWidth: width,
  screenHeight: height,
  positionX: 0,
  positionY: 0,
  dontSetVisibleSize: false
});
await send("Page.navigate", { url: targetUrl });
await new Promise((resolve) => setTimeout(resolve, 1200));
await send("Runtime.evaluate", {
  expression: "document.fonts.ready",
  awaitPromise: true,
  returnByValue: true
});
await send("Runtime.evaluate", {
  expression: "window.scrollTo(0, 0); new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
  awaitPromise: true,
  returnByValue: true
});
if (args.inspect === "true") {
  const inspection = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, scrollY: window.scrollY },
      header: (() => { const r = document.querySelector(".site-header")?.getBoundingClientRect(); return r && { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
      brand: (() => { const r = document.querySelector(".brand")?.getBoundingClientRect(); return r && { x: r.x, y: r.y, width: r.width, height: r.height, display: getComputedStyle(document.querySelector(".brand")).display, color: getComputedStyle(document.querySelector(".brand")).color }; })(),
      toggle: (() => { const r = document.querySelector(".nav-toggle")?.getBoundingClientRect(); return r && { x: r.x, y: r.y, width: r.width, height: r.height, display: getComputedStyle(document.querySelector(".nav-toggle")).display }; })()
    })`,
    returnByValue: true
  });
  console.log(`Inspection: ${inspection.result.value}`);
}
const screenshot = await send("Page.captureScreenshot", {
  format: "png",
  fromSurface: true,
  captureBeyondViewport: true,
  clip: { x: 0, y: 0, width, height, scale: 1 }
});

await writeFile(outputPath, Buffer.from(screenshot.data, "base64"));
socket.close();
await fetch(`http://127.0.0.1:${debugPort}/json/close/${target.id}`);

console.log(`Captured ${width}x${height} screenshot: ${outputPath}`);
