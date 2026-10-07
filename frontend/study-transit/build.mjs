// Builds the Springvale Railway study site: node build.mjs (Node standard library only).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from './content/data.mjs';
import proseEn from './content/pages-en.mjs';
import proseJa from './content/pages-ja.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const LANGS = ['en', 'ja'];
const { stations, byId, lines, lineStations } = D;

// ---------- small helpers ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const L = (lang, v) => (v && typeof v === 'object' && 'en' in v) ? v[lang] : v;
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const hm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const yen = (n, lang) => lang === 'ja' ? `${n.toLocaleString('en')}円` : `¥${n.toLocaleString('en')}`;
const sname = (id, lang) => byId[id][lang];
const write = (rel, content) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
const lineOf = id => Object.keys(byId[id].km); // ['K'] | ['B'] | ['K','B']
const codeOf = (id, line) => byId[id].codes.find(c => c[0] === line) || byId[id].codes[0];

// distance along the network (the two lines meet at Springvale Central)
export function distance(a, b) {
  const la = lineOf(a), lb = lineOf(b);
  const common = la.find(l => lb.includes(l));
  const d = common ? Math.abs(byId[a].km[common] - byId[b].km[common]) : byId[a].km[la[0]] + byId[b].km[lb[0]];
  return Math.round(d * 10) / 10;
}
const kmCharged = d => Math.max(1, Math.ceil(d));
export function fare(a, b) {
  const k = kmCharged(distance(a, b));
  const band = D.fareBands.find(([max]) => k <= max);
  return { km: distance(a, b), charged: k, ticket: band[1], ic: band[2], childTicket: Math.floor(band[1] / 20) * 10, childIc: Math.floor(band[2] / 2) };
}
const xFee = km => D.tsukikageFee.bands.find(([max]) => kmCharged(km) <= max)[1];

// ---------- trains, generated from the service plan ----------
const trains = [];
for (const day of ['wd', 'we']) {
  for (const [line, dir, type, o, d, times] of D.services[day]) {
    const p = D.patterns[line][type];
    const io = p.stops.indexOf(o), id = p.stops.indexOf(d);
    if (io < 0 || id < 0) throw new Error(`bad pattern ${line} ${type} ${o}-${d}`);
    const seq = dir === 'd' ? p.stops.slice(io, id + 1) : p.stops.slice(id, io + 1).reverse();
    for (const tm of times) {
      const dep = toMin(tm);
      const stops = seq.map(s => { const m = dep + Math.abs(p.cum[p.stops.indexOf(s)] - p.cum[io]); return [s, m, D.platformOf(s, line, dir, type, o)]; });
      if (stops.at(-1)[1] >= 24 * 60) throw new Error(`train past midnight ${tm} ${o}`);
      const h = Math.floor(dep / 60);
      const no = type === 'X' ? (dir === 'd' ? (h - 6) * 2 - 1 : (h - 5) * 2) : null;
      trains.push({ id: `${day}-${line}${dir}${type}-${o}-${tm.replace(':', '')}`, day, line, dir, type, o, d, no, stops });
    }
  }
}
for (const day of ['wd', 'we']) { // Comet numbers must be unique per day
  const nos = trains.filter(t => t.day === day && t.no).map(t => t.no);
  if (new Set(nos).size !== nos.length) throw new Error('duplicate Comet number');
}
const trainName = (t, lang) => {
  const ty = D.types[t.type][lang];
  const name = t.type === 'X' ? (lang === 'ja' ? `特急「月影」${t.no}号` : `Ltd. Exp. Comet ${t.no}`) : ty;
  return lang === 'ja' ? `${name} ${sname(t.d, 'ja')}行` : `${name} for ${sname(t.d, 'en')}`;
};

// ---------- UI strings ----------
const T = {
  siteName: { en: 'Springvale Railway', ja: '春川鉄道' },
  siteSub: { en: 'Vale Rail · 春川鉄道', ja: 'HARUKAWA RAILWAY' },
  footerNote: { en: 'Fictional website made for research (UniLens user study).', ja: '研究用に作成した架空のウェブサイトです（UniLens ユーザー調査）。' },
  search: { en: 'Search', ja: '検索' },
  searchPh: { en: 'Search the site', ja: 'サイト内検索' },
  reserve: { en: 'Reserve a Comet seat', ja: '「月影」座席予約' },
  status: { en: 'Service status', ja: '運行情報' },
  asOf: { en: `as of ${D.TODAY.time}, ${D.TODAY.en}`, ja: `${D.TODAY.ja} ${D.TODAY.time}現在` },
  details: { en: 'Details', ja: '詳細' },
  home: { en: 'Home', ja: 'ホーム' },
  weekday: { en: 'Weekdays', ja: '平日' },
  weekend: { en: 'Saturdays, Sundays and holidays', ja: '土曜・休日' },
  weekendShort: { en: 'Sat/Sun/Hol', ja: '土休日' },
  platform: { en: 'Platform', ja: '番線' },
  yes: { en: 'Yes', ja: 'あり' }, no: { en: 'No', ja: 'なし' },
};
const t = (k, lang) => T[k][lang];

// navigation: [label, [[label, path]]]
const NAV = [
  [{ en: 'Timetables & Routes', ja: '時刻表・路線図' }, [
    [{ en: 'Journey planner', ja: '乗換案内' }, 'planner.html'], [{ en: 'Timetables', ja: '時刻表' }, 'timetable/index.html'],
    [{ en: 'Route map', ja: '路線図' }, 'route-map.html'], [{ en: 'Mirror Line', ja: '鏡線' }, 'lines/kagami.html'], [{ en: 'Bayside Line', ja: '湾岸線' }, 'lines/bayside.html']]],
  [{ en: 'Fares & Tickets', ja: '運賃・きっぷ' }, [
    [{ en: 'Fares', ja: '運賃のご案内' }, 'fares/index.html'], [{ en: 'Fare matrix', ja: '駅間運賃表' }, 'fares/matrix.html'], [{ en: 'Fare calculator', ja: '運賃検索' }, 'fares/calculator.html'],
    [{ en: 'Tickets overview', ja: 'きっぷの種類' }, 'tickets/index.html'], [{ en: 'RideCard IC card', ja: 'IC カード「ハルカ」' }, 'tickets/haruca.html'], [{ en: 'Passes & package tickets', ja: 'おトクなきっぷ' }, 'tickets/passes.html'],
    [{ en: 'Commuter passes', ja: '定期券' }, 'tickets/commuter.html'], [{ en: 'Discounts', ja: '各種割引' }, 'tickets/discounts.html']]],
  [{ en: 'Ltd. Exp. Comet', ja: '特急「月影」' }, [
    [{ en: 'About the Comet', ja: '「月影」のご案内' }, 'tsukikage/index.html'], [{ en: 'Reserve a seat', ja: '座席を予約する' }, 'reserve/index.html'],
    [{ en: 'Surcharges', ja: '特急料金' }, 'tsukikage/index.html#fees'], [{ en: 'Changes and refunds', ja: '変更・払いもどし' }, 'tsukikage/index.html#refunds']]],
  [{ en: 'Stations', ja: '駅情報' }, [
    [{ en: 'All stations', ja: '駅一覧' }, 'stations/index.html'], ...['central', 'shiromachi', 'daigakumae', 'kamano', 'tsukimionsen', 'minoriport'].map(id => [{ en: byId[id].en, ja: byId[id].ja }, `stations/${id}.html`]),
    [{ en: 'Accessibility & assistance', ja: 'バリアフリー・お手伝い' }, 'accessibility.html']]],
  [{ en: 'Service Info', ja: '運行・お知らせ' }, [
    [{ en: 'Service status', ja: '運行情報' }, 'status.html'], [{ en: 'Notices', ja: 'お知らせ' }, 'notices/index.html'], [{ en: 'Lost and found', ja: 'お忘れ物' }, 'lost-found.html'],
    [{ en: 'Rules and conditions', ja: 'ご利用のきまり' }, 'rules.html'], [{ en: 'FAQ', ja: 'よくあるご質問' }, 'faq.html']]],
  [{ en: 'Trips', ja: 'おでかけ' }, [
    [{ en: 'Moonview Spa', ja: '月見温泉へ' }, 'trips/tsukimi-onsen.html'], [{ en: 'Springvale Lantern Festival', ja: '春川灯籠まつり' }, 'trips/lantern-festival.html'], [{ en: 'About Vale Rail', ja: '会社案内' }, 'about.html']]],
];

const LOGO = `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#123a63"/><path d="M9 29 C14 20 16 13 20 9" stroke="#2fc07f" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M9 29 C17 28 25 30 32 26" stroke="#4aa3ef" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="9" cy="29" r="3.3" fill="#fff"/><circle cx="27.5" cy="12.5" r="3" fill="#f2a3b8"/></svg>`;
const ICON = {
  search: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M13 13l4.5 4.5" stroke="currentColor" stroke-width="2"/></svg>',
  swap: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M6 3v13M6 16l-3-3M6 16l3-3M14 17V4M14 4l-3 3M14 4l3 3" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
  menu: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="2"/></svg>',
  print: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M5 8V3h10v5M5 14H3V8h14v6h-2M6 11h8v6H6z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',
  top: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 12l6-6 6 6" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>',
};

function statusStrip(lang) {
  const chip = k => { const s = D.status[k]; const name = k === 'X' ? (lang === 'ja' ? '特急「月影」' : 'Comet') : lines[k][lang];
    return `<span class="st-chip"><i style="background:${k === 'X' ? '#3b2a7a' : lines[k].color}"></i>${name} <b class="st-${s.state}">${s[lang]}</b></span>`; };
  return `<div class="status-strip"><div class="wrap"><a href="/${lang}/status.html" class="st-title">${t('status', lang)}</a><span class="st-time">${t('asOf', lang)}</span>${chip('K')}${chip('B')}${chip('X')}<a class="st-more" href="/${lang}/status.html">${t('details', lang)} ›</a></div></div>`;
}

function header(lang, rel) {
  const other = lang === 'en' ? 'ja' : 'en';
  const nav = NAV.map(([label, items]) => `<li class="nav-item"><a href="/${lang}/${items[0][1]}">${L(lang, label)}</a><div class="dropdown"><ul>${items.map(([l, p]) => `<li><a href="/${lang}/${p}">${L(lang, l)}</a></li>`).join('')}</ul></div></li>`).join('');
  return `<div class="util"><div class="wrap"><span>${lang === 'ja' ? 'みのり県春川市の鉄道会社' : 'Railway of Springvale City, Harvest Prefecture'}</span><nav><a href="/${lang}/about.html">${lang === 'ja' ? '会社案内' : 'Company'}</a><a href="/${lang}/about.html#recruit">${lang === 'ja' ? '採用情報' : 'Careers'}</a><a href="/${lang}/accessibility.html">${lang === 'ja' ? 'バリアフリー' : 'Accessibility'}</a><a href="/${lang}/faq.html">${lang === 'ja' ? 'お問い合わせ' : 'Contact'}</a></nav></div></div>
${statusStrip(lang)}
<header class="site-header"><div class="wrap hdr">
<a class="logo" href="/${lang}/index.html">${LOGO}<span><b>${t('siteName', lang)}</b><small>${t('siteSub', lang)}</small></span></a>
<form class="hsearch" action="/${lang}/search.html" role="search"><input name="q" type="search" placeholder="${t('searchPh', lang)}" aria-label="${t('search', lang)}"><button type="submit" title="${t('search', lang)}">${ICON.search}</button></form>
<a class="lang-switch" href="/${other}/${rel}" hreflang="${other}" lang="${other}">${other === 'ja' ? '日本語' : 'English'}</a>
<a class="btn-reserve" href="/${lang}/reserve/index.html">${t('reserve', lang)}</a>
<button class="menu-btn" type="button" aria-label="Menu">${ICON.menu}</button>
</div><nav class="gnav"><ul class="wrap">${nav}</ul></nav></header>`;
}

function footer(lang) {
  const cols = NAV.slice(0, 5).map(([label, items]) => `<div><h4>${L(lang, label)}</h4><ul>${items.map(([l, p]) => `<li><a href="/${lang}/${p}">${L(lang, l)}</a></li>`).join('')}</ul></div>`).join('');
  return `<footer class="site-footer"><div class="wrap fcols">${cols}</div>
<div class="wrap fbottom"><div class="fco">${LOGO}<div><b>${lang === 'ja' ? '春川鉄道株式会社' : 'Springvale Railway Co., Ltd.'}</b><br>${lang === 'ja' ? '〒780-0001 みのり県春川市駅前町1-1' : '1-1 Station Square, Springvale, Harvest Prefecture 780-0001'}<br>${lang === 'ja' ? 'お客さまセンター 050-3000-8341（8:00〜20:00、年中無休）' : 'Customer Centre 050-3000-8341 (8:00–20:00, every day)'}</div></div>
<ul class="flinks"><li><a href="/${lang}/rules.html">${lang === 'ja' ? 'ご利用のきまり' : 'Terms of carriage'}</a></li><li><a href="/${lang}/about.html#privacy">${lang === 'ja' ? '個人情報の取り扱い' : 'Privacy'}</a></li><li><a href="/${lang}/about.html#site">${lang === 'ja' ? 'サイトのご利用について' : 'About this site'}</a></li><li><a href="/${lang}/search.html">${lang === 'ja' ? 'サイト内検索' : 'Site search'}</a></li></ul>
<p class="copy">© 2026 ${lang === 'ja' ? 'Harukawa Railway' : 'Springvale Railway'} Co., Ltd.</p><p class="fict">${t('footerNote', lang)}</p></div></footer>
<a class="to-top" href="#top" title="${lang === 'ja' ? 'ページの先頭へ' : 'Back to top'}">${ICON.top}</a>
<div class="cookie" hidden><p>${lang === 'ja' ? '当サイトでは、利便性の向上とアクセス解析のためにCookieを使用しています。サイトを引き続きご利用いただくと、Cookieの使用に同意したものとみなします。' : 'We use cookies to improve your experience and to analyse site traffic. By continuing to use this site you agree to our use of cookies.'} <a href="/${lang}/about.html#privacy">${lang === 'ja' ? '詳しく見る' : 'Learn more'}</a></p><button type="button" class="cookie-ok">${lang === 'ja' ? '同意する' : 'Accept'}</button><button type="button" class="cookie-x" aria-label="Close">×</button></div>`;
}

