// Records the four feature tours from the public demo as Playwright video, plus the time marks
// that tools/compose_gifs.py uses to cut, speed and frame them. Light theme, same scale for every panel.
// Usage: node tools/record-gifs.cjs [scenario]
// Note: each run changes the demo (a request is sent, a job assigned, a job completed, a permit approved).
// The demo resets itself every 24 hours.
const fs = require('fs');
const path = require('path');
const L = require('./lib.cjs');
const API = require('./api.cjs');

const OUT = path.join(__dirname, 'out', 'video');
fs.mkdirSync(OUT, { recursive: true });

const DESK_FULL = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const DESK_SPLIT = { viewport: { width: 994, height: 900 }, deviceScaleFactor: 1 };
const PHONE = { ...L.PHONE, deviceScaleFactor: 1 };

async function recorded(browser, device, storageState) {
  // A split desk panel is 994 px wide; the rail is collapsed there, so ask for the collapsed rail
  // (the person's own preference) and the logo shows as the mark alone.
  const collapse = device.viewport.width < 1200 && !device.isMobile;
  const ctx = await browser.newContext({
    ...device, colorScheme: 'light', storageState,
    recordVideo: { dir: OUT, size: device.viewport },
  });
  await ctx.addInitScript((collapse) => {
    try {
      if (collapse) localStorage.setItem('mg.navCollapsed', '1');
      localStorage.setItem('mg.theme', 'light');
      for (const k of ['manager', 'dispatcher', 'technician', 'storekeeper']) localStorage.setItem('mg.coach.' + k, '1');
    } catch {}
  }, collapse);
  const page = await ctx.newPage();
  const epoch = Date.now();
  return { ctx, page, epoch };
}

async function finish(name, layout, panels, segments) {
  const files = [];
  for (const p of panels) {
    const v = p.page.video();
    await p.ctx.close();
    const dest = path.join(OUT, `${name}-${p.role}.webm`);
    fs.renameSync(await v.path(), dest);
    files.push({ role: p.role, file: path.relative(__dirname, dest), epoch: p.epoch });
  }
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({ name, layout, panels: files, segments }, null, 2));
  console.log('recorded', name, segments.map((s) => ((s[1] - s[0]) / 1000).toFixed(1) + 's').join(' + '));
}

const now = () => Date.now();
const pause = (p, ms) => p.waitForTimeout(ms);
async function blur(p) {
  await p.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
}

