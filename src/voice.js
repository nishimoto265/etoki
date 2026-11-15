const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULTS = { ja: 'kokoro:jf_alpha', en: 'kokoro:af_heart' };
const KOKORO = {
  jf_alpha: '女性 / female',
  jf_gongitsune: '女性 / female',
  jf_nezumi: '女性 / female',
  jf_tebukuro: '女性 / female',
  jm_kumo: '男性 / male',
  af_heart: 'US female',
  af_bella: 'US female',
  af_nicole: 'US female',
  am_michael: 'US male',
  am_fenrir: 'US male',
  am_puck: 'US male',
  bf_emma: 'UK female',
  bm_george: 'UK male',
  bm_fable: 'UK male'
};
const DEFAULT = DEFAULTS.ja;

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
  if (v === 'none' || v === 'browser') return { engine: v, name: null, lang: null, label: v === 'none' ? '音声なし' : 'ブラウザの読み上げ' };
  const [engine, name] = v.includes(':') ? v.split(':') : ['kokoro', v];
  if (engine === 'kokoro') {
    if (!KOKORO[name]) throw new Error(`Kokoro に ${name} という声はありません（${Object.keys(KOKORO).join(', ')}）`);
    return { engine, name, lang: name[0] === 'j' ? 'ja' : 'en', label: `Kokoro ${name}` };
  }
  throw new Error(`声の指定 ${v} が読めません。kokoro:jf_alpha、browser、none のように書いてください`);
}

const voices = {
  pick(arg, fromFile, lang) {
    lang = lang || 'ja';
    let v;
    if (arg && arg !== true) v = parse(arg);
    else if (fromFile) v = parse(fromFile);
    else {
      const cfg = userConfig();
      const fromCfg = cfg[lang === 'en' ? 'voice_en' : 'voice'];
      v = parse(fromCfg || DEFAULTS[lang] || DEFAULT);
    }
    if (v.lang && v.lang !== lang) throw new Error(`声 ${v.name} は ${v.lang === 'en' ? '英語' : '日本語'}の声です。データファイルの lang: ${lang} に合う声を選んでください（例: ${DEFAULTS[lang]}）`);
    return v;
  },
  list(lang) {
    return Object.entries(KOKORO).filter(([k]) => !lang || (lang === 'en') === (k[0] !== 'j')).map(([k, g]) => ({ id: 'kokoro:' + k, gender: g }));
  }
};

async function sampler(text, out, lang) {
  const { synthesizeOne } = require('./tts');
  lang = lang || 'ja';
  const sentence = text || (lang === 'en' ? 'First, the browser asks DNS for the IP address of the domain.' : 'ブラウザは、まず DNS にドメインの IP アドレスを聞く。');
  const rows = [];
  for (const v of voices.list(lang)) {
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