const SIDEBAR = lang => `<aside class="side">
<a class="promo promo-onsen" href="/${lang}/tickets/passes.html#yukemuri"><img src="/assets/img/onsen-station.jpg" alt=""><span><b>${lang === 'ja' ? '月見温泉ゆけむりきっぷ' : 'Moonview Spa Day Ticket'}</b>${lang === 'ja' ? '「月影」往復＋総湯入浴券つき 2,800円' : 'Comet both ways + bath entry, ¥2,800'}</span></a>
<a class="promo promo-haruca" href="/${lang}/tickets/haruca.html#points"><b>${lang === 'ja' ? 'ハルカ ポイント' : 'RideCard Points'}</b><span>${lang === 'ja' ? '同じ区間を月11回以上で10%還元' : '10% back from your 11th ride a month'}</span></a>
<a class="promo promo-fest" href="/${lang}/notices/lantern-festival-trains.html"><b>${lang === 'ja' ? '灯籠まつり臨時列車' : 'Lantern Festival extra trains'}</b><span>${lang === 'ja' ? '10月10日（土）・11日（日）' : 'Sat 10 and Sun 11 Oct'}</span></a>
<div class="side-box"><h4>${lang === 'ja' ? 'よく見られているページ' : 'Popular pages'}</h4><ul>
<li><a href="/${lang}/timetable/tsukimionsen-kagami-south.html">${lang === 'ja' ? '月見温泉駅 時刻表（上り）' : 'Moonview Spa timetable (southbound)'}</a></li>
<li><a href="/${lang}/fares/matrix.html">${lang === 'ja' ? '駅間運賃表' : 'Fare matrix'}</a></li>
<li><a href="/${lang}/notices/timetable-revision-2026-11.html">${lang === 'ja' ? '11月14日ダイヤ改正' : 'Timetable revision, 14 Nov'}</a></li>
<li><a href="/${lang}/accessibility.html#stepfree">${lang === 'ja' ? '段差のないルート' : 'Step-free routes'}</a></li></ul></div>
<div class="ad"><span class="ad-label">${lang === 'ja' ? '広告' : 'Advertisement'}</span><b>${lang === 'ja' ? 'クモモバイル 春川中央店' : 'Kumo Mobile Springvale Central'}</b><span>${lang === 'ja' ? '南口すぐ。乗り換え相談は予約がおすすめ' : 'Right by the South Exit. Book a visit to switch plans.'}</span></div>
</aside>`;

const pages = []; // {lang, rel, title, body, crumbs}
function layout(lang, rel, { title, body, crumbs = [], side = false, desc = '', wide = false }) {
  const crumbHtml = rel === 'index.html' ? '' : `<ol class="crumbs wrap"><li><a href="/${lang}/index.html">${t('home', lang)}</a></li>${crumbs.map(([l, p]) => `<li><a href="/${lang}/${p}">${L(lang, l)}</a></li>`).join('')}<li>${esc(title)}</li></ol>`;
  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}${rel === 'index.html' ? '' : ` | ${t('siteName', lang)}`}</title>
<meta name="description" content="${esc(desc || title)}">
<link rel="stylesheet" href="/assets/css/site.css">
<link rel="alternate" hreflang="${lang === 'en' ? 'ja' : 'en'}" href="/${lang === 'en' ? 'ja' : 'en'}/${rel}">
</head>
<body id="top" class="lang-${lang}">
${header(lang, rel)}
${crumbHtml}
<div class="wrap page${side ? ' has-side' : ''}${wide ? ' wide' : ''}"><main class="main">
${body}
</main>${side ? SIDEBAR(lang) : ''}</div>
${footer(lang)}
<script src="/assets/js/site.js"></script>
<script src="/unilens.js"></script>
<script>UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })</script>
</body>
</html>
`;
  pages.push({ lang, rel, title, html });
}
const queue = []; // rendered at the end, once the prose is loaded
const addPage = (rel, fn) => queue.push([rel, fn]);

// ---------- SVG: route map ----------
const xStops = D.patterns.K.X.stops;
function routeMap(lang, { small = false } = {}) {
  const pos = {};
  lineStations.K.forEach((id, i) => { pos[id] = i === 0 ? [110, 520] : i <= 5 ? [110, 520 - i * 76] : [190 + (i - 6) * 100, 70]; });
  lineStations.B.forEach((id, i) => { if (i) pos[id] = [110 + i * 97.5, 520]; });
  const lbl = (id) => { const [x, y] = pos[id]; const nm = esc(sname(id, lang));
    if (id === 'central') return `<text x="${x - 30}" y="${y + 50}" class="rm-name rm-big">${nm}</text>`;
    if (lineOf(id)[0] === 'B') return `<text x="${x}" y="${y + 30}" text-anchor="middle" class="rm-name">${nm}</text>`;
    const i = lineStations.K.indexOf(id);
    if (i <= 5) return `<text x="${x + 26}" y="${y + 4}" class="rm-name">${nm}</text>`;
    return `<text x="${x}" y="${y + 30}" text-anchor="middle" class="rm-name">${nm}</text>`; };
  const marker = (id) => { const [x, y] = pos[id];
    if (id === 'central') return `<rect x="${x - 22}" y="${y - 22}" width="44" height="44" rx="10" fill="#fff" stroke="#123a63" stroke-width="3"/><text x="${x}" y="${y - 4}" text-anchor="middle" class="rm-code" fill="${lines.K.color}">K01</text><text x="${x}" y="${y + 11}" text-anchor="middle" class="rm-code" fill="${lines.B.color}">B01</text>`;
    const l = lineOf(id)[0]; const c = codeOf(id, l);
    return `<rect x="${x - 17}" y="${y - 10}" width="34" height="20" rx="4" fill="#fff" stroke="${lines[l].color}" stroke-width="2.5"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="rm-code">${c}</text>`; };
  const xMark = (id) => { if (!xStops.includes(id) || id === 'central') return ''; const [x, y] = pos[id]; const i = lineStations.K.indexOf(id);
    const [mx, my] = i <= 5 ? [x - 30, y] : [x, y - 22]; return `<path d="M${mx} ${my - 6}l6 6-6 6-6-6z" fill="#3b2a7a"/>`; };
  const stationsSvg = stations.map(s => `<a href="/${lang}/stations/${s.id}.html">${marker(s.id)}${lbl(s.id)}${xMark(s.id)}</a>`).join('');
  const lg = lang === 'ja'
    ? ['鏡線（K）春川中央〜月見温泉 38.6km', '湾岸線（B）春川中央〜みのり港 16.2km', '特急「月影」停車駅', '乗換駅', '鏡川', 'みのり湾', '月見山 ▲1,214m', '春川城']
    : ['Mirror Line (K) Springvale Central–Moonview Spa 38.6 km', 'Bayside Line (B) Springvale Central–Ferry Port 16.2 km', 'Ltd. Exp. Comet stop', 'Transfer station', 'Mirror River', 'Harvest Bay', 'Mt Moonview ▲1,214 m', 'Springvale Castle'];
  return `<svg class="routemap${small ? ' small' : ''}" viewBox="0 0 960 610" role="img" aria-label="${lang === 'ja' ? '路線図' : 'Route map'}">
<rect x="0" y="0" width="960" height="610" fill="#fbfcfd"/>
<path d="M0 575 C200 560 400 590 600 570 S860 560 960 575 V610 H0z" fill="#d8ecfa"/><text x="760" y="598" class="rm-geo">${lg[5]}</text>
<path d="M960 120 C800 140 640 100 470 150 S240 200 175 300 S140 460 70 560" stroke="#bfe0f7" stroke-width="9" fill="none" stroke-linecap="round"/><text x="520" y="140" class="rm-geo" transform="rotate(-8 520 140)">${lg[4]}</text>
<path d="M820 175 l40 -50 l40 50z" fill="#e6efe6" stroke="#9cb79c"/><text x="860" y="194" text-anchor="middle" class="rm-geo">${lg[6]}</text>
<path d="M190 430 h22 v-8 h-4 v-6 h-14 v6 h-4z" fill="#c9b9a0"/><text x="218" y="433" class="rm-geo">${lg[7]}</text>
<path d="M110 520 V140 Q110 70 180 70 H890" stroke="${lines.K.color}" stroke-width="7" fill="none"/>
<path d="M110 520 H890" stroke="${lines.B.color}" stroke-width="7" fill="none"/>
${stationsSvg}
<g class="rm-legend" transform="translate(300 230)"><rect x="0" y="0" width="${lang === 'ja' ? 330 : 420}" height="118" rx="6" fill="#fff" stroke="#cfd6de"/>
<path d="M14 22h36" stroke="${lines.K.color}" stroke-width="7"/><text x="60" y="26">${lg[0]}</text>
<path d="M14 48h36" stroke="${lines.B.color}" stroke-width="7"/><text x="60" y="52">${lg[1]}</text>
<path d="M32 66l6 6-6 6-6-6z" fill="#3b2a7a"/><text x="60" y="78">${lg[2]}</text>
<rect x="22" y="88" width="20" height="20" rx="5" fill="#fff" stroke="#123a63" stroke-width="2.5"/><text x="60" y="103">${lg[3]}</text></g>
</svg>`;
}

// ---------- SVG: station plan ----------
function stationPlan(id, lang) {
  const P = D.majorInfo[id].plan; const W = 680;
  const hasBottom = P.exits.some(e => e[0] === 'bottom');
  let y = 160; let tracks = '';
  for (const [a, b, label] of P.platforms) {
    if (b) { tracks += `<line x1="70" x2="610" y1="${y}" y2="${y}" class="sp-track"/><text x="52" y="${y + 4}" class="sp-num">${a}</text><rect x="90" y="${y + 9}" width="500" height="26" class="sp-plat"/><text x="340" y="${y + 26}" text-anchor="middle" class="sp-plabel">${esc(L(lang, label))}</text><line x1="70" x2="610" y1="${y + 44}" y2="${y + 44}" class="sp-track"/><text x="52" y="${y + 48}" class="sp-num">${b}</text>`; y += 70; }
    else { tracks += `<rect x="90" y="${y - 6}" width="500" height="24" class="sp-plat"/><text x="340" y="${y + 10}" text-anchor="middle" class="sp-plabel">${esc(L(lang, label))}</text><line x1="70" x2="610" y1="${y + 28}" y2="${y + 28}" class="sp-track"/><text x="52" y="${y + 32}" class="sp-num">${a}</text>`; y += 56; }
  }
  const H = y + (hasBottom ? 50 : 14);
  const nm = { gate: ['Ticket gates', '改札口'], office: ['Ticket office', 'きっぷうりば'], machines: ['Ticket machines', '券売機'], wc: ['Toilets', 'トイレ'], lift: ['Lift', 'エレベーター'], locker: ['Lockers', 'コインロッカー'], info: ['Information', '案内所'], shop: ['Shops', '売店'] };
  const glyph = (k, x, i) => {
    const yy = 52;
    const g = { gate: `<g class="sp-gate">${[0, 6, 12, 18].map(d => `<rect x="${x - 11 + d}" y="${yy}" width="3" height="18"/>`).join('')}</g>`,
      office: `<rect x="${x - 11}" y="${yy}" width="22" height="18" rx="2" class="sp-ic"/><path d="M${x - 6} ${yy + 6}h12M${x - 6} ${yy + 11}h8" class="sp-icl"/>`,
      machines: `<rect x="${x - 11}" y="${yy}" width="9" height="18" class="sp-ic"/><rect x="${x + 2}" y="${yy}" width="9" height="18" class="sp-ic"/>`,
      wc: `<rect x="${x - 11}" y="${yy}" width="22" height="18" rx="3" class="sp-ic"/><text x="${x}" y="${yy + 13}" text-anchor="middle" class="sp-ict">WC</text>`,
      lift: `<rect x="${x - 10}" y="${yy}" width="20" height="18" rx="2" class="sp-lift"/><path d="M${x - 4} ${yy + 8}l4-5 4 5zM${x - 4} ${yy + 10}l4 5 4-5z" fill="#fff"/>`,
      locker: `<g class="sp-ic">${[0, 1, 2].map(c => [0, 1].map(r => `<rect x="${x - 11 + c * 7.5}" y="${yy + r * 9}" width="7" height="9"/>`).join('')).join('')}</g>`,
      info: `<circle cx="${x}" cy="${yy + 9}" r="10" class="sp-ic"/><text x="${x}" y="${yy + 14}" text-anchor="middle" class="sp-ict">i</text>`,
      shop: `<path d="M${x - 11} ${yy + 4}h22l-2 14h-18z" class="sp-ic"/>` };
    return g[k] + `<text x="${x}" y="${yy + 30 + (i % 2) * 11}" text-anchor="middle" class="sp-lbl">${nm[k][lang === 'ja' ? 1 : 0]}</text>`;
  };
  const items = [...P.items].sort((a, b) => Number(a.split(':')[1]) - Number(b.split(':')[1])).map((s, i) => { const [k, f] = s.split(':'); const x = 60 + Number(f) * 560;
    const drop = k === 'lift' ? `<line x1="${x}" x2="${x}" y1="96" y2="${y - 20}" class="sp-liftline"/>` : '';
    return drop + glyph(k, x, i); }).join('');
  const exits = P.exits.map(([side, en, ja]) => { const l = esc(lang === 'ja' ? ja : en);
    if (side === 'left') return `<path d="M40 66h-28m8-7l-8 7 8 7" class="sp-exit"/><text x="6" y="92" class="sp-exitl">${l}</text>`;
    if (side === 'right') return `<path d="M640 66h28m-8-7l8 7-8 7" class="sp-exit"/><text x="674" y="92" text-anchor="end" class="sp-exitl">${l}</text>`;
    if (side === 'top') return `<path d="M340 30v-22m-7 8l7-8 7 8" class="sp-exit"/><text x="352" y="18" class="sp-exitl">${l}</text>`;
    return `<path d="M340 ${H - 40}v26m-7-8l7 8 7-8" class="sp-exit"/><text x="352" y="${H - 18}" class="sp-exitl">${l}</text>`; }).join('');
  const conc = lang === 'ja' ? (id === 'tsukimionsen' || id === 'minoriport' ? '駅舎・コンコース（1階）' : 'コンコース（2階）') : (id === 'tsukimionsen' || id === 'minoriport' ? 'Station building (ground floor)' : 'Concourse (2F)');
  return `<svg class="stplan" viewBox="0 0 ${W} ${H}" role="img" aria-label="${lang === 'ja' ? '駅構内図' : 'Station plan'}"><rect width="${W}" height="${H}" fill="#fff"/>
