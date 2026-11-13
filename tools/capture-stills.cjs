// Captures the still screens from the public demo, in light and dark.
// Usage: node tools/capture-stills.cjs [onlyName]   -> writes PNGs to tools/out/stills/
const fs = require('fs');
const path = require('path');
const L = require('./lib.cjs');

const OUT = path.join(__dirname, 'out', 'stills');
fs.mkdirSync(OUT, { recursive: true });
const TABLET = { viewport: { width: 834, height: 1112 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function settle(p) {
  await p.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await p.mouse.move(2, 2).catch(() => {});
  await p.waitForTimeout(700);
}
async function techSynced(p) {
  for (let i = 0; i < 40; i++) {
    if (!/Not synced yet|Syncing/.test(await p.locator('body').innerText())) break;
    await p.waitForTimeout(1000);
  }
  await L.ready(p, 800);
}

/** Scrolls the section drawing ("Where the work is") to just under the top bar, then lets it build. */
async function drawingIntoView(p) {
  const h = p.getByText('Where the work is', { exact: true });
  await h.waitFor({ timeout: 30000 });
  await h.evaluate((el) => {
    const card = el.closest('section, article, div');
    window.scrollTo(0, card.getBoundingClientRect().top + window.scrollY - 90);
  });
  await p.waitForTimeout(3000);
}

const SHOTS = {
  async landing(p) {
    await p.goto(L.BASE + '/', { waitUntil: 'networkidle', timeout: 90000 });
    await L.ready(p, 2500);
  },
  async overview(p) {
    await L.signIn(p, /Daniel Tan/);
    await p.waitForTimeout(1500);
  },
  async 'overview-drawing'(p) {
    await L.signIn(p, /Daniel Tan/);
    await drawingIntoView(p);
  },
  async dispatch(p) {
    await L.signIn(p, /Lim Mei Ling/);
    await p.waitForTimeout(1500);
  },
  async permit(p) {
    await L.signIn(p, /Victor Lim/);
    await p.goto(L.BASE + '/app/permits', { waitUntil: 'networkidle' });
    await L.ready(p, 800);
    await p.getByText('PTW-00001').first().click();
    await L.ready(p, 1500);
  },
  async 'factory-overview'(p) {
    await L.signIn(p, /Victor Lim/);
    await p.waitForTimeout(1500);
  },
  async 'factory-drawing'(p) {
    await L.signIn(p, /Victor Lim/);
    await drawingIntoView(p);
  },
  async 'tech-today'(p) {
    await L.signIn(p, /Rajan Pillai/);
    await techSynced(p);
  },
  async 'tech-procedure'(p) {
    await L.signIn(p, /Sivakumar Nair/);
    await techSynced(p);
    await p.getByRole('link', { name: /Open job|Next/ }).first().click();
    await L.ready(p, 800);
    await p.getByRole('link', { name: /Air compressor 2000-hour service/ }).click();
    await L.ready(p, 800);
    await p.getByRole('button', { name: 'All steps' }).click();
    await p.getByText('Oil separator differential pressure').click();
    await p.waitForTimeout(600);
    await p.locator('input').first().fill('0.42');   // typed, never saved
    await p.waitForTimeout(800);
    await p.evaluate(() => window.scrollTo(0, 0));
  },
  async 'tablet-dispatch'(p) {
    await L.signIn(p, /Lim Mei Ling/);
    await p.waitForTimeout(1500);
  },
};

const PLAN = [
  ['landing', L.DESK], ['overview', L.DESK], ['overview-drawing', L.DESK], ['dispatch', L.DESK],
  ['permit', L.DESK], ['factory-overview', L.DESK], ['factory-drawing', L.DESK],
  ['tech-today', L.PHONE], ['tech-procedure', L.PHONE], ['tablet-dispatch', TABLET],
];

(async () => {
  const only = process.argv[2];
  const browser = await L.chromium.launch();
  const jobs = [];
  for (const [name, device] of PLAN) {
    if (only && only !== name) continue;
    for (const theme of ['light', 'dark']) {
      jobs.push(async () => {
        const ctx = await L.context(browser, { theme, device });
        const p = await ctx.newPage();
        try {
          await SHOTS[name](p);
          await settle(p);
          await p.screenshot({ path: path.join(OUT, `${name}-${theme}.png`) });
          console.log('ok', name, theme);
        } catch (e) {
          console.log('FAIL', name, theme, e.message.split('\n')[0]);
        }
        await ctx.close();
      });
    }
  }
  // a few at a time, so the demo is not hammered
  while (jobs.length) await Promise.all(jobs.splice(0, 4).map((j) => j()));
  await browser.close();
})();
