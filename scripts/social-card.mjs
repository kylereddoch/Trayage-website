// Build local, reproducible social previews from the site's real brand assets.
// No remote images, tracking scripts, accounts, or publication involved.
import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const icon = `data:image/png;base64,${(await readFile(new URL('public/assets/media/trayage-icon-512.png', root))).toString('base64')}`;
const cards = JSON.parse(await readFile(new URL('src/_data/socialCards.json',root),'utf8'));
const escape = s => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cardHTML = card => `<!doctype html><html lang="en"><meta charset="utf-8"><title>Trayage social preview</title><style>
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#f7f6f2;color:#262722;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}.card{position:relative;padding:46px 60px;height:630px;overflow:hidden}.brand{font-size:30px;font-weight:650;display:flex;align-items:center;gap:10px;letter-spacing:-1px}.brand img{width:46px;height:46px}.kicker{margin-top:40px;font-size:12px;color:#96401c;font-weight:650;letter-spacing:2px}.headline{font-size:65px;line-height:1.08;letter-spacing:-3px;font-weight:600;margin:18px 0 22px;max-width:760px;position:relative;z-index:2}.headline em{font-family:inherit;color:#b94117;font-weight:600;letter-spacing:normal}.description{font-size:22px;line-height:1.5;color:#65665d;max-width:690px;position:relative;z-index:2}.art{position:absolute;right:35px;top:160px;width:330px;height:310px;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse,#efcda9aa,transparent 70%)}.art img{width:225px;filter:drop-shadow(0 17px 17px #30241b22)}.file{width:145px;height:185px;position:absolute;border:1px solid #cfcac1;border-radius:8px 40px 8px 8px;background:linear-gradient(135deg,#fffefb,#e4e1d8);box-shadow:0 18px 20px #3a28191c;transform:rotate(-12deg);display:grid;place-items:center;color:#b94117;font-size:72px}.file::after{content:'';position:absolute;right:0;top:0;width:39px;height:39px;border-left:1px solid #cfcac1;border-bottom:1px solid #cfcac1;border-radius:0 38px 0 5px;background:#f2f0e9}.file.second{transform:rotate(10deg);margin-left:90px;margin-top:38px}.footer{position:absolute;bottom:38px;left:60px;right:60px;border-top:1px solid #dcd8cf;padding-top:18px;display:flex;justify-content:space-between;font-size:16px;color:#65665d}.footer strong{color:#262722}.art.compare{gap:8px}.compare span{display:block;width:38px;border-radius:5px;background:#d4b394;height:120px}.compare span:nth-child(2){height:165px;background:#ac6336}.compare span:nth-child(3){height:92px;background:#3e4437}.compare span:nth-child(4){height:140px;background:#d4b394}
</style><main class="card"><div class="brand"><img src="${icon}" alt="">Trayage.</div><p class="kicker">${escape(card.category)}</p><h1 class="headline">${card.title.split('|').map((line,i,all)=>i===all.length-1?`<em>${escape(line)}</em>`:escape(line)).join('<br>')}</h1><p class="description">${escape(card.subtitle)}</p><div class="art ${card.art}" aria-hidden="true">${card.art==='app'?`<img src="${icon}" alt="">`:`<span class="file">${card.art==='installer'?'↓':card.art==='review'?'✓':card.art==='compare'?'↔':'↓'}</span>${card.art==='copies'?'<span class="file second"></span>':''}`}</div><div class="footer"><span>${card.category==='DOWNLOADS CLEANUP FOR MAC'?'Local file analysis · You confirm before cleanup':'Useful answers from the maker of Trayage'}</span><strong>trayage.app ↗</strong></div></main></html>`;
await mkdir(new URL('public/assets/social/',root),{recursive:true});
await mkdir(new URL('artifacts/seo/',root),{recursive:true});
const browser = await chromium.launch(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{});
try {
 const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 for(const card of [{key:'home',category:'DOWNLOADS CLEANUP FOR MAC',title:'Find downloads|you no longer need.',subtitle:'Flag installers, likely duplicates, and large or older files. Review free. Confirm before cleanup.',art:'app'},...Object.values(cards)]){
  const html=cardHTML(card);
  await writeFile(new URL(`artifacts/seo/${card.key}.html`,root),html);
  await page.setContent(html);
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  const path=card.key==='home'?'public/assets/trayage-social-v2.png':`public/assets/social/${card.key}.png`;
  await page.screenshot({path:fileURLToPath(new URL(path,root))});
  console.log(`Created ${path} (1200 × 630)`);
 }
} finally {await browser.close();}