<rect x="40" y="30" width="600" height="${hasBottom && P.platforms.length === 0 ? 90 : 90}" rx="4" class="sp-conc"/><text x="48" y="44" class="sp-lbl sp-title">${conc}</text>${items}${exits}${tracks}</svg>`;
}

// ---------- SVG charts ----------
function chartFrame(w, h, inner, title) { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="Arial, 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif" font-size="11">${title ? `<title>${esc(title)}</title>` : ''}<rect width="${w}" height="${h}" fill="#fff"/>${inner}</svg>`; }
function ridershipChart(lang) {
  const rows = stations; const max = 40000; const w = 640, top = 34, rowH = 21, h = top + rows.length * rowH + 30, x0 = 150, cw = 450;
  let g = `<text x="10" y="20" font-size="13" font-weight="bold" fill="#123a63">${lang === 'ja' ? `駅別 1日平均乗車人員（${D.ridershipYear.ja}）` : `Average daily boardings by station (${D.ridershipYear.en})`}</text>`;
  for (let v = 0; v <= max; v += 10000) { const x = x0 + v / max * cw; g += `<line x1="${x}" x2="${x}" y1="${top - 4}" y2="${h - 26}" stroke="#e3e7ec"/><text x="${x}" y="${h - 12}" text-anchor="middle" fill="#667">${v.toLocaleString('en')}</text>`; }
  rows.forEach((s, i) => { const y = top + i * rowH; const l = lineOf(s.id).length > 1 ? 'K' : lineOf(s.id)[0]; const bw = s.ridership / max * cw;
    g += `<text x="${x0 - 8}" y="${y + 14}" text-anchor="end" fill="#333">${s.codes[0]} ${esc(s[lang])}</text><rect x="${x0}" y="${y + 4}" width="${bw.toFixed(1)}" height="13" fill="${lines[l].color}"/><text x="${x0 + bw + 4}" y="${y + 14}" fill="#555" font-size="10">${s.ridership.toLocaleString('en')}</text>`; });
  return chartFrame(w, h, g);
}
function fareChart(lang) {
  const w = 600, h = 300, x0 = 54, y0 = 260, cw = 520, ch = 210, maxKm = 55, maxY = 1000;
  const X = k => x0 + k / maxKm * cw, Y = v => y0 - v / maxY * ch;
  let g = `<text x="10" y="20" font-size="13" font-weight="bold" fill="#123a63">${lang === 'ja' ? '距離別の普通運賃（大人）' : 'Adult fare by distance'}</text>`;
  for (let v = 0; v <= maxY; v += 200) g += `<line x1="${x0}" x2="${x0 + cw}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e3e7ec"/><text x="${x0 - 6}" y="${Y(v) + 4}" text-anchor="end" fill="#667">${v}</text>`;
  for (let k = 0; k <= maxKm; k += 5) g += `<text x="${X(k)}" y="${y0 + 16}" text-anchor="middle" fill="#667">${k}</text>`;
  g += `<text x="${x0 + cw}" y="${y0 + 32}" text-anchor="end" fill="#667">km</text><text x="${x0 - 40}" y="${y0 - ch - 8}" fill="#667">${lang === 'ja' ? '円' : 'yen'}</text>`;
  let prev = 0, dT = '', dI = '';
  for (const [max, tk, ic] of D.fareBands) { dT += `${dT ? 'L' : 'M'}${X(prev)} ${Y(tk)} L${X(max)} ${Y(tk)} `; dI += `${dI ? 'L' : 'M'}${X(prev)} ${Y(ic) + 3} L${X(max)} ${Y(ic) + 3} `; prev = max; }
  g += `<path d="${dT}" stroke="#123a63" stroke-width="2.5" fill="none"/><path d="${dI}" stroke="#e8730c" stroke-width="2" fill="none" stroke-dasharray="5 3"/>`;
  g += `<rect x="${x0 + 10}" y="40" width="10" height="3" fill="#123a63"/><text x="${x0 + 26}" y="45">${lang === 'ja' ? 'きっぷ' : 'Paper ticket'}</text><rect x="${x0 + 110}" y="40" width="10" height="3" fill="#e8730c"/><text x="${x0 + 126}" y="45">${lang === 'ja' ? 'HaruCa' : 'RideCard'} (IC)</text>`;
  return chartFrame(w, h, g);
}
function punctualityChart(lang) {
  const w = 640, h = 260, x0 = 50, y0 = 220, cw = 560, ch = 170, lo = 94, hi = 100, data = D.punctuality;
  const X = i => x0 + i * cw / (data.length - 1), Y = v => y0 - (v - lo) / (hi - lo) * ch;
  let g = `<text x="10" y="20" font-size="13" font-weight="bold" fill="#123a63">${lang === 'ja' ? '定時運行率（1分未満の遅れの列車の割合）' : 'Punctuality (share of trains less than 1 minute late)'}</text>`;
  for (let v = lo; v <= hi; v += 1) g += `<line x1="${x0}" x2="${x0 + cw}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e3e7ec"/><text x="${x0 - 6}" y="${Y(v) + 4}" text-anchor="end" fill="#667">${v}%</text>`;
  const mon = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
  data.forEach(([m, v], i) => { const [yy, mm] = m.split('-').map(Number); const lab = lang === 'ja' ? `${mm}月` : mon.en[mm - 1];
    g += `<text x="${X(i)}" y="${y0 + 16}" text-anchor="middle" fill="#667">${lab}</text>${mm === 1 || i === 0 ? `<text x="${X(i)}" y="${y0 + 30}" text-anchor="middle" fill="#999" font-size="10">${yy}</text>` : ''}<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="#12925c"/><text x="${X(i)}" y="${Y(v) - 8}" text-anchor="middle" font-size="10" fill="#333">${v}</text>`; });
  g += `<path d="${data.map(([, v], i) => `${i ? 'L' : 'M'}${X(i)} ${Y(v)}`).join(' ')}" stroke="#12925c" stroke-width="2" fill="none"/>`;
  return chartFrame(w, h, g, lang === 'ja' ? '月別定時運行率' : 'Punctuality by month');
}
const occupancy = [[1, 38], [3, 52], [5, 71], [7, 64], [9, 58], [13, 47], [17, 44], [21, 40], [25, 29], [2, 61], [6, 35], [8, 49], [10, 55], [12, 63], [14, 66], [16, 70], [18, 74], [20, 68], [22, 59], [24, 52], [26, 41], [28, 45], [30, 22]];
function occupancyChart(lang) {
  const w = 640, h = 250, x0 = 40, y0 = 200, cw = 580, ch = 150, n = occupancy.length, bw = cw / n;
  let g = `<text x="10" y="20" font-size="13" font-weight="bold" fill="#123a63">${lang === 'ja' ? '「月影」号別 平均乗車率（2025年度・%）' : 'Comet average seat occupancy by train (FY2025, %)'}</text>`;
  for (let v = 0; v <= 100; v += 25) g += `<line x1="${x0}" x2="${x0 + cw}" y1="${y0 - v / 100 * ch}" y2="${y0 - v / 100 * ch}" stroke="#e3e7ec"/><text x="${x0 - 6}" y="${y0 - v / 100 * ch + 4}" text-anchor="end" fill="#667">${v}</text>`;
  occupancy.forEach(([no, v], i) => { const x = x0 + i * bw; g += `<rect x="${x + 3}" y="${y0 - v / 100 * ch}" width="${bw - 6}" height="${v / 100 * ch}" fill="${no % 2 ? '#3b2a7a' : '#8f7fc6'}"/><text x="${x + bw / 2}" y="${y0 + 14}" text-anchor="middle" font-size="10" fill="#555">${no}</text>`; });
  g += `<text x="${x0}" y="${y0 + 32}" fill="#667">${lang === 'ja' ? '■ 下り（奇数号）　■ 上り（偶数号）' : '■ Northbound (odd numbers)   ■ Southbound (even numbers)'}</text>`;
  return chartFrame(w, h, g, lang === 'ja' ? '「月影」乗車率' : 'Comet occupancy');
}
for (const lang of LANGS) {
  write(`assets/charts/ridership-${lang}.svg`, ridershipChart(lang));
  write(`assets/charts/fares-${lang}.svg`, fareChart(lang));
}

// ---------- timetables ----------
const LINE_SLUG = { K: 'kagami', B: 'bayside' };
const endOf = (line, dir) => dir === 'd' ? lineStations[line].at(-1) : 'central';
const destMark = { kamano: { en: 'Ka', ja: '釜' }, kagamikyo: { en: 'Kk', ja: '峡' }, minorikoen: { en: 'Mk', ja: '公' } };
function departures(st, line, dir, day, type) {
  return trains.filter(tr => tr.day === day && tr.line === line && tr.dir === dir && (!type || tr.type === type)).map(tr => {
    const i = tr.stops.findIndex(s => s[0] === st);
    return i < 0 || i === tr.stops.length - 1 ? null : { tr, m: tr.stops[i][1], plat: tr.stops[i][2] };
  }).filter(Boolean).sort((a, b) => a.m - b.m);
}
const ttDirs = st => { const out = []; for (const line of lineOf(st)) for (const dir of ['d', 'u']) if (st !== endOf(line, dir)) out.push([line, dir]); return out; };
const ttRel = (st, line, dir) => `timetable/${st}-${LINE_SLUG[line]}-${lines[line].dirs[dir].slug}.html`;
const arrAt = (tr, st) => (tr.stops.find(s => s[0] === st) || [])[1];

function ttGrid(st, line, dir, day, lang) {
  const deps = departures(st, line, dir, day); const end = endOf(line, dir); const lineStart = dir === 'd' ? 'central' : lineStations[line].at(-1);
  const rows = [];
  for (let h = 5; h <= 23; h++) {
    const cells = deps.filter(x => Math.floor(x.m / 60) === h).map(({ tr, m }) => {
      const mk = D.types[tr.type].mark[lang]; const dm = tr.d !== end ? destMark[tr.d][lang] : ''; const start = tr.o === st && st !== lineStart;
      return `<span class="tm t-${tr.type}" data-train="${tr.id}">${start ? '<i class="st">●</i>' : ''}${mk ? `<sup>${mk}</sup>` : ''}${String(m % 60).padStart(2, '0')}${dm ? `<sub>${dm}</sub>` : ''}</span>`;
    }).join('');
    rows.push(`<tr><th>${h}</th><td>${cells || '<span class="none">—</span>'}</td></tr>`);
  }
  return `<table class="tt"><thead><tr><th>${lang === 'ja' ? '時' : 'Hour'}</th><td>${lang === 'ja' ? '分' : 'Minutes'}</td></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}
function ttLegend(st, line, dir, lang) {
  const end = endOf(line, dir); const items = [];
  const deps = [...departures(st, line, dir, 'wd'), ...departures(st, line, dir, 'we')];
  if (deps.some(x => x.tr.type === 'X')) items.push(lang === 'ja' ? '<b class="t-X">◆</b> 特急「月影」（全車指定席・特急券が必要です）' : '<b class="t-X">◆</b> Ltd. Exp. Comet (reserved seats only; limited express ticket required)');
  if (deps.some(x => x.tr.type === 'R')) items.push(lang === 'ja' ? '<b class="t-R">快</b> 快速' : '<b class="t-R">R</b> Rapid');
  for (const k of Object.keys(destMark)) if (deps.some(x => x.tr.d === k && k !== end)) items.push(`<b>${destMark[k][lang]}</b> ${lang === 'ja' ? `${sname(k, 'ja')}行` : `for ${sname(k, 'en')}`}`);
  if (deps.some(x => x.tr.o === st)) items.push(lang === 'ja' ? '<b>●</b> 当駅始発' : '<b>●</b> Starts at this station');
  items.push(lang === 'ja' ? `無印 普通 ${sname(end, 'ja')}行` : `No mark: Local for ${sname(end, 'en')}`);
  return `<ul class="tt-legend">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
}
function firstLast(st, line, dir, lang) {
  const end = endOf(line, dir);
  const row = day => { const d = departures(st, line, dir, day); if (!d.length) return '';
    const toEnd = d.filter(x => x.tr.d === end); const last = d.at(-1); const lastEnd = toEnd.at(-1);
    return `<tr><th>${day === 'wd' ? t('weekday', lang) : t('weekendShort', lang)}</th><td>${hm(d[0].m)} <small>${esc(trainName(d[0].tr, lang))}</small></td><td>${hm(last.m)} <small>${esc(trainName(last.tr, lang))}</small></td><td>${lastEnd ? `${hm(lastEnd.m)} <small>(${lang === 'ja' ? '着' : 'arr.'} ${hm(arrAt(lastEnd.tr, end))})</small>` : '—'}</td></tr>`; };
  return `<table class="data small"><thead><tr><th></th><th>${lang === 'ja' ? '始発' : 'First train'}</th><th>${lang === 'ja' ? '最終' : 'Last train'}</th><th>${lang === 'ja' ? `${sname(end, 'ja')}まで行く最終` : `Last train to ${sname(end, 'en')}`}</th></tr></thead><tbody>${row('wd')}${row('we')}</tbody></table>`;
}
const stationSelect = (lang, cur) => `<select class="jump" aria-label="${lang === 'ja' ? '駅を選択' : 'Choose a station'}"><option value="">${lang === 'ja' ? '他の駅の時刻表' : 'Other stations…'}</option>${['K', 'B'].map(l => `<optgroup label="${lines[l][lang]}">${lineStations[l].map(id => ttDirs(id).filter(([ln]) => ln === l).map(([ln, dir]) => `<option value="/${lang}/${ttRel(id, ln, dir)}"${id === cur ? ' disabled' : ''}>${codeOf(id, l)} ${esc(sname(id, lang))} – ${lines[ln].dirs[dir].short[lang]}</option>`).join('')).join('')}</optgroup>`).join('')}</select>`;

for (const s of stations) for (const [line, dir] of ttDirs(s.id)) {
  const rel = ttRel(s.id, line, dir);
  addPage(rel, lang => {
    const ln = lines[line]; const plat = [...new Set(departures(s.id, line, dir, 'wd').map(x => x.plat))].sort().join(lang === 'ja' ? '・' : ', ');
    const others = ttDirs(s.id).filter(([l, d]) => l !== line || d !== dir);
    const title = lang === 'ja' ? `${s.ja}駅 時刻表 ${ln.ja} ${ln.dirs[dir].ja}` : `${s.en} timetable: ${ln.en}, ${ln.dirs[dir].en}`;
    return { title, crumbs: [[{ en: 'Timetables', ja: '時刻表' }, 'timetable/index.html']], side: false, body: `
<h1 class="h1">${lang === 'ja' ? `${s.ja}駅　時刻表` : `${s.en} Station timetable`}</h1>
<div class="tt-head"><span class="badge" style="background:${ln.color}">${codeOf(s.id, line)}</span><b>${ln[lang]}</b> <span class="dirlabel">${ln.dirs[dir][lang]}</span> <span class="muted">${lang === 'ja' ? `${plat}番線` : `Platform ${plat}`}</span>
<span class="tt-tools">${stationSelect(lang, s.id)} <button type="button" class="icon-btn print" title="${lang === 'ja' ? '印刷' : 'Print'}">${ICON.print}</button></span></div>
<p class="note-bar">${lang === 'ja' ? '2026年11月13日（金）までの時刻です。11月14日（土）にダイヤ改正を行います。' : 'Valid until Friday 13 November 2026. The timetable changes on Saturday 14 November.'} <a href="/${lang}/notices/timetable-revision-2026-11.html">${lang === 'ja' ? '改正内容' : 'What changes'}</a></p>
<div class="tabs" data-tabs><div class="tab-bar" role="tablist"><button type="button" role="tab" class="on" data-tab="wd">${t('weekday', lang)}</button><button type="button" role="tab" data-tab="we">${t('weekend', lang)}</button></div>
<div class="tab-panel" data-panel="wd">${ttGrid(s.id, line, dir, 'wd', lang)}</div><div class="tab-panel" data-panel="we" hidden>${ttGrid(s.id, line, dir, 'we', lang)}</div></div>
${ttLegend(s.id, line, dir, lang)}
<p class="small muted">${lang === 'ja' ? '時刻をクリックすると、その列車の停車駅と到着時刻を表示します。年末年始（12月30日〜1月3日）は土曜・休日ダイヤで運転します。灯籠まつり当日の臨時列車はこの時刻表に含まれていません。' : 'Click a time to see that train\'s stops and arrival times. From 30 December to 3 January trains run to the Saturday/holiday timetable. Extra trains for the Lantern Festival are not shown here.'}</p>
<h2 class="h2">${lang === 'ja' ? '始発・最終列車' : 'First and last trains'}</h2>${firstLast(s.id, line, dir, lang)}
<h2 class="h2">${lang === 'ja' ? '関連リンク' : 'Related'}</h2><ul class="links">${others.map(([l, d]) => `<li><a href="/${lang}/${ttRel(s.id, l, d)}">${lang === 'ja' ? `${lines[l].ja} ${lines[l].dirs[d].ja}の時刻表` : `${lines[l].en} ${lines[l].dirs[d].en} timetable`}</a></li>`).join('')}
<li><a href="/${lang}/stations/${s.id}.html">${lang === 'ja' ? `${s.ja}駅の駅情報` : `${s.en} Station information`}</a></li><li><a href="/${lang}/lines/${LINE_SLUG[line]}.html">${ln[lang]}</a></li><li><a href="/${lang}/planner.html?from=${s.id}">${lang === 'ja' ? 'この駅から乗換案内' : 'Plan a journey from here'}</a></li></ul>` };
  });
}

