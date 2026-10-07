import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { contentDate } from '../src/_lib/content-index.js';

for (const [port, base] of [[4175, '/'], [4176, '/Trayage-website/']]) {
  test(`Search structure at ${base}: visible facts, author, categories, dates, and images agree`, async ({ browser, request }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const host = `http://127.0.0.1:${port}${base}`;
    const graph = async () => JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
    try {
      await page.goto(`${host}support/`);
      const faq = (await graph()).find(node => Array.isArray(node['@type']) && node['@type'].includes('FAQPage'));
      const questions = await page.locator('.faq-list details').evaluateAll(nodes => nodes.map(node => ({ question: node.querySelector('summary').childNodes[0].textContent, answer: node.querySelector('.faq-answer').textContent.trim() })));
      expect(faq.mainEntity.map(q => q.name)).toEqual(questions.map(q => q.question));
      for (const [i, q] of faq.mainEntity.entries()) {
        const text = await page.evaluate(html => new DOMParser().parseFromString(html, 'text/html').body.textContent, q.acceptedAnswer.text);
        expect(text).toBe(questions[i].answer);
      }
      for (const route of ['blog/', 'blog/guides/', 'blog/product-news/']) {
        await page.goto(host + route);
        const nodes = await graph();
        expect(nodes.some(node => node['@type'] === 'CollectionPage')).toBe(true);
        const items = nodes.find(node => node['@type'] === 'ItemList');
        expect(items.itemListElement.map(item => item.name)).toEqual(await page.locator('.blog-card h2').allTextContents());
        expect(items.numberOfItems).toBe(await page.locator('.blog-card').count());
      }
      for (const slug of ['clean-up-mac-downloads', 'can-you-delete-dmg-files', 'introducing-trayage']) {
        await page.goto(`${host}blog/${slug}/`);
        const article = (await graph()).find(node => node['@type'] === 'BlogPosting');
        expect(article.headline).toBe(await page.locator('h1').textContent());
        expect(article.author.name).toBe('Kyle Reddoch');
        expect(article.author.url).toBe(`https://trayage.app${base}about/`);
        await expect(page.locator('[rel="author"]')).toHaveAttribute('href', `${base}about/`);
        expect(article.dateModified).toBe('2026-10-07T00:00:00.000Z');
        await expect(page.locator('.blog-meta')).toContainText('Updated October 7, 2026');
        expect(article.wordCount).toBeGreaterThan(200);
        const image = new URL(article.image).pathname;
        await expect(page.locator(`.article-body img[src="${image}"]`)).toHaveCount(1);
        expect((await request.get(`http://127.0.0.1:${port}${image}`)).status()).toBe(200);
      }
      await page.goto(host + 'about/');
      expect((await graph()).find(node => node['@type'] === 'AboutPage').mainEntity['@id']).toContain('#publisher');
      await expect(page.locator('main')).toContainText('Kyle reviews articles before publication');
      const sitemap = await (await request.get(host + 'sitemap.xml')).text();
      const dates = await page.evaluate(xml => {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        return [...doc.querySelectorAll('url')].map(node => ({ url: node.querySelector('loc').textContent, modified: node.querySelector('lastmod')?.textContent }));
      }, sitemap);
      for (const entry of dates) {
        if (['clean-up-mac-downloads', 'can-you-delete-dmg-files', 'introducing-trayage'].some(slug => entry.url.includes(slug))) expect(entry.modified).toBe('2026-10-07T00:00:00.000Z');
        else expect(entry.modified).toBeUndefined();
      }
    } finally { await context.close(); }
  });
}

test('Search crawler rules preserve public access and invalid content dates fail clearly', async () => {
  const robots = await readFile('dist-root/robots.txt', 'utf8');
  for (const bot of ['*', 'OAI-SearchBot', 'PerplexityBot']) expect(robots).toContain(`User-agent: ${bot}\nAllow: /`);
  expect(robots).not.toContain('Disallow:');
  expect(() => contentDate('not-a-date')).toThrow('Invalid content date');
});
