// Kumo Mobile Support: the numbers every page shares, the HTML helpers the
// content files use, and the SVG charts and diagrams the build draws.
// Prices are tax-included yen. "Today" is Sunday, 4 October 2026.

export const TODAY = { en: '4 October 2026', ja: '2026年10月4日' };

// ---------- Plans ----------
export const PLAN = {
  mini: { gb: 3, price: 2178, slow: '300 kbps' },
  basic: { gb: 20, price: 4378, slow: '1 Mbps', carry: 20 },
  unlimited: { price: 7238, newPrice: 7458, lowGb: 3, lowOff: 1650, tether: 30, worldFree: 2 },
  senior: { gb: 5, price: 2728, slow: '300 kbps', freeMin: 10, age: 65 },
};
export const PLAN_KEYS = ['mini', 'basic', 'unlimited', 'senior'];

// per-line monthly discounts; null = not eligible
export const DISC = {
  family: { // by number of lines in the family group
    mini: [null, null, null], basic: [550, 1100, 1210], unlimited: [550, 1100, 1210], senior: [550, 550, 550],
  },
  home: { mini: 550, basic: 1100, unlimited: 1100, senior: 550 },
  u22: { mini: null, basic: 550, unlimited: 1100, senior: null },
  maxLines: 10,
};

export const CALL = { per30s: 22, sms: 3.3, talk5: 880, talkAll: 1980, seniorUpgrade: 1100 };
export const DATA = { gb1: 550, gb5: 2200, validDays: 62 };
export const OPT = { hikari: 5720, hikariMansion: 4620, watch: 330, security: 440, mailKeep: 330, numberKeep: 440, numberKeepMonths: 12 };

export const CARE = [ // Device Care tiers
  { id: 'light', fee: 550, repair: 5500, replace: null, claims: 2 },
  { id: 'standard', fee: 880, repair: 3300, replace: 12100, claims: 2 },
  { id: 'premium', fee: 1430, repair: 0, repairNext: 3300, replace: 8800, claims: 3 },
];
export const CARE_HIGH = { over: 150000, add: 330 };

// Kumo World roaming
export const ROAM = [
  { id: 'asia', pass: 980, newPass: 1080, local: 90, toJp: 140, recv: 120, sms: 100, cap: 2980, free: true },
  { id: 'na', pass: 1280, local: 140, toJp: 180, recv: 150, sms: 100, cap: 2980, free: true },
  { id: 'eu', pass: 1280, local: 160, toJp: 200, recv: 150, sms: 100, cap: 2980, free: false },
  { id: 'oc', pass: 1280, local: 160, toJp: 200, recv: 150, sms: 100, cap: 2980, free: false },
  { id: 'mea', pass: 2480, local: 230, toJp: 280, recv: 180, sms: 100, cap: 4980, free: false },
  { id: 'la', pass: 2480, local: 230, toJp: 280, recv: 180, sms: 100, cap: 4980, free: false },
  { id: 'sea', pass: null, local: 300, toJp: 300, recv: 300, sms: 100, cap: null, free: false },
];
export const ROAM_PASS = { gb: 3, slow: '128 kbps', perKb: 2.2 };

// ---------- Fees ----------
export const FEE = {
  adminShop: 3850, adminOnline: 0, simReissueShop: 3850, simReissueOnline: 2200, esimReissueShop: 3850,
  transfer: 3850, numberChange: 3850, paperBill: 209, callRecord: 110, slip: 220, lateRate: '14.5%',
  loaner: 1100, screenFrom: 19800, screenTo: 42900, lateSuspendDays: 20,
};

// ---------- Sample bill (August 2026 usage) ----------
export const BILL = [
  ['plan', 4378], ['family', -1100], ['home', -1100], ['talk5', 880], ['calls', 264], ['sms', 33],
  ['data', 550], ['care', 880], ['paper', 209], ['universal', 3], ['relay', 1],
];
export const BILL_DEVICE = 3980; // installment 13 of 24
export const BILL_COMM = BILL.reduce((s, [, v]) => s + v, 0);
export const BILL_TOTAL = BILL_COMM + BILL_DEVICE;
export const BILL_GROUPS = [ // for the breakdown chart
  ['plan', 4378 - 2200], ['options', 880 + 880], ['usage', 264 + 33 + 550], ['fees', 209 + 3 + 1], ['device', BILL_DEVICE],
];