addPage('timetable/index.html', lang => {
  const blocks = ['K', 'B'].map(l => `<h2 class="h2"><span class="lsq" style="background:${lines[l].color}"></span>${lines[l][lang]}</h2><table class="data"><thead><tr><th>${lang === 'ja' ? '駅番号' : 'No.'}</th><th>${lang === 'ja' ? '駅名' : 'Station'}</th><th>${lines[l].dirs.d[lang]}</th><th>${lines[l].dirs.u[lang]}</th></tr></thead><tbody>${lineStations[l].map(id => `<tr><td>${codeOf(id, l)}</td><td><a href="/${lang}/stations/${id}.html">${esc(sname(id, lang))}</a></td>${['d', 'u'].map(d => `<td>${id === endOf(l, d) ? `<span class="muted">${lang === 'ja' ? '（終点）' : '(terminus)'}</span>` : `<a href="/${lang}/${ttRel(id, l, d)}">${lang === 'ja' ? '時刻表' : 'Timetable'}</a>`}</td>`).join('')}</tr>`).join('')}</tbody></table>`).join('');
  const fl = [['central', 'K', 'd'], ['tsukimionsen', 'K', 'u'], ['central', 'B', 'd'], ['minoriport', 'B', 'u'], ['kamano', 'K', 'u']].map(([s, l, d]) => `<h3 class="h3">${esc(sname(s, lang))} → ${lines[l].dirs[d].short[lang]} (${lines[l][lang]})</h3>${firstLast(s, l, d, lang)}`).join('');
  return { title: lang === 'ja' ? '時刻表' : 'Timetables', side: true, body: `<h1 class="h1">${lang === 'ja' ? '駅時刻表' : 'Station timetables'}</h1>
<p>${lang === 'ja' ? '駅と方面を選んでください。時刻表は平日と土曜・休日に分かれています。特急「月影」は全車指定席です。' : 'Choose a station and direction. Each timetable has a weekday and a Saturday/Sunday/holiday version. Ltd. Exp. Comet trains are reserved-seat only.'}</p>
<p class="note-bar">${lang === 'ja' ? '現在の時刻表は2026年11月13日（金）まで有効です。' : 'The current timetable is valid until Friday 13 November 2026.'} <a href="/${lang}/notices/timetable-revision-2026-11.html">${lang === 'ja' ? '11月14日ダイヤ改正について' : 'About the 14 November revision'}</a></p>
${blocks}<h2 class="h2">${lang === 'ja' ? '主な駅の始発・最終列車' : 'First and last trains at main stations'}</h2>${fl}` };
});

// ---------- lines ----------
for (const l of ['K', 'B']) addPage(`lines/${LINE_SLUG[l]}.html`, lang => {
  const ln = lines[l]; const ids = lineStations[l]; const pats = Object.entries(D.patterns[l]);
  const cum = (type, id) => { const p = D.patterns[l][type]; const i = p.stops.indexOf(id); return i < 0 ? null : p.cum[i]; };
  const acc = id => Object.entries(byId[id].access).map(([p, a]) => `<span class="acc acc-${a}" title="${p}">${p}:${{ lift: lang === 'ja' ? 'EV' : 'Lift', ramp: lang === 'ja' ? 'スロープ' : 'Ramp', level: lang === 'ja' ? '段差なし' : 'Level', stairs: lang === 'ja' ? '階段のみ' : 'Stairs' }[a]}</span>`).join(' ');
  const rows = ids.map((id, i) => `<tr><td><span class="badge" style="background:${ln.color}">${codeOf(id, l)}</span></td><td><a href="/${lang}/stations/${id}.html">${esc(sname(id, lang))}</a><br><small class="muted">${byId[id].kana}</small></td><td class="num">${byId[id].km[l].toFixed(1)}</td><td class="num">${i ? (byId[id].km[l] - byId[ids[i - 1]].km[l]).toFixed(1) : '—'}</td>${pats.map(([ty]) => { const c = cum(ty, id); return `<td class="num pat">${c === null ? '<span class="pass">│</span>' : `<b>●</b> ${c}`}</td>`; }).join('')}<td class="num">${lang === 'ja' ? `${D.fareBands.find(([m]) => kmCharged(byId[id].km[l]) <= m)[1]}円` : `¥${D.fareBands.find(([m]) => kmCharged(byId[id].km[l]) <= m)[1]}`}</td><td>${acc(id)}</td><td class="small">${esc(byId[id].staff[lang])}</td><td>${id === 'central' ? (l === 'K' ? lines.B[lang] : lines.K[lang]) : ''}</td></tr>`).join('');
  const intro = l === 'K'
    ? { en: 'The Mirror Line runs 38.6 km north from Springvale Central up the Mirror River valley, through the pottery village of Clayfield and the Red Canyon, to the hot-spring town of Moonview Spa. It is single track north of Clayfield, with passing loops at every station except Firefly Valley. Local, Rapid and Ltd. Exp. Comet trains run on the line; many locals start or end at Clayfield.', ja: '鏡線は春川中央から鏡川に沿って北へ、焼物の里・釜野、鏡峡を経て月見温泉に至る38.6kmの路線です。釜野以北は単線で、蛍谷を除く各駅で列車の行き違いを行います。普通・快速・特急「月影」が運転され、普通列車の多くは釜野で折り返します。' }
    : { en: 'The Bayside Line runs 16.2 km east from Springvale Central along Harvest Bay, past the fish market at Market Square and Rose Garden, to Ferry Port and its ferry terminal. It is double track and elevated between Springvale Central and Pier Road. All trains are locals stopping at every station; the last train of the day terminates at Rose Garden.', ja: '湾岸線は春川中央からみのり湾に沿って東へ、市場、みのり公園を経てフェリーターミナルのあるみのり港に至る16.2kmの路線です。全線複線で、春川中央〜新港通間は高架です。全列車が各駅に停車する普通列車で、最終列車はみのり公園止まりです。' };
  const freq = l === 'K'
    ? { en: '<li>Weekdays: 2–3 locals an hour as far as Clayfield, one an hour beyond (two in the evening peak); one Rapid an hour 7:00–20:00; Comet every 2 hours.</li><li>Saturdays, Sundays and holidays: one local an hour to Moonview Spa plus one to Clayfield 9:45–18:45; one Rapid an hour 8:00–18:00; Comet hourly in the morning, every 2 hours from 11:30.</li>', ja: '<li>平日：釜野まで1時間に2〜3本、釜野以北は1時間に1本（夕方は2本）。快速は7時〜20時に毎時1本。「月影」は2時間に1本。</li><li>土曜・休日：月見温泉行の普通が毎時1本、9:45〜18:45は釜野行が毎時1本加わります。快速は8時〜18時に毎時1本。「月影」は午前中は毎時、11:30以降は2時間に1本。</li>' }
    : { en: '<li>Weekdays: every 15 minutes in the morning and evening peaks (6:45–9:00, 17:00–19:45), every 20 minutes during the day.</li><li>Saturdays, Sundays and holidays: every 20 minutes from 6:00 to 21:00, then every 30 minutes.</li>', ja: '<li>平日：朝夕（6:45〜9:00、17:00〜19:45）は15分間隔、日中は20分間隔。</li><li>土曜・休日：6時〜21時は20分間隔、以降は30分間隔。</li>' };
  return { title: ln[lang], crumbs: [[{ en: 'Route map', ja: '路線図' }, 'route-map.html']], wide: true, body: `<h1 class="h1"><span class="lsq" style="background:${ln.color}"></span>${ln[lang]}</h1>
${l === 'K' ? '<figure class="fig right"><img src="/assets/img/local-train-rural.jpg" alt="" width="360"><figcaption>' + (lang === 'ja' ? '鏡線の普通列車（大塚付近）' : 'A Mirror Line local near Hilltop') + '</figcaption></figure>' : '<figure class="fig right"><img src="/assets/img/bayside-coast.jpg" alt="" width="360"><figcaption>' + (lang === 'ja' ? 'みのり湾沿いを走る湾岸線（汐浜付近）' : 'The Bayside Line along Harvest Bay near Tidewater') + '</figcaption></figure>'}
<p>${intro[lang]}</p><h2 class="h2">${lang === 'ja' ? '運転本数' : 'Frequency'}</h2><ul>${freq[lang]}</ul>
<h2 class="h2">${lang === 'ja' ? '駅一覧・停車駅・所要時間' : 'Stations, stopping pattern and travel times'}</h2>
<p class="small muted">${lang === 'ja' ? '数字は春川中央からの所要時間（分）、│は通過。運賃は春川中央からの大人普通運賃（きっぷ）。EV＝エレベーター。数字はホーム番号。' : 'Figures are minutes from Springvale Central; │ = does not stop. Fare = adult paper-ticket fare from Springvale Central. Platform access: number = platform.'}</p>
<div class="scroll"><table class="data line-table"><thead><tr><th>${lang === 'ja' ? '駅番号' : 'No.'}</th><th>${lang === 'ja' ? '駅名' : 'Station'}</th><th>${lang === 'ja' ? '営業キロ' : 'km'}</th><th>${lang === 'ja' ? '駅間' : 'Between'}</th>${pats.map(([ty]) => `<th>${D.types[ty][lang]}</th>`).join('')}<th>${lang === 'ja' ? '運賃' : 'Fare'}</th><th>${lang === 'ja' ? 'ホームへの段差のないルート' : 'Step-free access by platform'}</th><th>${lang === 'ja' ? '駅係員' : 'Staff'}</th><th>${lang === 'ja' ? '乗換' : 'Change'}</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2 class="h2">${lang === 'ja' ? '時刻表' : 'Timetables'}</h2><p><a href="/${lang}/timetable/index.html">${lang === 'ja' ? '駅時刻表の一覧' : 'All station timetables'}</a> · <a href="/${lang}/route-map.html">${lang === 'ja' ? '路線図' : 'Route map'}</a> · <a href="/${lang}/fares/matrix.html">${lang === 'ja' ? '駅間運賃表' : 'Fare matrix'}</a></p>` };
});

// ---------- route map ----------
addPage('route-map.html', lang => ({ title: lang === 'ja' ? '路線図' : 'Route map', wide: true, body: `<h1 class="h1">${lang === 'ja' ? '路線図' : 'Route map'}</h1>
<p>${lang === 'ja' ? '春川鉄道は鏡線（14駅・38.6km）と湾岸線（9駅・16.2km）の2路線、計22駅です。両線は春川中央駅で接続しています。駅名をクリックすると駅情報を表示します。' : 'Springvale Railway has two lines and 22 stations: the Mirror Line (14 stations, 38.6 km) and the Bayside Line (9 stations, 16.2 km), which meet at Springvale Central. Click a station for its information page.'}</p>
<div class="map-box">${routeMap(lang)}</div>
<div class="cols2"><div><h2 class="h2">${lang === 'ja' ? '駅番号について' : 'Station numbers'}</h2><p class="small">${lang === 'ja' ? '鏡線の駅はK、湾岸線の駅はBで始まる番号です。春川中央はK01とB01の両方の番号を持ちます。' : 'Mirror Line stations are numbered K01–K14 and Bayside Line stations B01–B09. Springvale Central is both K01 and B01.'}</p></div>
<div><h2 class="h2">${lang === 'ja' ? '特急「月影」停車駅' : 'Comet stops'}</h2><p class="small">${xStops.map(id => esc(sname(id, lang))).join(lang === 'ja' ? '・' : ', ')}. <a href="/${lang}/tsukikage/index.html">${lang === 'ja' ? '詳しく' : 'More'}</a></p></div></div>
<p><a href="/${lang}/lines/kagami.html">${lines.K[lang]}</a> · <a href="/${lang}/lines/bayside.html">${lines.B[lang]}</a> · <a href="/${lang}/stations/index.html">${lang === 'ja' ? '駅一覧' : 'All stations'}</a></p>` }));