const SCENARIOS = {
  /** 1. A resident scans the QR sign in cell A1; the planner converts it; it lands on the drawing. */
  async 'qr-to-drawing'(browser) {
    const victor = await L.session(browser, /Victor Lim/, DESK_SPLIT);
    const desk = await recorded(browser, DESK_SPLIT, victor);
    const phone = await recorded(browser, PHONE);
    await desk.page.goto(L.BASE + '/app/requests', { waitUntil: 'networkidle' });
    await phone.page.goto(L.BASE + '/r/NBP1-LA-A1', { waitUntil: 'networkidle' });
    await L.ready(desk.page, 800); await L.ready(phone.page, 800); await blur(desk.page);
    const q = phone.page, d = desk.page;

    const a0 = now();
    await q.getByText('Leak', { exact: true }).click(); await pause(q, 350);
    await q.locator('textarea').pressSequentially('Oil dripping under the press in cell A1', { delay: 18 });
    await pause(q, 250);
    await q.getByRole('button', { name: 'Send report' }).click();
    await q.getByText('Report received').waitFor({ timeout: 30000 });
    await pause(q, 900);
    const a1 = now();

    await d.reload({ waitUntil: 'networkidle' }); await L.ready(d, 400); await blur(d);
    const b0 = now();
    await pause(d, 400);
    await d.getByRole('button', { name: /Oil dripping under the press/ }).first().click(); await pause(d, 600);
    await d.getByRole('button', { name: /Convert to work order/ }).click(); await pause(d, 600);
    await d.getByText('Urgent', { exact: true }).click(); await pause(d, 400);
    await d.getByRole('button', { name: /Create work order/ }).click(); await pause(d, 1000);
    const b1 = now();

    await d.goto(L.BASE + '/app/overview', { waitUntil: 'networkidle' });
    await d.getByText('Where the work is', { exact: true }).waitFor();
    await L.ready(d, 300); await blur(d);
    const c0 = now();
    await L.drawingIntoView(d, true);
    await pause(d, 2600);
    const c1 = now();
    await finish('qr-to-drawing', 'split', [{ role: 'phone', ...phone }, { role: 'desk', ...desk }], [[a0, a1], [b0, b1], [c0, c1]]);
  },

  /** 2. The dispatcher picks a job, reads the score, and drags it onto the best technician. */
  async 'dispatch-drag'(browser) {
    const meiling = await L.session(browser, /Lim Mei Ling/, DESK_FULL);
    const desk = await recorded(browser, DESK_FULL, meiling);
    const d = desk.page;
    await d.goto(L.BASE + '/app/dispatch', { waitUntil: 'networkidle' });
    await L.ready(d, 1000);
    await d.mouse.move(700, 600); await d.mouse.wheel(0, 130); await pause(d, 600); await blur(d);
    const a0 = now();
    const card = d.locator('li.q-card', { hasText: 'Genset battery low-voltage alarm' }).first();
    const bb = await card.boundingBox();
    await d.mouse.move(bb.x + 120, bb.y + 30, { steps: 12 }); await pause(d, 200);
    await card.click(); await pause(d, 1600);
    const lane = d.getByText('Azman Ismail', { exact: true }).first();
    const lb = await lane.boundingBox();
    await d.mouse.move(bb.x + 120, bb.y + 30); await d.mouse.down();
    await d.mouse.move(bb.x + 200, bb.y + 50, { steps: 8 });
    await d.mouse.move(1215, lb.y + 22, { steps: 28 }); await pause(d, 500);
    await d.mouse.up(); await pause(d, 1900);
    const a1 = now();
    await finish('dispatch-drag', 'desk', [{ role: 'desk', ...desk }], [[a0, a1]]);
  },

  /** 3. A technician with no signal starts and completes a job; it syncs when the signal returns. */
  async 'offline-sync'(browser) {
    // One of Azman's assigned jobs with no permit (lift jobs need one). Each run uses one up.
    const JOB_TITLE = new RegExp(process.env.JOB || 'Corridor lights out');
    const azman = await L.session(browser, /Azman Ismail/, PHONE);
    const daniel = await L.session(browser, /Daniel Tan/, DESK_SPLIT);
    const daniApi = await API.as('daniel@serimutiara.my');
    const list = await daniApi.get('/work-orders?status=assigned&assigneeId=&limit=100');
    const job = list.items.find((w) => JOB_TITLE.test(w.title) && w.assignee && /Azman/.test(w.assignee.name));
    if (!job) throw new Error('no assigned job matching ' + JOB_TITLE + ' for Azman; pick another of his jobs');
    const phone = await recorded(browser, PHONE, azman);
    const desk = await recorded(browser, DESK_SPLIT, daniel);
    const q = phone.page, d = desk.page;
    await q.goto(L.BASE + '/tech', { waitUntil: 'networkidle' }); await L.techSynced(q);
    await q.evaluate((id) => { history.pushState({}, '', '/tech/job/' + id); dispatchEvent(new PopStateEvent('popstate')); }, job.id);
    await pause(q, 1500);
    await d.goto(L.BASE + '/app/work-orders', { waitUntil: 'networkidle' }); await L.ready(d, 1000); await blur(d);

    const a0 = now();
    await phone.ctx.setOffline(true); await pause(q, 1300);
    await q.getByRole('button', { name: 'Start' }).click(); await pause(q, 1300);
    await q.getByRole('button', { name: 'Complete job' }).click(); await pause(q, 1300);
    await q.getByRole('link', { name: 'Back to today' }).click(); await pause(q, 1100);
    const a1 = now();
    await phone.ctx.setOffline(false);
    const b0 = now();
    for (let i = 0; i < 30; i++) { if (/Synced/.test(await q.locator('body').innerText())) break; await pause(q, 300); }
    await pause(q, 700);
    const b1 = now();
    await d.reload({ waitUntil: 'networkidle' }); await L.ready(d, 300); await blur(d);
    const c0 = now();
    await pause(d, 1800);
    const c1 = now();
    await finish('offline-sync', 'split', [{ role: 'phone', ...phone }, { role: 'desk', ...desk }], [[a0, a1], [b0, b1], [c0, c1]]);
  },

  /** 4. A permit raised by the planner is approved by the plant manager; the revision table records it. */
  async 'permit-approval'(browser) {
    const victor = await API.as('victor@northbridge.example');
    const wos = await victor.get('/work-orders?status=open,assigned&limit=100');
    const wo = wos.items.find((w) => /Steam boiler/.test(w.assetName || ''));
    if (!wo) throw new Error('no open boiler job');
    const t = Date.now();
    const permit = await victor.post('/permits', {
      workOrderId: wo.id, type: 'electrical_isolation',
      description: 'Isolate the boiler burner and feed pump to replace the low-water cut-out probe.',
      locationNote: 'Utilities, boiler house',
      hazards: [
        { hazard: 'Hot surfaces and residual steam', controls: 'Boiler shut down and vented, shell below 40 °C', confirmed: true },
        { hazard: 'Burner restarting during work', controls: 'Burner supply isolated and locked at the panel', confirmed: true },
      ],
      isolations: [
        { point: 'Burner control panel main switch', energyType: 'electrical', method: 'Switch off, padlock', lockNumber: 'L-031' },
        { point: 'Feed pump isolator', energyType: 'electrical', method: 'Isolator off, padlock', lockNumber: 'L-032' },
      ],
      validFrom: new Date(t - 60_000).toISOString(), validUntil: new Date(t + 8 * 3600_000).toISOString(),
    });
    await victor.post(`/permits/${permit.id}/transitions`, { to: 'requested', comment: 'Ready for approval' });
    const grace = await L.session(browser, /Grace Ong/, DESK_FULL);
    const desk = await recorded(browser, DESK_FULL, grace);
    const d = desk.page;
    await d.goto(L.BASE + '/app/permits/' + permit.id, { waitUntil: 'networkidle' });
    await L.ready(d, 1000);
    await d.mouse.move(800, 500); await d.mouse.wheel(0, 110); await pause(d, 500); await blur(d);
    const a0 = now();
    await pause(d, 600);
    const btn = d.getByRole('button', { name: 'Approve' }).first();
    const bb = await btn.boundingBox();
    await d.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 18 }); await pause(d, 350);
    await btn.click(); await pause(d, 2600);
    const a1 = now();
    await finish('permit-approval', 'desk', [{ role: 'desk', ...desk }], [[a0, a1]]);
  },
};

(async () => {
  const only = process.argv[2];
  const browser = await L.chromium.launch();
  for (const [name, run] of Object.entries(SCENARIOS)) {
    if (only && only !== name) continue;
    try { await run(browser); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); }
  }
  await browser.close();
})();