// ---------- Network ----------
export const MONTHS = { en: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], ja: ['10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月'] };
export const SPEED = { g5: [285, 291, 288, 302, 310, 296, 318, 322, 315, 304, 330, 334], g4: [62, 61, 63, 60, 58, 55, 57, 59, 58, 54, 56, 57] };
export const USAGE = { // average GB per line per month, Oct 2025 - Sep 2026
  mini: [1.9, 2.0, 2.2, 2.1, 1.9, 2.0, 2.1, 2.1, 2.2, 2.3, 2.4, 2.2],
  basic: [11.8, 12.0, 12.9, 12.6, 12.1, 12.4, 12.8, 13.0, 13.1, 13.9, 14.6, 13.6],
  unlimited: [38.2, 38.9, 41.5, 40.7, 39.4, 40.2, 41.8, 42.6, 43.1, 45.0, 47.3, 45.9],
  senior: [2.4, 2.5, 2.6, 2.5, 2.4, 2.6, 2.7, 2.8, 2.8, 2.9, 3.1, 2.9],
};
// prefecture, 5G population coverage % (Sep 2026), change since Sep 2025 (points), 5G sites, mmWave
export const PREF = [
  ['Hokkaido', '北海道', 91.2, 4.1, 6420, 'sapporo'], ['Miyagi', '宮城県', 93.8, 3.2, 2310, 'sendai'],
  ['Tokyo', '東京都', 99.4, 0.6, 14850, 'yes'], ['Kanagawa', '神奈川県', 98.9, 0.9, 8930, 'yes'],
  ['Niigata', '新潟県', 88.5, 5.0, 2480, null], ['Aichi', '愛知県', 97.6, 1.8, 7260, 'nagoya'],
  ['Minori', 'みのり県', 86.7, 9.3, 1284, 'harukawa'], ['Kyoto', '京都府', 95.1, 2.2, 2940, 'kyoto'],
  ['Osaka', '大阪府', 99.0, 0.8, 10120, 'yes'], ['Hiroshima', '広島県', 92.4, 3.6, 2870, 'hiroshima'],
  ['Ehime', '愛媛県', 84.3, 6.8, 1390, null], ['Fukuoka', '福岡県', 96.8, 1.9, 5310, 'fukuoka'],
  ['Kagoshima', '鹿児島県', 82.9, 7.4, 1650, null], ['Okinawa', '沖縄県', 90.5, 4.4, 1480, 'naha'],
];
export const NATIONAL_5G = 95.6;
// Minori Prefecture municipalities: name en, ja, coverage now, target March 2027
export const MUNI = [
  ['Harukawa City', '春川市', 97.9, 99.0], ['Mikage City', '御影市', 88.1, 94.0], ['Hanaoka Town', '花岡町', 74.6, 85.0],
  ['Tsukimi Town (incl. Tsukimi Onsen)', '月見町（月見温泉を含む）', 61.2, 80.0], ['Shiose Village', '潮瀬村', 38.5, 55.0],
];

// ---------- Shops (Minori Prefecture) ----------
// services: n = new contracts & switching, r = repairs, e = eSIM, c = smartphone classes, p = parking
export const SHOPS = [
  { id: 'harukawa-central', page: true, svc: 'nrecp',
    en: { name: 'Kumo Shop Harukawa Central', addr: 'Harukawa Central Station Building 2F, 1-1 Ekimae-dōri, Harukawa-shi, Minori 789-0001', hours: 'Daily 10:00–20:00', closed: '1 January; building inspection day (17 February 2027)' },
    ja: { name: 'クモショップ 春川中央店', addr: '〒789-0001 みのり県春川市駅前通1-1 春川中央駅ビル2階', hours: '毎日 10:00〜20:00', closed: '1月1日、ビル点検日（2027年2月17日）' }, tel: '0570-058-101' },
  { id: 'kitamachi', svc: 'nrep',
    en: { name: 'Kumo Shop Harukawa Kitamachi', addr: '3-14-2 Kitamachi, Harukawa-shi, Minori 789-0034', hours: '10:00–19:00', closed: 'Wednesdays' },
    ja: { name: 'クモショップ 春川北町店', addr: '〒789-0034 みのり県春川市北町3-14-2', hours: '10:00〜19:00', closed: '毎週水曜日' }, tel: '0570-058-102' },
  { id: 'bayside', svc: 'nrecp',
    en: { name: 'Kumo Shop Bayside Mall Minori Port', addr: 'Bayside Mall 1F, 2-8 Minato-machi, Harukawa-shi, Minori 789-0310', hours: '10:00–21:00 (mall hours)', closed: 'Mall holidays' },
    ja: { name: 'クモショップ ベイサイドモールみのり港店', addr: '〒789-0310 みのり県春川市港町2-8 ベイサイドモール1階', hours: '10:00〜21:00（モールに準ずる）', closed: 'モール休館日' }, tel: '0570-058-103' },
  { id: 'mikage', svc: 'nrep',
    en: { name: 'Kumo Shop Mikage', addr: '5-3-7 Honchō, Mikage-shi, Minori 789-1205', hours: '10:00–19:00', closed: '2nd and 4th Thursdays' },
    ja: { name: 'クモショップ 御影店', addr: '〒789-1205 みのり県御影市本町5-3-7', hours: '10:00〜19:00', closed: '第2・第4木曜日' }, tel: '0570-058-104' },
  { id: 'hanaoka', svc: 'nep',
    en: { name: 'Kumo Shop Hanaoka', addr: '880-1 Hanaoka, Hanaoka-chō, Minori-gun, Minori 789-1503', hours: '10:00–18:30', closed: 'Wednesdays and Thursdays' },
    ja: { name: 'クモショップ 花岡店', addr: '〒789-1503 みのり県みのり郡花岡町花岡880-1', hours: '10:00〜18:30', closed: '毎週水曜日・木曜日' }, tel: '0570-058-105' },
  { id: 'tsukimi', svc: 're',
    en: { name: 'Kumo Shop Tsukimi Onsen', addr: '1-2 Yumoto, Tsukimi-chō, Minori 789-2101', hours: '10:00–18:00', closed: 'Tuesdays and Wednesdays' },
    ja: { name: 'クモショップ 月見温泉店', addr: '〒789-2101 みのり県月見町湯元1-2', hours: '10:00〜18:00', closed: '毎週火曜日・水曜日' }, tel: '0570-058-106' },
  { id: 'university', svc: 'ne',
    en: { name: 'Kumo Counter Harukawa University (Co-op)', addr: 'Student Union Building 1F, Harukawa University, 1 Gakuen-chō, Harukawa-shi, Minori 789-0560', hours: 'Weekdays 10:00–17:00 (term time)', closed: 'Weekends, holidays and university vacations' },
    ja: { name: 'クモカウンター 春川大学生協店', addr: '〒789-0560 みのり県春川市学園町1 春川大学 学生会館1階', hours: '平日 10:00〜17:00（授業期間中）', closed: '土日祝・大学の休業期間' }, tel: '0570-058-107' },
];

