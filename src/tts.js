const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync, execFileSync } = require('child_process');
const { load, CACHE } = require('./deps');
const { dictionary, toReading, leftovers } = require('./reading');

const KOKORO_REPO = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const KOKORO_REV = '1939ad2a8e416c0acfeecc08a694d14ef25f2231';
const CREDITS = {
  jf_gongitsune: 'Koniwa（CC BY 3.0）',
  jf_nezumi: 'Koniwa（CC BY 3.0）',
  jf_tebukuro: 'Koniwa（CC BY 3.0）',
  jm_kumo: 'Koniwa（CC BY 3.0）'
};

function hash(s) {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
}

function hasFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  return r.status === 0;
}

async function download(url, file) {
  if (fs.existsSync(file)) return file;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} を取れませんでした（${res.status}）`);
  const total = +res.headers.get('content-length') || 0;
  const tmp = file + '.part';
  const out = fs.createWriteStream(tmp);
  let got = 0, shown = 0;
  for await (const chunk of res.body) {
    out.write(chunk);
    got += chunk.length;
    if (total > 20e6 && got / total - shown >= 0.1) {
      shown = Math.floor((got / total) * 10) / 10;
      process.stderr.write(`  ${path.basename(file)} ${Math.round(shown * 100)}%\n`);
    }
  }
  await new Promise((r) => out.end(r));
  fs.renameSync(tmp, file);
  return file;
}

function kokoroFile(rel) {
  return path.join(CACHE, 'models', 'kokoro', KOKORO_REV.slice(0, 8), rel);
}

let kokoroSession = null;
async function kokoro() {
  if (kokoroSession) return kokoroSession;
  const base = `https://huggingface.co/${KOKORO_REPO}/resolve/${KOKORO_REV}/`;
  if (!fs.existsSync(kokoroFile('onnx/model.onnx'))) console.error(`初回の準備: 読み上げのモデル（約 330 MB）を ${path.dirname(kokoroFile('x'))} に入れます`);
  await download(base + 'onnx/model.onnx', kokoroFile('onnx/model.onnx'));
  await download(base + 'tokenizer.json', kokoroFile('tokenizer.json'));
  const ort = load('onnxruntime-node');
  const session = await ort.InferenceSession.create(kokoroFile('onnx/model.onnx'));
  const vocab = JSON.parse(fs.readFileSync(kokoroFile('tokenizer.json'), 'utf8')).model.vocab;
  const g2p = require('./g2p-ja');
  await g2p.init();
  kokoroSession = { ort, session, vocab, g2p, voices: {} };
  return kokoroSession;
}

async function kokoroVoice(k, name) {
  if (k.voices[name]) return k.voices[name];
  const f = await download(`https://huggingface.co/${KOKORO_REPO}/resolve/${KOKORO_REV}/voices/${name}.bin`, kokoroFile(`voices/${name}.bin`));
  const buf = fs.readFileSync(f);
  k.voices[name] = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  return k.voices[name];
}

async function phonemes(reading, voice) {
  if (voice && voice.lang === 'en') return require('./g2p-en').phonemizeEn(reading, voice.name[0]);
  const g2p = require('./g2p-ja');
  await g2p.init();
  return g2p.g2p(reading);
}

function plainReading(text, dict) {
  let s = String(text);
  for (const k of Object.keys(dict || {}).sort((a, b) => b.length - a.length)) s = s.split(k).join(String(dict[k]));
  return s;
}

async function kokoroSay(reading, voice) {
  const k = await kokoro();
  const style = await kokoroVoice(k, voice.name);
  const ps = await phonemes(reading, voice);
  const ids = [0];
  for (const c of ps) if (k.vocab[c] !== undefined) ids.push(k.vocab[c]);
  ids.push(0);
  const n = Math.min(Math.max(ids.length - 2, 0), 509) * 256;
  const out = await k.session.run({
    input_ids: new k.ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
    style: new k.ort.Tensor('float32', style.slice(n, n + 256), [1, 256]),
    speed: new k.ort.Tensor('float32', new Float32Array([1]), [1])
  });
  return { samples: out.waveform.data, rate: 24000 };
}

