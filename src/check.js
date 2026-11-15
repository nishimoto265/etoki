const { pathToFileURL } = require('url');
const path = require('path');
const { spawnSync } = require('child_process');
const { load, resolveDir } = require('./deps');

class BrowserError extends Error {}

async function launch() {
  try {
    return await launchRaw();
  } catch (e) {
    if (e instanceof BrowserError) throw e;
    throw new BrowserError('検査に使うブラウザを起動できませんでした。サンドボックスの中で動かしていると起きることがあります。サンドボックスの外で動かすか、--no-check を付けて組み立ててください（' + String(e.message || e).split('\n')[0] + '）');
  }
}

async function launchRaw() {
  const { chromium } = load('playwright');
  try {
    return await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  } catch (e) {
    if (!/Executable doesn't exist/.test(String(e))) throw e;
    console.error('初回の準備: 検査に使うブラウザを入れます');
    const cli = path.join(resolveDir('playwright'), 'cli.js');
    const r = spawnSync(process.execPath, [cli, 'install', 'chromium', '--only-shell'], { stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_GC: '1' } });
    if (r.status !== 0) throw new BrowserError('検査に使うブラウザを入れられませんでした。ネットワークにつながっているか確かめてください');
    return chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  }
}

async function inspect(htmlFile, opts) {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(pathToFileURL(htmlFile).href);
  await page.waitForFunction(() => window.__wt);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const problems = await page.evaluate(() => {
    const out = [];
    const svg = document.querySelector('#wt-stage svg.wf');
    if (!svg) return out;
    (window.__wfReport || []).forEach((r) => {
      if (r.kind === 'edge-through-box') out.push({ kind: '線が箱を突き抜けている', where: r.edge.replace(/^e-/, '').replace('-', ' -> '), fix: '箱の列か行を変えるか、線に d: で通り道を書く' });
    });
    const boxes = [...svg.querySelectorAll('g.wf-n')].map((g) => {
      const r = g.querySelector(':scope > rect');
      return { id: g.id, parent: g.getAttribute('data-in'), x: +r.getAttribute('x'), y: +r.getAttribute('y'), w: +r.getAttribute('width'), h: +r.getAttribute('height'), g };
    });
    const inside = (a, b) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
    const overlap = (a, b, m) => a.x < b.x + b.w - m && b.x < a.x + a.w - m && a.y < b.y + b.h - m && b.y < a.y + a.h - m;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.parent === b.id || b.parent === a.id) continue;
        if (overlap(a, b, 0)) out.push({ kind: '箱どうしが重なっている', where: a.id + ' と ' + b.id, fix: 'row か col を変える' });
      }
      const a = boxes[i];
      a.g.querySelectorAll(':scope > text').forEach((t) => {
        const bb = t.getBBox();
        if (bb.x < a.x + 4 || bb.x + bb.width > a.x + a.w - 4) out.push({ kind: '文字が箱からはみ出している', where: a.id + '「' + t.textContent + '」', fix: '文字を短くするか、w で箱を広げる' });
      });
    }
    return out;
  });
  const cues = await page.evaluate(() => window.__wt.cues.length);
  for (let k = 0; k < cues; k++) {
    await page.evaluate((n) => window.__wt.show(n), k);
    await page.waitForTimeout(60);
    const found = await page.evaluate((n) => {
      const out = [];
      const stage = document.getElementById('wt-stage');
      const rect = (e) => e.getBoundingClientRect();
      const items = [...stage.querySelectorAll('.wt-note, .wt-chip')].filter((e) => !e.closest('.wt-th')).map((e) => ({ e, r: rect(e), kind: e.classList.contains('wt-chip') ? '線の札' : '付箋', text: e.textContent }));
      const hit = (a, b) => a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          if (hit(items[i].r, items[j].r)) out.push({ kind: items[i].kind + 'と' + items[j].kind + 'が重なっている', where: (n + 1) + ' 番目の文「' + items[i].text + '」「' + items[j].text + '」', fix: '片方を別の文に移すか、付箋の箱を変える' });
        }
      }
      return out;
    }, k);
    problems.push(...found);
  }
  if (opts && opts.play) {
    await page.evaluate(() => window.__wt.show(0));
    await page.click('#wt-ctrl [data-a="toggle"]');
    const t0 = Date.now();
    let st = null;
    while (Date.now() - t0 < 20000) {
      await page.waitForTimeout(200);
      st = await page.evaluate(() => window.__wt.state());
      if (st.i >= Math.min(2, st.n - 1)) break;
    }
    if (st && st.n > 1 && st.i < Math.min(2, st.n - 1)) problems.push({ kind: '再生が進まない', where: `20 秒で ${st ? st.i : 0} 文目まで`, fix: '' });
    else if (opts.play === 'audio' && (st.mode !== 'audio' || !st.heard)) problems.push({ kind: '音声が鳴っていない', where: `再生の状態 ${st.mode}、鳴った文 ${st.heard}`, fix: '' });
    await page.evaluate(() => window.__wt.show(0));
  }
  let shots = [];
  if (opts && opts.shots) {
    for (const k of opts.shots) {
      await page.evaluate((n) => window.__wt.show(n), k);
      await page.waitForTimeout(400);
      const p = opts.shotPath(k);
      await page.screenshot({ path: p });
      shots.push(p);
    }
  }
  await browser.close();
  errors.forEach((e) => problems.push({ kind: 'JavaScript のエラー', where: e, fix: '' }));
  return { problems, shots };
}

module.exports = { inspect, launch, BrowserError };