// ---------- Phone lines ----------
export const TEL = {
  info: { short: '1580', free: '0120-58-0158', hours: [9, 20] },
  lost: { short: '1581', free: '0120-58-0110', abroad: '+81-3-6300-0110' },
  tech: { free: '0120-58-0234', hours: [9, 19] },
  care: { free: '0120-58-0345', hours: [9, 20] },
  billing: { navi: '0570-058-010', hours: [10, 18] },
  lang: { free: '0120-58-0567', hours: [9, 18] },
  shopBooking: { free: '0120-58-0789', hours: [10, 19] },
};

// ---------- HTML helpers ----------
export const yen = (n) => (n < 0 ? '−¥' : '¥') + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
export const yenJ = (n) => (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 1 }) + '円';
const yenFmt = (n) => yen(n);
export const pct = (n) => n.toFixed(1) + '%';

export const table = (head, rows, o = {}) =>
  `<div class="tbl-wrap"><table class="tbl${o.cls ? ' ' + o.cls : ''}">${o.caption ? `<caption>${o.caption}</caption>` : ''}` +
  (head.some(Boolean) ? `<thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>` : '') + `<tbody>` +
  rows.map((r) => `<tr${r.cls ? ` class="${r.cls}"` : ''}>${r.map((c, i) => (i === 0 && o.rowHead !== false ? `<th scope="row">${c}</th>` : `<td>${c ?? '—'}</td>`)).join('')}</tr>`).join('') +
  `</tbody></table></div>`;

export const steps = (items) =>
  `<ol class="steps">${items.map(([t, d]) => `<li><p class="step-t">${t}</p><div class="step-d">${d}</div></li>`).join('')}</ol>`;

export const note = (kind, html, title = '') =>
  `<div class="note note-${kind}">${title ? `<p class="note-t">${title}</p>` : ''}${html}</div>`;

export const tabs = (items) =>
  `<div class="tabs"><div class="tab-list" role="tablist">${items.map(([l], i) => `<button type="button" role="tab" aria-selected="${!i}" class="tab${i ? '' : ' on'}">${l}</button>`).join('')}</div>` +
  items.map(([, h], i) => `<div class="tab-panel" role="tabpanel"${i ? ' hidden' : ''}>${h}</div>`).join('') + `</div>`;

export const faq = (items) =>
  items.map(([q, a, id]) => `<details class="acc"${id ? ` id="${id}"` : ''}><summary>${q}</summary><div class="acc-b">${a}</div></details>`).join('');

