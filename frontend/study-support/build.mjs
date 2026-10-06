// Builds Kumo Mobile Support: node build.mjs
// Reads content/<lang>/*.mjs (each exports `pages`, common.mjs exports `ui`),
// writes en/ and ja/ pages, the search indexes and the chart files.
import { readdirSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const LANGS = ['en', 'ja'];
const SECTION_ORDER = ['plans', 'procedures', 'billing', 'shops', 'news', 'forms'];

const write = (rel, text) => { const f = join(ROOT, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, text); };
const strip = (html) => html.replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

async function load(lang) {
  const dir = join(ROOT, 'content', lang);
  const pages = {}, files = {};
  let ui;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort()) {
    const m = await import(pathToFileURL(join(dir, f)).href);
    if (m.ui) ui = m.ui;
    Object.assign(pages, m.pages || {});
    Object.assign(files, m.files || {});
  }
  return { pages, files, ui };
}

const LOGO = (sub) => `<svg class="logo-mark" viewBox="0 0 48 32" width="44" height="29" aria-hidden="true"><path d="M13 28h24a9 9 0 0 0 1.5-17.9A12 12 0 0 0 15.4 8.3 10 10 0 0 0 13 28z" fill="#1f8fe0"/><path d="M13 28h24a9 9 0 0 0 3.8-17.2c-3 6.6-10.2 11.7-27.8 17.2z" fill="#0b5fa5"/><circle cx="32" cy="18" r="2.4" fill="#fff"/></svg><span class="logo-word">Kumo<b>Mobile</b></span><span class="logo-sub">${sub}</span>`;

