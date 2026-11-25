import {test, expect} from '@playwright/test';
import site from '../src/_data/site.json' with {type:'json'};
import releases from '../src/_data/releases.json' with {type:'json'};
import placements from '../src/_data/placements.json' with {type:'json'};
import {placementLinks} from '../scripts/placement-links.mjs';
import {isolatedProduction} from './helpers/analytics.mjs';

const id = 'bf2026_x_personal_reminder';
const checkout = '[data-tinylytics-event="purchase.checkout"]';
const reference = href => new URL(href).searchParams.get('client_reference_id');

test('campaign survives blog, homepage and download page; one Tinylytics click carries the Stripe label', async ({page}) => {
  const hits = await isolatedProduction(page);
  await page.goto(placementLinks(id).website);
  await expect(page.locator(checkout).first()).toHaveAttribute('href', placementLinks(id).stripe);
  await expect.poll(() => hits.filter(hit => !hit.event).length).toBe(1);
  expect(new URL(hits[0].url).searchParams.get('utm_campaign')).toBe('black_friday_2026');
  await page.getByRole('link', {name:'Trayage home', exact:true}).click();
  await expect(page).toHaveURL(`${site.origin}/?via=${id}`);
  await page.locator('.hero-actions .button span').click();
  await expect(page).toHaveURL(`${site.origin}/download/?via=${id}`);
  await expect(page.locator(checkout)).toHaveAttribute('href', placementLinks(id).stripe);
  await expect(page.locator(checkout)).toHaveAttribute('data-tinylytics-event-value', `direct:direct-card|via:${id}`);
  await expect(page.locator('#direct a[data-tinylytics-event="file.download"]')).toHaveAttribute('href', releases.direct.url);
  const apple = await page.locator('[data-tinylytics-event="store.view"]').getAttribute('href');
  expect(new URL(apple).searchParams.has('via')).toBe(false);
  expect(new URL(apple).searchParams.has('client_reference_id')).toBe(false);
  await expect.poll(() => hits.filter(hit => !hit.event).length).toBe(3);
  await page.evaluate(() => document.addEventListener('click', event => event.preventDefault()));
  await page.locator(checkout).click();
  await expect.poll(() => hits.filter(hit => hit.event === 'purchase.checkout').length).toBe(1);
  expect(hits.find(hit => hit.event === 'purchase.checkout').event_value).toBe(`direct:direct-card|via:${id}`);
  expect(hits.find(hit => hit.event === 'download.intent').event_value).toBe(`download-page:hero|via:${id}`);
  expect(hits.some(hit => hit.event === 'purchase.completed')).toBe(false);
  expect(await page.evaluate(() => ({local:localStorage.length, session:sessionStorage.length}))).toEqual({local:0,session:0});
});

test('link catalog uses distinct placement references and the existing Stripe Payment Link', async ({page}) => {
  await isolatedProduction(page);
  const refs = new Set();
  for (const key of Object.keys(placements)) {
    const links = placementLinks(key);
    const url = new URL(links.stripe);
    expect(`${url.origin}${url.pathname}`).toBe(site.links.oneTime);
    expect(reference(links.stripe)).toBe(key);
    refs.add(reference(links.stripe));
  }
  expect(refs.size).toBe(Object.keys(placements).length);
  const product = 'bf2026_x_trayage_reminder';
  await page.goto(`${site.origin}/download/?via=${product}`);
  await expect(page.locator(checkout)).toHaveAttribute('href', placementLinks(product).stripe);
  expect(() => placementLinks('visitor@example.com')).toThrow('Unknown placement');
});

test('known legacy referrals remain directory referrals, while complete registered UTMs identify a placement', async ({page}) => {
  await isolatedProduction(page);
  for (const [query, expected] of [
    ['ref=macbase.app','macbase_listing'],
    ['ref=macapp.supply','macapp_supply_listing'],
    ['ref=macpip','macpip_listing'],
    ['utm_source=x&utm_medium=social&utm_campaign=black_friday_2026&utm_content=personal_reminder',id]
  ]) {
    await page.goto(`${site.origin}/download/?${query}`);
    await expect(page.locator(checkout)).toHaveAttribute('href', placementLinks(expected).stripe);
  }
});

test('unknown, personal, ambiguous and partial tags do not become Stripe references', async ({page}) => {
  await isolatedProduction(page);
  for (const query of ['', 'via=visitor%40example.com', 'via=__proto__', 'via=constructor', 'ref=unknown',
    `via=${id}&via=bf2026_x_trayage_reminder`, 'utm_source=x&utm_campaign=black_friday_2026',
    'via=unknown&ref=macbase.app', 'ref=macbase.app&ref=macpip']) {
    await page.goto(`${site.origin}/download/?${query}`);
    await expect(page.locator(checkout)).toHaveAttribute('href', site.links.oneTime);
    await expect(page.locator(checkout)).toHaveAttribute('data-tinylytics-event-value', 'direct:direct-card');
  }
});

