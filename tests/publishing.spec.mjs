import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import site from '../src/_data/site.json' with {type:'json'};
import releases from '../src/_data/releases.json' with {type:'json'};
import roadmap from '../src/_data/roadmap.json' with {type:'json'};
import press from '../src/_data/press.json' with {type:'json'};
import changelog from '../src/_data/changelog.json' with {type:'json'};
import { entryReleases, validateChangelog } from '../src/_lib/changelog.js';
import renderChangelog from '../src/changelog.11ty.js';
import { validateReleases, validateRoadmap } from '../src/_lib/releases.js';
import download from '../src/download.11ty.js';
import renderRoadmap from '../src/roadmap.11ty.js';
import { home } from '../src/home.mjs';

const readySite = {...site, publicationApproved:true, policiesApproved:true, releaseReady:true};
// Render-only fixtures. These links are not asserted to be published and are never requested.
const direct = {...releases.direct,status:'available',version:'1.0',url:'https://github.com/kylereddoch/Trayage/releases/download/v1.0/Trayage.zip',releasedAt:'2026-09-10',verifiedAt:'2026-09-10',notarized:true,format:'ZIP'};
const appStore = {...releases.appStore,status:'available',version:'1.0',url:'https://apps.apple.com/app/id6810382134',releasedAt:'2026-09-10',verifiedAt:'2026-09-10'};

test('direct and Apple can launch independently, and shared CTAs follow availability', () => {
  for (const [isDirect,isApple] of [[false,false],[true,false],[false,true],[true,true]]) {
    const channels = {...releases,direct:isDirect?direct:releases.direct,appStore:isApple?appStore:releases.appStore};
    validateReleases(channels,readySite);
    const page = download({base:'/Trayage-website/',site:readySite,releases:channels});
    expect(page.includes(`href="${direct.url}"`)).toBe(isDirect);
    expect(page.includes(`href="${appStore.url}"`)).toBe(isApple);
    expect(page).not.toContain('href=""');
    const main = home('/Trayage-website/',readySite,channels);
    expect(main.includes('>Get Trayage <')).toBe(isDirect||isApple);
    expect(page).not.toContain(site.links.oneTime);
  }
  const purchased = download({base:'/',site:{...readySite,checkoutEnabled:true},releases:{...releases,direct}});
  expect(purchased).toContain(site.links.oneTime);
});

test('release switches fail closed with missing or unsafe metadata', () => {
  expect(()=>validateReleases({...releases,direct},site)).toThrow(/approved website/);
  for(const change of [{url:''},{url:'http://downloads.test/app.zip'},{notarized:false},{version:''},{verifiedAt:''},{format:''}]) {
    expect(()=>validateReleases({...releases,direct:{...direct,...change}},readySite)).toThrow();
  }
  expect(()=>validateReleases({...releases,appStore:{...appStore,url:'https://apps.apple.com/app/id123'}},readySite)).toThrow(/this app/);
  expect(()=>validateReleases(releases,{...readySite,checkoutEnabled:true})).toThrow(/Direct checkout/);
});

test('roadmap completion is separate from a public release', () => {
  validateRoadmap(roadmap);
  const source = structuredClone(roadmap);
  const item = source.items.find(i=>i.id==='folder-monitoring');
  item.status='completed';
  let html=renderRoadmap({base:'/',site,roadmap:source});
  expect(html).toContain('Built · not released');
  item.release={version:'1.1',date:'2026-10-01'};
  validateRoadmap(source);
  html=renderRoadmap({base:'/',site,roadmap:source});
  expect(html).toContain('Released in 1.1');
  item.status='planned';
  expect(()=>validateRoadmap(source)).toThrow(/completed status/);
});

