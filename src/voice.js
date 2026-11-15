const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT = 'kokoro:jf_alpha';
const KOKORO = {
  jf_alpha: '女性',
  jf_gongitsune: '女性',
  jf_nezumi: '女性',
  jf_tebukuro: '女性',
  jm_kumo: '男性'
};

function configFile() {
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'etoki', 'config.yaml');
}

function userConfig() {
  const f = configFile();
  if (!fs.existsSync(f)) return {};
  const { load } = require('./deps');
  return load('js-yaml').load(fs.readFileSync(f, 'utf8')) || {};
}

function parse(s) {
  const v = String(s).trim();
  if (v === 'none' || v === 'browser') return { engine: v, name: null, label: v === 'none' ? '音声なし' : 'ブラウザの読み上げ' };
  const [engine, name] = v.includes(':') ? v.split(':') : ['kokoro', v];
  if (engine === 'kokoro') {
    if (!KOKORO[name]) throw new Error(`Kokoro に ${name} という声はありません（${Object.keys(KOKORO).join(', ')}）`);
    return { engine, name, label: `Kokoro ${name}` };
  }
  throw new Error(`声の指定 ${v} が読めません。kokoro:jf_alpha、browser、none のように書いてください`);
}

const voices = {
  pick(arg, fromFile) {
    if (arg && arg !== true) return parse(arg);
    if (fromFile) return parse(fromFile);
    const cfg = userConfig();
    if (cfg.voice) return parse(cfg.voice);
    return parse(DEFAULT);
  },
  list() {
    return Object.entries(KOKORO).map(([k, g]) => ({ id: 'kokoro:' + k, gender: g }));
  }
};

async function sampler(text, out) {
  const { synthesizeOne } = require('./tts');
  const sentence = text || 'ブラウザは、まず DNS にドメインの IP アドレスを聞く。';
  const rows = [];
  for (const v of voices.list()) {
    const a = await synthesizeOne(sentence, parse(v.id));
    rows.push({ id: v.id, gender: v.gender, src: a.src, dur: a.dur });
  }
  const file = path.resolve(out || 'etoki-voices.html');
  const esc = (s) => String(s).replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'));
  fs.writeFileSync(file, `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>声の聞き比べ</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=JetBrains+Mono&display=swap">
<style>:root{color-scheme:light;--paper:#fbf8f1;--ink:#2b2622;--muted:#6f675b;--line:#d9cfbd}body{margin:0;background:var(--paper);color:var(--ink);font-family:"Klee One",sans-serif;padding:24px max(16px,env(safe-area-inset-left,0px))}h1{font-size:24px;margin:0 0 6px}p{color:var(--muted);margin:0 0 16px;max-width:65ch}ul{list-style:none;padding:0;margin:0;display:grid;gap:10px;max-width:560px}li{display:flex;align-items:center;gap:14px;border-bottom:1px dashed var(--line);padding:8px 0}b{min-width:150px;font-family:"JetBrains Mono",monospace;font-size:14px}span{color:var(--muted);font-size:13px;min-width:3em}audio{height:32px;flex:1;min-width:0}</style></head><body>
<h1>声の聞き比べ</h1><p>「${esc(sentence)}」を、使える声で読ませた。気に入った声の名前をチャットで伝えてください。</p><ul>
${rows.map((r) => `<li><b>${r.id}</b><span>${r.gender}</span><audio controls preload="none" src="${r.src}"></audio></li>`).join('\n')}
</ul></body></html>`);
  return file;
}

module.exports = { voices, parse, sampler, configFile, DEFAULT };