// ---------- stations ----------
const ACC = { lift: { en: 'Lift', ja: 'エレベーター' }, ramp: { en: 'Ramp (slope)', ja: 'スロープ' }, level: { en: 'Level access from the station building', ja: '駅舎から段差なし' }, stairs: { en: 'Stairs only (footbridge)', ja: '階段のみ（跨線橋）' } };
const STATION_IMG = { central: ['concourse.jpg', { en: 'The ticket gates on the North concourse', ja: '北コンコースの改札口' }], tsukimionsen: ['onsen-station.jpg', { en: 'Moonview Spa station building at dusk', ja: '夕暮れの月見温泉駅舎' }], kamano: ['pottery-village.jpg', { en: 'Kiln street near Clayfield Station', ja: '釜野駅近くの窯元通り' }], minoriport: ['platform.jpg', { en: 'A Bayside Line train arriving, Harvest Bay behind', ja: '湾岸線のホームとみのり湾' }], shiromachi: ['lantern-festival.jpg', { en: 'Lantern Festival on the Mirror River near Castle Town', ja: '城町駅近くの鏡川（灯籠まつり）' }] };
function platformUse(st, p, lang) {
  if (st === 'central') return { 1: { en: 'Mirror Line Local and Rapid departures (for Clayfield, Moonview Spa)', ja: '鏡線 普通・快速（釜野・月見温泉方面）発車' }, 2: { en: 'Mirror Line arrivals (Local and Rapid)', ja: '鏡線 普通・快速の到着' }, 3: { en: 'Ltd. Exp. Comet departures and arrivals', ja: '特急「月影」発着' }, 5: { en: 'Bayside Line departures (for Ferry Port)', ja: '湾岸線（みのり港方面）発車' }, 6: { en: 'Bayside Line arrivals', ja: '湾岸線の到着' } }[p][lang];
  if (st === 'minoriport' && Number(p) === 2) return lang === 'ja' ? '到着ホーム（降車専用）' : 'Arrivals only';
  const deps = trains.filter(tr => tr.stops.some((s, i) => s[0] === st && String(s[2]) === String(p) && i < tr.stops.length - 1));
  const dirs = [...new Set(deps.map(tr => tr.line + tr.dir))].map(k => `${lines[k[0]][lang]} ${lines[k[0]].dirs[k[1]].short[lang]}`);
  const ty = [...new Set(deps.map(tr => tr.type))].map(x => x === 'X' ? (lang === 'ja' ? '特急「月影」' : 'Comet') : D.types[x][lang]);
  const startOnly = deps.length && deps.every(tr => tr.o === st) && !['central', 'tsukimionsen', 'minoriport'].includes(st);
  return `${dirs.join(' / ')} (${ty.join(lang === 'ja' ? '・' : ', ')})${startOnly ? (lang === 'ja' ? '　当駅始発の列車' : ', trains starting here') : ''}`;
}
const lockerText = (n, id, lang) => !n ? t('no', lang) : (lang === 'ja' ? `${n}個（小400円・中600円・大800円${id === 'central' ? '・特大1,000円' : ''}／1日、ハルカ支払い可）` : `${n} lockers (S ¥400, M ¥600, L ¥800${id === 'central' ? ', XL ¥1,000' : ''} per day; RideCard accepted)`);
const toiletText = (k, lang) => ({ multi: { en: 'Yes, including a multipurpose toilet (ostomate, baby seat)', ja: 'あり（多機能トイレ・オストメイト・ベビーシートあり）' }, basic: { en: 'Yes (no multipurpose toilet)', ja: 'あり（多機能トイレなし）' }, none: { en: 'None', ja: 'なし' } })[k][lang];
function fareRows(id, lang) {
  return ['K', 'B'].map(l => lineStations[l].filter(x => x !== id && !(l === 'B' && x === 'central')).map(x => { const f = fare(id, x);
    return `<tr><td>${codeOf(x, l)}</td><td><a href="/${lang}/stations/${x}.html">${esc(sname(x, lang))}</a></td><td class="num">${f.km.toFixed(1)}</td><td class="num">${yen(f.ticket, lang)}</td><td class="num">${yen(f.ic, lang)}</td><td class="num">${yen(f.childTicket, lang)}</td><td class="num">${yen(f.childIc, lang)}</td></tr>`; }).join('')).join('');
}
stations.forEach((s, idx) => addPage(`stations/${s.id}.html`, lang => {
  const M = D.majorInfo[s.id]; const ls = lineOf(s.id);
  const badges = s.codes.map(c => `<span class="badge big" style="background:${lines[c[0]].color}">${c}</span>`).join('');
  const neigh = ls.map(l => { const arr = lineStations[l]; const i = arr.indexOf(s.id); return `<div class="neigh"><span class="lsq" style="background:${lines[l].color}"></span>${lines[l][lang]}: ${i > 0 ? `<a href="/${lang}/stations/${arr[i - 1]}.html">‹ ${esc(sname(arr[i - 1], lang))}</a>` : ''} <b>${esc(s[lang])}</b> ${i < arr.length - 1 ? `<a href="/${lang}/stations/${arr[i + 1]}.html">${esc(sname(arr[i + 1], lang))} ›</a>` : ''}</div>`; }).join('');
  const plats = Object.entries(s.access).map(([p, a]) => { const out = s.liftOut && Number(p) === s.liftOut.platform;
    return `<tr><td class="num">${p}</td><td>${platformUse(s.id, p, lang)}</td><td><span class="acc acc-${a}">${ACC[a][lang]}</span>${out ? `<br><b class="warn">${lang === 'ja' ? `エレベーター点検のため${s.liftOut.until.ja}まで使用停止。階段をご利用になれないお客さまは駅係員にお申し出ください（係員がご案内します）。` : `Lift out of service for maintenance until ${s.liftOut.until.en}. If you cannot use the stairs, ask a member of staff and they will take you by another route.`}</b>` : ''}</td></tr>`; }).join('');
  const fac = [
    [lang === 'ja' ? '駅係員' : 'Staff', esc(s.staff[lang])],
    [lang === 'ja' ? 'きっぷうりば（窓口）' : 'Ticket office', s.office ? esc(s.office[lang]) : (lang === 'ja' ? 'なし（券売機のみ）' : 'None (ticket machines only)')],
    [lang === 'ja' ? '券売機・ハルカのチャージ' : 'Ticket machines, RideCard charge', s.charge ? (lang === 'ja' ? 'あり（ハルカのチャージ・購入ができます）' : 'Yes (RideCard can be bought and charged)') : (lang === 'ja' ? '券売機なし。ホームの簡易改札機にハルカをタッチするか、乗車駅証明書をお取りになり、降車駅で精算してください。チャージはできません。' : 'No ticket machine. Touch RideCard on the platform reader, or take a boarding certificate from the machine on the platform and pay at your destination. RideCard cannot be charged here.')],
    [lang === 'ja' ? 'トイレ' : 'Toilets', toiletText(s.toilets, lang)],
    [lang === 'ja' ? 'コインロッカー' : 'Coin lockers', lockerText(s.lockers, s.id, lang)],
    [lang === 'ja' ? '待合室' : 'Waiting room', s.waiting ? t('yes', lang) : t('no', lang)],
    [lang === 'ja' ? '無料Wi-Fi' : 'Free Wi-Fi', s.wifi ? (lang === 'ja' ? 'HaruTetsu_Free_WiFi' : 'ValeRail_Free_WiFi') : t('no', lang)],
    ['AED', s.aed ? t('yes', lang) : t('no', lang)],
    [lang === 'ja' ? '売店・コンビニ' : 'Shops', s.shops ? t('yes', lang) : t('no', lang)],
    [lang === 'ja' ? '1日平均乗車人員' : 'Average daily boardings', `${s.ridership.toLocaleString('en')} ${lang === 'ja' ? `人（${D.ridershipYear.ja}）` : `(${D.ridershipYear.en})`}`],
  ].map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  const img = STATION_IMG[s.id] ? `<figure class="fig right"><img src="/assets/img/${STATION_IMG[s.id][0]}" alt="" width="340"><figcaption>${STATION_IMG[s.id][1][lang]}</figcaption></figure>` : '';
  const tt = ttDirs(s.id).map(([l, d]) => `<a class="btn-sm" href="/${lang}/${ttRel(s.id, l, d)}">${lines[l][lang]} ${lines[l].dirs[d].short[lang]}</a>`).join(' ');
  const sec = (id, h, body) => `<h2 class="h2" id="${id}">${h}</h2>${body}`;
  const anchors = (M ? [['timetable', lang === 'ja' ? '時刻表' : 'Timetables'], ['platforms', lang === 'ja' ? 'ホーム' : 'Platforms'], ['facilities', lang === 'ja' ? '設備' : 'Facilities'], ['plan', lang === 'ja' ? '構内図' : 'Station plan'], ['exits', lang === 'ja' ? '出口・バス' : 'Exits & buses'], ['nearby', lang === 'ja' ? '周辺' : 'Nearby'], ['fares', lang === 'ja' ? '運賃' : 'Fares']] : [['timetable', lang === 'ja' ? '時刻表' : 'Timetables'], ['platforms', lang === 'ja' ? 'ホーム' : 'Platforms'], ['facilities', lang === 'ja' ? '設備' : 'Facilities'], ['fares', lang === 'ja' ? '運賃' : 'Fares']]).map(([a, l]) => `<a href="#${a}">${l}</a>`).join('');
  let body = `<div class="st-head">${badges}<div><h1 class="st-name">${esc(s[lang])}${lang === 'ja' ? '駅' : ' Station'}</h1><span class="muted">${s.kana} · ${lang === 'ja' ? s.romaji : s.ja}</span></div></div>${neigh}
<nav class="pagenav">${anchors}</nav>${img}
${M ? `<p>${M.intro[lang]}</p>` : `<p>${lang === 'ja' ? `${lines[ls[0]].ja}の駅（春川中央から${s.km[ls[0]].toFixed(1)}km）。${s.staff.ja}。` : `A ${lines[ls[0]].en} station, ${s.km[ls[0]].toFixed(1)} km from Springvale Central. ${s.staff.en}.`}${xStops.includes(s.id) ? (lang === 'ja' ? '特急「月影」停車駅です。' : ' Ltd. Exp. Comet stops here.') : ''}${D.patterns.K.R.stops.includes(s.id) || ls[0] === 'B' ? '' : (lang === 'ja' ? '快速は通過します。' : ' Rapid trains do not stop here.')}</p>`}
${s.address ? `<p class="small muted">${lang === 'ja' ? '所在地' : 'Address'}: ${s.address[lang]}</p>` : ''}
${sec('timetable', lang === 'ja' ? '時刻表' : 'Timetables', `<p>${tt}</p>`)}
${sec('platforms', lang === 'ja' ? 'ホームと段差のないルート' : 'Platforms and step-free access', `<table class="data"><thead><tr><th>${lang === 'ja' ? '番線' : 'Platform'}</th><th>${lang === 'ja' ? '主な発車列車' : 'Trains'}</th><th>${lang === 'ja' ? 'ホームへの段差のないルート' : 'Step-free route to platform'}</th></tr></thead><tbody>${plats}</tbody></table>${s.island ? `<p class="small muted">${lang === 'ja' ? '島式ホーム（1面2線）です。' : 'Island platform: both directions share one platform.'}</p>` : ''}${s.single ? `<p class="small muted">${lang === 'ja' ? 'ホームは1面1線で、上下列車とも同じホームに発着します。' : 'One platform and one track: trains in both directions use the same platform.'}</p>` : ''}`)}
${sec('facilities', lang === 'ja' ? '駅の設備' : 'Facilities', `<table class="data kv">${fac}</table>`)}`;
  if (M) body += sec('plan', lang === 'ja' ? '駅構内図' : 'Station plan', `<div class="plan-box">${stationPlan(s.id, lang)}</div><p class="small muted">${lang === 'ja' ? '図は概略です。実際の配置とは異なる場合があります。' : 'Simplified plan, not to scale.'}</p>`)
    + sec('exits', lang === 'ja' ? '出口・バス・タクシー' : 'Exits, buses and taxis', `<table class="data"><thead><tr><th>${lang === 'ja' ? '出口' : 'Exit'}</th><th>${lang === 'ja' ? '主な行き先' : 'For'}</th></tr></thead><tbody>${M.exits.map(e => `<tr><td><b>${e[lang]}</b></td><td>${e.note[lang]}</td></tr>`).join('')}</tbody></table>
<table class="data"><thead><tr><th>${lang === 'ja' ? 'のりば' : 'Stop'}</th><th>${lang === 'ja' ? '路線・行き先' : 'Route'}</th><th>${lang === 'ja' ? '運行間隔' : 'Frequency'}</th></tr></thead><tbody>${M.buses.map(([n, r, f]) => `<tr><td class="num">${n}</td><td>${r[lang]}</td><td>${f[lang]}</td></tr>`).join('')}</tbody></table><p>${M.taxi[lang]}</p>`)
    + sec('nearby', lang === 'ja' ? '駅周辺' : 'Nearby', `<ul class="nearby">${M.nearby.map(([n, w]) => `<li><b>${n[lang]}</b> <span class="muted">${w[lang]}</span></li>`).join('')}</ul>`);
  body += sec('fares', lang === 'ja' ? `${s.ja}駅からの運賃` : `Fares from ${s.en}`, `<div class="scroll"><table class="data small"><thead><tr><th>${lang === 'ja' ? '駅番号' : 'No.'}</th><th>${lang === 'ja' ? '着駅' : 'To'}</th><th>${lang === 'ja' ? '営業キロ' : 'km'}</th><th>${lang === 'ja' ? '大人 きっぷ' : 'Adult ticket'}</th><th>${lang === 'ja' ? '大人 ハルカ' : 'Adult RideCard'}</th><th>${lang === 'ja' ? '小児 きっぷ' : 'Child ticket'}</th><th>${lang === 'ja' ? '小児 ハルカ' : 'Child RideCard'}</th></tr></thead><tbody>${fareRows(s.id, lang)}</tbody></table></div>`);
  return { title: lang === 'ja' ? `${s.ja}駅` : `${s.en} Station`, crumbs: [[{ en: 'Stations', ja: '駅情報' }, 'stations/index.html']], side: true, body };
}));

addPage('stations/index.html', lang => {
  const stepFree = s => { const a = Object.values(s.access); return a.includes('stairs') ? (lang === 'ja' ? '一部のホームは階段のみ' : 'Some platforms stairs only') : (lang === 'ja' ? '全ホーム段差なし' : 'All platforms'); };
  const rows = ['K', 'B'].map(l => lineStations[l].filter(id => !(l === 'B' && id === 'central')).map(id => { const s = byId[id];
    return `<tr><td>${s.codes.map(c => `<span class="badge" style="background:${lines[c[0]].color}">${c}</span>`).join(' ')}</td><td><a href="/${lang}/stations/${id}.html">${esc(s[lang])}</a>${s.major ? ' <span class="tag">' + (lang === 'ja' ? '主要駅' : 'Main') + '</span>' : ''}</td><td class="small">${esc(s.staff[lang])}</td><td class="small">${s.office ? esc(s.office[lang]) : '—'}</td><td>${s.toilets === 'none' ? '—' : s.toilets === 'multi' ? (lang === 'ja' ? '◎' : '◎') : '○'}</td><td class="num">${s.lockers || '—'}</td><td class="small">${stepFree(s)}</td><td class="num">${s.ridership.toLocaleString('en')}</td></tr>`; }).join('')).join('');
  return { title: lang === 'ja' ? '駅一覧' : 'All stations', wide: true, body: `<h1 class="h1">${lang === 'ja' ? '駅一覧' : 'All stations'}</h1>
<p>${lang === 'ja' ? '春川鉄道の全22駅の一覧です。駅名をクリックすると、時刻表・設備・構内図などをご覧いただけます。' : 'All 22 Springvale Railway stations. Click a station for its timetables, facilities and, for the main stations, a station plan.'}</p>
<div class="scroll"><table class="data"><thead><tr><th>${lang === 'ja' ? '駅番号' : 'No.'}</th><th>${lang === 'ja' ? '駅名' : 'Station'}</th><th>${lang === 'ja' ? '駅係員' : 'Staff'}</th><th>${lang === 'ja' ? 'きっぷうりば' : 'Ticket office'}</th><th>${lang === 'ja' ? 'トイレ' : 'WC'}</th><th>${lang === 'ja' ? 'ロッカー' : 'Lockers'}</th><th>${lang === 'ja' ? '段差のないルート' : 'Step-free'}</th><th>${lang === 'ja' ? '1日平均乗車人員' : 'Daily boardings'}</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="small muted">${lang === 'ja' ? 'トイレ：◎多機能トイレあり　○一般トイレのみ　—なし' : 'WC: ◎ with multipurpose toilet, ○ standard only, — none'}</p>
<h2 class="h2">${lang === 'ja' ? '駅別乗車人員' : 'Boardings by station'}</h2><img class="chart" src="/assets/charts/ridership-${lang}.svg" alt="${lang === 'ja' ? 'グラフ' : 'chart'}" width="640">` };
});