function layout({ lang, path, page, ui, pages }) {
  const other = lang === 'en' ? 'ja' : 'en';
  const section = path.includes('/') ? path.split('/')[0] : null;
  const crumbs = [[ui.home, `/${lang}/index.html`]];
  if (section && path !== `${section}/index.html` && pages[`${section}/index.html`]) crumbs.push([pages[`${section}/index.html`].short || pages[`${section}/index.html`].title, `/${lang}/${section}/index.html`]);
  if (path !== 'index.html') crumbs.push([page.short || page.title]);
  const nav = ui.nav.map(([label, href, sub]) => {
    const on = section ? href.startsWith(`@/${section}/`) : href === `@/${path}`;
    return `<li class="nav-i${sub ? ' has-sub' : ''}${on ? ' on' : ''}"><a href="${href}">${label}</a>${sub ? `<div class="sub"><ul>${sub.map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>` : ''}</li>`;
  }).join('');
  const sideLinks = section && page.side !== false
    ? Object.entries(pages).filter(([p]) => p.startsWith(section + '/')).map(([p, pg]) => `<li${p === path ? ' class="on"' : ''}><a href="/${lang}/${p}">${p.endsWith('/index.html') ? pg.title : pg.short || pg.title}</a></li>`).join('')
    : '';
  const related = (page.related || []).filter((p) => pages[p]).map((p) => `<li><a href="/${lang}/${p}">${pages[p].title}</a></li>`).join('');
  const aside = page.wide ? '' : `<aside class="side">${sideLinks ? `<nav class="side-nav"><p class="side-h">${pages[`${section}/index.html`]?.short || ''}</p><ul>${sideLinks}</ul></nav>` : ''}${ui.side}</aside>`;
  const body = `${page.hero || ''}<div class="wrap page${page.wide ? ' is-wide' : ''}">
<nav class="crumbs" aria-label="${ui.crumbLabel}"><ol>${crumbs.map(([t, h]) => (h ? `<li><a href="${h}">${t}</a></li>` : `<li aria-current="page">${t}</li>`)).join('')}</ol></nav>
<div class="cols"><main class="main" id="main">${page.noH1 ? '' : `<h1 class="h1">${page.title}</h1>`}${page.lead ? `<p class="lead">${page.lead}</p>` : ''}${page.updated ? `<p class="updated">${page.updated}</p>` : ''}
${page.body}
${related ? `<section class="related"><h2>${ui.related}</h2><ul>${related}</ul></section>` : ''}
${ui.helpful}</main>${aside}</div></div>`;
  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${strip(page.title)} | ${ui.siteName}</title>
<meta name="description" content="${strip(page.desc || page.lead || page.title).replace(/"/g, '&quot;')}">
<link rel="icon" href="/assets/favicon.svg">
<link rel="stylesheet" href="/assets/site.css">
</head>
<body class="lang-${lang}">
<a class="skip" href="#main">${ui.skip}</a>
<div class="util"><div class="wrap"><span class="util-l">${ui.utilLeft}</span><ul class="util-r">${ui.util.map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join('')}<li class="lang-sw"><a href="/${other}/${path}" hreflang="${other}" lang="${other}">${ui.otherLang}</a></li></ul></div></div>
<header class="hdr"><div class="wrap hdr-in">
<a class="logo" href="/${lang}/index.html" aria-label="${ui.siteName}">${LOGO(ui.logoSub)}</a>
<nav class="gnav" aria-label="${ui.navLabel}"><ul>${nav}</ul></nav>
<form class="hsearch" action="/${lang}/search.html" role="search"><input type="search" name="q" placeholder="${ui.searchPh}" aria-label="${ui.searchPh}"><button type="submit" aria-label="${ui.search}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.5-4.5"/></svg></button></form>
<a class="btn-my" href="/${lang}/my-kumo.html">${ui.myKumo}</a>
</div></header>
${body}
<footer class="ftr"><div class="wrap">${ui.footer}<p class="fict">${ui.fictional}</p></div></footer>
<div class="cookie" hidden><p>${ui.cookie}</p><button type="button" class="cookie-ok">${ui.cookieOk}</button></div>
<button type="button" class="chat-btn" aria-label="${ui.chat.label}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v11H9l-5 4z"/></svg><span>${ui.chat.btn}</span></button>
<div class="chat-panel" hidden>${ui.chat.panel}</div>
<script src="/assets/site.js"></script>
<script src="/unilens.js"></script>
<script>UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })</script>
</body>
</html>
`;
  return html.replace(/(href|action|src)="@\//g, `$1="/${lang}/`);
}

for (const lang of LANGS) {
  const { pages, files, ui } = await load(lang);
  if (!ui) { console.log(`${lang}: no content`); continue; }
  // order pages: home, sections in order, then the rest
  const ordered = Object.fromEntries(Object.entries(pages).sort(([a], [b]) => rank(a) - rank(b)));
  rmSync(join(ROOT, lang), { recursive: true, force: true });
  const index = [];
  for (const [path, page] of Object.entries(ordered)) {
    write(`${lang}/${path}`, layout({ lang, path, page, ui, pages: ordered }));
    if (path !== 'search.html') index.push({ t: strip(page.title), u: `/${lang}/${path}`, x: strip(`${page.lead || ''} ${page.body}`) });
  }
  write(`assets/search-${lang}.json`, JSON.stringify(index));
  for (const [rel, text] of Object.entries(files)) write(rel, text);
  console.log(`${lang}: ${Object.keys(pages).length} pages`);
}
write('index.html', `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>Kumo Mobile Support</title><meta http-equiv="refresh" content="0; url=/en/index.html"></head><body><p><a href="/en/index.html">Kumo Mobile Support</a> · <a href="/ja/index.html">クモモバイル サポート</a></p><script src="/unilens.js"></script>\n<script>UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })</script></body></html>\n`);

function rank(p) {
  if (p === 'index.html') return 0;
  const s = p.split('/');
  const i = SECTION_ORDER.indexOf(s[0]);
  return s.length > 1 && i >= 0 ? 10 + i * 100 + (s[1] === 'index.html' ? 0 : 1) : 1000;
}
