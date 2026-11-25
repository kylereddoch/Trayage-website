// A placement identifies a public link, never a visitor. Carry it in navigation
// URLs only: no cookies, browser storage, inferred referrers, or app identity.
(() => {
  const config = document.currentScript;
  if (!config || location.origin !== config.dataset.attributionOrigin) return;
  let placements, checkout;
  try {
    placements = JSON.parse(config.dataset.attributionPlacements);
    checkout = new URL(config.dataset.attributionCheckout);
    if (checkout.origin !== 'https://buy.stripe.com') return;
  } catch { return; }
  const fields = ['source', 'medium', 'campaign', 'content'];
  const query = new URLSearchParams(location.search);
  const keys = ['via', 'ref', ...fields.map(field => `utm_${field}`)];
  // Ambiguous or unregistered labels must not become payment attribution.
  if (keys.some(key => query.getAll(key).length > 1)) return;
  let id;
  if (query.has('via')) {
    const value = query.get('via');
    if (Object.hasOwn(placements, value)) id = value;
  } else if (fields.some(field => query.has(`utm_${field}`))) {
    id = Object.keys(placements).find(key => fields.every(field =>
      query.get(`utm_${field}`) === placements[key][field]));
  } else if (query.has('ref')) {
    id = Object.keys(placements).find(key => placements[key].refs?.includes(query.get('ref')));
  }
  if (!id || !/^[a-z0-9_-]{1,80}$/.test(id)) return;

  const originals = [...document.querySelectorAll('a[href]')].map(link => ({
    link, href: link.getAttribute('href'), value: link.getAttribute('data-tinylytics-event-value')
  }));
  const measuredActions = new Set(['download.intent', 'file.download', 'store.view', 'purchase.checkout', 'beta.view']);
  function apply() {
    // Restore plain links if this page returns from the back/forward cache after
    // the visitor opted out elsewhere. Do not clear someone else's storage.
    for (const {link, href, value} of originals) {
      link.setAttribute('href', href);
      if (value !== null) link.setAttribute('data-tinylytics-event-value', value);
    }
    const ignore = query.get('tiny_ignore') || query.get('ti');
    if (ignore === 'true') return;
    try {
      if (ignore !== 'false' && localStorage.getItem('tinylytics_ignore') !== null) return;
    } catch { return; }

    for (const {link, href, value} of originals) {
      let target;
      try { target = new URL(href, location.href); } catch { continue; }
      const isCheckout = target.origin === checkout.origin && target.pathname === checkout.pathname;
      if (isCheckout) {
        // A separately configured reference may belong to another integration.
        if (!target.searchParams.has('client_reference_id')) {
          target.searchParams.set('client_reference_id', id);
          link.href = target.href;
        }
      } else if (target.origin === location.origin && target.pathname.startsWith(config.dataset.attributionBase)
        && !href.startsWith('#') && !link.hasAttribute('download')
        && (target.pathname.endsWith('/') || target.pathname.endsWith('.html'))
        && !keys.some(key => target.searchParams.has(key))
        && !target.searchParams.has('tiny_ignore') && !target.searchParams.has('ti')) {
        // Leave UTMs on the landing page. Only the placement travels internally,
        // so every subsequent page is not presented as a new campaign landing.
        target.searchParams.set('via', id);
        link.href = `${target.pathname}${target.search}${target.hash}`;
      }
      if (value !== null && measuredActions.has(link.dataset.tinylyticsEvent)) {
        link.dataset.tinylyticsEventValue = `${value}|via:${id}`;
      }
    }
  }
  apply();
  window.addEventListener('pageshow', event => { if (event.persisted) apply(); });
})();