// ---------- forms shared by home and planner ----------
const stationOptions = (lang, sel) => ['K', 'B'].map(l => `<optgroup label="${lines[l][lang]}">${lineStations[l].filter(id => !(l === 'B' && id === 'central')).map(id => `<option value="${id}"${id === sel ? ' selected' : ''}>${byId[id].codes.join('/')} ${esc(sname(id, lang))}</option>`).join('')}</optgroup>`).join('');
const RANGE = { min: '2026-10-04', max: '2026-11-13' };
function plannerForm(lang, from = 'central', to = 'tsukimionsen') {
  const hours = Array.from({ length: 20 }, (_, i) => i + 4).map(h => `<option value="${h}"${h === 14 ? ' selected' : ''}>${h}</option>`).join('');
  const mins = Array.from({ length: 12 }, (_, i) => i * 5).map(m => `<option value="${m}"${m === 20 ? ' selected' : ''}>${String(m).padStart(2, '0')}</option>`).join('');
  return `<form class="planner-form" action="/${lang}/planner.html" method="get">
<div class="pf-row"><label>${lang === 'ja' ? '出発' : 'From'}<select name="from">${stationOptions(lang, from)}</select></label><button type="button" class="swap icon-btn" title="${lang === 'ja' ? '出発と到着を入れ替え' : 'Swap'}">${ICON.swap}</button><label>${lang === 'ja' ? '到着' : 'To'}<select name="to">${stationOptions(lang, to)}</select></label></div>
<div class="pf-row"><label>${lang === 'ja' ? '日付' : 'Date'}<input type="date" name="date" value="${RANGE.min}" min="${RANGE.min}" max="${RANGE.max}"></label><label>${lang === 'ja' ? '時刻' : 'Time'}<span class="hm"><select name="h">${hours}</select>:<select name="m">${mins}</select></span></label></div>
<div class="pf-row pf-opts"><label class="rad"><input type="radio" name="mode" value="dep" checked>${lang === 'ja' ? '出発' : 'Depart after'}</label><label class="rad"><input type="radio" name="mode" value="arr">${lang === 'ja' ? '到着' : 'Arrive by'}</label><label class="rad"><input type="checkbox" name="x" value="1" checked>${lang === 'ja' ? '特急「月影」を利用' : 'Use Ltd. Exp. Comet'}</label></div>
<button class="btn-primary" type="submit">${lang === 'ja' ? '検索' : 'Search'}</button></form>`;
}

// ---------- notices ----------
const NOTICES = [
  ['timetable-revision-2026-11', '2026-10-01', 'timetable', true], ['lantern-festival-trains', '2026-09-25', 'event', true], ['shiromachi-lift', '2026-09-18', 'facility'],
  ['bayside-night-works', '2026-09-10', 'works'], ['haruca-maintenance', '2026-09-01', 'ticket'], ['tsukikage-peak-dates', '2026-08-25', 'ticket'],
  ['lost-property-form', '2026-08-20', 'service'], ['yukemuri-extended', '2026-07-01', 'ticket'],
];
const CAT = { timetable: { en: 'Timetable', ja: 'ダイヤ' }, event: { en: 'Event', ja: 'イベント' }, facility: { en: 'Stations', ja: '駅設備' }, works: { en: 'Engineering works', ja: '工事' }, ticket: { en: 'Tickets', ja: 'きっぷ' }, service: { en: 'Service', ja: 'サービス' } };
const fmtDate = (iso, lang) => { const [y, m, d] = iso.split('-').map(Number); return lang === 'ja' ? `${y}年${m}月${d}日` : `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`; };
const prose = { en: null, ja: null };
const noticeList = (lang, n = 99) => `<ul class="notice-list">${NOTICES.slice(0, n).map(([slug, date, cat, imp]) => `<li><time>${fmtDate(date, lang)}</time><span class="cat cat-${cat}">${CAT[cat][lang]}</span>${imp ? `<span class="imp">${lang === 'ja' ? '重要' : 'Important'}</span>` : ''}<a href="/${lang}/notices/${slug}.html">${esc(prose[lang][`notice:${slug}`].title)}</a></li>`).join('')}</ul>`;

// ---------- home ----------
addPage('index.html', lang => {
  const slides = [
    ['tsukikage-bridge.jpg', { en: 'Autumn colours in the Red Canyon', ja: '鏡峡の紅葉と特急「月影」' }, { en: 'Comet takes you from Springvale Central to Moonview Spa in 39 minutes.', ja: '春川中央から月見温泉まで最速39分。' }, 'tsukikage/index.html'],
    ['lantern-festival.jpg', { en: 'Springvale Lantern Festival, 10–11 October', ja: '春川灯籠まつり 10月10日・11日' }, { en: 'Extra late trains on both lines. Avoid Castle Town between 18:00 and 21:30.', ja: '両線で臨時列車を運転。18時〜21時30分の城町駅は大変混雑します。' }, 'trips/lantern-festival.html'],
    ['onsen-station.jpg', { en: 'Moonview Spa Day Ticket', ja: '月見温泉ゆけむりきっぷ' }, { en: 'Comet both ways, a bath at Moonview Main Bath and a ¥500 voucher: ¥2,800.', ja: '「月影」往復・月見総湯入浴・500円クーポンがセットで2,800円。' }, 'tickets/passes.html#yukemuri'],
  ];
  const st = k => { const s = D.status[k]; return `<li class="sb-${s.state}"><span class="lsq" style="background:${k === 'X' ? '#3b2a7a' : lines[k].color}"></span><b>${k === 'X' ? (lang === 'ja' ? '特急「月影」' : 'Ltd. Exp. Comet') : lines[k][lang]}</b><em>${s[lang]}</em><p>${s.detail[lang]}</p></li>`; };
  const quick = [['route-map.html', { en: 'Route map', ja: '路線図' }, 'M4 18c4-1 6-12 16-12'], ['timetable/index.html', { en: 'Timetables', ja: '時刻表' }, 'M12 6v6l4 3'], ['fares/index.html', { en: 'Fares', ja: '運賃' }, 'M6 8h12M6 12h12M12 12v7'], ['tickets/haruca.html', { en: 'RideCard', ja: 'ハルカ' }, 'M4 7h16v10H4zM4 11h16'], ['tickets/passes.html', { en: 'Passes', ja: 'おトクなきっぷ' }, 'M5 6h14v12H5zM9 6v12'], ['accessibility.html', { en: 'Accessibility', ja: 'バリアフリー' }, 'M12 5a1 1 0 1 0 0 .1M8 9h8M12 9v5l-3 5M12 14l3 5'], ['lost-found.html', { en: 'Lost & found', ja: 'お忘れ物' }, 'M6 9h12l-1 10H7zM9 9a3 3 0 0 1 6 0'], ['faq.html', { en: 'FAQ', ja: 'よくあるご質問' }, 'M9 9a3 3 0 1 1 3 3v2M12 17v.1']]
    .map(([p, l, d]) => `<a href="/${lang}/${p}"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#eef3f8"/><path d="${d}" stroke="#123a63" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg><span>${l[lang]}</span></a>`).join('');
  return { title: lang === 'ja' ? '春川鉄道 | 鏡線・湾岸線・特急「月影」' : 'Springvale Railway | Mirror Line, Bayside Line, Ltd. Exp. Comet', desc: lang === 'ja' ? '春川鉄道の公式サイト。時刻表、運賃、乗換案内、特急「月影」の座席予約、運行情報。' : 'Timetables, fares, journey planner, Comet seat reservations and service status.', body: `
<div class="carousel" data-carousel>${slides.map(([img, h, p, link], i) => `<a class="slide${i ? '' : ' on'}" href="/${lang}/${link}"><img src="/assets/img/${img}" alt=""><span class="cap"><b>${h[lang]}</b>${p[lang]}</span></a>`).join('')}
<button type="button" class="car-prev" aria-label="Previous">‹</button><button type="button" class="car-next" aria-label="Next">›</button><div class="dots">${slides.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div></div>
<div class="home-row"><section class="box planner-box"><div class="tabs" data-tabs><div class="tab-bar"><button type="button" class="on" data-tab="p">${lang === 'ja' ? '乗換案内' : 'Journey planner'}</button><button type="button" data-tab="t">${lang === 'ja' ? '時刻表' : 'Timetables'}</button><button type="button" data-tab="f">${lang === 'ja' ? '運賃' : 'Fares'}</button></div>
<div class="tab-panel" data-panel="p">${plannerForm(lang)}</div>
<div class="tab-panel" data-panel="t" hidden><p class="small">${lang === 'ja' ? '駅と方面を選んでください。' : 'Choose a station and direction.'}</p>${stationSelect(lang, '')} <a href="/${lang}/timetable/index.html">${lang === 'ja' ? '時刻表一覧' : 'All timetables'}</a></div>
<div class="tab-panel" data-panel="f" hidden><form action="/${lang}/fares/calculator.html"><label>${lang === 'ja' ? '出発' : 'From'} <select name="from">${stationOptions(lang, 'central')}</select></label> <label>${lang === 'ja' ? '到着' : 'To'} <select name="to">${stationOptions(lang, 'minoriport')}</select></label> <button class="btn-primary" type="submit">${lang === 'ja' ? '運賃を調べる' : 'Check fare'}</button></form><p class="small"><a href="/${lang}/fares/matrix.html">${lang === 'ja' ? '駅間運賃表' : 'Fare matrix'}</a></p></div></div></section>
<section class="box status-box"><h2 class="boxh">${t('status', lang)} <small>${t('asOf', lang)}</small></h2><ul class="sb-list">${st('K')}${st('B')}${st('X')}</ul><p class="small"><a href="/${lang}/status.html">${lang === 'ja' ? '運行情報・遅延証明書' : 'Status details and delay certificates'} ›</a></p>
<p class="small warn-line">${lang === 'ja' ? '城町駅1番線のエレベーターは10月23日まで点検のため使用できません。' : 'Castle Town platform 1 lift out of service until 23 Oct.'}</p></section></div>
<div class="home-row"><section class="box notices-box"><h2 class="boxh">${lang === 'ja' ? 'お知らせ' : 'Notices'} <a class="more" href="/${lang}/notices/index.html">${lang === 'ja' ? '一覧' : 'All notices'} ›</a></h2>${noticeList(lang, 6)}</section>
<section class="box trips-box"><h2 class="boxh">${lang === 'ja' ? 'おすすめのおでかけ' : 'Featured trips'}</h2>
<a class="trip" href="/${lang}/trips/tsukimi-onsen.html"><img src="/assets/img/onsen-station.jpg" alt=""><b>${lang === 'ja' ? '月見温泉で日帰り湯めぐり' : 'A day at Moonview Spa'}</b><span>${lang === 'ja' ? '「月影」で39分。共同浴場、足湯、月見山ロープウェイ。' : '39 minutes by Comet. Public baths, a foot bath and the Mount Moonview ropeway.'}</span></a>
<a class="trip" href="/${lang}/trips/lantern-festival.html"><img src="/assets/img/lantern-festival.jpg" alt=""><b>${lang === 'ja' ? '春川灯籠まつり 2026' : 'Springvale Lantern Festival 2026'}</b><span>${lang === 'ja' ? '10月10日（土）・11日（日）。臨時列車と混雑のご案内。' : 'Sat 10 and Sun 11 October. Extra trains and crowd advice.'}</span></a></section></div>
<section class="quick">${quick}</section>
<section class="banners"><a href="/${lang}/tickets/passes.html#oneday" class="banner b1"><b>${lang === 'ja' ? '1日フリーきっぷ' : '1-Day Free Pass'}</b><span>${lang === 'ja' ? `全線乗り放題 平日${yen(D.pass.weekday, 'ja')}・土休日${yen(D.pass.weekend, 'ja')}` : `All lines, all day: ${yen(D.pass.weekday, 'en')} weekdays, ${yen(D.pass.weekend, 'en')} weekends`}</span></a>
<a href="/${lang}/tickets/haruca.html" class="banner b2"><b>${lang === 'ja' ? 'ハルカでスムーズに' : 'Tap through with RideCard'}</b><span>${lang === 'ja' ? 'きっぷより最大18円おトク' : 'Up to ¥18 cheaper than a paper ticket'}</span></a>
<a href="/${lang}/reserve/index.html" class="banner b3"><b>${lang === 'ja' ? '「月影」はネット予約で' : 'Reserve Comet online'}</b><span>${lang === 'ja' ? '1か月前の10時から受付' : 'From 10:00 one month before'}</span></a></section>
<section class="box"><h2 class="boxh">${lang === 'ja' ? '路線図' : 'Route map'} <a class="more" href="/${lang}/route-map.html">${lang === 'ja' ? '拡大' : 'Full map'} ›</a></h2><div class="map-box mini">${routeMap(lang, { small: true })}</div></section>` };
});

// ---------- fares: matrix and calculator ----------
addPage('fares/matrix.html', lang => {
  const ids = [...lineStations.K, ...lineStations.B.slice(1)];
  const head = ids.map(id => `<th class="vert"><span>${byId[id].codes[0]}<br>${esc(sname(id, lang))}</span></th>`).join('');
  const rows = ids.map((a, i) => `<tr><th class="rowh">${byId[a].codes[0]} ${esc(sname(a, lang))}</th>${ids.map((b, j) => { if (i === j) return '<td class="diag">—</td>'; const f = fare(a, b); return i < j ? `<td>${f.ticket}</td>` : `<td class="ic">${f.ic}</td>`; }).join('')}</tr>`).join('');
  return { title: lang === 'ja' ? '駅間運賃表' : 'Fare matrix', crumbs: [[{ en: 'Fares', ja: '運賃' }, 'fares/index.html']], wide: true, body: `<h1 class="h1">${lang === 'ja' ? '駅間運賃表（大人）' : 'Station-to-station fares (adult)'}</h1>
<p>${lang === 'ja' ? '表の右上はきっぷ（紙の乗車券）の運賃、左下はIC カード「ハルカ」の運賃です（単位：円）。小児運賃は大人の半額です（きっぷは10円未満切り捨て、ハルカは1円未満切り捨て）。特急「月影」をご利用の場合は別に特急料金が必要です。' : 'Upper right of the table: paper ticket fares. Lower left: RideCard IC card fares. All in yen. Child fares are half the adult fare (paper tickets rounded down to 10 yen, RideCard rounded down to 1 yen). Ltd. Exp. Comet also needs a limited express surcharge.'}</p>
<div class="scroll matrix-wrap"><table class="matrix"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table></div>
<p class="small muted">${lang === 'ja' ? '鏡線と湾岸線をまたがる場合は、春川中央駅経由の営業キロで計算します。' : 'Journeys between the two lines are charged on the distance via Springvale Central.'} <a href="/${lang}/fares/index.html">${lang === 'ja' ? '運賃の計算方法' : 'How fares are calculated'}</a> · <a href="/${lang}/fares/calculator.html">${lang === 'ja' ? '運賃検索' : 'Fare calculator'}</a></p>` };
});
addPage('fares/calculator.html', lang => ({ title: lang === 'ja' ? '運賃検索' : 'Fare calculator', crumbs: [[{ en: 'Fares', ja: '運賃' }, 'fares/index.html']], side: true, body: `<h1 class="h1">${lang === 'ja' ? '運賃検索' : 'Fare calculator'}</h1>
<p>${lang === 'ja' ? '出発駅と到着駅を選ぶと、大人・小児の運賃、特急「月影」の料金、定期券の価格を表示します。' : 'Choose two stations to see adult and child fares, the Comet surcharge and commuter pass prices.'}</p>
<form class="calc-form box" id="fare-calc"><div class="pf-row"><label>${lang === 'ja' ? '出発' : 'From'}<select name="from">${stationOptions(lang, 'central')}</select></label><button type="button" class="swap icon-btn" title="Swap">${ICON.swap}</button><label>${lang === 'ja' ? '到着' : 'To'}<select name="to">${stationOptions(lang, 'tsukimionsen')}</select></label></div>
<div class="pf-row"><label>${lang === 'ja' ? '大人' : 'Adults'}<input type="number" name="ad" value="1" min="0" max="9"></label><label>${lang === 'ja' ? '小児' : 'Children'}<input type="number" name="ch" value="0" min="0" max="9"></label><label>${lang === 'ja' ? '「月影」' : 'Comet'}<select name="cls"><option value="">${lang === 'ja' ? '利用しない' : 'Not used'}</option><option value="std">${lang === 'ja' ? '普通車指定席' : 'Standard seat'}</option><option value="pre">${lang === 'ja' ? 'プレミアム席' : 'Premium seat'}</option></select></label><label class="rad"><input type="checkbox" name="peak" value="1">${lang === 'ja' ? '繁忙期' : 'Peak date'}</label></div>
<button class="btn-primary" type="submit">${lang === 'ja' ? '計算する' : 'Calculate'}</button></form><div id="calc-out" class="calc-out"></div>
<p class="small muted">${lang === 'ja' ? '「月影」の料金は「月影」に乗車する区間の距離で計算します。この計算では出発駅から到着駅まで「月影」に乗車するものとします（どちらかが停車駅でない場合は計算できません）。' : 'The Comet surcharge depends on the distance travelled on Comet. This calculator assumes you ride Comet for the whole journey (both stations must be Comet stops).'}</p>` }));

