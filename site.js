(function () {
  "use strict";

  document.documentElement.classList.add("js");

  const status = window.MCPHERSON_RELEASE_STATUS || {};

  document.querySelectorAll("[data-release-text]").forEach(function (element) {
    const key = element.getAttribute("data-release-text");
    if (Object.prototype.hasOwnProperty.call(status, key)) {
      element.textContent = String(status[key]);
    }
  });

  document.querySelectorAll("[data-release-href]").forEach(function (element) {
    const key = element.getAttribute("data-release-href");
    if (status[key]) {
      element.setAttribute("href", status[key]);
    }
  });

  document.querySelectorAll("[data-proof-text]").forEach(function (element) {
    const key = element.getAttribute("data-proof-text");
    if (status.verifiedProof && Object.prototype.hasOwnProperty.call(status.verifiedProof, key)) {
      element.textContent = String(status.verifiedProof[key]);
    }
  });

  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = String(new Date().getFullYear());
  });

  const currentQuery = new URLSearchParams(window.location.search);
  const isGovernanceBetaCampaign = currentQuery.get("utm_campaign") === "governance-v6-shadow-beta";
  const isLegacyContactPath = ["/contact", "/contact.html"].includes(window.location.pathname);
  if (isGovernanceBetaCampaign && isLegacyContactPath) {
    const betaUrl = new URL("/private-beta", window.location.origin);
    betaUrl.search = window.location.search;
    betaUrl.hash = "apply";
    window.location.replace(betaUrl);
    return;
  }

  document.querySelectorAll("[data-nav-toggle]").forEach(function (button) {
    const navId = button.getAttribute("aria-controls");
    const nav = document.getElementById(navId);
    if (!nav) return;

    function closeNav() {
      nav.dataset.open = "false";
      button.setAttribute("aria-expanded", "false");
    }

    button.addEventListener("click", function () {
      const willOpen = nav.dataset.open !== "true";
      nav.dataset.open = String(willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
    });

    nav.addEventListener("click", function (event) {
      if (event.target instanceof HTMLAnchorElement) closeNav();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeNav();
        button.focus();
      }
    });
  });

  document.querySelectorAll("[data-beta-application]").forEach(function (form) {
    const statusMessage = form.querySelector("[data-beta-form-status]");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const query = new URLSearchParams(window.location.search);
      const attribution = ["utm_source", "utm_medium", "utm_campaign", "utm_content"]
        .map(function (key) {
          const attributionValue = query.get(key);
          return attributionValue ? key + "=" + attributionValue : "";
        })
        .filter(Boolean);
      const source = attribution.join("; ") || query.get("source") || "Website";
      const value = function (key) {
        return String(data.get(key) || "").trim();
      };
      const lines = [
        "Observa / McPherson Governance v0.6 Private Beta Application",
        "",
        "Name: " + value("name"),
        "Email: " + value("email"),
        "Company or project: " + (value("company") || "Not provided"),
        "Role: " + value("role"),
        "OpenClaw agents: " + value("agents"),
        "OpenClaw version or channel: " + (value("openclaw") || "Not provided"),
        "Open to design-partner conversation: " + (value("design_partner") || "No"),
        "Application source: " + source,
        "",
        "Workflow and review goal:",
        value("goal"),
        "",
        "Boundary acknowledged: " + value("boundary_acknowledged")
      ];
      const subject = "Observa v0.6 Private Beta Application — " + value("name");
      const mailto = "mailto:admin@mcphersonai.com?subject="
        + encodeURIComponent(subject)
        + "&body="
        + encodeURIComponent(lines.join("\n"));

      if (statusMessage) {
        statusMessage.textContent = "Your mail app is opening. Review the application before sending it to Blake.";
      }
      window.location.href = mailto;
    });
  });
})();