export const cards = (items) =>
  `<div class="cards">${items.map(([href, t, d, icon]) => `<a class="card" href="${href}">${icon ? `<span class="card-ic">${ICON[icon] || ''}</span>` : ''}<span class="card-t">${t}</span>${d ? `<span class="card-d">${d}</span>` : ''}</a>`).join('')}</div>`;

export const figure = (svg, cap) => `<figure class="fig">${svg}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;

// small stroke icons for tiles
const ic = (d) => `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICON = {
  switch: ic('<path d="M4 8h13l-3-3M20 16H7l3 3"/>'),
  sim: ic('<path d="M7 3h7l4 4v14H7z"/><rect x="9.5" y="11" width="6" height="6" rx="1"/>'),
  esim: ic('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10 9h4v4h-4zM12 6v1M12 15v1"/>'),
  plan: ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  data: ic('<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>'),
  lost: ic('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8v3M11 13.5v.5"/>'),
  repair: ic('<path d="M14 6a4 4 0 0 0 5 5l-8 8a2.1 2.1 0 0 1-3-3l8-8a4 4 0 0 1-2-2z"/>'),
  cancel: ic('<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>'),
  bill: ic('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
  user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>'),
  family: ic('<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c.6-3.5 3-5.5 5.5-5.5s4.9 2 5.5 5.5M14 20c.4-2.6 1.6-4.2 3-4.2s2.8 1.6 3.3 4.2"/>'),
  shop: ic('<path d="M3 9l2-5h14l2 5M4 9v11h16V9M3 9h18M9 20v-6h6v6"/>'),
  globe: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'),
  card: ic('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>'),
  doc: ic('<path d="M6 2.5h8l4 4V21.5H6z"/><path d="M14 2.5v4h4M9 12h6M9 16h6"/>'),
  signal: ic('<path d="M4 20v-3M9 20v-7M14 20v-11M19 20V4"/>'),
};

// ---------- SVG: charts ----------
const FONT = `font-family="Helvetica Neue, Arial, Hiragino Kaku Gothic ProN, Meiryo, sans-serif"`;
const INK = '#2b3440', MUTED = '#6b7785', GRID = '#e3e7ec';
export const COLORS = { mini: '#8e5bd6', basic: '#1f6fd1', unlimited: '#e8833a', senior: '#2a9d8f', g5: '#1f6fd1', g4: '#e8833a' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function nudge(labels, gap, lo, hi) { // spread direct labels so they do not overlap
  labels.sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + gap);
  for (let i = labels.length - 1; i >= 0; i--) {
    labels[i].y = Math.min(labels[i].y, (i === labels.length - 1 ? hi : labels[i + 1].y - gap));
  }
  labels.forEach((l) => (l.y = Math.max(l.y, lo)));
  return labels;
}

// series: [{ name, color, pts: [[x, y], ...] }], x is numeric
export function lineChart({ w = 680, h = 330, title, series, xMin = 0, xMax, xTicks, xFmt = (v) => v, yMax, yStep, yFmt = (v) => v, xTitle = '', note = '', standalone = false }) {
  const m = { l: 62, r: 132, t: title ? 40 : 16, b: xTitle ? 50 : 34 };
  const pw = w - m.l - m.r, ph = h - m.t - m.b;
  const X = (x) => m.l + (pw * (x - xMin)) / (xMax - xMin);
  const Y = (y) => m.t + ph * (1 - Math.min(y, yMax) / yMax);
  let s = '';
  for (let v = 0; v <= yMax; v += yStep) s += `<line x1="${m.l}" x2="${m.l + pw}" y1="${Y(v)}" y2="${Y(v)}" stroke="${GRID}"/><text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="${MUTED}">${esc(yFmt(v))}</text>`;
  for (const t of xTicks) s += `<text x="${X(t)}" y="${m.t + ph + 18}" text-anchor="middle" font-size="11" fill="${MUTED}">${esc(xFmt(t))}</text>`;
  s += `<line x1="${m.l}" x2="${m.l + pw}" y1="${m.t + ph}" y2="${m.t + ph}" stroke="#9aa5b1"/>`;
  const clip = `c${Math.random().toString(36).slice(2, 8)}`;
  s += `<clipPath id="${clip}"><rect x="${m.l}" y="${m.t - 2}" width="${pw + 2}" height="${ph + 4}"/></clipPath>`;
  const labels = [];
  for (const se0 of series) {
    const se = { ...se0, pts: se0.pts.filter(([, y]) => y <= yMax) }; // stop a line where it leaves the chart
    s += `<polyline clip-path="url(#${clip})" fill="none" stroke="${se.color}" stroke-width="2.2" stroke-linejoin="round" points="${se.pts.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ')}"/>`;
    const last = se.pts[se.pts.length - 1];
    s += `<circle cx="${X(last[0])}" cy="${Y(last[1])}" r="3.5" fill="${se.color}" stroke="#fff" stroke-width="1.5"/>`;
    labels.push({ x: X(last[0]), y: Y(last[1]) + 4, name: se.name, color: se.color, edge: last[0] >= xMax - (xMax - xMin) * 0.1 });
  }
  for (const l of nudge(labels, 15, m.t + 4, m.t + ph)) {
    const lx = l.edge ? m.l + pw + 10 : l.x + 8;
    s += `<rect x="${lx}" y="${l.y - 8}" width="8" height="8" rx="2" fill="${l.color}"/><text x="${lx + 12}" y="${l.y}" font-size="11.5" fill="${INK}">${esc(l.name)}</text>`;
  }
  if (title) s = `<text x="${m.l}" y="22" font-size="14" font-weight="700" fill="${INK}">${esc(title)}</text>` + s;
  if (xTitle) s += `<text x="${m.l + pw / 2}" y="${h - 8}" text-anchor="middle" font-size="11" fill="${MUTED}">${esc(xTitle)}</text>`;
  if (note) s += `<text x="${w - 6}" y="${h - 8}" text-anchor="end" font-size="10" fill="${MUTED}">${esc(note)}</text>`;
  return svgWrap(w, h, s, standalone, title);
}

// rows: [{ label, value, color, valueLabel }]
export function barChart({ w = 680, title, rows, max, total }) {
  const textW = (t) => [...t].reduce((w, c) => w + (c.charCodeAt(0) > 0x2e80 ? 12 : 6.6), 0);
  const m = { l: Math.max(150, Math.max(...rows.map((r) => textW(r.label))) + 24), r: 90, t: title ? 44 : 14 };
  const bh = 22, gap = 12, h = m.t + rows.length * (bh + gap) + (total ? 34 : 10);
  const pw = w - m.l - m.r;
  let s = title ? `<text x="16" y="24" font-size="14" font-weight="700" fill="${INK}">${esc(title)}</text>` : '';
  rows.forEach((r, i) => {
    const y = m.t + i * (bh + gap), bw = Math.max(3, (pw * r.value) / max);
    s += `<text x="${m.l - 10}" y="${y + bh / 2 + 4}" text-anchor="end" font-size="12" fill="${INK}">${esc(r.label)}</text>`;
    s += `<rect x="${m.l}" y="${y}" width="${pw}" height="${bh}" fill="#f1f4f7" rx="3"/><rect x="${m.l}" y="${y}" width="${bw}" height="${bh}" fill="${r.color}" rx="3"/>`;
    s += `<text x="${m.l + bw + 8}" y="${y + bh / 2 + 4}" font-size="12" font-weight="700" fill="${INK}">${esc(r.valueLabel)}</text>`;
  });
  if (total) s += `<line x1="16" x2="${w - 16}" y1="${h - 30}" y2="${h - 30}" stroke="${GRID}"/><text x="${w - 16}" y="${h - 10}" text-anchor="end" font-size="13" font-weight="700" fill="${INK}">${esc(total)}</text>`;
  return svgWrap(w, h, s, false, title);
}

function svgWrap(w, h, body, standalone, title) {
  const head = standalone ? `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg"` : `<svg role="img"${title ? ` aria-label="${esc(title)}"` : ''}`;
  return `${head} viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="chart" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
}

// monthly price by data used, for the plan comparison chart
export function pricePoints(key, xMax = 30) {
  if (key === 'unlimited') return [[0, PLAN.unlimited.price - PLAN.unlimited.lowOff], [3, PLAN.unlimited.price - PLAN.unlimited.lowOff], [3, PLAN.unlimited.price], [xMax, PLAN.unlimited.price]];
  const p = PLAN[key], pts = [[0, p.price], [p.gb, p.price]];
  for (let g = p.gb + 1, c = p.price; g <= xMax; g++) { c += DATA.gb1; pts.push([g - 1, c], [g, c]); }
  return pts;
}

// ---------- SVG: diagrams ----------
// L: labels object from the content file
export function coverageMap(L) {
  const land = 'M20,30 L640,30 L640,250 L590,282 L520,300 L470,332 C440,372 380,392 330,382 C292,374 262,356 246,330 L190,356 L110,384 L20,392 Z';
  const blob5 = [[300, 330, 78], [470, 330, 46], [150, 250, 50], [345, 262, 36], [380, 210, 28], [420, 150, 24], [205, 128, 30]];
  const planned = [[395, 182, 30], [560, 205, 28], [170, 300, 30]];
  const sea = 'M0,392 L20,392 L110,384 L190,356 L246,330 C262,356 292,374 330,382 C380,392 440,372 470,332 L520,300 L590,282 L640,250 L660,238 L660,420 L0,420 Z';
  let s = `<rect width="660" height="420" fill="#e4e6e1"/><path d="${sea}" fill="#a9d0ea"/><path d="${land}" fill="#f6f5ef" stroke="#8d9a8d" stroke-width="1.2"/>`;
  s += `<text x="330" y="22" text-anchor="middle" font-size="10" fill="#8a96a3">${esc(L.neighbour || '')}</text>`;
  s += `<defs><clipPath id="landclip"><path d="${land}"/></clipPath><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#9aa5b1" stroke-width="1.4"/></pattern></defs>`;
  s += `<g clip-path="url(#landclip)"><rect x="20" y="30" width="620" height="370" fill="#cfe8cf"/>`;
  s += `<path d="M440,40 C520,60 560,110 520,150 C480,175 430,160 410,120 C395,85 410,45 440,40 Z" fill="url(#hatch)" opacity=".9"/>`;
  s += `<path d="M560,60 L640,60 L640,140 C610,150 580,120 560,60 Z" fill="url(#hatch)" opacity=".9"/>`;
  for (const [x, y, r] of blob5) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#1f6fd1" opacity=".55"/>`;
  for (const [x, y, r] of planned) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#1f6fd1" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  s += `</g>`;
  // river, rail lines, places
  s += `<path d="M470,95 C440,140 420,175 395,200 C365,230 350,260 330,290 C318,310 306,330 300,352" fill="none" stroke="#4a90c8" stroke-width="3"/>`;
  s += `<path d="M300,330 C330,290 350,262 372,232 C392,205 405,180 420,150" fill="none" stroke="#c0392b" stroke-width="2.4" stroke-dasharray="8 3"/>`;
  s += `<path d="M300,330 C350,346 410,345 470,330" fill="none" stroke="#7d3c98" stroke-width="2.4" stroke-dasharray="8 3"/>`;
  s += `<path d="M470,62 l14,24 h-28 z" fill="#7a6a58"/>`;
  const place = (x, y, t, big, anchor = 'start', dx = 8) => `<circle cx="${x}" cy="${y}" r="${big ? 5 : 3.5}" fill="#fff" stroke="${INK}" stroke-width="1.6"/><text x="${x + (anchor === 'end' ? -dx : dx)}" y="${y + 4}" text-anchor="${anchor}" font-size="${big ? 13 : 11.5}" font-weight="${big ? 700 : 400}" fill="${INK}" paint-order="stroke" stroke="#fff" stroke-width="3">${esc(t)}</text>`;
  s += place(300, 330, L.harukawa, true, 'end');
  s += place(470, 330, L.port, false);
  s += place(420, 150, L.onsen, false, 'end');
  s += place(150, 250, L.mikage, false);
  s += place(205, 128, L.hanaoka, false);
  s += place(560, 205, L.shiose, false);
  s += `<text x="490" y="78" font-size="11.5" fill="#5b4b3a" paint-order="stroke" stroke="#fff" stroke-width="3">${esc(L.mountain)}</text>`;
  s += `<text x="372" y="405" font-size="12" font-style="italic" fill="#3d6f93">${esc(L.bay)}</text>`;
  s += `<text x="340" y="282" font-size="10.5" fill="#2f6c99" font-style="italic" paint-order="stroke" stroke="#fff" stroke-width="2.5" transform="rotate(-55 340 282)">${esc(L.river)}</text>`;
  // legend
  const lg = [[`<rect width="14" height="10" fill="#1f6fd1" opacity=".55"/>`, L.g5], [`<rect width="14" height="10" fill="none" stroke="#1f6fd1" stroke-dasharray="3 2"/>`, L.planned], [`<rect width="14" height="10" fill="#cfe8cf"/>`, L.g4], [`<rect width="14" height="10" fill="url(#hatch)"/>`, L.limited], [`<line x1="0" y1="5" x2="14" y2="5" stroke="#c0392b" stroke-width="2.4" stroke-dasharray="5 2"/>`, L.kagami], [`<line x1="0" y1="5" x2="14" y2="5" stroke="#7d3c98" stroke-width="2.4" stroke-dasharray="5 2"/>`, L.bayside]];
  s += `<rect x="0" y="420" width="660" height="52" fill="#fff"/>`;
  lg.forEach(([sym, t], i) => (s += `<g transform="translate(${16 + (i % 3) * 215},${430 + Math.floor(i / 3) * 20})">${sym}<text x="20" y="9.5" font-size="11" fill="${INK}">${esc(t)}</text></g>`));
  s += `<g transform="translate(600,330)"><path d="M0,-22 l6,14 h-12 z" fill="${INK}"/><text x="0" y="6" text-anchor="middle" font-size="11" font-weight="700" fill="${INK}">N</text></g>`;
  s += `<g transform="translate(520,392)"><line x1="0" y1="0" x2="80" y2="0" stroke="${INK}" stroke-width="2"/><line x1="0" y1="-4" x2="0" y2="4" stroke="${INK}"/><line x1="80" y1="-4" x2="80" y2="4" stroke="${INK}"/><text x="40" y="-6" text-anchor="middle" font-size="10" fill="${INK}">10 km</text></g>`;
  return `<svg role="img" aria-label="${esc(L.title)}" viewBox="0 0 660 472" width="660" height="472" class="map" ${FONT}>${s}</svg>`;
}

export function simDiagram(L) {
  let s = `<rect width="680" height="300" fill="#fff"/>`;
  // phone body (side view) with pin hole and tray slot
  s += `<rect x="230" y="70" width="420" height="46" rx="22" fill="#d9dee4" stroke="#8a96a3" stroke-width="1.5"/>`;
  s += `<rect x="330" y="84" width="150" height="18" rx="9" fill="#eef1f4" stroke="#8a96a3"/>`;
  s += `<circle cx="305" cy="93" r="4.5" fill="#55606c"/>`;
  // ejector pin, outside the phone, pointing at the hole
  s += `<path d="M112,93 L284,93" stroke="#7b8794" stroke-width="3" stroke-linecap="round"/><ellipse cx="98" cy="93" rx="16" ry="10" fill="none" stroke="#7b8794" stroke-width="3"/>`;
  s += `<path d="M262,80 l22,13 l-22,13" fill="none" stroke="#e8833a" stroke-width="2.4"/>`;
  // tray pulled out (top view)
  s += `<rect x="300" y="160" width="250" height="90" rx="12" fill="#eef1f4" stroke="#8a96a3" stroke-width="1.5"/>`;
  s += `<path d="M330,178 h96 v54 h-110 v-40 z" fill="#f7f9fb" stroke="#8a96a3" stroke-dasharray="4 3"/>`;
  s += `<path d="M338,184 h82 v42 h-96 v-28 z" fill="#f2c94c" stroke="#b8902a" stroke-width="1.5"/>`;
  s += `<rect x="352" y="194" width="44" height="24" rx="3" fill="#d6a730" stroke="#a37d1f"/><path d="M374,194 v24 M352,206 h44" stroke="#a37d1f"/>`;
  s += `<path d="M405,124 v26" stroke="#e8833a" stroke-width="2.2"/><path d="M399,144 l6,8 l6,-8" fill="none" stroke="#e8833a" stroke-width="2.2"/>`;
  const call = (n, x, y, tx, ty, t, left) => `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" stroke="#9aa5b1"/><circle cx="${tx}" cy="${ty}" r="10" fill="#0b5fa5"/><text x="${tx}" y="${ty + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${n}</text><text x="${left ? tx - 16 : tx + 16}" y="${ty + 4}" text-anchor="${left ? 'end' : 'start'}" font-size="12" fill="${INK}">${esc(t)}</text>`;
  s += call(1, 305, 93, 305, 36, L.hole);
  s += call(2, 150, 96, 150, 140, L.pin);
  s += call(3, 326, 190, 270, 190, L.notch, true);
  s += call(4, 362, 212, 270, 228, L.contacts, true);
  s += call(5, 540, 220, 580, 262, L.tray);
  s += `<text x="20" y="292" font-size="10.5" fill="${MUTED}">${esc(L.caption)}</text>`;
  return `<svg role="img" aria-label="${esc(L.title)}" viewBox="0 0 680 300" width="680" height="300" class="diagram" ${FONT}>${s}</svg>`;
}

// boxes in a row with arrows; labels may contain \n
export function flow(labels, o = {}) {
  const n = labels.length, bw = o.bw || 128, gap = 26, bh = o.bh || 78, w = n * bw + (n - 1) * gap + 8, h = bh + 12;
  let s = '';
  labels.forEach((t, i) => {
    const x = 4 + i * (bw + gap), last = i === n - 1;
    s += `<rect x="${x}" y="6" width="${bw}" height="${bh}" rx="8" fill="${last ? '#e8f4ec' : '#eef5fc'}" stroke="${last ? '#4f9a6a' : '#7aa7d6'}"/>`;
    s += `<circle cx="${x + 16}" cy="22" r="10" fill="${last ? '#3c8a58' : '#0b5fa5'}"/><text x="${x + 16}" y="26" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${i + 1}</text>`;
    String(t).split('\n').forEach((ln, j) => (s += `<text x="${x + bw / 2}" y="${48 + j * 15}" text-anchor="middle" font-size="12" fill="${INK}">${esc(ln)}</text>`));
    if (!last) s += `<path d="M${x + bw + 5},${6 + bh / 2} h${gap - 10}" stroke="#7b8794" stroke-width="2"/><path d="M${x + bw + gap - 9},${6 + bh / 2 - 5} l5,5 l-5,5" fill="none" stroke="#7b8794" stroke-width="2"/>`;
  });
  return `<svg role="img" aria-label="${esc(o.title || labels.join(' → ').replace(/\n/g, ' '))}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="diagram flow" ${FONT}>${s}</svg>`;
}

// annotated sample bill; L has head lines, item labels by key, and marks
export function sampleBill(L) {
  const w = 640, rowH = 22, top = 150, yen = L.fmt || yenFmt;
  const items = [...BILL.map(([k, v]) => [L.items[k], v]), null, [L.items.device, BILL_DEVICE]];
  const h = top + items.length * rowH + 110;
  let s = `<rect width="${w}" height="${h}" fill="#f4f6f8"/><rect x="40" y="14" width="${w - 80}" height="${h - 28}" fill="#fff" stroke="#c9d1d9"/>`;
  s += `<rect x="40" y="14" width="${w - 80}" height="40" fill="#0b5fa5"/><text x="60" y="40" font-size="15" font-weight="700" fill="#fff">${esc(L.heading)}</text>`;
  s += `<text x="${w - 60}" y="40" text-anchor="end" font-size="11" fill="#d7e6f5">${esc(L.period)}</text>`;
  L.meta.forEach((t, i) => (s += `<text x="60" y="${78 + i * 16}" font-size="11.5" fill="${INK}">${esc(t)}</text>`));
  s += `<text x="${w - 60}" y="86" text-anchor="end" font-size="11" fill="${MUTED}">${esc(L.totalLabel)}</text><text x="${w - 60}" y="114" text-anchor="end" font-size="24" font-weight="700" fill="${INK}">${yen(BILL_TOTAL)}</text>`;
  s += `<line x1="60" x2="${w - 60}" y1="${top - 12}" y2="${top - 12}" stroke="${INK}"/>`;
  items.forEach((it, i) => {
    const y = top + i * rowH;
    if (!it) { s += `<text x="60" y="${y + 6}" font-size="11" font-weight="700" fill="${MUTED}">${esc(L.otherHead)}</text>`; return; }
    s += `<text x="70" y="${y + 6}" font-size="12" fill="${INK}">${esc(it[0])}</text><text x="${w - 60}" y="${y + 6}" text-anchor="end" font-size="12" fill="${it[1] < 0 ? '#c0392b' : INK}">${yen(it[1])}</text>`;
    s += `<line x1="60" x2="${w - 60}" y1="${y + 12}" y2="${y + 12}" stroke="#eef1f4"/>`;
  });
  const yT = top + items.length * rowH + 10;
  s += `<line x1="60" x2="${w - 60}" y1="${yT}" y2="${yT}" stroke="${INK}"/><text x="70" y="${yT + 22}" font-size="12.5" font-weight="700" fill="${INK}">${esc(L.commLabel)}</text><text x="${w - 60}" y="${yT + 22}" text-anchor="end" font-size="12.5" font-weight="700" fill="${INK}">${yen(BILL_COMM)}</text>`;
  s += `<text x="70" y="${yT + 46}" font-size="12.5" font-weight="700" fill="${INK}">${esc(L.totalLabel)}</text><text x="${w - 60}" y="${yT + 46}" text-anchor="end" font-size="12.5" font-weight="700" fill="${INK}">${yen(BILL_TOTAL)}</text>`;
  s += `<text x="70" y="${yT + 72}" font-size="10.5" fill="${MUTED}">${esc(L.foot)}</text>`;
  // callouts: [n, y]
  const marks = [[1, 78], [2, 104], [3, top + 6], [4, top + rowH + 6], [5, top + 4 * rowH + 6], [6, top + 8 * rowH + 6], [7, top + 9 * rowH + 6], [8, top + 12 * rowH + 6], [9, yT + 46]];
  for (const [n, y] of marks) s += `<circle cx="22" cy="${y - 4}" r="10" fill="#e8833a"/><text x="22" y="${y}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${n}</text><line x1="32" y1="${y - 4}" x2="54" y2="${y - 4}" stroke="#e8833a" stroke-width="1.5"/>`;
  return `<svg role="img" aria-label="${esc(L.heading)}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="diagram" ${FONT}>${s}</svg>`;
}

// a phone showing an SMS (for the scam warning); plain HTML+CSS is enough
export const smsMock = (from, time, text) => `<div class="sms-mock"><div class="sms-top">${from}</div><div class="sms-time">${time}</div><div class="sms-bubble">${text}</div></div>`;
