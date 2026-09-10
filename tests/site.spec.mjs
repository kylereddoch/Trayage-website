import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import site from '../src/_data/site.json' with { type: 'json' };
import releases from '../src/_data/releases.json' with { type: 'json' };
import { channelIsLive } from '../src/_lib/releases.js';
import { validateLaunch } from '../src/_lib/validate-launch.js';

const routes = ['', 'support/', 'privacy/', 'terms/', 'refunds/', 'roadmap/', 'download/', 'media-kit/', 'changelog/', '404.html'];
const hosts = [
  {name:'domain root', url:'http://127.0.0.1:4175/'},
  {name:'GitHub project path',url:'http://127.0.0.1:4176/Trayage-website/'}
];
for (const host of hosts) {
  test(`${host.name}: every internal link, fragment, asset, and 404 resolves`, async ({page,request})=>{
    const checked = new Set();
    for (const route of routes) {
      const errors=[];
      page.on('pageerror', error=>errors.push(error.message));
      await page.goto(host.url+route);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(errors).toEqual([]);
      const links=await page.locator('a[href], img[src], link[href], script[src]').evaluateAll(nodes=>nodes.map(n=>n.href||n.src));
      for(const link of links) {
        const url = new URL(link);
        if(url.origin !== new URL(host.url).origin || checked.has(link)) continue;
        checked.add(link);
        expect(url.pathname,link).toMatch(new RegExp('^'+new URL(host.url).pathname));
        const response=await request.get(link);
        expect(response.status(),link).toBe(200);
        if(url.hash) {
          await page.goto(link);
          await expect(page.locator(`[id="${decodeURIComponent(url.hash.slice(1))}"]`)).toHaveCount(1);
        }
      }
    }
    const missing=await page.goto(host.url+'missing/nested/page/');
    expect(missing.status()).toBe(404);
    await page.getByRole('link',{name:'Back to Trayage',exact:false}).click();
    await expect(page).toHaveURL(host.url);
  });
}

for(const colorScheme of ['light','dark']) for(const width of [320,390,768,1440]) {
  test(`${colorScheme}, ${width}px: all pages fit and pass axe WCAG 2.2 AA checks`,async({page})=>{
    await page.emulateMedia({colorScheme});
    await page.setViewportSize({width,height:1000});
    for(const route of routes) {
      await page.goto(hosts[1].url+route);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth),`${route} horizontal overflow at ${width}px`).toBe(true);
      const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']).analyze();
      expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),`${route} at ${width}px`).toEqual([]);
    }
  });
}

test('keyboard: skip link, category filters, and native FAQ disclosures work',async({page})=>{
  await page.goto(hosts[1].url);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.getByRole('button',{name:'Likely duplicates',exact:true}).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button',{name:'Likely duplicates',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.file-row:visible')).toHaveCount(1);
  await expect(page.getByRole('status')).toContainText('Contents not verified');
  await page.getByRole('button',{name:'All files',exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.file-row:visible')).toHaveCount(5);
  await page.goto(hosts[1].url+'support/');
  const question=page.locator('summary').filter({hasText:'How do I activate my license?'});
  await question.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details').filter({has:question})).toHaveAttribute('open','');
  await expect(question).toBeFocused();
  const indicator=await question.evaluate(el=>getComputedStyle(el).outlineStyle);
  expect(indicator).not.toBe('none');
});

test('one-time offer uses approved pricing and only enables verified release channels',async({page})=>{
  await page.goto(hosts[0].url);
  await expect(page.locator('.price')).toContainText(['US$29.99 once']);
  await expect(page.locator('a[href^="https://buy.stripe.com"]')).toHaveCount(site.checkoutEnabled?1:0);
  await expect(page.locator('a[download]')).toHaveCount(0);
  await expect(page.locator('.price-card .button')).toHaveCount(1);
  await expect(page.locator('.price-card .button')).toHaveAttribute('href',site.checkoutEnabled?site.links.oneTime:'/download/');
  await page.goto(hosts[0].url+'download/');
  if (channelIsLive(releases,'direct')) {
    await expect(page.locator('#direct .button')).toHaveAttribute('href',releases.direct.url);
    await expect(page.locator('#direct code')).toHaveText(releases.direct.sha256);
    if (!site.checkoutEnabled) await expect(page.locator('#direct')).toContainText('New license purchases are still being finalized');
  } else await expect(page.locator('#direct')).toContainText('after release checks');
  if (channelIsLive(releases,'appStore')) await expect(page.locator('#mac-app-store a')).toHaveAttribute('href',releases.appStore.url);
  else await expect(page.locator('#mac-app-store')).toContainText('listing is live');
  await page.goto(hosts[0].url);
  if (channelIsLive(releases,'direct') && !site.checkoutEnabled) await expect(page.locator('#pricing')).toContainText('New license purchases are still being finalized');
  await expect(page.locator(`a[href="${site.links.licenses}"]`)).toHaveCount(1);
  await expect(page.locator(`a[href="${site.links.billing}"]`)).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  expect(site.links.annual).toBeUndefined();
  await expect(page.locator('#pricing')).toContainText('7 days');
  await expect(page.locator('#pricing')).toContainText('Optional major upgrades, discounted for owners');
  expect(site.links.oneTime).toBe('https://buy.stripe.com/4gM3cv72T0Huawd5hN73G02');
  expect(()=>validateLaunch(site,true)).not.toThrow();
  expect(()=>validateLaunch({...site,publicationApproved:false},true)).toThrow(/Publication is not approved/);
  expect(()=>validateLaunch({...site,checkoutEnabled:true,releaseReady:false})).toThrow(/Checkout requires/);
});

