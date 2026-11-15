const fs = require('fs');
const path = require('path');
const { load, resolveDir } = require('./deps');

const DATA = path.join(__dirname, '..', 'data');
const TABLE = JSON.parse(fs.readFileSync(path.join(DATA, 'hepburn.json'), 'utf8'));
let JA_WORDS = null;
const SUTEGANA = new Set('ゃゅょぁぃぅぇぉ');
const ODORI = new Set('〃々ゝゞヽ');
const PHONETIC_EXT = { 'ㇰ': 'ク', 'ㇱ': 'シ', 'ㇲ': 'ス', 'ㇳ': 'ト', 'ㇴ': 'ヌ', 'ㇵ': 'ハ', 'ㇶ': 'ヒ', 'ㇷ': 'フ', 'ㇸ': 'ヘ', 'ㇹ': 'ホ', 'ㇺ': 'ム', 'ㇻ': 'ラ', 'ㇼ': 'リ', 'ㇽ': 'ル', 'ㇾ': 'レ', 'ㇿ': 'ロ' };

const DIG = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
const HUNDRED = { 1: 'ひゃく', 3: 'さんびゃく', 6: 'ろっぴゃく', 8: 'はっぴゃく' };
const THOUSAND = { 1: 'せん', 3: 'さんぜん', 8: 'はっせん' };
function under10000(n) {
  const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, t = Math.floor(n / 10) % 10, o = n % 10;
  let s = '';
  if (th) s += THOUSAND[th] || DIG[th] + 'せん';
  if (h) s += HUNDRED[h] || DIG[h] + 'ひゃく';
  if (t) s += (t === 1 ? '' : DIG[t]) + 'じゅう';
  if (o) s += DIG[o];
  return s;
}
const UNITS = ['', 'まん', 'おく', 'ちょう', 'けい'];
function num2kana(str) {
  let n = BigInt(str);
  if (n === 0n) return 'ゼロ';
  const parts = [];
  let i = 0;
  while (n > 0n) {
    const g = Number(n % 10000n);
    if (g) parts.unshift(under10000(g) + UNITS[i]);
    n /= 10000n;
    i++;
  }
  return parts.join('');
}

const kata2hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const zenToHanAlnum = (s) => s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

function normalize(text) {
  text = text.replace(/[〜～](?=\d)/g, 'から');
  for (const [k, v] of Object.entries(PHONETIC_EXT)) text = text.split(k).join(v);
  text = text.normalize('NFKC');
  text = zenToHanAlnum(text);
  return text;
}

const E_ROW = 'えけげせぜてでねへべぺめれ';
const longE = (h) => h.replace(new RegExp('([' + E_ROW + '])い', 'g'), '$1ー');

function charType(s) {
  const c = s[0];
  if (/\s/.test(c)) return 1;
  if (/[ぁ-ゟ]/.test(c)) return 6;
  if (/[゠-ヿ]/.test(c)) return 7;
  if (/[一-鿿々]/.test(c)) return 2;
  if (/[0-9０-９]/.test(c)) return 4;
  if (/[A-Za-z]/.test(c)) return 5;
  return 3;
}

function single(pk, kk, nk) {
  if (ODORI.has(kk)) {
    if ('ゝヽ'.includes(kk)) return pk || '';
    return '';
  }
  if (pk && TABLE[pk + kk] !== undefined) return TABLE[pk + kk];
  if (nk && TABLE[kk + nk] !== undefined) return '';
  if (nk && SUTEGANA.has(nk)) {
    if (kk === 'っ') return '';
    return (TABLE[kk] || '').slice(0, -1) + TABLE[nk];
  }
  if (SUTEGANA.has(kk)) return '';
  if (kk === 'ー') return 'ː';
  if (kk === 'っ') return 'ʔ';
  if (kk === 'ん') {
    const t = nk !== undefined ? TABLE[nk] : undefined;
    if (t) {
      if ('mpb'.includes(t[0])) return 'm';
      if ('kɡ'.includes(t[0])) return 'ŋ';
      if (['ɲ', 'ʨ', 'ʥ'].some((p) => t.startsWith(p))) return 'ɲ';
      if ('ntdɾz'.includes(t[0])) return 'n';
    }
    return 'ɴ';
  }
  return TABLE[kk] !== undefined ? TABLE[kk] : '';
}

