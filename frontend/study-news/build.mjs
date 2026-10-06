// Builds The Harukawa Herald / 春川日報 (en/ and ja/) from content/. Node standard library only.
// Usage: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './content/site.mjs';
import { ui, ads, pages } from './content/pages.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const LANGS = ['en', 'ja'];
const other = l => (l === 'en' ? 'ja' : 'en');
const warnings = [];
const warn = m => warnings.push(m);

// ---------------------------------------------------------------- helpers
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rel = (from, to) => path.posix.relative(path.posix.dirname(from), to) || path.posix.basename(to);
function write(file, content) {
  const full = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}
const WD = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ja: ['日', '月', '火', '水', '木', '金', '土'] };
const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function parts(iso) {
  const [d, t = ''] = iso.split('T');
  const [y, m, day] = d.split('-').map(Number);
  return { y, m, day, t, wd: new Date(Date.UTC(y, m - 1, day)).getUTCDay() };
}
function fmtDate(iso, lang, { time = true, long = false } = {}) {
  const p = parts(iso);
  if (lang === 'ja') return `${p.y}年${p.m}月${p.day}日（${WD.ja[p.wd]}）${time && p.t ? ' ' + p.t : ''}`;
  const base = long ? `${WDL[p.wd]} ${p.day} ${MONL[p.m - 1]} ${p.y}` : `${WD.en[p.wd]} ${p.day} ${MON[p.m - 1]} ${p.y}`;
  return time && p.t ? `${base}, ${p.t} JST` : base;
}
const toMs = iso => Date.parse(iso + ':00+09:00');
function ago(iso, lang) {
  const min = Math.round((toMs(S.NOW) - toMs(iso)) / 60000);
  if (min < 60) return lang === 'ja' ? `${min}分前` : `${min} min ago`;
  if (min < 24 * 60) { const h = Math.floor(min / 60); return lang === 'ja' ? `${h}時間前` : `${h} hour${h > 1 ? 's' : ''} ago`; }
  const p = parts(iso);
  return lang === 'ja' ? `${p.m}月${p.day}日` : `${p.day} ${MON[p.m - 1]}`;
}
const dayKey = iso => iso.slice(0, 10);

// ---------------------------------------------------------------- content
function parseDoc(file) {
  const src = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) throw new Error(`No front matter in ${file}`);
  const doc = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) doc[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const secs = src.slice(m[0].length).split(/^=== (\w+)[ \t]*$/m);
  doc.body = secs[0];
  for (let i = 1; i < secs.length; i += 2) doc[secs[i]] = secs[i + 1];
  return doc;
}

const ART = {}; // id -> meta + text[lang]
for (const a of S.articles) {
  ART[a.id] = { ...a, text: {} };
  for (const lang of LANGS) {
    const f = path.join(ROOT, 'content/articles', `${a.id}.${lang}.md`);
    if (!fs.existsSync(f)) { warn(`missing ${a.id}.${lang}.md`); continue; }
    ART[a.id].text[lang] = parseDoc(f);
  }
}
const LIVE = { ...S.live, text: {} };
for (const lang of LANGS) {
  const f = path.join(ROOT, 'content', `live.${lang}.md`);
  if (!fs.existsSync(f)) { warn(`missing live.${lang}.md`); continue; }
  const d = parseDoc(f);
  d.list = (d.updates || '').split(/^@@ /m).map(s => s.trim()).filter(Boolean).map(chunk => {
    const [head, ...rest] = chunk.split('\n');
    const [dt, cat, title, flag] = head.split('|').map(s => s.trim());
    return { dt: dt.replace(' ', 'T'), cat, title, pinned: flag === 'pinned', body: rest.join('\n') };
  });
  LIVE.text[lang] = d;
}
ART[LIVE.id] = LIVE;
const ready = lang => [...S.articles.map(a => ART[a.id]), LIVE].filter(a => a.text[lang]);
const byNewest = (x, y) => toMs(y.date) - toMs(x.date);

// ---------------------------------------------------------------- urls
const urlOf = id => (id === LIVE.id ? LIVE.url : `articles/${id}.html`);
const sectionUrl = id => (id === 'weather' ? 'weather.html' : `section/${id}.html`);
const tagUrl = id => `tag/${id}.html`;
const pageUrl = { live: LIVE.url, weather: 'weather.html', subscribe: 'subscribe.html', corrections: 'corrections.html', about: 'about.html', archive: 'archive.html', search: 'search.html', home: 'index.html', epaper: 'subscribe.html', newsletters: 'subscribe.html#newsletters' };
const L = (ctx, p) => rel(`${ctx.lang}/${ctx.page}`, `${ctx.lang}/${p}`); // link within the language
const A = (ctx, p) => rel(`${ctx.lang}/${ctx.page}`, p); // link to a root path (assets)
const img = (ctx, name) => {
  if (!fs.existsSync(path.join(ROOT, 'assets/img', `${name}.jpg`))) warn(`missing image ${name}.jpg`);
  return A(ctx, `assets/img/${name}.jpg`);
};
function refUrl(ref, ctx) {
  let p;
  if (ref.startsWith('tag:')) { p = tagUrl(ref.slice(4)); if (!S.tags[ref.slice(4)]) warn(`unknown tag ${ref} in ${ctx.page}`); }
  else if (ref.startsWith('page:')) { p = pageUrl[ref.slice(5)]; if (!p) warn(`unknown page ${ref} in ${ctx.page}`); }
  else if (ref.startsWith('section:')) p = sectionUrl(ref.slice(8));
  else { p = urlOf(ref); if (!ART[ref]) warn(`unknown article ${ref} in ${ctx.page}`); }
  return L(ctx, p || 'index.html');
}

