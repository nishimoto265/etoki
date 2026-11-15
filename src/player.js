(function () {
  var EN = window.__wtLang === 'en';
  function T(ja, en) { return EN ? en : ja; }
  var AUDIO = window.__wtAudio || {};
  var DUR = window.__wtDur || {};
  var GAP_CUE = 250;
  var GAP_STEP = 800;
  var NS = 'http://www.w3.org/2000/svg';
  var I = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5.5v13M19 5.5L10 12l9 6.5z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 5.5v13M5 5.5L14 12l-9 6.5z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.5v13M15.5 5.5v13"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5l7 6.5-7 6.5v-4c-5 0-8.5 1.5-11 5 1-5.5 4-10 11-11z"/></svg>',
    loop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10V8a2 2 0 0 1 2-2h11M15 3l3 3-3 3M19 14v2a2 2 0 0 1-2 2H6M9 21l-3-3 3-3"/></svg>',
    full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    unfull: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'
  };

  function el(tag, cls, html, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function fmt(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function init() {
    var raw = window.__cues || [];
    var cues = [];
    var perStep = {};
    raw.forEach(function (q) {
      var c = perStep[q.step] || 0;
      perStep[q.step] = c + 1;
      cues.push({ step: q.step, ci: c, id: 's' + String(q.step).padStart(2, '0') + 'c' + c, text: q.text, caption: q.caption || q.text, title: q.title });
    });
    var steps = [];
    cues.forEach(function (q, k) {
      if (!steps[q.step]) steps[q.step] = { first: k, title: '' };
      if (q.title) steps[q.step].title = q.title;
    });
    function durMs(k) { var d = DUR[cues[k].id]; if (!d) d = Math.max(1.5, cues[k].text.length * (window.__wtSpeech ? 0.17 : 0.13)); return d * 1000; }
    var starts = [], acc = 0;
    cues.forEach(function (q, k) {
      starts.push(acc);
      acc += durMs(k) + (k < cues.length - 1 ? (cues[k + 1].step !== q.step ? GAP_STEP : GAP_CUE) : 0);
    });
    var TOTAL = acc;

    var app = el('div', '', null);
    app.id = 'wt-app';
    var frame = el('div', '', null, app); frame.id = 'wt-frame';
    var main = el('div', '', null, frame); main.id = 'wt-main';
    var titleText = (document.querySelector('title') || {}).textContent || '';
    var head = el('div', '', null, main); head.id = 'wt-head';
    if (titleText) el('h1', '', null, head).textContent = titleText;
    var stage = el('div', '', null, main); stage.id = 'wt-stage';
    Array.prototype.slice.call(document.body.childNodes).forEach(function (n) {
      if (n.nodeName === 'SCRIPT') return;
      if (n.nodeType === 1 && n.querySelector && n.querySelector('#wt-defs')) return;
      stage.appendChild(n);
    });
    document.body.insertBefore(app, document.body.firstChild);
    document.body.classList.add('wt-on');
    var cap = el('div', '', null, main); cap.id = 'wt-cap'; cap.setAttribute('aria-live', 'polite');
    var bar = el('div', '', null, main); bar.id = 'wt-bar';
    bar.setAttribute('role', 'slider'); bar.setAttribute('aria-label', T('再生の位置', 'Playback position')); bar.tabIndex = 0;
    var segs = steps.map(function (s, si) {
      var last = si < steps.length - 1 ? steps[si + 1].first : cues.length;
      var len = (last < cues.length ? starts[last] : TOTAL) - starts[s.first];
      var sg = el('div', 'wt-seg', '<span></span>', bar);
      sg.style.flex = String(Math.max(1, len));
      return { el: sg, from: starts[s.first], len: Math.max(1, len) };
    });
    var dot = el('div', '', null, bar); dot.id = 'wt-head-dot';
    var pv = el('div', '', null, main); pv.id = 'wt-preview'; pv.hidden = true;
    var pvBox = el('div', '', null, pv);
    var pvLabel = el('div', 'wt-pl', '', pv);
    var ctrl = el('div', '', null, main); ctrl.id = 'wt-ctrl';
    var chap = el('button', 'wt-chap', '', ctrl);
    var grp = el('div', 'wt-grp', null, ctrl);
    var bPrev = el('button', 'wt-icon', I.prev, grp); bPrev.setAttribute('aria-label', T('前のステップ', 'Previous step')); bPrev.title = T('前のステップ', 'Previous step'); bPrev.setAttribute('data-a', 'pstep');
    var bPlay = el('button', 'wt-icon wt-play', I.play, grp); bPlay.setAttribute('aria-label', T('再生', 'Play')); bPlay.title = T('再生', 'Play'); bPlay.setAttribute('data-a', 'toggle');
    var bNext = el('button', 'wt-icon', I.next, grp); bNext.setAttribute('aria-label', T('次のステップ', 'Next step')); bNext.title = T('次のステップ', 'Next step'); bNext.setAttribute('data-a', 'nstep');
    var right = el('div', 'wt-right', null, ctrl);
    var time = el('span', '', '', right); time.id = 'wt-time';
    var bRate = el('button', '', '1.0×', right); bRate.id = 'wt-rate'; bRate.title = T('速さ', 'Speed'); bRate.setAttribute('aria-label', T('速さ 1.0 倍', 'Speed 1.0x'));
    var bFull = el('button', 'wt-icon', I.full, right); bFull.setAttribute('aria-label', T('全画面', 'Fullscreen')); bFull.title = T('全画面', 'Fullscreen');
    if (!document.fullscreenEnabled || !app.requestFullscreen) bFull.hidden = true;
    var side = el('div', '', null, frame); side.id = 'wt-side';
    el('div', 'wt-ph', T('この説明の内容', 'Contents'), side);
    var tabs = el('div', 'wt-tabs', null, side); tabs.setAttribute('role', 'tablist');
    var tS = el('button', '', T('ステップ', 'Steps'), tabs), tT = el('button', '', T('全文', 'Transcript'), tabs);
    [tS, tT].forEach(function (b) { b.setAttribute('role', 'tab'); });
    var list = el('div', '', null, side); list.id = 'wt-list';
    var sync = el('button', '', T('今の位置に戻る', 'Back to current'), side); sync.id = 'wt-sync'; sync.hidden = true;
    var toast = el('div', '', '', side); toast.id = 'wt-toast'; toast.hidden = true;
    if (window.__wtCredit) el('div', 'wt-credit', T('音声: ', 'Voice: ') + window.__wtCredit, side);

    var audio = new Audio();
    audio.preload = 'auto';
    var i = 0, playing = false, rate = 1, timer = null, gen = 0, mode = 'idle', heard = 0, loop = -1;
    var tStart = 0, tPaused = 0, raf = 0, listMode = 'steps', detached = false, programmatic = false;
    var rows = [], trows = [], snaps = [];
    audio.addEventListener('playing', function () { heard++; });

    function callGoTo(k) {
      var q = cues[k];
      try { if (typeof window.goTo === 'function') window.goTo(q.step, q.ci); } catch (e) { setTimeout(function () { throw e; }); }
    }
    var KEEP = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'fill-opacity', 'opacity', 'font-size', 'font-weight', 'font-family', 'filter', 'display', 'visibility'];
    function snapshot() {
      var c = stage.cloneNode(true);
      var src = stage.querySelectorAll('svg, svg *');
      var dst = c.querySelectorAll('svg, svg *');
      for (var n = 0; n < src.length && n < dst.length; n++) {
        var cs = getComputedStyle(src[n]);
        var st = '';
        KEEP.forEach(function (k) { var v = cs.getPropertyValue(k); if (v) st += k + ':' + v + ';'; });
        dst[n].setAttribute('style', st);
      }
      c.removeAttribute('id');
      c.querySelectorAll('[id]').forEach(function (e) { e.removeAttribute('id'); });
      c.querySelectorAll('svg[data-wt-vb]').forEach(function (s) { s.setAttribute('viewBox', s.getAttribute('data-wt-vb')); });
      c.querySelectorAll('[data-wt-key]').forEach(function (s) { s.removeAttribute('data-wt-key'); });
      c.querySelectorAll('animate, animateMotion, animateTransform').forEach(function (e) { e.remove(); });
      return c;
    }
    function buildSnaps() {
      window.__wtNoAnim = true;
      var w = stage.clientWidth, h = stage.clientHeight;
      snaps = cues.map(function (q, k) { callGoTo(k); return snapshot(); });
      snaps.w = w; snaps.h = h;
      window.__wtNoAnim = false;
    }
    function mountSnap(host, k, width) {
      host.textContent = '';
      var c = snaps[k].cloneNode(true);
      var s = width / snaps.w;
      c.style.width = snaps.w + 'px';
      c.style.height = snaps.h + 'px';
      c.style.transform = 'scale(' + s + ')';
      c.style.transformOrigin = '0 0';
      c.style.overflow = 'hidden';
      host.style.height = Math.round(snaps.h * s) + 'px';
      host.appendChild(c);
    }

    function nowMs() {
      if (mode === 'audio' && playing && audio.duration) return starts[i] + Math.min(audio.currentTime * 1000, durMs(i));
      if (playing) return starts[i] + Math.min((performance.now() - tStart) * rate, durMs(i));
      if (mode === 'audio' && audio.src && audio.currentTime > 0) return starts[i] + Math.min(audio.currentTime * 1000, durMs(i));
      return starts[i] + tPaused;
    }
    function paint() {
      var ms = nowMs();
      time.textContent = fmt(ms) + ' / ' + fmt(TOTAL);
      segs.forEach(function (sg) { sg.el.firstChild.style.width = Math.max(0, Math.min(1, (ms - sg.from) / sg.len)) * 100 + '%'; });
      dot.style.left = (ms / TOTAL * 100) + '%';
      bar.setAttribute('aria-valuetext', fmt(ms) + ' / ' + fmt(TOTAL));
      if (playing) raf = requestAnimationFrame(paint);
    }
    function markList() {
      var q = cues[i];
      rows.forEach(function (r, k) { r.classList.toggle('on', listMode === 'steps' && k === q.step); });
      trows.forEach(function (r, k) { r.classList.toggle('on', listMode === 'text' && k === i); });
      var c = listMode === 'steps' ? rows[q.step] : trows[i];
      if (c && !detached) {
        programmatic = true;
        list.scrollTop = Math.max(0, c.offsetTop - list.offsetTop - list.clientHeight / 3);
        setTimeout(function () { programmatic = false; }, 80);
      }
      sync.hidden = !detached;
    }
    function render() {
      var q = cues[i];
      cap.textContent = q.caption;
      chap.innerHTML = '<span>' + (q.step + 1) + '. ' + (steps[q.step].title || '') + '</span>' + I.chev;
      chap.setAttribute('aria-label', T('今のステップ: ', 'Current step: ') + (steps[q.step].title || '') + T('。一覧を開く', '. Open the list'));
      bPlay.innerHTML = playing ? I.pause : I.play;
      bPlay.setAttribute('aria-label', playing ? T('一時停止', 'Pause') : T('再生', 'Play'));
      bPlay.title = playing ? T('一時停止', 'Pause') : T('再生', 'Play');
      bPlay.classList.toggle('wt-going', playing);
      markList();
      cancelAnimationFrame(raf);
      paint();
    }
    function show(k) {
      if (k < 0 || k >= cues.length) return;
      i = k; tPaused = 0;
      callGoTo(k);
      render();
    }
    function onEnd(g) {
      if (g !== gen || !playing) return;
      var nx = i + 1;
      if (loop >= 0 && (nx >= cues.length || cues[nx].step !== loop)) nx = steps[loop].first;
      if (nx >= cues.length) { playing = false; mode = 'ended'; tPaused = durMs(i); render(); return; }
      var gap = cues[nx].step !== cues[i].step ? GAP_STEP : GAP_CUE;
      timer = setTimeout(function () { if (g !== gen || !playing) return; show(nx); playCur(); }, gap / rate);
    }
    function fallback(g, from) {
      if (g !== gen) return;
      mode = 'timer';
      clearTimeout(timer);
      tStart = performance.now() - (from || 0) / rate;
      timer = setTimeout(function () { onEnd(g); }, (durMs(i) - (from || 0)) / rate);
    }
    function speak(text) {
      if (!window.__wtSpeech || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ja-JP';
      u.rate = rate;
      window.speechSynthesis.speak(u);
    }
    function hush() { if (window.speechSynthesis) window.speechSynthesis.cancel(); }
    function playCur() {
      clearTimeout(timer);
      gen++;
      var g = gen;
      tStart = performance.now();
      var src = AUDIO[cues[i].id];
      if (!src) { speak(cues[i].text); fallback(g, 0); render(); return; }
      audio.onended = function () { onEnd(g); };
      audio.onerror = function () { if (playing) fallback(g, 0); };
      audio.src = src;
      audio.playbackRate = rate;
      mode = 'audio';
      var p = audio.play();
      if (p && p.catch) p.catch(function () { if (playing) fallback(g, 0); });
      render();
    }
    function play() {
      if (playing) return;
      playing = true;
      if (mode === 'ended' && i === cues.length - 1) { show(0); }
      if (mode !== 'audio' && tPaused > 0) { seekMs(starts[i] + tPaused); render(); return; }
      if (mode === 'audio' && audio.src && audio.currentTime > 0 && !audio.ended) {
        gen++;
        var g = gen;
        audio.onended = function () { onEnd(g); };
        audio.playbackRate = rate;
        var p = audio.play();
        if (p && p.catch) p.catch(function () { if (playing) fallback(g, audio.currentTime * 1000); });
        render();
      } else if (mode === 'timer' && tPaused > 0) {
        gen++;
        fallback(gen, tPaused);
        render();
      } else {
        playCur();
      }
    }
    function pause() {
      if (playing) tPaused = nowMs() - starts[i];
      playing = false;
      gen++;
      clearTimeout(timer);
      audio.pause();
      hush();
      render();
    }
    function jump(k) {
      if (k < 0 || k >= cues.length) return;
      gen++;
      clearTimeout(timer);
      audio.pause();
      hush();
      if (mode === 'audio') mode = 'idle';
      show(k);
      if (playing) playCur();
    }
    function seekMs(ms) {
      ms = Math.max(0, Math.min(TOTAL - 1, ms));
      var k = kAt(ms);
      var off = Math.max(0, Math.min(durMs(k) - 50, ms - starts[k]));
      gen++;
      clearTimeout(timer);
      audio.pause();
      if (k !== i) show(k);
      tPaused = off;
      if (playing) {
        var g = ++gen;
        var src = AUDIO[cues[k].id];
        if (src) {
          audio.onended = function () { onEnd(g); };
          audio.onerror = function () { if (playing) fallback(g, off); };
          if (audio.src !== src) audio.src = src;
          var setT = function () { try { audio.currentTime = off / 1000; } catch (e) {} };
          if (audio.readyState >= 1) setT(); else audio.addEventListener('loadedmetadata', setT, { once: true });
          audio.playbackRate = rate;
          mode = 'audio';
          var p = audio.play();
          if (p && p.catch) p.catch(function () { if (playing) fallback(g, off); });
        } else {
          fallback(g, off);
        }
      } else {
        mode = mode === 'audio' ? 'idle' : mode;
      }
      cancelAnimationFrame(raf);
      paint();
    }
    function stepStart(s) { if (s >= 0 && s < steps.length) jump(steps[s].first); }
    function prevStep() {
      var q = cues[i], head = steps[q.step].first;
      var inStep = nowMs() - starts[head];
      stepStart(inStep < 3000 && q.step > 0 ? q.step - 1 : q.step);
    }
    function act(a) {
      var q = cues[i];
      detached = false;
      if (a === 'toggle') { playing ? pause() : play(); }
      else if (a === 'ncue') jump(i + 1);
      else if (a === 'pcue') jump(i - 1);
      else if (a === 'nstep') stepStart(q.step + 1);
      else if (a === 'pstep') prevStep();
    }
    var RATES = [1, 1.25, 1.5];
    bRate.addEventListener('click', function () {
      rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
      audio.playbackRate = rate;
      bRate.textContent = rate.toFixed(rate === 1 ? 1 : 2).replace(/0$/, '') + '×';
      bRate.setAttribute('aria-label', T('速さ ', 'Speed ') + rate + T(' 倍', 'x'));
      if (playing && mode === 'timer') { var from = nowMs() - starts[i]; gen++; fallback(gen, from); }
    });
    bFull.addEventListener('click', function () {
      try {
        if (document.fullscreenElement) document.exitFullscreen();
        else { var p = app.requestFullscreen(); if (p && p.catch) p.catch(function () { bFull.hidden = true; }); }
      } catch (e) { bFull.hidden = true; }
    });
    document.addEventListener('fullscreenchange', function () {
      var on = !!document.fullscreenElement;
      bFull.innerHTML = on ? I.unfull : I.full;
      bFull.setAttribute('aria-label', on ? T('全画面を終える', 'Exit fullscreen') : T('全画面', 'Fullscreen'));
      bFull.title = on ? T('全画面を終える', 'Exit fullscreen') : T('全画面', 'Fullscreen');
      setTimeout(function () { callGoTo(i); }, 120);
    });
    [bPrev, bPlay, bNext].forEach(function (b) { b.addEventListener('click', function () { act(b.getAttribute('data-a')); }); });
    chap.addEventListener('click', function () { setList('steps'); detached = false; markList(); });

    function kAt(ms) { var k = 0; for (var j = 0; j < starts.length; j++) if (starts[j] <= ms) k = j; return k; }
    function atEvent(e) { var r = bar.getBoundingClientRect(); var x = Math.max(0, Math.min(r.width, e.clientX - r.left)); return { ms: x / r.width * TOTAL, x: x }; }
    function preview(e) {
      var m = atEvent(e), k = kAt(m.ms);
      pv.hidden = false;
      if (snaps.length) mountSnap(pvBox, k, 216);
      pvLabel.innerHTML = '<b>' + fmt(m.ms) + '</b>　' + (cues[k].step + 1) + '. ' + (steps[cues[k].step].title || '');
      pv.style.left = Math.max(8, Math.min(main.clientWidth - pv.offsetWidth - 8, bar.offsetLeft + m.x - pv.offsetWidth / 2)) + 'px';
      return k;
    }
    var drag = false;
    bar.addEventListener('pointermove', function (e) { preview(e); if (drag) { detached = false; seekMs(atEvent(e).ms); } });
    bar.addEventListener('pointerleave', function () { if (!drag) pv.hidden = true; });
    bar.addEventListener('pointerdown', function (e) { drag = true; bar.setPointerCapture(e.pointerId); detached = false; preview(e); seekMs(atEvent(e).ms); });
    bar.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); seekMs(nowMs() + (e.key === 'ArrowRight' ? 5000 : -5000)); }
    });
    bar.addEventListener('pointerup', function () { drag = false; pv.hidden = true; });

    function share(si) {
      var text = (steps[si].title || '') + T('（ステップ ' + (si + 1) + '）', ' (step ' + (si + 1) + ')') + ': #step-' + (si + 1);
      var done = function (msg) { toast.textContent = msg; toast.hidden = false; setTimeout(function () { toast.hidden = true; }, 1600); };
      try { navigator.clipboard.writeText(text).then(function () { done(T('リンクをコピーした', 'Link copied')); }, function () { done(text); }); } catch (e) { done(text); }
    }
    function buildList() {
      list.textContent = ''; rows = []; trows = [];
      if (listMode === 'steps') {
        steps.forEach(function (s, si) {
          var r = el('div', 'wt-row', null, list); r.tabIndex = 0;
          var th = el('div', 'wt-th', null, r);
          var lastCue = si < steps.length - 1 ? steps[si + 1].first - 1 : cues.length - 1;
          if (snaps.length) mountSnap(th, lastCue, 115);
          el('div', '', '<div class="wt-tt">' + (si + 1) + '. ' + (s.title || '') + '</div><span class="wt-tm">' + fmt(starts[s.first]) + '</span>', r);
          var acts = el('div', 'wt-acts', null, r);
          var sb = el('button', 'wt-icon', I.share, acts); sb.setAttribute('aria-label', T('このステップを指すリンクをコピー', 'Copy a link to this step')); sb.title = T('このステップを指すリンクをコピー', 'Copy a link to this step');
          var lb = el('button', 'wt-icon wt-loop', I.loop, acts); lb.setAttribute('aria-label', T('このステップをくり返す', 'Loop this step')); lb.title = T('このステップをくり返す', 'Loop this step');
          lb.setAttribute('aria-pressed', loop === si ? 'true' : 'false');
          sb.addEventListener('click', function (e) { e.stopPropagation(); share(si); });
          lb.addEventListener('click', function (e) {
            e.stopPropagation();
            loop = loop === si ? -1 : si;
            rows.forEach(function (rr, k) { var b = rr.querySelector('.wt-loop'); if (b) b.setAttribute('aria-pressed', loop === k ? 'true' : 'false'); });
            if (loop === si) { detached = false; jump(s.first); if (!playing) play(); }
          });
          r.addEventListener('click', function () { detached = false; jump(s.first); if (!playing) play(); });
          r.addEventListener('keydown', function (e) { if (e.key === 'Enter') r.click(); });
          rows.push(r);
        });
      } else {
        cues.forEach(function (q, k) {
          if (q.ci === 0) el('div', 'wt-tgrp', (q.step + 1) + '. ' + (steps[q.step].title || ''), list);
          var r = el('div', 'wt-trow', '<span class="wt-tm">' + fmt(starts[k]) + '</span><span></span>', list);
          r.lastChild.textContent = q.caption;
          r.tabIndex = 0;
          r.addEventListener('click', function () { detached = false; jump(k); if (!playing) play(); });
          r.addEventListener('keydown', function (e) { if (e.key === 'Enter') r.click(); });
          trows.push(r);
        });
      }
    }
    function setList(m) {
      listMode = m;
      tS.setAttribute('aria-selected', m === 'steps' ? 'true' : 'false');
      tT.setAttribute('aria-selected', m === 'text' ? 'true' : 'false');
      buildList();
      markList();
    }
    tS.addEventListener('click', function () { setList('steps'); });
    tT.addEventListener('click', function () { setList('text'); });
    function userScroll() { if (programmatic) return; detached = true; sync.hidden = false; }
    list.addEventListener('wheel', userScroll, { passive: true });
    list.addEventListener('touchmove', userScroll, { passive: true });
    sync.addEventListener('click', function () { detached = false; markList(); });

    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target && e.target.closest && e.target.closest('input, textarea, select')) return;
      var m = { ArrowLeft: 'pstep', ArrowRight: 'nstep', ArrowUp: 'pcue', ArrowDown: 'ncue', ' ': 'toggle' }[e.key];
      if (!m) return;
      e.preventDefault();
      act(m);
    });

    window.__wt = {
      cues: cues,
      show: show,
      play: play,
      pause: pause,
      state: function () { return { i: i, playing: playing, mode: mode, n: cues.length, heard: heard }; }
    };
    requestAnimationFrame(function () {
      buildSnaps();
      setList('steps');
      var m = /^#step-(\d+)$/.exec(location.hash || '');
      show(m ? steps[Math.min(steps.length - 1, Math.max(0, +m[1] - 1))].first : 0);
    });
    setList('steps');
    show(0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
