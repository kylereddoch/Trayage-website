import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import render, { data } from '../src/llms.11ty.js';

test('LLM index follows release data and excludes draft and private guides', async () => {
  const site = JSON.parse(await readFile('src/_data/site.json', 'utf8'));
  const releases = JSON.parse(await readFile('src/_data/releases.json', 'utf8'));
  const guide = { date: new Date(), data: { article: true, category: 'Guides', title: 'Public guide', path: 'blog/public/' } };
  const collections = { sitePages: [guide, { ...guide, data: { ...guide.data, draft: true, title: 'Secret draft' } }, { ...guide, data: { ...guide.data, noindex: true, title: 'Private guide' } }] };
  const renderWith = () => render({ site, releases, base: '/', collections });
  expect(renderWith()).toContain('[Public guide](https://trayage.app/blog/public/)');
  expect(renderWith()).not.toMatch(/Secret draft|Private guide/);
  site.pricing.oneTimeUSD = '19.99';
  site.pricing.directDeviceLimit = 2;
  site.checkoutEnabled = false;
  releases.direct.version = '2.0';
  releases.appStore.status = 'preparing';
  expect(renderWith()).toContain('Direct edition: Available, version 2.0');
  expect(renderWith()).toContain('US$19.99 once; new license purchases are still being finalized; up to 2 active Macs');
  expect(renderWith()).toContain('Mac App Store edition: In preparation; not publicly available');
  site.publicationApproved = false;
  expect(data.permalink({ site })).toBe(false);
  expect(renderWith()).toBe('');
});

for (const [port, base] of [[4175, '/'], [4176, '/Trayage-website/']]) {
  test(`LLM index at ${base} is discoverable and links only to published pages`, async ({ request }) => {
    const host = `http://127.0.0.1:${port}`;
    const response = await request.get(`${host}${base}llms.txt`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    const text = await response.text();
    expect(text).toMatch(/^# Trayage\n/);
    const sitemap = await (await request.get(`${host}${base}sitemap.xml`)).text();
    for (const [, url] of text.matchAll(/\]\((https:\/\/[^)]+)\)/g)) {
      expect(sitemap).toContain(`<loc>${url}</loc>`);
      expect((await request.get(host + new URL(url).pathname)).status()).toBe(200);
    }
    const home = await (await request.get(host + base)).text();
    expect(home).toContain(`rel="describedby" type="text/plain" href="${base}llms.txt"`);
    expect(sitemap).not.toContain(`${base}llms.txt</loc>`);
  });
}
