// Runs before CSS to avoid a flash when a visitor explicitly chose a theme.
// This is a device-local preference, not an identifier or a network request.
(() => {
  const key = 'trayage-appearance';
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => ['light', 'dark'].includes(value) ? value : 'system';
  let preference = 'system';
  try { preference = valid(localStorage.getItem(key)); } catch { /* Storage may be unavailable. */ }
  function syncControl() {
    const label = preference[0].toUpperCase() + preference.slice(1);
    const trigger = document.querySelector('.appearance-trigger');
    trigger?.setAttribute('aria-label', `Appearance: ${label}`);
    const value = document.querySelector('.appearance-value');
    if (value) value.textContent = label;
    document.querySelectorAll('[data-appearance]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.appearance === preference));
    });
  }
  function apply() {
    if (preference === 'system') root.removeAttribute('data-theme');
    else root.dataset.theme = preference;
    const dark = preference === 'dark' || (preference === 'system' && system.matches);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#191524' : '#f7f5fc');
    document.querySelectorAll('source[data-dark-source]').forEach(source => {
      source.media = dark ? 'all' : 'not all';
    });
  }
  apply();
  system.addEventListener('change', apply);
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue);
    apply();
    syncControl();
  });
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    const control = document.querySelector('.appearance-control');
    if (!control) return;
    const trigger = control.querySelector('summary');
    const options = [...control.querySelectorAll('[data-appearance]')];
    syncControl();
    control.hidden = false;
    function close(restoreFocus = false) {
      control.open = false;
      if (restoreFocus) trigger.focus();
    }
    options.forEach(button => button.addEventListener('click', () => {
      preference = valid(button.dataset.appearance);
      try {
        if (preference === 'system') localStorage.removeItem(key);
        else localStorage.setItem(key, preference);
      } catch { /* The selector still works for this page without storage. */ }
      apply();
      syncControl();
      close(true);
    }));
    control.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        control.open = true;
        const current = options.indexOf(document.activeElement);
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
          : current < 0 ? (event.key === 'ArrowUp' ? options.length - 1 : 0)
          : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options[index].focus();
      }
    });
    document.addEventListener('click', event => { if (!control.contains(event.target)) close(); });
    control.addEventListener('focusout', event => {
      if (event.relatedTarget && !control.contains(event.relatedTarget)) close();
    });
  });
})();
