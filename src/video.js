const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { execFileSync } = require('child_process');
const { launch } = require('./check');

const GAP_CUE = 0.25;
const GAP_STEP = 0.8;

async function video(htmlFile, cues, audio, dur, out) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'etoki-video-'));
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(pathToFileURL(htmlFile).href);
  await page.waitForFunction(() => window.__wt);
  await page.evaluate(() => document.fonts.ready);
  const ids = await page.evaluate(() => window.__wt.cues.map((q) => q.id));
  const list = [];
  for (let k = 0; k < ids.length; k++) {
    const id = ids[k];
    await page.evaluate((n) => window.__wt.show(n), k);
    await page.waitForTimeout(900);
    const img = path.join(tmp, id + '.png');
    await page.screenshot({ path: img });
    const d = dur[id] || Math.max(1.5, cues[k].text.length * 0.13);
    const gap = k === ids.length - 1 ? 0.6 : cues[k + 1].step !== cues[k].step ? GAP_STEP : GAP_CUE;
    const T = (d + gap).toFixed(3);
    const args = ['-v', 'error', '-y', '-loop', '1', '-framerate', '30', '-t', T, '-i', img];
    if (audio[id]) {
      const m = audio[id].match(/^data:audio\/(\w+);base64,(.*)$/);
      const a = path.join(tmp, id + (m[1] === 'wav' ? '.wav' : '.m4a'));
      fs.writeFileSync(a, Buffer.from(m[2], 'base64'));
      args.push('-i', a);
    } else args.push('-f', 'lavfi', '-t', T, '-i', 'anullsrc=r=44100:cl=mono');
    const seg = path.join(tmp, id + '.mp4');
    args.push('-filter_complex', '[1:a]apad,aresample=44100[a]', '-map', '0:v', '-map', '[a]', '-t', T, '-c:v', 'libx264', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-ar', '44100', '-ac', '1', '-b:a', '96k', seg);
    execFileSync('ffmpeg', args);
    list.push(`file '${seg}'`);
  }
  await browser.close();
  const lst = path.join(tmp, 'list.txt');
  fs.writeFileSync(lst, list.join('\n') + '\n');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  return out;
}

module.exports = { video };