function wav(samples, rate) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  return b;
}

function engineSay(voice) {
  if (voice.engine === 'kokoro') return kokoroSay;
  throw new Error('この声では音声を作れません: ' + voice.label);
}

async function synthesizeReading(reading, voice, ffmpeg) {
  const basis = voice.engine === 'kokoro' ? await phonemes(reading, voice) : reading;
  const key = hash([voice.engine, voice.name, KOKORO_REV, basis].join('\n'));
  const dir = path.join(CACHE, 'audio', key.slice(0, 2));
  const meta = path.join(dir, key + '.json');
  if (fs.existsSync(meta)) {
    const m = JSON.parse(fs.readFileSync(meta, 'utf8'));
    const f = path.join(dir, m.file);
    if (fs.existsSync(f)) return { src: `data:${m.mime};base64,` + fs.readFileSync(f).toString('base64'), dur: m.dur, cached: true };
  }
  const { samples, rate } = await engineSay(voice)(reading, voice);
  fs.mkdirSync(dir, { recursive: true });
  const w = path.join(dir, key + '.wav');
  fs.writeFileSync(w, wav(samples, rate));
  let file = key + '.wav', mime = 'audio/wav';
  if (ffmpeg) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', w, '-ac', '1', '-c:a', 'aac', '-b:a', '64k', path.join(dir, key + '.m4a')]);
    fs.rmSync(w);
    file = key + '.m4a';
    mime = 'audio/mp4';
  }
  const dur = samples.length / rate;
  fs.writeFileSync(meta, JSON.stringify({ file, mime, dur, reading }));
  return { src: `data:${mime};base64,` + fs.readFileSync(path.join(dir, file)).toString('base64'), dur, cached: false };
}

function cueId(cues, k) {
  let c = 0;
  for (let j = k - 1; j >= 0 && cues[j].step === cues[k].step; j--) c++;
  return 's' + String(cues[k].step).padStart(2, '0') + 'c' + c;
}

async function synthesize(c, voice) {
  const en = voice.lang === 'en';
  const dict = en ? (c.readings || {}) : dictionary(c.readings);
  const items = c.cues.map((q, k) => ({ id: cueId(c.cues, k), k, reading: en ? plainReading(q.say ? String(q.say) : q.text, dict) : toReading(q.say ? String(q.say) : q.text, dict) }));
  const bad = en ? [] : items.filter((it) => leftovers(it.reading).length);
  if (bad.length) {
    const { SpecError } = require('./compile');
    const e = new SpecError();
    e.list = bad.map((it) => `${it.k + 1} 番目の文: 読みに英字が残っています（${leftovers(it.reading).join(', ')}）。その文に say: で読みを書くか、readings: に読み方を足してください`);
    throw e;
  }
  const ffmpeg = hasFfmpeg();
  if (!ffmpeg) console.error('ffmpeg が無いので、音声を圧縮せずに埋め込みます（ページが大きくなります）');
  const audio = {}, dur = {};
  let made = 0;
  const t0 = Date.now();
  for (const it of items) {
    const r = await synthesizeReading(it.reading, voice, ffmpeg);
    audio[it.id] = r.src;
    dur[it.id] = r.dur;
    if (!r.cached) made++;
  }
  console.error(`読み上げ: ${items.length} 文（新しく作った ${made} 文、使い回し ${items.length - made} 文、${((Date.now() - t0) / 1000).toFixed(1)} 秒）`);
  return { audio, dur, credit: voice.engine === 'kokoro' ? 'Kokoro ' + voice.name + (CREDITS[voice.name] ? '・学習データ ' + CREDITS[voice.name] : '') : voice.label };
}

async function synthesizeOne(text, voice) {
  const reading = voice.lang === 'en' ? text : toReading(text, dictionary({}));
  return synthesizeReading(reading, voice, hasFfmpeg());
}

async function dispose() {
  if (kokoroSession) {
    await kokoroSession.session.release();
    kokoroSession = null;
  }
}

module.exports = { synthesize, synthesizeOne, cueId, dispose };
