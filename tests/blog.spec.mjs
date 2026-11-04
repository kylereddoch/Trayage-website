import { test, expect } from '@playwright/test';
import site from '../src/_data/site.json' with { type: 'json' };
import releases from '../src/_data/releases.json' with { type: 'json' };
import { publishedPosts, postRoutes } from './helpers/blog-posts.mjs';

for (const [port, base] of [[4175, '/'], [4176, '/Trayage-website/']]) {
  test(`Blog at ${base}: categories, article navigation, schema, and RSS work without JavaScript`, async ({ browser, request }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1100 }, colorScheme: 'light' });
    const page = await context.newPage();
    const host = `http://127.0.0.1:${port}${base}`;
    try {
      await page.goto(`${host}blog/`);
      await expect(page.locator('.blog-card')).toHaveCount(publishedPosts.length);
      expect(await page.locator('.blog-card h2 a').evaluateAll(links => links.map(link => link.getAttribute('href')).sort())).toEqual(postRoutes.map(path => `${base}${path}`).sort());
      await expect(page.locator('.blog-featured h2')).toContainText('without losing important files');
      if (base === '/') await page.screenshot({ path: 'artifacts/blog-preview.png' });
      await page.getByRole('navigation', { name: 'Blog categories' }).getByRole('link', { name: 'Guides', exact: true }).click();
      const guides = publishedPosts.filter(post => post.category === 'Guides');
      await expect(page.locator('.blog-card')).toHaveCount(guides.length);
      expect(await page.locator('.blog-card h2 a').evaluateAll(links => links.map(link => link.getAttribute('href')).sort())).toEqual(guides.map(post => `${base}${post.path}`).sort());
      await expect(page.locator('.blog-list')).not.toContainText('Meet Trayage 1.0');
      await page.getByRole('navigation', { name: 'Blog categories' }).getByRole('link', { name: 'Product news' }).click();
      const news = publishedPosts.filter(post => post.category === 'Product news');
      await expect(page.locator('.blog-card')).toHaveCount(news.length);
      expect(await page.locator('.blog-card h2 a').evaluateAll(links => links.map(link => link.getAttribute('href')).sort())).toEqual(news.map(post => `${base}${post.path}`).sort());
      await page.getByRole('link', { name: 'Trayage is now on the Mac App Store', exact: true }).click();
      await expect(page.locator('.article-category')).toHaveAttribute('href', `${base}blog/product-news/`);
      const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
      const article = graph.find(node => node['@type'] === 'BlogPosting');
      expect(article.articleSection).toBe('Product news');
      expect(article.datePublished).toBe('2026-10-12T00:00:00.000Z');
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
      expect(parsed.links.sort()).toEqual(postRoutes.map(path => `${site.origin}${base}${path}`).sort());
      await page.goto(`${host}blog/check-duplicate-files-on-mac/`);
      await expect(page.getByRole('link', { name: 'download the Trayage installer for Mac (DMG)', exact: true })).toHaveAttribute('href', releases.direct.url);
      await expect(page.locator('.article-body')).toContainText('It does not compare their contents.');
    } finally { await context.close(); }
  });
}
