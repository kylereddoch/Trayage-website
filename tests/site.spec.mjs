import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import site from '../src/_data/site.json' with { type: 'json' };
import releases from '../src/_data/releases.json' with { type: 'json' };
import { channelIsLive } from '../src/_lib/releases.js';
import { validateLaunch } from '../src/_lib/validate-launch.js';

const routes = ['', 'support/', 'privacy/', 'terms/', 'refunds/', 'roadmap/', 'download/', 'media-kit/', 'changelog/', '404.html', 'blog/', 'blog/guides/', 'blog/product-news/', 'blog/clean-up-mac-downloads/', 'blog/can-you-delete-dmg-files/', 'blog/introducing-trayage/', 'blog/check-duplicate-files-on-mac/', 'about/', 'compare/', 'blog/your-first-trayage-review/', 'blog/weekly-downloads-review/', 'blog/trayage-on-the-mac-app-store/', 'blog/trayage-1-1/', 'blog/trayage-new-look/', 'blog/how-to-use-trayage-smart-filters/'];
const hosts = [
  {name:'domain root', url:'http://127.0.0.1:4175/'},
  {name:'GitHub project path',url:'http://127.0.0.1:4176/Trayage-website/'}
];
for (const host of hosts) {
  test(`${host.name}: every internal link, fragment, asset, and 404 resolves`, async ({page,request})=>{
    // This single test visits every public route and its internal links.
    test.setTimeout(120_000);
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
    // Allow the complete route sweep to finish on shared CI runners.
    test.setTimeout(120_000);
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

test('keyboard: skip link, screenshot link, and native FAQ disclosures work',async({page})=>{
  await page.goto(hosts[1].url);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page.getByRole('link',{name:'View the full Trayage app screenshot'})).toBeVisible();
  await expect(page.locator('.native-preview img')).toHaveJSProperty('complete',true);
  expect(await page.locator('.native-preview img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  const screenshotLink = page.getByRole('link',{name:'View the full Trayage app screenshot'});
  await screenshotLink.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.screenshot-dialog:not(.product-detail-dialog) img')).toHaveJSProperty('naturalWidth',2560);
  await page.keyboard.press('Escape');
  await expect(screenshotLink).toBeFocused();
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
  await expect(page.locator('.price')).toContainText(['US$9.99 once']);
  await expect(page.locator('a[href^="https://buy.stripe.com"]')).toHaveCount(0);
  await expect(page.locator('a[download]')).toHaveCount(0);
  await expect(page.locator('.pricing-strip .button')).toHaveCount(1);
  await expect(page.locator('.pricing-strip .button')).toHaveAttribute('href','/download/');
  await page.goto(hosts[0].url+'download/');
  if (channelIsLive(releases,'direct')) {
    await expect(page.locator('#direct > .button')).toHaveAttribute('href',releases.direct.url);
    await expect(page.locator('#direct code')).toHaveText(releases.direct.sha256);
    if (!site.checkoutEnabled) await expect(page.locator('#direct')).toContainText('New license purchases are still being finalized');
  } else await expect(page.locator('#direct')).toContainText('after release checks');
  if (channelIsLive(releases,'appStore')) await expect(page.locator('#mac-app-store a')).toHaveAttribute('href',releases.appStore.url);
  else await expect(page.locator('#mac-app-store')).toContainText('Coming soon to the Mac App Store.');
  await page.goto(hosts[0].url);
  await expect(page.locator(`a[href="${site.links.licenses}"]`)).toHaveCount(1);
  await expect(page.locator(`a[href="${site.links.billing}"]`)).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large');
  expect(site.links.annual).toBeUndefined();
  await expect(page.locator('.hero-offer')).toContainText('US$9.99 once. No subscription.');
  await expect(page.locator('#pricing')).toContainText('7-day cleanup trial');
  await expect(page.locator('#pricing')).toContainText('Optional paid major upgrades');
  expect(site.links.oneTime).toBe('https://buy.stripe.com/8x2dR9evl89WbAh11x73G04');
  expect(()=>validateLaunch(site,true)).not.toThrow();
  expect(()=>validateLaunch({...site,publicationApproved:false},true)).toThrow(/Publication is not approved/);
  expect(()=>validateLaunch({...site,checkoutEnabled:true,releaseReady:false})).toThrow(/Checkout requires/);
});

test('without JavaScript: content, FAQs, and system dark mode work',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,colorScheme:'dark',viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto(hosts[1].url);
  await expect(page.locator('.native-preview img')).toBeVisible();
  await expect(page.locator('.appearance-control')).toBeHidden();
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 21, 36)');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Support',exact:true}).click();
  await page.locator('summary').filter({hasText:'Will I have to buy the next major version?'}).click();
  await expect(page.locator('details[open]')).toContainText(['Where can I download','Will I have to buy']);
  await context.close();
});

