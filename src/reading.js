const fs = require('fs');
const path = require('path');
const os = require('os');
const { load } = require('./deps');

const LETTERS = { A: 'エー', B: 'ビー', C: 'シー', D: 'ディー', E: 'イー', F: 'エフ', G: 'ジー', H: 'エイチ', I: 'アイ', J: 'ジェー', K: 'ケー', L: 'エル', M: 'エム', N: 'エヌ', O: 'オー', P: 'ピー', Q: 'キュー', R: 'アール', S: 'エス', T: 'ティー', U: 'ユー', V: 'ブイ', W: 'ダブリュー', X: 'エックス', Y: 'ワイ', Z: 'ゼット' };

function readDict(file) {
  if (!fs.existsSync(file)) return {};
  return load('js-yaml').load(fs.readFileSync(file, 'utf8')) || {};
}

function dictionary(fromFile) {
  const builtIn = readDict(path.join(__dirname, '..', 'data', 'readings-ja.yaml'));
  const user = readDict(path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'etoki', 'readings.yaml'));
  return { ...builtIn, ...user, ...(fromFile || {}) };
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toReading(text, dict) {
  let s = String(text);
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (!/^[\x00-\x7f]+$/.test(k) && [...k].length < 2) continue;
    const word = /^[A-Za-z0-9.-]+$/.test(k);
    const re = word ? new RegExp('(?<![A-Za-z0-9])' + escapeRe(k) + '(?![A-Za-z0-9])', 'g') : new RegExp(escapeRe(k), 'g');
    s = s.replace(re, ' ' + dict[k] + ' ');
  }
  s = s.replace(/(\d)\.(\d)/g, '$1てん$2');
  s = s.replace(/(?<![A-Za-z])[A-Z]{1,6}(?![A-Za-z])/g, (m) => ' ' + [...m].map((c) => LETTERS[c]).join('') + ' ');
  s = s.replace(/(\d)\s*[pP](?![A-Za-z])/g, '$1 ピー');
  s = s.replace(/[ \t]+/g, ' ').replace(/ ([、。，．！？])/g, '$1').trim();
  return s;
}

function leftovers(reading) {
  return reading.match(/[A-Za-z][A-Za-z0-9_.:/-]*/g) || [];
}

module.exports = { dictionary, toReading, leftovers };
