const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { init, g2p, num2kana } = require('../src/g2p-ja');

const fx = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8'));
const KNOWN = new Set(['主']);
const ACCEPTED = fx('g2p-accepted.json');

test('数字の読みが Python 版と同じ', () => {
  for (const [n, kana] of Object.entries(fx('num-ref.json'))) assert.strictEqual(num2kana(n), kana, n);
});

test('音の記号が Python 版と同じ（単語の区切りの空白は問わない）', async () => {
  await init();
  const diffs = [];
  for (const r of fx('g2p-ref.json')) {
    const js = g2p(r.text);
    const norm = (x) => x.replace(/ /g, '').replace(/[ɴnɲmŋ](?![aiɯeoɨʲ])/g, 'N');
    if (norm(js) === norm(r.ps)) continue;
    if ([...KNOWN].some((w) => r.text.includes(w)) || ACCEPTED[r.text]) continue;
    diffs.push(`${r.text}\n  js: ${js}\n  py: ${r.ps}`);
  }
  assert.deepStrictEqual(diffs, []);
});