// ---------------------------------------------------------------- icons
const ICON = {
  search: '<path d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.8 4.8-1.4 1.4-4.8-4.8A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z"/>',
  menu: '<path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/>',
  close: '<path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6 10.6 12 5 6.4z"/>',
  link: '<path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a3 3 0 0 1 4.2 4.2l-2 2-1.4-1.4 2-2a1 1 0 0 0-1.4-1.4l-3.5 3.5a1 1 0 0 1-1.4 0zm2.8-2.8a1 1 0 0 1 0 1.4l-3.5 3.5a3 3 0 0 1-4.2-4.2l2-2 1.4 1.4-2 2a1 1 0 0 0 1.4 1.4l3.5-3.5a1 1 0 0 1 1.4 0z"/>',
  mail: '<path d="M3 5h18v14H3zm2 2v.5l7 4.5 7-4.5V7zm14 2.9-7 4.5-7-4.5V17h14z"/>',
  print: '<path d="M7 3h10v4H7zM5 9h14a2 2 0 0 1 2 2v6h-4v4H7v-4H3v-6a2 2 0 0 1 2-2zm4 7v3h6v-3z"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4zm2 2v12.3l4-2.7 4 2.7V5z"/>',
  share: '<path d="M18 3a3 3 0 1 1-2.8 4l-6.3 3.2a3 3 0 0 1 0 1.6l6.3 3.2A3 3 0 1 1 15 17l-6.3-3.2a3 3 0 1 1 0-3.6L15 7a3 3 0 0 1 3-4z"/>',
  left: '<path d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z"/>',
  right: '<path d="m8.6 5.4 1.4-1.4 8 8-8 8-1.4-1.4 6.6-6.6z"/>',
  comment: '<path d="M4 4h16v12H8l-4 4zm2 2v9.2L7.2 14H18V6z"/>',
  like: '<path d="M2 10h4v11H2zm6 11V10l5-7 1.5 1-1 5H21l-2.5 12z"/>',
  umbrella: '<path d="M12 2a10 10 0 0 1 10 10H13v7a3 3 0 0 1-6 0h2a1 1 0 0 0 2 0v-7H2A10 10 0 0 1 12 2z"/>',
  user: '<path d="M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 11c4.4 0 8 2.2 8 5v2H4v-2c0-2.8 3.6-5 8-5z"/>',
};
const icon = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
function wxIcon(name, cls = 'wi') {
  const cloud = fill => `<path d="M7 19a4.2 4.2 0 0 1-.5-8.4 5.6 5.6 0 0 1 10.8 1.6A3.4 3.4 0 0 1 17 19z" fill="${fill}"/>`;
  const sun = '<circle cx="12" cy="12" r="4.6" fill="#f6b800"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke="#f6b800" stroke-width="1.8" stroke-linecap="round"/>';
  const drops = '<path d="M9 20.5l-1 2.2M13 20.5l-1 2.2M17 20.5l-1 2.2" stroke="#3a78b5" stroke-width="1.6" stroke-linecap="round"/>';
  const g = {
    sun,
    suncloud: `<g transform="translate(-3 -3) scale(.8)">${sun}</g>${cloud('#c4ccd6')}`,
    cloudsun: `<g transform="translate(9 -2) scale(.6)">${sun}</g>${cloud('#aab4c0')}`,
    rain: `<g transform="translate(0 -2)">${cloud('#8796a8')}</g>${drops}`,
    storm: `<g transform="translate(0 -3)">${cloud('#4b5866')}</g><path d="M12.5 13.5l-2.5 4.5h2.5l-1.5 4.5 4.5-6h-2.6l1.6-3z" fill="#f2c94c"/>${drops}`,
  }[name];
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${g}</svg>`;
}
const lanternMark = `<svg class="mark" viewBox="0 0 40 48" aria-hidden="true"><rect x="15" y="1" width="10" height="5" rx="1" fill="#0e2d4f"/><path d="M8 9h24c4 6 4 24 0 30H8C4 33 4 15 8 9z" fill="#c8102e"/><path d="M12 9c-2 8-2 22 0 30M20 9v30M28 9c2 8 2 22 0 30" stroke="#fff" stroke-opacity=".45" stroke-width="1.4" fill="none"/><rect x="13" y="39" width="14" height="5" rx="1" fill="#0e2d4f"/><path d="M20 44v4" stroke="#0e2d4f" stroke-width="2"/></svg>`;

// ---------------------------------------------------------------- markup
function inline(s, ctx) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, ref) => `<a href="${refUrl(ref, ctx)}">${t}</a>`);
}
function blocks(src, ctx) {
  const out = [];
  const joiner = ctx.lang === 'ja' ? '' : ' ';
  for (const raw of (src || '').trim().split(/\n[ \t]*\n/)) {
    const b = raw.trim();
    if (!b || b === '[[paywall]]') continue;
    let m;
    if ((m = b.match(/^\[\[(\w+):([^\]|]+)(?:\|([^\]]*))?\]\]$/))) { out.push(embed(m[1], m[2].trim(), m[3], ctx)); continue; }
    if (b.startsWith('## ')) { out.push(`<h2>${inline(b.slice(3), ctx)}</h2>`); continue; }
    if (b.startsWith('### ')) { out.push(`<h3>${inline(b.slice(4), ctx)}</h3>`); continue; }
    if (b.startsWith('> ')) {
      const [q, who] = b.replace(/\n> ?/g, joiner).slice(2).split(' -- ');
      out.push(`<blockquote class="pull"><p>${inline(q, ctx)}</p>${who ? `<cite>${inline(who, ctx)}</cite>` : ''}</blockquote>`);
      continue;
    }
    if (b.startsWith('!! ')) {
      const [first, ...rest] = b.split('\n');
      out.push(`<aside class="factbox"><h3>${inline(first.slice(3), ctx)}</h3>${blocks(rest.join('\n'), ctx)}</aside>`);
      continue;
    }
    if (/^- /.test(b)) { out.push(`<ul>${b.split(/\n(?=- )/).map(li => `<li>${inline(li.slice(2).replace(/\n\s*/g, joiner), ctx)}</li>`).join('')}</ul>`); continue; }
    if (/^\d+\. /.test(b)) { out.push(`<ol>${b.split(/\n(?=\d+\. )/).map(li => `<li>${inline(li.replace(/^\d+\.\s*/, '').replace(/\n\s*/g, joiner), ctx)}</li>`).join('')}</ol>`); continue; }
    out.push(`<p>${inline(b.replace(/\n\s*/g, joiner), ctx)}</p>`);
  }
  return out.join('\n');
}
function embed(kind, id, extra, ctx) {
  if (kind === 'table') return tableHtml(id, ctx.lang);
  if (kind === 'chart') return chartFigure(id, ctx);
  if (kind === 'map' && id === 'festival') return `<figure class="figure map"><img src="${A(ctx, `assets/charts/festival-map.${ctx.lang}.svg`)}" alt="${ctx.lang === 'ja' ? '地図' : 'Map'}" width="640" height="440"><figcaption>${ctx.lang === 'ja' ? '交通規制図（番号は下の表と対応）。地図は概略' : 'Road closures (numbers match the table below). Map not to scale.'}<span class="credit">${ctx.lang === 'ja' ? '春川日報作成' : 'Graphic: The Harukawa Herald'}</span></figcaption></figure>`;
  if (kind === 'photo') return `<figure class="figure photo"><img src="${img(ctx, id)}" alt="" loading="lazy"><figcaption>${inline(extra || '', ctx)}</figcaption></figure>`;
  warn(`unknown embed ${kind}:${id} in ${ctx.page}`);
  return '';
}
function tableHtml(id, lang) {
  const t = S.tables[id]?.[lang];
  if (!t) { warn(`unknown table ${id}`); return ''; }
  const isTotal = r => /^(Total|Totals|計|合計)/.test(r[0]);
  return `<figure class="table-wrap"><figcaption>${esc(t.caption)}</figcaption><div class="table-scroll"><table class="data">
<thead><tr>${t.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${t.rows.map(r => `<tr${isTotal(r) ? ' class="total"' : ''}>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n')}</tbody></table></div>${t.note ? `<p class="table-note">${esc(t.note)}</p>` : ''}</figure>`;
}

// ---------------------------------------------------------------- charts (SVG)
const PAL = ['#9fb4c7', '#0e2d4f', '#c8102e'];
const FONT = `font-family="Helvetica Neue, Arial, Hiragino Sans, Yu Gothic, Meiryo, sans-serif"`;
function fmtVal(v, c, lang) {
  const t = c[lang];
  const sv = t.scale ? Math.round(v * t.scale * 10) / 10 : v;
  const n = sv.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (c.unit === '%') return `${n}%`;
  if (c.unit === '¥') return lang === 'ja' ? `${n}円` : `¥${n}`;
  return n;
}
function svgHead(w, h, t, lang, legend) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>`;
  s += `<text x="12" y="24" font-size="16" font-weight="700" fill="#1b1b1b">${esc(t.title)}</text>`;
  s += `<text x="12" y="43" font-size="12" fill="#6a6a6a">${esc(t.subtitle || '')}</text>`;
  if (legend && t.series.length > 1) {
    let x = 12;
    t.series.forEach((name, i) => {
      s += `<rect x="${x}" y="54" width="11" height="11" fill="${PAL[i + (t.series.length === 1 ? 1 : 0)]}"/><text x="${x + 16}" y="64" font-size="12" fill="#333">${esc(name)}</text>`;
      x += 30 + name.length * (lang === 'ja' ? 12 : 7);
    });
  }
  return s;
}
const svgFoot = (w, h, t) => `<text x="12" y="${h - 8}" font-size="10.5" fill="#888">${esc(t.source || '')}</text></svg>`;
function niceMax(v) { const p = 10 ** Math.floor(Math.log10(v)); return Math.ceil(v / p) * p; }
function chartSvg(id, lang) {
  const c = S.charts[id];
  const t = c[lang];
  const n = c.values.length;
  const col = i => (n === 1 ? PAL[1] : PAL[i]);
  if (c.type === 'hbars') {
    const W = 640, labelW = lang === 'ja' ? 190 : 250, top = n > 1 ? 80 : 62, rowH = n * 15 + 12;
    const H = top + t.labels.length * rowH + 30, max = niceMax(Math.max(...c.values.flat()));
    const sx = v => (v / max) * (W - labelW - 70);
    let s = svgHead(W, H, t, lang, true);
    t.labels.forEach((lab, k) => {
      const y0 = top + k * rowH;
      s += `<text x="${labelW - 8}" y="${y0 + (n * 15) / 2 + 4}" font-size="12" text-anchor="end" fill="#333">${esc(lab)}</text>`;
      c.values.forEach((vals, i) => {
        const y = y0 + i * 15;
        s += `<rect x="${labelW}" y="${y}" width="${sx(vals[k]).toFixed(1)}" height="12" fill="${col(i)}"/>`;
        s += `<text x="${labelW + sx(vals[k]) + 5}" y="${y + 10}" font-size="11" fill="#333">${fmtVal(vals[k], c, lang)}</text>`;
      });
    });
    s += `<line x1="${labelW}" y1="${top - 4}" x2="${labelW}" y2="${H - 26}" stroke="#999"/>`;
    return s + svgFoot(W, H, t);
  }
  const W = 640, H = c.type === 'line' ? 320 : 340, top = n > 1 ? 86 : 66, bottom = H - 50, left = 48, right = W - 20;
  const allV = c.values.flat().concat(c.threshold ?? []);
  const max = niceMax(Math.max(...allV) * 1.08);
  const sy = v => bottom - (v / max) * (bottom - top);
  let s = svgHead(W, H, t, lang, true);
  for (let g = 0; g <= 4; g++) {
    const v = (max / 4) * g, y = sy(v);
    s += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#e5e5e5"/><text x="${left - 6}" y="${y + 4}" font-size="10.5" text-anchor="end" fill="#777">${fmtVal(Math.round(v * 100) / 100, { ...c, unit: c.unit === '%' ? '%' : '' }, lang)}</text>`;
  }
  const k = t.labels.length, band = (right - left) / k;
  if (c.type === 'bars') {
    const bw = Math.min(46, (band * 0.75) / n);
    t.labels.forEach((lab, j) => {
      const cx = left + band * j + band / 2;
      c.values.forEach((vals, i) => {
        const x = cx - (bw * n) / 2 + i * bw;
        s += `<rect x="${x.toFixed(1)}" y="${sy(vals[j]).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${(bottom - sy(vals[j])).toFixed(1)}" fill="${col(i)}"/>`;
        s += `<text x="${(x + bw / 2 - 1).toFixed(1)}" y="${(sy(vals[j]) - 4).toFixed(1)}" font-size="10.5" text-anchor="middle" fill="#333">${fmtVal(vals[j], c, lang)}</text>`;
      });
      s += `<text x="${cx}" y="${bottom + 16}" font-size="11.5" text-anchor="middle" fill="#333">${esc(lab)}</text>`;
    });
  } else {
    const xs = c.x ? (() => { const a = c.x[0], b = c.x[c.x.length - 1]; return c.x.map(v => left + 20 + ((v - a) / (b - a)) * (right - left - 40)); })() : t.labels.map((_, j) => left + band * j + band / 2);
    t.labels.forEach((lab, j) => { s += `<text x="${xs[j]}" y="${bottom + 16}" font-size="11.5" text-anchor="middle" fill="#333">${esc(lab)}</text>`; });
    if (c.threshold != null) s += `<line x1="${left}" y1="${sy(c.threshold)}" x2="${right}" y2="${sy(c.threshold)}" stroke="${PAL[2]}" stroke-dasharray="5 4"/>`;
    c.values.forEach((vals, i) => {
      s += `<polyline fill="none" stroke="${col(i)}" stroke-width="2.5" points="${vals.map((v, j) => `${xs[j].toFixed(1)},${sy(v).toFixed(1)}`).join(' ')}"/>`;
      vals.forEach((v, j) => {
        s += `<circle cx="${xs[j].toFixed(1)}" cy="${sy(v).toFixed(1)}" r="3.2" fill="${col(i)}"/>`;
        if (i === n - 1 || n === 1) s += `<text x="${xs[j].toFixed(1)}" y="${(sy(v) - 8).toFixed(1)}" font-size="10.5" text-anchor="middle" fill="#333">${fmtVal(v, c, lang)}</text>`;
      });
    });
  }
  s += `<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#999"/>`;
  return s + svgFoot(W, H, t);
}
function chartFigure(id, ctx) {
  const c = S.charts[id];
  if (!c) { warn(`unknown chart ${id}`); return ''; }
  const credit = ctx.lang === 'ja' ? '春川日報作成' : 'Graphic: The Harukawa Herald';
  if (c.display === 'inline') {
    const svg = chartSvg(id, ctx.lang).replace('<svg ', `<svg role="img" aria-labelledby="t-${id}" `).replace(/(<rect[^>]*\/>)/, `$1<title id="t-${id}">${esc(c[ctx.lang].title)}</title>`);
    return `<figure class="figure chart">${svg}<figcaption><span class="credit">${credit}</span></figcaption></figure>`;
  }
  return `<figure class="figure chart"><img src="${A(ctx, `assets/charts/${id}.${ctx.lang}.svg`)}" alt="${esc(c.alt[ctx.lang])}" loading="lazy"><figcaption><span class="credit">${credit}</span></figcaption></figure>`;
}
function weatherSvg(lang) {
  const h = S.weather.hourly, W = 720, H = 300, left = 64, right = W - 40, top = 40, bottom = 220;
  const band = (right - left) / h.hours.length;
  const rmax = 40, tmin = 14, tmax = 30;
  const ry = v => bottom - (v / rmax) * (bottom - top);
  const ty = v => bottom - ((v - tmin) / (tmax - tmin)) * (bottom - top);
  const t = lang === 'ja' ? { title: '春川市の24時間予報（4日18時〜5日17時）', rain: '雨量 mm/h', temp: '気温 ℃', wind: '風速 m/s', src: 'みのり地方気象台の資料をもとに作成' } : { title: 'Harukawa, next 24 hours (Sun 18:00 – Mon 17:00)', rain: 'Rain mm/h', temp: 'Temp °C', wind: 'Wind m/s', src: 'Based on Minori Local Meteorological Office data' };
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" ${FONT}><rect width="${W}" height="${H}" fill="#fff"/><text x="10" y="22" font-size="15" font-weight="700" fill="#1b1b1b">${esc(t.title)}</text>`;
  for (let g = 0; g <= 4; g++) { const y = bottom - g * (bottom - top) / 4; s += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#eee"/><text x="${left - 5}" y="${y + 4}" font-size="10" text-anchor="end" fill="#3a78b5">${g * 10}</text><text x="${right + 5}" y="${y + 4}" font-size="10" fill="#c8102e">${tmin + g * 4}</text>`; }
  h.hours.forEach((hr, i) => {
    const x = left + i * band;
    s += `<rect x="${(x + 3).toFixed(1)}" y="${ry(h.rain[i]).toFixed(1)}" width="${(band - 6).toFixed(1)}" height="${(bottom - ry(h.rain[i])).toFixed(1)}" fill="#7fb2dd"/>`;
    if (h.rain[i]) s += `<text x="${(x + band / 2).toFixed(1)}" y="${(ry(h.rain[i]) - 3).toFixed(1)}" font-size="9" text-anchor="middle" fill="#2f6a9e">${h.rain[i]}</text>`;
    s += `<text x="${(x + band / 2).toFixed(1)}" y="${bottom + 14}" font-size="10" text-anchor="middle" fill="#333">${hr}</text>`;
    s += `<text x="${(x + band / 2).toFixed(1)}" y="${bottom + 32}" font-size="9.5" text-anchor="middle" fill="${h.wind[i] >= 25 ? '#c8102e' : '#555'}">${h.wind[i]}</text>`;
  });
  s += `<polyline fill="none" stroke="#c8102e" stroke-width="2" points="${h.temp.map((v, i) => `${(left + i * band + band / 2).toFixed(1)},${ty(v).toFixed(1)}`).join(' ')}"/>`;
  s += `<text x="${left}" y="${top - 6}" font-size="10" fill="#3a78b5">${t.rain}</text><text x="${right}" y="${top - 6}" font-size="10" text-anchor="end" fill="#c8102e">${t.temp}</text><text x="4" y="${bottom + 32}" font-size="9.5" fill="#555">${t.wind}</text>`;
  s += `<text x="10" y="${H - 10}" font-size="10" fill="#888">${t.src}</text></svg>`;
  return s;
}
function typhoonSvg(lang) {
  const tr = S.weather.track, W = 600, H = 420;
  const j = lang === 'ja';
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" ${FONT} role="img" aria-label="${j ? '台風21号の進路図' : 'Typhoon No. 21 track map'}"><rect width="${W}" height="${H}" fill="#dcebf5"/>`;
  s += `<path d="M0 0H600V210C560 200 520 182 480 172 430 160 400 166 372 152 352 142 346 128 336 129 322 132 312 150 292 160 252 176 200 160 150 176 100 190 50 180 0 192Z" fill="#eeeadf" stroke="#b9b2a0"/>`;
  s += `<text x="30" y="60" font-size="13" fill="#7a725f">${j ? 'みのり県' : 'Minori Prefecture'}</text><text x="300" y="185" font-size="11" fill="#4f7894" font-style="italic">${j ? 'みのり湾' : 'Minori Bay'}</text><text x="60" y="320" font-size="12" fill="#4f7894" font-style="italic">${j ? '太平洋' : 'Pacific Ocean'}</text>`;
  const now = tr.find(p => p.now);
  s += `<circle cx="${now.x}" cy="${now.y}" r="180" fill="#f2c94c" fill-opacity=".18" stroke="#d9a400" stroke-dasharray="4 3"/><circle cx="${now.x}" cy="${now.y}" r="54" fill="#c8102e" fill-opacity=".22" stroke="#c8102e"/>`;
  tr.filter(p => p.r).forEach(p => { s += `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="5 4"/>`; });
  const past = tr.filter(p => p.past), fut = [now, ...tr.filter(p => !p.past)];
  s += `<polyline points="${past.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#0e2d4f" stroke-width="2.5"/>`;
  s += `<polyline points="${fut.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#0e2d4f" stroke-width="2" stroke-dasharray="6 5"/>`;
  tr.forEach(p => {
    s += p.now ? `<circle cx="${p.x}" cy="${p.y}" r="8" fill="#c8102e" stroke="#fff" stroke-width="2"/>` : `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${p.past ? '#0e2d4f' : '#fff'}" stroke="#0e2d4f" stroke-width="2"/>`;
    const end = p.x > 400;
    s += `<text x="${end ? p.x - 12 : p.x + 12}" y="${p.y + 4}" font-size="11" fill="#1b1b1b" font-weight="${p.now ? 700 : 400}"${end ? ' text-anchor="end"' : ''} paint-order="stroke" stroke="#fff" stroke-width="3" stroke-opacity=".7">${esc(p.t[lang])} · ${p.hpa} hPa</text>`;
  });
  s += `<path d="M330 112l3 7 7 .5-5.5 4.5 2 7-6.5-4-6.5 4 2-7-5.5-4.5 7-.5z" fill="#0e2d4f"/><text x="316" y="104" font-size="12" font-weight="700" fill="#0e2d4f" text-anchor="end">${j ? '春川市' : 'Harukawa'}</text>`;
  s += `<g transform="translate(470 395)"><rect x="0" y="-6" width="36" height="5" fill="#333"/><text x="44" y="0" font-size="10.5" fill="#333">100 km</text></g>`;
  s += `<g font-size="10.5" fill="#333" transform="translate(12 345)"><circle cx="6" cy="0" r="6" fill="#c8102e" fill-opacity=".3" stroke="#c8102e"/><text x="18" y="4">${j ? '暴風域（25m/s以上）' : 'Storm area (25 m/s+)'}</text><circle cx="6" cy="20" r="6" fill="#f2c94c" fill-opacity=".3" stroke="#d9a400"/><text x="18" y="24">${j ? '強風域（15m/s以上）' : 'Gale area (15 m/s+)'}</text><circle cx="6" cy="40" r="6" fill="none" stroke="#0e2d4f" stroke-dasharray="3 2"/><text x="18" y="44">${j ? '予報円' : 'Forecast circle'}</text></g>`;
  return s + '</svg>';
}
function festivalSvg(lang) {
  const j = lang === 'ja';
  const T = j ? { castle: '城址公園', station: '春川中央駅', shiro: '城町駅', river: '鏡川', nishiki: '錦橋', asahi: '朝日橋', minato: '港橋', riverside: '川端通り', komachi: '小町通り', otemachi: '大手町通り', lanterns: '灯籠流し（メインステージ）', shuttle: 'シャトルバス乗降場（東門）', bikes: '臨時駐輪場（城山小）', closed: '車両通行止め', partial: '片側通行', ped: '歩行者天国', north: '北', scale: '概略図' }
    : { castle: 'Castle Park', station: 'Harukawa Central Stn', shiro: 'Shiromachi Stn', river: 'Kagami River', nishiki: 'Nishiki Bridge', asahi: 'Asahi Bridge', minato: 'Minato Bridge', riverside: 'Riverside Avenue', komachi: 'Komachi-dori', otemachi: 'Otemachi-dori', lanterns: 'Lantern floating (main stage)', shuttle: 'Shuttle stop (east gate)', bikes: 'Bike parking (Shiroyama ES)', closed: 'Closed to vehicles', partial: 'One lane only', ped: 'Pedestrians only', north: 'N', scale: 'Not to scale' };
  const num = (x, y, n) => `<circle cx="${x}" cy="${y}" r="10" fill="#1b1b1b"/><text x="${x}" y="${y + 4}" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">${n}</text>`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 440" width="640" height="440" ${FONT}><rect width="640" height="440" fill="#f4f2ec"/>`;
  s += `<g stroke="#fff" stroke-width="7">${[[40, 30, 40, 380], [600, 200, 600, 300], [0, 105, 210, 100], [370, 112, 640, 104], [120, 0, 120, 110], [460, 0, 465, 140]].map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`).join('')}</g>`;
  s += `<path d="M-10 215C150 200 250 262 380 272S560 300 650 384" stroke="#a9cbe0" stroke-width="40" fill="none"/><text x="330" y="284" font-size="13" fill="#3f6f8f" font-style="italic">${T.river}</text>`;
  s += `<rect x="215" y="55" width="150" height="95" rx="10" fill="#cfe3c4" stroke="#9cbf8c"/><path d="M280 85h20v-8h-4v-6h-12v6h-4z" fill="#5d7f50"/><text x="290" y="108" font-size="12" text-anchor="middle" fill="#3d5c32">${T.castle}</text>`;
  s += `<rect x="470" y="150" width="140" height="34" rx="4" fill="#d6d6e8" stroke="#9a9ab8"/><text x="540" y="171" font-size="10.5" text-anchor="middle" fill="#333">${T.station}</text>`;
  s += `<rect x="40" y="120" width="100" height="28" rx="4" fill="#d6d6e8" stroke="#9a9ab8"/><text x="90" y="138" font-size="10.5" text-anchor="middle" fill="#333">${T.shiro}</text>`;
  s += `<path d="M175 192C260 192 330 238 425 248" stroke="#c8102e" stroke-width="7" fill="none"/>`; // 1 riverside
  s += `<line x1="170" y1="182" x2="178" y2="244" stroke="#c8102e" stroke-width="9"/>`; // 2 nishiki
  s += `<line x1="365" y1="95" x2="500" y2="150" stroke="#c8102e" stroke-width="6" stroke-dasharray="8 5"/>`; // 3 komachi
  s += `<line x1="420" y1="240" x2="430" y2="305" stroke="#e98a15" stroke-width="9"/>`; // 4 asahi
  s += `<line x1="262" y1="150" x2="174" y2="186" stroke="#c8102e" stroke-width="6"/>`; // 5 otemachi
  s += `<line x1="110" y1="148" x2="165" y2="186" stroke="#c8102e" stroke-width="6"/>`; // 6 shiromachi front
  s += `<line x1="555" y1="300" x2="545" y2="350" stroke="#bbb" stroke-width="8"/>`; // minato bridge
  s += num(300, 238, 1) + num(150, 214, 2) + num(430, 100, 3) + num(448, 268, 4) + num(240, 180, 5) + num(98, 178, 6);
  s += `<text x="186" y="252" font-size="10.5" fill="#333">${T.nishiki}</text><text x="380" y="320" font-size="10.5" fill="#333">${T.asahi}</text><text x="566" y="345" font-size="10.5" fill="#666">${T.minato}</text>`;
  s += `<text x="330" y="214" font-size="10.5" fill="#8b0a1f" transform="rotate(14 330 214)">${T.riverside}</text><text x="410" y="140" font-size="10" fill="#8b0a1f" transform="rotate(22 410 140)">${T.komachi}</text><text x="236" y="142" font-size="10" fill="#8b0a1f" text-anchor="end">${T.otemachi}</text>`;
  s += `<g transform="translate(150 266)"><rect x="-5" y="-8" width="10" height="13" rx="3" fill="#f2a900"/><text x="10" y="4" font-size="10.5" fill="#333">${T.lanterns}</text></g>`;
  s += `<g transform="translate(372 60)"><rect x="-6" y="-7" width="13" height="11" rx="2" fill="#0e2d4f"/><text x="12" y="3" font-size="10" fill="#333">${T.shuttle}</text></g>`;
  s += `<g transform="translate(52 52)"><circle r="7" fill="#2f7d4a"/><text x="12" y="4" font-size="10" fill="#333">${T.bikes}</text></g>`;
  s += `<g transform="translate(612 60)"><path d="M0-18l7 16h-14z" fill="#333"/><text x="0" y="12" font-size="11" text-anchor="middle" fill="#333">${T.north}</text></g>`;
  s += `<g font-size="10.5" fill="#333" transform="translate(14 392)"><rect width="616" height="40" fill="#fff" opacity=".85"/><line x1="10" y1="14" x2="40" y2="14" stroke="#c8102e" stroke-width="6"/><text x="46" y="18">${T.closed}</text><line x1="190" y1="14" x2="220" y2="14" stroke="#e98a15" stroke-width="6"/><text x="226" y="18">${T.partial}</text><line x1="400" y1="14" x2="430" y2="14" stroke="#c8102e" stroke-width="5" stroke-dasharray="6 4"/><text x="436" y="18">${T.ped}</text><text x="10" y="34" fill="#777">${T.scale}</text></g>`;
  return s + '</svg>';
}

// ---------------------------------------------------------------- page chrome
function header(ctx) {
  const t = ui[ctx.lang];
  const otherHref = rel(`${ctx.lang}/${ctx.page}`, `${other(ctx.lang)}/${ctx.page}`);
  const nav = S.sections.map(s => `<li${ctx.section === s.id ? ' class="on"' : ''}><a href="${L(ctx, sectionUrl(s.id))}">${esc(s[ctx.lang])}</a></li>`).join('');
  return `<div class="topbar"><div class="wrap">
<span class="tb-date">${t.today}</span>
<a class="tb-weather" href="${L(ctx, 'weather.html')}">${icon('umbrella')} ${ctx.lang === 'ja' ? '春川 22℃ 暴風警報' : 'Harukawa 22°C · Storm warning'}</a>
<span class="tb-spacer"></span>
<a class="tb-link" href="${L(ctx, pageUrl.newsletters)}">${t.newsletters}</a>
<a class="tb-link" href="${L(ctx, pageUrl.epaper)}">${t.epaper}</a>
<a class="tb-lang" href="${otherHref}" hreflang="${other(ctx.lang)}" lang="${other(ctx.lang)}">${t.otherLang}</a>
<a class="tb-login" href="${L(ctx, 'subscribe.html')}">${icon('user')}<span>${t.login}</span></a>
<a class="btn-sub" href="${L(ctx, 'subscribe.html')}">${t.subscribe}</a>
</div></div>
<header class="masthead"><div class="wrap">
<button class="menu-btn" type="button" aria-label="Menu">${icon('menu')}</button>
<a class="logo logo-${ctx.lang}" href="${L(ctx, 'index.html')}">${lanternMark}<span class="logo-text"><span class="logo-main">${t.siteName}</span><span class="logo-sub">${t.siteSub}</span></span></a>
<form class="hsearch" action="${L(ctx, 'search.html')}" role="search"><input type="search" name="q" placeholder="${t.searchPlaceholder}"><button type="submit" aria-label="${t.search}">${icon('search')}</button></form>
</div></header>
<nav class="mainnav"><div class="wrap"><ul>
<li${ctx.section === 'home' ? ' class="on"' : ''}><a href="${L(ctx, 'index.html')}">${t.home}</a></li>${nav}
<li class="nav-live"><a href="${L(ctx, LIVE.url)}"><span class="dot"></span>${t.liveNav}</a></li>
<li class="has-menu"><a href="${L(ctx, 'archive.html')}" class="more">${t.more} ▾</a><ul class="dropdown">
<li><a href="${L(ctx, 'archive.html')}">${t.archive}</a></li><li><a href="${L(ctx, 'search.html')}">${t.searchTitle}</a></li><li><a href="${L(ctx, 'corrections.html')}">${t.corrections}</a></li><li><a href="${L(ctx, 'subscribe.html')}">${t.subscribe}</a></li><li><a href="${L(ctx, 'about.html')}">${t.about}</a></li></ul></li>
</ul></div></nav>
<div class="breaking"><div class="wrap"><span class="b-label">${t.tickerLabel}</span><a href="${L(ctx, LIVE.url)}">${t.breaking}</a><span class="b-time">17:45</span></div></div>`;
}
function footer(ctx) {
  const t = ui[ctx.lang];
  const cols = t.footerCols.map(([h, links]) => `<div class="f-col"><h4>${h}</h4><ul>${(links || [['home', t.home], ...S.sections.map(s => [`section:${s.id}`, s[ctx.lang]])]).map(([k, label]) => `<li><a href="${k.startsWith('section:') ? L(ctx, sectionUrl(k.slice(8))) : L(ctx, pageUrl[k])}">${esc(label)}</a></li>`).join('')}</ul></div>`).join('');
  return `<footer class="site-footer"><div class="wrap">
<div class="f-top"><a class="logo logo-${ctx.lang} logo-small" href="${L(ctx, 'index.html')}">${lanternMark}<span class="logo-text"><span class="logo-main">${t.siteName}</span><span class="logo-sub">${t.siteSub}</span></span></a><p>${t.footerAbout}</p>
<div class="f-social"><a href="${L(ctx, pageUrl.newsletters)}" title="Newsletter">${icon('mail')}</a><a href="${L(ctx, 'about.html')}" title="RSS">${icon('share')}</a><a href="${L(ctx, 'about.html')}" title="App">${icon('bookmark')}</a></div></div>
<div class="f-cols">${cols}</div>
<div class="f-bottom"><p>${t.copyright}</p><p class="fictional">${t.fictional}</p></div>
</div></footer>`;
}
function overlays(ctx) {
  const t = ui[ctx.lang];
  return `<div class="cookie" id="cookie" hidden><div class="wrap"><p>${t.cookie.text} <a href="${L(ctx, 'about.html')}">${t.cookie.settings}</a></p><div class="cookie-btns"><button type="button" class="btn-ghost" data-consent="essential">${t.cookie.reject}</button><button type="button" class="btn-primary" data-consent="all">${t.cookie.accept}</button></div></div></div>
<div class="nl-modal" id="nl-modal" hidden><div class="nl-box" role="dialog" aria-label="${t.newsletter.title}"><button type="button" class="nl-x" data-close aria-label="${t.newsletter.close}">${icon('close')}</button><div class="nl-mark">${lanternMark}</div><h2>${t.newsletter.title}</h2><p>${t.newsletter.text}</p><form class="nl-form"><input type="email" placeholder="${t.newsletter.placeholder}" required><button class="btn-primary" type="submit">${t.newsletter.btn}</button></form><p class="fine">${t.newsletter.fine}</p><button type="button" class="nl-no" data-close>${t.newsletter.no}</button></div></div>
<div class="toast" id="toast" hidden></div>`;
}
function layout(ctx, { title, desc, main, bodyClass = '' }) {
  const t = ui[ctx.lang];
  const full = title ? `${title} | ${t.siteName}` : `${t.siteName} | ${t.tagline}`;
  return `<!doctype html>
<html lang="${ctx.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc || t.tagline)}">
<link rel="icon" href="${A(ctx, 'assets/favicon.svg')}" type="image/svg+xml">
<link rel="alternate" hreflang="${other(ctx.lang)}" href="${rel(`${ctx.lang}/${ctx.page}`, `${other(ctx.lang)}/${ctx.page}`)}">
<link rel="stylesheet" href="${A(ctx, 'assets/site.css')}">
</head>
<body class="lang-${ctx.lang} ${bodyClass}">
${header(ctx)}
${main}
${footer(ctx)}
${overlays(ctx)}
<script src="${A(ctx, 'assets/site.js')}"></script>
<script src="/unilens.js"></script>
<script>UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- shared bits
const secName = (id, lang) => S.sections.find(s => s.id === id)[lang];
const head = (a, lang) => a.text[lang]?.headline || a.id;
function kicker(a, ctx) {
  const t = ui[ctx.lang];
  if (a.id === LIVE.id) return `<span class="kicker live-k"><span class="dot"></span>${t.live}</span>`;
  const label = a.kind === 'editorial' ? t.editorial : a.kind === 'column' ? t.column : a.kind === 'correction' ? t.correctionKind : secName(a.section, ctx.lang);
  return `<span class="kicker">${esc(label)}</span>`;
}
const lock = (a, ctx) => (a.paywall ? `<span class="lock" title="${ui[ctx.lang].subscriberOnly}">${ui[ctx.lang].subscriberOnly}</span>` : '');
function card(a, ctx, { size = 'm', stand = true, image = true, time = true } = {}) {
  const d = a.text[ctx.lang];
  const pic = image && a.image ? `<a class="card-img" href="${L(ctx, urlOf(a.id))}"><img src="${img(ctx, a.image)}" alt="" loading="lazy"></a>` : '';
  return `<article class="card card-${size}">${pic}<div class="card-body">${kicker(a, ctx)}<h3><a href="${L(ctx, urlOf(a.id))}">${esc(d.headline)}</a></h3>${stand ? `<p class="stand">${esc(d.standfirst)}</p>` : ''}<p class="meta">${time ? `<time datetime="${a.updated || a.date}">${ago(a.updated || a.date, ctx.lang)}</time>` : ''}${lock(a, ctx)}${a.comments ? `<span class="cmt">${icon('comment')}${(d.comments || '').trim().split('\n').filter(Boolean).length}</span>` : ''}</p></div></article>`;
}
function adBox(ctx, i, cls = '') {
  const ad = ads[ctx.lang][i % ads[ctx.lang].length];
  return `<aside class="ad ${ad.cls} ${cls}"><span class="ad-label">${ui[ctx.lang].advert}</span><div class="ad-inner"><span class="ad-kicker">${esc(ad.kicker)}</span><strong>${esc(ad.title)}</strong><p>${esc(ad.text)}</p><span class="ad-cta">${esc(ad.cta)} ›</span></div></aside>`;
}
function weatherMini(ctx) {
  const t = ui[ctx.lang], w = S.weather;
  const days = w.week.slice(0, 4).map(d => { const p = parts(d.date); return `<li><span>${ctx.lang === 'ja' ? `${p.day}日（${WD.ja[p.wd]}）` : `${WD.en[p.wd]} ${p.day}`}</span>${wxIcon(d.icon)}<span>${d.high}° / ${d.low}°</span></li>`; }).join('');
  return `<section class="wx-mini"><h3><a href="${L(ctx, 'weather.html')}">${t.weatherWidget}</a></h3><div class="wx-now">${wxIcon('storm', 'wi big')}<div><strong>22°</strong><span>${t.weatherNow}</span><span class="wx-warn">${ctx.lang === 'ja' ? '暴風・大雨・高潮・波浪警報' : 'Storm, heavy rain, storm surge and high wave warnings'}</span></div></div><ul>${days}</ul><a class="more-link" href="${L(ctx, 'weather.html')}">${t.weatherLink} ›</a></section>`;
}
function mostList(ctx, ids) {
  return `<ol class="most">${ids.filter(id => ART[id]?.text[ctx.lang]).map(id => `<li><a href="${L(ctx, urlOf(id))}">${esc(head(ART[id], ctx.lang))}</a></li>`).join('')}</ol>`;
}
function rail(ctx, { adIndex = 0, extra = '' } = {}) {
  const t = ui[ctx.lang];
  return `<aside class="rail">${extra}
<section class="tabs" data-tabs><div class="tab-btns" role="tablist"><button type="button" role="tab" aria-selected="true" aria-controls="tp-read-${ctx.n}">${t.mostRead}</button><button type="button" role="tab" aria-selected="false" aria-controls="tp-cmt-${ctx.n}">${t.mostCommented}</button></div>
<div role="tabpanel" id="tp-read-${ctx.n}">${mostList(ctx, S.mostRead)}</div><div role="tabpanel" id="tp-cmt-${ctx.n}" hidden>${mostList(ctx, S.mostCommented)}</div></section>
${adBox(ctx, adIndex, 'ad-rect')}
<section class="nl-side"><h3>${t.nlBox.title}</h3><p>${t.nlBox.text}</p><form class="nl-form"><input type="email" placeholder="${t.newsletter.placeholder}" required><button class="btn-primary" type="submit">${t.nlBox.btn}</button></form></section>
${weatherMini(ctx)}
${adBox(ctx, adIndex + 2, 'ad-rect')}
</aside>`;
}
let pageCounter = 0;
const mk = (lang, page, extra = {}) => ({ lang, page, n: ++pageCounter, ...extra });

// ---------------------------------------------------------------- article page
function plainText(src) {
  return (src || '').split('[[paywall]]')[0].replace(/^\[\[.*\]\]$/gm, '').replace(/^(##+|>|!!|-)\s*/gm, '').replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/ -- /g, ' — ').replace(/\s+/g, ' ').trim();
}
const shareBar = ctx => { const t = ui[ctx.lang]; return `<div class="sharebar"><span class="sb-label">${t.share}</span><button type="button" class="sb" data-copy title="Copy link">${icon('link')}</button><a class="sb" href="mailto:?subject=The%20Harukawa%20Herald" title="Email">${icon('mail')}</a><button type="button" class="sb" data-print title="Print">${icon('print')}</button><button type="button" class="sb" data-save title="Save">${icon('bookmark')}</button><button type="button" class="sb" data-copy title="Share">${icon('share')}</button></div>`; };
function byline(a, ctx) {
  const t = ui[ctx.lang], au = S.authors[a.author];
  const name = ctx.lang === 'ja' ? au.ja : `${t.by} ${au.en}`;
  return `<div class="byline"><span class="avatar">${esc((au[ctx.lang] || '?').slice(0, 1))}</span><div><span class="author">${esc(name)}</span><span class="role">${esc(au.role[ctx.lang])}</span></div><div class="dates"><span>${t.published} <time datetime="${a.date}">${fmtDate(a.date, ctx.lang)}</time></span>${a.updated ? `<span>${t.updated} <time datetime="${a.updated}">${fmtDate(a.updated, ctx.lang)}</time></span>` : ''}</div></div>`;
}
function hero(a, ctx, caption) {
  if (!a.image) return '';
  const cr = S.credits[a.credit]?.[ctx.lang] || '';
  return `<figure class="hero"><img src="${img(ctx, a.image)}" alt="" fetchpriority="high"><figcaption>${esc(caption || '')} <span class="credit">${ctx.lang === 'ja' ? '' : 'Photo: '}${esc(cr)}</span></figcaption></figure>`;
}
function commentsHtml(d, ctx) {
  const t = ui[ctx.lang];
  const list = (d.comments || '').trim().split('\n').filter(Boolean).map(l => { const [who, when, likes, ...txt] = l.split('|').map(x => x.trim()); return { who, when: when.replace(' ', 'T'), likes: +likes, txt: txt.join('|') }; });
  if (!list.length) return '';
  return `<section class="comments" id="comments"><div class="c-head"><h2>${t.comments} <span class="count">${list.length}</span></h2><label class="c-sort">${t.sortBy} <select data-sort-comments><option value="best">${t.best}</option><option value="new">${t.newest}</option><option value="old">${t.oldest}</option></select></label></div>
<div class="c-form"><textarea placeholder="${t.commentPlaceholder}" disabled></textarea><div><a class="btn-primary" href="${L(ctx, 'subscribe.html')}">${t.login}</a></div></div>
<ul class="c-list">${list.sort((x, y) => y.likes - x.likes).map(c => `<li class="c" data-likes="${c.likes}" data-time="${c.when}"><span class="c-av">${esc(c.who.slice(0, 1).toUpperCase())}</span><div><p class="c-meta"><strong>${esc(c.who)}</strong> <time datetime="${c.when}">${fmtDate(c.when, ctx.lang)}</time></p><p>${esc(c.txt)}</p><p class="c-act"><button type="button" class="c-like">${icon('like')} <span>${c.likes}</span></button><button type="button">${t.reply}</button><button type="button">${t.report}</button></p></div></li>`).join('')}</ul></section>`;
}
function relatedHtml(a, ctx) {
  const rs = (a.related || []).map(id => ART[id]).filter(r => r?.text[ctx.lang]);
  if (!rs.length) return '';
  return `<section class="related"><div class="wrap"><h2>${ui[ctx.lang].related}</h2><div class="grid-4">${rs.map(r => card(r, ctx, { size: 's', stand: false })).join('')}</div></div></section>`;
}
function articlePage(a, lang) {
  const ctx = mk(lang, urlOf(a.id), { section: a.section });
  const t = ui[lang], d = a.text[lang];
  const [visible, hidden] = (d.body || '').split('[[paywall]]');
  const tags = a.tags.map(g => `<a class="tag" href="${L(ctx, tagUrl(g))}">${esc(S.tags[g][lang])}</a>`).join('');
  const words = lang === 'ja' ? plainText(d.body).length : plainText(d.body).split(' ').length;
  const mins = Math.max(2, Math.round(lang === 'ja' ? words / 500 : words / 220));
  const corr = d.correction ? `<aside class="correction"><strong>${t.correction} (${fmtDate(S.corrections.find(c => c.article === a.id)?.date || a.updated, lang)})</strong> ${esc(d.correction.trim())}</aside>` : '';
  const pay = hidden !== undefined ? `<div class="paywall"><div class="pw-fade"></div><div class="pw-box"><span class="pw-k">${t.subscriberOnly}</span><h2>${t.paywallTitle}</h2><p>${t.paywallText}</p><a class="btn-primary big" href="${L(ctx, 'subscribe.html')}">${t.paywallBtn}</a><p class="pw-small"><a href="${L(ctx, 'subscribe.html')}">${t.paywallLogin}</a> · ${t.paywallFree}</p></div></div>` : '';
  const crumbs = `<nav class="crumbs"><a href="${L(ctx, 'index.html')}">${t.breadcrumbHome}</a> › <a href="${L(ctx, sectionUrl(a.section))}">${esc(secName(a.section, lang))}</a></nav>`;
  const main = `<main id="main" class="wrap layout-article">
<article class="article${a.kind ? ' kind-' + a.kind : ''}${a.paywall ? ' is-paywalled' : ''}">
${crumbs}
${kicker(a, ctx)}${lock(a, ctx)}
<h1>${esc(d.headline)}</h1>
<p class="standfirst">${esc(d.standfirst)}</p>
${byline(a, ctx)}
<div class="art-tools">${shareBar(ctx)}<span class="readtime">${lang === 'ja' ? `約${mins}${t.minRead}` : `${mins} ${t.minRead}`}</span>${a.comments ? `<a class="to-comments" href="#comments">${icon('comment')} ${t.comments}</a>` : ''}</div>
${hero(a, ctx, d.caption)}
<div class="body">
${blocks(visible, ctx)}
</div>
${pay}
${corr}
<div class="tags"><span>${t.tagsLabel}:</span> ${tags}</div>
${shareBar(ctx)}
${a.comments ? commentsHtml(d, ctx) : ''}
</article>
${rail(ctx, { adIndex: a.id.length })}
</main>
${relatedHtml(a, ctx)}`;
  return { html: layout(ctx, { title: d.headline, desc: d.standfirst, main, bodyClass: 'page-article' }), words };
}

// ---------------------------------------------------------------- live blog
const catLabel = (c, lang) => ui[lang].liveCats[c] || c;
function livePage(lang) {
  const a = LIVE, d = a.text[lang], t = ui[lang];
  const ctx = mk(lang, LIVE.url, { section: 'weather' });
  const ups = d.list;
  const fmtT = iso => { const p = parts(iso); return lang === 'ja' ? `${p.day}日 ${p.t}` : `${p.t}`; };
  const updates = ups.map(u => `<article class="update${u.pinned ? ' pinned' : ''}" id="u-${u.dt.replace(/\D/g, '')}" data-cat="${u.cat}"><div class="u-time"><time datetime="${u.dt}">${fmtT(u.dt)}</time>${parts(u.dt).day !== 4 ? `<span class="u-day">${lang === 'ja' ? '' : `${WD.en[parts(u.dt).wd]} ${parts(u.dt).day} Oct`}</span>` : ''}</div><div class="u-body"><span class="u-cat cat-${u.cat}">${esc(catLabel(u.cat, lang))}</span><h2>${inline(u.title, ctx)}</h2>${blocks(u.body, ctx)}<button type="button" class="u-share" data-copy title="Copy link">${icon('link')}</button></div></article>`).join('\n');
  const keyEvents = `<section class="key-events"><h3>${lang === 'ja' ? '主な出来事' : 'Key events'}</h3><ul>${ups.slice(0, 10).map(u => `<li><a href="#u-${u.dt.replace(/\D/g, '')}"><time>${fmtT(u.dt)}</time> ${esc(u.title)}</a></li>`).join('')}</ul></section>`;
  const filters = ['all', 'warnings', 'evacuation', 'transport', 'city'].map((c, i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}" data-filter="${c}">${esc(t.liveCats[c])}</button>`).join('');
  const main = `<main id="main" class="wrap layout-article">
<article class="article live">
<nav class="crumbs"><a href="${L(ctx, 'index.html')}">${t.breadcrumbHome}</a> › <a href="${L(ctx, 'weather.html')}">${esc(secName('weather', lang))}</a></nav>
${kicker(a, ctx)}
<h1>${esc(d.headline)}</h1>
<p class="standfirst">${esc(d.standfirst)}</p>
${byline(a, ctx)}
<p class="live-status"><span class="dot"></span>${t.liveLatest}: <time datetime="${a.updated}">${fmtDate(a.updated, lang)}</time> · ${ups.length} ${t.liveUpdates} · ${t.liveAuto}</p>
${hero(a, ctx, d.caption)}
<section class="keypoints"><h2>${t.liveKey} <span class="pin">${t.livePinned}</span></h2>${blocks(d.summary, ctx)}</section>
<div class="live-filter"><span>${t.liveFilter}:</span>${filters}</div>
<button type="button" class="new-updates" hidden>${t.newUpdates}</button>
<div class="updates">${updates}</div>
<p class="live-start">${t.liveStarted}: ${fmtDate(a.date, lang)}</p>
${shareBar(ctx)}
</article>
${rail(ctx, { adIndex: 1, extra: keyEvents })}
</main>
${relatedHtml({ related: ['typhoon-forecast', 'embankment-works', 'festival-road-closures', 'seagulls-clinch'] }, ctx)}`;
  return layout(ctx, { title: d.headline, desc: d.standfirst, main, bodyClass: 'page-live' });
}

// ---------------------------------------------------------------- listing pages
function listItem(a, ctx) {
  const d = a.text[ctx.lang];
  return `<article class="li">${a.image ? `<a class="li-img" href="${L(ctx, urlOf(a.id))}"><img src="${img(ctx, a.image)}" alt="" loading="lazy"></a>` : ''}<div>${kicker(a, ctx)}<h3><a href="${L(ctx, urlOf(a.id))}">${esc(d.headline)}</a></h3><p class="stand">${esc(d.standfirst)}</p><p class="meta"><time datetime="${a.date}">${fmtDate(a.date, ctx.lang)}</time> · ${esc(S.authors[a.author][ctx.lang])}${lock(a, ctx)}</p></div></article>`;
}
function frontPage(lang) {
  const ctx = mk(lang, 'index.html', { section: 'home' });
  const t = ui[lang], all = ready(lang).sort(byNewest), lv = LIVE.text[lang];
  const g = id => ART[id];
  const latest = lv ? lv.list.slice(0, 4).map(u => `<li><a href="${L(ctx, LIVE.url)}#u-${u.dt.replace(/\D/g, '')}"><time>${parts(u.dt).t}</time>${esc(u.title)}</a></li>`).join('') : '';
  const leadHtml = lv ? `<section class="lead"><a class="lead-img" href="${L(ctx, LIVE.url)}"><img src="${img(ctx, LIVE.image)}" alt=""><span class="live-badge"><span class="dot"></span>${t.liveNow}</span></a>${kicker(LIVE, ctx)}<h2><a href="${L(ctx, LIVE.url)}">${esc(lv.headline)}</a></h2><p class="stand">${esc(lv.standfirst)}</p><ul class="lead-updates">${latest}</ul><h2 class="sec-h">${t.latest}</h2><ul class="latest-list">${all.filter(a => a.id !== LIVE.id).slice(0, 9).map(a => `<li><time datetime="${a.date}">${ago(a.date, lang)}</time><div>${kicker(a, ctx)}<a href="${L(ctx, urlOf(a.id))}">${esc(head(a, lang))}</a>${lock(a, ctx)}</div></li>`).join('')}</ul></section>` : '';
  const side = ['festival-road-closures', 'typhoon-forecast'].map(id => card(g(id), ctx, { size: 'm' })).join('') + `<ul class="headlines">${['seagulls-clinch', 'crowd-sensors', 'editorial-embankment', 'port-cargo'].map(id => `<li>${kicker(g(id), ctx)}<a href="${L(ctx, urlOf(id))}">${esc(head(g(id), lang))}</a>${lock(g(id), ctx)}</li>`).join('')}</ul>`;
  const top = ['city-budget', 'mayoral-election-poll', 'railway-timetable', 'kumo-mobile-prices'].map(id => card(g(id), ctx, { size: 's' })).join('');
  const secBlocks = S.sections.filter(s => !['opinion', 'weather'].includes(s.id)).map(s => {
    const items = all.filter(a => a.section === s.id && a.id !== LIVE.id);
    if (!items.length) return '';
    return `<section class="sec-block"><h2 class="sec-h"><a href="${L(ctx, sectionUrl(s.id))}">${esc(s[lang])} ›</a></h2>${card(items[0], ctx, { size: 's', stand: true })}<ul class="headlines">${items.slice(1, 4).map(a => `<li><a href="${L(ctx, urlOf(a.id))}">${esc(head(a, lang))}</a>${lock(a, ctx)}</li>`).join('')}</ul></section>`;
  }).join('');
  const ops = all.filter(a => a.section === 'opinion').map(a => { const au = S.authors[a.author]; return `<article class="op"><span class="op-av">${esc(au[lang].slice(0, 1))}</span><div>${kicker(a, ctx)}<h3><a href="${L(ctx, urlOf(a.id))}">${esc(head(a, lang))}</a></h3><p class="meta">${esc(au[lang])}${lock(a, ctx)}</p></div></article>`; }).join('');
  const pics = all.filter(a => a.image && a.text[lang].caption).slice(0, 10).map(a => `<figure><a href="${L(ctx, urlOf(a.id))}"><img src="${img(ctx, a.image)}" alt="" loading="lazy"></a><figcaption>${esc(a.text[lang].caption)}</figcaption></figure>`).join('');
  const main = `<main id="main" class="wrap front">
<div class="front-top">${leadHtml}<div class="lead-side">${side}</div>${rail(ctx, { adIndex: 0 })}</div>
<section class="top-strip"><h2 class="sec-h">${t.topStories}</h2><div class="grid-4">${top}</div></section>
${adBox(ctx, 3, 'ad-wide')}
<div class="sec-grid">${secBlocks}</div>
<section class="opinion-row"><h2 class="sec-h"><a href="${L(ctx, sectionUrl('opinion'))}">${t.opinionTitle} ›</a></h2><div class="grid-4">${ops}</div></section>
<section class="pictures"><h2 class="sec-h">${t.inPictures}</h2><div class="carousel"><button type="button" class="car-prev" aria-label="${t.prev}">${icon('left')}</button><div class="car-track">${pics}</div><button type="button" class="car-next" aria-label="${t.next}">${icon('right')}</button></div></section>
${adBox(ctx, 4, 'ad-wide')}
</main>`;
  return layout(ctx, { title: '', main, bodyClass: 'page-front' });
}
function sectionPage(sec, lang) {
  const ctx = mk(lang, sectionUrl(sec.id), { section: sec.id });
  const t = ui[lang];
  const items = ready(lang).filter(a => a.section === sec.id && a.id !== LIVE.id).sort(byNewest);
  const tagIds = [...new Set(items.flatMap(a => a.tags))];
  const main = `<main id="main" class="wrap layout-list">
<div class="list-main">
<nav class="crumbs"><a href="${L(ctx, 'index.html')}">${t.breadcrumbHome}</a> › ${esc(sec[lang])}</nav>
<h1 class="page-h">${esc(sec[lang])}</h1>
<div class="subnav">${tagIds.map(g => `<a href="${L(ctx, tagUrl(g))}">${esc(S.tags[g][lang])}</a>`).join('')}</div>
${items[0] ? `<div class="sec-lead">${card(items[0], ctx, { size: 'l' })}</div>` : ''}
<div class="grid-2">${items.slice(1, 3).map(a => card(a, ctx, { size: 'm' })).join('')}</div>
<div class="list">${items.slice(3).map(a => listItem(a, ctx)).join('')}</div>
${adBox(ctx, sec.id.length, 'ad-wide')}
</div>
${rail(ctx, { adIndex: sec.id.length + 1 })}
</main>`;
  return layout(ctx, { title: sec[lang], main, bodyClass: 'page-section' });
}
function tagPage(id, lang) {
  const ctx = mk(lang, tagUrl(id));
  const t = ui[lang];
  const items = ready(lang).filter(a => a.tags.includes(id)).sort(byNewest);
  const main = `<main id="main" class="wrap layout-list"><div class="list-main">
<nav class="crumbs"><a href="${L(ctx, 'index.html')}">${t.breadcrumbHome}</a> › ${t.tagPage}</nav>
<p class="kicker">${t.tagPage}</p><h1 class="page-h">${esc(S.tags[id][lang])}</h1><p class="count-line">${t.articlesCount(items.length)}</p>
<div class="list">${items.map(a => listItem(a, ctx)).join('')}</div></div>
${rail(ctx, { adIndex: id.length })}</main>`;
  return layout(ctx, { title: S.tags[id][lang], main, bodyClass: 'page-tag' });
}
function archivePage(lang) {
  const ctx = mk(lang, 'archive.html');
  const t = ui[lang];
  const items = ready(lang).sort(byNewest);
  const days = [];
  for (let d = toMs('2026-10-04T12:00'); d >= toMs('2026-09-21T12:00'); d -= 86400000) days.push(new Date(d + 9 * 3600000).toISOString().slice(0, 10));
  const strip = days.map(day => { const n = items.filter(a => dayKey(a.date) === day).length; const p = parts(day); return `<a class="cal-day${n ? '' : ' empty'}" href="#d-${day}"><span>${lang === 'ja' ? WD.ja[p.wd] : WD.en[p.wd]}</span><strong>${p.day}</strong><em>${n}</em></a>`; }).join('');
  const groups = days.map(day => { const list = items.filter(a => dayKey(a.date) === day); if (!list.length) return ''; return `<section class="arch-day" id="d-${day}"><h2>${fmtDate(day, lang, { time: false, long: true })}</h2><ul>${list.map(a => `<li><time>${parts(a.date).t}</time>${kicker(a, ctx)}<a href="${L(ctx, urlOf(a.id))}">${esc(head(a, lang))}</a>${lock(a, ctx)}</li>`).join('')}</ul></section>`; }).join('');
  const main = `<main id="main" class="wrap layout-list"><div class="list-main">
<h1 class="page-h">${t.archiveTitle}</h1><p class="intro">${t.archiveIntro}</p>
<div class="cal">${strip}</div>${groups}</div>${rail(ctx, { adIndex: 2 })}</main>`;
  return layout(ctx, { title: t.archiveTitle, main, bodyClass: 'page-archive' });
}
function searchPage(lang) {
  const ctx = mk(lang, 'search.html');
  const t = ui[lang];
  const main = `<main id="main" class="wrap layout-list"><div class="list-main">
<h1 class="page-h">${t.searchTitle}</h1><p class="intro">${t.searchHint}</p>
<form class="search-form" id="search-form"><input type="search" name="q" id="q" placeholder="${t.searchPlaceholder}"><select name="s" id="s"><option value="">${t.filterAll}</option>${S.sections.map(s => `<option value="${s.id}">${esc(s[lang])}</option>`).join('')}</select><select name="o" id="o"><option value="rel">${t.sortRelevance}</option><option value="new">${t.sortNewest}</option></select><button class="btn-primary" type="submit">${t.searchBtn}</button></form>
<p class="count-line" id="search-count"></p><div class="list" id="search-results" data-none="${esc(t.noResults)}" data-results-en="${lang}"></div></div>
${rail(ctx, { adIndex: 3 })}</main>`;
  return layout(ctx, { title: t.searchTitle, main, bodyClass: 'page-search' });
}
function correctionsPage(lang) {
  const ctx = mk(lang, 'corrections.html');
  const p = pages[lang].corrections;
  const list = S.corrections.map(c => `<li><p class="meta"><time datetime="${c.date}">${fmtDate(c.date, lang)}</time></p><h3><a href="${L(ctx, urlOf(c.article))}">${esc(head(ART[c.article], lang))}</a></h3><p>${esc(c[lang])}</p></li>`).join('');
  const notice = ART['correction-library-date'];
  const main = `<main id="main" class="wrap layout-list"><div class="list-main">
<h1 class="page-h">${p.title}</h1><p class="intro">${p.intro}</p><ul class="corr-list">${list}</ul>
${notice?.text[lang] ? `<p class="see-also">${lang === 'ja' ? '訂正記事：' : 'Correction notice: '}<a href="${L(ctx, urlOf(notice.id))}">${esc(head(notice, lang))}</a></p>` : ''}</div>
${rail(ctx, { adIndex: 4 })}</main>`;
  return layout(ctx, { title: p.title, main, bodyClass: 'page-corrections' });
}
function aboutPage(lang) {
  const ctx = mk(lang, 'about.html');
  const p = pages[lang].about;
  const main = `<main id="main" class="wrap layout-article"><article class="article">
<h1>${p.title}</h1><figure class="hero"><img src="${img(ctx, 'castle')}" alt=""><figcaption>${lang === 'ja' ? '春川城と市街地。春川日報は1898年からこの町を伝えてきた。' : 'Harukawa Castle above the city. The paper has covered the town since 1898.'} <span class="credit">${S.credits.kanda[lang]}</span></figcaption></figure>
<div class="body">${blocks(p.body, ctx)}</div></article>${rail(ctx, { adIndex: 1 })}</main>`;
  return layout(ctx, { title: p.title, main, bodyClass: 'page-about' });
}
function subscribePage(lang) {
  const ctx = mk(lang, 'subscribe.html');
  const p = pages[lang].subscribe, t = ui[lang], rows = S.tables.plans[lang].rows;
  const cards = [1, 3, 4].map((i, k) => `<div class="plan${k === 0 ? ' best' : ''}">${k === 0 ? `<span class="plan-flag">${lang === 'ja' ? '人気No.1' : 'Most popular'}</span>` : ''}<h3>${esc(rows[i][0])}</h3><p class="price">${esc(rows[i][1])}<small>${lang === 'ja' ? '／月' : ' / month'}</small></p><p>${esc(rows[i][2])}</p><p class="fine">${esc(rows[i][3])}</p><a class="btn-primary" href="#plans">${t.subscribe}</a></div>`).join('');
  const nls = lang === 'ja' ? [['モーニング・ブリーフィング', '平日6時30分'], ['台風・防災速報', '警報発表時'], ['春川シーガルズ便り', '試合翌朝'], ['週末おでかけ', '金曜17時']] : [['The Morning Briefing', 'Weekdays 6:30'], ['Storm and disaster alerts', 'When warnings are issued'], ['Seagulls Notebook', 'Morning after each game'], ['Weekend Out', 'Fridays 17:00']];
  const main = `<main id="main" class="wrap"><div class="sub-hero"><h1>${p.title}</h1><p>${p.intro}</p></div>
<div class="plans">${cards}</div>
<section id="plans">${tableHtml('plans', lang)}</section>
<section class="perks"><h2>${lang === 'ja' ? '有料会員の特典' : 'What subscribers get'}</h2><ul>${p.perks.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
<section class="faq"><h2>${p.faqTitle}</h2>${p.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
<section class="newsletters" id="newsletters"><h2>${t.newsletters}</h2><form class="nl-form nl-list">${nls.map(([n, w]) => `<label><input type="checkbox"> <strong>${n}</strong> <span>${w}</span></label>`).join('')}<input type="email" placeholder="${t.newsletter.placeholder}" required><button class="btn-primary" type="submit">${t.newsletter.btn}</button></form></section>
</main>`;
  return layout(ctx, { title: p.title, main, bodyClass: 'page-subscribe' });
}
function weatherPage(lang) {
  const ctx = mk(lang, 'weather.html', { section: 'weather' });
  const p = pages[lang].weather, w = S.weather, t = ui[lang], dt = t.weatherDetails;
  const warn = w.warnings.map(x => `<details class="warn warn-${x.level}"><summary><span class="w-level">${p.warnLevel[x.level]}</span>${esc(x[lang][0])} <span class="w-time">${x.issued} ${p.issuedAt}</span></summary><p>${esc(x[lang][1])}</p></details>`).join('');
  const td = w.today;
  const details = [[dt.high, `${td.high}°C`], [dt.low, `${td.low}°C`], [dt.humidity, `${td.humidity}%`], [dt.pressure, `${td.pressure} hPa`], [dt.wind, `${td.windDir[lang]} ${td.wind} m/s (${dt.gust} ${td.gust} m/s)`], [dt.rainSoFar, `${td.rainSoFar} mm`], [dt.rain24, `${td.rain24} mm (${lang === 'ja' ? '山地' : 'mountains'} ${td.rainMountains} mm)`], [dt.sunrise, td.sunrise], [dt.sunset, td.sunset], [dt.uv, td.uv[lang]]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  const week = w.week.map(d => { const q = parts(d.date); return `<tr${q.day >= 10 ? ' class="fest"' : ''}><td>${lang === 'ja' ? `${q.m}/${q.day}（${WD.ja[q.wd]}）` : `${WD.en[q.wd]} ${q.day} Oct`}</td><td>${wxIcon(d.icon)} ${esc(d[lang])}</td><td class="hi">${d.high}°</td><td class="lo">${d.low}°</td><td>${d.pop}%</td><td>${d.wind[lang]}</td><td>${d.conf}</td></tr>`; }).join('');
  const news = [LIVE, ...ready(lang).filter(a => a.section === 'weather' && a.id !== LIVE.id)].filter(a => a.text[lang]).map(a => listItem(a, ctx)).join('');
  const main = `<main id="main" class="wrap layout-list"><div class="list-main">
<nav class="crumbs"><a href="${L(ctx, 'index.html')}">${t.breadcrumbHome}</a> › ${t.weather}</nav>
<h1 class="page-h">${p.title}</h1><p class="intro">${p.intro}</p>
<section class="warnings"><h2>${p.warningsTitle}</h2>${warn}<p class="live-link"><a href="${L(ctx, LIVE.url)}"><span class="dot"></span>${t.liveNav} ›</a></p></section>
<section class="wx-today"><h2>${dt.title}</h2><div class="wx-today-grid"><div class="wx-big">${wxIcon('storm', 'wi big')}<strong>22°</strong><span>${t.weatherNow}</span></div><dl>${details}</dl></div></section>
<section><h2>${p.hourlyTitle}</h2><figure class="figure chart"><img src="${A(ctx, `assets/charts/weather-hourly.${lang}.svg`)}" alt=""><figcaption>${p.hourlyNote}</figcaption></figure></section>
<section><h2>${p.weekTitle}</h2><div class="table-scroll"><table class="data week"><thead><tr>${p.weekHead.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${week}</tbody></table></div><p class="table-note">${p.confNote}</p><p class="fest-note">${p.festivalNote}</p></section>
<section><h2>${p.trackTitle}</h2><figure class="figure chart">${typhoonSvg(lang)}<figcaption>${p.trackNote}</figcaption></figure></section>
<section><h2>${p.tidesTitle}</h2><table class="data small"><tbody>${p.tides.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</tbody></table></section>
<section><h2>${p.newsTitle}</h2><div class="list">${news}</div></section>
</div>${rail(ctx, { adIndex: 0 })}</main>`;
  return layout(ctx, { title: p.title, main, bodyClass: 'page-weather' });
}

// ---------------------------------------------------------------- build
const stats = [];
for (const lang of LANGS) {
  for (const id of Object.keys(S.charts)) write(`assets/charts/${id}.${lang}.svg`, chartSvg(id, lang));
  write(`assets/charts/weather-hourly.${lang}.svg`, weatherSvg(lang));
  write(`assets/charts/festival-map.${lang}.svg`, festivalSvg(lang));

  const index = [];
  for (const a of S.articles) {
    const art = ART[a.id];
    if (!art.text[lang]) continue;
    const { html, words } = articlePage(art, lang);
    write(`${lang}/${urlOf(a.id)}`, html);
    stats.push(`${lang} ${a.id}: ${words}${lang === 'ja' ? ' chars' : ' words'}`);
  }
  if (LIVE.text[lang]) write(`${lang}/${LIVE.url}`, livePage(lang));
  write(`${lang}/index.html`, frontPage(lang));
  for (const s of S.sections) if (s.id !== 'weather') write(`${lang}/${sectionUrl(s.id)}`, sectionPage(s, lang));
  for (const id of Object.keys(S.tags)) write(`${lang}/${tagUrl(id)}`, tagPage(id, lang));
  write(`${lang}/archive.html`, archivePage(lang));
  write(`${lang}/search.html`, searchPage(lang));
  write(`${lang}/corrections.html`, correctionsPage(lang));
  write(`${lang}/about.html`, aboutPage(lang));
  write(`${lang}/subscribe.html`, subscribePage(lang));
  write(`${lang}/weather.html`, weatherPage(lang));

  for (const a of ready(lang)) {
    const d = a.text[lang];
    const body = a.id === LIVE.id ? d.list.map(u => `${u.title}. ${plainText(u.body)}`).join(' ') : plainText(d.body);
    index.push({ u: urlOf(a.id), t: d.headline, s: d.standfirst, sec: a.section, sn: secName(a.section, lang), d: fmtDate(a.date, lang), iso: a.date, tags: a.tags.map(g => S.tags[g][lang]).join(' '), x: body, p: !!a.paywall });
  }
  write(`${lang}/search-index.json`, JSON.stringify(index));
}
write('index.html', `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>The Harukawa Herald</title><meta http-equiv="refresh" content="0; url=en/index.html"></head>
<body><p><a href="en/index.html">The Harukawa Herald (English)</a> · <a href="ja/index.html">春川日報（日本語）</a></p>
<script src="/unilens.js"></script>
<script>UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })</script>
</body>
</html>
`);
write('assets/favicon.svg', lanternMark.replace('class="mark" ', 'xmlns="http://www.w3.org/2000/svg" '));

if (process.argv.includes('--stats')) console.log(stats.join('\n'));
console.log(`Built ${LANGS.length} languages; ${S.articles.length} articles + live blog.`);
if (warnings.length) { console.log(`Warnings (${warnings.length}):`); for (const w of [...new Set(warnings)]) console.log('  ' + w); process.exitCode = 1; }
