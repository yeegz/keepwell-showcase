// Helpers shared by the capture scripts. Everything runs against the public demo (synthetic data).
const { chromium } = require('./pw.cjs');

const BASE = process.env.KEEPWELL_URL || 'https://keepwell-951434273932.asia-southeast1.run.app';

const DESK = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

/** A fresh context with the theme pinned and every first-visit hint already dismissed. */
async function context(browser, { theme = 'light', device = DESK, video } = {}) {
  const ctx = await browser.newContext({ ...device, colorScheme: theme, reducedMotion: 'no-preference', ...(video ? { recordVideo: video } : {}) });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem('mg.theme', t);
      for (const k of ['manager', 'dispatcher', 'technician', 'storekeeper']) localStorage.setItem('mg.coach.' + k, '1');
    } catch {}
  }, theme);
  return ctx;
}

/** Waits for the network to settle, the warm-up banner to go, and any hint to close. */
async function ready(page, extra = 600) {
  await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => {});
  await page.locator('mg-warmup-banner .banner').waitFor({ state: 'detached', timeout: 60000 }).catch(() => {});
  for (const name of ['Close tip']) {
    const b = page.getByRole('button', { name });
    if (await b.count()) await b.first().click().catch(() => {});
  }
  await page.waitForTimeout(extra);
}

/** Signs in through the demo chooser on /login. `who` is the visible card text, or a name under "More people". */
async function signIn(page, who) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(500);
  let card = page.getByRole('button', { name: who });
  if (!(await card.count())) {
    await page.getByText('More people', { exact: true }).click();
    await page.waitForTimeout(400);
    card = page.getByRole('button', { name: who });
  }
  await card.first().click();
  await page.waitForURL(/\/(app|tech)/, { timeout: 90000 });
  await ready(page);
}

module.exports = { chromium, BASE, DESK, PHONE, context, ready, signIn };

/** Signs in once, without recording, and returns the storage state (the demo keeps its session in localStorage). */
async function session(browser, who, device = DESK) {
  const ctx = await context(browser, { device: { ...device, deviceScaleFactor: 1 } });
  const page = await ctx.newPage();
  await signIn(page, who);
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

/** Waits until the technician app has finished its first sync. */
async function techSynced(page) {
  for (let i = 0; i < 40; i++) {
    if (!/Not synced yet|Syncing/.test(await page.locator('body').innerText())) break;
    await page.waitForTimeout(1000);
  }
  await ready(page, 600);
}

/** Scrolls the section drawing ("Where the work is") to just under the top bar. */
async function drawingIntoView(page, smooth = false) {
  const h = page.getByText('Where the work is', { exact: true });
  await h.waitFor({ timeout: 30000 });
  await h.evaluate((el, smooth) => {
    const card = el.closest('section, article, div');
    window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY - 76, behavior: smooth ? 'smooth' : 'instant' });
  }, smooth);
}

module.exports.session = session;
module.exports.techSynced = techSynced;
module.exports.drawingIntoView = drawingIntoView;