// ---------- planner, reservation, search (rendered on the client) ----------
addPage('planner.html', lang => ({ title: lang === 'ja' ? '乗換案内' : 'Journey planner', crumbs: [], side: true, body: `<h1 class="h1">${lang === 'ja' ? '乗換案内' : 'Journey planner'}</h1>
<div class="box">${plannerForm(lang)}</div><div id="planner-out" class="planner-out"></div>
<p class="small muted">${lang === 'ja' ? `検索できるのは${fmtDate(RANGE.min, 'ja')}から${fmtDate(RANGE.max, 'ja')}までです（11月14日以降の検索は11月1日から可能になります）。乗換時間は4分以上で計算しています。灯籠まつりの臨時列車は検索結果に含まれません。運賃は大人1名分です。` : `You can search dates from ${fmtDate(RANGE.min, 'en')} to ${fmtDate(RANGE.max, 'en')} (searches from 14 November open on 1 November). Changes allow at least 4 minutes. Lantern Festival extra trains are not included. Fares are for one adult.`}</p>
<h2 class="h2">${lang === 'ja' ? 'よく検索される区間' : 'Popular journeys'}</h2><ul class="links">${[['central', 'tsukimionsen'], ['minoriport', 'tsukimionsen'], ['daigakumae', 'ichiba'], ['shiromachi', 'minoriport'], ['tsukimionsen', 'central']].map(([a, b]) => `<li><a href="/${lang}/planner.html?from=${a}&to=${b}&date=2026-10-04&h=14&m=20&mode=dep&x=1">${esc(sname(a, lang))} → ${esc(sname(b, lang))}</a></li>`).join('')}</ul>` }));

const STEPS = lang => lang === 'ja' ? ['列車を選ぶ', '座席を選ぶ', 'お客さま情報', '予約完了'] : ['Choose a train', 'Choose seats', 'Your details', 'Confirmation'];
const steps = (lang, n) => `<ol class="steps">${STEPS(lang).map((s, i) => `<li class="${i === n ? 'on' : i < n ? 'done' : ''}"><span>${i + 1}</span>${s}</li>`).join('')}</ol>`;
const xOptions = (lang, sel) => xStops.map(id => `<option value="${id}"${id === sel ? ' selected' : ''}>${esc(sname(id, lang))}</option>`).join('');
const resCrumb = [[{ en: 'Comet', ja: '特急「月影」' }, 'tsukikage/index.html']];
addPage('reserve/index.html', lang => ({ title: lang === 'ja' ? '「月影」座席予約' : 'Comet seat reservation', crumbs: resCrumb, side: true, body: `<h1 class="h1">${lang === 'ja' ? '特急「月影」座席予約' : 'Ltd. Exp. Comet seat reservation'}</h1>${steps(lang, 0)}
<form class="box res-form" id="res-search" action="/${lang}/reserve/index.html"><div class="pf-row"><label>${lang === 'ja' ? '乗車日' : 'Date'}<input type="date" name="date" value="${RANGE.min}" min="${RANGE.min}" max="${RANGE.max}"></label><label>${lang === 'ja' ? '乗車駅' : 'From'}<select name="from">${xOptions(lang, 'central')}</select></label><button type="button" class="swap icon-btn" title="Swap">${ICON.swap}</button><label>${lang === 'ja' ? '降車駅' : 'To'}<select name="to">${xOptions(lang, 'tsukimionsen')}</select></label></div>
<div class="pf-row"><label>${lang === 'ja' ? '大人' : 'Adults'}<select name="ad">${[1, 2, 3, 4, 5, 6].map(n => `<option>${n}</option>`).join('')}</select></label><label>${lang === 'ja' ? '小児' : 'Children'}<select name="ch">${[0, 1, 2, 3, 4].map(n => `<option>${n}</option>`).join('')}</select></label><label>${lang === 'ja' ? '座席' : 'Class'}<select name="cls"><option value="std">${lang === 'ja' ? '普通車指定席' : 'Standard'}</option><option value="pre">${lang === 'ja' ? 'プレミアム席（1号車）' : 'Premium (Car 1)'}</option></select></label></div>
<button class="btn-primary" type="submit">${lang === 'ja' ? '列車を検索' : 'Find trains'}</button></form><div id="res-results"></div>
<div class="small muted"><p>${lang === 'ja' ? '予約は乗車日の1か月前の10時から、列車の発車4分前まで承ります。お支払いはきっぷの受け取り時に、駅の指定席券売機またはきっぷうりばでお願いします（このサイトではお支払いの手続きはありません）。車いすスペースのご予約はお客さまセンター（050-3000-8341）へお電話ください。' : 'Reservations open at 10:00 one month before the travel date and close 4 minutes before departure. You pay when you collect your tickets at a reserved-seat ticket machine or ticket office (no payment is taken on this site). To book a wheelchair space, call the Customer Centre on 050-3000-8341.'}</p></div>` }));
addPage('reserve/seat.html', lang => ({ title: lang === 'ja' ? '座席を選ぶ' : 'Choose seats', crumbs: [...resCrumb, [{ en: 'Seat reservation', ja: '座席予約' }, 'reserve/index.html']], body: `<h1 class="h1">${lang === 'ja' ? '座席を選ぶ' : 'Choose your seats'}</h1>${steps(lang, 1)}<div id="seat-app" class="seat-app"></div>` }));
addPage('reserve/details.html', lang => ({ title: lang === 'ja' ? 'お客さま情報の入力' : 'Your details', crumbs: [...resCrumb, [{ en: 'Seat reservation', ja: '座席予約' }, 'reserve/index.html']], body: `<h1 class="h1">${lang === 'ja' ? 'お客さま情報の入力' : 'Your details'}</h1>${steps(lang, 2)}<div id="res-summary" class="box"></div>
<form id="details-form" class="box res-form" action="/${lang}/reserve/complete.html"><div class="pf-row"><label>${lang === 'ja' ? 'お名前（カタカナ）' : 'Name'}<input name="name" required autocomplete="name"></label><label>${lang === 'ja' ? '電話番号' : 'Phone'}<input name="tel" type="tel" required></label></div>
<div class="pf-row"><label>${lang === 'ja' ? 'メールアドレス' : 'Email'}<input name="email" type="email" required></label><label>${lang === 'ja' ? 'ハルカ番号（任意・チケットレス乗車）' : 'RideCard number (optional, ticketless)'}<input name="haruca" placeholder="HC 0000 0000 0000"></label></div>
<label class="rad"><input type="checkbox" name="agree" required> ${lang === 'ja' ? '<a href="/ja/tsukikage/index.html#rules">予約のきまり</a>と<a href="/ja/tsukikage/index.html#refunds">変更・払いもどしの条件</a>に同意します' : 'I agree to the <a href="/en/tsukikage/index.html#rules">reservation rules</a> and the <a href="/en/tsukikage/index.html#refunds">change and refund conditions</a>'}</label>
<div class="hidden-fields"></div><button class="btn-primary" type="submit">${lang === 'ja' ? '予約を確定する' : 'Confirm reservation'}</button></form>` }));
addPage('reserve/complete.html', lang => ({ title: lang === 'ja' ? '予約完了' : 'Reservation complete', crumbs: [...resCrumb, [{ en: 'Seat reservation', ja: '座席予約' }, 'reserve/index.html']], body: `<h1 class="h1">${lang === 'ja' ? 'ご予約ありがとうございます' : 'Your reservation is confirmed'}</h1>${steps(lang, 3)}<div id="res-done" class="box"></div>
<div class="box small"><h3 class="h3">${lang === 'ja' ? 'きっぷの受け取り' : 'Collecting your tickets'}</h3><p>${lang === 'ja' ? '列車の発車5分前までに、指定席券売機（春川中央・城町・釜野・鏡峡・月見温泉・みのり港）で予約番号と電話番号を入力し、お支払いのうえきっぷをお受け取りください。期限までにお受け取りがない場合、予約は取り消されます。ハルカ番号を登録された場合は、きっぷを受け取らずにハルカで乗車できます（料金は改札通過時にハルカから差し引きます）。' : 'Collect and pay for your tickets at least 5 minutes before departure at a reserved-seat ticket machine (Springvale Central, Castle Town, Clayfield, Red Canyon, Moonview Spa, Ferry Port) by entering your reservation number and phone number. Reservations not collected in time are cancelled. If you registered a RideCard number you can travel ticketless: the fare and surcharge are deducted from RideCard at the gate.'}</p></div>` }));
addPage('search.html', lang => ({ title: lang === 'ja' ? 'サイト内検索' : 'Search', body: `<h1 class="h1">${lang === 'ja' ? 'サイト内検索' : 'Search'}</h1><form class="box" action="/${lang}/search.html"><input name="q" type="search" class="big-search" placeholder="${t('searchPh', lang)}"> <button class="btn-primary">${t('search', lang)}</button></form><div id="search-out"></div>` }));

// ---------- status ----------
addPage('status.html', lang => {
  const S = D.status; const block = k => { const s = S[k]; return `<div class="status-card sc-${s.state}"><h3><span class="lsq" style="background:${k === 'X' ? '#3b2a7a' : lines[k].color}"></span>${k === 'X' ? (lang === 'ja' ? '特急「月影」' : 'Ltd. Exp. Comet') : lines[k][lang]} <em>${s[lang]}</em></h3><p>${s.detail[lang]}</p></div>`; };
  const hist = S.history.map(([d, l, tm, cause, mx, n, rec]) => `<tr><td>${fmtDate(d, lang)}</td><td>${l === '-' ? '—' : lines[l][lang]}</td><td>${tm || '—'}</td><td>${cause[lang]}</td><td class="num">${mx ? `${mx}${lang === 'ja' ? '分' : ' min'}` : '—'}</td><td class="num">${n || '—'}</td><td>${rec[lang] || '—'}</td></tr>`).join('');
  const certs = S.history.filter(h => h[4] >= 5).map(([d, l, tm, cause, mx]) => `<details class="cert"><summary>${fmtDate(d, lang)} ${lines[l][lang]} ${tm}〜 ${lang === 'ja' ? `最大${mx}分` : `up to ${mx} min`}</summary><div class="cert-body"><b>${lang === 'ja' ? '遅延証明書' : 'Delay Certificate'}</b><p>${lang === 'ja' ? `${fmtDate(d, 'ja')}、${lines[l].ja}において、${cause.ja}のため、${tm}ごろから列車に最大${mx}分の遅れが発生したことを証明します。` : `This is to certify that on ${fmtDate(d, 'en')}, trains on the ${lines[l].en} were delayed by up to ${mx} minutes from about ${tm} because of: ${cause.en.toLowerCase()}.`}</p><p class="small">${lang === 'ja' ? '春川鉄道株式会社 運輸部' : 'Springvale Railway Co., Ltd., Operations Department'}</p></div></details>`).join('');
  return { title: t('status', lang), side: true, body: `<h1 class="h1">${t('status', lang)}</h1><p class="muted">${t('asOf', lang)}</p>${block('K')}${block('B')}${block('X')}
<div class="status-card sc-info"><h3>${lang === 'ja' ? '駅設備' : 'Station facilities'}</h3><p>${lang === 'ja' ? '城町駅1番線（月見温泉方面）のエレベーターは点検のため10月23日（金）まで使用できません。' : 'Castle Town platform 1 (for Moonview Spa): the lift is out of service for maintenance until Fri 23 Oct.'} <a href="/${lang}/notices/shiromachi-lift.html">${t('details', lang)}</a></p></div>
<p class="small">${lang === 'ja' ? '運行情報は5分以上の遅れが発生した場合、または発生が見込まれる場合に掲載します。' : 'We post delays of 5 minutes or more, or when they are expected.'}</p>
<h2 class="h2">${lang === 'ja' ? '過去7日間の運行状況' : 'The past seven days'}</h2><div class="scroll"><table class="data small"><thead><tr><th>${lang === 'ja' ? '日付' : 'Date'}</th><th>${lang === 'ja' ? '路線' : 'Line'}</th><th>${lang === 'ja' ? '発生時刻' : 'Time'}</th><th>${lang === 'ja' ? '原因' : 'Cause'}</th><th>${lang === 'ja' ? '最大遅延' : 'Max delay'}</th><th>${lang === 'ja' ? '影響列車' : 'Trains'}</th><th>${lang === 'ja' ? '平常運転' : 'Recovered'}</th></tr></thead><tbody>${hist}</tbody></table></div>
<h2 class="h2" id="certificates">${lang === 'ja' ? '遅延証明書' : 'Delay certificates'}</h2><p class="small">${lang === 'ja' ? '5分以上の遅れが発生した日の証明書を、過去7日分表示・印刷できます。駅でも発行します（当日のみ）。' : 'Certificates for delays of 5 minutes or more can be viewed and printed here for the past seven days. Stations issue them on the day only.'}</p>${certs}
<h2 class="h2">${lang === 'ja' ? '定時運行率' : 'Punctuality'}</h2><div class="chart-box">${punctualityChart(lang)}</div><p class="small muted">${lang === 'ja' ? '2026年8月は台風7号の影響で定時運行率が低下しました。' : 'Punctuality fell in August 2026 because of Typhoon No. 7.'}</p>` };
});
addPage('notices/index.html', lang => ({ title: lang === 'ja' ? 'お知らせ' : 'Notices', side: true, body: `<h1 class="h1">${lang === 'ja' ? 'お知らせ一覧' : 'Notices'}</h1>${noticeList(lang)}` }));

