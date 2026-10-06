// Builds the Marketa study site (en/ and ja/) from content/. Node standard library only.
// Run: node build.mjs   (from anywhere; paths are relative to this file)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
const SRC = '/home/yotam/projects/unilens/.local/study-sites-src/shop';

// ---------- content ----------
const site = await imp('content/site.mjs');
const clusters = {};
const loaded = [];
for (const f of fs.readdirSync(path.join(ROOT, 'content/products')).filter((f) => f.endsWith('.mjs'))) {
  const m = await imp('content/products/' + f);
  clusters[m.cluster.id] = m.cluster;
  loaded.push(...m.default);
}
const clusterOrder = site.cats.flatMap((c) => c.clusters);
const products = loaded.sort((a, b) => clusterOrder.indexOf(a.cluster) - clusterOrder.indexOf(b.cluster));
const P = Object.fromEntries(products.map((p) => [p.id, p]));
const sellers = (await imp('content/sellers.mjs')).default;
const SELLER = Object.fromEntries(sellers.map((s) => [s.id, s]));
const help = (await imp('content/help.mjs')).default;
const CAT = Object.fromEntries(site.cats.map((c) => [c.id, c]));

// ---------- helpers ----------
const LANGS = ['en', 'ja'];
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (n) => Number(n).toLocaleString('en-US');
const yen = (lang, n) => (lang === 'ja' ? '￥' : '¥') + num(n);
const tx = (lang, o) => (o && typeof o === 'object' ? o[lang] ?? o.en : o);
const L = (lang, en, ja) => (lang === 'ja' ? ja : en);
const u = (lang, p) => `/${lang}/${p}`;
const img = (stem) => `/assets/img/${stem}.jpg`;
const avg = (p) => Math.round(p.hist.reduce((s, h, i) => s + h * (5 - i), 0) / 10) / 10;
const pct = (v) => (v.list && v.list > v.price ? Math.round((1 - v.price / v.list) * 100) : 0);
const defVar = (p) => p.variants.find((v) => v.stock > 0 && v.ship !== 'oos') || p.variants[0];
const minPriceVar = (p) => p.variants.filter((v) => v.ship !== 'oos').sort((a, b) => a.price - b.price)[0] || p.variants[0];
const sellerName = (lang, id) => (id === 'marketa' ? L(lang, 'Marketa', 'マルケタ') : tx(lang, SELLER[id].name));
const isLocal = (p) => p.seller === 'kagami' || p.seller === 'minori';
const fmtDate = (lang, iso) => {
  const d = new Date(iso + 'T12:00:00');
  const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return lang === 'ja' ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日` : `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
};
const bought = (p) => {
  const n = Math.round(p.ratings / 4);
  return n >= 1000 ? `${Math.floor(n / 1000)}K+` : `${Math.max(50, Math.floor(n / 50) * 50)}+`;
};
const stars = (lang, r, cls = '') =>
  `<span class="stars ${cls}" style="--r:${r}" role="img" aria-label="${L(lang, `${r} out of 5 stars`, `5つ星のうち${r}`)}"><i></i></span>`;

// Today is Monday 5 October 2026, 10:40. Next-day cut-off 14:00 -> "3 hrs 20 mins".
const D = {
  mon5: ['Monday, 5 October', 'Mon 5 Oct', '10月5日(月)'], tue6: ['Tuesday, 6 October', 'Tue 6 Oct', '10月6日(火)'],
  wed7: ['Wednesday, 7 October', 'Wed 7 Oct', '10月7日(水)'], thu8: ['Thursday, 8 October', 'Thu 8 Oct', '10月8日(木)'],
  fri9: ['Friday, 9 October', 'Fri 9 Oct', '10月9日(金)'], sat10: ['Saturday, 10 October', 'Sat 10 Oct', '10月10日(土)'],
  tue13: ['Tuesday, 13 October', 'Tue 13 Oct', '10月13日(火)'], nov2: ['Monday, 2 November', 'Mon 2 Nov', '11月2日(月)'],
  nov9: ['Monday, 9 November', 'Mon 9 Nov', '11月9日(月)'],
};
const dt = (lang, k, short) => D[k][lang === 'ja' ? 2 : short ? 1 : 0];
// speed: 1 = tomorrow with Fast, 2 = by Thu 8 Oct, 3 = later, 9 = unavailable
const SHIP = {
  fast: { speed: 1, marketa: true, fastDay: 'tue6', std: 'thu8' },
  fast2: { speed: 2, marketa: true, fastDay: 'thu8', std: 'sat10' },
  kagami: { speed: 2, from: 'kagami', range: ['thu8', 'fri9'], fee: 700, free: 5000 },
  'kagami-mto': { speed: 3, from: 'kagami', range: ['nov2', 'nov9'], fee: 700, free: 5000, mto: true },
  minori: { speed: 2, from: 'minori', range: ['wed7', 'thu8'], fee: 600, free: 4000 },
  brightdeal: { speed: 3, from: 'brightdeal', range: ['fri9', 'tue13'], fee: 0 },
  oos: { speed: 9 },
};

function deliveryHtml(lang, p, v) {
  const s = SHIP[v.ship];
  const fast = `<span class="fastbadge">Marketa Fast</span>`;
  if (v.ship === 'oos')
    return `<p class="oos">${L(lang, 'Currently unavailable.', '現在お取り扱いできません。')}</p><p class="muted">${L(lang, 'We don’t know when or if this item will be back in stock.', 'この商品の再入荷予定は立っておりません。')}</p>`;
  if (s.marketa)
    return lang === 'ja'
      ? `<p><b>${dt(lang, s.std)}</b>にお届け（マルケタが発送する商品の合計3,500円以上で配送料無料）<a class="sm" href="${u(lang, 'help/shipping.html')}">詳細</a></p>
<p>${fast}会員なら最短 <b>${s.fastDay === 'tue6' ? '明日 ' : ''}${dt(lang, s.fastDay)}</b>に無料でお届け${s.fastDay === 'tue6' ? `。<span class="cd">あと3時間20分</span>以内にご注文ください（14時締め）` : ''}</p>`
      : `<p>FREE delivery <b>${dt(lang, s.std)}</b> on orders over ¥3,500 shipped by Marketa. <a class="sm" href="${u(lang, 'help/shipping.html')}">Details</a></p>
<p>Or fastest delivery <b>${s.fastDay === 'tue6' ? 'Tomorrow, 6 October' : dt(lang, s.fastDay)}</b> with ${fast}.${s.fastDay === 'tue6' ? ` Order within <span class="cd">3 hrs 20 mins</span>.` : ''}</p>`;
  const from = sellerName(lang, s.from);
  if (s.mto)
    return lang === 'ja'
      ? `<p><b>受注制作品</b>：通常3〜4週間で発送。お届け予定 <b>${dt(lang, 'nov2')}〜${dt(lang, 'nov9')}</b></p><p class="muted">${esc(from)}からの配送料 ￥700（同ストアで5,000円以上のご注文で無料）</p>`
      : `<p><b>Made to order:</b> usually dispatched in 3–4 weeks. Estimated delivery <b>${dt(lang, 'nov2')} – ${dt(lang, 'nov9')}</b>.</p><p class="muted">¥700 delivery from ${esc(from)} (free on orders of ¥5,000 or more from this seller).</p>`;
  const range = lang === 'ja' ? `${dt(lang, s.range[0])}〜${dt(lang, s.range[1])}` : `${dt(lang, s.range[0])} – ${dt(lang, s.range[1])}`;
  if (!s.fee) return lang === 'ja' ? `<p><b>配送料無料</b> お届け予定 <b>${range}</b></p><p class="muted">${esc(from)}（神戸）から発送。マルケタFastの対象外です。</p>` : `<p><b>FREE delivery ${range}</b>.</p><p class="muted">Ships from ${esc(from)} in Kobe. Not eligible for Marketa Fast.</p>`;
  return lang === 'ja'
    ? `<p>お届け予定 <b>${range}</b></p><p class="muted">${esc(from)}からの配送料 ￥${num(s.fee)}（同ストアで${num(s.free)}円以上のご注文で無料）。マルケタFastの対象外です。</p>`
    : `<p>Delivery <b>${range}</b>.</p><p class="muted">¥${num(s.fee)} delivery from ${esc(from)} (free on orders of ¥${num(s.free)} or more from this seller). Not eligible for Marketa Fast.</p>`;
}
function deliveryShort(lang, v) {
  const s = SHIP[v.ship];
  if (v.ship === 'oos') return `<span class="oos">${L(lang, 'Currently unavailable', '在庫切れ')}</span>`;
  if (s.marketa)
    return lang === 'ja'
      ? `<span><b>${dt(lang, s.std)}</b>にお届け</span><span><span class="fastbadge sm">Fast</span> 最短 <b>${s.fastDay === 'tue6' ? '明日 ' : ''}${dt(lang, s.fastDay)}</b></span>`
      : `<span>FREE delivery <b>${dt(lang, s.std, 1)}</b></span><span><span class="fastbadge sm">Fast</span> fastest <b>${s.fastDay === 'tue6' ? 'Tomorrow, 6 Oct' : dt(lang, s.fastDay, 1)}</b></span>`;
  const range = lang === 'ja' ? `${dt(lang, s.range[0])}〜${dt(lang, s.range[1])}` : `${dt(lang, s.range[0], 1)} – ${dt(lang, s.range[1], 1)}`;
  return s.mto ? `<span>${L(lang, 'Made to order', '受注制作')} · <b>${range}</b></span>` : `<span>${L(lang, 'Delivery', 'お届け')} <b>${range}</b>${s.fee ? '' : L(lang, ' · FREE', '・送料無料')}</span>`;
}
function stockHtml(lang, v) {
  if (v.ship === 'oos' || !v.stock) return `<p class="stock oos">${L(lang, 'Currently unavailable.', '在庫切れ')}</p>`;
  if (v.ship === 'kagami-mto') return `<p class="stock ok">${L(lang, 'Made to order', '受注制作')}</p>`;
  if (v.stock <= 10) return `<p class="stock low">${L(lang, `Only ${v.stock} left in stock – order soon.`, `残り${v.stock}点 ご注文はお早めに`)}</p>`;
  return `<p class="stock ok">${L(lang, 'In stock', '在庫あり')}</p>`;
}
function shipsSold(lang, p, v) {
  const s = SHIP[v.ship] || {};
  const sl = p.seller === 'marketa' ? sellerName(lang, 'marketa') : `<a href="${u(lang, `seller/${p.seller}.html`)}">${esc(sellerName(lang, p.seller))}</a>`;
  const from = s.marketa || p.seller === 'marketa' ? sellerName(lang, 'marketa') : sellerName(lang, p.seller);
  return `<table class="kv"><tr><th>${L(lang, 'Ships from', '出荷元')}</th><td>${esc(from)}</td></tr><tr><th>${L(lang, 'Sold by', '販売元')}</th><td>${sl}</td></tr>
<tr><th>${L(lang, 'Returns', '返品')}</th><td>${esc(tx(lang, p.returns))} <a class="sm" href="${u(lang, 'help/returns.html')}">${L(lang, 'Details', '詳細')}</a></td></tr>
<tr><th>${L(lang, 'Payment', '支払い')}</th><td>${L(lang, 'Secure transaction', '安全な取引')}</td></tr></table>`;
}
function priceBlock(lang, p, v, big) {
  const d = pct(v);
  const pts = Math.floor(v.price * 0.01);
  return `<div class="pb">${d ? `<span class="pb-pct">-${d}%</span>` : ''}<span class="pb-price${big ? ' big' : ''}">${yen(lang, v.price)}</span>${lang === 'ja' ? '<span class="tax">税込</span>' : ''}</div>
${v.list && v.list > v.price ? `<div class="pb-list muted">${L(lang, 'List price:', '参考価格：')} <s>${yen(lang, v.list)}</s></div>` : ''}
<div class="pb-pts">${L(lang, `Earn <b>${pts}</b> Marketa Points (1%)`, `<b>${pts}</b>ポイント（1%）獲得`)}</div>`;
}

