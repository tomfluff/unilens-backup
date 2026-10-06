// Builds the Daily Table study site: node build.mjs
// Reads content/ and writes en/, ja/, assets/data/ and assets/charts/. Node standard library only.
// If the image originals exist (../../../unilens/.local/study-sites-src/recipes), converts new ones to JPEG with ffmpeg.
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { UI, CATEGORIES, COLLECTIONS, ADS, HOME, MEAL_PLAN, ABOUT } from './content/site.mjs';
import { GUIDES, CUTS, RICE_CHART, CUP_CHART, PRODUCE } from './content/guides.mjs';
import { checkRecipe, loadRecipes } from './check.mjs';
import { amount, duration } from './assets/js/units.js';
import * as charts from './charts.mjs';

const ROOT = new URL('./', import.meta.url).pathname;
const SRC = '/home/yotam/projects/unilens/.local/study-sites-src/recipes/';
const LANGS = ['en', 'ja'];
const AUTHOR = { en: 'Natsuki Aoyama', ja: '青山夏希' };

// ---------- images ----------
mkdirSync(ROOT + 'assets/img/thumb', { recursive: true });
if (existsSync(SRC)) {
  for (const f of readdirSync(SRC).filter((f) => f.endsWith('.png'))) {
    const name = f.replace('.png', '');
    const out = `${ROOT}assets/img/${name}.jpg`;
    if (existsSync(out) && statSync(out).mtimeMs > statSync(SRC + f).mtimeMs) continue;
    for (const q of ['5', '7', '9']) { // keep each photo under about 200 KB
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SRC + f, '-vf', "scale='min(1000,iw)':-2", '-q:v', q, out]);
      if (statSync(out).size < 200000) break;
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SRC + f, '-vf', 'scale=480:-2', '-q:v', '6', `${ROOT}assets/img/thumb/${name}.jpg`]);
  }
}
const hasImg = (name) => existsSync(`${ROOT}assets/img/${name}.jpg`);

