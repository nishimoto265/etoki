const test = require('node:test');
const assert = require('node:assert');
const { dictionary, toReading, leftovers } = require('../src/reading');

const d = dictionary({ 'example.com': 'イグザンプル ドット コム' });

test('大文字の略語を 1 文字ずつ読む', () => {
  assert.strictEqual(toReading('DNS に聞く。', d), 'ディーエヌエス に聞く。');
});

test('辞書の語を先に置き換える', () => {
  assert.strictEqual(toReading('Redis に GET する。', d), 'レディス に ゲット する。');
  assert.strictEqual(toReading('example.com の担当', d), 'イグザンプル ドット コム の担当');
});

test('小数点と画質の p', () => {
  assert.strictEqual(toReading('1.5 秒', d), '1てん5 秒');
  assert.strictEqual(toReading('1080p で見る', d), '1080 ピー で見る');
});

test('読めない英字は残りとして返す', () => {
  assert.deepStrictEqual(leftovers(toReading('fooBar を呼ぶ', d)), ['fooBar']);
});

test('1 文字の漢字の読みは熟語の中で置き換えない', () => {
  const dd = dictionary({ 値: 'あたい' });
  assert.strictEqual(toReading('最大値と値段', dd), '最大値と値段');
});