// ---------- page shell ----------
const catNav = (lang) => site.cats.map((c) => `<a href="${u(lang, `c/${c.id}.html`)}">${esc(c[lang])}</a>`).join('');
function header(lang, pth) {
  const other = lang === 'en' ? 'ja' : 'en';
  return `<div class="topbar"><span>${L(lang, '<b>Harukawa Lantern Festival Sale</b> · up to 40% off until Sun 11 Oct 23:59', '<b>春川灯籠まつりセール</b>開催中・最大40%OFF 10月11日(日)23:59まで')}</span> <a href="${u(lang, 'deals.html')}">${L(lang, 'See deals', 'セール会場へ')} ›</a> <span class="sep">|</span> <a href="${u(lang, 'help/fast.html')}">${L(lang, 'Try Marketa Fast free for 30 days', 'マルケタFast 30日間無料体験')}</a></div>
<header class="hdr" id="top">
<div class="hdr-top">
<a class="logo" href="${u(lang, 'index.html')}" aria-label="Marketa"><svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#ff7a45"/><path d="M8 12h16l-1.6 11.2a2 2 0 0 1-2 1.8h-8.8a2 2 0 0 1-2-1.8z" fill="#fff"/><path d="M12 12a4 4 0 0 1 8 0" stroke="#fff" stroke-width="2.2" fill="none"/></svg><span class="logo-w">marketa</span>${lang === 'ja' ? '<span class="logo-ja">マルケタ</span>' : ''}</a>
<a class="deliver" href="${u(lang, 'help/shipping.html')}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg><span><small>${L(lang, 'Deliver to Aki', 'お届け先：アキさん')}</small><b>${L(lang, 'Harukawa 795-0021', '春川市 795-0021')}</b></span></a>
<form class="search" action="${u(lang, 'search.html')}" role="search">
<select name="cat" aria-label="${L(lang, 'Search in', 'カテゴリー')}"><option value="">${L(lang, 'All', 'すべて')}</option>${site.cats.map((c) => `<option value="${c.id}">${esc(c[lang])}</option>`).join('')}</select>
<input name="q" type="search" placeholder="${L(lang, 'Search Marketa', 'マルケタで検索')}" aria-label="${L(lang, 'Search', '検索')}" autocomplete="off">
<button aria-label="${L(lang, 'Go', '検索')}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M10 3a7 7 0 1 0 4.2 12.6l5.1 5.1 1.4-1.4-5.1-5.1A7 7 0 0 0 10 3zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"/></svg></button>
</form>
<a class="lang" href="/${other}/${pth}" hreflang="${other}" data-lang-switch>${lang === 'en' ? '<b>EN</b> <span>日本語</span>' : '<b>JP</b> <span>English</span>'}</a>
<div class="menu acct"><a class="hdr-2l" href="${u(lang, 'orders.html')}"><small>${L(lang, 'Hello, Aki', 'こんにちは、アキさん')}</small><b>${L(lang, 'Account & Lists', 'アカウント&リスト')} ▾</b></a>
<div class="drop"><b>${L(lang, 'Your Account', 'アカウントサービス')}</b><a href="${u(lang, 'orders.html')}">${L(lang, 'Your orders', '注文履歴')}</a><a href="${u(lang, 'track.html')}">${L(lang, 'Track a package', '配送状況の確認')}</a><a href="${u(lang, 'help/fast.html')}">${L(lang, 'Marketa Fast membership', 'マルケタFast会員')}</a><a href="${u(lang, 'help/payment.html')}">${L(lang, 'Payment methods & points', 'お支払い方法・ポイント')}</a><a href="${u(lang, 'help/returns.html')}">${L(lang, 'Returns & refunds', '返品・返金')}</a><a href="${u(lang, 'help/index.html')}">${L(lang, 'Customer Service', 'カスタマーサービス')}</a></div></div>
<a class="hdr-2l ret" href="${u(lang, 'orders.html')}"><small>${L(lang, 'Returns', '返品')}</small><b>${L(lang, '& Orders', 'もしくは注文履歴')}</b></a>
<a class="cart" href="${u(lang, 'cart.html')}" aria-label="${L(lang, 'Basket', 'カート')}"><svg viewBox="0 0 32 28" width="34" height="28" aria-hidden="true"><path d="M1 3h5l4 15h16l3-11H8" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="23.5" r="2.3" fill="currentColor"/><circle cx="24" cy="23.5" r="2.3" fill="currentColor"/></svg><span class="cart-n" data-cart-count>0</span><b>${L(lang, 'Basket', 'カート')}</b></a>
</div>
<nav class="hdr-nav" aria-label="${L(lang, 'Departments', 'カテゴリー')}">
<div class="menu all"><a href="${u(lang, 'search.html')}">☰ ${L(lang, 'All', 'すべて')}</a><div class="drop">${catNav(lang)}<hr><a href="${u(lang, 'deals.html')}">${L(lang, 'Today’s Deals', 'タイムセール')}</a><a href="${u(lang, 'search.html?local=1')}">${L(lang, 'Harukawa Local sellers', '春川ローカル出品者')}</a></div></div>
<a href="${u(lang, 'deals.html')}">${L(lang, 'Today’s Deals', 'タイムセール')}</a>
<a href="${u(lang, 'help/fast.html')}">Marketa Fast</a>
${catNav(lang)}
<a href="${u(lang, 'search.html?local=1')}">${L(lang, 'Harukawa Local', '春川ローカル')}</a>
<a href="${u(lang, 'help/index.html')}">${L(lang, 'Customer Service', 'カスタマーサービス')}</a>
</nav>
</header>`;
}
function footer(lang) {
  const col = (h, links) => `<div><h4>${h}</h4>${links.map(([href, t]) => `<a href="${u(lang, href)}">${t}</a>`).join('')}</div>`;
  return `<footer class="ftr">
<a class="ftr-top" href="#top">${L(lang, 'Back to top', 'トップへ戻る')}</a>
<div class="ftr-cols">
${col(L(lang, 'Shop with Marketa', 'お買い物'), site.cats.map((c) => [`c/${c.id}.html`, esc(c[lang])]))}
${col(L(lang, 'Deals & Local', 'セール・ローカル'), [['deals.html', L(lang, 'Today’s Deals', 'タイムセール')], ['deals.html#coupons', L(lang, 'Coupons', 'クーポン')], ['search.html?local=1', L(lang, 'Harukawa Local', '春川ローカル')], ['seller/kagami.html', L(lang, 'Kagami Kiln', '鏡窯')], ['seller/minori.html', L(lang, 'Minori Yuzu Farm', 'みのり柚子園')], ['seller/brightdeal.html', L(lang, 'BrightDeal Trading', 'ブライトディール商事')]])}
${col(L(lang, 'Your Account', 'アカウント'), [['orders.html', L(lang, 'Your orders', '注文履歴')], ['track.html', L(lang, 'Track a package', '配送状況')], ['cart.html', L(lang, 'Your basket', 'カート')], ['help/fast.html', L(lang, 'Marketa Fast', 'マルケタFast')]])}
${col(L(lang, 'Let Us Help You', 'ヘルプ'), [['help/shipping.html', L(lang, 'Shipping rates & delivery', '配送料と配送日')], ['help/returns.html', L(lang, 'Returns & refunds', '返品・返金')], ['help/payment.html', L(lang, 'Payment methods', 'お支払い方法')], ['help/faq.html', L(lang, 'FAQ', 'よくある質問')], ['help/index.html', L(lang, 'Customer Service', 'カスタマーサービス')]])}
</div>
<div class="ftr-bot"><span class="logo-w">marketa</span><span>© 2026 ${L(lang, 'Marketa Co., Ltd.', '株式会社マルケタ')}</span><span>${L(lang, 'Prices include consumption tax.', '表示価格はすべて税込です。')}</span></div>
<p class="ftr-research">${L(lang, 'Fictional website made for research (UniLens user study).', '研究用に作成した架空のウェブサイトです（UniLens ユーザー調査）。')}</p>
</footer>`;
}
function crumbs(lang, list) {
  return `<nav class="crumbs" aria-label="breadcrumb">${list.map(([href, t], i) => (href && i < list.length - 1 ? `<a href="${u(lang, href)}">${esc(t)}</a>` : `<span>${esc(t)}</span>`)).join('<span class="sep">›</span>')}</nav>`;
}
function page(lang, o) {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<link rel="stylesheet" href="/assets/css/site.css">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
</head>
<body class="${o.cls || ''}">
${header(lang, o.path)}
<main id="main" class="wrap">
${o.crumbs ? crumbs(lang, o.crumbs) : ''}
${o.body}
</main>
${footer(lang)}
<div class="cookie" id="cookie" hidden><p>${L(lang, 'We use cookies and similar tools to make purchases, show recommendations and measure how you use Marketa. You can accept all cookies or only the ones we need to run the site.', 'マルケタでは、購入手続き、おすすめの表示、サイト利用状況の分析のためにCookieや類似のツールを使用しています。すべてを許可するか、サイトの運営に必要なものだけを許可するかを選べます。')} <a href="${u(lang, 'help/faq.html')}">${L(lang, 'Cookie notice', 'Cookieについて')}</a></p><div><button class="btn" data-cookie="essential">${L(lang, 'Essential only', '必要なもののみ')}</button><button class="btn btn-y" data-cookie="all">${L(lang, 'Accept all', 'すべて許可')}</button></div></div>
<script src="/assets/js/site.js"></script>
<script src="/unilens.js"></script>
<script>UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })</script>
</body>
</html>
`;
}
const pages = [];
const emit = (lang, pth, o) => pages.push({ file: path.join(ROOT, lang, pth), html: page(lang, { ...o, path: pth }) });

// ---------- product cards ----------
function card(lang, p, o = {}) {
  const v = o.v || minPriceVar(p);
  const d = pct(v);
  return `<div class="card${o.cls ? ' ' + o.cls : ''}">
