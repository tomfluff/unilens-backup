// Kumo Mobile Support: cookie banner, tabs, carousel, chat panel, search.
(function () {
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ja = document.documentElement.lang === 'ja';

  // cookie banner
  var ck = document.querySelector('.cookie');
  var seen = false;
  try { seen = localStorage.getItem('kumo-cookie') === '1'; } catch (e) {}
  if (ck && !seen) ck.hidden = false;
  if (ck) ck.querySelector('.cookie-ok').addEventListener('click', function () {
    ck.hidden = true;
    try { localStorage.setItem('kumo-cookie', '1'); } catch (e) {}
  });

  // tabs
  $$('.tabs').forEach(function (t) {
    var btns = $$('.tab', t), panels = $$('.tab-panel', t);
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        btns.forEach(function (x, j) { x.classList.toggle('on', i === j); x.setAttribute('aria-selected', i === j); panels[j].hidden = i !== j; });
      });
    });
  });

  // carousel (home)
  $$('.carousel').forEach(function (c) {
    var slides = $$('.slide', c), dots = $$('.dots button', c), cur = 0, timer;
    function go(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('on', i === cur); });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
    }
    function auto() { clearInterval(timer); timer = setInterval(function () { go(cur + 1); }, 7000); }
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); auto(); }); });
    c.querySelector('.prev').addEventListener('click', function () { go(cur - 1); auto(); });
    c.querySelector('.next').addEventListener('click', function () { go(cur + 1); auto(); });
    c.addEventListener('mouseenter', function () { clearInterval(timer); });
    c.addEventListener('mouseleave', auto);
    auto();
  });

  // chat widget (mock)
  var cb = document.querySelector('.chat-btn'), cp = document.querySelector('.chat-panel');
  if (cb && cp) {
    cb.addEventListener('click', function () { cp.hidden = !cp.hidden; });
    cp.addEventListener('click', function (e) { if (e.target.closest('.chat-close')) cp.hidden = true; });
    var f = cp.querySelector('form');
    if (f) f.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = f.querySelector('input'), b = cp.querySelector('.chat-b');
      if (!inp.value.trim()) return;
      var me = document.createElement('div'); me.className = 'chat-msg'; me.style.background = '#dbeafa'; me.style.textAlign = 'right'; me.textContent = inp.value;
      var bot = document.createElement('div'); bot.className = 'chat-msg';
      bot.textContent = ja ? 'ただいまオペレーターがすべて対応中です。チャットの受付時間は 9:00〜21:00 です。よくあるご質問もご覧ください。' : 'All our agents are busy right now. Chat is staffed 9:00–21:00 daily. You may find an answer in our FAQ.';
      b.appendChild(me); b.appendChild(bot); inp.value = ''; b.scrollTop = b.scrollHeight;
    });
  }

  // booking form (mock)
  $$('.book-form').forEach(function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); f.querySelector('.book-msg').hidden = false; });
  });

  // "was this page helpful?"
  $$('.helpful button').forEach(function (b) {
    b.addEventListener('click', function () { b.parentNode.innerHTML = ja ? 'ご協力ありがとうございました。' : 'Thank you for your feedback.'; });
  });

  // search page
  var out = document.getElementById('results');
  if (out) {
    var q = (new URLSearchParams(location.search).get('q') || '').trim();
    var box = document.getElementById('q2'); if (box) box.value = q;
    var info = document.getElementById('results-info');
    if (!q) { info.textContent = ja ? 'キーワードを入力してください。' : 'Enter a keyword to search.'; return; }
    fetch('/assets/search-' + (ja ? 'ja' : 'en') + '.json').then(function (r) { return r.json(); }).then(function (idx) {
      var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      var hits = idx.map(function (p) {
        var t = p.t.toLowerCase(), x = p.x.toLowerCase(), score = 0;
        for (var i = 0; i < terms.length; i++) {
          var inT = t.indexOf(terms[i]) >= 0, inX = x.indexOf(terms[i]) >= 0;
          if (!inT && !inX) return null;
          score += (inT ? 10 : 0) + x.split(terms[i]).length - 1;
        }
        return { p: p, s: score };
      }).filter(Boolean).sort(function (a, b) { return b.s - a.s; });
      info.textContent = ja ? '「' + q + '」の検索結果：' + hits.length + '件' : hits.length + ' results for “' + q + '”';
      out.innerHTML = '';
      hits.slice(0, 30).forEach(function (h) {
        var x = h.p.x, i = x.toLowerCase().indexOf(terms[0]), start = Math.max(0, i - 60);
        var snip = (start ? '…' : '') + x.slice(start, start + 180) + '…';
        var li = document.createElement('li');
        var a = document.createElement('a'); a.href = h.p.u; a.textContent = h.p.t;
        var u = document.createElement('div'); u.className = 'u'; u.textContent = location.origin + h.p.u;
        var p = document.createElement('p'); p.textContent = snip;
        li.appendChild(a); li.appendChild(u); li.appendChild(p); out.appendChild(li);
      });
    });
  }
})();
