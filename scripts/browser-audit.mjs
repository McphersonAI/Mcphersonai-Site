const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, values) => {
  if (value.startsWith("--")) pairs.push([value.slice(2), values[index + 1]]);
  return pairs;
}, []));

const debugPort = Number(args["debug-port"] || 9223);
const baseUrl = (args["base-url"] || "http://127.0.0.1:4173").replace(/\/$/, "");
const routes = [
  "/",
  "/governance",
  "/observa",
  "/observa-audit-mode-schema-v0.1.html",
  "/qsr-systems",
  "/services",
  "/proof",
  "/contact"
];
const viewports = [
  { label: "mobile", width: 390, height: 844 },
  { label: "desktop", width: 1440, height: 1200 }
];
const errors = [];

async function inspectPage(route, viewport) {
  const url = `${baseUrl}${route}`;
  const targetResponse = await fetch(
    `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`,
    { method: "PUT" }
  );
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
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width <= 500,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    positionX: 0,
    positionY: 0,
    dontSetVisibleSize: false
  });
  await send("Page.navigate", { url });
  await new Promise((resolve) => setTimeout(resolve, 900));
  await send("Runtime.evaluate", {
    expression: "document.fonts.ready",
    awaitPromise: true,
    returnByValue: true
  });

  const evaluation = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      h1Count: document.querySelectorAll("h1").length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      headerVisible: (() => {
        const header = document.querySelector(".site-header");
        const rect = header?.getBoundingClientRect();
        return Boolean(rect && rect.width > 0 && rect.height > 0);
      })(),
      brandVisible: (() => {
        const brand = document.querySelector(".brand");
        const rect = brand?.getBoundingClientRect();
        return Boolean(rect && rect.width > 0 && rect.height > 0);
      })()
    })`,
    returnByValue: true
  });
  const state = JSON.parse(evaluation.result.value);
  if (state.h1Count !== 1) errors.push(`${route} ${viewport.label}: found ${state.h1Count} H1 elements`);
  if (state.overflow > 0) errors.push(`${route} ${viewport.label}: ${state.overflow}px horizontal overflow`);
  if (!state.headerVisible) errors.push(`${route} ${viewport.label}: header is not visible`);
  if (!state.brandVisible) errors.push(`${route} ${viewport.label}: brand is not visible`);

  if (route === "/observa") {
    const schemaResult = await send("Runtime.evaluate", {
      expression: `(async () => {
        const link = document.querySelector('a[href="/observa-audit-mode-schema-v0.1.html"]');
        if (!link) return JSON.stringify({ found: false });
        const response = await fetch(link.href);
        const text = await response.text();
        return JSON.stringify({
          found: true,
          status: response.status,
          contentType: response.headers.get("content-type"),
          hasSchemaHeading: text.includes("<h1>Audit Mode Schema</h1>"),
          hasSchemaObject: text.includes('"case_id": "OBS-DEMO-2026-001"')
        });
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    const schemaState = JSON.parse(schemaResult.result.value);
    if (!schemaState.found) errors.push(`Observa ${viewport.label}: schema link is missing`);
    if (
      schemaState.status !== 200
      || !String(schemaState.contentType).startsWith("text/html")
      || !schemaState.hasSchemaHeading
      || !schemaState.hasSchemaObject
    ) {
      errors.push(`Observa ${viewport.label}: schema destination did not return the intended HTML artifact`);
    }
  }

  if (route === "/qsr-systems") {
    const proofResult = await send("Runtime.evaluate", {
      expression: `JSON.stringify((() => {
        const panel = [...document.querySelectorAll(".boundary-panel")]
          .find((element) => element.querySelector("h3")?.textContent.trim() === "Evidence, not hype");
        const link = panel?.querySelector(".resource-links a");
        if (!panel || !link) return { found: false };
        link.focus();
        const style = getComputedStyle(link);
        return {
          found: true,
          text: panel.textContent,
          color: style.color,
          decoration: style.textDecorationLine,
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth
        };
      })())`,
      returnByValue: true
    });
    const proofState = JSON.parse(proofResult.result.value);
    if (!proofState.found) errors.push(`QSR ${viewport.label}: Evidence, not hype panel is missing`);
    if (!proofState.text.includes("surpassed 5,000 cumulative downloads")) {
      errors.push(`QSR ${viewport.label}: 5,000+ adoption statement is missing`);
    }
    if (proofState.text.includes("latest dated proof states") || proofState.text.includes("crossed 3,000")) {
      errors.push(`QSR ${viewport.label}: stale current-facing 3,000 claim remains`);
    }
    if (proofState.color !== "rgb(255, 201, 159)" || !proofState.decoration.includes("underline")) {
      errors.push(`QSR ${viewport.label}: dark-section proof link lacks the accessible orange focus treatment`);
    }
    if (proofState.outlineStyle === "none" || proofState.outlineWidth === "0px") {
      errors.push(`QSR ${viewport.label}: dark-section proof link lacks visible keyboard focus`);
    }
  }

  if (route === "/" && viewport.label === "mobile") {
    const before = await send("Runtime.evaluate", {
      expression: `JSON.stringify({
        expanded: document.querySelector("[data-nav-toggle]").getAttribute("aria-expanded"),
        display: getComputedStyle(document.querySelector("#primary-nav")).display
      })`,
      returnByValue: true
    });
    const beforeState = JSON.parse(before.result.value);
    if (beforeState.expanded !== "false" || beforeState.display !== "none") {
      errors.push("mobile navigation: expected closed initial state");
    }

    await send("Runtime.evaluate", {
      expression: `document.querySelector("[data-nav-toggle]").click()`,
      returnByValue: true
    });
    const open = await send("Runtime.evaluate", {
      expression: `JSON.stringify({
        expanded: document.querySelector("[data-nav-toggle]").getAttribute("aria-expanded"),
        open: document.querySelector("#primary-nav").dataset.open,
        display: getComputedStyle(document.querySelector("#primary-nav")).display,
        links: document.querySelectorAll("#primary-nav a").length
      })`,
      returnByValue: true
    });
    const openState = JSON.parse(open.result.value);
    if (
      openState.expanded !== "true"
      || openState.open !== "true"
      || openState.display === "none"
      || openState.links !== 7
    ) {
      errors.push("mobile navigation: toggle did not expose all seven links");
    }

    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
    const closed = await send("Runtime.evaluate", {
      expression: `document.querySelector("[data-nav-toggle]").getAttribute("aria-expanded")`,
      returnByValue: true
    });
    if (closed.result.value !== "false") errors.push("mobile navigation: Escape did not close the menu");

    await send("Runtime.evaluate", {
      expression: `document.body.setAttribute("tabindex", "-1"); document.body.focus(); document.body.removeAttribute("tabindex")`,
      returnByValue: true
    });
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab" });
    const focused = await send("Runtime.evaluate", {
      expression: `JSON.stringify({
        className: document.activeElement.className,
        outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
        outlineStyle: getComputedStyle(document.activeElement).outlineStyle
      })`,
      returnByValue: true
    });
    const focusState = JSON.parse(focused.result.value);
    if (!String(focusState.className).includes("skip-link")) {
      errors.push(`keyboard navigation: first Tab focused ${focusState.className || "an unknown element"}`);
    }
    if (focusState.outlineStyle === "none" || focusState.outlineWidth === "0px") {
      errors.push("keyboard navigation: focused skip link has no visible outline");
    }
  }

  socket.close();
  await fetch(`http://127.0.0.1:${debugPort}/json/close/${target.id}`);
}

for (const viewport of viewports) {
  for (const route of routes) {
    await inspectPage(route, viewport);
  }
}

if (errors.length) {
  console.error(`Browser audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Browser audit passed: ${routes.length} primary routes at 390px and 1440px, mobile menu toggle/Escape, first-Tab skip link, visible focus, and no horizontal overflow.`
);
