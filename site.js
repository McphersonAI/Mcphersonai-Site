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
})();
