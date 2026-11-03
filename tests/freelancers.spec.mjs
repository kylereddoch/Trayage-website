import { test, expect } from '@playwright/test';

for (const width of [390, 768, 1024, 1440]) {
  test(`Freelancer landing page remains readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:4175/for-freelancers/');
    await expect(page.locator('.freelancer-page .cleanup-option')).toHaveCount(3);
    const layout = await page.locator('.freelancer-page .cleanup-option').evaluateAll(cards => cards.map(card => {
      const bounds = card.getBoundingClientRect();
      const text = card.lastElementChild.getBoundingClientRect();
      const grid = card.parentElement.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, gridLeft: grid.left, gridRight: grid.right, textBottom: text.bottom, cardBottom: bounds.bottom };
    }));
    for (const card of layout) {
      expect(card.textBottom).toBeLessThanOrEqual(card.cardBottom + 1);
      expect(card.left).toBeGreaterThanOrEqual(card.gridLeft - 1);
      expect(card.right).toBeLessThanOrEqual(card.gridRight + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
  });
}
