import { test, expect } from '@playwright/test';
import { publicPosts } from '../src/_lib/content-index.js';
import { home } from '../src/home.mjs';
import site from '../src/_data/site.json' with {type:'json'};
import releases from '../src/_data/releases.json' with {type:'json'};

for (const base of ['http://127.0.0.1:4175/','http://127.0.0.1:4176/Trayage-website/']) {
 test(`Redesign at ${base}: discovery, comparison and visible FAQ stay readable without JavaScript`,async({browser})=>{
  const ctx=await browser.newContext({javaScriptEnabled:false});const page=await ctx.newPage();
  await page.goto(base);
  await expect(page.locator('h1')).toHaveText('Trayage for Mac. Find downloads you no longer need.');
  await expect(page.locator('.home-post')).toHaveCount(3);
  await expect(page.locator('.home-posts')).toContainText('Guides');
  await expect(page.locator('.home-posts')).toContainText('Product news');
  const graph=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
  const faq=graph.find(n=>n['@type']==='FAQPage');
  expect(faq.mainEntity.map(q=>q.name)).toEqual(await page.locator('.home-faq-grid h3').allTextContents());
  expect(faq.mainEntity.map(q=>q.acceptedAnswer.text)).toEqual(await page.locator('.home-faq-grid p').allTextContents());
  await page.getByRole('navigation',{name:'Footer navigation'}).getByRole('link',{name:'Why Trayage?',exact:true}).click();
  await expect(page.locator('h1')).toContainText('Here’s what Trayage adds.');
  await expect(page.locator('#example')).toContainText('Invoice (1).pdf');
  await expect(page.locator('#limits')).toContainText('does not compare file contents');
  await expect(page.locator('main a[href^="https://"]')).toHaveCount(0);
  await expect(page.locator('.compare-header .button')).toHaveAttribute('href', base.includes('Trayage-website') ? '/Trayage-website/download/' : '/download/');
  await page.goto(base+'blog/your-first-trayage-review/');
  await expect(page.locator('.article-body')).toContainText('Nothing moves to Trash just because you review a folder.');
  await expect(page.locator('.article-share a')).toHaveCount(3);
  await expect(page.getByRole('button',{name:'Copy link'})).toBeHidden();
  await ctx.close();
 });
}
test('Homepage excludes unpublished posts and keeps category variety from the collection',()=>{
 const post=(title,category,date,extra={})=>({data:{title,category,path:`blog/${title}/`,description:'Description',...extra},date:new Date(date)});
 const posts=[post('hidden','Guides','2026-10-12',{draft:true}),post('unindexed','Guides','2026-10-11',{noindex:true}),post('newest','Guides','2026-10-10'),post('second','Guides','2026-10-09'),post('third','Guides','2026-10-08'),post('news','Product news','2026-10-07')];
 expect(publicPosts(posts).map(p=>p.data.title)).toEqual(['newest','second','third','news']);
 const html=home('/',site,releases,{posts});
 expect(html).not.toContain('blog/hidden/');expect(html).not.toContain('blog/unindexed/');
 expect(html).toContain('blog/newest/');expect(html).toContain('blog/second/');expect(html).toContain('blog/news/');
});
test('Copy-link control reports success and failure without navigating or posting',async({page})=>{
 await page.goto('http://127.0.0.1:4175/blog/your-first-trayage-review/');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text;}},configurable:true}));
 await page.getByRole('button',{name:'Copy link'}).click();
 await expect(page.getByRole('status')).toContainText('Link copied');
 expect(await page.evaluate(()=>window.copied)).toBe('https://trayage.app/blog/your-first-trayage-review/');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Unavailable');}},configurable:true}));
 await page.getByRole('button',{name:'Copy link'}).click();
 await expect(page.getByRole('status')).toContainText('Could not copy automatically');
 await expect(page).toHaveURL('http://127.0.0.1:4175/blog/your-first-trayage-review/');
});
test('Capture redesign review surfaces',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({colorScheme:'light'});
 await page.goto('http://127.0.0.1:4175/');
 await page.screenshot({path:'artifacts/design/2026-10-09/website-desktop.png'});
 await page.screenshot({path:'artifacts/design/2026-10-09/website-full.png',fullPage:true});
 await page.goto('http://127.0.0.1:4175/compare/');
 await page.screenshot({path:'artifacts/design/2026-10-09/comparison-desktop.png'});
 await page.emulateMedia({colorScheme:'dark'});await page.goto('http://127.0.0.1:4175/');
 await page.screenshot({path:'artifacts/design/2026-10-09/website-dark.png'});
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:'light'});
 await page.screenshot({path:'artifacts/design/2026-10-09/website-mobile.png',fullPage:true});
});

for (const base of ['http://127.0.0.1:4175/', 'http://127.0.0.1:4176/Trayage-website/']) {
 test('Screenshot opens and closes without leaving the page at ' + base, async ({page}) => {
  await page.goto(base);
  const trigger = page.getByRole('link', {name: 'View the full Trayage app screenshot'});
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.getByRole('link', {name: 'View full screenshot'}).click();
  await page.getByRole('button', {name: 'Close screenshot'}).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page).toHaveURL(base);
 });
}
