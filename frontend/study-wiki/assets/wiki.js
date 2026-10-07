// Openpedia page behaviour: search suggestions and results, table of contents, banner, menus.
(function () {
  var html = document.documentElement;
  var root = html.getAttribute('data-root') || '';
  var lang = html.lang === 'ja' ? 'ja' : 'en';
  var ja = lang === 'ja';
  var base = root + lang + '/';

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // toast for the read-only tabs and links
  var toastEl = document.querySelector('.toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.js-static, .tab.selected');
    if (a) { e.preventDefault(); if (a.classList.contains('js-static')) toast(ja ? 'このオープンペディアは閲覧専用です。編集やノートページは利用できません。' : 'This copy of Openpedia is read-only. Editing and talk pages are not available.'); }
    var p = e.target.closest && e.target.closest('a.js-print');
    if (p) { e.preventDefault(); window.print(); }
  });

  // fundraising banner
  var banner = document.getElementById('banner');
  if (banner && store('op-banner-closed') !== '1' && /\/(wiki\/|index\.html$)/.test(html.getAttribute('data-page') || '')) {
    banner.hidden = false;
    banner.addEventListener('click', function (e) {
      if (e.target.closest('.banner-close, .banner-later')) { e.preventDefault(); banner.hidden = true; store('op-banner-closed', '1'); }
    });
  }

  // mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // table of contents toggle
  var tocToggle = document.querySelector('.toctoggle');
  if (tocToggle) tocToggle.addEventListener('click', function (e) {
    e.preventDefault();
    var toc = document.getElementById('toc');
    var c = toc.classList.toggle('collapsed');
    tocToggle.textContent = c ? tocToggle.getAttribute('data-show') : tocToggle.getAttribute('data-hide');
  });

  // search index
  var indexPromise = null;
  function loadIndex() {
    if (!indexPromise) indexPromise = fetch(root + 'assets/search-' + lang + '.json').then(function (r) { return r.json(); });
    return indexPromise;
  }
  function norm(s) {
    return String(s || '').normalize('NFKC').toLowerCase()
      .replace(/[āâ]/g, 'a').replace(/[ōô]/g, 'o').replace(/[ūû]/g, 'u').replace(/[ēê]/g, 'e').replace(/[īî]/g, 'i')
      .replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); });
  }
  function articleUrl(slug) { return base + 'wiki/' + slug + '.html'; }

  // header suggestions
  var input = document.querySelector('.site-header input[name=q]');
  var list = document.querySelector('.site-header .suggestions');
  var active = -1;
  function suggest() {
    var q = norm(input.value.trim());
    if (!q) { list.hidden = true; list.innerHTML = ''; return; }
    loadIndex().then(function (idx) {
      var scored = [];
      idx.forEach(function (a) {
        var t = norm(a.t), r = norm(a.r), s = 0;
        if (t.indexOf(q) === 0 || r.indexOf(q) === 0) s = 3;
        else if (t.indexOf(' ' + q) >= 0) s = 2;
        else if (t.indexOf(q) >= 0 || r.indexOf(q) >= 0) s = 1;
        if (s) scored.push([s, a]);
      });
      scored.sort(function (x, y) { return y[0] - x[0] || x[1].t.length - y[1].t.length; });
      var items = scored.slice(0, 8).map(function (p) {
        return '<li><a href="' + articleUrl(p[1].s) + '">' + escapeHtml(p[1].t) + '<span class="sug-desc">' + escapeHtml(p[1].d) + '</span></a></li>';
      });
      items.push('<li class="sug-all"><a href="' + base + 'search.html?q=' + encodeURIComponent(input.value.trim()) + '&amp;fulltext=1">' +
        (ja ? '「' + escapeHtml(input.value.trim()) + '」を含むページを検索' : 'Search for pages containing <b>' + escapeHtml(input.value.trim()) + '</b>') + '</a></li>');
      list.innerHTML = items.join('');
      list.hidden = false; active = -1;
    });
  }
  if (input && list) {
    input.addEventListener('input', suggest);
    input.addEventListener('focus', function () { loadIndex(); if (input.value) suggest(); });
    input.addEventListener('keydown', function (e) {
      var lis = list.querySelectorAll('li');
      if (list.hidden || !lis.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + lis.length) % lis.length;
        lis.forEach(function (li, i) { li.classList.toggle('active', i === active); });
      } else if (e.key === 'Enter' && active >= 0) {
        e.preventDefault(); location.href = lis[active].querySelector('a').href;
      } else if (e.key === 'Escape') { list.hidden = true; }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.search-box')) list.hidden = true; });
  }

  // language switch keeps the search query
  if (location.search) {
    document.querySelectorAll('a[lang]').forEach(function (a) { if (/search\.html$/.test(a.getAttribute('href'))) a.setAttribute('href', a.getAttribute('href') + location.search); });
  }

  // search results page
  var results = document.getElementById('search-results');
  if (results) {
    var params = new URLSearchParams(location.search);
    var raw = (params.get('q') || '').trim();
    var pageInput = document.querySelector('.search-page-input');
    if (pageInput) pageInput.value = raw;
    if (input) input.value = raw;
    if (raw) {
      document.title = (ja ? '「' + raw + '」の検索結果 - オープンペディア' : 'Search results for "' + raw + '" - Openpedia');
      loadIndex().then(function (idx) {
        var q = norm(raw);
        var terms = q.split(/\s+/).filter(Boolean);
        var exact = idx.filter(function (a) { return norm(a.t) === q || norm(a.r) === q; })[0];
        if (exact && !params.get('fulltext') && !params.get('redlink')) { location.replace(articleUrl(exact.s)); return; }
        var hits = [];
        idx.forEach(function (a) {
          var t = norm(a.t), x = norm(a.x), d = norm(a.d), r = norm(a.r), c = norm(a.c.join(' '));
          var all = t + ' ' + r + ' ' + d + ' ' + c + ' ' + x;
          if (!terms.every(function (term) { return all.indexOf(term) >= 0; })) return;
          var score = 0;
          terms.forEach(function (term) {
            if (t.indexOf(term) >= 0 || r.indexOf(term) >= 0) score += 20;
            if (d.indexOf(term) >= 0) score += 5;
            score += Math.min(10, x.split(term).length - 1);
          });
          hits.push({ a: a, score: score });
        });
        hits.sort(function (x, y) { return y.score - x.score; });
        var out = '';
        if (params.get('redlink')) {
          out += '<div class="redlink-notice">' + (ja
            ? 'オープンペディアには「<b>' + escapeHtml(raw) + '</b>」という名前の記事は存在しません。記事の作成はこのサイトではできません。'
            : 'Openpedia does not have an article with this exact name: <b>' + escapeHtml(raw) + '</b>. Creating articles is not possible on this copy.') + '</div>';
        }
        out += '<div class="search-info">' + (ja ? '検索結果 ' + hits.length + ' 件' : 'Results 1 – ' + hits.length + ' of ' + hits.length) + '</div>';
        if (!hits.length) out += '<p>' + (ja ? '「' + escapeHtml(raw) + '」に一致するページは見つかりませんでした。' : 'There were no results matching the query.') + '</p>';
        hits.slice(0, 40).forEach(function (h) {
          var a = h.a, text = a.x, nt = norm(text), pos = -1;
          terms.some(function (term) { pos = nt.indexOf(term); return pos >= 0; });
          var start = Math.max(0, pos - (ja ? 40 : 90));
          if (!ja && start) { var sp = text.indexOf(' ', start); if (sp > 0 && sp < pos) start = sp + 1; }
          var snippet = text.slice(start, start + (ja ? 120 : 260));
          if (!ja) snippet = snippet.replace(/\s\S*$/, '');
          var safe = escapeHtml(snippet);
          terms.forEach(function (term) {
            var re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
            safe = safe.replace(re, '<span class="searchmatch">$1</span>');
          });
          var words = ja ? text.length.toLocaleString() + ' 文字' : text.split(/\s+/).length.toLocaleString() + ' words';
          out += '<div class="result"><div class="result-title"><a href="' + articleUrl(a.s) + '">' + escapeHtml(a.t) + '</a></div>' +
            '<div class="result-snippet">' + (start ? '… ' : '') + safe + ' …</div><div class="result-meta">' + escapeHtml(a.d) + ' · ' + words + '</div></div>';
        });
        results.innerHTML = out;
      });
    }
  }
})();
