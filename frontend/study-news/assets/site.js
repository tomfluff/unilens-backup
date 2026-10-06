// The Harukawa Herald: banners, tabs, carousel, live filter, comment sort, search.
(function () {
  'use strict';
  function store(kind) {
    return {
      get: function (k) { try { return window[kind].getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { window[kind].setItem(k, v); } catch (e) { /* storage blocked */ } },
    };
  }
  var local = store('localStorage'), session = store('sessionStorage');
  var ja = document.documentElement.lang === 'ja';
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.hidden = true; }, 1800);
  }

  // Cookie banner
  var cookie = document.getElementById('cookie');
  if (cookie && !local.get('hh-consent')) cookie.hidden = false;
  if (cookie) cookie.addEventListener('click', function (e) {
    var b = e.target.closest('[data-consent]');
    if (!b) return;
    local.set('hh-consent', b.getAttribute('data-consent'));
    cookie.hidden = true;
  });

  // Newsletter pop-up: once per session, after 25 seconds (not on the subscription page)
  var modal = document.getElementById('nl-modal');
  if (modal && !session.get('hh-nl') && !document.body.classList.contains('page-subscribe')) {
    setTimeout(function () { modal.hidden = false; session.set('hh-nl', '1'); }, 25000);
  }
  if (modal) modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.closest('[data-close]')) modal.hidden = true;
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal) modal.hidden = true; });
  $$('.nl-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      f.innerHTML = '<p><strong>' + (ja ? 'ご登録ありがとうございます。確認メールをお送りしました。' : 'Thanks! Please check your inbox to confirm.') + '</strong></p>';
      setTimeout(function () { if (modal) modal.hidden = true; }, 1500);
    });
  });

  // Tabs
  $$('[data-tabs]').forEach(function (box) {
    var btns = $$('[role=tab]', box);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
        $$('[role=tabpanel]', box).forEach(function (p) { p.hidden = p.id !== b.getAttribute('aria-controls'); });
      });
    });
  });

  // Carousel
  $$('.carousel').forEach(function (c) {
    var track = c.querySelector('.car-track');
    c.querySelector('.car-prev').addEventListener('click', function () { track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' }); });
    c.querySelector('.car-next').addEventListener('click', function () { track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' }); });
  });

  // Mobile menu
  var mb = document.querySelector('.menu-btn');
  if (mb) mb.addEventListener('click', function () { document.body.classList.toggle('nav-open'); });

  // Share tools
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = location.href.split('#')[0];
      var u = b.closest('.update');
      if (u) url += '#' + u.id;
      try { navigator.clipboard.writeText(url); } catch (e) { /* no clipboard */ }
      toast(ja ? 'リンクをコピーしました' : 'Link copied');
    });
  });
  $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
  $$('[data-save]').forEach(function (b) { b.addEventListener('click', function () { toast(ja ? '保存にはログインが必要です' : 'Log in to save articles'); }); });
  $$('.c-like').forEach(function (b) { b.addEventListener('click', function () { toast(ja ? 'いいねするにはログインしてください' : 'Log in to like comments'); }); });

  // Live blog filter
  $$('[data-filter]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var cat = chip.getAttribute('data-filter');
      $$('[data-filter]').forEach(function (x) { x.classList.toggle('on', x === chip); });
      $$('.update').forEach(function (u) { u.hidden = cat !== 'all' && u.getAttribute('data-cat') !== cat; });
    });
  });

  // Comment sort
  $$('[data-sort-comments]').forEach(function (sel) {
    sel.addEventListener('change', function () {
      var list = sel.closest('.comments').querySelector('.c-list');
      var items = $$('.c', list);
      items.sort(function (a, b) {
        if (sel.value === 'best') return b.dataset.likes - a.dataset.likes;
        var d = a.dataset.time < b.dataset.time ? -1 : 1;
        return sel.value === 'old' ? d : -d;
      });
      items.forEach(function (i) { list.appendChild(i); });
    });
  });

  // Search page
  var results = document.getElementById('search-results');
  if (results) {
    var params = new URLSearchParams(location.search);
    var q = (params.get('q') || '').trim(), sec = params.get('s') || '', order = params.get('o') || 'rel';
    document.getElementById('q').value = q;
    document.getElementById('s').value = sec;
    document.getElementById('o').value = order;
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var count = document.getElementById('search-count');
    if (!q && !sec) { count.textContent = ''; }
    else fetch('search-index.json').then(function (r) { return r.json(); }).then(function (index) {
      var terms = q.toLowerCase().split(/[\s　]+/).filter(Boolean);
      var hits = index.map(function (a) {
        var t = a.t.toLowerCase(), s = a.s.toLowerCase(), x = (a.x + ' ' + a.tags).toLowerCase(), score = 0;
        for (var i = 0; i < terms.length; i++) {
          var w = terms[i], n = x.split(w).length - 1;
          if (t.indexOf(w) < 0 && s.indexOf(w) < 0 && !n) return null;
          score += (t.indexOf(w) >= 0 ? 10 : 0) + (s.indexOf(w) >= 0 ? 4 : 0) + Math.min(n, 10);
        }
        if (sec && a.sec !== sec) return null;
        return { a: a, score: score };
      }).filter(Boolean);
      hits.sort(function (p, r) { return order === 'new' || !terms.length ? (p.a.iso < r.a.iso ? 1 : -1) : r.score - p.score; });
      count.textContent = ja ? '「' + q + '」の検索結果：' + hits.length + '件' : hits.length + ' result' + (hits.length === 1 ? '' : 's') + (q ? ' for “' + q + '”' : '');
      if (!hits.length) { results.innerHTML = '<p>' + esc(results.getAttribute('data-none')) + '</p>'; return; }
      var mark = function (s) {
        var out = esc(s);
        terms.forEach(function (w) { out = out.replace(new RegExp('(' + esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); });
        return out;
      };
      results.innerHTML = hits.map(function (h) {
        var a = h.a, x = a.x, i = terms.length ? x.toLowerCase().indexOf(terms[0]) : -1;
        var snip = i >= 0 ? (i > 60 ? '…' : '') + x.slice(Math.max(0, i - 60), i + 140) + '…' : a.s;
        return '<article class="li"><div><span class="kicker">' + esc(a.sn) + '</span><h3><a href="' + a.u + '">' + mark(a.t) + '</a></h3><p class="stand">' + mark(snip) + '</p><p class="meta">' + esc(a.d) + (a.p ? '<span class="lock">' + (ja ? '有料会員限定' : 'Subscribers only') + '</span>' : '') + '</p></div></article>';
      }).join('');
    }).catch(function () { count.textContent = ja ? '検索を読み込めませんでした。' : 'Search is unavailable right now.'; });
  }
})();
