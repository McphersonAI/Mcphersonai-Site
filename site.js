(function () {
  'use strict';
  document.documentElement.classList.add('js');
  document.querySelectorAll('[data-current-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  // Preserve the old technical-access campaign without turning it into a sale.
  const query = new URLSearchParams(window.location.search);
  if (['/contact', '/contact.html'].includes(window.location.pathname)
      && query.get('utm_campaign') === 'governance-v6-shadow-beta') {
    const destination = new URL('/getting-started', window.location.origin);
    destination.search = window.location.search;
    destination.hash = 'access';
    window.location.replace(destination);
    return;
  }

  document.querySelectorAll('[data-nav-toggle]').forEach((button) => {
    const nav = document.getElementById(button.getAttribute('aria-controls'));
    if (!nav) return;
    const close = () => {
      nav.dataset.open = 'false';
      button.setAttribute('aria-expanded', 'false');
    };
    button.addEventListener('click', () => {
      const open = nav.dataset.open !== 'true';
      nav.dataset.open = String(open);
      button.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.dataset.open === 'true') {
        close();
        button.focus();
      }
    });
  });

})();