function romajiWord(w) {
  const s = w.surface;
  if (/^[\x00-\x7f]*$/.test(s)) return s;
  if (w.charType === 3) return [...s].map((c) => (TABLE[c] !== undefined ? TABLE[c] : c)).join('');
  if (w.charType !== 6) return '';
  const h = [...w.hira];
  let out = '';
  for (let i = 0; i < h.length; i++) out += single(h[i - 1], h[i], h[i + 1]);
  return out;
}

let tokenizer = null;
async function init() {
  if (tokenizer) return;
  JA_WORDS = new Set(JSON.parse(fs.readFileSync(path.join(DATA, 'ja_words.json'), 'utf8')));
  const kuromoji = load('kuromoji');
  const dicPath = path.join(resolveDir('kuromoji'), 'dict');
  tokenizer = await new Promise((res, rej) => kuromoji.builder({ dicPath }).build((e, t) => (e ? rej(e) : res(t))));
}

function g2p(text) {
  if (!text) return '';
  text = normalize(text);
  let words = [];
  const numWord = (digits) => {
    const k = num2kana(digits).replace(/([うくぐすずつづぬふぶぷむゆゅるおこごそぞとどのほぼぽもよょろ])う/g, '$1ー');
    return { surface: k, hira: k, charType: 6 };
  };
  const prepared = text.replace(/(\d)[ \t]+(?=[^\x00-\x7f])/g, '$1').replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0xfee0));
  let digits = '';
  for (const t of tokenizer.tokenize(prepared)) {
    if (/^[０-９]+$/.test(t.surface_form)) { digits += t.surface_form; continue; }
    if (digits) { words.push(numWord(zenToHanAlnum(digits))); digits = ''; }
    if (t.surface_form.trim() === '') continue;
    const known = t.word_type === 'KNOWN';
    const ct = charType(t.surface_form);
    if (known && ct === 3) { words.push({ surface: t.surface_form, hira: '*', charType: 6 }); continue; }
    const pron = t.pronunciation && t.pronunciation !== '*' ? t.pronunciation : (t.reading && t.reading !== '*' ? t.reading : t.surface_form);
    words.push({ surface: zenToHanAlnum(t.surface_form), hira: /[\u4e00-\u9fff]/.test(t.surface_form) ? longE(kata2hira(pron)) : kata2hira(pron), charType: ct === 7 || known ? 6 : ct });
  }
  if (digits) words.push(numWord(zenToHanAlnum(digits)));
  const groups = [];
  for (let i = 0; i < words.length;) {
    let z = words.length;
    for (let k = i + 1; k < words.length; k++) if (words[k].charType !== words[i].charType) { z = k; break; }
    let j = null;
    for (let k = z; k > i; k--) if (JA_WORDS.has(words.slice(i, k).map((w) => w.surface).join(''))) { j = k; break; }
    if (j === null) { groups.push([words[i]]); i++; } else { groups.push(words.slice(i, j)); i = j; }
  }
  words = groups.map((g) => ({ surface: g.map((w) => w.surface).join(''), hira: g.map((w) => w.hira).join(''), charType: g[0].charType }));
  const out = [];
  for (const w of words) {
    const roma = romajiWord(w);
    const tok = { s: roma, space: true };
    const po = out[out.length - 1];
    if ('「『«'.includes(w.surface) || '(['.includes(roma)) { if (po) po.space = true; }
    else if ('」』»'.includes(w.surface) || ']).,?!:'.includes(roma)) { if (po) po.space = false; tok.space = true; }
    else if (roma === ' ') tok.space = false;
    out.push(tok);
  }
  let s = out.map((t) => t.s.split('っ').join('') + (t.space ? ' ' : '')).join('');
  s = s.trim().replace(/\s+/g, ' ').replace(/\(/g, '«').replace(/\)/g, '»');
  s = s.replace(/(?<![!",.:;?»—…”]) (?=ʔ)|(?<=ʔ) (?!["«“])/g, '');
  return s;
}

module.exports = { init, g2p, num2kana };
