#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { compile, pageHtml, assemble, outPath } = require('../src/build');
const { SpecError } = require('../src/compile');

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      o[k] = v;
    } else o._.push(a);
  }
  return o;
}

async function cmdBuild(args) {
  const file = args._[1];
  if (!file) throw new Error('使い方: etoki build <データファイル.yaml> [--voice 声] [--no-check]');
  const c = compile(file);
  const { voices } = require('../src/voice');
  const voice = voices.pick(args.voice, c.voice);
  let audio = {}, dur = {}, speech = false, credit = '';
  if (voice.engine === 'browser') speech = true;
  else if (voice.engine !== 'none') {
    const { synthesize } = require('../src/tts');
    const r = await synthesize(c, voice);
    audio = r.audio;
    dur = r.dur;
    credit = r.credit;
  }
  const html = assemble(pageHtml(c), audio, dur, { speech, credit });
  const out = args.out ? path.resolve(args.out) : outPath(file);
  fs.writeFileSync(out, html);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${out} を作りました（${kb} KB、声: ${voice.label}、音声 ${Object.keys(audio).length} / ${c.cues.length} 文）`);
  if (args.video) {
    const { spawnSync } = require('child_process');
    if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) throw new Error('動画を作るには ffmpeg が要ります。ffmpeg を入れてから --video を付けてください');
    const { video } = require('../src/video');
    const mp4 = await video(out, c.cues, audio, dur, out.replace(/\.html$/, '.mp4'));
    console.log(`${mp4} を作りました`);
  }
  if (args['no-check']) return;
  const { inspect } = require('../src/check');
  const shotsArg = args.shots ? String(args.shots).split(',').map(Number) : null;
  let r;
  try {
    r = await inspect(out, { play: Object.keys(audio).length ? 'audio' : 'timer', shots: shotsArg || [], shotPath: (k) => out.replace(/\.html$/, `-shot-${k}.png`) });
  } catch (e) {
    if (!(e instanceof require('../src/check').BrowserError)) throw e;
    console.log('崩れの検査をしていません: ' + e.message);
    process.exitCode = 4;
    return;
  }
  r.shots.forEach((p) => console.log('画面: ' + p));
  if (r.problems.length) {
    console.log(`崩れ ${r.problems.length} 件:`);
    r.problems.forEach((p) => console.log(`- ${p.kind}: ${p.where}${p.fix ? '（直し方: ' + p.fix + '）' : ''}`));
    process.exitCode = 3;
  } else console.log('崩れ: なし');
}

async function cmdVoices(args) {
  const { sampler } = require('../src/voice');
  const out = await sampler(args.text, args.out);
  console.log(`${out} を作りました`);
}

const cmds = { build: cmdBuild, voices: cmdVoices };
const args = parseArgs(process.argv.slice(2));
const cmd = cmds[args._[0]];
if (!cmd) {
  console.error('使い方:\n  etoki build <データファイル.yaml> [--voice 声] [--no-check] [--shots 0,3,5] [--video]\n  etoki voices [--text 文]');
  process.exit(1);
}
async function release() {
  if (require.cache[require.resolve('../src/tts')]) await require('../src/tts').dispose();
}

cmd(args).then(release).catch(async (e) => {
  await release().catch(() => {});
  if (e instanceof SpecError) {
    console.error('データファイルの誤り:\n' + e.list.map((x) => '- ' + x).join('\n'));
    process.exitCode = 2;
    return;
  }
  console.error(e.message || e);
  process.exitCode = 1;
});