test('media ZIP contains the same facts, artwork and screenshots as the page',async()=>{
  const archive=unzipSync(new Uint8Array(await readFile('dist-root/assets/media/trayage-media-kit.zip')));
  const names=Object.keys(archive);
  expect(names).toHaveLength(press.assets.length+press.screenshots.length+2);
  for(const asset of [...press.assets,...press.screenshots]) {
    const entry=archive[`Trayage Media Kit/${asset.path.split('/').at(-1)}`];
    expect(Buffer.from(entry)).toEqual(await readFile(`public/${asset.path}`));
  }
  const facts=strFromU8(archive['Trayage Media Kit/fact-sheet.txt']);
  expect(facts).toContain(press.shortDescription);
  expect(facts).toContain('No public download yet');
  expect(facts).toContain('US$29.99 once');
  expect(facts).toContain('free download and file review');
  expect(facts).toContain('separate US$29.99 one-time in-app unlock');
  expect(facts).not.toMatch(/license key:|\/Users\/|Keylight\.local/i);
});

test('changelog preserves prerelease status, separate channel dates, and older release history', () => {
  validateChangelog(changelog);
  const entry = structuredClone(changelog.entries[0]);
  const preview = renderChangelog({base:'/Trayage-website/', changelog, releases});
  expect(preview).toContain('Prerelease · Build 1');
  expect(preview).toContain('No public release date yet.');
  expect(preview).not.toContain('<time');
  expect(preview).toContain('/Trayage-website/roadmap/');
  const staggered = {...releases,direct,appStore:{...appStore,releasedAt:'2026-09-12'}};
  expect(entryReleases(entry,{...releases,direct})).toEqual({direct:'2026-09-10'});
  expect(entryReleases(entry,staggered)).toEqual({direct:'2026-09-10',appStore:'2026-09-12'});
  const live = renderChangelog({base:'/',changelog,releases:staggered});
  expect(live).not.toContain('Prerelease · Build');
  expect(live).toContain('datetime="2026-09-12"');
  entry.releaseHistory={direct:'2026-09-10'};
  expect(entryReleases(entry,{...releases,direct:{...direct,version:'1.1',releasedAt:'2026-09-20'}})).toEqual({direct:'2026-09-10'});
  entry.releaseHistory={appStore:'2026-02-30'};
  expect(()=>validateChangelog({entries:[entry]})).toThrow(/invalid channel release date/);
});

test('changelog and purchase wording retain the publisher and developer distinction', async ({page}) => {
  await page.goto('http://127.0.0.1:4176/Trayage-website/changelog/');
  await expect(page.locator('#version-1-0')).toContainText('Prerelease · Build 1');
  await expect(page.locator('#version-1-0 time')).toHaveCount(0);
  await expect(page.locator('.footer-bottom')).toContainText('© 2026 RelayByte');
  await expect(page.locator('.publisher')).toContainText('Made by Kyle Reddoch.');
  await page.goto('http://127.0.0.1:4176/Trayage-website/download/');
  await expect(page.locator('#mac-app-store')).toContainText('free download with in-app purchases');
  await expect(page.locator('#mac-app-store')).toContainText('no automatic charge');
  await expect(page.locator('#mac-app-store')).toContainText('Separate US$29.99 one-time in-app unlock');
  await page.goto('http://127.0.0.1:4176/Trayage-website/terms/');
  await expect(page.locator('#publisher')).toContainText('published by Kyle Reddoch under the RelayByte brand');
  await expect(page.locator('#apple')).toContainText('File review is free.');
});

test('roadmap anchors, download status and media archive work in the browser',async({page})=>{
  await page.goto('http://127.0.0.1:4176/Trayage-website/roadmap/');
  await page.getByRole('navigation',{name:'Roadmap status'}).getByRole('link',{name:/Completed/}).click();
  await expect(page).toHaveURL(/#completed$/);
  await expect(page.locator('#completed .roadmap-item')).toHaveCount(4);
  await expect(page.locator('#completed')).toContainText('Built · not released');
  await page.goto('http://127.0.0.1:4176/Trayage-website/download/');
  await expect(page.locator('main a[href^="https://apps.apple.com"]')).toHaveCount(0);
  await expect(page.locator('main a[href^="https://buy.stripe.com"]')).toHaveCount(0);
  await page.goto('http://127.0.0.1:4176/Trayage-website/media-kit/');
  const downloaded=page.waitForEvent('download');
  await page.getByRole('link',{name:'Download media kit',exact:false}).click();
  const zip=await downloaded;
  expect(zip.suggestedFilename()).toBe('trayage-media-kit.zip');
  expect(await zip.failure()).toBeNull();
});
