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

  document.querySelectorAll('[data-founding-application]').forEach((form) => {
    const output = form.querySelector('[data-prepared]');
    const panel = form.querySelector('[data-prepared-panel]');
    const status = form.querySelector('[data-form-status]');
    const copyStatus = form.querySelector('[data-copy-status]');
    const mailto = form.querySelector('[data-mailto]');
    let prepared = '';
    form.querySelector('[data-prepare]').disabled = false;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const fields = [...form.querySelectorAll('fieldset input, fieldset textarea, fieldset select')];
      const body = ['Founding Builder application', '', ...fields.flatMap((field) => {
        const label = form.querySelector(`label[for="${field.id}"]`).textContent.replace(/\s*\*$/, '');
        return [label + ':', field.value.trim() || 'Not provided', ''];
      }), 'I have excluded secrets and confidential client data.'].join('\n');
      const subject = 'Founding Builder application';
      prepared = `To: admin@mcphersonai.com\nSubject: ${subject}\n\n${body}`;
      output.value = prepared;
      mailto.href = `mailto:admin@mcphersonai.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      panel.hidden = false;
      status.textContent = 'Application prepared, not sent. Review the text below, then open your email app or copy the message.';
      copyStatus.textContent = '';
      output.focus();
    });
    // Editing after preparation invalidates the old message, avoiding stale submissions.
    form.addEventListener('input', (event) => {
      if (event.target === output || !prepared) return;
      prepared = '';
      output.value = '';
      panel.hidden = true;
      status.textContent = 'Details changed. Prepare the application again before sending.';
    });
    form.querySelector('[data-copy]').addEventListener('click', async () => {
      if (!prepared) return;
      try {
        await navigator.clipboard.writeText(prepared);
        copyStatus.textContent = 'Copied. Paste the application into an email to admin@mcphersonai.com.';
      } catch {
        output.focus();
        output.select();
        let copied = false;
        try { copied = document.execCommand('copy'); } catch { /* keep manual fallback */ }
        copyStatus.textContent = copied
          ? 'Copied. Paste the application into an email to admin@mcphersonai.com.'
          : 'Copy was unavailable. The message is selected; copy it manually and email admin@mcphersonai.com.';
      }
    });
  });
})();
