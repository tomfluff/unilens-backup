/* Marketa client script: cart (localStorage), product options, listing filters, checkout. No dependencies. */
(function () {
  'use strict';
  var LANG = document.documentElement.lang === 'ja' ? 'ja' : 'en';
  var JA = LANG === 'ja';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var num = function (n) { return Number(n).toLocaleString('en-US'); };
  var yen = function (n) { return (JA ? '￥' : '¥') + num(n); };
  var T = function (en, ja) { return JA ? ja : en; };
  var url = function (p) { return '/' + LANG + '/' + p; };
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  var indexP = null;
  function getIndex() {
    if (!indexP) indexP = fetch('/assets/data/index-' + LANG + '.json').then(function (r) { return r.json(); }).then(function (a) { var m = {}; a.forEach(function (p) { m[p.id] = p; }); a.byId = m; return a; });
    return indexP;
  }
  function stars(r) { return '<span class="stars" style="--r:' + r + '" role="img" aria-label="' + T(r + ' out of 5 stars', '5つ星のうち' + r) + '"><i></i></span>'; }

  // ---------- cookie banner, language switch, cart count ----------
  var ck = $('#cookie');
  if (ck && !load('mk-cookie', null)) ck.hidden = false;
  $$('[data-cookie]').forEach(function (b) { b.addEventListener('click', function () { save('mk-cookie', b.dataset.cookie); ck.hidden = true; }); });
  $$('[data-lang-switch]').forEach(function (a) { a.href = a.getAttribute('href') + location.search + location.hash; });
  var cart = load('mk-cart', []);
  function cartCount() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function saveCart() { save('mk-cart', cart); $$('[data-cart-count]').forEach(function (e) { e.textContent = cartCount(); }); }
  saveCart();
  function addToCart(id, v, qty) {
    var it = cart.find(function (i) { return i.id === id && i.v === v; });
    if (it) it.qty = Math.min(10, it.qty + qty); else cart.push({ id: id, v: v, qty: qty });
    saveCart();
  }
  var sp = new URLSearchParams(location.search);
  var sf = $('form.search');
  if (sf) { if (sp.get('q')) sf.q.value = sp.get('q'); if (sp.get('cat')) sf.cat.value = sp.get('cat'); }

  // ---------- generic widgets ----------
  $$('.row-scroll').forEach(function (r) {
    var t = $('.rs-track', r);
    $('.prev', r).addEventListener('click', function () { t.scrollLeft -= t.clientWidth * 0.8; });
    $('.next', r).addEventListener('click', function () { t.scrollLeft += t.clientWidth * 0.8; });
  });
  $$('[data-carousel]').forEach(function (c) {
    var slides = $$('.slide', c), dots = $$('.dots button', c), i = 0, timer;
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    }
    function auto() { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 6000); }
    $('.prev', c).addEventListener('click', function () { go(i - 1); auto(); });
    $('.next', c).addEventListener('click', function () { go(i + 1); auto(); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); auto(); }); });
    auto();
  });
  $$('[data-tabs]').forEach(function (tb) {
    $$('[role=tab]', tb).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[role=tab]', tb).forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
        $$('.tabpanel', tb).forEach(function (p) { p.hidden = p.dataset.panel !== b.dataset.tab; });
      });
    });
  });
  $$('[data-yn]').forEach(function (b) { b.addEventListener('click', function () { var h = b.closest('.helpful'); $$('[data-yn]', h).forEach(function (x) { x.disabled = true; }); $('.thanks', h).hidden = false; }); });
  $$('[data-watch]').forEach(function (b) { b.addEventListener('click', function () { b.textContent = T('Watching ✓', 'ウォッチ中 ✓'); b.disabled = true; }); });
  $$('[data-dopt]').forEach(function (b) { b.addEventListener('click', function () { b.nextElementSibling.hidden = false; }); });
  var coupons = load('mk-coupons', {});
  $$('[data-clip-btn]').forEach(function (b) {
    var id = b.dataset.clipBtn;
    function upd() { b.textContent = coupons[id] ? T('Clipped ✓', '獲得済み ✓') : T('Clip coupon', 'クーポンを獲得'); }
    upd();
    b.addEventListener('click', function () { coupons[id] = !coupons[id]; save('mk-coupons', coupons); upd(); });
  });
  $$('[data-addall]').forEach(function (b) {
    b.addEventListener('click', function () {
      getIndex().then(function (idx) {
        b.dataset.addall.split(',').forEach(function (id, k) {
          var p = idx.byId[id]; if (!p) return;
          var v = k === 0 && window.__mkVariant ? window.__mkVariant : (p.variants.find(function (x) { return x.stock > 0 && x.ship !== 'oos'; }) || p.variants[0]).id;
          addToCart(id, v, 1);
        });
        flyout(idx, b.dataset.addall.split(',')[0]);
      });
    });
  });

  // ---------- added-to-basket flyout ----------
  function flyout(idx, id) {
    var old = $('.flyout'); if (old) old.remove();
    var p = idx.byId[id];
    var sub = cart.reduce(function (s, i) { var q = idx.byId[i.id]; if (!q) return s; var v = q.variants.find(function (x) { return x.id === i.v; }) || q.variants[0]; return s + v.price * i.qty; }, 0);
    var f = document.createElement('div');
    f.className = 'flyout'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', T('Added to basket', 'カートに追加しました'));
    f.innerHTML = '<button class="x" aria-label="' + T('Close', '閉じる') + '">×</button><h3>✓ ' + T('Added to basket', 'カートに追加しました') + '</h3><img src="' + p.img + '" alt=""><p>' + esc(p.short) + '</p><p>' + T('Basket subtotal', 'カートの小計') + ' (' + cartCount() + T(' items', '点') + '): <b>' + yen(sub) + '</b></p>' +
      (sub < 3500 ? '<p class="sm muted">' + T('Add ' + yen(3500 - sub) + ' of items shipped by Marketa for FREE standard delivery.', 'マルケタが発送する商品をあと' + yen(3500 - sub) + '追加で通常配送無料。') + '</p>' : '<p class="sm" style="color:#067d62">' + T('Your order qualifies for FREE standard delivery on items shipped by Marketa.', 'マルケタが発送する商品は通常配送無料の対象です。') + '</p>') +
      '<a class="btn btn-y btn-full" href="' + url('checkout.html') + '">' + T('Proceed to checkout', 'レジに進む') + '</a><a class="btn btn-full" href="' + url('cart.html') + '">' + T('Go to basket', 'カートに移動') + '</a>';
    document.body.appendChild(f);
    $('.x', f).addEventListener('click', function () { f.remove(); });
  }

  // ---------- product page ----------
  var pdata = $('#pdata');
  if (pdata) {
    var PD = JSON.parse(pdata.textContent);
    var cur = PD.variants.find(function (v) { return !v.oos; }) || PD.variants[0];
    var mainimg = $('#mainimg');
    var thumbs = $$('.thumb');
    function showImg(i) { var t = thumbs[i] || thumbs[0]; if (!t) return; mainimg.src = t.dataset.src; thumbs.forEach(function (x) { x.classList.toggle('on', x === t); }); }
    thumbs.forEach(function (t) { t.addEventListener('click', function () { showImg(+t.dataset.img); }); t.addEventListener('mouseenter', function () { showImg(+t.dataset.img); }); });
    function setVariant(v, push) {
      cur = v; window.__mkVariant = v.id;
      $('#pricebox').innerHTML = v.pb; $('#bb-price').innerHTML = v.bbp; $('#bb-dl').innerHTML = v.dl; $('#bb-stock').innerHTML = v.st; $('#bb-ss').innerHTML = v.ss;
      var vn = $('#vname'); if (vn) vn.textContent = v.name;
      $$('.vopt').forEach(function (b) { var on = b.dataset.v === v.id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      $('#add').disabled = v.oos; $('#buynow').disabled = v.oos;
      showImg(v.img || 0);
      if (push) { var q = new URLSearchParams(location.search); q.set('v', v.id); history.replaceState(null, '', '?' + q + location.hash); }
    }
    $$('.vopt').forEach(function (b) { b.addEventListener('click', function () { setVariant(PD.variants.find(function (v) { return v.id === b.dataset.v; }), true); }); });
    var want = sp.get('v') && PD.variants.find(function (v) { return v.id === sp.get('v'); });
    setVariant(want || cur, false);
    $('#add').addEventListener('click', function () { addToCart(PD.id, cur.id, +$('#qty').value); getIndex().then(function (idx) { flyout(idx, PD.id); }); });
    $('#buynow').addEventListener('click', function () { addToCart(PD.id, cur.id, +$('#qty').value); location.href = url('checkout.html'); });
    $$('[data-clip]').forEach(function (c) { c.checked = !!coupons[c.dataset.clip]; c.addEventListener('change', function () { coupons[c.dataset.clip] = c.checked; save('mk-coupons', coupons); }); });
    var lb = $('[data-list]'); if (lb) lb.addEventListener('click', function () { $('.added-note').hidden = false; });
    var wr = $('[data-write]'); if (wr) wr.addEventListener('click', function () { $('.write-note').hidden = false; });
    $$('[data-helpful]').forEach(function (b) { b.addEventListener('click', function () { b.textContent = T('Thank you for your feedback', 'ご意見ありがとうございました'); b.disabled = true; }); });
    $$('[data-report]').forEach(function (b) { b.addEventListener('click', function () { b.textContent = T('Reported', '報告済み'); b.disabled = true; }); });
    var qs = $('.qa-search');
    if (qs) qs.addEventListener('input', function () {
      var t = qs.value.trim().toLowerCase(), n = 0;
      $$('.qa').forEach(function (q) { var ok = !t || q.textContent.toLowerCase().indexOf(t) >= 0; q.hidden = !ok; if (ok) n++; });
      $('.qa-none').hidden = n > 0;
    });
    var list = $('.rv-list'), filt = $('.rv-filter'), star = 0;
    function rv() {
      var items = $$('.rv', list);
      var s = $('#rv-sort').value;
      items.sort(function (a, b) { return s === 'new' ? (a.dataset.date < b.dataset.date ? 1 : -1) : a.dataset.i - b.dataset.i; });
      items.forEach(function (e) { e.hidden = star && +e.dataset.stars !== star; list.appendChild(e); });
      filt.hidden = !star;
      filt.innerHTML = star ? T('Showing ' + star + '-star reviews', '星' + star + 'つのレビューを表示中') + ' · <button type="button" class="link">' + T('Clear filter', '絞り込みを解除') + '</button>' : '';
      if (star) $('button', filt).addEventListener('click', function () { star = 0; rv(); });
    }
    $('#rv-sort').addEventListener('change', rv);
    $$('[data-star]').forEach(function (b) { b.addEventListener('click', function () { star = +b.dataset.star; rv(); list.scrollIntoView({ behavior: 'smooth' }); }); });
    var rec = load('mk-recent', []).filter(function (x) { return x !== PD.id; });
    rec.unshift(PD.id); save('mk-recent', rec.slice(0, 12));
  }

  // ---------- recently viewed on the home page ----------
  var recEl = $('[data-recent]');
  if (recEl && load('mk-recent', []).length) {
    getIndex().then(function (idx) {
      var ids = load('mk-recent', []).filter(function (id) { return idx.byId[id]; });
      $('.rs-track', recEl).innerHTML = ids.map(function (id) { return cardHtml(idx.byId[id], { compact: true }); }).join('');
    });
  }

  function cardHtml(p, o) {
    o = o || {};
    return '<div class="card"><a class="card-img" href="' + url('p/' + p.id + '.html') + '"><img src="' + p.img + '" alt="' + esc(p.short) + '" loading="lazy"></a>' +
      (o.sponsored ? '<span class="spons">' + T('Sponsored', 'スポンサー') + ' ⓘ</span>' : '') +
      '<a class="card-t" href="' + url('p/' + p.id + '.html') + '">' + esc(o.compact ? p.short : p.title) + '</a>' +
      '<div class="card-r">' + stars(p.rating) + ' <a class="muted" href="' + url('p/' + p.id + '.html#reviews') + '">' + num(p.ratings) + '</a></div>' +
      (o.compact ? '' : '<div class="muted sm">' + T(p.bought + ' bought in past month', '過去1か月で' + p.bought + '点購入') + '</div>') +
      '<div class="card-p">' + (p.pct ? '<span class="pb-pct">-' + p.pct + '%</span>' : '') + '<span class="pb-price">' + yen(p.price) + '</span>' + (p.multi ? '<span class="muted sm">' + T(' from', '〜') + '</span>' : '') + '</div>' +
      (p.list ? '<div class="muted sm">' + T('List:', '参考：') + ' <s>' + yen(p.list) + '</s></div>' : '') +
      (p.coupon && !o.compact ? '<div class="coupon-s">' + esc(p.coupon) + (p.couponMember ? ' <span class="muted">(' + T('Fast members', 'Fast会員') + ')</span>' : '') + '</div>' : '') +
      (o.compact ? '' : '<div class="card-d">' + p.dl + '</div>') +
      (o.compact ? '' : (p.multi ? '<a class="btn btn-sm add-s" href="' + url('p/' + p.id + '.html') + '">' + T('See options', 'オプションを見る') + '</a>' : (p.variants[0].stock > 0 && p.variants[0].ship !== 'oos' ? '<button class="btn btn-y btn-sm add-s" data-quick="' + p.id + '">' + T('Add to basket', 'カートに入れる') + '</button>' : ''))) + '</div>';
  }

  // ---------- category and search listings ----------
  var lst = $('[data-listing]');
  if (lst) getIndex().then(function (idx) { listing(lst, idx); });
  function listing(el, idx) {
    var PAGE = 6;
    var CATS = { kitchen: T('Kitchen', 'キッチン用品'), home: T('Home & Tableware', 'ホーム・食器'), electronics: T('Electronics', '家電・オーディオ'), outdoor: T('Sports & Outdoors', 'スポーツ・アウトドア'), beauty: T('Health & Beauty', 'ビューティー・ヘルスケア'), gifts: T('Food & Gifts', '食品・ギフト') };
    var SUBS = { kettles: T('Electric kettles', '電気ケトル'), ricecookers: T('Rice cookers & donabe', '炊飯器・土鍋'), tableware: T('Springvale ware & tableware', '春川焼・和食器'), audio: T('Headphones & earbuds', 'ヘッドホン・イヤホン'), power: T('Power banks', 'モバイルバッテリー'), jackets: T('Rain jackets', 'レインジャケット'), bath: T('Bath & body', '入浴剤・ボディケア'), gifts: T('Local food & gifts', 'ご当地グルメ・ギフト') };
    var SELLERS = { marketa: T('Marketa', 'マルケタ'), kagami: T('Mirror Kiln', '鏡窯'), minori: T('Harvest Yuzu Farm', 'みのり柚子園'), brightdeal: T('BrightDeal Trading', 'ブライトディール商事') };
    var PR = [['', '3000', T('Under ¥3,000', '3,000円以下')], ['3000', '10000', T('¥3,000 to ¥10,000', '3,000〜10,000円')], ['10000', '20000', T('¥10,000 to ¥20,000', '10,000〜20,000円')], ['20000', '', T('Over ¥20,000', '20,000円以上')]];
    var fixedCat = el.dataset.cat;
    var q = new URLSearchParams(location.search);
    function g(k) { return q.get(k) || ''; }
    function set(k, v) { if (v) q.set(k, v); else q.delete(k); if (k !== 'page') q.delete('page'); history.replaceState(null, '', '?' + q + ''); render(); }
    function href(k, v) { var c = new URLSearchParams(q); if (v) c.set(k, v); else c.delete(k); c.delete('page'); return '?' + c; }
    $('#sort').value = g('sort') || 'featured';
    $('#sort').addEventListener('change', function () { set('sort', this.value === 'featured' ? '' : this.value); });
    function render() {
      var cat = fixedCat || g('cat'), text = g('q').trim().toLowerCase();
      var base = idx.filter(function (p) {
        if (cat && p.cat !== cat) return false;
        if (text && !text.split(/\s+/).every(function (w) { return p.text.indexOf(w) >= 0; })) return false;
        return true;
      });
      var brands = g('brand') ? g('brand').split('|') : [];
      var res = base.filter(function (p) {
        if (g('sub') && p.sub !== g('sub')) return false;
        if (brands.length && brands.indexOf(p.brandKey) < 0) return false;
        if (g('rating') && p.rating < +g('rating')) return false;
        if (g('pmin') && p.price < +g('pmin')) return false;
        if (g('pmax') && p.price > +g('pmax')) return false;
        if (g('speed') && p.speed > +g('speed')) return false;
        if (g('sale') && !p.pct) return false;
        if (g('coupon') && !p.coupon) return false;
        if (g('local') && !p.local) return false;
        if (g('seller') && p.seller !== g('seller')) return false;
        return true;
      });
      var s = g('sort');
      var order = idx.map(function (p) { return p.id; });
      res.sort(function (a, b) {
        if (s === 'price-asc') return a.price - b.price;
        if (s === 'price-desc') return b.price - a.price;
        if (s === 'rating') return b.rating - a.rating || b.ratings - a.ratings;
        if (s === 'reviews') return b.ratings - a.ratings;
        if (s === 'newest') return a.added < b.added ? 1 : -1;
        return order.indexOf(a.id) - order.indexOf(b.id);
      });
      var pages = Math.max(1, Math.ceil(res.length / PAGE)), page = Math.min(pages, Math.max(1, +g('page') || 1));
      var shown = res.slice((page - 1) * PAGE, page * PAGE);
      // filters
      var f = '';
      if (cat) {
        var subs = {}; base.forEach(function (p) { subs[p.sub] = (subs[p.sub] || 0) + 1; });
        f += '<h4>' + T('Department', 'カテゴリー') + '</h4><a href="' + href('sub', '') + '"' + (g('sub') ? '' : ' class="on"') + '>‹ ' + esc(CATS[cat]) + '</a>' + Object.keys(subs).map(function (k) { return '<a href="' + href('sub', k) + '"' + (g('sub') === k ? ' class="on"' : '') + '>&nbsp;&nbsp;' + esc(SUBS[k]) + ' (' + subs[k] + ')</a>'; }).join('');
      } else {
        var cc = {}; base.forEach(function (p) { cc[p.cat] = (cc[p.cat] || 0) + 1; });
        f += '<h4>' + T('Department', 'カテゴリー') + '</h4>' + Object.keys(cc).map(function (k) { var c = new URLSearchParams(q); c.set('cat', k); c.delete('page'); c.delete('sub'); return '<a href="?' + c + '">' + esc(CATS[k]) + ' (' + cc[k] + ')</a>'; }).join('');
        if (g('cat')) f += '<a href="' + href('cat', '') + '">‹ ' + T('Any department', 'すべてのカテゴリー') + '</a>';
      }
      f += '<h4>' + T('Delivery day', 'お届け日') + '</h4>' +
        '<label><input type="checkbox" data-f="speed" value="1"' + (g('speed') === '1' ? ' checked' : '') + '> <span class="fastbadge sm">Fast</span> ' + T('Get it Tomorrow', '明日お届け') + '</label>' +
        '<label><input type="checkbox" data-f="speed" value="2"' + (g('speed') === '2' ? ' checked' : '') + '> ' + T('Get it by Thursday, 8 Oct', '10月8日(木)までにお届け') + '</label>';
      f += '<h4>' + T('Customer reviews', 'カスタマーレビュー') + '</h4>' + ['4', '3'].map(function (r) { return '<a href="' + href('rating', g('rating') === r ? '' : r) + '"' + (g('rating') === r ? ' class="on"' : '') + '>' + stars(+r) + ' ' + T('& up', '以上') + '</a>'; }).join('');
      var bc = {}, bn = {}; base.forEach(function (p) { bc[p.brandKey] = (bc[p.brandKey] || 0) + 1; bn[p.brandKey] = p.brand; });
      f += '<h4>' + T('Brand', 'ブランド') + '</h4>' + Object.keys(bc).sort().map(function (b) { return '<label><input type="checkbox" data-brand="' + esc(b) + '"' + (brands.indexOf(b) >= 0 ? ' checked' : '') + '> ' + esc(bn[b]) + ' <span class="muted">(' + bc[b] + ')</span></label>'; }).join('');
      f += '<h4>' + T('Price', '価格') + '</h4>' + PR.map(function (r) { var c = new URLSearchParams(q); var on = g('pmin') === r[0] && g('pmax') === r[1]; if (on) { c.delete('pmin'); c.delete('pmax'); } else { if (r[0]) c.set('pmin', r[0]); else c.delete('pmin'); if (r[1]) c.set('pmax', r[1]); else c.delete('pmax'); } c.delete('page'); return '<a href="?' + c + '"' + (on ? ' class="on"' : '') + '>' + r[2] + '</a>'; }).join('') +
        '<div class="price-in"><input id="pmin" inputmode="numeric" placeholder="' + T('¥ Min', '￥ 最低') + '" value="' + esc(g('pmin')) + '" aria-label="' + T('Minimum price', '最低価格') + '"><input id="pmax" inputmode="numeric" placeholder="' + T('¥ Max', '￥ 最高') + '" value="' + esc(g('pmax')) + '" aria-label="' + T('Maximum price', '最高価格') + '"><button class="btn btn-sm" id="pgo">' + T('Go', '検索') + '</button></div>';
      f += '<h4>' + T('Deals & discounts', 'セール・割引') + '</h4><label><input type="checkbox" data-f="sale" value="1"' + (g('sale') ? ' checked' : '') + '> ' + T('On sale', 'セール中') + '</label><label><input type="checkbox" data-f="coupon" value="1"' + (g('coupon') ? ' checked' : '') + '> ' + T('With a coupon', 'クーポン対象') + '</label>';
      f += '<h4>' + T('Seller', '出品者') + '</h4><label><input type="checkbox" data-f="local" value="1"' + (g('local') ? ' checked' : '') + '> ' + T('Springvale Local sellers', '春川ローカル出品者') + '</label>' + Object.keys(SELLERS).map(function (k) { return '<a href="' + href('seller', g('seller') === k ? '' : k) + '"' + (g('seller') === k ? ' class="on"' : '') + '>' + esc(SELLERS[k]) + '</a>'; }).join('');
      f += '<p><a href="?' + (text ? 'q=' + encodeURIComponent(g('q')) : '') + '">' + T('Clear all filters', 'すべての絞り込みを解除') + '</a></p>';
      var fe = $('#filters'); fe.innerHTML = f;
      $$('[data-f]', fe).forEach(function (c) { c.addEventListener('change', function () { set(c.dataset.f, c.checked ? c.value : ''); }); });
      $$('[data-brand]', fe).forEach(function (c) { c.addEventListener('change', function () { var b = brands.slice(); if (c.checked) b.push(c.dataset.brand); else b = b.filter(function (x) { return x !== c.dataset.brand; }); set('brand', b.join('|')); }); });
      $('#pgo', fe).addEventListener('click', function () { var a = $('#pmin').value.replace(/\D/g, ''), b = $('#pmax').value.replace(/\D/g, ''); if (a) q.set('pmin', a); else q.delete('pmin'); set('pmax', b); });
      // header + results
      var from = res.length ? (page - 1) * PAGE + 1 : 0, to = Math.min(res.length, page * PAGE);
      var where = text ? T(' for ', '「') + '<b>"' + esc(g('q')) + '"</b>' + T('', '」の検索結果') : (cat ? T(' in ', '：') + '<b>' + esc(CATS[cat]) + '</b>' : '');
      $('#res-count').innerHTML = JA ? res.length + '件中 ' + from + '〜' + to + '件' + (text ? ' ' + where : where) : from + '–' + to + ' of ' + res.length + ' results' + where;
      var h = $('#sr-h'); if (h) h.textContent = text ? T('Results for "' + g('q') + '"', '「' + g('q') + '」の検索結果') : (g('local') ? T('Springvale Local sellers', '春川ローカル出品者の商品') : g('brand') ? T('Brand: ', 'ブランド：') + brands.map(function (b) { return bn[b] || b; }).join(', ') : T('All departments', 'すべてのカテゴリー'));
      var spons = res.filter(function (p) { return p.sponsored; })[0];
      $('#res-spons').innerHTML = page === 1 && spons ? cardHtml(spons, { sponsored: true }) : '';
      $('#res').innerHTML = shown.length ? shown.map(function (p) { return cardHtml(p, { sponsored: false }); }).join('') : '<div class="empty"><b>' + T('No results.', '該当する商品はありません。') + '</b><p>' + T('Try checking your spelling or use more general terms. Or clear some filters.', 'キーワードを変えるか、絞り込み条件を減らしてお試しください。') + '</p></div>';
      var pg = '';
      if (pages > 1) {
        var ph = function (n) { var c = new URLSearchParams(q); c.set('page', n); return '?' + c; };
        pg += page > 1 ? '<a href="' + ph(page - 1) + '">‹ ' + T('Previous', '前へ') + '</a>' : '<span class="dis">‹ ' + T('Previous', '前へ') + '</span>';
        for (var n = 1; n <= pages; n++) pg += n === page ? '<span class="on">' + n + '</span>' : '<a href="' + ph(n) + '">' + n + '</a>';
        pg += page < pages ? '<a href="' + ph(page + 1) + '">' + T('Next', '次へ') + ' ›</a>' : '<span class="dis">' + T('Next', '次へ') + ' ›</span>';
      }
      $('#pager').innerHTML = pg;
      $$('[data-quick]', el).forEach(function (b) { b.addEventListener('click', function () { var p = idx.byId[b.dataset.quick]; addToCart(p.id, p.variants[0].id, 1); flyout(idx, p.id); }); });
    }
    render();
  }

  // ---------- shipping rules shared by cart and checkout ----------
  var SELLER_RULE = { kagami: { fee: 700, free: 5000, name: T('Mirror Kiln', '鏡窯') }, minori: { fee: 600, free: 4000, name: T('Harvest Yuzu Farm', 'みのり柚子園') }, brightdeal: { fee: 0, free: 0, name: T('BrightDeal Trading', 'ブライトディール商事') } };
  var DT = {
    today: T('Today, Monday 5 October, 18:00–22:00', '本日 10月5日(月) 18:00〜22:00'), tue6: T('Tomorrow, Tuesday 6 October', '明日 10月6日(火)'), wed7: T('Wednesday 7 October', '10月7日(水)'),
    thu8: T('Thursday 8 October', '10月8日(木)'), fri9: T('Friday 9 October', '10月9日(金)'), sat10: T('Saturday 10 October', '10月10日(土)'), sun11: T('Sunday 11 October', '10月11日(日)'), mon12: T('Monday 12 October', '10月12日(月)'),
    minori: T('Wednesday 7 – Thursday 8 October', '10月7日(水)〜8日(木)'), kagami: T('Thursday 8 – Friday 9 October', '10月8日(木)〜9日(金)'), 'kagami-mto': T('2 – 9 November (made to order)', '11月2日〜9日（受注制作）'), brightdeal: T('Friday 9 – Tuesday 13 October', '10月9日(金)〜13日(火)'),
  };
  function lines(idx) {
    return cart.map(function (i) {
      var p = idx.byId[i.id]; if (!p) return null;
      var v = p.variants.find(function (x) { return x.id === i.v; }) || p.variants[0];
      return { it: i, p: p, v: v, total: v.price * i.qty, group: v.ship === 'fast' || v.ship === 'fast2' ? 'marketa' : p.seller };
    }).filter(Boolean);
  }
  function groups(ls) {
    var g = {}; ls.forEach(function (l) { (g[l.group] = g[l.group] || []).push(l); });
    return Object.keys(g).sort(function (a, b) { return a === 'marketa' ? -1 : b === 'marketa' ? 1 : 0; }).map(function (k) { return { id: k, lines: g[k], sub: g[k].reduce(function (s, l) { return s + l.total; }, 0) }; });
  }
  function couponOff(ls, member) {
    return ls.reduce(function (s, l) {
      if (!coupons[l.p.id] || !l.p.coupon || l.p.ld || (l.p.couponMember && !member)) return s;
      return s + (l.p.couponAmt || Math.floor(l.v.price * l.p.couponPct / 100));
    }, 0);
  }
  function sellerFee(gr) { var r = SELLER_RULE[gr.id]; return !r || !r.fee || gr.sub >= r.free ? 0 : r.fee; }

  // ---------- basket page ----------
  var cartEl = $('[data-cart]');
  if (cartEl) getIndex().then(function (idx) {
    function draw() {
      var ls = lines(idx), side = $('#cart-side');
      if (!ls.length) {
        cartEl.innerHTML = '<p>' + T('Your Marketa basket is empty.', 'マルケタのカートは空です。') + '</p><p><a href="' + url('deals.html') + '">' + T('Shop today’s deals', '本日のタイムセールを見る') + '</a> · <a href="' + url('index.html') + '">' + T('Continue shopping', '買い物を続ける') + '</a></p>';
        side.innerHTML = '<p class="sm muted">' + T('Items you add to your basket are saved on this device.', 'カートに追加した商品はこの端末に保存されます。') + '</p>';
        return;
      }
      var gs = groups(ls), sub = ls.reduce(function (s, l) { return s + l.total; }, 0), n = cartCount();
      cartEl.innerHTML = '<p class="sm muted" style="text-align:right">' + T('Price', '価格') + '</p>' + gs.map(function (gr) {
        var head = gr.id === 'marketa' ? T('Shipped by Marketa', 'マルケタが発送') : T('Shipped by ', '発送：') + SELLER_RULE[gr.id].name + T(' (arrives separately)', '（別便でお届け）');
        return '<div class="cart-grp"><h3>' + esc(head) + '</h3>' + gr.lines.map(function (l) {
          var stock = l.v.ship === 'oos' ? '<span class="oos">' + T('Currently unavailable', '在庫切れ') + '</span>' : l.v.ship === 'kagami-mto' ? T('Made to order', '受注制作') : l.v.stock <= 10 ? '<span class="oos">' + T('Only ' + l.v.stock + ' left in stock', '残り' + l.v.stock + '点') + '</span>' : '<span style="color:#067d62">' + T('In stock', '在庫あり') + '</span>';
          return '<div class="citem"><a href="' + url('p/' + l.p.id + '.html?v=' + l.v.id) + '"><img src="' + l.p.img + '" alt=""></a><div><a class="ct" href="' + url('p/' + l.p.id + '.html?v=' + l.v.id) + '">' + esc(l.p.title) + '</a><div class="sm">' + stock + '</div>' +
            (l.p.variants.length > 1 ? '<div class="sm"><b>' + T('Option:', 'オプション：') + '</b> ' + esc(l.v.name) + '</div>' : '') +
            '<div class="sm muted">' + T('Sold by ', '販売：') + esc(l.p.sellerName) + '</div>' +
            (l.p.coupon ? '<div class="sm"><label><input type="checkbox" data-cc="' + l.p.id + '"' + (coupons[l.p.id] ? ' checked' : '') + '> ' + esc(l.p.coupon) + (l.p.couponMember ? T(' (Fast members)', '（Fast会員）') : '') + (l.p.ld ? ' <span class="muted">' + T('(cannot be combined with today’s Lightning Deal)', '（本日のタイムセールとは併用できません）') + '</span>' : '') + '</label></div>' : '') +
            '<div class="citem-acts"><label>' + T('Qty:', '数量：') + ' <select data-qty="' + l.p.id + '|' + l.v.id + '">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (k) { return '<option' + (k === l.it.qty ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></label><span class="sep">|</span><button class="link" data-del="' + l.p.id + '|' + l.v.id + '">' + T('Delete', '削除') + '</button></div></div><div class="pb-price">' + yen(l.total) + '</div></div>';
        }).join('') + '</div>';
      }).join('') + '<div class="subtotal">' + T('Subtotal (' + n + ' items): ', '小計（' + n + '点）：') + '<b>' + yen(sub) + '</b></div>';
      var mk = gs.filter(function (gr) { return gr.id === 'marketa'; })[0], ms = mk ? mk.sub : 0;
      side.innerHTML = (mk ? '<div class="freebar">' + (ms >= 3500 ? '<span style="color:#067d62">✓ ' + T('Your order qualifies for FREE standard delivery on items shipped by Marketa.', 'マルケタが発送する商品は通常配送無料の対象です。') + '</span>' : T('Add <b>' + yen(3500 - ms) + '</b> of items shipped by Marketa for FREE standard delivery.', 'マルケタが発送する商品をあと<b>' + yen(3500 - ms) + '</b>追加で通常配送無料。')) + '<div class="claim"><i style="width:' + Math.min(100, ms / 35) + '%"></i></div></div>' : '') +
        '<p class="subtotal" style="text-align:left">' + T('Subtotal (' + n + ' items): ', '小計（' + n + '点）：') + '<b>' + yen(sub) + '</b></p><label class="sm"><input type="checkbox"> ' + T('This order contains a gift', 'ギフトの設定をする') + '</label><a class="btn btn-y btn-full" href="' + url('checkout.html') + '">' + T('Proceed to checkout', 'レジに進む') + '</a>' +
        '<p class="sm muted">' + T('Delivery fees and coupons are shown at checkout. Items from sellers that ship themselves have their own delivery fees.', '配送料とクーポンはご注文手続きで表示されます。出品者が発送する商品には出品者の配送料がかかります。') + '</p>';
      $$('[data-qty]').forEach(function (s) { s.addEventListener('change', function () { var k = s.dataset.qty.split('|'); cart.forEach(function (i) { if (i.id === k[0] && i.v === k[1]) i.qty = +s.value; }); saveCart(); draw(); }); });
      $$('[data-del]').forEach(function (b) { b.addEventListener('click', function () { var k = b.dataset.del.split('|'); cart = cart.filter(function (i) { return !(i.id === k[0] && i.v === k[1]); }); saveCart(); draw(); }); });
      $$('[data-cc]').forEach(function (c) { c.addEventListener('change', function () { coupons[c.dataset.cc] = c.checked; save('mk-coupons', coupons); }); });
    }
    draw();
  });

  // ---------- checkout ----------
  var co = $('[data-checkout]');
  if (co) getIndex().then(function (idx) {
    var ls = lines(idx);
    if (!ls.length) { co.innerHTML = '<div class="conf-box"><p>' + T('Your basket is empty.', 'カートは空です。') + ' <a href="' + url('index.html') + '">' + T('Continue shopping', '買い物を続ける') + '</a></p></div>'; return; }
    var gs = groups(ls), mk = gs.filter(function (g) { return g.id === 'marketa'; })[0];
    var hasSeller = gs.some(function (g) { return g.id !== 'marketa'; });
    var any2 = mk && mk.lines.some(function (l) { return l.v.ship === 'fast2'; });
    var st = { step: 1, addr: 'home', region: 'harukawa', opt: 'std', sched: any2 ? 'sat10' : 'wed7', slot: '19-21', trial: false, pay: 'card', points: false, gift: false };
    $('#co-count').textContent = '(' + cartCount() + T(' items', '点') + ')';
    function member() { return st.trial; }
    function options() {
      if (!mk) return [];
      var m = member(), sub = mk.sub, locker = st.addr === 'locker', minori = st.region === 'minori';
      var stdDay = any2 ? 'sat10' : (minori ? 'fri9' : 'thu8');
      return [
        { id: 'std', name: T('Standard delivery', '通常配送'), when: DT[stdDay], fee: m || sub >= 3500 || locker ? 0 : 450, ok: true },
        any2
          ? { id: 'next', name: T('Fastest delivery', 'お急ぎ便'), when: DT.thu8, fee: m ? 0 : 600, ok: true, note: T('An item ships from a warehouse outside Harvest Prefecture, so next-day is not available.', 'みのり県外の倉庫から発送する商品があるため、翌日配送はご利用いただけません。') }
          : { id: 'next', name: T('Next-day delivery', 'お急ぎ便（翌日）'), when: DT.tue6, fee: m ? 0 : 600, ok: true, note: T('Order by 14:00 (3 hrs 20 mins)', '14時までのご注文（あと3時間20分）') },
        { id: 'same', name: T('Same-day delivery', '当日お急ぎ便'), when: DT.today, fee: m ? (sub >= 2000 ? 0 : 300) : 900, ok: !any2 && !minori && !locker, why: any2 ? T('Not available for items outside the Springvale warehouse.', '春川倉庫以外の在庫の商品は対象外です。') : T('Springvale city addresses only (not lockers). Order by 11:00.', '春川市内の住所のみ（ロッカー不可）。11時までのご注文。'), note: T('Order within 20 mins (by 11:00)', 'あと20分以内（11時まで）にご注文') },
        { id: 'sched', name: T('Scheduled delivery', 'お届け日時指定便'), when: null, fee: m ? 0 : 350, ok: !locker, why: T('Not available for Marketa Lockers.', 'マルケタロッカーではご利用いただけません。') },
      ];
    }
    function chosen() { var o = options().filter(function (x) { return x.id === st.opt && x.ok; })[0]; if (!o && mk) { st.opt = 'std'; o = options()[0]; } return o; }
    function whenOf(o) { return o.id === 'sched' ? DT[st.sched] + ' ' + st.slot.replace('-', ':00–') + ':00' : o.when; }
    function totals() {
      var items = ls.reduce(function (s, l) { return s + l.total; }, 0);
      var o = chosen(), ship = (o ? o.fee : 0) + gs.reduce(function (s, g) { return s + (g.id === 'marketa' ? 0 : sellerFee(g)); }, 0);
      var cod = st.pay === 'cod' ? 330 : 0, cp = couponOff(ls, member());
      var before = items + ship + cod - cp, pts = st.points ? Math.min(+co.dataset.points, before) : 0;
      return { items: items, ship: ship, cod: cod, cp: cp, pts: pts, total: before - pts };
    }
    function payName() { return { card: T('JCB ending in 4821', 'JCB 末尾4821'), konbini: T('Convenience store payment / Pay-easy', 'コンビニ払い・Pay-easy'), cod: T('Cash on delivery', '代金引換'), kumo: T('Kumo Mobile carrier billing', 'クモモバイル キャリア決済') }[st.pay]; }
    function addrText() { var r = $('input[name=addr]:checked'); return r ? r.closest('label').querySelector('b').textContent : ''; }
    function draw() {
      // step 2: delivery
      var d = '';
      if (mk) {
        var opts = options();
        d += '<div class="grp-box"><h3>' + T('Shipped by Marketa', 'マルケタが発送') + ' <span class="muted sm">(' + mk.lines.length + T(' items', '点') + ')</span></h3><p class="sm muted">' + mk.lines.map(function (l) { return esc(l.p.short) + (l.p.multi ? ' – ' + esc(l.v.name) : '') + ' × ' + l.it.qty; }).join('<br>') + '</p>' +
          '<table class="dtable"><thead><tr><th></th><th>' + T('Option', '配送方法') + '</th><th>' + T('Arrives', 'お届け日') + '</th><th>' + T('Price', '料金') + '</th></tr></thead><tbody>' + opts.map(function (o) {
            var when = o.id === 'sched' ? '<select id="sched-day"' + (o.ok ? '' : ' disabled') + '>' + (any2 ? ['sat10', 'sun11', 'mon12'] : ['wed7', 'thu8', 'fri9', 'sat10', 'sun11', 'mon12']).map(function (k) { return '<option value="' + k + '"' + (st.sched === k ? ' selected' : '') + '>' + DT[k] + '</option>'; }).join('') + '</select> <select id="sched-slot"' + (o.ok ? '' : ' disabled') + '>' + ['8-12', '14-16', '16-18', '18-20', '19-21'].map(function (k) { return '<option' + (st.slot === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>' : esc(o.when) + (o.note && o.ok ? '<br><span class="sm" style="color:#067d62">' + o.note + '</span>' : '');
            return '<tr class="' + (o.ok ? '' : 'na') + '"><td><input type="radio" name="dopt" value="' + o.id + '"' + (o.ok ? '' : ' disabled') + (st.opt === o.id && o.ok ? ' checked' : '') + ' aria-label="' + esc(o.name) + '"></td><td><b>' + esc(o.name) + '</b>' + (o.ok ? '' : '<br><span class="sm">' + o.why + '</span>') + '</td><td>' + when + '</td><td>' + (o.fee ? yen(o.fee) : '<b style="color:#067d62">' + T('FREE', '無料') + '</b>') + '</td></tr>';
          }).join('') + '</tbody></table>' +
          '<div class="trial"><label><input type="checkbox" id="trial"' + (st.trial ? ' checked' : '') + '> <b>' + T('Start your 30-day free Marketa Fast trial', 'マルケタFastの30日間無料体験を開始') + '</b></label><p class="sm">' + T('FREE next-day, scheduled and standard delivery on this order, FREE same-day on orders of ¥2,000 or more, and member coupons. ¥600/month after the trial unless you cancel. Needs a credit card or Kumo Mobile billing. Free change-of-mind returns are not included during the trial.', 'このご注文の翌日配送・日時指定・通常配送が無料、2,000円以上なら当日配送も無料、会員限定クーポンも利用可。体験終了後は解約しない限り月額600円。クレジットカードまたはクモモバイル決済が必要です。無料体験中は「お客様都合の返品送料無料」の対象外です。') + '</p></div></div>';
      }
      gs.filter(function (g) { return g.id !== 'marketa'; }).forEach(function (g) {
        var r = SELLER_RULE[g.id], fee = sellerFee(g);
        d += '<div class="grp-box"><h3>' + T('Shipped by ', '発送：') + esc(r.name) + '</h3><table class="dtable"><thead><tr><th>' + T('Item', '商品') + '</th><th>' + T('Arrives', 'お届け予定') + '</th></tr></thead><tbody>' + g.lines.map(function (l) { return '<tr><td>' + esc(l.p.short) + (l.p.multi ? ' – ' + esc(l.v.name) : '') + ' × ' + l.it.qty + '</td><td>' + DT[l.v.ship] + '</td></tr>'; }).join('') + '</tbody></table><p class="sm">' + T('Seller delivery: ', '出品者の配送料：') + (fee ? yen(fee) + (r.free ? T(' (free on orders of ' + yen(r.free) + ' or more from this seller)', '（この出品者で' + yen(r.free) + '以上のご注文で無料）') : '') : '<b style="color:#067d62">' + T('FREE', '無料') + '</b>') + T('. ', '。') + T('Not eligible for Marketa Fast; arrives separately.', 'マルケタFastの対象外・別便でお届けします。') + '</p></div>';
      });
      $('#co-delivery').innerHTML = d;
      $$('input[name=dopt]').forEach(function (r) { r.addEventListener('change', function () { st.opt = r.value; draw(); }); });
      var sd = $('#sched-day'); if (sd) sd.addEventListener('change', function () { st.sched = sd.value; st.opt = 'sched'; draw(); });
      var sl = $('#sched-slot'); if (sl) sl.addEventListener('change', function () { st.slot = sl.value; st.opt = 'sched'; draw(); });
      var tr = $('#trial'); if (tr) tr.addEventListener('change', function () { st.trial = tr.checked; draw(); });
      // step 3: payment
      var tt = totals();
      var pays = [
        ['card', T('JCB ending in 4821', 'JCB 末尾4821') + ' <span class="muted sm">' + T('Aki Mori · expires 08/2029', 'AKI MORI・有効期限 08/2029') + '</span>', true, T('Charged when the order is dispatched. Instalments (3, 6, 10, 12 or 24) available on orders of ¥10,000 or more.', '商品の発送時に請求されます。10,000円以上のご注文で分割払い（3・6・10・12・24回）が可能です。')],
        ['visa', T('Visa ending in 0937', 'Visa 末尾0937') + ' <span class="oos sm">' + T('Expired 09/2026', '有効期限切れ 09/2026') + '</span>', false, T('Update the expiry date in Payment methods to use this card.', 'このカードを使うには、お支払い方法で有効期限を更新してください。')],
        ['konbini', T('Convenience store payment / Pay-easy', 'コンビニ払い・Pay-easy'), tt.total <= 299999, T('Pay within 3 days or the order is cancelled. Items ship after payment is confirmed, so delivery dates start from your payment.', '3日以内にお支払いがない場合、ご注文はキャンセルされます。入金確認後の発送となるため、お届け日はお支払い日から計算されます。')],
        ['cod', T('Cash on delivery (+¥330)', '代金引換（手数料330円）'), !hasSeller && st.addr !== 'locker', hasSeller ? T('Not available: your order includes items shipped by other sellers.', 'ご利用不可：出品者が発送する商品が含まれています。') : st.addr === 'locker' ? T('Not available for Marketa Locker pick-up.', 'マルケタロッカー受け取りではご利用いただけません。') : T('Pay the driver in cash. Up to ¥300,000.', '配達員に現金でお支払い。300,000円まで。')],
        ['kumo', T('Kumo Mobile carrier billing', 'クモモバイル キャリア決済'), tt.total <= 37600, T('Added to your Kumo Mobile bill. Monthly limit ¥50,000; ¥12,400 already used this month (¥37,600 left).', 'クモモバイルの利用料金と合算してお支払い。月間上限50,000円のうち今月12,400円利用済み（残り37,600円）。')],
      ];
      if (pays.some(function (p) { return p[0] === st.pay && !p[2]; })) st.pay = 'card';
      $('#co-pay').innerHTML = pays.map(function (p) { return '<label class="payopt' + (p[2] ? '' : ' na') + '"><input type="radio" name="pay" value="' + p[0] + '"' + (p[2] ? '' : ' disabled') + (st.pay === p[0] ? ' checked' : '') + '><span><b>' + p[1] + '</b><br><span class="sm">' + p[3] + '</span></span></label>'; }).join('') +
        '<label class="payopt"><input type="checkbox" id="usepts"' + (st.points ? ' checked' : '') + '><span><b>' + T('Use my Marketa Points', 'マルケタポイントを使う') + '</b> <span class="sm">(' + num(co.dataset.points) + T(' points available, 1 point = ¥1', 'ポイント利用可能・1ポイント＝1円') + ')</span></span></label>' +
        '<p class="sm muted">' + T('Gift card balance: ¥0.', 'ギフトカード残高：0円') + ' <a href="' + url('help/payment.html') + '">' + T('About payment methods', 'お支払い方法について') + '</a></p>';
      $$('input[name=pay]').forEach(function (r) { r.addEventListener('change', function () { st.pay = r.value; draw(); }); });
      $('#usepts').addEventListener('change', function () { st.points = this.checked; draw(); });
      // summaries
      var o = chosen();
      $('[data-step="1"] .co-sum').innerHTML = esc(addrText()) + ' <button class="link sm" data-go="1">' + T('Change', '変更') + '</button>';
      $('[data-step="2"] .co-sum').innerHTML = (o ? esc(o.name) + ': ' + esc(whenOf(o)) : '') + (hasSeller ? T(' · seller items arrive separately', '・出品者の商品は別便') : '') + ' <button class="link sm" data-go="2">' + T('Change', '変更') + '</button>';
      $('[data-step="3"] .co-sum').innerHTML = esc(payName()) + (st.points ? T(' + points', '＋ポイント') : '') + ' <button class="link sm" data-go="3">' + T('Change', '変更') + '</button>';
      $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { st.step = +b.dataset.go; steps(); }); });
      // step 4: review
      var err = st.trial && st.pay !== 'card' && st.pay !== 'kumo' ? T('The Marketa Fast free trial needs a credit card or Kumo Mobile billing. Change the payment method or untick the trial.', 'マルケタFastの無料体験にはクレジットカードまたはクモモバイル決済が必要です。お支払い方法を変更するか、無料体験のチェックを外してください。') : '';
      $('#co-review').innerHTML = gs.map(function (g) {
        var when = g.id === 'marketa' ? whenOf(o) : null;
        return '<div class="grp-box"><h3>' + (g.id === 'marketa' ? T('Shipped by Marketa', 'マルケタが発送') + ' · <span style="color:#067d62">' + esc(when) + '</span>' : T('Shipped by ', '発送：') + esc(SELLER_RULE[g.id].name)) + '</h3>' + g.lines.map(function (l) { return '<div class="ord-item"><img src="' + l.p.img + '" alt=""><div><b>' + esc(l.p.title) + '</b><div class="sm">' + (l.p.multi ? esc(l.v.name) + ' · ' : '') + T('Qty ', '数量 ') + l.it.qty + ' · ' + yen(l.total) + '</div>' + (g.id === 'marketa' ? '' : '<div class="sm" style="color:#067d62">' + DT[l.v.ship] + '</div>') + '</div></div>'; }).join('') + '</div>';
      }).join('') + (err ? '<p class="err">' + err + '</p>' : '') + '<button class="btn btn-y" id="place"' + (err ? ' disabled' : '') + '>' + T('Place your order', '注文を確定する') + '</button><p class="sm muted">' + T('By placing your order you agree to Marketa’s conditions of use and sale. Items sold by other sellers are subject to their own return policies.', '注文を確定すると、マルケタの利用規約に同意したものとみなされます。出品者が販売する商品には各出品者の返品ポリシーが適用されます。') + '</p>';
      // side summary
      $('#co-side').innerHTML = '<button class="btn btn-y btn-full" id="place2"' + (st.step < 4 || err ? ' disabled' : '') + '>' + T('Place your order', '注文を確定する') + '</button><h3>' + T('Order Summary', 'ご注文内容') + '</h3><table class="sumtable">' +
        '<tr><td>' + T('Items:', '商品の小計：') + '</td><td>' + yen(tt.items) + '</td></tr><tr><td>' + T('Postage & packing:', '配送料・手数料：') + '</td><td>' + yen(tt.ship) + '</td></tr>' +
        (tt.cod ? '<tr><td>' + T('Cash on delivery fee:', '代引手数料：') + '</td><td>' + yen(tt.cod) + '</td></tr>' : '') + (tt.cp ? '<tr><td>' + T('Coupons:', 'クーポン：') + '</td><td>-' + yen(tt.cp) + '</td></tr>' : '') + (tt.pts ? '<tr><td>' + T('Points used:', 'ポイント利用：') + '</td><td>-' + yen(tt.pts) + '</td></tr>' : '') +
        '<tr class="tot"><td>' + T('Order Total:', 'ご請求額：') + '</td><td>' + yen(tt.total) + '</td></tr></table><p class="sm muted">' + T('Prices include consumption tax. You earn ' + Math.floor(tt.items * (member() ? 0.02 : 0.01)) + ' points on this order.', '価格はすべて税込です。このご注文で' + Math.floor(tt.items * (member() ? 0.02 : 0.01)) + 'ポイント獲得。') + '</p>';
      [$('#place'), $('#place2')].forEach(function (b) { if (b) b.addEventListener('click', place); });
    }
    function place() {
      var tt = totals(), o = chosen();
      var no = '503-' + String(Math.floor(1e6 + Math.random() * 9e6)) + '-' + String(Math.floor(1e6 + Math.random() * 9e6));
      var order = {
        no: no, lang: LANG, trial: st.trial, pay: payName(), addr: addrText(), totals: tt,
        groups: gs.map(function (g) { return { by: g.id === 'marketa' ? T('Marketa', 'マルケタ') : SELLER_RULE[g.id].name, when: g.id === 'marketa' ? (o ? o.name + ': ' + whenOf(o) : '') : g.lines.map(function (l) { return DT[l.v.ship]; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(' / '), items: g.lines.map(function (l) { return { id: l.p.id, name: l.p.title, img: l.p.img, opt: l.p.multi ? l.v.name : '', qty: l.it.qty, total: l.total }; }) }; }),
      };
      var all = load('mk-orders', []); all.unshift(order); save('mk-orders', all.slice(0, 10));
      ls.forEach(function (l) { if (coupons[l.p.id]) delete coupons[l.p.id]; }); save('mk-coupons', coupons);
      cart = []; saveCart();
      location.href = url('confirmation.html');
    }
    function steps() {
      $$('.co-step').forEach(function (s) { s.classList.toggle('open', +s.dataset.step === st.step); });
      draw();
      var open = $('.co-step.open'); if (open) open.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    $$('input[name=addr]').forEach(function (r) { r.addEventListener('change', function () { st.addr = r.value; st.region = r.dataset.region; draw(); }); });
    $$('[data-next]').forEach(function (b) { b.addEventListener('click', function () { st.step = +b.closest('.co-step').dataset.step + 1; steps(); }); });
    st.step = 1; $$('.co-step').forEach(function (s) { s.classList.toggle('open', s.dataset.step === '1'); }); draw();
  });

  // ---------- confirmation ----------
  var cf = $('[data-confirm]');
  if (cf) {
    var last = load('mk-orders', [])[0];
    if (!last) cf.innerHTML = '<h1>' + T('No recent order', '最近のご注文はありません') + '</h1><p><a href="' + url('orders.html') + '">' + T('Go to Your orders', '注文履歴へ') + '</a></p>';
    else cf.innerHTML = '<div class="conf-box"><h2>✓ ' + T('Order placed, thank you!', 'ご注文ありがとうございます。') + '</h2><p>' + T('Confirmation will be sent to your email. Order number: ', '確認メールをお送りします。注文番号：') + '<b>' + last.no + '</b></p>' +
      last.groups.map(function (g) { return '<div class="grp-box"><h3>' + T('Shipped by ', '発送：') + esc(g.by) + '</h3><p style="color:#067d62"><b>' + esc(g.when) + '</b></p>' + g.items.map(function (i) { return '<div class="ord-item"><img src="' + i.img + '" alt=""><div><a href="' + url('p/' + i.id + '.html') + '">' + esc(i.name) + '</a><div class="sm">' + (i.opt ? esc(i.opt) + ' · ' : '') + T('Qty ', '数量 ') + i.qty + ' · ' + yen(i.total) + '</div></div></div>'; }).join('') + '</div>'; }).join('') +
      '<table class="kv"><tr><th>' + T('Delivery address', 'お届け先') + '</th><td>' + esc(last.addr) + '</td></tr><tr><th>' + T('Payment', 'お支払い') + '</th><td>' + esc(last.pay) + '</td></tr><tr><th>' + T('Order total', 'ご請求額') + '</th><td><b>' + yen(last.totals.total) + '</b></td></tr></table>' +
      (last.trial ? '<p class="trial sm">' + T('Your Marketa Fast free trial has started. It ends on 4 November 2026; after that it costs ¥600 a month unless you cancel.', 'マルケタFastの無料体験が始まりました。2026年11月4日に終了し、その後は解約しない限り月額600円です。') + '</p>' : '') +
      '<p><a class="btn btn-y" href="' + url('orders.html') + '">' + T('Review or edit your orders', '注文履歴を確認・変更') + '</a> <a class="btn" href="' + url('index.html') + '">' + T('Continue shopping', '買い物を続ける') + '</a></p></div>';
  }

  // ---------- orders placed in this browser ----------
  var ol = $('#ord-local');
  if (ol) {
    ol.innerHTML = load('mk-orders', []).map(function (o) {
      return '<div class="order"><div class="ord-head"><div><small>' + T('ORDER PLACED', '注文日') + '</small>' + T('5 October 2026', '2026年10月5日') + '</div><div><small>' + T('TOTAL', '合計') + '</small>' + yen(o.totals.total) + '</div><div><small>' + T('PAYMENT', 'お支払い') + '</small>' + esc(o.pay) + '</div><div class="ord-no"><small>' + T('ORDER #', '注文番号') + '</small>' + o.no + '</div></div><div class="ord-body"><div><h3>' + T('Ordered', '注文済み') + '</h3>' +
        o.groups.map(function (g) { return '<p class="sm" style="color:#067d62">' + esc(g.by) + ': ' + esc(g.when) + '</p>' + g.items.map(function (i) { return '<div class="ord-item"><img src="' + i.img + '" alt=""><div><a href="' + url('p/' + i.id + '.html') + '">' + esc(i.name) + '</a><div class="sm muted">' + (i.opt ? esc(i.opt) + ' · ' : '') + T('Qty ', '数量 ') + i.qty + '</div></div></div>'; }).join(''); }).join('') +
        '</div><div class="ord-acts"><button class="btn btn-w btn-full" data-cancel="' + o.no + '">' + T('Cancel items', '注文をキャンセル') + '</button></div></div></div>';
    }).join('');
    $$('[data-cancel]', ol).forEach(function (b) { b.addEventListener('click', function () { save('mk-orders', load('mk-orders', []).filter(function (o) { return o.no !== b.dataset.cancel; })); b.closest('.order').remove(); }); });
  }
})();
