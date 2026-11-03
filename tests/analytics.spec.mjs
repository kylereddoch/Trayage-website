import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import site from '../src/_data/site.json' with {type:'json'};
import releases from '../src/_data/releases.json' with {type:'json'};

// Public provider script captured Nov 3, 2026 with the production Referer and
// ?events&beacon. Contract fixture only: every request below is intercepted.
const provider = await readFile(new URL('./fixtures/tinylytics-2026-11-03.js', import.meta.url), 'utf8');
async function isolatedProduction(page, { blocked = false, fallback = false, ignored = false } = {}) {
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
        const body = await readFile(new URL(`../dist-root${path}`, import.meta.url));
        const contentType = path.endsWith('.js') ? 'application/javascript' : path.endsWith('.html') ? 'text/html' : path.endsWith('.css') ? 'text/css' : 'application/octet-stream';
        return route.fulfill({ contentType, body });
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
async function playback(page) {
  await page.locator('video').evaluate(video => {
    Object.defineProperty(video, 'duration', {configurable:true, value:38});
    Object.defineProperty(video, 'played', {configurable:true, value:{length:1,start:()=>0,end:()=>20}});
    video.dispatchEvent(new Event('playing'));
    video.dispatchEvent(new Event('playing'));
    video.dispatchEvent(new Event('timeupdate'));
    video.dispatchEvent(new Event('timeupdate'));
    video.dispatchEvent(new Event('ended'));
    video.dispatchEvent(new Event('ended'));
  });
}

test('local root and project-path previews never load the production embed or collector', async ({page}) => {
  const requests = [];
  await page.route('https://tinylytics.app/**', route => {requests.push(route.request().url()); return route.abort();});
  for (const base of ['http://127.0.0.1:4175/', 'http://127.0.0.1:4176/Trayage-website/']) {
    await page.goto(base);
    await page.locator('.hero-actions .button').click();
    await expect(page.locator('#direct a[data-tinylytics-event="file.download"]')).toHaveAttribute('data-tinylytics-event-value', `${releases.direct.url.split('/').pop()}:direct-card`);
    await expect(page.locator('[data-tinylytics-event="store.view"]')).toHaveAttribute('data-tinylytics-event-value', 'mac-app-store:app-store-card');
    await expect(page.locator('[data-tinylytics-event="purchase.checkout"]')).toHaveAttribute('data-tinylytics-event-value', 'direct:direct-card');
    await expect(page.locator('[data-tinylytics-event="beta.view"]')).toHaveAttribute('data-tinylytics-event-value', 'testflight:beta-card');
    await page.goto(base);
    await playback(page);
    await expect(page.locator('script[src^="https://tinylytics.app/"]')).toHaveCount(0);
  }
  expect(requests).toEqual([]);
});

for (const fallback of [false, true]) {
  test(`isolated provider contract: one view, nested CTA click, video deduplication (fetch fallback ${fallback})`, async ({page}) => {
    const hits = await isolatedProduction(page, {fallback});
    await page.goto(`${site.origin}/?utm_source=testdrive&utm_medium=community&utm_campaign=trayage_review_2026_11`);
    await expect.poll(() => hits.length).toBe(1);
    expect(hits[0].url).toContain('utm_source=testdrive');
    await expect(page.locator('.header-cta')).toHaveAttribute('data-tinylytics-event-value', 'download-page:header');
    await expect(page.locator('.pricing-action a')).toHaveAttribute('data-tinylytics-event-value', 'download-page:pricing');
    await expect(page.locator('.start-strip > a')).toHaveAttribute('data-tinylytics-event-value', 'download-page:closing');
    // Cancel navigation after Tinylytics' capture handler to inspect its payload.
    await page.evaluate(() => document.addEventListener('click', event => event.preventDefault()));
    await page.locator('.hero-actions .button span').click();
    await expect.poll(() => hits.filter(hit => hit.event === 'download.intent').length).toBe(1);
    expect(hits.find(hit => hit.event === 'download.intent').event_value).toBe('download-page:hero');
    // A seek to the end with only 2 seconds actually played is not half watched.
    await page.locator('video').evaluate(video => {
      Object.defineProperty(video, 'duration', {configurable:true, value:38});
      Object.defineProperty(video, 'played', {configurable:true, value:{length:1,start:()=>36,end:()=>38}});
      video.dispatchEvent(new Event('playing'));
      video.dispatchEvent(new Event('timeupdate'));
    });
    await expect.poll(() => hits.filter(hit => hit.event === 'video.start').length).toBe(1);
    expect(hits.some(hit => hit.event === 'video.half')).toBe(false);
    await playback(page);
    await expect.poll(() => hits.filter(hit => hit.event?.startsWith('video.')).length).toBe(3);
    expect(hits.filter(hit => hit.event?.startsWith('video.')).map(hit => hit.event).sort()).toEqual(['video.end','video.half','video.start']);
    expect(hits.filter(hit => !hit.event)).toHaveLength(1);
    expect(await page.evaluate(() => ({local:localStorage.length, session:sessionStorage.length}))).toEqual({local:0,session:0});
  });
}

for (const mode of ['blocked','ignored','query-ignore']) {
  test(`video and page view respect ${mode}`, async ({page}) => {
    const hits = await isolatedProduction(page, {blocked:mode==='blocked', ignored:mode==='ignored'});
    await page.goto(`${site.origin}/${mode==='query-ignore'?'?ti=true':''}`);
    await playback(page);
    expect(hits).toEqual([]);
    if (mode !== 'blocked') await expect(page.locator('script[src^="https://tinylytics.app/"]')).toHaveCount(0);
  });
}
