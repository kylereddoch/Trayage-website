// Rebuild the share card without changing the app icon or loading remote assets.
// Usage: npm run social:build (install Playwright Chromium or set PLAYWRIGHT_EXECUTABLE_PATH).
import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const icon = `data:image/png;base64,${(await readFile(new URL('public/assets/app-icon.png', root))).toString('base64')}`;
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Trayage social preview</title><style>
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;background:#f7f6f2;color:#262722;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
.card{position:relative;width:1200px;height:630px;padding:56px 66px;overflow:hidden}.brand{font-size:39px;font-weight:700;letter-spacing:-2px;display:flex;align-items:center;gap:12px}.brand img{width:62px;height:62px}.dot{color:#b94117}
.kicker{margin-top:56px;color:#8c3c21;letter-spacing:2.5px;font-size:13px;font-weight:650;text-transform:uppercase}.headline{font-size:76px;line-height:1.03;letter-spacing:-4.7px;font-weight:600;margin:19px 0 0;position:relative;z-index:2}.headline em{font-family:Georgia,serif;font-weight:400;color:#b94117}.description{margin-top:27px;font-size:21px;color:#65665d;line-height:1.55}
.art{position:absolute;right:30px;top:40px;width:490px;height:505px}.halo{position:absolute;width:445px;height:445px;border-radius:50%;top:25px;left:50px;background:radial-gradient(circle at 40% 30%,#f8d99c,#f6e6d5 64%,#f7f6f2 72%)}
.file{position:absolute;background:#fffefa;border:1px solid #deded5;border-radius:17px;padding:20px 24px;width:278px;height:118px;box-shadow:0 15px 36px #4c361c12;color:#65665d;display:flex;gap:17px;align-items:center}.file b{display:block;font-size:18px;color:#37392f;font-weight:550}.file small{font-size:12px;display:block;margin-top:6px;letter-spacing:.5px}.file svg{width:38px;height:45px;stroke:#b94117;stroke-width:1.5;fill:#f8e5d5;flex-shrink:0}.file.one{top:28px;left:98px;transform:rotate(-12deg)}.file.two{top:119px;left:167px;transform:rotate(10deg)}.file.three{top:205px;left:71px;transform:rotate(-5deg)}
.app{position:absolute;top:239px;left:178px;width:238px;filter:drop-shadow(0 20px 20px #49301a24)}.spark{position:absolute;color:#b94117;font:35px Georgia;left:40px;top:188px}.spark.second{font-size:27px;left:420px;top:351px}
.footer{position:absolute;bottom:43px;left:66px;right:66px;border-top:1px solid #deded5;padding-top:19px;display:flex;justify-content:space-between;align-items:center;font-size:15px;color:#65665d}.footer strong{font-size:17px;color:#262722;font-weight:550}.bullet{display:inline-block;width:5px;height:5px;background:#b94117;border-radius:50%;margin:0 12px 3px}
</style><main class="card"><div class="brand"><img src="${icon}" alt="">Trayage<span class="dot">.</span></div><div class="kicker">A native Mac app</div><h1 class="headline">A little order<br>for your<br><em>Downloads.</em></h1><div class="description">Local file analysis. Your files, your decisions.</div><div class="art" aria-hidden="true"><div class="halo"></div><div class="spark">+</div><div class="spark second">+</div>${[['one','Installers','A SECOND LOOK'],['two','Likely duplicates','A LITTLE PERSPECTIVE'],['three','Old or large files','ROOM TO THINK']].map(([cls,title,label])=>`<div class="file ${cls}"><svg viewBox="0 0 36 44"><path d="M5 2h17l9 9v30H5z"/><path d="M22 2v10h9M11 23h14M11 29h10"/></svg><div><b>${title}</b><small>${label}</small></div></div>`).join('')}<img class="app" src="${icon}" alt=""></div><footer class="footer"><span>Review<span class="bullet"></span>Decide<span class="bullet"></span>Make room</span><strong>trayage.app ↗</strong></footer></main></html>`;

await mkdir(new URL('artifacts/seo/', root), { recursive: true });
await writeFile(new URL('artifacts/seo/social-card.html', root), html);
const browser = await chromium.launch(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
  await page.screenshot({ path: fileURLToPath(new URL('public/assets/trayage-social.png', root)) });
} finally { await browser.close(); }
console.log('Created public/assets/trayage-social.png (1200 × 630)');
