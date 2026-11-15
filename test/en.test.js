const test = require('node:test');
const assert = require('node:assert');
const { phonemizeEn } = require('../src/g2p-en');

test('英語の文を音の記号に直す', async () => {
  const ps = await phonemizeEn('First, the browser asks DNS for the IP address.', 'a');
  assert.match(ps, /bɹˈaʊzɚ/);
  assert.doesNotMatch(ps, /[A-Z]{2}/);
});

test('数字とお金を英語の読みに直す', async () => {
  const ps = await phonemizeEn('It costs $4.50 in 2026.', 'a');
  assert.match(ps, /dˈɑːlɚz/);
  assert.match(ps, /twˈɛnti twˈɛnti/);
});