// ---------- recipes ----------
const recipes = loadRecipes();
const problems = recipes.flatMap((r) => checkRecipe(r, r._file));
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
for (const r of recipes) {
  r.total = r.times.prep + r.times.cook + (r.times.extra || 0);
  if (!hasImg(r.image)) console.warn(`warning: no image yet for ${r.slug}`);
}
const R = Object.fromEntries(recipes.map((r) => [r.slug, r]));
const inCategory = (r, c) => r.categories.includes(c) || (c === 'vegetarian' && r.diet.includes('vegetarian'));
const collectionRecipes = (c) => (c.slugs ? c.slugs.map((s) => R[s]).filter(Boolean) : recipes.filter(c.pick));
const popular = [...recipes].sort((a, b) => b.ratings - a.ratings).slice(0, 6);
const seasonal = ['kabocha-soup', 'kinoko-takikomi-gohan', 'yuzu-kosho', 'sheet-pan-miso-chicken', 'daigaku-imo', 'kabocha-pudding', 'minato-nabe', 'autumn-vegetable-curry'].map((s) => R[s]).filter(Boolean);

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s) => esc(String(s).replace(/<[^>]+>/g, '').replace(/\{\{(\w+):([\w-]+)\}\}/g, ''));
const url = (lang, path) => `/${lang}/${path.replace(/index\.html$/, '')}`;
const recipeUrl = (lang, slug) => url(lang, `recipes/${slug}.html`);
const guideUrl = (lang, slug) => url(lang, `guides/${slug}.html`);
function links(s, lang) {
  return String(s)
    .replace(/href="\{\{(recipe|guide):([\w-]+)\}\}"/g, (_, t, s2) => `href="${t === 'recipe' ? recipeUrl(lang, s2) : guideUrl(lang, s2)}"`)
    .replace(/\{\{(recipe|guide):([\w-]+)\}\}/g, (_, t, s2) => t === 'recipe'
      ? `<a href="${recipeUrl(lang, s2)}">${R[s2]?.[lang].title ?? s2}</a>`
      : `<a href="${guideUrl(lang, s2)}">${GUIDES[s2][lang].title}</a>`);
}
function fmtDate(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number);
  if (lang === 'ja') return `${y}年${m}月${d}日`;
  return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${d}, ${y}`;
}
const stars = (r, cls = '') => `<span class="stars ${cls}" style="--r:${r}" role="img" aria-label="${r} / 5">★★★★★</span>`;
const icon = {
  search: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  list: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6h15l-2 9H8L6 3H3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.6" fill="currentColor"/><circle cx="18" cy="20" r="1.6" fill="currentColor"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  heart: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  print: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 3h12v18l-6-4-6 4z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4v15m-6-6 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  timer: '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4M9 2h6" stroke="currentColor" stroke-width="2"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="2"/></svg>',
  prev: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>',
  share: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="18" cy="5" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="19" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" stroke="currentColor" stroke-width="2"/></svg>',
};
const LOGO = '<svg class="logo-mark" viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><circle cx="20" cy="22" r="15" fill="#fff" stroke="#c8553d" stroke-width="3"/><circle cx="20" cy="22" r="8" fill="none" stroke="#e8b04b" stroke-width="2.5"/><path d="M29 3 21 17M34 6 24 18" stroke="#3d3a35" stroke-width="2.4" stroke-linecap="round"/></svg>';
const SOCIAL = ['M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.5-2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  'M12 3a9 9 0 0 0-3.3 17.4c0-.8 0-1.8.2-2.6l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.1-2.4 3.1-5.3 0-2.2-1.5-3.8-4.1-3.8-3 0-4.8 2.2-4.8 4.7 0 .9.3 1.5.7 2l-.3 1c-.6-.3-1.6-1.3-1.6-3.2C6.6 8.6 9 6 13.1 6c3.4 0 5.6 2.4 5.6 5.1 0 3.6-2 6.3-4.9 6.3-1 0-1.9-.5-2.2-1.1l-.6 2.4c-.2.8-.7 1.7-1 2.3A9 9 0 1 0 12 3z',
  'M4 4h4l4 6 4-6h4l-6 8.5L20 20h-4l-4-6-4 6H4l6-7.5z',
  'M10 8.5v7l6-3.5zM3 12c0-3 .3-4.6.8-5.4.6-.9 1.6-1.1 8.2-1.1s7.6.2 8.2 1.1c.5.8.8 2.4.8 5.4s-.3 4.6-.8 5.4c-.6.9-1.6 1.1-8.2 1.1s-7.6-.2-8.2-1.1C3.3 16.6 3 15 3 12z'];

// ---------- page frame ----------
function header(lang, path) {
  const t = UI[lang], other = lang === 'en' ? 'ja' : 'en';
  const catLinks = Object.entries(CATEGORIES).map(([k, c]) => `<li><a href="${url(lang, `category/${k}.html`)}">${c[lang].name}</a></li>`).join('');
  const colLinks = Object.entries(COLLECTIONS).map(([k, c]) => `<li><a href="${url(lang, `collections/${k}.html`)}">${c[lang].name}</a></li>`).join('');
  const guideLinks = Object.entries(GUIDES).map(([k, g]) => `<li><a href="${guideUrl(lang, k)}">${g[lang].title.split(/[:：(（,]/)[0]}</a></li>`).join('');
  return `<div class="promo"><a href="${url(lang, 'collections/lantern-festival-snacks.html')}">${t.promo}</a></div>
<header class="site-header">
  <div class="hwrap">
    <button class="nav-toggle icon-btn" aria-label="${t.menu}">${icon.menu}</button>
    <a class="logo" href="${url(lang, 'index.html')}">${LOGO}<span class="logo-text">${lang === 'en' ? 'Daily<b>Table</b>' : 'デイリー<b>テーブル</b>'}</span></a>
    <nav class="main-nav">
      <ul>
        <li class="has-menu"><a href="${url(lang, 'recipes/index.html')}">${t.recipes}</a><div class="menu"><ul>${catLinks}<li class="menu-all"><a href="${url(lang, 'recipes/index.html')}">${t.allRecipes} →</a></li></ul></div></li>
        <li class="has-menu"><a href="${url(lang, 'collections/index.html')}">${t.collections}</a><div class="menu"><ul>${colLinks}</ul></div></li>
        <li class="has-menu"><a href="${url(lang, 'guides/index.html')}">${t.guides}</a><div class="menu"><ul>${guideLinks}</ul></div></li>
        <li><a href="${url(lang, 'meal-plan.html')}">${t.mealPlan}</a></li>
        <li><a href="${url(lang, 'about.html')}">${t.about}</a></li>
      </ul>
    </nav>
    <form class="hsearch" action="${url(lang, 'search.html')}" role="search"><input type="search" name="q" placeholder="${t.searchPlaceholder}"><button aria-label="${t.search}">${icon.search}</button></form>
    <a class="icon-btn list-btn" href="${url(lang, 'shopping-list.html')}" title="${t.saved}">${icon.list}<span class="badge" data-list-count hidden></span></a>
    <a class="lang-switch" href="${url(other, path)}" hreflang="${other}" lang="${other}">${t.langName}</a>
  </div>
</header>`;
}

function footer(lang) {
  const t = UI[lang];
  const col = (title, items) => `<div class="fcol"><h4>${title}</h4><ul>${items.map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>`;
  const ja = lang === 'ja';
  return `<footer class="site-footer">
  <div class="fnews"><div class="wrap"><div><strong>${t.newsletterTitle}</strong><span>${t.newsletterText}</span></div><form class="nl-form"><input type="email" placeholder="${t.emailPlaceholder}" required><button>${t.subscribe}</button></form></div></div>
  <div class="wrap fgrid">
    <div class="fcol fabout"><a class="logo" href="${url(lang, 'index.html')}">${LOGO}<span class="logo-text">${ja ? 'デイリー<b>テーブル</b>' : 'Daily<b>Table</b>'}</span></a><p>${t.tagline}</p>
      <div class="social">${SOCIAL.map((d) => `<a href="${url(lang, 'about.html')}#contact" class="icon-btn"><svg viewBox="0 0 24 24" width="18" height="18"><path d="${d}" fill="currentColor"/></svg></a>`).join('')}</div></div>
    ${col(t.recipes, [...Object.entries(CATEGORIES).map(([k, c]) => [c[lang].name, url(lang, `category/${k}.html`)]), [t.allRecipes, url(lang, 'recipes/index.html')]])}
    ${col(t.guides, Object.entries(GUIDES).map(([k, g]) => [g[lang].title.split(/[:：(（,]/)[0], guideUrl(lang, k)]))}
    ${col(t.collections, Object.entries(COLLECTIONS).map(([k, c]) => [c[lang].name, url(lang, `collections/${k}.html`)]))}
    ${col(t.siteName, [[t.about, url(lang, 'about.html')], [t.mealPlan, url(lang, 'meal-plan.html')], [t.shoppingList, url(lang, 'shopping-list.html')], [t.search, url(lang, 'search.html')], [ja ? '広告について' : 'Advertise', url(lang, 'about.html') + '#advertising'], [ja ? 'プライバシー' : 'Privacy policy', url(lang, 'about.html') + '#privacy'], [ja ? 'お問い合わせ' : 'Contact', url(lang, 'about.html') + '#contact']])}
  </div>
  <div class="fbottom"><div class="wrap"><span>© 2017–2026 Daily Table · ${ja ? 'みのり県春川市' : 'Harukawa, Minori Prefecture'}</span><span class="research">${t.footerNote}</span></div></div>
</footer>`;
}

function chrome(lang) {
  const t = UI[lang];
  return `<div class="cookie" hidden><p>${t.cookieText}</p><div><button class="btn btn-small btn-ghost" data-cookie="settings">${t.cookieSettings}</button><button class="btn btn-small" data-cookie="accept">${t.cookieAccept}</button></div></div>
<div class="nl-pop" hidden><div class="nl-box"><button class="nl-close icon-btn" aria-label="close">${icon.close}</button><div class="nl-art"><img src="/assets/img/thumb/yuzu-pound-cake.jpg" alt=""></div><div class="nl-body"><h3>${t.newsletterPopTitle}</h3><p>${t.newsletterPopText}</p><form class="nl-form"><input type="email" placeholder="${t.emailPlaceholder}" required><button>${t.subscribe}</button></form><button class="nl-no">${t.noThanks}</button></div></div></div>
<div class="timers" aria-live="polite"></div>`;
}

function page(lang, path, { title, desc = '', body, crumbs, scripts = [], cls = '' }) {
  const t = UI[lang], other = lang === 'en' ? 'ja' : 'en';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${plain(title)}${path === 'index.html' ? '' : ` | ${t.siteName}`}</title>
<meta name="description" content="${plain(desc)}">
<link rel="alternate" hreflang="${other}" href="${url(other, path)}">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/site.css">
</head>
<body class="${cls}">
${header(lang, path)}
<div class="wrap page">
${crumbs ? `<nav class="crumbs">${[[t.breadcrumbHome, url(lang, 'index.html')], ...crumbs].map(([l, h], i, a) => (i === a.length - 1 ? `<span>${l}</span>` : `<a href="${h}">${l}</a>`)).join(' <span class="sep">›</span> ')}</nav>` : ''}
${body}
</div>
${footer(lang)}
${chrome(lang)}
<script src="/assets/js/site.js" defer></script>
${scripts.map((s) => `<script type="module" src="${s}"></script>`).join('\n')}
<script src="/unilens.js"></script>
<script>UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })</script>
</body>
</html>
`;
}

// ---------- shared pieces ----------
let adTurn = 0;
function ad(lang, size = 'inline') {
  const a = ADS[adTurn++ % ADS.length], t = UI[lang];
  return `<aside class="ad ad-${size} ad-${a.kind}"><span class="ad-label">${t.ad}</span><button class="ad-x" aria-label="${t.adClose}">${icon.close}</button>
<a class="ad-creative" href="${url(lang, 'about.html')}#advertising"><span class="ad-art"></span><span class="ad-copy"><strong>${a[lang].title}</strong><span>${a[lang].text}</span><span class="ad-cta">${a[lang].cta}</span></span></a></aside>`;
}

function card(r, lang, { small = false } = {}) {
  const t = UI[lang];
  const cat = CATEGORIES[r.categories[0]][lang].name;
  return `<article class="card${small ? ' card-small' : ''}" data-cats="${r.categories.join(' ')}${r.diet.includes('vegetarian') && !r.categories.includes('vegetarian') ? ' vegetarian' : ''}">
<a href="${recipeUrl(lang, r.slug)}"><img src="/assets/img/thumb/${r.image}.jpg" alt="${plain(r[lang].title)}" loading="lazy" width="480" height="320">
<div class="card-body"><span class="card-cat">${cat}</span><h3>${r[lang].title}</h3>
<div class="meta">${stars(r.rating, 'small')} <span class="count">(${r.ratings.toLocaleString('en')})</span><span class="dot">·</span><span class="time">${icon.clock} ${duration(r.total, lang)}</span></div></div></a>
<button class="save-btn icon-btn" data-add="${r.slug}" title="${t.addList}">${icon.heart}</button></article>`;
}
const grid = (rs, lang, cls = '') => `<div class="cards ${cls}">${rs.map((r) => card(r, lang)).join('')}</div>`;

function sidebar(lang) {
  const t = UI[lang];
  return `<aside class="sidebar">
<div class="side-box author-box"><div class="avatar-art" aria-hidden="true"><svg viewBox="0 0 80 80" width="80" height="80"><circle cx="40" cy="40" r="40" fill="#f3e3d3"/><circle cx="40" cy="46" r="20" fill="#fff" stroke="#c8553d" stroke-width="3"/><circle cx="40" cy="46" r="10" fill="none" stroke="#e8b04b" stroke-width="3"/><path d="M54 14 44 34M60 18 48 36" stroke="#3d3a35" stroke-width="3" stroke-linecap="round"/></svg></div>
<h3>${t.authorCardTitle}</h3><p>${t.authorCardText}</p><a class="more" href="${url(lang, 'about.html')}">${t.readMore} →</a></div>
${ad(lang, 'box')}
<div class="side-box"><h3>${t.popular}</h3><ol class="pop-list">${popular.slice(0, 5).map((r) => `<li><a href="${recipeUrl(lang, r.slug)}"><img src="/assets/img/thumb/${r.image}.jpg" alt="" loading="lazy"><span>${r[lang].title}<small>${stars(r.rating, 'small')} ${r.rating}</small></span></a></li>`).join('')}</ol></div>
<div class="side-box nl-side"><h3>${t.newsletterTitle}</h3><p>${t.newsletterText}</p><form class="nl-form"><input type="email" placeholder="${t.emailPlaceholder}" required><button>${t.subscribe}</button></form></div>
<div class="sticky-ad">${ad(lang, 'tall')}</div>
</aside>`;
}

// ---------- recipe page ----------
function ratingDistribution(avg, count) {
  let lo = 0, hi = 5, w;
  for (let i = 0; i < 40; i++) {
    const l = (lo + hi) / 2;
    w = [1, 2, 3, 4, 5].map((k) => Math.exp(-(5 - k) * l));
    const mean = w.reduce((s, x, i2) => s + x * (i2 + 1), 0) / w.reduce((s, x) => s + x, 0);
    if (mean > avg) lo = l; else hi = l;
  }
  const sum = w.reduce((s, x) => s + x, 0);
  return w.map((x) => Math.round((x / sum) * count)).reverse(); // 5 stars first
}

function intro(r, lang) {
  let paras = 0;
  return r[lang].intro.map((b) => {
    if (typeof b === 'string') {
      paras++;
      const html = `<p>${links(b, lang)}</p>`;
      if (paras === 2) return html + ad(lang);
      if (paras === 5) return html + `<figure class="intro-img"><img src="/assets/img/${r.image}.jpg" alt="${plain(r[lang].title)}" loading="lazy"></figure>` + ad(lang);
      return html;
    }
    if (b.h) return `<h2>${b.h}</h2>`;
    if (b.ul) return `<ul>${b.ul.map((x) => `<li>${links(x, lang)}</li>`).join('')}</ul>`;
    return '';
  }).join('\n');
}

function ingredientsHtml(r, lang) {
  let i = 0;
  return r.ingredients.map((g) => `${g.group ? `<h4 class="ing-group">${g.group[lang]}</h4>` : ''}<ul class="ings">${g.items.map((it) => {
    const amt = `<span class="ing-amt" data-i="${i++}">${amount(it, lang)}</span>`;
    const name = `<span class="ing-name">${links(it[lang], lang)}</span>`;
    return `<li><label><input type="checkbox">${lang === 'ja' ? `${name}${amt}` : `${amt} ${name}`}</label></li>`;
  }).join('')}</ul>`).join('');
}

function recipePage(r, lang) {
  const t = UI[lang], L = r[lang];
  const cat = r.categories[0];
  const unit = r.servingsUnit?.[lang] ?? t.defaultUnit;
  const dist = ratingDistribution(r.rating, r.ratings);
  const comments = r.comments;
  const times = [[t.prep, r.times.prep], [t.cook, r.times.cook], ...(r.times.extra ? [[r.times.extraLabel[lang], r.times.extra]] : []), [t.total, r.total]];
  const data = { slug: r.slug, servings: r.servings, items: r.ingredients.flatMap((g) => g.items.map(({ q, q2, u, us, jaU, free }) => ({ q, q2, u, us, jaU, free }))) };
  const nutri = Object.entries(t.n).map(([k, label]) => `<tr><th>${label}</th><td>${r.nutrition[k]}${k === 'calories' ? ' kcal' : ['cholesterol', 'sodium'].includes(k) ? ' mg' : ' g'}</td></tr>`).join('');
  const steps = r.steps.map((s, i) => `<li id="step-${i + 1}"><p>${links(s[lang], lang)}</p>${s.timer ? `<button class="timer-btn" data-min="${s.timer}" data-label="${esc(L.title)} · ${lang === 'ja' ? `手順${i + 1}` : `Step ${i + 1}`}">${icon.timer} ${duration(s.timer, lang)}</button>` : ''}${s.img && hasImg(s.img) ? `<img class="step-img" src="/assets/img/${s.img}.jpg" alt="" loading="lazy">` : ''}</li>`).join('');
  const comment = (c, i) => `<li class="comment" id="comment-${i + 1}"><div class="c-head"><span class="c-avatar">${esc(c.name[lang].trim()[0])}</span><b>${esc(c.name[lang])}</b>${c.stars ? stars(c.stars, 'small') : ''}<time datetime="${c.date}">${fmtDate(c.date, lang)}</time></div><p>${links(c[lang], lang)}</p><a class="c-reply" href="#respond">${t.reply}</a>
${c.reply ? `<ul class="children"><li class="comment by-author"><div class="c-head"><span class="c-avatar author">N</span><b>${AUTHOR[lang]}</b><span class="author-badge">${t.authorBadge}</span></div><p>${links(c.reply[lang], lang)}</p></li></ul>` : ''}</li>`;
  const ja = lang === 'ja';
  const body = `<div class="layout">
<article class="post">
<header class="post-head">
  <h1>${L.title}</h1>
  <div class="post-meta"><a href="#reviews" class="rating-link">${stars(r.rating)} <b>${r.rating}</b> ${ja ? `（${r.ratings.toLocaleString('en')}${t.ratings}）` : `from ${r.ratings.toLocaleString('en')} ${t.ratings}`}</a>
  <span>${ja ? `${AUTHOR.ja}` : `${t.by} <a href="${url(lang, 'about.html')}">${AUTHOR.en}</a>`}</span>
  <span>${t.updated} ${fmtDate(r.updated, lang)}</span>
  <a href="#comments">${comments.length} ${t.comments}</a></div>
  <div class="post-actions"><a class="btn" href="#recipe">${icon.down} ${t.jump}</a><button class="btn btn-ghost" data-print>${icon.print} ${t.print}</button><button class="btn btn-ghost" data-add="${r.slug}">${icon.list} ${t.addList}</button><button class="icon-btn share-btn" title="${t.share}">${icon.share}</button></div>
  <p class="disclosure">${t.disclosure}</p>
</header>
<p class="lede">${L.teaser}</p>
<figure class="hero"><img src="/assets/img/${r.image}.jpg" alt="${plain(L.title)}" width="1000" height="667"></figure>
<div class="intro">${intro(r, lang)}</div>
<a class="jump-inline" href="#recipe">${icon.down} ${t.jump}</a>

<section class="recipe-card" id="recipe">
  <div class="rc-head">
    <img class="rc-img" src="/assets/img/thumb/${r.image}.jpg" alt="">
    <div><h2>${L.title}</h2>
    <div class="rc-rating">${stars(r.rating)} <span>${r.rating} ${ja ? `（${r.ratings.toLocaleString('en')}${t.ratings}）` : `from ${r.ratings.toLocaleString('en')} ${t.ratings}`}</span></div>
    <p class="rc-teaser">${L.teaser}</p>
    <div class="rc-buttons"><button class="btn btn-small" data-print>${icon.print} ${t.print}</button><button class="btn btn-small btn-ghost" data-pin>${icon.pin} ${t.pin}</button><button class="btn btn-small btn-ghost" data-add="${r.slug}">${icon.list} ${t.addList}</button></div></div>
  </div>
  <dl class="rc-times">${times.map(([l, m]) => `<div><dt>${l}</dt><dd>${duration(m, lang)}</dd></div>`).join('')}</dl>
  <dl class="rc-facts">
    <div><dt>${t.course}</dt><dd>${t.courses[r.course]}</dd></div>
    <div><dt>${t.cuisine}</dt><dd>${t.cuisines[r.cuisine]}</dd></div>
    <div><dt>${t.difficulty}</dt><dd>${t.difficulties[r.difficulty]}</dd></div>
    <div><dt>${t.servings}</dt><dd class="scaler"><button class="sc-minus icon-btn" aria-label="−">−</button><input class="sc-input" type="number" min="1" max="48" value="${r.servings}" data-base="${r.servings}"><button class="sc-plus icon-btn" aria-label="+">+</button> <span>${unit}</span></dd></div>
    <div><dt>${t.calories}</dt><dd>${r.nutrition.calories} kcal</dd></div>
    <div><dt>${t.author}</dt><dd>${AUTHOR[lang]}</dd></div>
  </dl>
  ${r.diet.length ? `<p class="diet-tags">${r.diet.map((d) => `<span class="tag">${t.diets[d]}</span>`).join('')}</p>` : ''}
  <label class="cook-mode"><input type="checkbox" data-cookmode><span class="switch"></span> <b>${t.cookMode}</b> <small>${t.cookModeHelp}</small></label>

  <div class="rc-section rc-ings">
    <div class="rc-sec-head"><h3>${t.ingredients}</h3>
      <div class="mult"><button data-mult="1" class="on">1x</button><button data-mult="2">2x</button><button data-mult="3">3x</button></div>
      <div class="units" role="group"><button data-units="metric" class="on">${t.metric}</button><button data-units="us">${t.us}</button></div></div>
    ${ingredientsHtml(r, lang)}
    <p class="scale-note" hidden>${t.scaleNote}</p>
  </div>
  <div class="rc-section"><h3>${t.equipment}</h3><ul class="equip">${L.equipment.map((e) => `<li>${links(e, lang)}</li>`).join('')}</ul></div>
  <div class="rc-section"><h3>${t.instructions}</h3><ol class="steps">${steps}</ol></div>
  <div class="rc-section"><h3>${t.notes}</h3><ul class="notes">${L.notes.map((n) => `<li>${links(n, lang)}</li>`).join('')}</ul></div>
  <div class="rc-section"><h3>${t.subs}</h3><table class="subs"><thead><tr><th>${t.subFrom}</th><th>${t.subTo}</th></tr></thead><tbody>${L.subs.map(([a, b]) => `<tr><td>${a}</td><td>${links(b, lang)}</td></tr>`).join('')}</tbody></table></div>
  <div class="rc-section rc-two"><div><h3>${t.makeAhead}</h3><p>${links(L.makeAhead, lang)}</p></div><div><h3>${t.storage}</h3><p>${links(L.storage, lang)}</p></div></div>
  <div class="rc-section rc-nutrition"><h3>${t.nutrition} <small>(${t.perServing})</small></h3>
    <div class="nutri-wrap"><table class="nutri">${nutri}</table><img class="macro-chart" src="/assets/charts/macros-${r.slug}-${lang}.svg" alt="" width="320" height="200"></div>
    <p class="fine">${t.nutriNote}</p></div>
  <div class="rc-foot"><strong>${t.triedIt}</strong> ${t.triedText}</div>
</section>
${ad(lang)}
<section class="reviews" id="reviews">
  <h2>${ja ? 'みんなの評価' : 'Ratings & reviews'}</h2>
  <div class="rv-wrap"><div class="rv-avg"><b>${r.rating}</b>${stars(r.rating)}<span>${r.ratings.toLocaleString('en')} ${t.ratings}</span></div>
  <ul class="rv-bars">${dist.map((n, i) => `<li><span>${5 - i}★</span><span class="bar"><i style="width:${Math.round((n / r.ratings) * 100)}%"></i></span><span class="n">${n.toLocaleString('en')}</span></li>`).join('')}</ul>
  <div class="rv-rate"><span>${t.rateThis}</span><div class="rate-stars">${[1, 2, 3, 4, 5].map((n) => `<button data-rate="${n}" aria-label="${n}">★</button>`).join('')}</div><p class="rate-thanks" hidden>${t.thanksRating}</p></div></div>
</section>
<section class="comments" id="comments">
  <h2>${comments.length} ${t.comments}</h2>
  <ol class="comment-list">${comments.map(comment).join('')}</ol>
  <div class="respond" id="respond"><h3>${t.leaveComment}</h3><form class="comment-form"><div class="rate-stars small">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-rate="${n}" aria-label="${n}">★</button>`).join('')}</div><textarea rows="5" placeholder="${t.commentText}" required></textarea><div class="row"><input placeholder="${t.commentName}" required><input type="email" placeholder="${t.commentEmail}"></div><button class="btn">${t.commentSubmit}</button><p class="c-thanks" hidden>${t.commentThanks}</p></form></div>
</section>
<section class="related"><h2>${t.related}</h2>${grid(r.related.map((s) => R[s]).filter(Boolean), lang, 'cards-3')}</section>
</article>
${sidebar(lang)}
</div>
<script type="application/json" id="recipe-data">${JSON.stringify(data)}</script>`;
  return page(lang, `recipes/${r.slug}.html`, {
    title: L.title, desc: L.teaser, body, cls: 'recipe-page', scripts: ['/assets/js/recipe.js'],
    crumbs: [[t.recipes, url(lang, 'recipes/index.html')], [CATEGORIES[cat][lang].name, url(lang, `category/${cat}.html`)], [L.title.split(/[(（]/)[0].trim()]],
  });
}

// ---------- guides ----------
const CHART_ALT = { 'cup-weights': 'chart', 'rice-water': '', 'oven-scale': '', 'produce-calendar': 'calendar', 'dashi-timeline': '' };
function block(b, lang) {
  if (b.h) return `<h2>${b.h}</h2>`;
  if (b.p) return `<p>${links(b.p, lang)}</p>`;
  if (b.tip) return `<div class="tip"><strong>${lang === 'ja' ? 'ポイント' : 'Tip'}</strong> ${links(b.tip, lang)}</div>`;
  if (b.ul) return `<ul>${b.ul.map((x) => `<li>${links(x, lang)}</li>`).join('')}</ul>`;
  if (b.ol) return `<ol class="guide-steps">${b.ol.map((x) => `<li>${links(x, lang)}</li>`).join('')}</ol>`;
  if (b.img) return `<figure class="guide-img"><img src="/assets/img/${b.img}.jpg" alt="" loading="lazy"><figcaption>${b.caption}</figcaption></figure>`;
  if (b.chart) return `<figure class="chart"><img src="/assets/charts/${b.chart}-${lang}.svg" alt="${CHART_ALT[b.chart]}">${b.caption ? `<figcaption>${b.caption}</figcaption>` : ''}</figure>`;
  if (b.cuts) return `<div class="cuts">${CUTS.map((c) => `<figure class="cut" id="${c.id}"><img src="/assets/charts/cut-${c.id}.svg" alt="diagram" width="240" height="150"><figcaption><b>${c[lang][0]}</b> <i>${c[lang][1]}</i><span>${c[lang][2]}</span></figcaption></figure>`).join('')}</div>`;
  if (b.table) {
    const rows = b.table.cutsTable ? CUTS.map((c) => [c[lang][0], c[lang][1], c[lang][2], c[lang][3]]) : b.table.rows;
    return `<div class="table-scroll"><table class="data"><thead><tr>${b.table.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((c, i) => (i === 0 ? `<th>${links(c, lang)}</th>` : `<td>${links(c, lang)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  return '';
}

function guidePage(slug, lang) {
  const g = GUIDES[slug][lang], t = UI[lang];
  const others = Object.entries(GUIDES).filter(([k]) => k !== slug);
  const body = `<div class="layout"><article class="post guide">
<h1>${g.title}</h1><p class="post-meta"><span>${lang === 'ja' ? AUTHOR.ja : `${t.by} ${AUTHOR.en}`}</span><span>${t.updated} ${fmtDate('2026-09-12', lang)}</span></p>
<p class="lede">${g.teaser}</p>
${g.body.map((b, i) => block(b, lang) + (i === 3 ? ad(lang) : '')).join('\n')}
<section class="related"><h2>${t.guides}</h2><ul class="guide-links">${others.map(([k, o]) => `<li><a href="${guideUrl(lang, k)}">${o[lang].title}</a></li>`).join('')}</ul></section>
</article>${sidebar(lang)}</div>`;
  return page(lang, `guides/${slug}.html`, { title: g.title, desc: g.teaser, body, crumbs: [[t.guides, url(lang, 'guides/index.html')], [g.title.split(/[:：(（,]/)[0]]] });
}

function guideThumb(slug, lang) {
  const g = GUIDES[slug];
  if (g.image && hasImg(g.image)) return `<img src="/assets/img/thumb/${g.image}.jpg" alt="" loading="lazy">`;
  if (g.chartThumb) return `<img class="chart-thumb" src="/assets/charts/${g.chartThumb.startsWith('cut-') ? g.chartThumb : `${g.chartThumb}-${lang}`}.svg" alt="" loading="lazy">`;
  return `<img src="/assets/img/thumb/kinoko-takikomi-gohan.jpg" alt="" loading="lazy">`;
}

function guidesIndex(lang) {
  const t = UI[lang];
  const body = `<h1>${t.guides}</h1><p class="lede">${t.guidesIntro}</p>
<div class="cards guide-cards">${Object.entries(GUIDES).map(([k, g]) => `<article class="card"><a href="${guideUrl(lang, k)}">${guideThumb(k, lang)}<div class="card-body"><h3>${g[lang].title}</h3><p>${g[lang].teaser}</p></div></a></article>`).join('')}</div>
${ad(lang, 'wide')}`;
  return page(lang, 'guides/index.html', { title: t.guides, desc: t.guidesIntro, body, crumbs: [[t.guides]] });
}

// ---------- listings ----------
function categoryPage(key, lang) {
  const c = CATEGORIES[key][lang], t = UI[lang];
  const rs = recipes.filter((r) => inCategory(r, key)).sort((a, b) => b.rating - a.rating);
  const body = `<div class="cat-hero" style="background-image:url(/assets/img/${CATEGORIES[key].image}.jpg)"><div><h1>${c.name}</h1><p>${c.text}</p><span>${rs.length} ${t.recipesCount}</span></div></div>
<nav class="cat-pills">${Object.entries(CATEGORIES).map(([k, o]) => `<a href="${url(lang, `category/${k}.html`)}" class="${k === key ? 'on' : ''}">${o[lang].name}</a>`).join('')}</nav>
${grid(rs, lang)}${ad(lang, 'wide')}`;
  return page(lang, `category/${key}.html`, { title: c.name, desc: c.text, body, crumbs: [[t.recipes, url(lang, 'recipes/index.html')], [c.name]] });
}

function recipesIndex(lang) {
  const t = UI[lang];
  const tabs = [['all', lang === 'ja' ? 'すべて' : 'All'], ...Object.entries(CATEGORIES).map(([k, c]) => [k, c[lang].name])];
  const body = `<h1>${t.allRecipes}</h1><p class="lede">${t.allRecipesIntro}</p>
<div class="tabs" role="tablist">${tabs.map(([k, l], i) => `<button role="tab" data-tab="${k}" aria-selected="${i === 0}">${l}</button>`).join('')}</div>
${grid([...recipes].sort((a, b) => a[lang].title.localeCompare(b[lang].title, lang)), lang, 'filterable')}${ad(lang, 'wide')}`;
  return page(lang, 'recipes/index.html', { title: t.allRecipes, desc: t.allRecipesIntro, body, crumbs: [[t.recipes]] });
}

function collectionPage(key, lang) {
  const c = COLLECTIONS[key], L = c[lang], t = UI[lang];
  const rs = collectionRecipes(c);
  const body = `<div class="layout"><article class="post">
<h1>${L.name}</h1><p class="lede">${L.teaser}</p>
<figure class="hero"><img src="/assets/img/${c.image}.jpg" alt="${plain(L.name)}"></figure>
${L.intro.map((p) => `<p>${p}</p>`).join('')}
<div class="tip"><strong>${lang === 'ja' ? 'コツ' : 'Tips'}</strong><ul>${L.tips.map((x) => `<li>${x}</li>`).join('')}</ul></div>
<h2>${rs.length} ${lang === 'ja' ? '品のレシピ' : 'recipes'}</h2>
${grid(rs, lang, 'cards-2')}
<p><button class="btn" data-add-all="${rs.map((r) => r.slug).join(',')}">${icon.list} ${lang === 'ja' ? 'すべて買い物リストに追加' : 'Add all to my shopping list'}</button></p>
</article>${sidebar(lang)}</div>`;
  return page(lang, `collections/${key}.html`, { title: L.name, desc: L.teaser, body, crumbs: [[t.collections, url(lang, 'collections/index.html')], [L.name]] });
}

function collectionsIndex(lang) {
  const t = UI[lang];
  const body = `<h1>${t.collections}</h1><p class="lede">${t.collectionsIntro}</p>
<div class="cards collection-cards">${Object.entries(COLLECTIONS).map(([k, c]) => `<article class="card"><a href="${url(lang, `collections/${k}.html`)}"><img src="/assets/img/thumb/${c.image}.jpg" alt="" loading="lazy"><div class="card-body"><h3>${c[lang].name}</h3><p>${c[lang].teaser}</p><span class="count">${collectionRecipes(c).length} ${t.recipesCount}</span></div></a></article>`).join('')}</div>
${ad(lang, 'wide')}`;
  return page(lang, 'collections/index.html', { title: t.collections, desc: t.collectionsIntro, body, crumbs: [[t.collections]] });
}

// ---------- home ----------
function home(lang) {
  const t = UI[lang], H = HOME[lang];
  const body = `<section class="carousel" aria-roledescription="carousel">
<div class="slides">${H.slides.map((s, i) => `<div class="slide${i === 0 ? ' on' : ''}" style="background-image:url(/assets/img/${s.image}.jpg)"><div class="slide-text"><span class="kicker">${s.kicker}</span><h2>${s.title}</h2><p>${s.text}</p><a class="btn" href="${s.href}">${s.cta}</a></div></div>`).join('')}</div>
<button class="car-prev icon-btn">${icon.prev}</button><button class="car-next icon-btn">${icon.next}</button>
<div class="car-dots">${H.slides.map((_, i) => `<button class="${i === 0 ? 'on' : ''}" data-slide="${i}"></button>`).join('')}</div>
</section>
<section class="home-sec"><div class="sec-head"><h2>${H.seasonalTitle}</h2><p>${H.seasonalText}</p><a href="${url(lang, 'collections/make-ahead-autumn.html')}">${t.viewAll} →</a></div>${grid(seasonal.slice(0, 8), lang, 'cards-4')}</section>
<section class="home-sec"><div class="sec-head"><h2>${H.categoriesTitle}</h2></div><div class="cat-circles">${Object.entries(CATEGORIES).map(([k, c]) => `<a href="${url(lang, `category/${k}.html`)}"><img src="/assets/img/thumb/${c.image}.jpg" alt="" loading="lazy"><span>${c[lang].name}</span></a>`).join('')}</div></section>
${ad(lang, 'wide')}
<div class="home-split"><section class="home-sec"><div class="sec-head"><h2>${t.popular}</h2></div><ol class="pop-big">${popular.map((r, i) => `<li><a href="${recipeUrl(lang, r.slug)}"><span class="num">${i + 1}</span><img src="/assets/img/thumb/${r.image}.jpg" alt="" loading="lazy"><span><b>${r[lang].title}</b><small>${stars(r.rating, 'small')} ${r.rating} (${r.ratings.toLocaleString('en')}) · ${duration(r.total, lang)}</small></span></a></li>`).join('')}</ol></section>
<section class="home-sec plan-teaser"><h2>${H.planTitle}</h2><p>${H.planText}</p><ul>${MEAL_PLAN.days.map((d) => `<li><span>${d.day[lang]}</span> ${R[d.recipe] ? `<a href="${recipeUrl(lang, d.recipe)}">${R[d.recipe][lang].title}</a>` : ''}</li>`).join('')}</ul><a class="btn" href="${url(lang, 'meal-plan.html')}">${t.mealPlan} →</a></section></div>
<section class="home-sec"><div class="sec-head"><h2>${H.collectionsTitle}</h2><a href="${url(lang, 'collections/index.html')}">${t.viewAll} →</a></div><div class="cards cards-5 collection-cards">${Object.entries(COLLECTIONS).map(([k, c]) => `<article class="card"><a href="${url(lang, `collections/${k}.html`)}"><img src="/assets/img/thumb/${c.image}.jpg" alt="" loading="lazy"><div class="card-body"><h3>${c[lang].name}</h3><p>${c[lang].teaser}</p></div></a></article>`).join('')}</div></section>
<section class="home-sec"><div class="sec-head"><h2>${H.guidesTitle}</h2><a href="${url(lang, 'guides/index.html')}">${t.viewAll} →</a></div><ul class="guide-chips">${Object.entries(GUIDES).map(([k, g]) => `<li><a href="${guideUrl(lang, k)}">${g[lang].title}</a></li>`).join('')}</ul></section>
<section class="home-about"><div class="avatar-art" aria-hidden="true"><svg viewBox="0 0 80 80" width="96" height="96"><circle cx="40" cy="40" r="40" fill="#f3e3d3"/><circle cx="40" cy="46" r="20" fill="#fff" stroke="#c8553d" stroke-width="3"/><circle cx="40" cy="46" r="10" fill="none" stroke="#e8b04b" stroke-width="3"/><path d="M54 14 44 34M60 18 48 36" stroke="#3d3a35" stroke-width="3" stroke-linecap="round"/></svg></div><div><h2>${H.aboutTitle}</h2><p>${H.aboutText}</p><a href="${url(lang, 'about.html')}">${t.readMore} →</a></div></section>`;
  return page(lang, 'index.html', { title: `${t.siteName} – ${t.tagline}`, desc: t.tagline, body, cls: 'home' });
}

// ---------- meal plan, shopping list, search, about ----------
function mealPlan(lang) {
  const M = MEAL_PLAN[lang], t = UI[lang];
  const days = MEAL_PLAN.days;
  const yen = (n) => `¥${n.toLocaleString('en')}`;
  const body = `<div class="layout"><article class="post">
<h1>${M.title}</h1><p class="post-meta"><span>${MEAL_PLAN.week[lang]}</span></p><p>${M.intro}</p>
<div class="table-scroll"><table class="data plan"><thead><tr>${M.cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>
${days.map((d) => `<tr><th>${d.day[lang]}</th><td>${R[d.recipe] ? `<a href="${recipeUrl(lang, d.recipe)}">${R[d.recipe][lang].title}</a>` : d.recipe}</td><td>${d.side[lang]}</td><td>${d.lunch[lang]}</td><td>${d.prep[lang]}</td><td>${duration(d.active, lang)}</td><td>${yen(d.cost)}</td></tr>`).join('')}
</tbody><tfoot><tr><th colspan="5">${M.totals}</th><td>${duration(days.reduce((s, d) => s + d.active, 0), lang)}</td><td>${yen(days.reduce((s, d) => s + d.cost, 0))}</td></tr></tfoot></table></div>
<p><button class="btn" data-add-all="${days.map((d) => d.recipe).join(',')}" data-done="${esc(M.addedAll)}">${icon.list} ${M.addAll}</button></p>
${charts.planChart(days, lang)}
<ul class="notes">${M.notes.map((n) => `<li>${n}</li>`).join('')}</ul>
</article>${sidebar(lang)}</div>`;
  return page(lang, 'meal-plan.html', { title: M.title, desc: M.intro, body, crumbs: [[t.mealPlan]] });
}

function shoppingList(lang) {
  const t = UI[lang], ja = lang === 'ja';
  const body = `<h1>${t.shoppingList}</h1>
<p class="lede">${ja ? 'レシピカードの「買い物リストに追加」で選んだレシピの材料をまとめます。分量は人数に合わせて計算され、同じ材料は合算されます。リストはこのブラウザに保存されます。' : 'Ingredients from the recipes you add with "Add to shopping list", scaled to your servings and combined where they match. Your list is saved in this browser.'}</p>
<div class="shop">
  <section class="shop-recipes"><h2>${ja ? '選んだレシピ' : 'Your recipes'}</h2><ul class="shop-chosen"></ul>
    <p class="shop-empty" hidden>${ja ? 'まだレシピがありません。下から追加するか、レシピページの「買い物リストに追加」を押してください。' : 'No recipes yet. Add one below, or press "Add to shopping list" on any recipe.'}</p>
    <form class="shop-add"><select>${[...recipes].sort((a, b) => a[lang].title.localeCompare(b[lang].title, lang)).map((r) => `<option value="${r.slug}">${r[lang].title}</option>`).join('')}</select><button class="btn btn-small">${ja ? '追加' : 'Add'}</button></form>
    <p class="fine"><a href="${url(lang, 'meal-plan.html')}">${ja ? '今週の献立をまとめて追加する →' : 'Add this week\'s meal plan →'}</a></p></section>
  <section class="shop-items"><div class="rc-sec-head"><h2>${ja ? '買うもの' : 'Ingredients'}</h2>
    <div class="units" role="group"><button data-units="metric" class="on">${t.metric}</button><button data-units="us">${t.us}</button></div>
    <div class="units" role="group"><button data-view="merged" class="on">${ja ? 'まとめる' : 'Combined'}</button><button data-view="recipe">${ja ? 'レシピ別' : 'By recipe'}</button></div></div>
    <ul class="shop-list"></ul>
    <p class="shop-actions"><button class="btn btn-small btn-ghost" data-print>${icon.print} ${ja ? '印刷' : 'Print'}</button><button class="btn btn-small btn-ghost" data-clear>${ja ? 'リストを空にする' : 'Clear list'}</button></p></section>
</div>`;
  return page(lang, 'shopping-list.html', { title: t.shoppingList, desc: t.shoppingList, body, crumbs: [[t.shoppingList]], scripts: ['/assets/js/shopping.js'] });
}

function searchPage(lang) {
  const t = UI[lang];
  const opt = (name, vals) => `<fieldset><legend>${name}</legend>${vals}</fieldset>`;
  const body = `<h1>${t.searchTitle}</h1>
<form class="search-page" action="${url(lang, 'search.html')}">
  <div class="sp-bar"><input type="search" name="q" placeholder="${t.searchPlaceholder}"><button class="btn">${t.search}</button></div>
  <div class="filters">
    ${opt(t.filterTime, `<select name="time"><option value="">${t.any}</option>${[15, 30, 60, 120].map((m) => `<option value="${m}">${t.upTo(m)}</option>`).join('')}</select>`)}
    ${opt(t.filterDiet, Object.entries(t.diets).map(([k, l]) => `<label><input type="checkbox" name="diet" value="${k}"> ${l}</label>`).join(''))}
    ${opt(t.filterCuisine, `<select name="cuisine"><option value="">${t.any}</option>${Object.entries(t.cuisines).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>`)}
    ${opt(t.filterDifficulty, `<select name="difficulty"><option value="">${t.any}</option>${Object.entries(t.difficulties).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>`)}
    ${opt(t.sortBy, `<select name="sort"><option value="">${t.sortRelevance}</option><option value="rating">${t.sortRating}</option><option value="time">${t.sortTime}</option></select>`)}
    <a class="clear" href="${url(lang, 'search.html')}">${t.clear}</a>
  </div>
</form>
<p class="search-count" aria-live="polite"></p>
<div class="search-results"></div>
<p class="search-none" hidden>${t.noResults}</p>`;
  return page(lang, 'search.html', { title: t.searchTitle, desc: t.searchTitle, body, crumbs: [[t.search]], cls: 'search' });
}

function about(lang) {
  const A = ABOUT[lang], t = UI[lang];
  const body = `<div class="layout"><article class="post">
<h1>${A.title}</h1>
<div class="about-art" aria-hidden="true"><img src="/assets/img/kinoko-takikomi-gohan.jpg" alt=""></div>
${A.body.map((p) => `<p>${p}</p>`).join('')}
<h2>${A.teamTitle}</h2><dl class="team">${A.team.map(([n, d]) => `<div><dt>${n}</dt><dd>${d}</dd></div>`).join('')}</dl>
<h2>${A.testingTitle}</h2><ul>${A.testing.map((x) => `<li>${x}</li>`).join('')}</ul>
<h2>${A.faqTitle}</h2><div class="faq">${A.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
<h2 id="advertising">${A.adTitle}</h2><p>${A.ad}</p>
<h2 id="privacy">${A.privacyTitle}</h2><p>${A.privacy}</p>
<h2 id="contact">${A.contactTitle}</h2><p>${A.contact}</p>
</article>${sidebar(lang)}</div>`;
  return page(lang, 'about.html', { title: A.title, desc: A.body[0], body, crumbs: [[t.about]] });
}

// ---------- data for the client ----------
function searchIndex(lang) {
  const t = UI[lang];
  return [
    ...recipes.map((r) => ({
      type: 'recipe', title: r[lang].title, url: recipeUrl(lang, r.slug), img: `/assets/img/thumb/${r.image}.jpg`, text: r[lang].teaser,
      time: r.total, timeText: duration(r.total, lang), diet: r.diet, cuisine: r.cuisine, difficulty: r.difficulty, rating: r.rating, ratings: r.ratings,
      kw: [...r.ingredients.flatMap((g) => g.items.map((i) => i[lang].replace(/[,（(].*$/, ''))), ...r.categories.map((c) => CATEGORIES[c][lang].name), t.courses[r.course], t.cuisines[r.cuisine]].join(' '),
    })),
    ...Object.entries(GUIDES).map(([k, g]) => ({ type: 'guide', title: g[lang].title, url: guideUrl(lang, k), text: g[lang].teaser, kw: g[lang].body.map((b) => b.h ?? '').join(' ') })),
    ...Object.entries(COLLECTIONS).map(([k, c]) => ({ type: 'collection', title: c[lang].name, url: url(lang, `collections/${k}.html`), img: `/assets/img/thumb/${c.image}.jpg`, text: c[lang].teaser, kw: '' })),
  ];
}

// ---------- write everything ----------
function write(rel, html) {
  const file = ROOT + rel;
  mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  writeFileSync(file, html);
}
for (const lang of LANGS) rmSync(ROOT + lang, { recursive: true, force: true });
rmSync(ROOT + 'assets/charts', { recursive: true, force: true });

let pages = 0;
for (const lang of LANGS) {
  adTurn = 0;
  const out = (path, html) => { write(`${lang}/${path}`, html); pages++; };
  out('index.html', home(lang));
  out('recipes/index.html', recipesIndex(lang));
  for (const r of recipes) out(`recipes/${r.slug}.html`, recipePage(r, lang));
  for (const k of Object.keys(CATEGORIES)) out(`category/${k}.html`, categoryPage(k, lang));
  out('collections/index.html', collectionsIndex(lang));
  for (const k of Object.keys(COLLECTIONS)) out(`collections/${k}.html`, collectionPage(k, lang));
  out('guides/index.html', guidesIndex(lang));
  for (const k of Object.keys(GUIDES)) out(`guides/${k}.html`, guidePage(k, lang));
  out('meal-plan.html', mealPlan(lang));
  out('shopping-list.html', shoppingList(lang));
  out('search.html', searchPage(lang));
  out('about.html', about(lang));
  write(`assets/data/search-${lang}.json`, JSON.stringify(searchIndex(lang)));
  // charts
  write(`assets/charts/rice-water-${lang}.svg`, charts.riceWater(RICE_CHART, lang));
  write(`assets/charts/cup-weights-${lang}.svg`, charts.cupWeights(CUP_CHART, lang));
  write(`assets/charts/oven-scale-${lang}.svg`, charts.ovenScale(lang));
  write(`assets/charts/produce-calendar-${lang}.svg`, charts.produceCalendar(PRODUCE, lang));
  write(`assets/charts/dashi-timeline-${lang}.svg`, charts.dashiTimeline(lang));
  for (const r of recipes) write(`assets/charts/macros-${r.slug}-${lang}.svg`, charts.macros(r.nutrition, lang));
}
for (const c of CUTS) write(`assets/charts/cut-${c.id}.svg`, charts.cut(c.shape));
write('assets/data/recipes.json', JSON.stringify(Object.fromEntries(recipes.map((r) => [r.slug, {
  title: { en: r.en.title, ja: r.ja.title }, servings: r.servings, unit: r.servingsUnit ?? null, image: r.image,
  items: r.ingredients.flatMap((g) => g.items),
}]))));
write('index.html', '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/en/"><title>Daily Table</title></head><body><script>location.replace("/en/")</script><p><a href="/en/">Daily Table</a></p></body></html>\n');
console.log(`built ${pages} pages (${recipes.length} recipes × ${LANGS.length} languages)`);
