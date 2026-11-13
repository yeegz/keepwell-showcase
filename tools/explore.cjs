const { chromium } = require('./pw.cjs');
const BASE = 'https://keepwell-951434273932.asia-southeast1.run.app';
const out = process.argv[2]; const path = process.argv[3] || '/';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const t0 = Date.now();
  await p.goto(BASE + path, { waitUntil: 'networkidle', timeout: 90000 });
  console.log('loaded in', Date.now() - t0, 'ms', p.url());
  await p.waitForTimeout(3000);
  await p.screenshot({ path: out + '/a.png' });
  console.log((await p.locator('body').innerText()).slice(0, 3000));
  const links = await p.$$eval('a,button', els => els.map(e => (e.tagName + ' ' + (e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ') + ' ' + (e.getAttribute('href')||''))).slice(0, 80));
  console.log(links.join('\n'));
  await b.close();
})();
