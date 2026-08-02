const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, values) => {
  if (value.startsWith("--")) pairs.push([value.slice(2), values[index + 1]]);
  return pairs;
}, []));

const debugPort = Number(args["debug-port"] || 9223);
const baseUrl = (args["base-url"] || "http://127.0.0.1:4173").replace(/\/$/, "");
const routes = [
  "/",
  "/governance",
  "/private-beta",
  "/observa",
  "/observa-audit-mode-schema-v0.1",
  "/qsr-systems",
  "/services",
  "/proof",
  "/contact",
  "/contact?utm_source=clawhub&utm_medium=skill&utm_campaign=governance-v6-shadow-beta&utm_content=qsr-daily-ops-monitor#governance-setup",
  "/private-beta?utm_source=browser-audit&utm_medium=regression&utm_campaign=governance-v6-shadow-beta&utm_term=private-beta&utm_content=application",
  "/governance/?utm_source=browser-audit&ref=slash",
  "/governance.html?utm_source=browser-audit&ref=html",
  "/this-route-does-not-exist"
];
const viewports = [
  { label: "mobile-320", width: 320, height: 720 },
  { label: "mobile-390", width: 390, height: 844 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "desktop", width: 1440, height: 1200 }
];
const expectedClawHubUrl = "https://clawhub.ai/plugins/%40mcphersonai%2Fmcpherson-governance-openclaw";
const expectedGithubReleaseUrl = "https://github.com/McphersonAI/mcpherson-governance-openclaw/releases/tag/v0.5.1";
const releaseRoutes = new Set(["/", "/governance", "/observa", "/proof"]);
const installRoutes = new Set(["/", "/governance", "/proof"]);
const redirectExpectations = new Map([
  ["/governance/?utm_source=browser-audit&ref=slash", ["/governance", "?utm_source=browser-audit&ref=slash"]],
  ["/governance.html?utm_source=browser-audit&ref=html", ["/governance", "?utm_source=browser-audit&ref=html"]]
]);
const errors = [];
const darkCalloutLabels = new Set();
const totals = {
  consoleErrors: 0,
  exceptions: 0,
  browserLogErrors: 0,
  failedRequiredAssets: 0
};

function parseRgb(value) {
  const channels = String(value).match(/[\d.]+/g)?.slice(0, 3).map(Number);
  return channels?.length === 3 ? channels : null;
}

