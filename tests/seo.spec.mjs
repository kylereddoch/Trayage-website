import { test, expect } from '@playwright/test';
import site from '../src/_data/site.json' with { type: 'json' };
import releases from '../src/_data/releases.json' with { type: 'json' };
import { layout } from '../src/layout.mjs';

const routes = ['', 'download/', 'support/', 'roadmap/', 'changelog/', 'media-kit/', 'privacy/', 'terms/', 'refunds/', 'blog/', 'blog/guides/', 'blog/product-news/', 'blog/clean-up-mac-downloads/', 'blog/can-you-delete-dmg-files/', 'blog/introducing-trayage/'];
for (const [port, base] of [[4175, '/'], [4176, '/Trayage-website/']]) {
  test(`SEO at ${base}: all public pages expose consistent server-rendered metadata`, async ({ browser, request }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const titles = new Set();
    const descriptions = new Set();
    try {
      for (const path of routes) {
        await page.goto(`http://127.0.0.1:${port}${base}${path}`);
        const canonical = `${site.origin}${base}${path}`;
        const title = await page.title();
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(title.length).toBeGreaterThan(10);
        expect(title.length).toBeLessThanOrEqual(65);
        expect(description.length).toBeGreaterThan(60);
        expect(description).not.toMatch(/currently in development|undefined/i);
        titles.add(title); descriptions.add(description);
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
        await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
        for (const name of ['og:title', 'twitter:title']) await expect(page.locator(`meta[property="${name}"], meta[name="${name}"]`)).toHaveAttribute('content', title);
        for (const name of ['og:description', 'twitter:description']) await expect(page.locator(`meta[property="${name}"], meta[name="${name}"]`)).toHaveAttribute('content', description);
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${site.origin}${base}${site.seo.image}`);
        await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', `${site.origin}${base}${site.seo.image}`);
        await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', site.seo.imageAlt);
        await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large');
        const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
        expect(schema['@context']).toBe('https://schema.org');
        const graph = schema['@graph'];
        const publisher = graph.find(node => node['@type'] === 'Person');
        expect(publisher.name).toBe('Kyle Reddoch');
        expect(graph.some(node => node['@type'] === 'Organization')).toBe(false);
        const webpage = graph.find(node => ['WebPage', 'ContactPage'].includes(node['@type']));
        expect(webpage.url).toBe(canonical);
        expect(webpage.description).toBe(description);
        const app = graph.find(node => node['@type'] === 'SoftwareApplication');
        if (path === '' || path === 'download/') {
          expect(app.operatingSystem).toBe(`macOS ${releases.minimumMacOS} or later`);
          expect(app.downloadUrl).toBe(releases.direct.url);
          expect(app.offers.price).toBe(site.pricing.oneTimeUSD);
          expect(app.offers.priceCurrency).toBe('USD');
          expect(app.offers.url).toBe(`${site.origin}${base}download/`);
          expect(app.aggregateRating).toBeUndefined();
          expect(app.review).toBeUndefined();
        } else expect(app).toBeUndefined();
        if (path) {
          const crumbs = graph.find(node => node['@type'] === 'BreadcrumbList').itemListElement;
          expect(crumbs.map(crumb => crumb.item)).toEqual([`${site.origin}${base}`, canonical]);
        }
      }
      expect(titles.size).toBe(routes.length);
      expect(descriptions.size).toBe(routes.length);
      const response = await request.get(`http://127.0.0.1:${port}${base}${site.seo.image}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toBe('image/png');
      const png = await response.body();
      expect(png.readUInt32BE(16)).toBe(site.seo.imageWidth);
      expect(png.readUInt32BE(20)).toBe(site.seo.imageHeight);
      expect(png.length).toBeLessThan(1_000_000);
    } finally { await context.close(); }
  });

  test(`SEO at ${base}: sitemap matches canonical pages and missing pages stay excluded`, async ({ page, request }) => {
    const host = `http://127.0.0.1:${port}${base}`;
    const robots = await (await request.get(`${host}robots.txt`)).text();
    expect(robots).toContain(`Sitemap: ${site.origin}${base}sitemap.xml`);
    expect(robots).not.toContain('Disallow: /');
    const xml = await (await request.get(`${host}sitemap.xml`)).text();
    const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
    expect(locations.sort()).toEqual(routes.map(path => `${site.origin}${base}${path}`).sort());
    expect(new Set(locations).size).toBe(locations.length);
    const missing = await page.goto(`${host}missing-page/`);
    expect(missing.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('link[rel="canonical"], script[type="application/ld+json"]')).toHaveCount(0);
  });
}

test('SEO guards omit unpublished identities and unavailable purchase offers', async ({ page }) => {
  const render = overrides => layout({ title: 'Trayage', description: 'A Mac app.', body: '<h1>Trayage</h1>', base: '/', site, releases, ...overrides });
  for (const overrides of [{ site: { ...site, publicationApproved: false } }, { noindex: true }, { path: '404.html' }]) {
    await page.setContent(render(overrides));
    await expect(page.locator('link[rel="canonical"], meta[property="og:url"], script[type="application/ld+json"]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  }
  await page.setContent(render({ site: { ...site, checkoutEnabled: false } }));
  let graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
  expect(graph.find(node => node['@type'] === 'SoftwareApplication').offers).toBeUndefined();
  await page.setContent(render({ releases: { ...releases, direct: { ...releases.direct, status: 'preparing' } } }));
  graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
  const app = graph.find(node => node['@type'] === 'SoftwareApplication');
  expect(app.offers).toBeUndefined();
  expect(app.downloadUrl).toBeUndefined();
  expect(app.softwareVersion).toBeUndefined();
});

test('structured data safely preserves punctuation and script-like text', async ({ page }) => {
  const description = 'Review "files" & folders </script><script>window.injected = true</script>';
  await page.setContent(layout({ title: 'A "title" & more', description, body: '<h1>Trayage</h1>', base: '/', site, releases }));
  const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
  expect(graph.find(node => node['@type'] === 'WebPage').description).toBe(description);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
});