for (const mode of ['existing opt-out', 'query opt-out', 'storage unavailable']) {
  test(`attribution respects ${mode}`, async ({page}) => {
    const hits = await isolatedProduction(page, {ignored:mode==='existing opt-out'});
    if (mode === 'storage unavailable') await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {get() { throw new Error('Storage unavailable'); }});
    });
    await page.goto(`${site.origin}/download/?via=${id}${mode==='query opt-out'?'&ti=true':''}`);
    await expect(page.locator(checkout)).toHaveAttribute('href', site.links.oneTime);
    await expect(page.locator('.header-cta')).toHaveAttribute('href', '/download/');
    expect(hits).toEqual([]);
  });
}

test('blocked analytics and disabled JavaScript leave checkout usable', async ({page, browser}) => {
  const hits = await isolatedProduction(page, {blocked:true});
  await page.goto(`${site.origin}/download/?via=${id}`);
  await expect(page.locator(checkout)).toHaveAttribute('href', placementLinks(id).stripe);
  expect(hits).toEqual([]);
  const context = await browser.newContext({javaScriptEnabled:false});
  const plain = await context.newPage();
  await isolatedProduction(plain);
  await plain.goto(`${site.origin}/download/?via=${id}`);
  await expect(plain.locator(checkout)).toHaveAttribute('href', site.links.oneTime);
  await context.close();
});

test('preserves checkout options, internal fragments, explicit campaigns and other destinations', async ({page}) => {
  await isolatedProduction(page, {transformHtml: body => body.replace('</main>', `
    <a id="promo" href="${site.links.oneTime}?prefilled_promo_code=TRAYAGEBF">Promo</a>
    <a id="existing" href="${site.links.oneTime}?client_reference_id=existing_reference">Existing</a>
    <a id="section" href="/download/?view=direct#direct">Section</a>
    <a id="other-campaign" href="/download/?via=bf2026_x_trayage_reminder">Other</a>
    <a id="outside" href="https://example.com/?ref=existing">Outside</a>
    <a id="other-stripe" href="https://buy.stripe.com/another-link">Other Stripe</a>
    <a id="local-file" href="/assets/guide.pdf">File</a>
    </main>`)});
  await page.goto(`${site.origin}/download/?via=${id}`);
  const promo = new URL(await page.locator('#promo').getAttribute('href'));
  expect(promo.searchParams.get('prefilled_promo_code')).toBe('TRAYAGEBF');
  expect(promo.searchParams.get('client_reference_id')).toBe(id);
  await expect(page.locator('#existing')).toHaveAttribute('href', `${site.links.oneTime}?client_reference_id=existing_reference`);
  await expect(page.locator('#section')).toHaveAttribute('href', `/download/?view=direct&via=${id}#direct`);
  await expect(page.locator('#other-campaign')).toHaveAttribute('href', '/download/?via=bf2026_x_trayage_reminder');
  await expect(page.locator('#outside')).toHaveAttribute('href', 'https://example.com/?ref=existing');
  await expect(page.locator('#other-stripe')).toHaveAttribute('href', 'https://buy.stripe.com/another-link');
  await expect(page.locator('#local-file')).toHaveAttribute('href', '/assets/guide.pdf');
  await page.goto(`${site.origin}/privacy/?via=${id}`);
  await expect(page.locator('#website a[href*="tiny_ignore=true"]')).toHaveAttribute('href', '/?tiny_ignore=true');
});

test('restoring a cached page rechecks opt-out and never appends a placement twice', async ({page}) => {
  await isolatedProduction(page);
  await page.goto(`${site.origin}/download/?via=${id}`);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true})));
  await expect(page.locator(checkout)).toHaveAttribute('data-tinylytics-event-value', `direct:direct-card|via:${id}`);
  await page.evaluate(() => {
    localStorage.setItem('tinylytics_ignore', 'true');
    window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true}));
  });
  await expect(page.locator(checkout)).toHaveAttribute('href', site.links.oneTime);
  await expect(page.locator(checkout)).toHaveAttribute('data-tinylytics-event-value', 'direct:direct-card');
});

test('root and project-path previews neither attribute checkout nor contact analytics', async ({page}) => {
  const requests = [];
  await page.route('https://tinylytics.app/**', route => { requests.push(route.request().url()); return route.abort(); });
  for (const base of ['http://127.0.0.1:4175/', 'http://127.0.0.1:4176/Trayage-website/']) {
    await page.goto(`${base}download/?via=${id}`);
    await expect(page.locator(checkout)).toHaveAttribute('href', site.links.oneTime);
  }
  expect(requests).toEqual([]);
});