function relativeLuminance(rgb) {
  const channels = rgb.map((channel) => channel / 255).map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(foreground, background) {
  const first = parseRgb(foreground);
  const second = parseRgb(background);
  if (!first || !second) return 0;
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

async function inspectPage(route, viewport) {
  const url = `${baseUrl}${route}`;
  const routePath = new URL(url).pathname;
  const targetResponse = await fetch(
    `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`,
    { method: "PUT" }
  );
  if (!targetResponse.ok) throw new Error(`Could not create Chrome target: ${targetResponse.status}`);
  const target = await targetResponse.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  const consoleErrors = [];
  const exceptions = [];
  const browserLogErrors = [];
  const failedRequiredAssets = [];
  const requests = new Map();
  let nextId = 1;

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) {
      if (message.method === "Runtime.exceptionThrown") {
        exceptions.push(message.params?.exceptionDetails?.text || "uncaught runtime exception");
      }
      if (message.method === "Runtime.consoleAPICalled" && message.params?.type === "error") {
        consoleErrors.push((message.params.args || []).map((arg) => arg.value || arg.description || "").join(" "));
      }
      if (message.method === "Log.entryAdded" && message.params?.entry?.level === "error") {
        const entry = message.params.entry;
        const expectedDocument404 = routePath === "/this-route-does-not-exist"
          && new URL(entry.url || url).pathname === routePath
          && entry.text.includes("status of 404");
        if (!expectedDocument404) browserLogErrors.push(entry.text);
      }
      if (message.method === "Network.requestWillBeSent") {
        requests.set(message.params.requestId, {
          url: message.params.request.url,
          type: message.params.type
        });
      }
      if (message.method === "Network.loadingFailed") {
        const request = requests.get(message.params.requestId) || {};
        failedRequiredAssets.push(`${request.type || "resource"} ${request.url || message.params.requestId}: ${message.params.errorText}`);
      }
      if (message.method === "Network.responseReceived" && message.params.response.status >= 400) {
        const responseUrl = new URL(message.params.response.url);
        const expectedDocument404 = routePath === "/this-route-does-not-exist"
          && message.params.type === "Document"
          && responseUrl.pathname === routePath
          && message.params.response.status === 404;
        if (!expectedDocument404) {
          failedRequiredAssets.push(
            `${message.params.type} ${message.params.response.url}: HTTP ${message.params.response.status}`
          );
        }
      }
      return;
    }
    if (!pending.has(message.id)) return;
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

  async function pressEnter() {
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Enter",
      code: "Enter",
      text: "\r",
      unmodifiedText: "\r",
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    });
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Network.enable");
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
      })(),
      skipLinkPresent: Boolean(document.querySelector(".skip-link")),
      primaryCtaPresent: Boolean(document.querySelector(".btn.primary")),
      bodyText: document.body.innerText,
      installCtas: [...document.querySelectorAll("a")]
        .filter((element) => element.textContent.trim() === "Install the Free Plugin")
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            href: element.href,
            visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden"
          };
        }),
      githubReleaseLinks: [...document.querySelectorAll("a[href*='/releases/tag/']")].map((element) => element.href),
      unlabeledControls: [...document.querySelectorAll("input:not([type='hidden']), select, textarea, button")]
        .filter((element) => {
          if (element.getAttribute("aria-label") || element.getAttribute("aria-labelledby")) return false;
          if (element.closest("label")) return false;
          if (element.id && document.querySelector('label[for="' + CSS.escape(element.id) + '"]')) return false;
          return element.tagName !== "BUTTON" || !element.textContent.trim();
        })
        .map((element) => element.outerHTML.slice(0, 120)),
      headingLevels: [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")]
        .map((heading) => Number(heading.tagName.slice(1))),
      positiveTabIndexes: [...document.querySelectorAll("[tabindex]")]
        .filter((element) => Number(element.getAttribute("tabindex")) > 0)
        .map((element) => element.outerHTML.slice(0, 100)),
      escapedElements: [...document.body.querySelectorAll("*")]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden" || style.position === "fixed") return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
        })
        .slice(0, 5)
        .map((element) => element.tagName + (element.className ? "." + String(element.className).split(" ").join(".") : "")),
      location: { pathname: location.pathname, search: location.search },
      icons: [...document.querySelectorAll('link[rel~="icon"]')].map((element) => ({
        href: element.getAttribute("href"),
        type: element.getAttribute("type")
      })),
      darkCalloutEyebrows: [...document.querySelectorAll(".split-callout .eyebrow")].map((element) => ({
        text: element.textContent.trim(),
        color: getComputedStyle(element).color,
        background: getComputedStyle(element.closest(".split-callout")).backgroundColor
      }))
    })`,
    returnByValue: true
  });
  const state = JSON.parse(evaluation.result.value);
  if (state.h1Count !== 1) errors.push(`${route} ${viewport.label}: found ${state.h1Count} H1 elements`);
  if (state.overflow > 0) errors.push(`${route} ${viewport.label}: ${state.overflow}px horizontal overflow`);
  if (!state.headerVisible) errors.push(`${route} ${viewport.label}: header is not visible`);
  if (!state.brandVisible) errors.push(`${route} ${viewport.label}: brand is not visible`);
  if (!state.skipLinkPresent) errors.push(`${route} ${viewport.label}: skip link is missing`);
  if (!state.primaryCtaPresent) errors.push(`${route} ${viewport.label}: primary CTA hierarchy is missing`);
  if (state.bodyText.includes("v0.5.0")) errors.push(`${route} ${viewport.label}: stale current-facing v0.5.0 label remains`);
  if (releaseRoutes.has(route) && !state.bodyText.includes("v0.5.1")) {
    errors.push(`${route} ${viewport.label}: current v0.5.1 release label is not visible`);
  }
  if (installRoutes.has(route)) {
    if (!state.installCtas.length) {
      errors.push(`${route} ${viewport.label}: Install the Free Plugin CTA is missing`);
    } else if (!state.installCtas.some((cta) => cta.visible && cta.href === expectedClawHubUrl)) {
      errors.push(`${route} ${viewport.label}: install CTA is not visible with the correct ClawHub destination`);
    }
    if (!state.githubReleaseLinks.includes(expectedGithubReleaseUrl)) {
      errors.push(`${route} ${viewport.label}: v0.5.1 GitHub release link is missing`);
    }
  }
  if (["/governance", "/proof"].includes(route) && !state.bodyText.includes("2026.6.5")) {
    errors.push(`${route} ${viewport.label}: OpenClaw 2026.6.5 minimum is not visible`);
  }
  if (["/", "/governance", "/proof"].includes(route) && !state.bodyText.toLowerCase().includes("shadow-only")) {
    errors.push(`${route} ${viewport.label}: shadow-only authority language is not visible`);
  }
  if (state.positiveTabIndexes.length) {
    errors.push(`${route} ${viewport.label}: positive tabindex can disrupt keyboard order`);
  }
  if (state.escapedElements.length) {
    errors.push(`${route} ${viewport.label}: elements escape the viewport (${state.escapedElements.join(", ")})`);
  }
  if (state.unlabeledControls.length) {
    errors.push(`${route} ${viewport.label}: unlabeled form controls (${state.unlabeledControls.join(", ")})`);
  }
  for (const [href, type] of [
    ["/favicon.ico", "image/x-icon"],
    ["/favicon.svg", "image/svg+xml"]
  ]) {
    if (!state.icons.some((icon) => icon.href === href && icon.type === type)) {
      errors.push(`${route} ${viewport.label}: missing valid ${href} icon declaration`);
    }
  }
  for (const eyebrow of state.darkCalloutEyebrows) {
    darkCalloutLabels.add(eyebrow.text);
    const ratio = contrastRatio(eyebrow.color, eyebrow.background);
    if (ratio < 4.5) {
      errors.push(`${route} ${viewport.label}: dark-callout eyebrow "${eyebrow.text}" is ${ratio.toFixed(2)}:1`);
    }
  }
  const redirectExpectation = redirectExpectations.get(route);
  if (redirectExpectation && (
    state.location.pathname !== redirectExpectation[0]
    || state.location.search !== redirectExpectation[1]
  )) {
    errors.push(
      `${route} ${viewport.label}: browser redirect lost its path/query `
      + `(received ${state.location.pathname}${state.location.search})`
    );
  }
  for (let index = 1; index < state.headingLevels.length; index += 1) {
    if (state.headingLevels[index] - state.headingLevels[index - 1] > 1) {
      errors.push(`${route} ${viewport.label}: heading level skips from h${state.headingLevels[index - 1]} to h${state.headingLevels[index]}`);
      break;
    }
  }

  const faviconResult = await send("Runtime.evaluate", {
    expression: `(async () => {
      const response = await fetch("/favicon.ico", { cache: "no-store" });
      return JSON.stringify({
        status: response.status,
        contentType: response.headers.get("content-type"),
        bytes: (await response.arrayBuffer()).byteLength
      });
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  const faviconState = JSON.parse(faviconResult.result.value);
  if (
    faviconState.status !== 200
    || !String(faviconState.contentType).includes("image/x-icon")
    || faviconState.bytes === 0
  ) {
    errors.push(`${route} ${viewport.label}: direct cold favicon request did not return a non-empty image/x-icon 200`);
  }

  if (route.startsWith("/contact?") || route.startsWith("/private-beta?")) {
    const funnelResult = await send("Runtime.evaluate", {
      expression: `JSON.stringify({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash
      })`,
      returnByValue: true
    });
    const funnelState = JSON.parse(funnelResult.result.value);
    const originalUrl = new URL(`${baseUrl}${route}`);
    const expectedAttribution = [...originalUrl.searchParams.entries()]
      .filter(([key]) => key.startsWith("utm_"));
    if (
      funnelState.pathname !== "/private-beta"
      || (route.startsWith("/contact?") && funnelState.hash !== "#apply")
      || expectedAttribution.some(([key, value]) => new URLSearchParams(funnelState.search).get(key) !== value)
    ) {
      errors.push(`${route} ${viewport.label}: tracked skill funnel did not preserve its application attribution`);
    }
  }

  if (routePath === "/private-beta") {
    const formResult = await send("Runtime.evaluate", {
      expression: `JSON.stringify((() => {
        const form = document.querySelector("[data-beta-application]");
        if (!form) return { found: false };
        const initialValid = form.checkValidity();
        form.elements.name.value = "Synthetic Tester";
        form.elements.email.value = "not-an-email";
        form.elements.role.value = "Operator";
        form.elements.agents.value = "1";
        form.elements.goal.value = "Synthetic non-sensitive validation only";
        form.elements.boundary_acknowledged.checked = true;
        const invalidEmailRejected = !form.checkValidity();
        form.elements.email.value = "synthetic@example.invalid";
        const controlStyles = [...form.querySelectorAll(".field input, .field select, .field textarea")].map((control) => {
          const style = getComputedStyle(control);
          return {
            name: control.name,
            borderColor: style.borderTopColor,
            backgroundColor: style.backgroundColor,
            placeholder: control.getAttribute("placeholder"),
            placeholderColor: getComputedStyle(control, "::placeholder").color
          };
        });
        const focusControl = form.elements.openclaw;
        focusControl.focus();
        const focusStyle = getComputedStyle(focusControl);
        const focusState = {
          outlineColor: focusStyle.outlineColor,
          outlineStyle: focusStyle.outlineStyle,
          outlineWidth: focusStyle.outlineWidth,
          outlineOffset: focusStyle.outlineOffset
        };
        const disabledControl = form.elements.company;
        disabledControl.disabled = true;
        const disabledStyle = getComputedStyle(disabledControl);
        const disabledState = {
          disabled: disabledControl.disabled,
          borderColor: disabledStyle.borderTopColor,
          backgroundColor: disabledStyle.backgroundColor,
          color: disabledStyle.color,
          cursor: disabledStyle.cursor,
          opacity: disabledStyle.opacity
        };
        disabledControl.disabled = false;
        const errorControl = form.elements.email;
        errorControl.setAttribute("aria-invalid", "true");
        const errorStyle = getComputedStyle(errorControl);
        const errorState = { borderColor: errorStyle.borderTopColor, backgroundColor: errorStyle.backgroundColor };
        errorControl.removeAttribute("aria-invalid");
        const submitStyle = getComputedStyle(form.querySelector('button[type="submit"]'));
        return {
          found: true,
          initialValid,
          invalidEmailRejected,
          completeValid: form.checkValidity(),
          action: form.getAttribute("action"),
          method: form.getAttribute("method"),
          controlStyles,
          focusState,
          disabledState,
          errorState,
          submitState: {
            color: submitStyle.color,
            backgroundColor: submitStyle.backgroundColor,
            borderColor: submitStyle.borderTopColor
          },
          checkboxes: [...form.querySelectorAll('input[type="checkbox"]')].map((control) => ({
            name: control.name,
            width: control.getBoundingClientRect().width,
            height: control.getBoundingClientRect().height,
            accentColor: getComputedStyle(control).accentColor,
            label: control.closest("label")?.innerText.trim()
          }))
        };
      })())`,
      returnByValue: true
    });
    const formState = JSON.parse(formResult.result.value);
    if (!formState.found) errors.push(`private beta ${viewport.label}: application form is missing`);
    if (formState.initialValid) errors.push(`private beta ${viewport.label}: empty required application unexpectedly validates`);
    if (!formState.invalidEmailRejected) errors.push(`private beta ${viewport.label}: invalid email was not rejected`);
    if (!formState.completeValid) errors.push(`private beta ${viewport.label}: complete synthetic application did not validate`);
    if (formState.action || formState.method) errors.push(`private beta ${viewport.label}: form unexpectedly declares a network submission target`);
    for (const control of formState.controlStyles || []) {
      const boundaryRatio = contrastRatio(control.borderColor, control.backgroundColor);
      if (boundaryRatio < 3) {
        errors.push(`private beta ${viewport.label}: ${control.name} boundary is ${boundaryRatio.toFixed(2)}:1`);
      }
      if (control.placeholder) {
        const placeholderRatio = contrastRatio(control.placeholderColor, control.backgroundColor);
        if (placeholderRatio < 4.5) {
          errors.push(`private beta ${viewport.label}: ${control.name} placeholder is ${placeholderRatio.toFixed(2)}:1`);
        }
      }
    }
    const focusRatio = contrastRatio(formState.focusState.outlineColor, "rgb(255, 255, 255)");
    if (
      formState.focusState.outlineStyle === "none"
      || formState.focusState.outlineWidth === "0px"
      || focusRatio < 3
    ) {
      errors.push(`private beta ${viewport.label}: form focus indication is not clearly visible (${focusRatio.toFixed(2)}:1)`);
    }
    const disabledBoundaryRatio = contrastRatio(formState.disabledState.borderColor, "rgb(255, 255, 255)");
    const disabledTextRatio = contrastRatio(formState.disabledState.color, formState.disabledState.backgroundColor);
    if (
      !formState.disabledState.disabled
      || formState.disabledState.cursor !== "not-allowed"
      || formState.disabledState.opacity !== "1"
      || disabledBoundaryRatio < 3
      || disabledTextRatio < 4.5
    ) {
      errors.push(`private beta ${viewport.label}: disabled form state is not understandable`);
    }
    const errorBoundaryRatio = contrastRatio(formState.errorState.borderColor, formState.errorState.backgroundColor);
    if (errorBoundaryRatio < 3 || formState.errorState.borderColor === formState.controlStyles[1]?.borderColor) {
      errors.push(`private beta ${viewport.label}: error form state is not distinct (${errorBoundaryRatio.toFixed(2)}:1)`);
    }
    const submitTextRatio = contrastRatio(formState.submitState.color, formState.submitState.backgroundColor);
    const submitBoundaryRatio = contrastRatio(formState.submitState.borderColor, "rgb(255, 255, 255)");
    if (submitTextRatio < 4.5 || submitBoundaryRatio < 3) {
      errors.push(`private beta ${viewport.label}: application button contrast is insufficient`);
    }
    if (
      formState.checkboxes?.length !== 2
      || formState.checkboxes.some((control) => (
        control.width < 19
        || control.height < 19
        || control.accentColor !== "rgb(198, 83, 13)"
        || !control.label
      ))
    ) {
      errors.push(`private beta ${viewport.label}: checkbox controls are not visibly labeled and understandable`);
    }

    const preparedResult = await send("Runtime.evaluate", {
      expression: `JSON.stringify((() => {
        const form = document.querySelector("[data-beta-application]");
        document.addEventListener("click", (event) => {
          if (event.target.closest?.("[data-beta-mailto]")) event.preventDefault();
        }, true);
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: async (text) => { window.__copiedApplication = text; } }
        });
        form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
        const fallback = form.querySelector("[data-beta-fallback]");
        const prepared = form.querySelector("[data-beta-prepared]");
        const mailto = form.querySelector("[data-beta-mailto]");
        const status = form.querySelector("[data-beta-form-status]");
        const copyStatus = form.querySelector("[data-beta-copy-status]");
        const mailtoUrl = new URL(mailto.href);
        const expectedAttribution = [...new URLSearchParams(location.search).entries()]
          .filter(([key]) => key.startsWith("utm_"))
          .map(([key, value]) => key + "=" + value);
        return {
          fallbackVisible: !fallback.hidden && fallback.getBoundingClientRect().height > 0,
          fallbackText: fallback.innerText,
          prepared: prepared.value,
          preparedReadOnly: prepared.readOnly,
          statusText: status.textContent,
          statusRole: status.getAttribute("role"),
          statusLive: status.getAttribute("aria-live"),
          copyButtonType: form.querySelector("[data-beta-copy]").type,
          copyStatusRole: copyStatus.getAttribute("role"),
          copyStatusLive: copyStatus.getAttribute("aria-live"),
          recipient: mailtoUrl.pathname,
          subject: mailtoUrl.searchParams.get("subject"),
          body: mailtoUrl.searchParams.get("body"),
          attributionPresent: expectedAttribution.every((item) => prepared.value.includes(item))
        };
      })())`,
      returnByValue: true
    });
    const preparedState = JSON.parse(preparedResult.result.value);
    for (const requiredText of [
      "To: admin@mcphersonai.com",
      "Subject: Observa v0.6 Private Beta Application",
      "Name: Synthetic Tester",
      "Email: synthetic@example.invalid",
      "Role: Operator",
      "OpenClaw agents: 1",
      "Workflow and review goal:",
      "Boundary acknowledged: Yes"
    ]) {
      if (!preparedState.prepared.includes(requiredText)) {
        errors.push(`private beta ${viewport.label}: prepared application omitted ${requiredText}`);
      }
    }
    if (
      !preparedState.fallbackVisible
      || !preparedState.fallbackText.includes("admin@mcphersonai.com")
      || !preparedState.preparedReadOnly
      || preparedState.copyButtonType !== "button"
      || preparedState.recipient !== "admin@mcphersonai.com"
      || !preparedState.subject?.includes("Synthetic Tester")
      || !preparedState.body?.includes("Workflow and review goal:")
      || !preparedState.attributionPresent
    ) {
      errors.push(`private beta ${viewport.label}: prepared-email fallback is incomplete`);
    }
    if (
      preparedState.statusText.includes("opening")
      || !preparedState.statusText.includes("prepared for your email app")
      || preparedState.statusRole !== "status"
      || preparedState.statusLive !== "polite"
      || preparedState.copyStatusRole !== "status"
      || preparedState.copyStatusLive !== "polite"
    ) {
      errors.push(`private beta ${viewport.label}: application/copy status is not honest and accessible`);
    }

    await send("Runtime.evaluate", {
      expression: `document.querySelector("[data-beta-copy]").focus()`,
      returnByValue: true
    });
    await pressEnter();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const copySuccessResult = await send("Runtime.evaluate", {
      expression: `JSON.stringify({
        copied: window.__copiedApplication,
        prepared: document.querySelector("[data-beta-prepared]").value,
        status: document.querySelector("[data-beta-copy-status]").textContent,
        state: document.querySelector("[data-beta-copy-status]").dataset.state
      })`,
      returnByValue: true
    });
    const copySuccessState = JSON.parse(copySuccessResult.result.value);
    if (
      copySuccessState.copied !== copySuccessState.prepared
      || !copySuccessState.status.includes("Application copied")
      || copySuccessState.state !== "success"
    ) {
      errors.push(`private beta ${viewport.label}: keyboard copy success was not complete or announced`);
    }

    await send("Runtime.evaluate", {
      expression: `(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: async () => { throw new Error("synthetic clipboard failure"); } }
        });
        document.execCommand = () => false;
        document.querySelector("[data-beta-copy]").focus();
      })()`,
      returnByValue: true
    });
    await pressEnter();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const copyFailureResult = await send("Runtime.evaluate", {
      expression: `JSON.stringify({
        status: document.querySelector("[data-beta-copy-status]").textContent,
        state: document.querySelector("[data-beta-copy-status]").dataset.state
      })`,
      returnByValue: true
    });
    const copyFailureState = JSON.parse(copyFailureResult.result.value);
    if (!copyFailureState.status.includes("Copy failed") || copyFailureState.state !== "error") {
      errors.push(`private beta ${viewport.label}: keyboard copy failure was not accessibly announced`);
    }
  }

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
    errors.push(`${route} ${viewport.label}: first Tab did not focus the skip link`);
  }
  if (focusState.outlineStyle === "none" || focusState.outlineWidth === "0px") {
    errors.push(`${route} ${viewport.label}: focused skip link has no visible outline`);
  }
  await pressEnter();
  const skipped = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      hash: location.hash,
      targetExists: Boolean(document.querySelector("#main"))
    })`,
    returnByValue: true
  });
  const skippedState = JSON.parse(skipped.result.value);
  if (!skippedState.targetExists || skippedState.hash !== "#main") {
    errors.push(`${route} ${viewport.label}: skip link did not reach #main`);
  }

  if (route === "/observa") {
    const schemaResult = await send("Runtime.evaluate", {
      expression: `(async () => {
        const link = document.querySelector('a[href="/observa-audit-mode-schema-v0.1"]');
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
    const normalResult = await send("Runtime.evaluate", {
      expression: `JSON.stringify((() => {
        const panel = [...document.querySelectorAll(".boundary-panel")]
          .find((element) => element.querySelector("h3")?.textContent.trim() === "Evidence, not hype");
        const link = panel?.querySelector(".resource-links a");
        if (!panel || !link) return { found: false };
        document.documentElement.style.scrollBehavior = "auto";
        link.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
        const style = getComputedStyle(link);
        const background = getComputedStyle(link.closest(".section.navy")).backgroundColor;
        const rect = link.getBoundingClientRect();
        return {
          found: true,
          text: panel.textContent,
          color: style.color,
          decoration: style.textDecorationLine,
          decorationThickness: style.textDecorationThickness,
          background,
          center: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        };
      })())`,
      returnByValue: true
    });
    const proofState = JSON.parse(normalResult.result.value);
    if (!proofState.found) {
      errors.push(`QSR ${viewport.label}: Evidence, not hype panel is missing`);
    } else if (!proofState.text.includes("surpassed 5,000 cumulative downloads")) {
      errors.push(`QSR ${viewport.label}: 5,000+ adoption statement is missing`);
    }
    if (proofState.found && (
      !proofState.text.includes("as of July 2026")
      || !proofState.text.includes("dated company-tracked milestone")
      || !proofState.text.includes("not a live counter")
      || !proofState.text.includes("not a live counter or a count of unique users")
    )) {
      errors.push(`QSR ${viewport.label}: company-tracked evidence boundary is incomplete`);
    }
    if (proofState.found && (
      proofState.text.includes("latest dated proof states")
      || proofState.text.includes("crossed 3,000")
    )) {
      errors.push(`QSR ${viewport.label}: stale current-facing 3,000 claim remains`);
    }
    if (proofState.found && (
      proofState.color !== "rgb(255, 154, 77)"
      || proofState.background !== "rgb(10, 23, 45)"
      || !proofState.decoration.includes("underline")
      || proofState.decorationThickness !== "2px"
    )) {
      errors.push(`QSR ${viewport.label}: dark-section proof link normal treatment is incorrect`);
    }

    if (proofState.center) {
      await send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: proofState.center.x,
        y: proofState.center.y
      });
      const hoverResult = await send("Runtime.evaluate", {
        expression: `JSON.stringify((() => {
          const link = document.querySelector(".section.navy .resource-links a");
          const style = getComputedStyle(link);
          return { color: style.color, decoration: style.textDecorationLine, thickness: style.textDecorationThickness };
        })())`,
        returnByValue: true
      });
      const hoverState = JSON.parse(hoverResult.result.value);
      if (
        hoverState.color !== "rgb(255, 201, 159)"
        || !hoverState.decoration.includes("underline")
        || hoverState.thickness !== "3px"
      ) {
        errors.push(
          `QSR ${viewport.label}: dark-section proof link hover treatment is incorrect `
          + `(${hoverState.color}, ${hoverState.decoration}, ${hoverState.thickness})`
        );
      }

      const focusResult = await send("Runtime.evaluate", {
        expression: `JSON.stringify((() => {
          const link = document.querySelector(".section.navy .resource-links a");
          link.focus();
          const style = getComputedStyle(link);
          return {
            color: style.color,
            decoration: style.textDecorationLine,
            thickness: style.textDecorationThickness,
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth
          };
        })())`,
        returnByValue: true
      });
      const darkFocusState = JSON.parse(focusResult.result.value);
      if (
        darkFocusState.color !== "rgb(255, 201, 159)"
        || !darkFocusState.decoration.includes("underline")
        || darkFocusState.thickness !== "3px"
        || darkFocusState.outlineStyle === "none"
        || darkFocusState.outlineWidth === "0px"
      ) {
        errors.push(`QSR ${viewport.label}: dark-section proof link focus-visible treatment is incorrect`);
      }
    }
  }

  if (routePath === "/private-beta" && viewport.width <= 768) {
    const before = await send("Runtime.evaluate", {
      expression: `JSON.stringify({
        expanded: document.querySelector("[data-nav-toggle]").getAttribute("aria-expanded"),
        display: getComputedStyle(document.querySelector("#primary-nav")).display
      })`,
      returnByValue: true
    });
    const beforeState = JSON.parse(before.result.value);
    if (beforeState.expanded !== "false" || beforeState.display !== "none") {
      errors.push(`mobile navigation ${viewport.label}: expected closed initial state`);
    }

    for (const selector of [
      'input[name="openclaw"]',
      'textarea[name="goal"]',
      'select[name="role"]',
      "[data-beta-copy]"
    ]) {
      await send("Runtime.evaluate", {
        expression: `(() => {
          const toggle = document.querySelector("[data-nav-toggle]");
          const nav = document.querySelector("#primary-nav");
          nav.dataset.open = "false";
          toggle.setAttribute("aria-expanded", "false");
          document.querySelector(${JSON.stringify(selector)}).focus();
        })()`,
        returnByValue: true
      });
      await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
      const closedEscapeResult = await send("Runtime.evaluate", {
        expression: `JSON.stringify({
          sameControl: document.activeElement === document.querySelector(${JSON.stringify(selector)}),
          expanded: document.querySelector("[data-nav-toggle]").getAttribute("aria-expanded"),
          open: document.querySelector("#primary-nav").dataset.open
        })`,
        returnByValue: true
      });
      const closedEscapeState = JSON.parse(closedEscapeResult.result.value);
      if (
        !closedEscapeState.sameControl
        || closedEscapeState.expanded !== "false"
        || closedEscapeState.open !== "false"
      ) {
        errors.push(`mobile navigation ${viewport.label}: closed-menu Escape stole focus from ${selector}`);
      }
    }

    await send("Runtime.evaluate", {
      expression: `document.querySelector("[data-nav-toggle]").focus()`,
      returnByValue: true
    });
    await pressEnter();
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
      || openState.links !== 8
    ) {
      errors.push(`mobile navigation ${viewport.label}: keyboard toggle did not expose all eight links`);
    }

    await send("Runtime.evaluate", {
      expression: `document.querySelector("#primary-nav a").focus()`,
      returnByValue: true
    });
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
    const closed = await send("Runtime.evaluate", {
      expression: `JSON.stringify({
        expanded: document.querySelector("[data-nav-toggle]").getAttribute("aria-expanded"),
        toggleFocused: document.activeElement === document.querySelector("[data-nav-toggle]")
      })`,
      returnByValue: true
    });
    const closedState = JSON.parse(closed.result.value);
    if (closedState.expanded !== "false") {
      errors.push(`mobile navigation ${viewport.label}: Escape did not close the open menu`);
    }
    if (!closedState.toggleFocused) {
      errors.push(`mobile navigation ${viewport.label}: focus did not return after Escape actually closed the menu`);
    }

    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab" });
    const tabResult = await send("Runtime.evaluate", {
      expression: `document.activeElement !== document.querySelector("[data-nav-toggle]")`,
      returnByValue: true
    });
    if (!tabResult.result.value) errors.push(`mobile navigation ${viewport.label}: keyboard focus is trapped on the toggle`);
  }

  totals.consoleErrors += consoleErrors.length;
  totals.exceptions += exceptions.length;
  totals.browserLogErrors += browserLogErrors.length;
  totals.failedRequiredAssets += failedRequiredAssets.length;
  if (consoleErrors.length) errors.push(`${route} ${viewport.label}: console error(s): ${consoleErrors.join(" | ")}`);
  if (exceptions.length) errors.push(`${route} ${viewport.label}: JavaScript exception(s): ${exceptions.join(" | ")}`);
  if (browserLogErrors.length) errors.push(`${route} ${viewport.label}: browser log error(s): ${browserLogErrors.join(" | ")}`);
  if (failedRequiredAssets.length) {
    errors.push(`${route} ${viewport.label}: failed required asset(s): ${failedRequiredAssets.join(" | ")}`);
  }

  socket.close();
  await fetch(`http://127.0.0.1:${debugPort}/json/close/${target.id}`);
}

for (const viewport of viewports) {
  for (const route of routes) {
    await inspectPage(route, viewport);
  }
}

if (darkCalloutLabels.size !== 7) {
  errors.push(`dark-callout coverage found ${darkCalloutLabels.size} unique eyebrow labels; expected 7`);
}

if (errors.length) {
  console.error(`Browser audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Browser audit passed: ${routes.length} routes across ${viewports.length} viewports `
  + `(${viewports.map((viewport) => `${viewport.width}x${viewport.height}`).join(", ")}); `
  + `${darkCalloutLabels.size} dark-callout labels; favicon/icon and query-preserving redirect assertions; `
  + "tracked funnel attribution; form boundary, placeholder, focus, disabled, error, validation, and button checks; "
  + "honest mailto fallback with keyboard copy success/failure announcements; closed/open Escape focus behavior; "
  + `console errors ${totals.consoleErrors}, JavaScript exceptions ${totals.exceptions}, browser log errors `
  + `${totals.browserLogErrors}, failed required assets ${totals.failedRequiredAssets}; `
  + "working skip links, accessible labels/headings, dark-link states, and no horizontal overflow or viewport clipping."
);
