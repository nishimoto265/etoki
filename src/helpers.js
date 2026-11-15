(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var made = [];
  function byId(id) { return document.getElementById(id); }
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function ensureDefs() {
    if (byId('wt-defs')) return;
    var host = mk('svg', { width: '0', height: '0', 'aria-hidden': 'true' });
    host.style.position = 'absolute';
    host.style.width = '0';
    host.style.height = '0';
    var defs = mk('defs', { id: 'wt-defs' }, host);
    [['wt-rough', 3], ['wt-rough2', 11]].forEach(function (f) {
      var fl = mk('filter', { id: f[0], filterUnits: 'userSpaceOnUse', x: '-20000', y: '-20000', width: '60000', height: '60000' }, defs);
      mk('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.03', numOctaves: '2', seed: String(f[1]) }, fl);
      mk('feDisplacementMap', { in: 'SourceGraphic', scale: '2.8' }, fl);
    });
    [['wt-ah', 'var(--wt-hl)'], ['wt-ah-ink', 'var(--wt-ink)']].forEach(function (m) {
      var mm = mk('marker', { id: m[0], viewBox: '0 0 10 10', refX: '7', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
      mk('path', { d: 'M1 1 L8 5 L1 9', fill: 'none', stroke: m[1], 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mm);
    });
    document.body.insertBefore(host, document.body.firstChild);
  }
  function sketch(target) {
    ensureDefs();
    var list = target ? [typeof target === 'string' ? byId(target) : target] : document.querySelectorAll('svg');
    Array.prototype.forEach.call(list, function (s) { if (s && s.id !== 'wt-defs') s.classList.add('wt-sketch'); });
  }
  function clear() {
    document.querySelectorAll('.wt-dim').forEach(function (e) { e.classList.remove('wt-dim'); });
    document.querySelectorAll('.wt-hl').forEach(function (e) { e.classList.remove('wt-hl'); });
    made.forEach(function (e) { e.remove(); });
    made = [];
    document.documentElement.classList.remove('wt-focus');
  }
  function firstShape(e) {
    if (/^(rect|ellipse|circle|polygon)$/i.test(e.tagName)) return e;
    return e.querySelector && e.querySelector('rect, ellipse, circle, polygon');
  }
  function highlight(ids) {
    (ids || []).forEach(function (id) {
      var e = byId(id);
      if (!e) return;
      e.classList.add('wt-hl');
      document.documentElement.classList.add('wt-focus');
      var r = firstShape(e);
      if (r && r.tagName.toLowerCase() === 'rect' && r.ownerSVGElement) {
        var x = +r.getAttribute('x') || 0, y = +r.getAttribute('y') || 0, w = +r.getAttribute('width') || 0, h = +r.getAttribute('height') || 0;
        var d = mk('rect', { x: x + 3, y: y - 2, width: Math.max(0, w - 4), height: h + 3, rx: r.getAttribute('rx') || 4, class: 'wt-double' });
        r.parentNode.insertBefore(d, r.nextSibling);
        made.push(d);
      }
    });
  }
  function pathOf(e) {
    if (!e) return null;
    if (/^(path|line|polyline)$/i.test(e.tagName)) return e;
    return e.querySelector && e.querySelector('path, line, polyline');
  }
  function flow(specs) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (specs || []).forEach(function (spec) {
      var label = null;
      if (spec && typeof spec === 'object') { label = spec.label; spec = spec.e; }
      var rev = spec.charAt(0) === '-';
      var id = rev ? spec.slice(1) : spec;
      var e = byId(id);
      if (!e) return;
      e.classList.add('wt-hl');
      document.documentElement.classList.add('wt-focus');
      var p = pathOf(e);
      if (!p || !p.ownerSVGElement || p.tagName.toLowerCase() !== 'path') return;
      ensureDefs();
      var d = p.getAttribute('d');
      var a = mk('path', { d: d, class: 'wt-grow', 'marker-end': 'url(#wt-ah)' });
      var tf = p.getAttribute('transform');
      if (tf) a.setAttribute('transform', tf);
      if (rev) a.setAttribute('class', 'wt-grow wt-rev');
      p.ownerSVGElement.appendChild(a);
      made.push(a);
      var len = a.getTotalLength();
      if (rev) {
        a.setAttribute('marker-end', '');
        a.setAttribute('marker-start', 'url(#wt-ah)');
      }
      a.style.setProperty('--len', len);
      a.setAttribute('stroke-dasharray', len + ' ' + len);
      if (reduce) a.style.animation = 'none';
      if (label) chip(p.ownerSVGElement, a.getPointAtLength(len / 2), label);
    });
  }
  function chip(svg, pt, text) {
    var g = mk('g', { class: 'wt-chip' });
    svg.appendChild(g);
    var t = mk('text', { x: pt.x, y: pt.y + 6, 'text-anchor': 'middle' });
    t.textContent = text;
    g.appendChild(t);
    var b = t.getBBox();
    var r = mk('rect', { x: b.x - 10, y: b.y - 5, width: b.width + 20, height: b.height + 10, rx: 8 });
    g.insertBefore(r, t);
    made.push(g);
  }
  function boxesIn(svg) {
    var out = [];
    svg.querySelectorAll('[data-wt]').forEach(function (e) {
      if (!e.getBBox) return;
      var tag = e.tagName.toLowerCase();
      if (tag === 'path' || tag === 'line' || tag === 'polyline') return;
      if (e.querySelector && !e.querySelector('rect, ellipse, circle, polygon, text') && tag === 'g') return;
      try { var b = e.getBBox(); if (b.width && b.height) out.push(b); } catch (err) {}
    });
    return out;
  }
  function pinSvg(target, text) {
    var svg = target.ownerSVGElement;
    var tb = target.getBBox();
    var bv = baseVB(svg);
    var vb = bv ? { x: bv[0], y: bv[1], width: bv[2], height: bv[3] } : { x: 0, y: 0, width: svg.clientWidth, height: svg.clientHeight };
    var g = mk('g', { class: 'wt-note' }, svg);
    var lines = String(text).split('\n');
    var t = mk('text', {}, g);
    lines.forEach(function (ln, k) { var s = mk('tspan', { x: 0, dy: k ? '1.3em' : '0' }, t); s.textContent = ln; });
    var tw = 0;
    t.querySelectorAll('tspan').forEach(function (s) { tw = Math.max(tw, s.getComputedTextLength()); });
    var w = tw + 24, h = lines.length * 18 + 14;
    var boxes = boxesIn(svg);
    var cands = [
      { x: tb.x + tb.width - w * 0.55, y: tb.y - h + 8 },
      { x: tb.x + tb.width - w * 0.55, y: tb.y + tb.height - 8 },
      { x: tb.x - w * 0.45, y: tb.y - h + 8 },
      { x: tb.x - w * 0.45, y: tb.y + tb.height - 8 },
      { x: tb.x + tb.width - 12, y: tb.y + tb.height / 2 - h / 2 }
    ];
    var placed = made.filter(function (m) { return m.classList && m.classList.contains('wt-note'); }).map(function (m) { return m.__box; }).filter(Boolean);
    var others = boxes.filter(function (o) { return !(Math.abs(o.x - tb.x) < 1 && Math.abs(o.y - tb.y) < 1 && Math.abs(o.width - tb.width) < 1); });
    function hits(c) {
      if (c.x < vb.x + 4 || c.y < vb.y + 4 || c.x + w > vb.x + vb.width - 4 || c.y + h > vb.y + vb.height - 4) return true;
      return others.concat(placed).some(function (o) { return c.x < o.x + o.width + 4 && c.x + w > o.x - 4 && c.y < o.y + o.height + 4 && c.y + h > o.y - 4; });
    }
    var cp = cands.filter(function (c) { return !hits(c); })[0] || cands[0];
    var x = Math.max(vb.x + 4, Math.min(vb.x + vb.width - w - 4, cp.x));
    var y = Math.max(vb.y + 4, Math.min(vb.y + vb.height - h - 4, cp.y));
    var r = mk('rect', { x: x, y: y, width: w, height: h, rx: 2 });
    g.insertBefore(r, t);
    t.setAttribute('transform', 'translate(' + (x + 12) + ' ' + (y + 19) + ')');
    g.setAttribute('transform', 'rotate(-3 ' + (x + w / 2) + ' ' + (y + h / 2) + ')');
    g.__box = { x: x, y: y, width: w, height: h };
    made.push(g);
  }
  function pin(at, text) {
    var e = byId(at);
    if (!e) return;
    ensureDefs();
    if (e.ownerSVGElement && e.getBBox) { pinSvg(e, text); return; }
    var host = byId('wt-stage') || document.body;
    var hr = host.getBoundingClientRect();
    var r = e.getBoundingClientRect();
    var p = document.createElement('div');
    p.className = 'wt-pin';
    p.textContent = text;
    host.appendChild(p);
    p.style.left = (r.left - hr.left + host.scrollLeft + r.width / 2) + 'px';
    p.style.top = (r.top - hr.top + host.scrollTop - 10) + 'px';
    made.push(p);
  }
  function dimRest() {
    var root = byId('wt-stage') || document.body;
    if (!root.querySelector('.wt-hl')) return;
    root.querySelectorAll('[id], [data-wt]').forEach(function (e) {
      if (e.id && e.id.indexOf('wt-') === 0) return;
      if (e.closest('.wt-hl') || e.querySelector('.wt-hl')) return;
      var tag = e.tagName.toLowerCase();
      if (tag === 'svg' || tag === 'defs' || e.closest('defs') || e.closest('marker') || e.closest('.wt-note')) return;
      if (e.parentElement && e.parentElement.closest('.wt-dim')) return;
      e.classList.add('wt-dim');
    });
  }
  var anim = {};
  function baseVB(svg) {
    if (!svg.dataset.wtVb) {
      var v = svg.viewBox && svg.viewBox.baseVal;
      if (!v || !v.width) return null;
      svg.dataset.wtVb = [v.x, v.y, v.width, v.height].join(' ');
    }
    return svg.dataset.wtVb.split(' ').map(Number);
  }
  function setVB(svg, to) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cur = (svg.getAttribute('viewBox') || to.join(' ')).split(/[\s,]+/).map(Number);
    var key = svg.dataset.wtKey || (svg.dataset.wtKey = String(Math.random()));
    cancelAnimationFrame(anim[key]);
    if (reduce || window.__wtNoAnim) { svg.setAttribute('viewBox', to.join(' ')); return; }
    var t0 = performance.now(), dur = 520;
    function step(now) {
      var k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      svg.setAttribute('viewBox', cur.map(function (c, i) { return c + (to[i] - c) * e; }).join(' '));
      if (k < 1) anim[key] = requestAnimationFrame(step);
    }
    anim[key] = requestAnimationFrame(step);
  }
  function camera(ids, opt) {
    opt = opt || {};
    var svgs = {};
    (ids || []).forEach(function (id) {
      var e = byId(id);
      if (!e || !e.ownerSVGElement || !e.getBBox) return;
      var s = e.ownerSVGElement, b;
      try { b = e.getBBox(); } catch (err) { return; }
      var r = svgs[s.dataset.wtKey || (s.dataset.wtKey = String(Math.random()))] = svgs[s.dataset.wtKey] || { svg: s, x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
      r.x1 = Math.min(r.x1, b.x); r.y1 = Math.min(r.y1, b.y); r.x2 = Math.max(r.x2, b.x + b.width); r.y2 = Math.max(r.y2, b.y + b.height);
    });
    var root = byId('wt-stage') || document;
    root.querySelectorAll('svg.wt-sketch').forEach(function (s) {
      var base = baseVB(s);
      if (!base) return;
      var hit = null;
      for (var k in svgs) if (svgs[k].svg === s) hit = svgs[k];
      var px = s.clientWidth || s.getBoundingClientRect().width;
      var scale = px / base[2];
      var need = opt.force || scale < (opt.below || 0.8);
      if (!hit || !need) { setVB(s, base); return; }
      var pad = opt.pad || 70;
      var w = Math.max(hit.x2 - hit.x1 + pad * 2, base[2] * (opt.min || 0.45));
      var ratio = base[3] / base[2];
      var h = Math.max(hit.y2 - hit.y1 + pad * 2, w * ratio);
      w = Math.max(w, h / ratio);
      w = Math.min(w, base[2]); h = Math.min(h, base[3]);
      var cx = (hit.x1 + hit.x2) / 2, cy = (hit.y1 + hit.y2) / 2;
      var x = Math.max(base[0], Math.min(base[0] + base[2] - w, cx - w / 2));
      var y = Math.max(base[1], Math.min(base[1] + base[3] - h, cy - h / 2));
      setVB(s, [x, y, w, h]);
    });
  }
  function show(o) {
    clear();
    o = o || {};
    highlight(o.on);
    flow(o.flow);
    if (o.dim !== false) dimRest();
    if (o.zoom && o.zoom.length) camera(o.zoom, { force: true });
    else camera([], {});
    (o.pins || []).forEach(function (q) { pin(q.at, q.text); });
  }
  window.etoki = { sketch: sketch, clear: clear, highlight: highlight, flow: flow, pin: pin, show: show, dimRest: dimRest, camera: camera, baseVB: baseVB };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { sketch(); });
  else sketch();
})();
