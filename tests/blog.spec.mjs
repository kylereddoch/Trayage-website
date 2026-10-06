import { test, expect } from '@playwright/test';
import site from '../src/_data/site.json' with { type: 'json' };

for (const [port, base] of [[4175, '/'], [4176, '/Trayage-website/']]) {
  test(`Blog at ${base}: categories, article navigation, schema, and RSS work without JavaScript`, async ({ browser, request }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1100 }, colorScheme: 'light' });
    const page = await context.newPage();
    const host = `http://127.0.0.1:${port}${base}`;
    try {
      await page.goto(`${host}blog/`);
      await expect(page.locator('.blog-card')).toHaveCount(3);
      await expect(page.locator('.blog-featured h2')).toContainText('without losing important files');
      if (base === '/') await page.screenshot({ path: 'artifacts/blog-preview.png' });
      await page.getByRole('navigation', { name: 'Blog categories' }).getByRole('link', { name: 'Guides', exact: true }).click();
      await expect(page.locator('.blog-card')).toHaveCount(2);
      await expect(page.locator('.blog-list')).not.toContainText('Meet Trayage 1.0');
      await page.getByRole('navigation', { name: 'Blog categories' }).getByRole('link', { name: 'Product news' }).click();
      await expect(page.locator('.blog-card')).toHaveCount(1);
      await page.getByRole('link', { name: 'Read the story', exact: false }).click();
      await expect(page.locator('.article-category')).toHaveAttribute('href', `${base}blog/product-news/`);
      const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
      const article = graph.find(node => node['@type'] === 'BlogPosting');
      expect(article.articleSection).toBe('Product news');
      expect(article.datePublished).toBe('2026-10-06T00:00:00.000Z');
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
      const anchors = await page.locator('.article-toc a').evaluateAll(links => links.map(link => link.hash));
      expect(anchors.length).toBeGreaterThan(2);
      for (const anchor of anchors) await expect(page.locator(anchor)).toHaveCount(1);
      await expect(page.locator('.article-related .related-link')).toHaveCount(2);
      const feed = await (await request.get(`${host}blog/feed.xml`)).text();
      const parsed = await page.evaluate(xml => {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        return { errors: doc.querySelectorAll('parsererror').length, links: [...doc.querySelectorAll('item > link')].map(node => node.textContent) };
      }, feed);
      expect(parsed.errors).toBe(0);
      expect(parsed.links.sort()).toEqual(['can-you-delete-dmg-files', 'clean-up-mac-downloads', 'introducing-trayage'].map(slug => `${site.origin}${base}blog/${slug}/`).sort());
    } finally { await context.close(); }
  });
}