test('without JavaScript: content, FAQs, and system dark mode work',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,colorScheme:'dark',viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto(hosts[1].url);
  await expect(page.locator('.file-row:visible')).toHaveCount(5);
  await expect(page.locator('.demo-filters')).toBeHidden();
  await expect(page.getByLabel('Appearance')).toBeHidden();
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 28, 26)');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Support',exact:true}).click();
  await page.locator('summary').filter({hasText:'Will I have to buy the next major version?'}).click();
  await expect(page.locator('details[open]')).toContainText(['Where can I download','Will I have to buy']);
  await context.close();
});

test('default visits make no third-party requests and store no visitor state',async({page})=>{
  const external=[];
  page.on('request',request=>{if(new URL(request.url()).origin!==new URL(hosts[0].url).origin)external.push(request.url());});
  for(const route of routes){await page.goto(hosts[0].url+route);}
  expect(external).toEqual([]);
  expect(await page.context().cookies()).toEqual([]);
  expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
});

test('reduced motion and enlarged text retain usable content',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:640,height:900});
  for(const route of routes){
    await page.goto(hosts[1].url+route);
    await page.addStyleTag({content:'html { font-size: 200%; }'});
    expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),route).toBe(true);
  }
});

test('appearance follows the system, persists an explicit choice, and resets cleanly',async({page})=>{
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto(hosts[0].url);
  const select=page.getByLabel('Appearance');
  await expect(select).toHaveValue('system');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 28, 26)');
  await page.emulateMedia({colorScheme:'light'});
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(247, 246, 242)');
  await select.selectOption('dark');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 28, 26)');
  await page.getByRole('navigation',{name:'Footer navigation'}).getByRole('link',{name:'Privacy',exact:true}).click();
  await expect(select).toHaveValue('dark');
  await page.reload();
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 28, 26)');
  expect(await page.evaluate(()=>Object.entries(localStorage))).toEqual([['trayage-appearance','dark']]);
  const other=await page.context().newPage();
  await other.goto(hosts[0].url+'terms/');
  await select.selectOption('light');
  await expect(other.getByLabel('Appearance')).toHaveValue('light');
  await page.emulateMedia({colorScheme:'dark'});
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(247, 246, 242)');
  await select.selectOption('system');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 28, 26)');
  await expect(other.getByLabel('Appearance')).toHaveValue('system');
  expect(await page.evaluate(()=>localStorage.length)).toBe(0);
  await page.emulateMedia({media:'print'});
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(select).toBeHidden();
  await other.close();
});

test('appearance selector works when browser storage is unavailable',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({colorScheme:'light'});
  await page.goto(hosts[1].url+'refunds/');
  await page.getByLabel('Appearance').selectOption('dark');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 28, 26)');
  await page.getByLabel('Appearance').selectOption('system');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(247, 246, 242)');
  expect(errors).toEqual([]);
});

test('policies distinguish direct and Apple purchases and disclose support and storage',async({page})=>{
  await page.goto(hosts[1].url+'privacy/');
  await expect(page.locator('#who')).toContainText('Texas, United States');
  await expect(page.locator('#support')).toContainText('Proton Mail');
  await expect(page.locator('#website')).toContainText('trayage-appearance');
  await expect(page.locator('#apple')).toContainText('excludes Stripe checkout and Keylight licensing');
  await page.goto(hosts[1].url+'refunds/');
  await expect(page.locator('#initial')).toContainText('within 14 days');
  await expect(page.locator('#trial')).toContainText('7-day trial ends without charging you');
  await expect(page.locator('#trial')).toContainText('preserve any earlier, separately purchased entitlement');
  await expect(page.locator('#renewals')).toHaveCount(0);
  await expect(page.locator(`#apple a[href="${site.links.appleRefunds}"]`)).toBeVisible();
  await expect(page.locator('#apple')).toContainText('does not set Apple’s refund terms');
  await page.goto(hosts[1].url+'terms/');
  await expect(page.locator(`#apple a[href="${site.links.appleEULA}"]`)).toBeVisible();
  await expect(page.locator('#plans')).toContainText('not an App Store device restriction');
  await expect(page.locator('#plans')).toContainText('US$29.99 once');
  await expect(page.locator('#upgrades')).toContainText('discounted pricing for existing owners');
  await expect(page.locator('#trial')).toContainText('7-day in-app trial');
  for (const route of routes) {
    await page.goto(hosts[1].url+route);
    await expect(page.locator('body')).not.toContainText(/draft for review|policy text remains a draft|kyle@kylereddoch\.me/i);
    if (['privacy/', 'terms/', 'refunds/'].includes(route)) {
      await expect(page.locator('.document-meta')).toContainText('Effective September 10, 2026');
      await expect(page.locator('main')).not.toContainText(/\bproposed\b|\bpending\b|planned edition|before release/i);
      await expect(page.locator('main')).toContainText('trayage@relaybyte.dev');
    }
    await expect(page.locator('main')).not.toContainText(/79\.99|14-day (?:in-app )?trial|renews yearly|yearly plan|annual renewals/i);
    await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', /79\.99|yearly|annual renewals/i);
  }
});
