/* Harukawa Railway — site script (no dependencies) */
(function () {
  'use strict';
  var lang = document.documentElement.lang === 'ja' ? 'ja' : 'en';
  var J = lang === 'ja';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var tr = function (en, ja) { return J ? ja : en; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var hm = function (m) { return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  var yen = function (n) { return J ? n.toLocaleString('en') + '円' : '¥' + n.toLocaleString('en'); };
  var params = new URLSearchParams(location.search);
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } } };

  // ---------- generic UI ----------
  var cookie = $('.cookie');
  if (cookie && !store.get('ht-cookie')) cookie.hidden = false;
  $$('.cookie-ok, .cookie-x').forEach(function (b) { b.addEventListener('click', function () { cookie.hidden = true; store.set('ht-cookie', '1'); }); });
  var menuBtn = $('.menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', function () { $('.gnav').classList.toggle('open'); });
  $$('[data-tabs]').forEach(function (box) {
    var bar = $('.tab-bar', box);
    $$('.tab-bar button', box).forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('button', bar).forEach(function (b) { b.classList.toggle('on', b === btn); });
        $$(':scope > .tab-panel', box).forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== btn.getAttribute('data-tab'); });
      });
    });
  });
  // weekend timetable tab by default on Sat/Sun/holidays (the site's "today" is Sunday 4 Oct 2026)
  $$('.tt-head').length && $$('[data-tab="we"]').forEach(function (b) { b.click(); });
  var car = $('[data-carousel]');
  if (car) {
    var slides = $$('.slide', car), dots = $$('.dots i', car), cur = 0, timer;
    var show = function (i) { cur = (i + slides.length) % slides.length; slides.forEach(function (s, k) { s.classList.toggle('on', k === cur); }); dots.forEach(function (d, k) { d.classList.toggle('on', k === cur); }); };
    var auto = function () { clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 6000); };
    $('.car-prev', car).addEventListener('click', function () { show(cur - 1); auto(); });
    $('.car-next', car).addEventListener('click', function () { show(cur + 1); auto(); });
    auto();
  }
  $$('.swap').forEach(function (b) { b.addEventListener('click', function () { var f = b.closest('form'); var a = f.elements.from, c = f.elements.to; var v = a.value; a.value = c.value; c.value = v; }); });
  $$('select.jump').forEach(function (s) { s.addEventListener('change', function () { if (s.value) location.href = s.value; }); });
  $$('.print').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  // ---------- data ----------
  var NET, TRAINS, loading;
  function load() {
    if (!loading) loading = Promise.all([fetch('/assets/data/network.json').then(function (r) { return r.json(); }), fetch('/assets/data/trains.json').then(function (r) { return r.json(); })])
      .then(function (d) { NET = d[0]; TRAINS = d[1]; });
    return loading;
  }
  var S = function (id) { return NET.stations.find(function (s) { return s.id === id; }); };
  var nm = function (id) { return S(id)[lang]; };
  function lineIds(l) { return NET.stations.filter(function (s) { return l in s.km; }).sort(function (a, b) { return a.km[l] - b.km[l]; }).map(function (s) { return s.id; }); }
  function dist(a, b) {
    var A = S(a).km, B = S(b).km;
    for (var l of ['K', 'B']) if (l in A && l in B) return Math.round(Math.abs(A[l] - B[l]) * 10) / 10;
    return Math.round((A[Object.keys(A)[0]] + B[Object.keys(B)[0]]) * 10) / 10;
  }
  var kmc = function (d) { return Math.max(1, Math.ceil(d)); };
  function fare(a, b) { var k = kmc(dist(a, b)); var band = NET.fareBands.find(function (x) { return k <= x[0]; }); return { km: dist(a, b), ticket: band[1], ic: band[2], childTicket: Math.floor(band[1] / 20) * 10, childIc: Math.floor(band[2] / 2) }; }
  function xFee(km) { return NET.fee.bands.find(function (x) { return kmc(km) <= x[0]; })[1]; }
  function dayType(iso) { var d = new Date(iso + 'T00:00:00'); var w = d.getDay(); return (w === 0 || w === 6 || NET.holidays.indexOf(iso) >= 0) ? 'we' : 'wd'; }
  function trainName(t) {
    var ty = { L: tr('Local', '普通'), R: tr('Rapid', '快速'), X: tr('Ltd. Exp. Tsukikage ' + t.no, '特急「月影」' + t.no + '号') }[t.type];
    return J ? ty + ' ' + nm(t.d) + '行' : ty + ' for ' + nm(t.d);
  }
  var lineColor = function (t) { return t.type === 'X' ? '#3b2a7a' : NET.lines[t.line].color; };
  function fmtDate(iso) { var p = iso.split('-').map(Number); var d = new Date(iso + 'T00:00:00'); var wd = J ? '日月火水木金土'[d.getDay()] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    return J ? p[0] + '年' + p[1] + '月' + p[2] + '日（' + wd + '）' : wd + ' ' + p[2] + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][p[1] - 1] + ' ' + p[0]; }

  // ---------- timetable: click a time to see the train ----------
  var pop;
  document.addEventListener('click', function (e) {
    var tm = e.target.closest && e.target.closest('.tm');
    if (pop && (!e.target.closest('.train-pop') || e.target.classList.contains('x'))) { pop.remove(); pop = null; }
    if (!tm) return;
    var here = location.pathname.split('/').pop().split('-')[0];
    load().then(function () {
      var t = TRAINS.find(function (x) { return x.id === tm.getAttribute('data-train'); });
      if (!t) return;
      pop = document.createElement('div'); pop.className = 'train-pop';
      pop.innerHTML = '<button class="x" type="button" aria-label="Close">×</button><h4>' + esc(trainName(t)) + '</h4><table>' + t.s.map(function (s) { return '<tr' + (s[0] === here ? ' class="cur"' : '') + '><td>' + esc(nm(s[0])) + '</td><td class="num">' + hm(s[1]) + '</td><td class="small muted">' + s[2] + tr('', '番線') + '</td></tr>'; }).join('') + '</table>' + (t.type === 'X' ? '<p class="small"><a href="/' + lang + '/reserve/index.html">' + tr('Reserve a seat', '座席を予約') + '</a></p>' : '');
      document.body.appendChild(pop);
      var r = tm.getBoundingClientRect();
      pop.style.left = Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 8) + 'px';
      pop.style.top = (window.scrollY + r.bottom + 4) + 'px';
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop) { pop.remove(); pop = null; } });

  // ---------- journey planner (connection scan along the route) ----------
  function routePath(a, b) {
    var on = function (l, x, y) { var ids = lineIds(l); var i = ids.indexOf(x), j = ids.indexOf(y); return i <= j ? ids.slice(i, j + 1) : ids.slice(j, i + 1).reverse(); };
    var A = Object.keys(S(a).km), B = Object.keys(S(b).km);
    var common = A.find(function (l) { return B.indexOf(l) >= 0; });
    if (common) return on(common, a, b);
    return on(A[0], a, 'central').concat(on(B[0], 'central', b).slice(1));
  }
  function connections(path, day, useX) {
    var pos = {}; path.forEach(function (id, i) { pos[id] = i; });
    var out = [];
    TRAINS.forEach(function (t) {
      if (t.day !== day || (!useX && t.type === 'X')) return;
      for (var i = 0; i + 1 < t.s.length; i++) {
        var a = t.s[i], b = t.s[i + 1];
        if (pos[a[0]] !== undefined && pos[b[0]] !== undefined && pos[a[0]] < pos[b[0]]) out.push({ t: t, from: a[0], to: b[0], dep: a[1], arr: b[1], plat: a[2] });
      }
    });
    return out.sort(function (x, y) { return x.dep - y.dep || x.arr - y.arr; });
  }
  var XFER = 4;
  function earliest(conns, from, to, t0) {
    var ea = {}; ea[from] = t0; var on = {};
    conns.forEach(function (c) {
      if (on[c.t.id] || (ea[c.from] !== undefined && ea[c.from] + (c.from === from ? 0 : XFER) <= c.dep)) {
        on[c.t.id] = true;
        if (ea[c.to] === undefined || c.arr < ea[c.to]) ea[c.to] = c.arr;
      }
    });
    return ea[to];
  }
  function latest(conns, from, to, T) {
    var rev = conns.slice().sort(function (x, y) { return y.arr - x.arr || y.dep - x.dep; });
    var ld = {}; ld[to] = T; var on = {}, exit = {}, best = {};
    rev.forEach(function (c) {
      var ok = on[c.t.id];
      if (!ok && ld[c.to] !== undefined && c.arr + (c.to === to ? 0 : XFER) <= ld[c.to]) { ok = on[c.t.id] = true; exit[c.t.id] = c; }
      if (ok && (ld[c.from] === undefined || c.dep > ld[c.from])) { ld[c.from] = c.dep; best[c.from] = c; }
    });
    if (!best[from]) return null;
    var legs = [], st = from, guard = 0;
    while (st !== to && guard++ < 10) { var b = best[st]; var e = exit[b.t.id]; legs.push({ t: b.t, from: st, to: e.to, dep: b.dep, arr: e.arr, plat: b.plat }); st = e.to; }
    return { legs: legs, dep: legs[0].dep, arr: legs[legs.length - 1].arr };
  }
  function plan(from, to, iso, t0, mode, useX) {
    var day = dayType(iso); var conns = connections(routePath(from, to), day, useX); var out = [], seen = {};
    var add = function (j) { var k = j.dep + '-' + j.arr; if (!seen[k]) { seen[k] = 1; out.push(j); } };
    if (mode === 'arr') {
      var T = t0;
      for (var k = 0; k < 4; k++) { var j = latest(conns, from, to, T); if (!j) break; var ea = earliest(conns, from, to, j.dep); j = latest(conns, from, to, ea) || j; add(j); T = j.arr - 1; }
      out.reverse();
    } else {
      var t = t0;
      for (var n = 0; n < 4; n++) { var a = earliest(conns, from, to, t); if (a === undefined) break; var jj = latest(conns, from, to, a); if (!jj) break; add(jj); t = jj.dep + 1; }
    }
    var f = fare(from, to); var peak = NET.peak.indexOf(iso) >= 0;
    out.forEach(function (j) {
      j.fare = f; j.x = j.legs.filter(function (l) { return l.t.type === 'X'; }).reduce(function (s, l) { return s + xFee(dist(l.from, l.to)) + (peak ? NET.fee.peak : 0); }, 0);
      j.mins = j.arr - j.dep; j.changes = j.legs.length - 1;
    });
    return out;
  }
  function renderPlanner() {
    var out = $('#planner-out'); if (!out) return;
    var form = $('.planner-form');
    ['from', 'to', 'date', 'h', 'm'].forEach(function (k) { if (params.get(k) && form.elements[k]) form.elements[k].value = params.get(k); });
    if (params.get('mode')) $$('input[name=mode]', form).forEach(function (r) { r.checked = r.value === params.get('mode'); });
    if (params.has('from') && params.has('to')) form.elements.x.checked = params.get('x') === '1';
    if (!params.get('from') || !params.get('to')) return;
    load().then(function () {
      var from = params.get('from'), to = params.get('to'), iso = params.get('date') || NET.range.min;
      if (!S(from) || !S(to)) return;
      if (from === to) { out.innerHTML = '<p class="msg">' + tr('Departure and arrival stations are the same.', '出発駅と到着駅が同じです。') + '</p>'; return; }
      if (iso < NET.range.min || iso > NET.range.max) { out.innerHTML = '<p class="msg">' + tr('Please choose a date between 4 October and 13 November 2026. Searches for the new timetable from 14 November open on 1 November.', '2026年10月4日から11月13日までの日付を選んでください。11月14日以降（ダイヤ改正後）の検索は11月1日から可能になります。') + '</p>'; return; }
      var t0 = Number(params.get('h') || 14) * 60 + Number(params.get('m') || 0), mode = params.get('mode') === 'arr' ? 'arr' : 'dep';
      var res = plan(from, to, iso, t0, mode, params.get('x') === '1');
      var head = '<h2 class="h2">' + esc(nm(from)) + ' → ' + esc(nm(to)) + '</h2><p class="small">' + fmtDate(iso) + ' ' + hm(t0) + (mode === 'arr' ? tr(' arrive by', ' 到着') : tr(' depart after', ' 以降出発')) + ' · ' + (dayType(iso) === 'we' ? tr('Saturday/holiday timetable', '土曜・休日ダイヤ') : tr('Weekday timetable', '平日ダイヤ')) + (NET.peak.indexOf(iso) >= 0 ? ' · <b>' + tr('Tsukikage peak date', '「月影」繁忙期') + '</b>' : '') + '</p>';
      if (!res.length) { out.innerHTML = head + '<p class="msg">' + tr('No trains found for this time. Try an earlier time or another date.', '該当する列車がありません。時刻や日付を変えて検索してください。') + '</p>'; return; }
      var fastest = Math.min.apply(null, res.map(function (j) { return j.mins; })), cheapest = Math.min.apply(null, res.map(function (j) { return j.fare.ticket + j.x; })), fewest = Math.min.apply(null, res.map(function (j) { return j.changes; }));
      out.innerHTML = head + res.map(function (j, i) {
        var labels = (j.mins === fastest ? '<span class="lbl">' + tr('Fastest', '早') + '</span>' : '') + (j.fare.ticket + j.x === cheapest ? '<span class="lbl cheap">' + tr('Cheapest', '安') + '</span>' : '') + (j.changes === fewest ? '<span class="lbl few">' + tr('Fewest changes', '楽') + '</span>' : '');
        var legs = j.legs.map(function (l, k) {
          var wait = k ? '<div class="leg-wait">' + tr('Change, ', '乗換 ') + (l.dep - j.legs[k - 1].arr) + tr(' min', '分') + '</div>' : '';
          var res = l.t.type === 'X' ? ' <a class="btn-sm" href="/' + lang + '/reserve/seat.html?train=' + encodeURIComponent(l.t.id) + '&date=' + iso + '&from=' + l.from + '&to=' + l.to + '&ad=1&ch=0&cls=std">' + tr('Reserve seat', '座席予約') + '</a>' : '';
          return wait + '<div class="leg-st"><b>' + hm(l.dep) + '</b><span>' + esc(nm(l.from)) + ' <span class="muted small">' + tr('Platform ', '') + l.plat + tr('', '番線') + '</span></span></div><div class="leg-train" style="border-color:' + lineColor(l.t) + '">' + esc(trainName(l.t)) + ' · ' + (l.arr - l.dep) + tr(' min', '分') + res + '</div>' + (k === j.legs.length - 1 ? '<div class="leg-st"><b>' + hm(l.arr) + '</b><span>' + esc(nm(l.to)) + '</span></div>' : '');
        }).join('');
        return '<div class="route"><div class="route-h"><span class="small muted">' + tr('Route ', 'ルート') + (i + 1) + '</span><span class="tt-big">' + hm(j.dep) + ' → ' + hm(j.arr) + '</span><span>' + j.mins + tr(' min', '分') + '</span><span>' + tr('Changes: ', '乗換') + j.changes + tr('', '回') + '</span><span><b>' + yen(j.fare.ticket + j.x) + '</b> <span class="small muted">(HaruCa ' + yen(j.fare.ic + j.x) + ')</span></span>' + labels + '</div><div class="legs">' + legs +
          '<p class="small muted">' + tr('Fare ', '運賃 ') + yen(j.fare.ticket) + tr(' (HaruCa ', '（ハルカ ') + yen(j.fare.ic) + tr(')', '）') + (j.x ? tr(' + Tsukikage surcharge ', ' ＋ 特急料金 ') + yen(j.x) : '') + ' · ' + j.fare.km.toFixed(1) + ' km</p></div></div>';
      }).join('');
    });
  }

  // ---------- fare calculator ----------
  function renderCalc() {
    var form = $('#fare-calc'); if (!form) return;
    ['from', 'to', 'ad', 'ch', 'cls'].forEach(function (k) { if (params.get(k)) form.elements[k].value = params.get(k); });
    var go = function () {
      load().then(function () {
        var a = form.elements.from.value, b = form.elements.to.value, ad = Math.max(0, Number(form.elements.ad.value) || 0), ch = Math.max(0, Number(form.elements.ch.value) || 0), cls = form.elements.cls.value, peak = form.elements.peak.checked;
        var out = $('#calc-out');
        if (a === b) { out.innerHTML = '<p class="planner-out"><span class="msg">' + tr('Choose two different stations.', '異なる駅を選んでください。') + '</span></p>'; return; }
        var f = fare(a, b), rows = [], x = 0, xc = 0;
        if (cls) {
          if (NET.xStops.indexOf(a) < 0 || NET.xStops.indexOf(b) < 0) { out.innerHTML = '<p class="planner-out"><span class="msg">' + tr('Tsukikage does not stop at one of these stations. Tsukikage stops: ', '「月影」はどちらかの駅に停車しません。停車駅：') + NET.xStops.map(nm).join(J ? '・' : ', ') + '</span></p>'; return; }
          var base = xFee(f.km) + (peak ? NET.fee.peak : 0); x = base + (cls === 'pre' ? NET.fee.premium : 0); xc = Math.floor((xFee(f.km)) / 20) * 10 + (peak ? NET.fee.peak / 2 : 0) + (cls === 'pre' ? NET.fee.premium : 0);
        }
        rows.push([tr('Distance', '営業キロ'), f.km.toFixed(1) + ' km (' + tr('charged as ', '') + kmc(f.km) + ' km' + tr('', 'で計算') + ')', '']);
        rows.push([tr('Adult fare', '大人運賃'), yen(f.ticket) + tr(' ticket', '（きっぷ）'), yen(f.ic) + ' HaruCa']);
        rows.push([tr('Child fare', '小児運賃'), yen(f.childTicket) + tr(' ticket', '（きっぷ）'), yen(f.childIc) + ' HaruCa']);
        if (cls) rows.push([tr('Tsukikage surcharge', '「月影」特急料金'), tr('Adult ', '大人 ') + yen(x), tr('Child ', '小児 ') + yen(xc)]);
        var total = ad * (f.ticket + x) + ch * (f.childTicket + xc), totalIc = ad * (f.ic + x) + ch * (f.childIc + xc);
        rows.push(['<b>' + tr('Total', '合計') + '</b> (' + tr('adults ', '大人') + ad + tr(', children ', '名・小児') + ch + tr('', '名') + ')', '<b>' + yen(total) + '</b>' + tr(' tickets', '（きっぷ）'), '<b>' + yen(totalIc) + '</b> HaruCa']);
        var bandTicket = f.ticket; var c1 = Math.round(bandTicket * 28.5 / 10) * 10;
        rows.push([tr('Commuter pass, 1 month', '通勤定期券 1か月'), yen(c1), tr('Student ', '通学 ') + yen(Math.round(c1 * 0.55 / 10) * 10)]);
        out.innerHTML = '<h2 class="h2">' + esc(nm(a)) + ' → ' + esc(nm(b)) + '</h2><table class="data">' + rows.map(function (r) { return '<tr><th>' + r[0] + '</th><td class="num">' + r[1] + '</td><td class="num">' + r[2] + '</td></tr>'; }).join('') + '</table><p class="small"><a href="/' + lang + '/planner.html?from=' + a + '&to=' + b + '&date=2026-10-04&h=14&m=20&mode=dep&x=1">' + tr('Plan this journey', 'この区間の乗換案内') + '</a></p>';
      });
    };
    form.addEventListener('submit', function (e) { e.preventDefault(); go(); });
    if (params.get('from')) go();
  }

  // ---------- Tsukikage reservation ----------
  var OCC = { 1: 38, 3: 52, 5: 71, 7: 64, 9: 58, 13: 47, 17: 44, 21: 40, 25: 29, 2: 61, 6: 35, 8: 49, 10: 55, 12: 63, 14: 66, 16: 70, 18: 74, 20: 68, 22: 59, 24: 52, 26: 41, 28: 45, 30: 22 };
  var CARS = { 1: { rows: 8, letters: ['A', 'C', 'D'], cls: 'pre' }, 2: { rows: 10, letters: ['A', 'B', 'C', 'D'], cls: 'std', ws: ['1A', '1B'] }, 3: { rows: 14, letters: ['A', 'B', 'C', 'D'], cls: 'std' } };
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function occRate(t, iso, carNo) { var r = (OCC[t.no] || 50) / 100 + (t.day === 'we' ? 0.12 : -0.08) + (NET.peak.indexOf(iso) >= 0 ? 0.3 : 0); if (carNo === 1) r *= 0.8; return Math.max(0.05, Math.min(0.97, r)); }
  function taken(t, iso, carNo, seat) { return hash(t.id + '|' + iso + '|' + carNo + '-' + seat) < occRate(t, iso, carNo); }
  function seatsLeft(t, iso, cls) { var n = 0; Object.keys(CARS).forEach(function (c) { var C = CARS[c]; if (C.cls !== cls) return; for (var r = 1; r <= C.rows; r++) C.letters.forEach(function (l) { var s = r + l; if (!(C.ws && C.ws.indexOf(s) >= 0) && !taken(t, iso, Number(c), s)) n++; }); }); return n; }
  function xTrains(iso, from, to) {
    var day = dayType(iso), dir = NET.xStops.indexOf(from) < NET.xStops.indexOf(to) ? 'd' : 'u';
    return TRAINS.filter(function (t) { return t.type === 'X' && t.day === day && t.dir === dir; }).map(function (t) {
      var a = t.s.find(function (s) { return s[0] === from; }), b = t.s.find(function (s) { return s[0] === to; });
      return a && b ? { t: t, dep: a[1], arr: b[1] } : null;
    }).filter(Boolean).sort(function (x, y) { return x.dep - y.dep; });
  }
  function price(q) {
    var f = fare(q.from, q.to), peak = NET.peak.indexOf(q.date) >= 0, base = xFee(f.km);
    var ad = f.ticket + base + (peak ? NET.fee.peak : 0) + (q.cls === 'pre' ? NET.fee.premium : 0);
    var ch = f.childTicket + Math.floor(base / 20) * 10 + (peak ? NET.fee.peak / 2 : 0) + (q.cls === 'pre' ? NET.fee.premium : 0);
    return { ad: ad, ch: ch, total: ad * q.ad + ch * q.ch, fare: f, peak: peak };
  }
  var Q = { train: params.get('train'), date: params.get('date'), from: params.get('from'), to: params.get('to'), ad: Number(params.get('ad') || 1), ch: Number(params.get('ch') || 0), cls: params.get('cls') === 'pre' ? 'pre' : 'std', seats: (params.get('seats') || '').split(',').filter(Boolean) };
  var qs = function (extra) { var p = new URLSearchParams(); ['train', 'date', 'from', 'to', 'ad', 'ch', 'cls'].forEach(function (k) { if (Q[k] !== null && Q[k] !== undefined) p.set(k, Q[k]); }); if (Q.seats.length) p.set('seats', Q.seats.join(',')); Object.keys(extra || {}).forEach(function (k) { p.set(k, extra[k]); }); return p.toString(); };
  function summary(t) {
    var dep = t.s.find(function (s) { return s[0] === Q.from; }), arr = t.s.find(function (s) { return s[0] === Q.to; }); var p = price(Q);
    return '<table class="data kv"><tr><th>' + tr('Train', '列車') + '</th><td>' + esc(trainName(t)) + '</td></tr><tr><th>' + tr('Date', '乗車日') + '</th><td>' + fmtDate(Q.date) + '</td></tr><tr><th>' + tr('Journey', '区間') + '</th><td>' + esc(nm(Q.from)) + ' ' + hm(dep[1]) + ' → ' + esc(nm(Q.to)) + ' ' + hm(arr[1]) + '</td></tr><tr><th>' + tr('Passengers', '人数') + '</th><td>' + tr('Adults ', '大人') + Q.ad + tr(', children ', '名、小児') + Q.ch + tr('', '名') + ' · ' + (Q.cls === 'pre' ? tr('Premium', 'プレミアム席') : tr('Standard', '普通車指定席')) + '</td></tr>' + (Q.seats.length ? '<tr><th>' + tr('Seats', '座席') + '</th><td>' + Q.seats.map(function (s) { var p2 = s.split('-'); return tr('Car ', '') + p2[0] + tr(' seat ', '号車 ') + p2[1]; }).join(', ') + '</td></tr>' : '') + '<tr><th>' + tr('Price', '料金') + '</th><td>' + tr('Adult ', '大人 ') + yen(p.ad) + ' × ' + Q.ad + (Q.ch ? ' + ' + tr('child ', '小児 ') + yen(p.ch) + ' × ' + Q.ch : '') + ' = <b>' + yen(p.total) + '</b>' + (p.peak ? ' <span class="warn small">' + tr('(peak date)', '（繁忙期）') + '</span>' : '') + '<br><span class="small muted">' + tr('Fare plus limited express surcharge, paper tickets. Pay when you collect.', '乗車券＋特急券（きっぷ）。お受け取りの際にお支払いください。') + '</span></td></tr></table>';
  }
  function renderResSearch() {
    var out = $('#res-results'), form = $('#res-search'); if (!out) return;
    ['date', 'from', 'to', 'ad', 'ch', 'cls'].forEach(function (k) { if (params.get(k)) form.elements[k].value = params.get(k); });
    if (!params.get('from')) return;
    load().then(function () {
      if (Q.from === Q.to) { out.innerHTML = '<p class="planner-out"><span class="msg">' + tr('Choose two different stations.', '異なる駅を選んでください。') + '</span></p>'; return; }
      if (Q.date < NET.range.min || Q.date > NET.range.max) { out.innerHTML = '<p class="planner-out"><span class="msg">' + tr('Reservations on this site are available for travel up to 13 November 2026.', 'このサイトでは2026年11月13日までのご乗車分を予約できます。') + '</span></p>'; return; }
      var list = xTrains(Q.date, Q.from, Q.to), p = price(Q);
      out.innerHTML = '<h2 class="h2">' + esc(nm(Q.from)) + ' → ' + esc(nm(Q.to)) + ' · ' + fmtDate(Q.date) + '</h2><div class="scroll"><table class="data res-table"><thead><tr><th>' + tr('Train', '列車') + '</th><th>' + tr('Departs', '発') + '</th><th>' + tr('Arrives', '着') + '</th><th>' + tr('Time', '所要') + '</th><th>' + tr('Standard seats', '普通車') + '</th><th>' + tr('Premium seats', 'プレミアム') + '</th><th>' + tr('Price (adult)', '大人1名') + '</th><th></th></tr></thead><tbody>' +
        list.map(function (x) {
          var s = seatsLeft(x.t, Q.date, 'std'), pr = seatsLeft(x.t, Q.date, 'pre'); var left = Q.cls === 'pre' ? pr : s;
          var mark = function (n) { return n === 0 ? '<span class="warn">×</span>' : n < 10 ? '△ ' + n : '○'; };
          var href = '/' + lang + '/reserve/seat.html?' + new URLSearchParams({ train: x.t.id, date: Q.date, from: Q.from, to: Q.to, ad: Q.ad, ch: Q.ch, cls: Q.cls }).toString();
          return '<tr><td><b>' + esc(trainName(x.t)) + '</b></td><td class="num">' + hm(x.dep) + '</td><td class="num">' + hm(x.arr) + '</td><td class="num">' + (x.arr - x.dep) + tr(' min', '分') + '</td><td>' + mark(s) + '</td><td>' + mark(pr) + '</td><td class="num">' + yen(p.ad) + '</td><td>' + (left >= Q.ad + Q.ch ? '<a class="btn-sm" href="' + href + '">' + tr('Select', '選択') + '</a>' : '<span class="muted small">' + tr('Full', '満席') + '</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div><p class="small muted">○ ' + tr('seats available', '空席あり') + ' · △ ' + tr('few seats left', '残りわずか') + ' · × ' + tr('full', '満席') + '</p>';
    });
  }
  function seatSvg(t, carNo, chosen) {
    var C = CARS[carNo], w = 60 + C.rows * 46, lettersTopDown = C.letters.slice().reverse(), y = {}, yy = 40;
    lettersTopDown.forEach(function (l, i) { y[l] = yy; yy += 34; if ((C.letters.length === 4 && l === 'C') || (C.letters.length === 3 && l === 'C')) yy += 26; });
    var h = yy + 30, g = '';
    g += '<rect x="20" y="22" width="' + (w - 30) + '" height="' + (h - 40) + '" rx="18" fill="#f3f1fa" stroke="#9b90c8"/><text x="30" y="16" font-size="11" fill="#555">' + tr('Car ', '') + carNo + tr('', '号車') + ' · ' + (C.cls === 'pre' ? tr('Premium', 'プレミアム席') : tr('Standard', '普通車指定席')) + '</text><text x="' + (w - 10) + '" y="16" font-size="11" text-anchor="end" fill="#555">' + tr('Direction of travel', '進行方向') + ' →</text>';
    for (var r = 1; r <= C.rows; r++) {
      var x = 30 + (r - 1) * 46;
      g += '<text x="' + (x + 18) + '" y="' + (h - 8) + '" font-size="10" text-anchor="middle" fill="#888">' + r + '</text>';
      C.letters.forEach(function (l) {
        var s = r + l, id = carNo + '-' + s;
        if (C.ws && C.ws.indexOf(s) >= 0) { if (l === 'A') g += '<g><rect x="' + x + '" y="' + y.B + '" width="36" height="62" rx="4" fill="#e6eef8" stroke="#7d9cc4"/><text x="' + (x + 18) + '" y="' + (y.B + 35) + '" font-size="9" text-anchor="middle" fill="#456">' + tr('WS', '車いす') + '</text></g>'; return; }
        var tk = taken(t, Q.date, carNo, s), sel = chosen.indexOf(id) >= 0;
        g += '<g class="seat' + (tk ? ' taken' : '') + (sel ? ' sel' : '') + '" data-seat="' + id + '"' + (tk ? '' : ' tabindex="0"') + '><rect x="' + x + '" y="' + y[l] + '" width="36" height="28" rx="4"/><text x="' + (x + 18) + '" y="' + (y[l] + 18) + '" text-anchor="middle">' + (tk ? '×' : s) + '</text></g>';
      });
    }
    var win = function (l) { return J ? (l === 'D' ? '窓側（D席）' : '窓側（A席）') : 'Window (' + l + ')'; };
    g += '<text x="' + (w - 2) + '" y="' + (y.D + 18) + '" font-size="10" fill="#777">' + win('D') + '</text><text x="' + (w - 2) + '" y="' + (y.A + 18) + '" font-size="10" fill="#777">' + win('A') + '</text>';
    return '<svg viewBox="0 0 ' + (w + 90) + ' ' + h + '" role="img" aria-label="seat map">' + g + '</svg>';
  }
  function renderSeat() {
    var app = $('#seat-app'); if (!app) return;
    load().then(function () {
      var t = TRAINS.find(function (x) { return x.id === Q.train; });
      if (!t || !Q.date || !Q.from || !Q.to) { app.innerHTML = '<p class="planner-out"><span class="msg">' + tr('Please start from the train search.', '列車の検索からやり直してください。') + ' <a href="/' + lang + '/reserve/index.html">' + tr('Search trains', '列車を検索') + '</a></span></p>'; return; }
      var need = Q.ad + Q.ch, cars = Object.keys(CARS).map(Number).filter(function (c) { return CARS[c].cls === Q.cls; }), carNo = cars[0], chosen = Q.seats.slice();
      var draw = function () {
        app.innerHTML = summary(t) + '<div class="tabs"><div class="tab-bar">' + cars.map(function (c) { return '<button type="button" data-car="' + c + '" class="' + (c === carNo ? 'on' : '') + '">' + tr('Car ', '') + c + tr('', '号車') + '</button>'; }).join('') + '</div></div>' +
          '<div class="seat-legend"><span><i></i>' + tr('Available', '空席') + '</span><span><i class="tk"></i>' + tr('Taken', '予約済') + '</span><span><i class="sl"></i>' + tr('Your choice', '選択中') + '</span></div><div class="seat-scroll">' + seatSvg(t, carNo, chosen) + '</div>' +
          '<p>' + tr('Choose ', '座席を') + need + tr(need > 1 ? ' seats.' : ' seat.', '席お選びください。') + ' ' + tr('Selected: ', '選択中：') + '<b>' + (chosen.length ? chosen.map(function (s) { var p = s.split('-'); return tr('Car ', '') + p[0] + tr(' ', '号車') + p[1]; }).join(', ') : '—') + '</b></p>' +
          (t.dir === 'd' ? '<p class="small muted">' + tr('Between Kamano and Kagami-kyō the river is on the D side.', '釜野〜鏡峡間はD席側に鏡川が見えます。') + '</p>' : '<p class="small muted">' + tr('Between Kagami-kyō and Kamano the river is on the A side.', '鏡峡〜釜野間はA席側に鏡川が見えます。') + '</p>') +
          '<p><a href="/' + lang + '/reserve/index.html?' + new URLSearchParams({ date: Q.date, from: Q.from, to: Q.to, ad: Q.ad, ch: Q.ch, cls: Q.cls }).toString() + '">‹ ' + tr('Back to trains', '列車の選択に戻る') + '</a> <button type="button" class="btn-primary next"' + (chosen.length === need ? '' : ' disabled') + '>' + tr('Next', '次へ') + '</button></p>';
        $$('.tab-bar button', app).forEach(function (b) { b.addEventListener('click', function () { carNo = Number(b.getAttribute('data-car')); draw(); }); });
        $$('.seat', app).forEach(function (g) {
          var toggle = function () { if (g.classList.contains('taken')) return; var id = g.getAttribute('data-seat'); var i = chosen.indexOf(id); if (i >= 0) chosen.splice(i, 1); else { if (chosen.length >= need) chosen.shift(); chosen.push(id); } draw(); };
          g.addEventListener('click', toggle); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
        });
        $('.next', app).addEventListener('click', function () { Q.seats = chosen; location.href = '/' + lang + '/reserve/details.html?' + qs(); });
      };
      draw();
    });
  }
  function renderDetails() {
    var box = $('#res-summary'); if (!box) return;
    load().then(function () {
      var t = TRAINS.find(function (x) { return x.id === Q.train; });
      if (!t || !Q.seats.length) { box.innerHTML = '<p>' + tr('Please choose your train and seats first.', '先に列車と座席を選んでください。') + ' <a href="/' + lang + '/reserve/index.html">' + tr('Search trains', '列車を検索') + '</a></p>'; $('#details-form').hidden = true; return; }
      box.innerHTML = summary(t) + '<p class="small"><a href="/' + lang + '/reserve/seat.html?' + qs() + '">' + tr('Change seats', '座席を変更') + '</a></p>';
      var hid = $('.hidden-fields'); new URLSearchParams(qs()).forEach(function (v, k) { var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; hid.appendChild(i); });
    });
  }
  function renderDone() {
    var box = $('#res-done'); if (!box) return;
    load().then(function () {
      var t = TRAINS.find(function (x) { return x.id === Q.train; });
      if (!t) { box.innerHTML = '<p><a href="/' + lang + '/reserve/index.html">' + tr('Search trains', '列車を検索') + '</a></p>'; return; }
      var no = 'HT' + String(Math.floor(hash(qs() + (params.get('tel') || '')) * 1e8)).padStart(8, '0');
      var dep = t.s.find(function (s) { return s[0] === Q.from; })[1];
      box.innerHTML = '<p style="font-size:15px">' + tr('Reservation number', '予約番号') + ': <b style="font-size:20px;letter-spacing:.05em">' + no + '</b></p>' + summary(t) +
        '<p>' + tr('Name: ', 'お名前：') + esc(params.get('name') || '') + ' · ' + tr('Phone: ', '電話：') + esc(params.get('tel') || '') + (params.get('haruca') ? ' · HaruCa ' + esc(params.get('haruca')) : '') + '</p>' +
        '<p class="warn">' + tr('Collect your tickets by ', 'きっぷは ') + hm(dep - 5) + tr(' on ' + fmtDate(Q.date) + ' (5 minutes before departure).', '（' + fmtDate(Q.date) + '、発車5分前）までにお受け取りください。') + '</p><p class="small muted">' + tr('This is a demonstration; no payment has been taken and no seat is held.', 'これはデモです。お支払いは発生せず、座席も確保されません。') + '</p>';
    });
  }

  // ---------- site search ----------
  function renderSearch() {
    var out = $('#search-out'); if (!out) return;
    var q = (params.get('q') || '').trim(); $('.big-search').value = q;
    if (!q) return;
    fetch('/assets/data/search-' + lang + '.json').then(function (r) { return r.json(); }).then(function (idx) {
      var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      var res = idx.map(function (p) {
        var t = p.t.toLowerCase(), x = p.x.toLowerCase(), score = 0;
        for (var i = 0; i < terms.length; i++) { var inT = t.indexOf(terms[i]) >= 0, inX = x.indexOf(terms[i]) >= 0; if (!inT && !inX) return null; score += (inT ? 10 : 0) + (x.split(terms[i]).length - 1); }
        return { p: p, score: score };
      }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 50);
      out.innerHTML = '<p>' + tr(res.length + ' results for ', '「' + esc(q) + '」の検索結果：' + res.length + '件') + (J ? '' : '"' + esc(q) + '"') + '</p>' + res.map(function (r) {
        var x = r.p.x, i = x.toLowerCase().indexOf(terms[0]); var snip = x.slice(Math.max(0, i - 60), i + 140);
        snip = esc(snip); terms.forEach(function (term) { snip = snip.replace(new RegExp(esc(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), function (m) { return '<mark>' + m + '</mark>'; }); });
        return '<div class="box"><a href="' + r.p.u + '"><b>' + esc(r.p.t) + '</b></a><br><span class="small muted">' + r.p.u + '</span><p class="small">…' + snip + '…</p></div>';
      }).join('');
    });
  }

  renderPlanner(); renderCalc(); renderResSearch(); renderSeat(); renderDetails(); renderDone(); renderSearch();
})();
