// Renders the design-identity sheet (type specimen, logo, colour) in light and dark with the real
// Keepwell Sans and Keepwell Mono files from the product repo. The fonts are only read, never copied here.
// Usage: node tools/make_identity.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require('./pw.cjs');

const FONTS = process.env.KEEPWELL_FONTS || path.join(process.env.HOME, 'Documents/MendGrid/design/fonts/dist');
const OUT = path.join(__dirname, 'out', 'identity');
fs.mkdirSync(OUT, { recursive: true });
const mark = fs.readFileSync(path.join(__dirname, '..', 'assets', 'brand', 'mark-ink.svg'), 'utf8').replace('<svg ', '<svg class="mark" ').replace(/#141518/g, 'currentColor');

const T = {
  light: { canvas: '#F2F0EA', sheet: '#FAF9F6', ink: '#141518', ink2: '#4A4943', ink3: '#64625B', line: 'rgba(20,21,24,.13)', breach: '#B3261E', done: '#2F7A43', moving: '#2C5FA8',
    trades: [['Fire', '#C2361F'], ['Water', '#2A7449'], ['Electrical', '#A1500A'], ['Air', '#2F6E9E'], ['Lifts', '#8A5E3A'], ['Gas', '#7D6200'], ['Mechanical', '#64625B']] },
  dark: { canvas: '#0B0C0F', sheet: '#121317', ink: '#ECEAE4', ink2: '#A8A69E', ink3: '#8A887F', line: 'rgba(236,234,228,.13)', breach: '#FF6F5E', done: '#7CC48A', moving: '#8AB8F0',
    trades: [['Fire', '#EF5B47'], ['Water', '#58B07A'], ['Electrical', '#F0913A'], ['Air', '#7FB7E6'], ['Lifts', '#B88C66'], ['Gas', '#D4B13A'], ['Mechanical', '#A8A69E']] },
};

function html(t) {
  const sw = (name, hex, fg) => `<div class="sw"><div class="chip" style="background:${hex}"></div><b>${name}</b><code>${hex}</code></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:KS;src:url('file://${FONTS}/KeepwellSans[wght].woff2') format('woff2');font-weight:400 700}
@font-face{font-family:KM;src:url('file://${FONTS}/KeepwellMono[wght].woff2') format('woff2');font-weight:400 700}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:620px;background:${t.canvas};color:${t.ink};font-family:KS;padding:48px 56px;display:grid;grid-template-columns:1.25fr 1fr;gap:40px}
.k{font-size:13px;color:${t.ink3};margin-bottom:14px}
.big{font-size:120px;font-weight:700;letter-spacing:-.045em;line-height:.9}
.w{display:flex;gap:28px;font-size:30px;margin:22px 0 26px}
.meta{font-size:22px;color:${t.ink2};margin-bottom:12px}
.mono{font-family:KM;font-size:26px;font-weight:500;letter-spacing:0}
.rule{border-top:1px solid ${t.line};margin:26px 0}
.logo{display:flex;align-items:center;gap:18px;font-size:46px;font-weight:700;letter-spacing:-.02em}
.mark{width:64px;height:64px}
.plate{width:64px;height:64px;background:#F5C518;color:#141518;display:grid;place-items:center;border-radius:14px}
.plate .mark{width:44px;height:44px}
.sig{display:flex;gap:0;margin:6px 0 18px;height:88px}
.sig div{flex:1;padding:10px 12px;font-size:14px;display:flex;flex-direction:column;justify-content:flex-end}
.sw{display:grid;grid-template-columns:10px 1fr auto;gap:10px;align-items:center;font-size:15px;padding:5px 0}
.sw .chip{width:8px;height:8px}
.sw code{font-family:KM;font-size:13px;color:${t.ink3}}
.hatch{background:repeating-linear-gradient(45deg,${t.ink3} 0 1px,transparent 1px 7px)}
</style></head><body>
<section>
  <div class="k">Keepwell Sans, from Familjen Grotesk (OFL 1.1)</div>
  <div class="big">Aa ▽ L3</div>
  <div class="w"><span style="font-weight:400">Regular</span><span style="font-weight:500">Medium</span><span style="font-weight:600">Semibold</span><span style="font-weight:700">Bold</span></div>
  <div class="meta">Menara Damansara · Level 3 · WO-1040</div>
  <div class="k" style="margin-top:-4px">The middle dot is redrawn as a dimension tick; ▽ is a drafting level datum.</div>
  <div class="rule"></div>
  <div class="k">Keepwell Mono, from Martian Mono (OFL 1.1), for codes only</div>
  <div class="mono">WO-1031  PTW-00002  L-021</div>
  <div class="mono" style="color:${t.ink2};margin-top:8px">0123456789  0 / O</div>
</section>
<section>
  <div class="k">Riser: one line climbs every floor and ends at the job</div>
  <div class="logo" style="margin-bottom:26px">${mark}<span>Keepwell</span><span class="plate">${mark}</span></div>
  <div class="k">One brand colour, one alarm colour, everything else ink</div>
  <div class="sig">
    <div style="background:#F5C518;color:#141518"><b>Signal</b><code style="font-family:KM">#F5C518</code></div>
    <div style="background:${t.breach};color:${t.canvas}"><b>Breach</b><code style="font-family:KM">${t.breach}</code></div>
    <div style="background:${t.ink};color:${t.canvas}"><b>Ink</b><code style="font-family:KM">${t.ink}</code></div>
    <div style="background:${t.sheet};color:${t.ink};outline:1px solid ${t.line}"><b>Sheet</b><code style="font-family:KM">${t.sheet}</code></div>
    <div class="hatch" style="color:${t.ink};outline:1px solid ${t.line}"><b style="background:${t.canvas}">Planned</b></div>
  </div>
  <div class="k">Trades, after BS 1710 service colours, as 8 px swatches beside a word</div>
  ${t.trades.map(([n, h]) => sw(n, h)).join('')}
</section>
</body></html>`;
}

(async () => {
  const b = await chromium.launch();
  for (const [name, t] of Object.entries(T)) {
    const p = await b.newPage({ viewport: { width: 1200, height: 620 }, deviceScaleFactor: 2 });
    const f = path.join(OUT, `identity-${name}.html`);
    fs.writeFileSync(f, html(t));
    await p.goto('file://' + f);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    const ok = await p.evaluate(() => document.fonts.check('700 20px KS') && document.fonts.check('500 20px KM'));
    if (!ok) throw new Error('fonts did not load from ' + FONTS);
    await p.screenshot({ path: path.join(OUT, `identity-${name}.png`) });
    console.log('ok', name);
  }
  await b.close();
})();