test('default visits load only disclosed analytics and store no visitor state',async({page})=>{
  const external=[];
  page.on('request',request=>{if(new URL(request.url()).origin!==new URL(hosts[0].url).origin)external.push(request.url());});
  await page.route('https://tinylytics.app/**', route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
  await page.route('https://launchnest.io/badge/**', route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="220" height="56"/>'}));
  await page.route('https://www.scrolllaunch.com/api/badge/trayage*', route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="220" height="48"/>'}));
  await page.route('https://letslaunch.today/badge/trayage.svg*', route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="250" height="54"/>'}));
  await page.route('https://www.tinyshelf.co/badge/tinyshelf-badge-dark-f4d1216a.svg', route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="216" height="64"/>'}));
  await page.route('https://buildhop.io/api/badges/launch/**', route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="236" height="52"/>'}));
  await page.route('https://founderbattle.com/badges/**', route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="184" height="48"/>'}));
  await page.route('https://peerpush.com/p/trayage/badge.png', route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="460" height="130"/>'}));
  for(const route of routes){await page.goto(hosts[0].url+route);}
  expect(external).toContain(site.analytics.embedURL);
  expect(external.some(url=>url.includes('viberank.dev'))).toBe(false);
  expect(external.some(url=>url.includes('api.producthunt.com'))).toBe(false);
  expect(external.filter(url=>url!==site.analytics.embedURL).every(url=>url==='https://peerpush.com/p/trayage/badge.png'||url==='https://letslaunch.today/badge/trayage.svg'||url==='https://www.tinyshelf.co/badge/tinyshelf-badge-dark-f4d1216a.svg'||url==='https://www.scrolllaunch.com/api/badge/trayage'||/^https:\/\/launchnest\.io\/badge\/trayage\.svg\?variant=featured(?:&theme=light)?$/.test(url)||url==='https://buildhop.io/api/badges/launch/c561c9c6-60cc-4549-81b2-83da959e4fba?theme=light'||url==='https://founderbattle.com/badges/competing-coral.svg')).toBe(true);
  expect(await page.context().cookies()).toEqual([]);
  expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
});

test('Tinylytics event tracking covers outbound, contact, and download links',async({page})=>{
  await page.route('https://tinylytics.app/**', route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
  for (const route of routes) {
    await page.goto(hosts[0].url+route);
    await expect(page.locator(`script[src="${site.analytics.embedURL}"][defer]`)).toHaveCount(1);
    const untracked = await page.locator('a[href]').evaluateAll(links => links.filter(link => {
      const href = link.getAttribute('href') || '';
      if (href === 'https://www.tinyshelf.co/?ref=trayage.app') return false;
      return (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || link.hasAttribute('download'))
        && !link.hasAttribute('data-tinylytics-event');
    }).map(link => link.outerHTML));
    expect(untracked, route).toEqual([]);
    const events = await page.locator('a[data-tinylytics-event]').evaluateAll(links => links.map(link => ({
      name: link.dataset.tinylyticsEvent,
      value: link.dataset.tinylyticsEventValue
    })));
    for (const event of events) {
      expect(event.name).toMatch(/^[a-z][a-z0-9_-]*\.[a-z][a-z0-9_-]*$/);
      expect(event.value).toBeTruthy();
    }
  }
  await page.goto(hosts[0].url+'download/');
  await expect(page.locator(`#direct a[href="${releases.direct.url}"]`)).toHaveAttribute('data-tinylytics-event','file.download');
  await expect(page.locator(`a[href="${site.links.oneTime}"]`).first()).toHaveAttribute('data-tinylytics-event','purchase.checkout');
  await page.goto(hosts[0].url+'support/');
  await expect(page.locator(`a[href="${site.links.licenses}"]`).first()).toHaveAttribute('data-tinylytics-event','license.portal');
  await expect(page.locator(`a[href="${site.links.billing}"]`).first()).toHaveAttribute('data-tinylytics-event','billing.portal');
  await expect(page.locator(`a[href^="mailto:${site.email}"]`).first()).toHaveAttribute('data-tinylytics-event','support.email');
});

test('reduced motion and enlarged text retain usable content',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:640,height:900});
  for(const route of routes){
    await page.goto(hosts[1].url+route);
    await page.addStyleTag({content:'html { font-size: 200%; }'});
    expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),route).toBe(true);
    if (route === '') {
      await page.addStyleTag({content:'body { font-family: Verdana, sans-serif; }'});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'homepage with wider fallback font').toBe(true);
    }
  }
});

test('badge clicks keep the moving row stable while keyboard navigation reaches every badge',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(hosts[0].url);
  const viewport = page.locator('.launch-viewport');
  const badges = page.locator('.launch-badges > a');
  const toggle = page.locator('.launch-toggle');
  // Exercise real pointer focus without opening the external partner pages.
  await viewport.evaluate(el => el.addEventListener('click', event => event.preventDefault()));
  await toggle.scrollIntoViewIfNeeded();
  await toggle.hover();
  await badges.first().click();
  await expect(badges.first()).toBeFocused();
  await expect(viewport).toHaveCSS('overflow-x', 'hidden');
  await expect(badges.first()).toHaveCSS('position', 'absolute');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-label', 'Resume featured badges');
  for (let index = 0; index < await badges.count(); index++) {
    await page.keyboard.press('Tab');
    await expect(badges.nth(index)).toBeFocused();
    await expect(viewport).toHaveCSS('overflow-x', 'auto');
    await expect(badges.nth(index)).toHaveCSS('position', 'relative');
    await expect(badges.nth(index)).toBeInViewport();
    // Scroll positions round to pixels; fractional image widths must not fail CI.
    // Still fail if keyboard navigation leaves more than one pixel clipped.
    await expect.poll(() => badges.nth(index).evaluate(link => {
      const badge = link.getBoundingClientRect();
      const viewport = link.closest('.launch-viewport').getBoundingClientRect();
      return Math.max(viewport.left - badge.left, badge.right - viewport.right, 0);
    })).toBeLessThanOrEqual(1);
  }
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-label', 'Pause featured badges');
  await expect(viewport).toHaveCSS('overflow-x', 'hidden');
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBe(0);
  await expect(badges.first()).toHaveCSS('position', 'absolute');
});

test('different-width badges keep even gaps throughout the scrolling loop', async ({page}) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(hosts[0].url);
  const badges = page.locator('.launch-badges > a');
  await expect(page.locator('.launch-strip')).toHaveClass(/is-animated/);
  for (const width of [1440, 390]) {
    await page.setViewportSize({width, height:1000});
    await page.getByRole('button', {name:/featured badges/}).scrollIntoViewIfNeeded();
    // Let responsive sizing and ResizeObserver settle before sampling the loop.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    for (const time of [0, 18000, 47000]) {
      const rects = await badges.evaluateAll((links, time) => {
        links.forEach(link => link.getAnimations().forEach(animation => {
          animation.pause();
          animation.currentTime = time;
        }));
        return links.map(link => {
          const rect = link.getBoundingClientRect();
          return {left:rect.left, right:rect.right, width:rect.width};
        }).sort((a,b) => a.left-b.left);
      }, time);
      expect(new Set(rects.map(rect => Math.round(rect.width))).size).toBeGreaterThan(3);
      for (let index=1; index<rects.length; index++) {
        expect(Math.abs(rects[index].left - rects[index-1].right - 20)).toBeLessThan(1);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('appearance follows the system, persists an explicit choice, and resets cleanly',async({page})=>{
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto(hosts[0].url);
  await expect(page.locator('.site-footer + .launch-area .launchnest-badge')).toHaveAttribute('href', 'https://launchnest.io/p/trayage');
  await expect(page.locator('.launchnest-badge')).toHaveAttribute('rel', 'noopener noreferrer');
  const letsLaunch = page.getByAltText('Trayage on LetsLaunch');
  await expect(letsLaunch.locator('xpath=ancestor::a')).toHaveAttribute('href', 'https://letslaunch.today/product/trayage');
  const scrollLaunch = page.getByAltText('Featured on ScrollLaunch');
  const buildHop = page.getByAltText('Trending on BuildHop: Trayage');
  const founderBattle = page.getByAltText('Competing on Founder Battle');
  await page.getByRole('button', {name:'Pause featured badges', exact:true}).click();
  await scrollLaunch.scrollIntoViewIfNeeded();
  await expect(scrollLaunch).toHaveAttribute('src', 'https://www.scrolllaunch.com/api/badge/trayage');
  await expect.poll(() => scrollLaunch.evaluate(img => img.currentSrc)).toBe('https://www.scrolllaunch.com/api/badge/trayage?theme=dark');
  await expect.poll(() => letsLaunch.evaluate(img => img.currentSrc)).toBe('https://letslaunch.today/badge/trayage.svg?theme=dark');
  await expect.poll(() => buildHop.evaluate(img => img.currentSrc)).toBe('https://buildhop.io/api/badges/launch/c561c9c6-60cc-4549-81b2-83da959e4fba?theme=dark');
  await expect.poll(() => founderBattle.evaluate(img => img.currentSrc)).toBe('https://founderbattle.com/badges/competing.svg');
  const select=page.locator('.appearance-trigger');
  await expect(select).toHaveAttribute('aria-label','Appearance: System');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 21, 36)');
  await expect(page.locator('.launchnest-badge .badge-dark')).toBeVisible();
  await expect(page.locator('.launchnest-badge .badge-light')).toBeHidden();
  await page.emulateMedia({colorScheme:'light'});
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(247, 245, 252)');
  await expect.poll(() => scrollLaunch.evaluate(img => img.currentSrc)).toBe('https://www.scrolllaunch.com/api/badge/trayage');
  await expect.poll(() => letsLaunch.evaluate(img => img.currentSrc)).toBe('https://letslaunch.today/badge/trayage.svg');
  await expect.poll(() => buildHop.evaluate(img => img.currentSrc)).toBe('https://buildhop.io/api/badges/launch/c561c9c6-60cc-4549-81b2-83da959e4fba?theme=light');
  await expect.poll(() => founderBattle.evaluate(img => img.currentSrc)).toBe('https://founderbattle.com/badges/competing-coral.svg');
  await expect(page.locator('.launchnest-badge .badge-light')).toBeVisible();
  await expect(page.locator('.launchnest-badge .badge-dark')).toBeHidden();
  await chooseAppearance(page, 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 21, 36)');
  await expect.poll(() => scrollLaunch.evaluate(img => img.currentSrc)).toBe('https://www.scrolllaunch.com/api/badge/trayage?theme=dark');
  await expect.poll(() => letsLaunch.evaluate(img => img.currentSrc)).toBe('https://letslaunch.today/badge/trayage.svg?theme=dark');
  await expect.poll(() => buildHop.evaluate(img => img.currentSrc)).toBe('https://buildhop.io/api/badges/launch/c561c9c6-60cc-4549-81b2-83da959e4fba?theme=dark');
  await expect.poll(() => founderBattle.evaluate(img => img.currentSrc)).toBe('https://founderbattle.com/badges/competing.svg');
  await expect(page.locator('.launchnest-badge .badge-dark')).toBeVisible();
  await page.getByRole('navigation',{name:'Footer navigation'}).getByRole('link',{name:'Privacy',exact:true}).click();
  await expect(select).toHaveAttribute('aria-label','Appearance: Dark');
  await page.reload();
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 21, 36)');
  expect(await page.evaluate(()=>Object.entries(localStorage))).toEqual([['trayage-appearance','dark']]);
  const other=await page.context().newPage();
  await other.goto(hosts[0].url+'terms/');
  await chooseAppearance(page, 'light');
  await expect(other.locator('.appearance-trigger')).toHaveAttribute('aria-label','Appearance: Light');
  await page.emulateMedia({colorScheme:'dark'});
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(247, 245, 252)');
  await chooseAppearance(page, 'system');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 21, 36)');
  await expect(other.locator('.appearance-trigger')).toHaveAttribute('aria-label','Appearance: System');
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
  await chooseAppearance(page, 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(25, 21, 36)');
  await chooseAppearance(page, 'system');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(247, 245, 252)');
  expect(errors).toEqual([]);
});

test('policies distinguish direct and Apple purchases and disclose support and storage',async({page})=>{
  await page.goto(hosts[1].url+'privacy/');
  await expect(page.locator('#who')).toContainText('Texas, United States');
  await expect(page.locator('#support')).toContainText('Proton Mail');
  await expect(page.locator('#website')).toContainText('trayage-appearance');
  await expect(page.locator('#website')).toContainText('Tinylytics');
  await expect(page.locator('#website')).not.toContainText('VibeRank');
  await expect(page.locator('#website')).not.toContainText('Product Hunt');
  await expect(page.locator('#website')).toContainText('BuildHop');
  await expect(page.locator('#website')).toContainText('Founder Battle');
  await expect(page.locator('#website')).toContainText('LaunchNest');
  await expect(page.locator(`#website a[href="${site.analytics.privacyURL}"]`)).toBeVisible();
  await expect(page.locator('.document-meta')).toContainText(`Effective ${site.analytics.effective}`);
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
  await expect(page.locator('#plans')).toContainText('US$9.99 once');
  await expect(page.locator('#upgrades')).toContainText('discounted pricing for existing owners');
  await expect(page.locator('#trial')).toContainText('7-day in-app trial');
  for (const route of routes) {
    await page.goto(hosts[1].url+route);
    await expect(page.locator('body')).not.toContainText(/draft for review|policy text remains a draft|kyle@kylereddoch\.me/i);
    if (['privacy/', 'terms/', 'refunds/'].includes(route)) {
      const effective = route === 'privacy/' ? site.analytics.effective : site.effective;
      await expect(page.locator('.document-meta')).toContainText(`Effective ${effective}`);
      await expect(page.locator('main')).not.toContainText(/\bproposed\b|\bpending\b|planned edition|before release/i);
      await expect(page.locator('main')).toContainText('support@relaybyte.dev');
    }
    await expect(page.locator('main')).not.toContainText(/79\.99|14-day (?:in-app )?trial|renews yearly|yearly plan|annual renewals/i);
    await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', /79\.99|yearly|annual renewals/i);
  }
});

async function chooseAppearance(page, value) {
  await page.locator('.appearance-trigger').click();
  await page.locator(`[data-appearance="${value}"]`).click();
}

test('appearance menu supports keyboard selection and dismissal without overflowing mobile', async ({page}) => {
  await page.setViewportSize({width:320,height:800});
  await page.goto(hosts[0].url);
  const trigger = page.locator('.appearance-trigger');
  await trigger.focus();
  await trigger.press('ArrowDown');
  await expect(page.getByRole('button',{name:'System',exact:true})).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('button',{name:'Dark',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-label','Appearance: Dark');
  await trigger.click();
  await expect(page.getByRole('button',{name:'Dark',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await trigger.press('Escape');
  await expect(page.locator('.appearance-menu')).toBeHidden();
  await trigger.click();
  await page.locator('h1').click();
  await expect(page.locator('.appearance-menu')).toBeHidden();
});
