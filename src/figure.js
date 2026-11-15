(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var IC = {
    browser: '<rect x="2" y="6" width="52" height="42" rx="5"/><path d="M2 17 L54 17"/><circle cx="9" cy="11.5" r="1.8"/><circle cx="15" cy="11.5" r="1.8"/><path d="M12 27 L44 27 M12 34 L38 34 M12 41 L32 41"/>',
    book: '<path d="M28 12 C20 6 9 6 3 9 L3 48 C9 45 20 45 28 50 C36 45 47 45 53 48 L53 9 C47 6 36 6 28 12 Z"/><path d="M28 12 L28 50 M9 18 L21 18 M9 25 L21 25 M35 18 L47 18 M35 25 L47 25"/>',
    cloud: '<path d="M14 44 C5 44 2 36 6 31 C3 24 10 17 17 20 C19 11 31 8 37 15 C44 12 52 18 50 26 C56 29 55 44 46 44 Z"/>',
    split: '<path d="M3 28 L20 28 C32 28 32 10 48 10 M20 28 C32 28 32 46 48 46 M42 5 L49 10 L42 15 M42 41 L49 46 L42 51"/><circle cx="20" cy="28" r="4"/>',
    server: '<rect x="4" y="4" width="48" height="14" rx="3"/><rect x="4" y="21" width="48" height="14" rx="3"/><rect x="4" y="38" width="48" height="14" rx="3"/><circle cx="12" cy="11" r="1.8"/><circle cx="12" cy="28" r="1.8"/><circle cx="12" cy="45" r="1.8"/><path d="M30 11 L45 11 M30 28 L45 28 M30 45 L45 45"/>',
    db: '<ellipse cx="28" cy="10" rx="22" ry="7"/><path d="M6 10 L6 46 C6 55 50 55 50 46 L50 10 M6 28 C6 37 50 37 50 28"/>',
    db2: '<ellipse cx="22" cy="12" rx="17" ry="5.5"/><path d="M5 12 L5 44 C5 51 39 51 39 44 L39 12"/><path d="M39 18 C45 18 51 20 51 23 L51 50 C51 57 17 57 17 50 L17 48"/>',
    cache: '<ellipse cx="24" cy="10" rx="19" ry="6"/><path d="M5 10 L5 46 C5 54 43 54 43 46 L43 10"/><path d="M47 18 L38 34 L46 34 L40 50" class="wt-ic-accent"/>',
    folder: '<path d="M3 14 L3 48 L53 48 L53 20 L27 20 L21 12 L5 12 Z"/>',
    person: '<circle cx="28" cy="16" r="10"/><path d="M8 52 C8 38 17 31 28 31 C39 31 48 38 48 52"/>',
    phone: '<rect x="15" y="3" width="26" height="50" rx="5"/><path d="M24 9 L32 9"/><circle cx="28" cy="46" r="2"/>',
    queue: '<rect x="3" y="18" width="13" height="22" rx="2"/><rect x="21" y="18" width="13" height="22" rx="2"/><rect x="39" y="18" width="13" height="22" rx="2"/><path d="M3 50 L50 50 M44 45 L50 50 L44 55"/>',
    gear: '<circle cx="28" cy="28" r="9"/><path d="M28 4 L28 12 M28 44 L28 52 M4 28 L12 28 M44 28 L52 28 M11 11 L17 17 M39 39 L45 45 M11 45 L17 39 M39 17 L45 11"/>',
    log: '<rect x="8" y="4" width="40" height="48" rx="4"/><path d="M16 16 L40 16 M16 26 L40 26 M16 36 L32 36"/>',
    chart: '<path d="M4 52 L52 52"/><rect x="9" y="30" width="9" height="22"/><rect x="24" y="18" width="9" height="34"/><rect x="39" y="8" width="9" height="44"/>',
    lock: '<rect x="8" y="24" width="40" height="28" rx="4"/><path d="M16 24 L16 16 C16 9 21 4 28 4 C35 4 40 9 40 16 L40 24"/><circle cx="28" cy="38" r="3"/>',
    key: '<circle cx="16" cy="28" r="10"/><path d="M26 28 L52 28 M44 28 L44 37 M36 28 L36 34"/>',
    mail: '<rect x="3" y="11" width="50" height="34" rx="4"/><path d="M3 13 L28 31 L53 13"/>',
    gateway: '<path d="M3 28 L24 28 M17 21 L24 28 L17 35"/><rect x="26" y="8" width="26" height="40" rx="4"/><path d="M33 20 L45 20 M33 28 L45 28 M33 36 L45 36"/>',
    file: '<path d="M10 3 L36 3 L48 15 L48 53 L10 53 Z"/><path d="M36 3 L36 15 L48 15 M18 28 L40 28 M18 37 L40 37 M18 46 L32 46"/>',
    video: '<rect x="3" y="10" width="50" height="36" rx="5"/><path d="M23 19 L37 28 L23 37 Z"/>',
    code: '<path d="M18 14 L5 28 L18 42 M38 14 L51 28 L38 42 M32 8 L24 48"/>',
    globe: '<circle cx="28" cy="28" r="23"/><path d="M5 28 L51 28 M28 5 C16 18 16 38 28 51 M28 5 C40 18 40 38 28 51"/>',
    robot: '<rect x="8" y="16" width="40" height="32" rx="6"/><circle cx="20" cy="31" r="4"/><circle cx="36" cy="31" r="4"/><path d="M28 16 L28 6 M22 41 L34 41"/><circle cx="28" cy="5" r="2"/>'
  };
  var L = { label: 25, sub: 17, padX: 26, colGap: 46, groupPad: 22, top: 58, rowGap: 52, innerLabel: 18, innerSub: 14 };

  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function textW(s, size) {
    var w = 0;
    for (var i = 0; i < String(s || '').length; i++) {
      var c = s.charCodeAt(i);
      w += c < 0x2000 ? (c === 32 ? 0.32 : 0.6) * size : size * 1.04;
    }
    return w;
  }
  function nodeSize(n) {
    var inner = !!n.in;
    var ls = inner ? L.innerLabel : L.label, ss = inner ? L.innerSub : L.sub;
    var lines = String(n.label).split('\n');
    var tw = Math.max.apply(null, lines.map(function (l) { return textW(l, ls); }).concat([textW(n.sub || '', ss)]));
    var w = Math.max(inner ? 120 : 180, Math.ceil(tw + (inner ? 36 : 2 * L.padX)));
    var h = inner ? (n.sub ? 70 : 54) : (n.icon ? 130 : (n.sub ? 92 : 76)) + (lines.length - 1) * 28;
    return { w: w, h: h };
  }

  function layout(spec) {
    var cols = spec.columns || [];
    var nodes = spec.nodes || [];
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; var s = nodeSize(n); n._w = n.w || s.w; n._h = n.h || s.h; });
    var top = nodes.filter(function (n) { return !n.in; });
    var colIndex = {};
    cols.forEach(function (c, i) { colIndex[c.id] = i; });
    var colW = cols.map(function () { return 0; });
    top.forEach(function (n) { if (n.x === undefined && colIndex[n.col] !== undefined) colW[colIndex[n.col]] = Math.max(colW[colIndex[n.col]], n._w); });
    var inners = {};
    nodes.forEach(function (n) { if (n.in) (inners[n.in] = inners[n.in] || []).push(n); });
    Object.keys(inners).forEach(function (pid) {
      var p = byId[pid], kids = inners[pid];
      var nc = 0, nr = 0, iw = 0, ih = 0;
      kids.forEach(function (k) { nc = Math.max(nc, (k.col || 0) + 1); nr = Math.max(nr, (k.row || 0) + 1); iw = Math.max(iw, k._w); ih = Math.max(ih, k._h); });
      p._innerCell = { w: iw, h: ih, nc: nc, nr: nr };
      var needW = 24 * 2 + nc * iw + (nc - 1) * 40;
      var needH = 82 + nr * ih + (nr - 1) * 18 + 22;
      if (!p.w) p._w = Math.max(p._w, needW);
      if (!p.h) p._h = Math.max(p._h, needH);
      p.labelTop = true;
      if (colIndex[p.col] !== undefined) colW[colIndex[p.col]] = Math.max(colW[colIndex[p.col]], p._w);
    });
    var rowH = 0;
    top.forEach(function (n) { if (!inners[n.id]) rowH = Math.max(rowH, n._h); });
    rowH = rowH || 92;
    var pitch = rowH + L.rowGap;
    var maxRow = 0;
    top.forEach(function (n) {
      var span = n.span || (inners[n.id] ? Math.max(1, Math.ceil((n._h + L.rowGap) / pitch)) : 1);
      n._span = span;
      maxRow = Math.max(maxRow, (n.row || 0) + span);
    });
    var x = 20, colX = [];
    cols.forEach(function (c, i) {
      colX.push(x + L.groupPad);
      x += colW[i] + 2 * L.groupPad + L.colGap;
    });
    var W = Math.max(x - L.colGap + 20, 400);
    var H = L.top + maxRow * pitch - L.rowGap + L.groupPad + 20;
    top.forEach(function (n) {
      if (n.x !== undefined) { n._x = n.x; n._y = n.y; return; }
      var ci = colIndex[n.col] || 0;
      var bandH = n._span * pitch - L.rowGap;
      if (inners[n.id] && !n.h) n._h = Math.max(n._h, bandH);
      n._x = colX[ci] + (colW[ci] - n._w) / 2;
      n._y = L.top + (n.row || 0) * pitch + (Math.min(bandH, Math.max(rowH, n._h)) - n._h) / 2;
      if (n._span > 1 || inners[n.id]) n._y = L.top + (n.row || 0) * pitch;
    });
    Object.keys(inners).forEach(function (pid) {
      var p = byId[pid], c = p._innerCell;
      var gx = (p._w - 48 - c.nc * c.w) / Math.max(1, c.nc - 1);
      gx = c.nc > 1 ? Math.min(Math.max(gx, 30), 90) : 0;
      var totalW = c.nc * c.w + (c.nc - 1) * gx;
      var x0 = p._x + (p._w - totalW) / 2;
      var gy = 18, totalH = c.nr * c.h + (c.nr - 1) * gy;
      var y0 = p._y + 72 + Math.max(0, (p._h - 72 - 16 - totalH) / 2);
      inners[pid].forEach(function (k) {
        if (k.x !== undefined) { k._x = k.x; k._y = k.y; return; }
        k._w = c.w;
        k._x = x0 + (k.col || 0) * (c.w + gx);
        k._y = y0 + (k.row || 0) * (c.h + gy) + (c.h - k._h) / 2;
      });
    });
    var groups = cols.map(function (c, i) {
      return { x: colX[i] - L.groupPad, y: 10, w: colW[i] + 2 * L.groupPad, h: H - 20, label: c.label };
    });
    var maxX = W, maxY = H;
    nodes.forEach(function (n) { maxX = Math.max(maxX, n._x + n._w + 20); maxY = Math.max(maxY, n._y + n._h + 20); });
    var gutX = [groups.length ? groups[0].x - L.colGap / 2 + 10 : 10];
    for (var g = 0; g < groups.length - 1; g++) gutX.push((groups[g].x + groups[g].w + groups[g + 1].x) / 2);
    if (groups.length) gutX.push(groups[groups.length - 1].x + groups[groups.length - 1].w + 12);
    var gutY = [];
    for (var r = 0; r <= maxRow; r++) gutY.push(L.top + r * pitch - L.rowGap / 2);
    return { byId: byId, groups: groups, W: maxX, H: maxY, gutX: gutX, gutY: gutY };
  }

  function box(n) { return { x: n._x, y: n._y, w: n._w, h: n._h, cx: n._x + n._w / 2, cy: n._y + n._h / 2 }; }
  function side(a, b) {
    var A = box(a), B = box(b);
    var dx = B.cx - A.cx, dy = B.cy - A.cy;
    if (Math.abs(dx) * A.h * 1.6 > Math.abs(dy) * A.w) return dx > 0 ? { x: A.x + A.w, y: A.cy, d: 'h', s: 1 } : { x: A.x, y: A.cy, d: 'h', s: -1 };
    return dy > 0 ? { x: A.cx, y: A.y + A.h, d: 'v', s: 1 } : { x: A.cx, y: A.y, d: 'v', s: -1 };
  }
  function bezier(p, q) {
    var c1 = p.d === 'h' ? [p.x + (q.x - p.x) * 0.5, p.y] : [p.x, p.y + (q.y - p.y) * 0.5];
    var c2 = q.d === 'h' ? [q.x - (q.x - p.x) * 0.5, q.y] : [q.x, q.y - (q.y - p.y) * 0.5];
    var pts = [];
    for (var i = 0; i <= 40; i++) {
      var t = i / 40, u = 1 - t;
      pts.push([u * u * u * p.x + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * q.x, u * u * u * p.y + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * q.y]);
    }
    return { d: 'M' + r1(p.x) + ' ' + r1(p.y) + ' C' + r1(c1[0]) + ' ' + r1(c1[1]) + ' ' + r1(c2[0]) + ' ' + r1(c2[1]) + ' ' + r1(q.x) + ' ' + r1(q.y), pts: pts };
  }
  function r1(v) { return Math.round(v * 10) / 10; }
  function poly(points) {
    var clean = [points[0]];
    for (var i = 1; i < points.length; i++) {
      var a = clean[clean.length - 1], b = points[i];
      if (Math.abs(a[0] - b[0]) > 0.5 || Math.abs(a[1] - b[1]) > 0.5) clean.push(b);
    }
    var R = 16, d = 'M' + r1(clean[0][0]) + ' ' + r1(clean[0][1]);
    var pts = [];
    for (var j = 1; j < clean.length; j++) {
      var p0 = clean[j - 1], p1 = clean[j];
      var seg = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      for (var s = 0; s <= seg; s += 6) pts.push([p0[0] + (p1[0] - p0[0]) * s / seg, p0[1] + (p1[1] - p0[1]) * s / seg]);
      if (j < clean.length - 1) {
        var p2 = clean[j + 1];
        var l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        var r = Math.min(R, l1 / 2, l2 / 2);
        var a1 = [p1[0] - (p1[0] - p0[0]) / l1 * r, p1[1] - (p1[1] - p0[1]) / l1 * r];
        var a2 = [p1[0] + (p2[0] - p1[0]) / l2 * r, p1[1] + (p2[1] - p1[1]) / l2 * r];
        d += ' L' + r1(a1[0]) + ' ' + r1(a1[1]) + ' Q' + r1(p1[0]) + ' ' + r1(p1[1]) + ' ' + r1(a2[0]) + ' ' + r1(a2[1]);
      } else d += ' L' + r1(p1[0]) + ' ' + r1(p1[1]);
    }
    pts.push(clean[clean.length - 1]);
    return { d: d, pts: pts };
  }
  function hits(pts, obstacles) {
    var n = 0;
    obstacles.forEach(function (o) {
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (p[0] > o.x - 4 && p[0] < o.x + o.w + 4 && p[1] > o.y - 4 && p[1] < o.y + o.h + 4) { n++; break; }
      }
    });
    return n;
  }
  function route(e, a, b, lay, obstacles) {
    var p = side(a, b), q = side(b, a);
    var cands = [bezier(p, q)];
    var A = box(a), B = box(b);
    var right = B.cx > A.cx;
    var sx = right ? A.x + A.w : A.x, tx = right ? B.x : B.x + B.w;
    var gs = lay.gutX.filter(function (g) { return right ? g > A.x + A.w : g < A.x; }).sort(function (u, v) { return right ? u - v : v - u; });
    var gt = lay.gutX.filter(function (g) { return right ? g < B.x : g > B.x + B.w; }).sort(function (u, v) { return right ? v - u : u - v; });
    if (gs.length && gt.length && Math.abs(A.cx - B.cx) > 10) {
      var g1 = gs[0], g2 = gt[0];
      cands.push(poly([[sx, A.cy], [g1, A.cy], [g1, B.cy], [tx, B.cy]]));
      lay.gutY.forEach(function (gy) {
        cands.push(poly([[sx, A.cy], [g1, A.cy], [g1, gy], [g2, gy], [g2, B.cy], [tx, B.cy]]));
        cands.push(poly([[A.cx, gy > A.cy ? A.y + A.h : A.y], [A.cx, gy], [g2, gy], [g2, B.cy], [tx, B.cy]]));
        cands.push(poly([[sx, A.cy], [g1, A.cy], [g1, gy], [B.cx, gy], [B.cx, gy > B.cy ? B.y + B.h : B.y]]));
        cands.push(poly([[A.cx, gy > A.cy ? A.y + A.h : A.y], [A.cx, gy], [B.cx, gy], [B.cx, gy > B.cy ? B.y + B.h : B.y]]));
      });
    }
    if (Math.abs(A.cx - B.cx) <= 10 || cands.length === 1) {
      var down = B.cy > A.cy;
      cands.push(poly([[A.cx, down ? A.y + A.h : A.y], [A.cx, down ? B.y : B.y + B.h]]));
      lay.gutX.forEach(function (g) {
        cands.push(poly([[g < A.cx ? A.x : A.x + A.w, A.cy], [g, A.cy], [g, B.cy], [g < B.cx ? B.x : B.x + B.w, B.cy]]));
      });
    }
    var best = null;
    cands.forEach(function (c, i) {
      c.hits = hits(c.pts, obstacles);
      c.len = 0;
      for (var k = 1; k < c.pts.length; k++) c.len += Math.hypot(c.pts[k][0] - c.pts[k - 1][0], c.pts[k][1] - c.pts[k - 1][1]);
      c.score = c.hits * 100000 + c.len + (i === 0 ? -60 : 0) + (c.d.split('Q').length - 1) * 40;
      if (!best || c.score < best.score) best = c;
    });
    return best;
  }

  function icon(g, n, svgs) {
    var s = 0.86, w = 56 * s;
    var x = n._x + n._w / 2 - w / 2, y = n._y + 12;
    if (IC[n.icon]) {
      var ig = mk('g', { class: 'wt-ic', transform: 'translate(' + r1(x) + ' ' + r1(y) + ') scale(' + s + ')' }, g);
      ig.innerHTML = IC[n.icon];
      return;
    }
    var ext = svgs && svgs[n.icon];
    if (ext) {
      var holder = mk('svg', { class: 'wt-ic', x: r1(x), y: r1(y), width: w, height: w, viewBox: ext.viewBox || '0 0 24 24' }, g);
      holder.innerHTML = ext.body;
    }
  }

  window.buildFig = function (svg, spec) {
    var lay = layout(spec);
    if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', '0 0 ' + Math.ceil(lay.W) + ' ' + Math.ceil(lay.H));
    svg.classList.add('wf');
    lay.groups.forEach(function (g) {
      mk('rect', { x: g.x, y: g.y, width: g.w, height: g.h, rx: 14, class: 'wf-grp' }, svg);
      var t = mk('text', { x: g.x + 18, y: g.y + 32, class: 'wf-grp-label' }, svg);
      t.textContent = g.label;
    });
    var nodes = spec.nodes || [];
    var report = [];
    function drawEdge(e) {
      var a = lay.byId[e.from], b = lay.byId[e.to];
      if (!a || !b) { report.push({ kind: 'edge-missing', edge: e.id }); return; }
      var obstacles = nodes.filter(function (n) {
        if (n === a || n === b) return false;
        if (n.id === a.in || n.id === b.in) return false;
        return true;
      }).map(box).concat(lay.groups.map(function (g) { return { x: g.x + 12, y: g.y + 10, w: textW(g.label, 20) + 14, h: 32 }; }));
      var r = e.d ? { d: e.d, hits: 0 } : route(e, a, b, lay, obstacles);
      var el = mk('path', { id: e.id, 'data-wt': '', class: 'wf-e' + (e.dashed ? ' wf-dashed' : '') + (a.in || b.in ? ' wf-in' : ''), d: r.d }, svg);
      if (e.d) {
        var len = el.getTotalLength(), pts = [];
        for (var t = 0; t <= len; t += 6) { var pt = el.getPointAtLength(t); pts.push([pt.x, pt.y]); }
        var A = box(a), B = box(b);
        var inner = pts.filter(function (p) { return !(p[0] >= A.x - 6 && p[0] <= A.x + A.w + 6 && p[1] >= A.y - 6 && p[1] <= A.y + A.h + 6) && !(p[0] >= B.x - 6 && p[0] <= B.x + B.w + 6 && p[1] >= B.y - 6 && p[1] <= B.y + B.h + 6); });
        r.hits = hits(inner, obstacles.filter(function (o) { return o.h !== 32; }));
      }
      if (r.hits) report.push({ kind: 'edge-through-box', edge: e.id, hits: r.hits });
    }
    (spec.edges || []).forEach(function (e) { var a = lay.byId[e.from], b = lay.byId[e.to]; if (!(a && a.in) && !(b && b.in)) drawEdge(e); });
    nodes.forEach(function (n) {
      var g = mk('g', { id: n.id, 'data-wt': '', 'data-in': n.in || null, class: 'wf-n' + (n.in ? ' wf-in' : '') + (n.kind ? ' wf-' + n.kind : '') }, svg);
      mk('rect', { x: r1(n._x), y: r1(n._y), width: r1(n._w), height: r1(n._h), rx: n.kind === 'store' ? 14 : 6 }, g);
      if (n.icon) icon(g, n, spec.icons);
      var lines = String(n.label).split('\n');
      var ls = n.in ? L.innerLabel : L.label;
      var lh = ls + 6;
      var anchor = n.labelTop ? 'start' : 'middle';
      var lx = n.labelTop ? n._x + 24 : n._x + n._w / 2;
      var block = lines.length * lh + (n.sub ? (n.in ? L.innerSub : L.sub) + 8 : 0);
      var top;
      if (n.labelTop) top = n._y + 40;
      else if (n.icon) top = n._y + 86;
      else top = n._y + (n._h - block) / 2 + ls * 0.85;
      lines.forEach(function (ln, k) { var t = mk('text', { x: r1(lx), y: r1(top + k * lh), 'text-anchor': anchor, class: 'wf-label' }, g); t.textContent = ln; });
      if (n.sub) { var s = mk('text', { x: r1(lx), y: r1(top + (lines.length - 1) * lh + (n.in ? L.innerSub : L.sub) + 9), 'text-anchor': anchor, class: 'wf-sub' }, g); s.textContent = n.sub; }
    });
    (spec.edges || []).forEach(function (e) { var a = lay.byId[e.from], b = lay.byId[e.to]; if ((a && a.in) || (b && b.in)) drawEdge(e); });
    nodes.filter(function (n) { return n.in; }).forEach(function (n) { var g = document.getElementById(n.id); if (g && g.parentNode === svg) svg.appendChild(g); });
    window.__wfReport = report;
    return lay;
  };
  window.buildFig.icons = IC;
})();
