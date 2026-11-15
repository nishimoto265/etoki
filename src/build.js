const fs = require('fs');
const path = require('path');
const { compile, pageHtml } = require('./compile');

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=JetBrains+Mono:wght@400;600&display=swap">';

function assemble(page, audio, dur, opts) {
  const css = fs.readFileSync(path.join(__dirname, 'player.css'), 'utf8');
  const helpers = fs.readFileSync(path.join(__dirname, 'helpers.js'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, 'player.js'), 'utf8');
  const head = FONTS + '<style id="wt-style">' + css + '</style><script>' + helpers + '</script>';
  let html = page.replace('</head>', head + '</head>');
  const data = '<script>window.__wtAudio=' + JSON.stringify(audio) + ';window.__wtDur=' + JSON.stringify(dur) + ';window.__wtSpeech=' + JSON.stringify(!!opts.speech) + ';window.__wtCredit=' + JSON.stringify(opts.credit || '') + ';</script>';
  const tail = data + '<script>' + js + '</script>';
  const at = html.lastIndexOf('</body>');
  return html.slice(0, at) + tail + html.slice(at);
}

function outPath(file) {
  const p = path.resolve(file);
  return p.replace(/\.ya?ml$/i, '') + '.html';
}

module.exports = { compile, pageHtml, assemble, outPath };
