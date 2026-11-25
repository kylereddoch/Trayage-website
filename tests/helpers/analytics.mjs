import { readFile } from 'node:fs/promises';
import site from '../../src/_data/site.json' with {type:'json'};

// Public provider script captured Nov 25, 2026 with the production Referer and
// ?events&beacon. Contract fixture only: every request below is intercepted.
const provider = await readFile(new URL('../fixtures/tinylytics-2026-11-25.js', import.meta.url), 'utf8');
export async function isolatedProduction(page, { blocked = false, fallback = false, ignored = false, transformHtml = body => body } = {}) {
  const events = [];
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'tinylytics.app') {
      if (url.pathname.startsWith('/collector/')) {
        events.push(Object.fromEntries(url.searchParams));
        return route.fulfill({ status: 200, body: '' });
      }
      return blocked ? route.abort() : route.fulfill({ contentType: 'application/javascript', body: provider });
    }
    if (url.origin === site.origin) {
      const path = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
      try {
        const body = await readFile(new URL(`../../dist-root${path}`, import.meta.url));
        const contentType = path.endsWith('.js') ? 'application/javascript' : path.endsWith('.html') ? 'text/html' : path.endsWith('.css') ? 'text/css' : 'application/octet-stream';
        return route.fulfill({ contentType, body: path.endsWith('.html') ? transformHtml(body.toString(), url) : body });
      } catch { return route.fulfill({status:404, body:''}); }
    }
    return route.abort();
  });
  await page.addInitScript(({ignored, fallback}) => {
    if (ignored) localStorage.setItem('tinylytics_ignore', 'true');
    if (fallback) navigator.sendBeacon = () => false;
  }, {ignored, fallback});
  return events;
}
