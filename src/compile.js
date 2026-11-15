const fs = require('fs');
const path = require('path');
const os = require('os');
const { load, resolveDir } = require('./deps');

const ROOT = path.join(__dirname, '..');

class SpecError extends Error {}

function fail(list) {
  const e = new SpecError(list.join('\n'));
  e.list = list;
  throw e;
}

function asList(v) {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function pairs(v) {
  if (Array.isArray(v)) {
    return v.map((x) => {
      if (typeof x === 'string') return [x, null];
      const k = Object.keys(x)[0];
      return [k, x[k]];
    });
  }
  if (v && typeof v === 'object') return Object.entries(v);
  return [];
}

function parseEdgeRef(s) {
  const m = String(s).match(/^\s*([\w.-]+)\s*->\s*([\w.-]+)\s*$/);
  return m ? { from: m[1], to: m[2] } : null;
}

function readIcons(dirs) {
  const out = {};
  for (const d of dirs) {
    if (!d || !fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      if (!f.endsWith('.svg')) continue;
      out[f.slice(0, -4)] = svgParts(fs.readFileSync(path.join(d, f), 'utf8'));
    }
  }
  return out;
}

function svgParts(src) {
  const vb = (src.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 24 24';
  const body = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return { viewBox: vb, body };
}

function lucideIcon(name) {
  try {
    const dir = resolveDir('lucide-static');
    const f = path.join(dir, 'icons', name + '.svg');
    if (fs.existsSync(f)) return svgParts(fs.readFileSync(f, 'utf8'));
  } catch (e) {}
  return null;
}

function compile(file) {
  const yaml = load('js-yaml');
  const srcDir = path.dirname(path.resolve(file));
  const doc = yaml.load(fs.readFileSync(file, 'utf8'));
  const errs = [];
  if (!doc || typeof doc !== 'object') fail(['データファイルが空か、形が違います']);
  if (!doc.title) errs.push('title がありません');
  const fig = doc.figure || {};
  const columns = pairs(fig.columns).map(([id, label]) => (typeof label === 'object' && label ? { id, ...label } : { id, label: label || id }));
  const colIds = new Set(columns.map((c) => c.id));
  const nodes = pairs(fig.nodes).map(([id, n]) => ({ id, ...(n || {}) }));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const builtIn = new Set(['browser', 'book', 'cloud', 'split', 'server', 'db', 'db2', 'cache', 'folder', 'person', 'phone', 'queue', 'gear', 'log', 'chart', 'lock', 'key', 'mail', 'gateway', 'file', 'video', 'code', 'globe', 'robot']);
  const userIcons = readIcons([path.join(srcDir, 'icons'), path.join(os.homedir(), '.config', 'etoki', 'icons')]);
  const icons = {};
  for (const n of nodes) {
    if (!n.label) n.label = n.id;
    if (n.in && !nodeIds.has(n.in)) errs.push(`箱 ${n.id}: in に書いた ${n.in} という箱がありません`);
    if (!n.in && n.x === undefined && !colIds.has(n.col)) errs.push(`箱 ${n.id}: col に書いた ${n.col} という列がありません（列: ${[...colIds].join(', ')}）`);
    if (n.icon && !builtIn.has(n.icon)) {
      if (userIcons[n.icon]) icons[n.icon] = userIcons[n.icon];
      else if (String(n.icon).startsWith('lucide:')) {
        const ic = lucideIcon(n.icon.slice(7));
        if (ic) icons[n.icon] = ic;
        else errs.push(`箱 ${n.id}: ${n.icon} という絵が lucide にありません`);
      } else errs.push(`箱 ${n.id}: ${n.icon} という絵がありません。道具の絵（${[...builtIn].join(', ')}）、lucide:名前、icons/ に置いた SVG のどれかを使ってください`);
    }
  }
  const edges = [];
  const edgeKey = {};
  for (const raw of asList(fig.edges)) {
    const spec = typeof raw === 'string' ? { edge: raw } : raw;
    const ref = parseEdgeRef(spec.edge || '');
    if (!ref) { errs.push(`線 ${JSON.stringify(raw)}: 「a -> b」の形で書いてください`); continue; }
    for (const k of ['from', 'to']) if (!nodeIds.has(ref[k])) errs.push(`線 ${spec.edge}: ${ref[k]} という箱がありません`);
    const id = 'e-' + ref.from + '-' + ref.to;
    edgeKey[ref.from + '>' + ref.to] = id;
    edges.push({ id, from: ref.from, to: ref.to, d: spec.d, dashed: !!spec.dashed });
  }
  function edgeId(s, where) {
    const ref = parseEdgeRef(s);
    if (!ref) { errs.push(`${where}: 線は「a -> b」の形で書いてください（${s}）`); return null; }
    if (edgeKey[ref.from + '>' + ref.to]) return { id: edgeKey[ref.from + '>' + ref.to], ref };
    if (edgeKey[ref.to + '>' + ref.from]) return { id: '-' + edgeKey[ref.to + '>' + ref.from], ref };
    errs.push(`${where}: ${s} という線が figure.edges にありません`);
    return null;
  }
  const cues = [];
  const S = [];
  asList(doc.steps).forEach((st, si) => {
    const says = asList(st.says);
    if (!st.title) errs.push(`ステップ ${si + 1}: title がありません`);
    if (!says.length) errs.push(`ステップ ${si + 1}: says がありません`);
    S.push([]);
    says.forEach((q, ci) => {
      const where = `ステップ ${si + 1}「${st.title || ''}」の ${ci + 1} 文目`;
      if (typeof q === 'string') q = { text: q };
      if (!q.text) errs.push(`${where}: text がありません`);
      const sentences = String(q.text || '').split(/[。！？]/).filter((x) => x.trim()).length;
      if (sentences > 1) errs.push(`${where}: 1 つの文に ${sentences} 文あります。1 文ずつ分けてください`);
      if (/[①-⓿❶-➓]/.test(String(q.text || '') + String(q.caption || ''))) errs.push(`${where}: 丸数字は使わないでください`);
      const on = new Set(asList(q.on));
      const flow = [];
      for (const [k, label] of pairs(q.flow)) {
        const e = edgeId(k, where);
        if (!e) continue;
        on.add(e.ref.from); on.add(e.ref.to);
        flow.push(label ? { e: e.id, label: String(label) } : e.id);
      }
      const pins = [];
      for (const [at, text] of pairs(q.notes)) {
        if (!nodeIds.has(at)) errs.push(`${where}: notes の ${at} という箱がありません`);
        on.add(at);
        pins.push({ at, text: String(text) });
      }
      for (const id of on) if (!nodeIds.has(id)) errs.push(`${where}: on の ${id} という箱がありません`);
      const zoom = asList(q.zoom);
      for (const id of zoom) if (!nodeIds.has(id)) errs.push(`${where}: zoom の ${id} という箱がありません`);
      const show = { on: [...on], flow, pins };
      if (zoom.length) show.zoom = zoom;
      if (q.dim === false || (!on.size && !flow.length)) show.dim = false;
      S[si].push(show);
      const cue = { step: si, text: String(q.text || '') };
      if (ci === 0) cue.title = st.title;
      if (q.caption) cue.caption = String(q.caption);
      if (q.say) cue.say = String(q.say);
      cues.push(cue);
    });
  });
  if (!cues.length) errs.push('steps がありません');
  if (errs.length) fail(errs);
  return {
    title: String(doc.title),
    voice: doc.voice ? String(doc.voice) : null,
    readings: doc.readings || {},
    spec: { columns, nodes, edges, icons },
    cues,
    S,
    srcDir
  };
}

function pageHtml(c) {
  const fig = fs.readFileSync(path.join(__dirname, 'figure.js'), 'utf8');
  const esc = (s) => s.replace(/[<&]/g, (ch) => (ch === '<' ? '&lt;' : '&amp;'));
  const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.title)}</title>
</head>
<body>
<svg id="fig" role="img" aria-label="${esc(c.title).replace(/"/g, '&quot;')}"></svg>
<script>${fig}</script>
<script>
buildFig(document.getElementById('fig'), ${json(c.spec)});
window.__cues = ${json(c.cues.map((q) => { const o = { ...q }; delete o.say; return o; }))};
var S = ${json(c.S)};
window.goTo = function (n, c) { etoki.show(S[n][c]); };
</script>
</body>
</html>
`;
}

module.exports = { compile, pageHtml, SpecError };
