// Build local, reproducible social previews from the site's real brand assets.
// No remote images, tracking scripts, accounts, or publication involved.
import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const icon = `data:image/png;base64,${(await readFile(new URL('public/assets/brand-violet/trayage-app-icon.png', root))).toString('base64')}`;
const cards = JSON.parse(await readFile(new URL('src/_data/socialCards.json',root),'utf8'));
const site = JSON.parse(await readFile(new URL('src/_data/site.json',root),'utf8'));
const escape = s => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cardHTML = card => `<!doctype html><html lang="en"><meta charset="utf-8"><title>Trayage social preview</title><style>
*{box-sizing:border-box}
body{margin:0;width:1200px;height:630px;background:#F7F5FC;color:#2C253C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
.card{position:relative;padding:44px 60px;height:630px;overflow:hidden;background:radial-gradient(ellipse at 92% 38%,#EAE1FF 0,transparent 49%)}
.brand{font-size:30px;font-weight:650;display:flex;align-items:center;gap:12px;letter-spacing:-1px}.brand img{width:48px;height:48px}
.kicker{margin:36px 0 0;font-size:13px;color:#6D46BB;font-weight:650;letter-spacing:2px}
.headline{font-size:62px;line-height:1.08;letter-spacing:-3px;font-weight:600;margin:18px 0 22px;width:770px;position:relative;z-index:2}
.headline em{color:#6D46BB;font-style:normal;font-weight:600;letter-spacing:-3px}
.description{font-size:23px;line-height:1.5;color:#61576F;width:690px;margin:0;position:relative;z-index:2}
.art{position:absolute;right:40px;top:185px;width:270px;height:270px;display:flex;align-items:center;justify-content:center}
.art img{width:240px;filter:drop-shadow(0 18px 22px #3D23561C)}
.file{width:142px;height:180px;position:absolute;border:1px solid #D9CDEB;border-radius:12px 40px 12px 12px;background:linear-gradient(135deg,#FFFFFF,#EEE5FB);box-shadow:0 18px 28px #3D235618;transform:rotate(-9deg);display:grid;place-items:center;color:#6D46BB;font-size:66px}
.file::after{content:'';position:absolute;right:0;top:0;width:38px;height:38px;border-left:1px solid #D9CDEB;border-bottom:1px solid #D9CDEB;border-radius:0 38px 0 6px;background:#EAE1FF}
.file.second{transform:rotate(9deg);margin-left:66px;margin-top:32px;z-index:-1}.art.copies{isolation:isolate}
.footer{position:absolute;bottom:38px;left:60px;right:60px;border-top:1px solid #E7E1EF;padding-top:18px;display:flex;justify-content:space-between;font-size:16px;color:#61576F}.footer strong{color:#6D46BB}
</style><main class="card"><div class="brand"><img src="${icon}" alt="">Trayage.</div><p class="kicker">${escape(card.category)}</p><h1 class="headline">${card.title.split('|').map((line,i,all)=>i===all.length-1?`<em>${escape(line)}</em>`:escape(line)).join('<br>')}</h1><p class="description">${escape(card.subtitle)}</p><div class="art ${card.art}" aria-hidden="true">${card.art==='app'?`<img src="${icon}" alt="">`:`<span class="file">${card.art==='installer'?'↓':card.art==='review'?'✓':card.art==='compare'?'↔':'↓'}</span>${card.art==='copies'?'<span class="file second"></span>':''}`}</div><div class="footer"><span>${card.category==='DOWNLOADS CLEANUP FOR MAC'?'Local file analysis · You confirm before cleanup':'Useful answers from the maker of Trayage'}</span><strong>trayage.app ↗</strong></div></main></html>`;
await mkdir(new URL(`public/${site.seo.socialDirectory}/`,root),{recursive:true});
await mkdir(new URL('artifacts/seo/',root),{recursive:true});
const browser = await chromium.launch(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{});
try {
 const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 for(const card of [{key:'home',category:'DOWNLOADS CLEANUP FOR MAC',title:'Find downloads|you no longer need.',subtitle:'Flag installers, likely duplicates, and large or older files. Review free. Confirm before cleanup.',art:'app'},...Object.values(cards)]){
  const html=cardHTML(card);
  await writeFile(new URL(`artifacts/seo/${card.key}.html`,root),html);
  await page.setContent(html);
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  const fits = await page.evaluate(() => { const description = document.querySelector('.description').getBoundingClientRect(); const footer = document.querySelector('.footer').getBoundingClientRect(); const title = document.querySelector('.headline'); return description.bottom + 24 < footer.top && title.scrollWidth <= title.clientWidth; });
  if (!fits) throw new Error(`Social card overflow: ${card.key}`);
  const path=`public/${card.key==='home'?site.seo.image:`${site.seo.socialDirectory}/${card.key}.png`}`;
  await page.screenshot({path:fileURLToPath(new URL(path,root))});
  console.log(`Created ${path} (1200 × 630)`);
 }
} finally {await browser.close();}