<a class="card-img" href="${u(lang, `p/${p.id}.html`)}"><img src="${img(p.images[0])}" alt="${esc(tx(lang, p.short))}" loading="lazy"></a>
${o.sponsored ? `<span class="spons">${L(lang, 'Sponsored', 'スポンサー')} ⓘ</span>` : ''}${o.rank ? `<span class="rank">#${o.rank}</span>` : ''}
<a class="card-t" href="${u(lang, `p/${p.id}.html`)}">${esc(tx(lang, o.long ? p.title : p.short))}</a>
<div class="card-r">${stars(lang, avg(p))} <a class="muted" href="${u(lang, `p/${p.id}.html#reviews`)}">${num(p.ratings)}</a></div>
${o.deal ? `<div class="deal-tag"><span>${L(lang, `Up to ${d}% off`, `最大${d}%OFF`)}</span> ${L(lang, 'Lightning Deal', 'タイムセール')}</div>` : ''}
<div class="card-p">${d ? `<span class="pb-pct">-${d}%</span>` : ''}<span class="pb-price">${yen(lang, v.price)}</span>${p.variants.length > 1 && !o.v ? `<span class="muted sm">${L(lang, ' from', '〜')}</span>` : ''}</div>
${v.list && v.list > v.price ? `<div class="muted sm">${L(lang, 'List:', '参考：')} <s>${yen(lang, v.list)}</s></div>` : ''}
${p.coupon && !o.compact ? `<div class="coupon-s">${esc(tx(lang, p.coupon))}${p.coupon.member ? ` <span class="muted">(${L(lang, 'Fast members', 'Fast会員')})</span>` : ''}</div>` : ''}
${o.compact ? '' : `<div class="card-d">${deliveryShort(lang, v)}</div>`}
</div>`;
}
const row = (lang, ids, o = {}) => `<div class="row-scroll"><button class="rs-btn prev" aria-label="${L(lang, 'Previous', '前へ')}">‹</button><div class="rs-track">${ids.filter((id) => P[id]).map((id) => card(lang, P[id], { compact: true, ...o })).join('')}</div><button class="rs-btn next" aria-label="${L(lang, 'Next', '次へ')}">›</button></div>`;

// ---------- price history chart (SVG files shown as <img> without a useful alt) ----------
const hashStr = (s) => [...s].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261);
function rng(seed) { let a = seed; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const historyLog = {};
function priceHistory(p) {
  const v = defVar(p);
  const r = rng(hashStr(p.id));
  const round = (x) => Math.round(x / 10) * 10;
  const pts = [];
  if (!v.list) { for (let i = 0; i < 91; i++) pts.push(v.price); }
  else {
    const opts = [v.list, round(v.list * 0.92), round((v.list + v.price) / 2), v.price, round(v.price * 0.94)];
    while (pts.length < 91) { const len = 6 + Math.floor(r() * 16); const pr = opts[Math.floor(r() * opts.length)]; for (let i = 0; i < len && pts.length < 91; i++) pts.push(pr); }
    for (let i = 81; i < 91; i++) pts[i] = v.price;
  }
  const lo = Math.min(...pts), hi = Math.max(...pts);
  historyLog[p.id] = { variant: v.id, now: v.price, low90: lo, high90: hi, lowOn: pts.indexOf(lo) };
  const W = 640, H = 210, l = 70, rr = 16, t = 16, b = 34;
  const span = Math.max(hi - lo, v.price * 0.1);
  const y0 = lo - span * 0.15, y1 = hi + span * 0.15;
  const X = (i) => l + (i / 90) * (W - l - rr), Y = (pr) => t + (1 - (pr - y0) / (y1 - y0)) * (H - t - b);
  let d = `M${X(0).toFixed(1)},${Y(pts[0]).toFixed(1)}`;
  for (let i = 1; i < 91; i++) d += `H${X(i).toFixed(1)}V${Y(pts[i]).toFixed(1)}`;
  const ticks = [lo, hi].filter((x, i, a) => a.indexOf(x) === i);
  const xl = [[0, '7 Jul'], [30, '6 Aug'], [60, '5 Sep'], [90, '5 Oct']];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial, sans-serif" font-size="11">
<rect width="${W}" height="${H}" fill="#fff"/>
${ticks.map((x) => `<line x1="${l}" x2="${W - rr}" y1="${Y(x).toFixed(1)}" y2="${Y(x).toFixed(1)}" stroke="#e3e6e6"/><text x="${l - 6}" y="${(Y(x) + 4).toFixed(1)}" text-anchor="end" fill="#666">¥${num(x)}</text>`).join('')}
${xl.map(([i, s]) => `<text x="${X(i).toFixed(1)}" y="${H - 12}" text-anchor="middle" fill="#666">${s}</text>`).join('')}
<path d="${d}" fill="none" stroke="#e8662e" stroke-width="2.2"/>
<circle cx="${X(90).toFixed(1)}" cy="${Y(pts[90]).toFixed(1)}" r="4" fill="#e8662e"/>
</svg>`;
  fs.mkdirSync(path.join(ROOT, 'assets/charts'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, `assets/charts/price-${p.id}.svg`), svg);
}

