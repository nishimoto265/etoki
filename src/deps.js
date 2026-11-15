const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const CACHE = process.env.ETOKI_CACHE || path.join(os.homedir(), '.cache', 'etoki');

function depsDir() {
  const h = crypto.createHash('sha1').update(JSON.stringify(PKG.dependencies)).digest('hex').slice(0, 10);
  return path.join(CACHE, 'deps', h);
}

function tryResolve(name, base) {
  try {
    return require.resolve(name, { paths: [base] });
  } catch (e) {
    return null;
  }
}

function install() {
  const dir = depsDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'etoki-deps', private: true, dependencies: PKG.dependencies }, null, 1));
  console.error(`初回の準備: 道具の部品を ${dir} に入れます（数分かかります）`);
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund', '--omit=dev'], { cwd: dir, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('部品を入れられませんでした。ネットワークにつながっているか確かめてください');
}

function resolve(name) {
  const local = tryResolve(name, ROOT);
  if (local) return local;
  const dir = depsDir();
  let p = tryResolve(name, dir);
  if (p) return p;
  install();
  p = tryResolve(name, dir);
  if (!p) throw new Error(`${name} を読み込めません`);
  return p;
}

function load(name) {
  return require(resolve(name));
}

function resolveDir(name) {
  const local = tryResolve(name + '/package.json', ROOT);
  if (local) return path.dirname(local);
  resolve(name);
  return path.dirname(tryResolve(name + '/package.json', depsDir()));
}

module.exports = { load, resolve, resolveDir, CACHE, ROOT };
