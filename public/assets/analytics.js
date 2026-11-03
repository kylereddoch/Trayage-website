// Load the existing Tinylytics embed only on the configured public origin.
// Local previews and CI must never send page views or events to production.
(() => {
  const config = document.currentScript;
  if (!config || location.origin !== config.dataset.analyticsOrigin) return;
  const embed = new URL(config.dataset.analyticsEmbed);
  const siteId = embed.pathname.match(/^\/embed\/([a-zA-Z0-9]+)\.js$/)?.[1];
  if (embed.origin !== 'https://tinylytics.app' || !siteId) return;
  const query = new URLSearchParams(location.search);
  const ignore = query.get('tiny_ignore') || query.get('ti');
  try {
    if (ignore === 'true') localStorage.setItem('tinylytics_ignore', 'true');
    if (ignore === 'false') localStorage.removeItem('tinylytics_ignore');
    if (localStorage.getItem('tinylytics_ignore') !== null) return;
  } catch { return; }

  const script = document.createElement('script');
  script.src = embed.href;
  script.defer = true;
  // The provider handles page views and annotated clicks. This adapter sends
  // only video events through its documented public collector, never extra views.
  script.addEventListener('load', () => {
    const video = document.querySelector('.walkthrough-video');
    if (!video) return;
    const sent = new Set();
    function track(action) {
      try {
        if (localStorage.getItem('tinylytics_ignore') !== null || sent.has(action)) return;
        sent.add(action);
        const referrer = document.referrer && new URL(document.referrer).origin !== location.origin ? document.referrer : '';
        const params = new URLSearchParams({
          url: location.href, path: location.pathname, referrer,
          event: `video.${action}`, event_value: 'walkthrough-2026-10'
        });
        const endpoint = `https://tinylytics.app/collector/${siteId}?${params}`;
        let delivered = false;
        try { delivered = navigator.sendBeacon?.(endpoint) === true; } catch { /* fall back */ }
        if (!delivered) fetch(endpoint, { method: 'POST', keepalive: true }).catch(() => {});
      } catch { /* Analytics must never interrupt playback. */ }
    }
    video.addEventListener('playing', () => track('start'));
    video.addEventListener('timeupdate', () => {
      if (!sent.has('start') || !Number.isFinite(video.duration) || video.duration <= 0) return;
      let played = 0;
      for (let i = 0; i < video.played.length; i++) played += video.played.end(i) - video.played.start(i);
      if (played >= video.duration / 2) track('half');
    });
    video.addEventListener('ended', () => {
      if (sent.has('start')) track('end');
    });
  });
  document.head.append(script);
})();