// ---------- product page ----------
const BADGE = {
  bestseller: ['#1 Best Seller', 'ベストセラー1位'], choice: ['Marketa’s Choice', 'マルケタおすすめ'], deal: ['Lantern Festival Deal', '灯籠まつりセール'],
};
function productPage(lang, p) {
  const v0 = defVar(p);
  const r = avg(p);
  const cl = site.clusterNames[p.cluster];
  const cat = CAT[p.cat];
  const ld = site.deals.lightning.find((x) => x.id === p.id);
  const vdata = p.variants.map((v) => ({
    id: v.id, name: tx(lang, v.name), img: v.img ?? 0, oos: v.ship === 'oos' || !v.stock, price: v.price,
    pb: priceBlock(lang, p, v, true), bbp: priceBlock(lang, p, v), dl: deliveryHtml(lang, p, v), st: stockHtml(lang, v), ss: shipsSold(lang, p, v),
  }));
  const badges = (p.badges || []).filter((b) => BADGE[b]).map((b) => `<span class="badge b-${b}">${L(lang, ...BADGE[b])}</span>${b === 'bestseller' ? ` <span class="muted sm">${L(lang, 'in', '')} <a href="${u(lang, `c/${p.cat}.html?sub=${p.cluster}`)}">${esc(tx(lang, cl))}</a>${L(lang, '', 'カテゴリー')}</span>` : ''}`).join(' ');
  const coupon = p.coupon
    ? `<div class="coupon"><span class="coupon-tag">${L(lang, 'Coupon', 'クーポン')}</span><label><input type="checkbox" data-clip="${p.id}"> ${esc(tx(lang, p.coupon))}</label>${p.coupon.member ? ` <span class="muted sm">${L(lang, 'Marketa Fast members only.', 'マルケタFast会員限定。')}</span>` : ''}${site.deals.lightning.some((x) => x.id === p.id) ? ` <span class="muted sm">${L(lang, 'Cannot be combined with today’s Lightning Deal.', '本日のタイムセールとは併用できません。')}</span>` : ''} <a class="sm" href="${u(lang, 'deals.html#coupons')}">${L(lang, 'Terms', '規約')}</a></div>`
    : '';
  const variants = p.variants.length > 1 || p.variantLabel
    ? `<div class="variants"><div class="vlabel">${esc(tx(lang, p.variantLabel) || L(lang, 'Option', 'オプション'))}: <b id="vname">${esc(tx(lang, v0.name))}</b></div><div class="vopts">${p.variants.map((v) => `<button type="button" class="vopt${v === v0 ? ' on' : ''}${v.ship === 'oos' || !v.stock ? ' na' : ''}" data-v="${v.id}" aria-pressed="${v === v0}"><span>${esc(tx(lang, v.name))}</span><small>${v.ship === 'oos' || !v.stock ? L(lang, 'Unavailable', '在庫切れ') : yen(lang, v.price)}</small></button>`).join('')}</div></div>`
    : '';
  const gallery = `<div class="gal"><ul class="thumbs">${p.images.map((im, i) => `<li><button type="button" class="thumb${i ? '' : ' on'}" data-img="${i}" data-src="${img(im)}"><img src="${img(im)}" alt=""></button></li>`).join('')}</ul>
<div class="gal-main"><img id="mainimg" src="${img(p.images[v0.img ?? 0])}" alt="${esc(tx(lang, p.short))}"></div><p class="muted sm center">${L(lang, 'Click image to open expanded view', '画像をクリックして拡大')}</p></div>`;
  const info = `<div class="pinfo">
<h1 class="ptitle">${esc(tx(lang, p.title))}</h1>
<a class="brandlink" href="${u(lang, `search.html?brand=${encodeURIComponent(p.brand.en)}`)}">${L(lang, `Visit the ${esc(p.brand.en)} Store`, `${esc(p.brand.ja)}のストアを表示`)}</a>
<div class="rline"><span class="rnum">${r}</span> ${stars(lang, r)} <a href="#reviews">${L(lang, `${num(p.ratings)} ratings`, `${num(p.ratings)}個の評価`)}</a> <span class="sep">|</span> <a href="#qa">${L(lang, `${p.qa.length} answered questions`, `${p.qa.length}件の質問に回答`)}</a></div>
${badges ? `<div class="badges">${badges}</div>` : ''}
${isLocal(p) ? `<div class="localtag">${L(lang, 'Harukawa Local seller', '春川ローカル出品者')}</div>` : ''}
<div class="bought muted">${L(lang, `${bought(p)} bought in past month`, `過去1か月で${bought(p)}点購入されました`)}</div>
<hr>
${ld ? `<div class="ldeal"><b>${L(lang, 'Lightning Deal', 'タイムセール')}</b> <span>${L(lang, `${ld.claimed}% claimed · Ends ${ld.ends} today`, `${ld.claimed}%取得済み・本日${ld.ends}終了`)}</span><div class="claim"><i style="width:${ld.claimed}%"></i></div></div>` : ''}
<div id="pricebox">${vdata.find((x) => x.id === v0.id).pb}</div>
${coupon}
<p class="muted sm">${L(lang, 'All prices include consumption tax.', '価格はすべて税込です。')} ${p.cat === 'gifts' ? L(lang, 'Food is taxed at the reduced 8% rate.', '食品は軽減税率8%対象です。') : ''}</p>
${variants}
<h2 class="h-sm">${L(lang, 'About this item', 'この商品について')}</h2>
<ul class="bullets">${tx(lang, p.bullets).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
<a class="sm" href="#details">› ${L(lang, 'See more product details', '商品の詳細を見る')}</a>
</div>`;
  const vd = vdata.find((x) => x.id === v0.id);
  const buy = `<aside class="buybox">
<div id="bb-price">${vd.bbp}</div>
<div id="bb-dl" class="bb-dl">${vd.dl}</div>
<a class="deliver-s" href="${u(lang, 'checkout.html')}">📍 ${L(lang, 'Deliver to Aki – Harukawa 795-0021', 'お届け先：アキさん – 春川市 795-0021')}</a>
<div id="bb-stock">${vd.st}</div>
<label class="qty">${L(lang, 'Quantity:', '数量：')} <select id="qty">${[1, 2, 3, 4, 5].map((n) => `<option>${n}</option>`).join('')}</select></label>
<button class="btn btn-y btn-full" id="add" data-id="${p.id}">${L(lang, 'Add to basket', 'カートに入れる')}</button>
<button class="btn btn-o btn-full" id="buynow" data-id="${p.id}">${L(lang, 'Buy now', '今すぐ買う')}</button>
<div id="bb-ss">${vd.ss}</div>
<label class="sm"><input type="checkbox"> ${L(lang, 'Add gift options', 'ギフトの設定')}</label>
<hr><button class="btn btn-full btn-w" type="button" data-list>${L(lang, 'Add to List', 'リストに追加')}</button>
<p class="added-note sm" hidden>${L(lang, 'Added to your Wish List.', 'ほしい物リストに追加しました。')}</p>
</aside>`;

  // frequently bought together
  const fbt = [p.id, ...p.fbt].filter((id) => P[id]).map((id) => P[id]);
  const fbtTotal = fbt.reduce((s, x) => s + (x === p ? v0.price : minPriceVar(x).price), 0);
  const fbtHtml = `<section class="sec fbt"><h2>${L(lang, 'Frequently bought together', 'よく一緒に購入されている商品')}</h2><div class="fbt-row">
${fbt.map((x, i) => `${i ? '<span class="plus">+</span>' : ''}<a href="${u(lang, `p/${x.id}.html`)}"><img src="${img(x.images[0])}" alt="${esc(tx(lang, x.short))}" loading="lazy"></a>`).join('')}
<div class="fbt-sum"><p>${L(lang, 'Total price:', '合計価格：')} <b class="pb-price">${yen(lang, fbtTotal)}</b></p><button class="btn btn-y" data-addall="${fbt.map((x) => x.id).join(',')}">${L(lang, `Add all ${fbt.length} to basket`, `${fbt.length}点ともカートに入れる`)}</button><p class="muted sm">${L(lang, 'Some of these items ship sooner than the others.', '一部の商品は別々に発送されます。')}</p></div></div>
<ul class="fbt-list">${fbt.map((x, i) => `<li><label><input type="checkbox" checked disabled> <b>${i ? '' : L(lang, 'This item: ', 'この商品：')}</b><a href="${u(lang, `p/${x.id}.html`)}">${esc(tx(lang, x.short))}</a> <span class="pb-price sm">${yen(lang, x === p ? v0.price : minPriceVar(x).price)}</span></label></li>`).join('')}</ul></section>`;

  // comparison table
  const cmp = [p, ...p.similar.filter((id) => P[id]).map((id) => P[id])];
  const crow = clusters[p.cluster].compareRows[lang];
  const cmpHtml = `<section class="sec"><h2>${L(lang, 'Compare with similar items', '類似商品と比較する')}</h2><div class="tscroll"><table class="cmp"><thead><tr><th></th>${cmp.map((x, i) => `<th><a href="${u(lang, `p/${x.id}.html`)}"><img src="${img(x.images[0])}" alt="" loading="lazy"><span>${esc(tx(lang, x.short))}</span></a>${i ? '' : `<span class="muted sm">${L(lang, 'This item', 'この商品')}</span>`}</th>`).join('')}</tr></thead><tbody>
<tr><th>${L(lang, 'Customer rating', 'カスタマー評価')}</th>${cmp.map((x) => `<td>${stars(lang, avg(x))} <span class="muted">(${num(x.ratings)})</span></td>`).join('')}</tr>
<tr><th>${L(lang, 'Price', '価格')}</th>${cmp.map((x) => `<td><span class="pb-price sm">${yen(lang, (x === p ? v0 : minPriceVar(x)).price)}</span>${x.variants.length > 1 ? `<br><span class="muted sm">${L(lang, `${x.variants.length} options`, `${x.variants.length}種類`)}</span>` : ''}</td>`).join('')}</tr>
<tr><th>${L(lang, 'Delivery', 'お届け')}</th>${cmp.map((x) => `<td class="sm">${deliveryShort(lang, x === p ? v0 : defVar(x))}</td>`).join('')}</tr>
<tr><th>${L(lang, 'Sold by', '販売元')}</th>${cmp.map((x) => `<td>${esc(sellerName(lang, x.seller))}</td>`).join('')}</tr>
${crow.map((h, i) => `<tr><th>${esc(h)}</th>${cmp.map((x) => `<td>${esc(x.compare[lang][i] ?? '—')}</td>`).join('')}</tr>`).join('')}
</tbody></table></div></section>`;

  const specs = tx(lang, p.specs);
  const half = Math.ceil(specs.length / 2);
  const tables = (p.tables || []).map((t) => `<h3>${esc(tx(lang, t.title))}</h3><div class="tscroll"><table class="grid"><thead><tr>${t[lang][0].map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${t[lang].slice(1).map((rw) => `<tr>${rw.map((c, i) => (i ? `<td>${esc(c)}</td>` : `<th>${esc(c)}</th>`)).join('')}</tr>`).join('')}</tbody></table></div>`).join('');
  const details = `<section class="sec" id="details"><h2>${L(lang, 'Product information', '商品の情報')}</h2><div class="spec-cols">
<table class="spec">${specs.slice(0, half).map(([k, val]) => `<tr><th>${esc(k)}</th><td>${esc(val)}</td></tr>`).join('')}</table>
<table class="spec">${specs.slice(half).map(([k, val]) => `<tr><th>${esc(k)}</th><td>${esc(val)}</td></tr>`).join('')}
<tr><th>${L(lang, 'Customer reviews', 'カスタマーレビュー')}</th><td>${stars(lang, r)} ${r} (${num(p.ratings)})</td></tr>
<tr><th>${L(lang, 'Best Sellers Rank', '売れ筋ランキング')}</th><td>${L(lang, `#${(hashStr(p.id) % 900) + 12} in ${esc(cat.en)}`, `${esc(cat.ja)} - ${(hashStr(p.id) % 900) + 12}位`)} (<a href="${u(lang, `c/${p.cat}.html?sort=reviews`)}">${L(lang, 'See Top 100', 'トップ100を見る')}</a>)</td></tr>
<tr><th>${L(lang, 'Date first available', '取り扱い開始日')}</th><td>${fmtDate(lang, p.added)}</td></tr></table></div>
<h2>${L(lang, 'Product description', '商品の説明')}</h2><div class="desc">${tx(lang, p.description).map((x) => `<p>${esc(x)}</p>`).join('')}</div>${tables}</section>`;

  const hist = `<section class="sec ph"><h2>${L(lang, 'Price history', '価格の推移')}</h2><img src="/assets/charts/price-${p.id}.svg" alt="${L(lang, 'chart', 'グラフ')}" width="640" height="210" loading="lazy"><p class="muted sm">${L(lang, `Lowest price shown for the ${esc(tx(lang, v0.name))} option. Past prices may include Lightning Deals.`, `「${esc(tx(lang, v0.name))}」の価格です。過去の価格にはタイムセール価格を含む場合があります。`)}</p></section>`;

  const qa = `<section class="sec" id="qa"><h2>${L(lang, 'Customer questions & answers', 'Q&A')}</h2><input class="qa-search" type="search" placeholder="${L(lang, 'Have a question? Search for answers', '質問がありますか？回答を検索')}" aria-label="${L(lang, 'Search questions', '質問を検索')}">
${p.qa.map((q) => `<div class="qa"><div class="qa-v"><b>${q.votes}</b><small>${L(lang, 'votes', '票')}</small></div><dl><dt>${L(lang, 'Question:', '質問：')}</dt><dd class="qa-q">${esc(q[lang].q)}</dd><dt>${L(lang, 'Answer:', '回答：')}</dt><dd>${esc(q[lang].a)}<br><small class="muted">${L(lang, `By ${esc(q[lang].by)} on ${fmtDate(lang, q.date)}`, `${esc(q[lang].by)}　${fmtDate(lang, q.date)}`)}</small></dd></dl></div>`).join('')}
<p class="qa-none muted" hidden>${L(lang, 'No answered questions match your search.', '該当する質問はありません。')}</p></section>`;

  const vname = (id) => { const v = p.variants.find((x) => x.id === id); return v ? tx(lang, v.name) : ''; };
  const reviews = `<section class="sec reviews" id="reviews"><div class="rv-sum"><h2>${L(lang, 'Customer reviews', 'カスタマーレビュー')}</h2>
<div class="rv-big">${stars(lang, r, 'lg')} <b>${L(lang, `${r} out of 5`, `5つ星のうち${r}`)}</b></div><p class="muted">${L(lang, `${num(p.ratings)} global ratings`, `${num(p.ratings)}件のグローバル評価`)}</p>
<table class="hist">${p.hist.map((h, i) => `<tr><td><button type="button" class="link" data-star="${5 - i}">${L(lang, `${5 - i} star`, `星${5 - i}つ`)}</button></td><td class="hbar"><div class="bar"><i style="width:${h}%"></i></div></td><td class="muted">${h}%</td></tr>`).join('')}</table>
<details class="sm"><summary>${L(lang, 'How are ratings calculated?', '評価の計算方法')}</summary><p>${L(lang, 'The overall star rating and percentage breakdown by star do not use a simple average. Our system considers how recent a review is and whether the reviewer bought the item on Marketa.', '星の総合評価と星ごとの割合は単純平均ではありません。レビューの新しさや、マルケタで購入したかどうかなどを考慮しています。')}</p></details>
<hr><h3>${L(lang, 'Review this product', 'この商品をレビュー')}</h3><p class="sm">${L(lang, 'Share your thoughts with other customers', '他のお客様にも意見を伝えましょう')}</p><button class="btn btn-full btn-w" type="button" data-write>${L(lang, 'Write a product review', 'カスタマーレビューを書く')}</button><p class="write-note sm muted" hidden>${L(lang, 'You can review items you have bought, from Your orders.', 'レビューは注文履歴から、購入した商品について投稿できます。')}</p></div>
<div class="rv-list"><div class="rv-tools"><h3>${L(lang, 'Top reviews from Japan', '日本で投稿されたレビュー')}</h3><select id="rv-sort" aria-label="${L(lang, 'Sort reviews', '並べ替え')}"><option value="top">${L(lang, 'Top reviews', '上位レビュー')}</option><option value="new">${L(lang, 'Most recent', '新しい順')}</option></select><span class="rv-filter" hidden></span></div>
${p.reviews.map((rv, i) => `<div class="rv" data-stars="${rv.stars}" data-date="${rv.date}" data-i="${i}"><div class="rv-who"><span class="avatar">${esc([...rv[lang].name][0])}</span>${esc(rv[lang].name)}</div>
<div class="rv-head">${stars(lang, rv.stars)} <b>${esc(rv[lang].title)}</b></div>
<div class="muted sm">${L(lang, `Reviewed in Japan on ${fmtDate(lang, rv.date)}`, `${fmtDate(lang, rv.date)}に日本でレビュー済み`)}</div>
<div class="sm rv-meta">${rv.variant && vname(rv.variant) ? `${esc(tx(lang, p.variantLabel) || '')}: ${esc(vname(rv.variant))}` : ''}${rv.verified ? ` <span class="sep">|</span> <b class="vp">${L(lang, 'Verified Purchase', 'マルケタで購入')}</b>` : ''}</div>
<p class="rv-body">${esc(rv[lang].body)}</p>
<div class="muted sm">${L(lang, `${rv.helpful} people found this helpful`, `${rv.helpful}人のお客様がこれが役に立ったと考えています`)}</div>
<div class="rv-act"><button type="button" class="btn btn-sm" data-helpful>${L(lang, 'Helpful', '役に立った')}</button> <span class="sep">|</span> <button type="button" class="link sm muted" data-report>${L(lang, 'Report', '報告する')}</button></div></div>`).join('')}
</div></section>`;

  const also = `<section class="sec"><h2>${L(lang, 'Customers who viewed this item also viewed', 'この商品を見た後にお客様が購入した商品')}</h2>${row(lang, p.alsoViewed)}</section>`;
  const sponsoredRow = `<section class="sec"><h2>${L(lang, 'Products related to this item', 'この商品に関連する商品')} <span class="spons">${L(lang, 'Sponsored', 'スポンサー')} ⓘ</span></h2>${row(lang, site.sponsored.filter((id) => id !== p.id))}</section>`;

  const body = `<div class="pdp">${gallery}${info}${buy}</div>
<script type="application/json" id="pdata">${JSON.stringify({ id: p.id, variants: vdata }).replace(/</g, '\\u003c')}</script>
${fbtHtml}${cmpHtml}${sponsoredRow}${details}${hist}${qa}${reviews}${also}`;
  emit(lang, `p/${p.id}.html`, {
    title: L(lang, `${tx(lang, p.short)} : Marketa`, `${tx(lang, p.title)} | マルケタ`),
    crumbs: [['index.html', 'Marketa'], [`c/${p.cat}.html`, cat[lang]], [`c/${p.cat}.html?sub=${p.cluster}`, tx(lang, cl)], [null, tx(lang, p.short)]],
    body, cls: 'pg-product',
  });
}

// ---------- listing pages (category, search): rendered on the client from the JSON index ----------
function listingShell(lang, o) {
  return `${o.head || ''}<div class="listing" data-listing data-cat="${o.cat || ''}"><aside class="filters" id="filters"></aside><div class="results"><div class="res-bar"><span id="res-count"></span><label class="sm">${L(lang, 'Sort by:', '並べ替え：')} <select id="sort"><option value="featured">${L(lang, 'Featured', 'おすすめ順')}</option><option value="price-asc">${L(lang, 'Price: low to high', '価格の安い順')}</option><option value="price-desc">${L(lang, 'Price: high to low', '価格の高い順')}</option><option value="rating">${L(lang, 'Avg. customer review', 'レビューの評価順')}</option><option value="reviews">${L(lang, 'Most reviews', 'レビューの多い順')}</option><option value="newest">${L(lang, 'Newest arrivals', '新着順')}</option></select></label></div>
<div id="res-spons"></div><div class="grid-cards" id="res"></div><nav class="pager" id="pager" aria-label="${L(lang, 'Pages', 'ページ')}"></nav>
<noscript><p>${L(lang, 'Turn on JavaScript to see results.', '検索結果の表示にはJavaScriptを有効にしてください。')}</p></noscript></div></div>`;
}
function categoryPage(lang, c) {
  const head = `<div class="cat-hero"><div><h1>${esc(c[lang])}</h1><p class="muted">${esc(tx(lang, c.blurb))}</p></div><div class="cat-subs">${c.clusters.map((k) => `<a href="${u(lang, `c/${c.id}.html?sub=${k}`)}"><img src="${img(products.find((p) => p.cluster === k).images[0])}" alt="" loading="lazy"><span>${esc(tx(lang, site.clusterNames[k]))}</span></a>`).join('')}</div></div>
<div class="ad-strip"><span class="spons">${L(lang, 'Sponsored', 'スポンサー')}</span> ${c.id === 'kitchen' || c.id === 'home' ? L(lang, 'Gift-wrapped Harukawa ware from Kagami Kiln, with free noshi. <a href="/en/seller/kagami.html">Shop now ›</a>', '鏡窯の春川焼、のし無料・ギフト包装承ります。<a href="/ja/seller/kagami.html">ストアを見る ›</a>') : L(lang, 'Marketa Fast: free next-day delivery on millions of items. <a href="/en/help/fast.html">Try 30 days free ›</a>', 'マルケタFast：対象商品の翌日配送が無料。<a href="/ja/help/fast.html">30日間無料で試す ›</a>')}</div>`;
  emit(lang, `c/${c.id}.html`, { title: L(lang, `${c.en} | Marketa`, `${c.ja} | マルケタ`), crumbs: [['index.html', 'Marketa'], [null, c[lang]]], body: listingShell(lang, { cat: c.id, head }), cls: 'pg-list' });
}

function indexJson(lang) {
  return products.map((p) => {
    const v = minPriceVar(p);
    const text = [p.title.en, p.title.ja, p.short.en, p.short.ja, p.brand.en, p.brand.ja, ...p.bullets[lang], CAT[p.cat].en, CAT[p.cat].ja, site.clusterNames[p.cluster].en, site.clusterNames[p.cluster].ja, sellerName('en', p.seller), sellerName('ja', p.seller)].join(' ').toLowerCase();
    return {
      id: p.id, cat: p.cat, sub: p.cluster, title: tx(lang, p.title), short: tx(lang, p.short), brand: tx(lang, p.brand), brandKey: p.brand.en,
      seller: p.seller, sellerName: sellerName(lang, p.seller), local: isLocal(p), img: img(p.images[0]), rating: avg(p), ratings: p.ratings, bought: bought(p),
      price: v.price, list: v.list || null, pct: pct(v), multi: p.variants.length > 1, speed: Math.min(...p.variants.map((x) => SHIP[x.ship].speed)),
      dl: deliveryShort(lang, defVar(p)), coupon: p.coupon ? tx(lang, p.coupon) : null, couponAmt: p.coupon?.amount || 0, couponPct: p.coupon?.pct || 0, couponMember: !!p.coupon?.member,
      added: p.added, sponsored: site.sponsored.includes(p.id), ld: site.deals.lightning.some((x) => x.id === p.id), text,
      variants: p.variants.map((x) => ({ id: x.id, name: tx(lang, x.name), price: x.price, list: x.list || null, ship: x.ship, stock: x.stock })),
    };
  });
}

// ---------- home ----------
function homePage(lang) {
  const h = site.home;
  const hero = `<div class="hero" data-carousel>${h.hero.map((s, i) => `<div class="slide tone-${s.tone}${i ? '' : ' on'}" aria-hidden="${i ? 'true' : 'false'}"><div class="slide-txt"><span class="kicker">${esc(s[lang].kicker)}</span><h2>${esc(s[lang].h)}</h2><p>${esc(s[lang].p)}</p><a class="btn btn-y" href="${u(lang, s.href)}">${esc(s[lang].cta)}</a></div><img src="${img(s.img)}" alt=""></div>`).join('')}
<button class="hero-btn prev" aria-label="${L(lang, 'Previous slide', '前のスライド')}">‹</button><button class="hero-btn next" aria-label="${L(lang, 'Next slide', '次のスライド')}">›</button><div class="dots">${h.hero.map((_, i) => `<button class="${i ? '' : 'on'}" aria-label="${i + 1}"></button>`).join('')}</div></div>`;
  const quad = (title, ids, more, moreT) => `<div class="qcard"><h3>${title}</h3><div class="q4">${ids.map((id) => `<a href="${u(lang, `p/${id}.html`)}"><img src="${img(P[id].images[0])}" alt="" loading="lazy"><span>${esc(tx(lang, P[id].short))}</span></a>`).join('')}</div><a class="sm" href="${u(lang, more)}">${moreT}</a></div>`;
  const deals = site.deals.lightning.map((d) => d.id);
  const best = (cat) => products.filter((p) => p.cat === cat).sort((a, b) => b.ratings - a.ratings);
  const body = `${hero}
<div class="quads">
${quad(L(lang, 'Today’s Lightning Deals', '本日のタイムセール'), deals.slice(0, 4), 'deals.html', L(lang, 'See all deals', 'すべてのセールを見る'))}
${quad(L(lang, 'Shop Harukawa Local', '春川ローカルの逸品'), ['kagami-donabe', 'kagami-mug-pair', 'minori-ponzu-set', 'minori-bath-salts'], 'search.html?local=1', L(lang, 'Discover local sellers', 'ローカル出品者を見る'))}
${quad(L(lang, 'Warm drinks for autumn', '秋のあたたかい一杯に'), ['hearth-kettle', 'tetsuyu-gooseneck', 'kagami-tea-set', 'minori-marmalade-set'], 'c/kitchen.html?sub=kettles', L(lang, 'Shop kettles', 'ケトルを見る'))}
<div class="qcard signin"><h3>${L(lang, 'Your Marketa Fast trial', 'マルケタFastを無料で体験')}</h3><p>${L(lang, 'Free next-day delivery on Fast items, free same-day delivery in Harukawa on orders of ¥2,000 or more, and early access to deals. 30 days free, then ¥600 a month.', 'Fast対象商品の翌日配送が無料、春川市内は2,000円以上で当日配送も無料、タイムセールに先行参加。30日間無料、その後は月額600円。')}</p><a class="btn btn-y" href="${u(lang, 'help/fast.html')}">${L(lang, 'Learn more', '詳しく見る')}</a><p class="muted sm">${L(lang, 'One free trial per account. Not available if you were a member in the last 12 months.', '無料体験は1アカウント1回限り。過去12か月以内に会員だった場合は対象外です。')}</p></div>
</div>
<section class="sec home-sec"><h2>${L(lang, 'Shop by department', 'カテゴリーから探す')}</h2><div class="tiles">${site.cats.map((c) => `<a class="tile" href="${u(lang, `c/${c.id}.html`)}"><img src="${img(c.img)}" alt="" loading="lazy"><b>${esc(c[lang])}</b><span class="muted sm">${esc(tx(lang, c.blurb))}</span></a>`).join('')}</div></section>
<section class="sec home-sec"><h2>${L(lang, 'Recommended for you, Aki', 'アキさんへのおすすめ')}</h2>${row(lang, h.recommended)}</section>
<div class="ad-banner"><span class="spons">${L(lang, 'Sponsored', 'スポンサー')} ⓘ</span><img src="${img('voltx-pods')}" alt=""><div><b>${L(lang, 'VoltX Pods – wireless earbuds for ¥2,980', 'VoltX Pods ワイヤレスイヤホン 2,980円')}</b><p class="sm">${L(lang, '50% off list price · free delivery from BrightDeal Trading', '参考価格から50%OFF・ブライトディール商事から送料無料')}</p></div><a class="btn btn-w" href="${u(lang, 'p/voltx-pods.html')}">${L(lang, 'Shop now', '今すぐチェック')}</a></div>
<section class="sec home-sec"><h2>${L(lang, 'Your browsing history', '閲覧履歴')} <a class="sm" href="${u(lang, 'search.html')}">${L(lang, 'View or edit', '表示・編集')}</a></h2><div data-recent>${row(lang, h.recentSeed)}</div></section>
<div class="two-col">
<section class="sec home-sec"><h2>${L(lang, 'Best Sellers in Kitchen', 'キッチン用品の売れ筋ランキング')}</h2><ol class="best">${best('kitchen').slice(0, 5).map((p, i) => `<li><span class="rank">#${i + 1}</span><img src="${img(p.images[0])}" alt="" loading="lazy"><div><a href="${u(lang, `p/${p.id}.html`)}">${esc(tx(lang, p.short))}</a><div>${stars(lang, avg(p))} <span class="muted sm">${num(p.ratings)}</span></div><span class="pb-price sm">${yen(lang, minPriceVar(p).price)}</span></div></li>`).join('')}</ol></section>
<section class="sec home-sec"><h2>${L(lang, 'Best Sellers in Electronics', '家電・オーディオの売れ筋ランキング')}</h2><ol class="best">${best('electronics').slice(0, 5).map((p, i) => `<li><span class="rank">#${i + 1}</span><img src="${img(p.images[0])}" alt="" loading="lazy"><div><a href="${u(lang, `p/${p.id}.html`)}">${esc(tx(lang, p.short))}</a><div>${stars(lang, avg(p))} <span class="muted sm">${num(p.ratings)}</span></div><span class="pb-price sm">${yen(lang, minPriceVar(p).price)}</span></div></li>`).join('')}</ol></section>
</div>
<section class="sec home-sec"><h2>${L(lang, 'Gifts from Harukawa for the Lantern Festival', '灯籠まつりの贈り物に、春川の名産')}</h2>${row(lang, ['minori-ponzu-set', 'kagami-sake-set', 'shiroshita-senbei', 'minori-marmalade-set', 'kagami-plate-set', 'kagami-tea-set', 'minori-hand-cream'])}</section>`;
  emit(lang, 'index.html', { title: L(lang, 'Marketa: online shopping for kitchen, electronics, outdoor and Harukawa local goods', 'マルケタ｜春川発のオンラインショッピング'), body, cls: 'pg-home' });
}

// ---------- deals ----------
function dealsPage(lang) {
  const dd = P[site.deals.dealOfDay];
  const ddv = defVar(dd);
  const disc = products.filter((p) => p.variants.some((v) => pct(v) > 0)).sort((a, b) => pct(minPriceVar(b)) - pct(minPriceVar(a)));
  const cps = products.filter((p) => p.coupon);
  const body = `<h1>${L(lang, 'Today’s Deals', 'タイムセール')}</h1>
<div class="fest-banner"><b>${L(lang, 'Harukawa Lantern Festival Sale', '春川灯籠まつりセール')}</b> <span>${L(lang, 'Fri 2 Oct – Sun 11 Oct 23:59', '10月2日(金)〜10月11日(日)23:59')}</span><span class="muted sm">${L(lang, 'New Lightning Deals every day at 0:00, 12:00 and 18:00. Fast members see each Lightning Deal 30 minutes early.', 'タイムセールは毎日0時・12時・18時に追加。Fast会員は各タイムセールに30分早く参加できます。')}</span></div>
<div class="deal-tabs" role="tablist"><a class="on" href="#lightning">${L(lang, 'Lightning Deals', 'タイムセール')}</a><a href="#dotd">${L(lang, 'Deal of the Day', '特選タイムセール')}</a><a href="#upcoming">${L(lang, 'Upcoming', 'まもなく開始')}</a><a href="#all">${L(lang, 'All discounts', '割引中の商品')}</a><a href="#coupons">${L(lang, 'Coupons', 'クーポン')}</a></div>
<section class="sec" id="lightning"><h2>${L(lang, 'Lightning Deals', 'タイムセール')}</h2><div class="grid-cards">${site.deals.lightning.map((d) => { const p = P[d.id]; return `<div class="dcard">${card(lang, p, { deal: true, v: defVar(p) })}<div class="claim"><i style="width:${d.claimed}%"></i></div><p class="sm">${L(lang, `${d.claimed}% claimed · Ends ${d.ends} today`, `${d.claimed}%取得済み・本日${d.ends}終了`)}</p></div>`; }).join('')}</div>
<p class="muted sm">${L(lang, 'Lightning Deals are available in limited quantities until the end time or until all units are claimed. Limit one per customer. When a deal is 100% claimed you can join the waitlist; if someone removes the deal from their basket, the next person on the waitlist gets it.', 'タイムセールは数量限定で、終了時刻またはすべて取得されるまで有効です。お一人様1点限り。100%取得された場合はキャンセル待ちに登録できます。他のお客様がカートから削除すると、キャンセル待ちの順にご案内します。')}</p></section>
<section class="sec dotd" id="dotd"><h2>${L(lang, 'Deal of the Day', '特選タイムセール')}</h2><div class="dotd-in"><a href="${u(lang, `p/${dd.id}.html`)}"><img src="${img(dd.images[0])}" alt="${esc(tx(lang, dd.short))}"></a><div><a class="card-t" href="${u(lang, `p/${dd.id}.html`)}">${esc(tx(lang, dd.title))}</a>${priceBlock(lang, dd, ddv, true)}<p>${L(lang, 'Ends tonight at 23:59. Only the option shown is discounted; the other size is at its usual sale price.', '本日23:59まで。表示しているタイプのみが対象です。もう一方の容量は通常のセール価格です。')}</p><div class="card-d">${deliveryShort(lang, ddv)}</div></div><img src="/assets/charts/price-${dd.id}.svg" alt="" class="dotd-chart"></div></section>
<section class="sec" id="upcoming"><h2>${L(lang, 'Upcoming deals', 'まもなく開始するセール')}</h2><div class="grid-cards">${site.deals.upcoming.map((d) => { const p = P[d.id]; return `<div class="dcard up">${card(lang, p, { compact: true })}<p><b class="pb-price">${yen(lang, d.price)}</b> ${L(lang, `from ${d.starts} today`, `本日${d.starts}から`)}</p><p class="muted sm">${L(lang, `Marketa Fast members from ${d.member}. Quantities limited; all colours.`, `マルケタFast会員は${d.member}から先行参加。数量限定・全色対象。`)}</p><button class="btn btn-w btn-sm" data-watch>${L(lang, 'Watch this deal', 'ウォッチする')}</button></div>`; }).join('')}</div></section>
<section class="sec" id="all"><h2>${L(lang, 'All discounted items', '割引中の商品')}</h2><div class="grid-cards">${disc.map((p) => card(lang, p)).join('')}</div></section>
<section class="sec" id="coupons"><h2>${L(lang, 'Coupons', 'クーポン')}</h2><div class="grid-cards">${cps.map((p) => `<div class="ccard"><div class="coupon-big">${esc(tx(lang, p.coupon))}</div>${card(lang, p, { compact: true })}${p.coupon.member ? `<p class="muted sm">${L(lang, 'Marketa Fast members only', 'マルケタFast会員限定')}</p>` : ''}<button class="btn btn-w btn-sm" data-clip-btn="${p.id}">${L(lang, 'Clip coupon', 'クーポンを獲得')}</button></div>`).join('')}</div>
<h3>${L(lang, 'Coupon terms', 'クーポンの利用条件')}</h3><ul class="sm"><li>${L(lang, 'Clip a coupon on the product page or here; the discount is applied at checkout.', 'クーポンは商品ページまたはこのページで獲得し、ご注文手続き時に適用されます。')}</li><li>${L(lang, 'Each coupon can be used once per customer, for one unit, and expires on 11 October 2026 at 23:59 unless stated otherwise.', '各クーポンはお一人様1回・1点限り。特に記載がない限り2026年10月11日23:59まで有効です。')}</li><li>${L(lang, 'Coupons cannot be combined with Lightning Deals on the same item. If you return the item, the coupon is not reissued.', '同じ商品のタイムセールとは併用できません。返品した場合、クーポンは再発行されません。')}</li><li>${L(lang, 'Member coupons need an active Marketa Fast membership, including the free trial.', '会員限定クーポンは、無料体験を含むマルケタFast会員のみご利用いただけます。')}</li></ul></section>`;
  emit(lang, 'deals.html', { title: L(lang, 'Today’s Deals | Marketa', 'タイムセール | マルケタ'), crumbs: [['index.html', 'Marketa'], [null, L(lang, 'Today’s Deals', 'タイムセール')]], body, cls: 'pg-deals' });
}

// ---------- seller pages ----------
function sellerPage(lang, s) {
  const items = products.filter((p) => p.seller === s.id);
  const body = `<div class="seller-head"><div class="seller-logo s-${s.id}">${esc([...tx(lang, s.name)][0])}</div><div><h1>${esc(tx(lang, s.name))}</h1><p class="muted">${esc(tx(lang, s.tagline))}</p>
<div>${stars(lang, s.rating)} <b>${s.rating}</b> <span class="muted">${L(lang, `(${num(s.ratings)} ratings)`, `（${num(s.ratings)}件の評価）`)}</span> · <b>${s.positive}%</b> ${L(lang, 'positive in the last 12 months', '過去12か月の高評価率')}</div>
<p class="sm muted">${esc(tx(lang, s.location))} · ${L(lang, `Selling on Marketa since ${s.since}`, `${s.since}年からマルケタに出店`)}</p></div></div>
<div class="tabs" data-tabs><div role="tablist">${['about', 'shipping', 'returns', 'contact', 'legal'].map((k, i) => `<button role="tab" type="button" class="${i ? '' : 'on'}" data-tab="${k}" aria-selected="${!i}">${{ about: L(lang, 'About', 'ストア紹介'), shipping: L(lang, 'Shipping', '配送'), returns: L(lang, 'Returns & refunds', '返品・返金'), contact: L(lang, 'Contact', 'お問い合わせ'), legal: L(lang, 'Business information', '特定商取引法に基づく表記') }[k]}</button>`).join('')}</div>
<div class="tabpanel on" data-panel="about">${tx(lang, s.about)}</div><div class="tabpanel" data-panel="shipping" hidden>${tx(lang, s.shipping)}</div><div class="tabpanel" data-panel="returns" hidden>${tx(lang, s.returns)}</div><div class="tabpanel" data-panel="contact" hidden>${tx(lang, s.contact)}</div>
<div class="tabpanel" data-panel="legal" hidden><table class="grid">${s.legal[lang].map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table></div></div>
<section class="sec"><h2>${L(lang, `Products from ${tx(lang, s.name)}`, `${tx(lang, s.name)}の商品`)} <span class="muted sm">(${items.length})</span></h2><div class="grid-cards">${items.map((p) => card(lang, p)).join('')}</div></section>
<section class="sec reviews"><div class="rv-sum"><h2>${L(lang, 'Seller feedback', '出品者の評価')}</h2><div class="rv-big">${stars(lang, s.rating, 'lg')} <b>${L(lang, `${s.rating} out of 5`, `5つ星のうち${s.rating}`)}</b></div>
<table class="hist">${s.hist.map((h, i) => `<tr><td>${L(lang, `${5 - i} star`, `星${5 - i}つ`)}</td><td class="hbar"><div class="bar"><i style="width:${h}%"></i></div></td><td class="muted">${h}%</td></tr>`).join('')}</table></div>
<div class="rv-list">${s.feedback.map((f) => `<div class="rv"><div class="rv-head">${stars(lang, f.stars)} <b>${esc(f[lang].name)}</b></div><div class="muted sm">${fmtDate(lang, f.date)}</div><p class="rv-body">${esc(f[lang].text)}</p></div>`).join('')}</div></section>`;
  emit(lang, `seller/${s.id}.html`, { title: L(lang, `${s.name.en} – Seller profile | Marketa`, `${s.name.ja} – 出品者情報 | マルケタ`), crumbs: [['index.html', 'Marketa'], ['search.html?local=1', L(lang, 'Sellers', '出品者')], [null, tx(lang, s.name)]], body, cls: 'pg-seller' });
}

// ---------- help ----------
function helpPage(lang, hp) {
  const nav = `<nav class="help-nav"><h3>${L(lang, 'Help topics', 'ヘルプトピック')}</h3>${help.map((x) => `<a href="${u(lang, `help/${x.id}.html`)}"${x.id === hp.id ? ' class="on" aria-current="page"' : ''}>${esc(tx(lang, x.title))}</a>`).join('')}
<div class="help-contact"><b>${L(lang, 'Need more help?', 'お問い合わせ')}</b><p class="sm">${L(lang, 'Chat 9:00–21:00 · Phone 0120-555-818 (9:00–18:00)', 'チャット 9:00〜21:00・電話 0120-555-818（9:00〜18:00）')}</p></div></nav>`;
  const secs = hp.sections.map((s) => `<section class="hsec" id="${s.id}"><h2>${esc(tx(lang, s.h))}</h2>${s.faq ? s.faq.map((f) => `<details class="faq"><summary>${esc(tx(lang, f.q))}</summary><div>${tx(lang, f.a)}</div></details>`).join('') : s[lang]}</section>`).join('');
  const toc = hp.sections.length > 2 ? `<div class="toc"><b>${L(lang, 'On this page', 'このページの内容')}</b>${hp.sections.map((s) => `<a href="#${s.id}">${esc(tx(lang, s.h))}</a>`).join('')}</div>` : '';
  const body = `<div class="help">${nav}<article class="help-main"><h1>${esc(tx(lang, hp.title))}</h1><p class="lead">${tx(lang, hp.intro)}</p>${toc}${secs}
<div class="helpful"><span>${L(lang, 'Was this information helpful?', 'この情報は役に立ちましたか？')}</span> <button class="btn btn-sm" data-yn>${L(lang, 'Yes', 'はい')}</button> <button class="btn btn-sm" data-yn>${L(lang, 'No', 'いいえ')}</button><span class="thanks sm" hidden>${L(lang, 'Thank you for your feedback.', 'ご意見ありがとうございました。')}</span></div></article></div>`;
  const hc = [['index.html', 'Marketa'], ['help/index.html', L(lang, 'Customer Service', 'カスタマーサービス')]];
  emit(lang, `help/${hp.id}.html`, { title: L(lang, `${hp.title.en} – Marketa Customer Service`, `${hp.title.ja}｜マルケタ カスタマーサービス`), crumbs: hp.id === 'index' ? [hc[0], [null, hc[1][1]]] : [...hc, [null, tx(lang, hp.title)]], body, cls: 'pg-help' });
}

// ---------- cart, checkout, confirmation (filled on the client) ----------
function cartPage(lang) {
  const body = `<div class="cart-page"><div class="cart-main"><h1>${L(lang, 'Shopping Basket', 'ショッピングカート')}</h1><div id="cart-list" data-cart><p class="muted">${L(lang, 'Loading your basket…', 'カートを読み込んでいます…')}</p></div></div>
<aside class="cart-side" id="cart-side"></aside></div>
<section class="sec"><h2>${L(lang, 'Customers who bought items in your basket also bought', 'カートに入っている商品を買った人はこんな商品も買っています')}</h2>${row(lang, ['minori-marmalade-set', 'ampora-slim-10k', 'kagami-mug-pair', 'minori-hand-cream', 'shiroshita-senbei', 'kaze-openear'])}</section>`;
  emit(lang, 'cart.html', { title: L(lang, 'Marketa Shopping Basket', 'ショッピングカート | マルケタ'), body, cls: 'pg-cart' });
}
function checkoutPage(lang) {
  const acc = site.account;
  const body = `<div class="co-head"><h1>${L(lang, 'Checkout', 'ご注文手続き')} <span class="muted" id="co-count"></span></h1><span class="secure">🔒 ${L(lang, 'Secure checkout', 'セキュリティで保護された手続き')}</span></div>
<div class="checkout" data-checkout data-points="${acc.points}"><div class="co-steps">
<section class="co-step" data-step="1"><h2><span>1</span>${L(lang, 'Delivery address', 'お届け先住所')}</h2><div class="co-sum"></div><div class="co-body">
${acc.addresses.map((a, i) => `<label class="addr"><input type="radio" name="addr" value="${a.id}" data-region="${a.region}"${i ? '' : ' checked'}> <span><b>${esc(a[lang].name)}</b> <span class="muted sm">(${esc(a[lang].label)})</span><br>${a[lang].lines.map(esc).join('<br>')}<br><span class="sm muted">${L(lang, 'Phone: 090-•••-4471', '電話番号：090-•••-4471')}</span></span></label>`).join('')}
<label class="addr"><input type="radio" name="addr" value="locker" data-region="harukawa"> <span><b>${L(lang, 'Marketa Locker – Harukawa Central Station', 'マルケタロッカー – 春川中央駅')}</b><br><span class="sm">${L(lang, 'Ground floor, east exit · open 5:00–24:30 · parcels held 3 days · max 45 × 35 × 30 cm, 10 kg', '1階 東口・5:00〜24:30・保管期間3日間・最大45×35×30cm、10kgまで')}</span></span></label>
<details class="sm"><summary>${L(lang, 'Add a new address', '新しい住所を追加')}</summary><div class="form-grid"><label>${L(lang, 'Full name', '氏名')}<input></label><label>${L(lang, 'Postcode', '郵便番号')}<input placeholder="795-0021"></label><label>${L(lang, 'Prefecture', '都道府県')}<input value="${L(lang, 'Minori', 'みのり県')}"></label><label>${L(lang, 'City and street', '市区町村・番地')}<input></label><label>${L(lang, 'Building, room', '建物名・部屋番号')}<input></label><label>${L(lang, 'Phone', '電話番号')}<input></label><p class="muted">${L(lang, 'New addresses are checked before the order ships. Next-day and same-day delivery are not available to a new address on its first order.', '新しい住所は発送前に確認します。初回のご注文では、新しい住所への翌日・当日配送はご利用いただけません。')}</p></div></details>
<button class="btn btn-y" data-next>${L(lang, 'Use this address', 'この住所を使う')}</button></div></section>
<section class="co-step" data-step="2"><h2><span>2</span>${L(lang, 'Delivery options', '配送オプション')}</h2><div class="co-sum"></div><div class="co-body"><div id="co-delivery"></div><button class="btn btn-y" data-next>${L(lang, 'Continue', '続行')}</button></div></section>
<section class="co-step" data-step="3"><h2><span>3</span>${L(lang, 'Payment method', 'お支払い方法')}</h2><div class="co-sum"></div><div class="co-body"><div id="co-pay"></div><button class="btn btn-y" data-next>${L(lang, 'Use this payment method', 'このお支払い方法を使う')}</button></div></section>
<section class="co-step" data-step="4"><h2><span>4</span>${L(lang, 'Review items and place order', '注文内容を確認して確定')}</h2><div class="co-body"><div id="co-review"></div></div></section>
</div><aside class="co-side" id="co-side"></aside></div>`;
  emit(lang, 'checkout.html', { title: L(lang, 'Checkout | Marketa', 'ご注文手続き | マルケタ'), crumbs: [['cart.html', L(lang, 'Basket', 'カート')], [null, L(lang, 'Checkout', 'ご注文手続き')]], body, cls: 'pg-checkout' });
}
function confirmPage(lang) {
  const body = `<div id="confirm" data-confirm><h1>${L(lang, 'Order placed', 'ご注文を承りました')}</h1><p class="muted">${L(lang, 'Loading…', '読み込み中…')}</p></div>
<p class="muted sm">${L(lang, 'This is a mock order on a fictional website. Nothing is charged or delivered.', 'これは架空のウェブサイトでの模擬注文です。実際の請求や配送は行われません。')}</p>
<section class="sec"><h2>${L(lang, 'You might also like', 'こちらもおすすめ')}</h2>${row(lang, ['minori-hand-cream', 'kagami-plate-set', 'ampora-slim-10k', 'shiroshita-senbei', 'yumeguri-onsen-powder', 'kaze-openear'])}</section>`;
  emit(lang, 'confirmation.html', { title: L(lang, 'Thank you, your order has been placed | Marketa', 'ご注文ありがとうございます | マルケタ'), body, cls: 'pg-confirm' });
}

// ---------- orders and tracking ----------
function ordersPage(lang) {
  const acc = site.account;
  const addr = (id) => acc.addresses.find((a) => a.id === id)[lang].name;
  const act = (o, a) => ({
    track: `<a class="btn btn-y btn-full" href="${u(lang, `track.html#${o.track}`)}">${o.track === 'return' ? L(lang, 'Track return', '返品の状況を確認') : L(lang, 'Track package', '配送状況を確認')}</a>`,
    seller: `<a class="btn btn-w btn-full" href="${u(lang, `seller/${P[o.items[0].id].seller}.html`)}">${L(lang, 'Contact seller', '出品者に連絡')}</a>`,
    return: `<a class="btn btn-w btn-full" href="${u(lang, 'help/returns.html')}">${L(lang, 'Return or replace items', '商品の返品・交換')}</a>`,
    review: `<a class="btn btn-w btn-full" href="${u(lang, `p/${o.items[0].id}.html#reviews`)}">${L(lang, 'Write a product review', 'レビューを書く')}</a>`,
    again: `<a class="btn btn-w btn-full" href="${u(lang, `p/${o.items[0].id}.html`)}">${L(lang, 'Buy it again', 'もう一度購入')}</a>`,
    warranty: `<a class="btn btn-w btn-full" href="${u(lang, 'help/returns.html')}">${L(lang, 'Get product support', '製品サポート')}</a>`,
  })[a];
  const body = `<h1>${L(lang, 'Your orders', '注文履歴')}</h1>
<div class="ord-tabs"><span class="on">${L(lang, 'Orders', '注文')}</span><a href="${u(lang, 'track.html')}">${L(lang, 'Track packages', '配送状況')}</a><a href="${u(lang, 'help/returns.html')}">${L(lang, 'Returns', '返品')}</a><a href="${u(lang, 'deals.html')}">${L(lang, 'Buy again', 'もう一度買う')}</a></div>
<p class="sm"><b>${site.orders.length} ${L(lang, 'orders', '件の注文')}</b> ${L(lang, 'placed in the past 3 months', '（過去3か月）')}</p>
<div id="ord-local"></div>
${site.orders.map((o) => `<div class="order${o.cancelled ? ' cancelled' : ''}"><div class="ord-head"><div><small>${L(lang, 'ORDER PLACED', '注文日')}</small>${fmtDate(lang, o.placed)}</div><div><small>${L(lang, 'TOTAL', '合計')}</small>${yen(lang, o.total)}</div><div><small>${L(lang, 'DISPATCH TO', 'お届け先')}</small>${esc(addr(o.shipTo))}</div><div class="ord-no"><small>${L(lang, 'ORDER #', '注文番号')}</small>${o.no}</div></div>
<div class="ord-body"><div><h3 class="${o.cancelled ? 'muted' : o.track === 'ship' ? 'warn' : ''}">${esc(tx(lang, o.status))}</h3><p class="sm">${esc(tx(lang, o.note))}</p>
${o.items.map((it) => { const p = P[it.id]; const v = p.variants.find((x) => x.id === it.v) || defVar(p); return `<div class="ord-item"><img src="${img(p.images[0])}" alt="" loading="lazy"><div><a href="${u(lang, `p/${p.id}.html`)}">${esc(tx(lang, p.title))}</a><div class="sm muted">${p.variants.length > 1 ? `${esc(tx(lang, p.variantLabel) || '')}: ${esc(tx(lang, v.name))} · ` : ''}${L(lang, 'Sold by', '販売：')} ${esc(sellerName(lang, p.seller))}</div><div class="pb-price sm">${yen(lang, it.price)}</div></div></div>`; }).join('')}</div>
<div class="ord-acts">${o.actions.map((a) => act(o, a)).join('')}</div></div></div>`).join('')}`;
  emit(lang, 'orders.html', { title: L(lang, 'Your orders | Marketa', '注文履歴 | マルケタ'), crumbs: [['index.html', 'Marketa'], [null, L(lang, 'Your orders', '注文履歴')]], body, cls: 'pg-orders' });
}
function trackPage(lang) {
  const t = site.tracking;
  const tl = (x) => `<ol class="timeline">${x.steps.map((s) => `<li class="${s.done ? 'done' : ''}${s.warn ? ' warn' : ''}"><b>${esc(s[lang][0])}</b>${s[lang][1] ? `<span class="sm">${esc(s[lang][1])}</span>` : ''}${s.t ? `<time class="muted sm">${fmtDate(lang, s.t.slice(0, 10))} ${s.t.slice(11)}</time>` : ''}</li>`).join('')}</ol>`;
  const item = (no) => { const o = site.orders.find((x) => x.no === no); const p = P[o.items[0].id]; return `<div class="ord-item"><img src="${img(p.images[0])}" alt=""><div><a href="${u(lang, `p/${p.id}.html`)}">${esc(tx(lang, p.short))}</a><div class="sm muted">${L(lang, 'Order', '注文番号')} ${no}</div></div></div>`; };
  const body = `<h1>${L(lang, 'Track your packages', '配送状況の確認')}</h1>
<section class="track" id="ship"><div class="track-head"><div><p class="muted sm">${L(lang, 'Arriving', 'お届け予定')}</p><h2 class="warn">${esc(tx(lang, t.ship.eta))}</h2><p class="sm"><s>${esc(tx(lang, t.ship.was))}</s> ${L(lang, '(original estimate)', '（当初の予定）')}</p></div>${item(t.ship.order)}</div>
<div class="alert">${esc(tx(lang, t.ship.alert))}</div>
<div class="track-cols">${tl(t.ship)}<div class="track-info"><table class="kv"><tr><th>${L(lang, 'Carrier', '配送業者')}</th><td>${esc(tx(lang, t.ship.carrier))}</td></tr><tr><th>${L(lang, 'Tracking ID', '追跡番号')}</th><td>${t.ship.number}</td></tr><tr><th>${L(lang, 'Ship to', 'お届け先')}</th><td>${L(lang, 'Aki Mori, Harukawa 795-0021', '森 亜希様　春川市 795-0021')}</td></tr></table>
<h3>${L(lang, 'Delivery options', '受け取り方法の変更')}</h3><ul class="opts">${t.ship.options[lang].map((x) => `<li><label><input type="radio" name="dopt"> ${esc(x)}</label></li>`).join('')}</ul><button class="btn btn-y btn-sm" data-dopt>${L(lang, 'Save', '保存')}</button><p class="saved sm" hidden>${L(lang, 'Saved. The carrier will confirm by message.', '保存しました。配送業者からメッセージで確認が届きます。')}</p>
<p class="sm"><a href="${u(lang, 'seller/brightdeal.html')}">${L(lang, 'Contact BrightDeal Trading', 'ブライトディール商事に問い合わせる')}</a> · <a href="${u(lang, 'help/returns.html#protection')}">${L(lang, 'Marketa Purchase Protection', 'マルケタ購入者保護')}</a></p></div></div></section>
<section class="track" id="return"><div class="track-head"><div><p class="muted sm">${L(lang, 'Return', '返品')}</p><h2>${esc(tx(lang, t.return.eta))}</h2><p class="sm">${esc(tx(lang, t.return.carrier))} · ${t.return.number}</p></div>${item(t.return.order)}</div>
<div class="track-cols">${tl(t.return)}<div class="track-info"><p class="sm">${L(lang, 'Print the prepaid label from your message from the seller, or show the QR code at the counter. Keep the receipt until the refund arrives.', '出品者からのメッセージにある着払い伝票を印刷するか、店頭でQRコードを提示してください。返金が完了するまで控えを保管してください。')}</p><p class="sm"><a href="${u(lang, 'help/returns.html')}">${L(lang, 'Returns and refunds help', '返品・返金のヘルプ')}</a></p></div></div></section>`;
  emit(lang, 'track.html', { title: L(lang, 'Track your packages | Marketa', '配送状況の確認 | マルケタ'), crumbs: [['index.html', 'Marketa'], ['orders.html', L(lang, 'Your orders', '注文履歴')], [null, L(lang, 'Track packages', '配送状況')]], body, cls: 'pg-track' });
}

// ---------- checks ----------
function validate() {
  const warn = [];
  const ids = new Set(products.map((p) => p.id));
  for (const p of products) {
    for (const k of ['similar', 'fbt', 'alsoViewed']) for (const id of p[k] || []) if (!ids.has(id)) warn.push(`${p.id}: unknown ${k} id ${id}`);
    for (const im of p.images) if (!fs.existsSync(path.join(ROOT, 'assets/img', im + '.jpg'))) warn.push(`${p.id}: missing image ${im}.jpg`);
    for (const v of p.variants) if (!SHIP[v.ship]) warn.push(`${p.id}: bad ship ${v.ship}`);
    const s = p.hist.reduce((a, b) => a + b, 0);
    if (s !== 100) warn.push(`${p.id}: hist sums to ${s}`);
    if (Math.abs(avg(p) - p.rating) > 0.1) warn.push(`${p.id}: hist average ${avg(p)} vs rating ${p.rating}`);
    if (p.reviews.length < 8 || p.reviews.length > 15) warn.push(`${p.id}: ${p.reviews.length} reviews`);
    if (p.qa.length < 3 || p.qa.length > 6) warn.push(`${p.id}: ${p.qa.length} Q&A`);
    for (const rv of p.reviews) if (rv.variant && !p.variants.some((v) => v.id === rv.variant)) warn.push(`${p.id}: review variant ${rv.variant}`);
    if (p.compare.en.length !== clusters[p.cluster].compareRows.en.length) warn.push(`${p.id}: compare length`);
    for (const k of ['title', 'short', 'bullets', 'specs', 'description', 'returns']) if (!p[k]?.ja || !p[k]?.en) warn.push(`${p.id}: missing ${k}`);
  }
  for (const o of site.orders) for (const it of o.items) if (it.v && !P[it.id].variants.some((v) => v.id === it.v)) warn.push(`order ${o.no}: variant ${it.v}`);
  if (warn.length) console.warn('WARN\n  ' + warn.join('\n  '));
}

// ---------- build ----------
for (const lang of LANGS) fs.rmSync(path.join(ROOT, lang), { recursive: true, force: true });
fs.mkdirSync(path.join(ROOT, 'assets/data'), { recursive: true });
for (const p of products) priceHistory(p);
for (const lang of LANGS) {
  homePage(lang);
  for (const p of products) productPage(lang, p);
  for (const c of site.cats) categoryPage(lang, c);
  emit(lang, 'search.html', { title: L(lang, 'Search results | Marketa', '検索結果 | マルケタ'), crumbs: [['index.html', 'Marketa'], [null, L(lang, 'Search', '検索')]], body: listingShell(lang, { head: '<h1 class="sr-h" id="sr-h"></h1>' }), cls: 'pg-list' });
  dealsPage(lang);
  for (const s of sellers) sellerPage(lang, s);
  for (const hp of help) helpPage(lang, hp);
  cartPage(lang);
  checkoutPage(lang);
  confirmPage(lang);
  ordersPage(lang);
  trackPage(lang);
  fs.writeFileSync(path.join(ROOT, `assets/data/index-${lang}.json`), JSON.stringify(indexJson(lang)));
}
for (const pg of pages) { fs.mkdirSync(path.dirname(pg.file), { recursive: true }); fs.writeFileSync(pg.file, pg.html); }
fs.writeFileSync(path.join(ROOT, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/en/index.html"><title>Marketa</title></head><body><a href="/en/index.html">Marketa</a></body></html>\n`);
fs.writeFileSync(path.join(ROOT, 'assets/img/favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#ff7a45"/><path d="M8 12h16l-1.6 11.2a2 2 0 0 1-2 1.8h-8.8a2 2 0 0 1-2-1.8z" fill="#fff"/><path d="M12 12a4 4 0 0 1 8 0" stroke="#fff" stroke-width="2.2" fill="none"/></svg>\n');
if (fs.existsSync(SRC)) fs.writeFileSync(path.join(SRC, 'price-history.json'), JSON.stringify(historyLog, null, 1));
validate();
console.log(`Built ${pages.length} pages (${pages.length / 2} per language), ${products.length} products.`);