// ---------- helpers for the prose pages ----------
const round10 = x => Math.round(x / 10) * 10;
const commuter = tk => { const c1 = round10(tk * 28.5), s1 = round10(c1 * 0.55); return [c1, round10(c1 * 3 * 0.95), round10(c1 * 6 * 0.9), s1, round10(s1 * 3 * 0.95), round10(s1 * 6 * 0.9)]; };
function H(lang) {
  const Y = n => yen(n, lang); const ja = lang === 'ja';
  const kmRange = i => `${i ? D.fareBands[i - 1][0] + 1 : 1}–${D.fareBands[i][0]} km`;
  return {
    lang, yen: Y, a: (p, text) => `<a href="/${lang}/${p}">${text}</a>`,
    img: (f, cap, cls = 'right') => `<figure class="fig ${cls}"><img src="/assets/img/${f}" alt="" width="360">${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`,
    chartImg: name => `<img class="chart" src="/assets/charts/${name}-${lang}.svg" alt="${ja ? 'グラフ' : 'chart'}" width="600">`,
    occupancyChart: () => `<div class="chart-box">${occupancyChart(lang)}</div>`,
    fare: (a, b) => fare(a, b), xFee: km => xFee(km), commuter, pass: D.pass, fee: D.tsukikageFee, peakDates: D.peakDates[lang],
    fareTable: () => `<table class="data"><thead><tr><th>${ja ? '営業キロ' : 'Distance'}</th><th>${ja ? '大人 きっぷ' : 'Adult paper ticket'}</th><th>${ja ? '大人 ハルカ' : 'Adult RideCard'}</th><th>${ja ? '小児 きっぷ' : 'Child paper ticket'}</th><th>${ja ? '小児 ハルカ' : 'Child RideCard'}</th></tr></thead><tbody>${D.fareBands.map(([, tk, ic], i) => `<tr><td>${kmRange(i)}</td><td class="num">${Y(tk)}</td><td class="num">${Y(ic)}</td><td class="num">${Y(Math.floor(tk / 20) * 10)}</td><td class="num">${Y(Math.floor(ic / 2))}</td></tr>`).join('')}</tbody></table>`,
    commuterTable: () => `<div class="scroll"><table class="data"><thead><tr><th rowspan="2">${ja ? '営業キロ' : 'Distance'}</th><th colspan="3">${ja ? '通勤定期券' : 'Commuter pass'}</th><th colspan="3">${ja ? '通学定期券（大学・高校）' : 'Student pass (university, high school)'}</th></tr><tr><th>${ja ? '1か月' : '1 month'}</th><th>${ja ? '3か月' : '3 months'}</th><th>${ja ? '6か月' : '6 months'}</th><th>${ja ? '1か月' : '1 month'}</th><th>${ja ? '3か月' : '3 months'}</th><th>${ja ? '6か月' : '6 months'}</th></tr></thead><tbody>${D.fareBands.map(([, tk], i) => `<tr><td>${kmRange(i)}</td>${commuter(tk).map(v => `<td class="num">${Y(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
    feeTable: () => { const F = D.tsukikageFee; return `<table class="data"><thead><tr><th>${ja ? '「月影」乗車距離' : 'Distance on Comet'}</th><th>${ja ? '普通車指定席' : 'Standard seat'}</th><th>${ja ? 'プレミアム席' : 'Premium seat'}</th><th>${ja ? '小児（普通車）' : 'Child (standard)'}</th><th>${ja ? '繁忙期' : 'Peak dates'}</th></tr></thead><tbody>${F.bands.map(([max, v], i) => `<tr><td>${i ? `${F.bands[i - 1][0] + 1}–${max} km` : `${ja ? '' : 'up to '}${max} km${ja ? 'まで' : ''}`}</td><td class="num">${Y(v)}</td><td class="num">${Y(v + F.premium)}</td><td class="num">${Y(Math.floor(v / 20) * 10)}</td><td class="num">+${Y(F.peak)}</td></tr>`).join('')}</tbody></table>`; },
    xExamples: () => { const pairs = [['central', 'tsukimionsen'], ['central', 'kamano'], ['central', 'kagamikyo'], ['shiromachi', 'tsukimionsen'], ['kamano', 'tsukimionsen'], ['kagamikyo', 'tsukimionsen']];
      return `<table class="data"><thead><tr><th>${ja ? '区間' : 'Journey'}</th><th>${ja ? '営業キロ' : 'km'}</th><th>${ja ? '運賃（きっぷ）' : 'Fare (ticket)'}</th><th>${ja ? '特急料金（普通車）' : 'Surcharge (standard)'}</th><th>${ja ? '合計' : 'Total'}</th><th>${ja ? 'プレミアム席の合計' : 'Total, Premium'}</th></tr></thead><tbody>${pairs.map(([a, b]) => { const f = fare(a, b), x = xFee(f.km); return `<tr><td>${sname(a, lang)} – ${sname(b, lang)}</td><td class="num">${f.km.toFixed(1)}</td><td class="num">${Y(f.ticket)}</td><td class="num">${Y(x)}</td><td class="num"><b>${Y(f.ticket + x)}</b></td><td class="num">${Y(f.ticket + x + D.tsukikageFee.premium)}</td></tr>`; }).join('')}</tbody></table>`; },
    xTimetable: () => ['d', 'u'].map(dir => { const ts = trains.filter(tr => tr.type === 'X' && tr.dir === dir); const nos = [...new Set(ts.map(tr => tr.no))].sort((a, b) => a - b); const order = dir === 'd' ? xStops : [...xStops].reverse();
      return `<h3 class="h3">${lines.K.dirs[dir][lang]}</h3><div class="scroll"><table class="data small xtt"><thead><tr><th>${ja ? '号' : 'No.'}</th><th>${ja ? '運転日' : 'Runs'}</th>${order.map(id => `<th>${esc(sname(id, lang))}</th>`).join('')}</tr></thead><tbody>${nos.map(no => { const days = ts.filter(tr => tr.no === no); const tr = days[0]; const runs = days.length === 2 ? (ja ? '毎日' : 'Daily') : days[0].day === 'wd' ? t('weekday', lang) : t('weekendShort', lang);
        return `<tr><td class="num"><b>${no}</b></td><td>${runs}</td>${order.map((id, i) => { const m = arrAt(tr, id); return `<td class="num">${m === undefined ? '' : hm(m)}${i === order.length - 1 ? (ja ? '着' : '') : ''}</td>`; }).join('')}</tr>`; }).join('')}</tbody></table></div>`; }).join(''),
    stepFreeTable: () => `<div class="scroll"><table class="data small"><thead><tr><th>${ja ? '駅番号' : 'No.'}</th><th>${ja ? '駅名' : 'Station'}</th><th>${ja ? '番線と段差のないルート' : 'Platforms and step-free route'}</th><th>${ja ? '多機能トイレ' : 'Multipurpose toilet'}</th><th>${ja ? '駅係員' : 'Staff'}</th></tr></thead><tbody>${stations.map(s => `<tr${Object.values(s.access).includes('stairs') ? ' class="hl"' : ''}><td>${s.codes.join('/')}</td><td><a href="/${lang}/stations/${s.id}.html">${esc(s[lang])}</a></td><td>${Object.entries(s.access).map(([p, a]) => `${p}: <span class="acc acc-${a}">${ACC[a][lang]}</span>${s.liftOut && s.liftOut.platform === Number(p) ? (ja ? '（10月23日まで停止中）' : ' (out of service until 23 Oct)') : ''}`).join('<br>')}</td><td>${s.toilets === 'multi' ? t('yes', lang) : t('no', lang)}</td><td class="small">${esc(s.staff[lang])}</td></tr>`).join('')}</tbody></table></div>`,
    firstLast: (st, line, dir) => firstLast(st, line, dir, lang),
    deps: (st, line, dir, day, type) => departures(st, line, dir, day, type).map(x => hm(x.m)).join(ja ? '、' : ', '),
    depsArr: (st, line, dir, day, type, to) => departures(st, line, dir, day, type).filter(x => arrAt(x.tr, to) !== undefined).map(x => `${hm(x.m)}→${hm(arrAt(x.tr, to))}`).join(ja ? '、' : ', '),
  };
}
for (const lang of LANGS) prose[lang] = (lang === 'en' ? proseEn : proseJa)(H(lang));

const tk = [[{ en: 'Fares & Tickets', ja: '運賃・きっぷ' }, 'tickets/index.html']];
const PROSE_PAGES = [
  ['fares', 'fares/index.html', [], true], ['tickets', 'tickets/index.html', [], true], ['haruca', 'tickets/haruca.html', tk, true], ['passes', 'tickets/passes.html', tk, true],
  ['commuter', 'tickets/commuter.html', tk, true], ['discounts', 'tickets/discounts.html', tk, true], ['tsukikage', 'tsukikage/index.html', [], false],
  ['accessibility', 'accessibility.html', [], false], ['lostfound', 'lost-found.html', [], true], ['rules', 'rules.html', [], true], ['faq', 'faq.html', [], true],
  ['trip-onsen', 'trips/tsukimi-onsen.html', [], true], ['trip-festival', 'trips/lantern-festival.html', [], true], ['about', 'about.html', [], true],
  ...NOTICES.map(([slug]) => [`notice:${slug}`, `notices/${slug}.html`, [[{ en: 'Notices', ja: 'お知らせ' }, 'notices/index.html']], true]),
];
for (const [id, rel, crumbs, side] of PROSE_PAGES) addPage(rel, lang => {
  const p = prose[lang][id]; if (!p) throw new Error(`missing prose ${id} ${lang}`);
  const n = NOTICES.find(x => `notice:${x[0]}` === id);
  const head = n ? `<p class="notice-meta"><time>${fmtDate(n[1], lang)}</time> <span class="cat cat-${n[2]}">${CAT[n[2]][lang]}</span></p>` : '';
  return { title: p.title, crumbs, side, wide: !side, body: `<h1 class="h1">${esc(p.title)}</h1>${head}${p.body}` };
});

// ---------- consistency: facts stated in the prose must match the generated timetable ----------
{
  const expect = (cond, msg) => { if (!cond) throw new Error('consistency check failed: ' + msg); };
  const find = (day, type, o, dep) => trains.find(x => x.day === day && x.type === type && x.o === o && hm(x.stops[0][1]) === dep);
  const lastFrom = (st, line, dir, day) => departures(st, line, dir, day).at(-1);
  expect(stations.length === 22 && lineStations.K.length === 14 && lineStations.B.length === 9, 'station counts');
  expect(byId.tsukimionsen.km.K === 38.6 && byId.minoriport.km.B === 16.2 && D.fareBands[0][1] === 170, 'line lengths, minimum fare');
  let l = lastFrom('tsukimionsen', 'K', 'u', 'we'); expect(hm(l.m) === '21:05' && hm(arrAt(l.tr, 'central')) === '22:08', 'weekend last train from Moonview Spa');
  l = lastFrom('tsukimionsen', 'K', 'u', 'wd'); expect(hm(l.m) === '21:40' && hm(arrAt(l.tr, 'central')) === '22:43', 'weekday last train from Moonview Spa');
  l = lastFrom('central', 'K', 'd', 'wd'); expect(hm(l.m) === '23:20' && l.tr.d === 'kamano', 'weekday last northbound');
  const bay = departures('central', 'B', 'd', 'we'); expect(hm(bay.at(-1).m) === '23:35' && bay.at(-1).tr.d === 'minorikoen' && hm(bay.filter(x => x.tr.d === 'minoriport').at(-1).m) === '23:00', 'Bayside weekend last trains');
  let x = find('wd', 'X', 'central', '7:30'); expect(x && x.no === 1 && hm(arrAt(x, 'tsukimionsen')) === '8:09', 'Comet 1');
  x = find('we', 'X', 'central', '9:30'); expect(x && x.no === 5 && hm(arrAt(x, 'tsukimionsen')) === '10:09', 'sample day, out');
  x = find('we', 'X', 'tsukimionsen', '16:50'); expect(x && x.no === 22 && hm(arrAt(x, 'central')) === '17:29', 'sample day, back');
  x = find('we', 'X', 'tsukimionsen', '14:50'); expect(x && x.no === 18, 'Comet 18 in the service status');
  expect([21, 24, 25, 28].every(no => trains.some(y => y.day === 'we' && y.no === no && arrAt(y, 'shiromachi') !== undefined)), 'festival Comet numbers');
  expect([2, 6].every(no => trains.some(y => y.day === 'wd' && y.no === no)), 'Comet 2 and 6 (1 Oct status)');
  expect(occupancy.every(([no]) => trains.some(y => y.no === no)), 'occupancy chart train numbers');
  expect(xFee(distance('kamano', 'tsukimionsen')) === 760 && fare('minoriport', 'tsukimionsen').ticket === 970, 'fee and fare examples');
  const ids = f => stations.filter(f).map(s => s.id).join(',');
  expect(ids(s => s.access[1] === 'stairs') === 'nishiharuno,yuzuhara,nakazawa,shiohama', 'stairs-only platforms named in the accessibility page');
  expect(ids(s => !s.charge) === 'otsuka,nakazawa,hotarudani,shiohama,hamanaka', 'unstaffed stations without ticket machines');
  expect(ids(s => s.lockers > 0) === 'central,shiromachi,daigakumae,kamano,kagamikyo,tsukimionsen,ichiba,minorikoen,minoriport', 'stations with lockers (FAQ)');
}

// ---------- render, data files, search index ----------
for (const [rel, fn] of queue) for (const lang of LANGS) layout(lang, rel, fn(lang));
for (const pg of pages) write(`${pg.lang}/${pg.rel}`, pg.html);
write('index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Springvale Railway</title><meta http-equiv="refresh" content="0; url=/en/index.html"></head><body><a href="/en/index.html">Springvale Railway</a> · <a href="/ja/index.html">春川鉄道</a><script>location.replace((navigator.language || '').startsWith('ja') ? '/ja/index.html' : '/en/index.html')</script></body></html>\n`);
write('assets/data/network.json', JSON.stringify({
  stations: stations.map(s => ({ id: s.id, codes: s.codes, en: s.en, ja: s.ja, km: s.km })), xStops, fareBands: D.fareBands, fee: D.tsukikageFee, holidays: D.holidays,
  peak: ['2026-10-10', '2026-10-11', '2026-10-12'], range: RANGE, lines: Object.fromEntries(Object.entries(lines).map(([k, v]) => [k, { en: v.en, ja: v.ja, color: v.color }])),
}));
write('assets/data/trains.json', JSON.stringify(trains.map(({ id, day, line, dir, type, no, o, d, stops }) => ({ id, day, line, dir, type, no, o, d, s: stops }))));
for (const lang of LANGS) {
  const idx = pages.filter(p => p.lang === lang && !['search.html', 'reserve/seat.html', 'reserve/details.html', 'reserve/complete.html'].includes(p.rel)).map(p => {
    const main = p.html.split('<main class="main">')[1].split('</main>')[0].replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
    return { t: p.title, u: `/${lang}/${p.rel}`, x: main.slice(0, 4000) };
  });
  write(`assets/data/search-${lang}.json`, JSON.stringify(idx));
}
console.log(`built ${pages.length} pages (${pages.length / 2} per language), ${trains.length} trains`);
