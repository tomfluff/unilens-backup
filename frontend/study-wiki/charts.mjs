// SVG charts, route diagram, castle plan and locator maps for Openpedia. Used by build.mjs.
const FONT = `font-family="Arial, 'Helvetica Neue', 'Hiragino Sans', 'Noto Sans JP', Meiryo, sans-serif"`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ${FONT} font-size="11" fill="#202122">\n<rect width="${w}" height="${h}" fill="#fff"/>\n${body}\n</svg>\n`;
const txt = (x, y, s, a = '') => `<text x="${x}" y="${y}" ${a}>${esc(s)}</text>`;
const nf = (v) => v.toLocaleString('en-US');
const BLUE = '#3366cc', RED = '#dc3912', ORANGE = '#ff9900', GREEN = '#109618', GREY = '#a2a9b1';

// generic value axis with gridlines; returns {y(v), body}
function axis({ x0, x1, y0, y1, max, min = 0, step, fmt = nf, side = 'left', grid = true, color = '#54595d' }) {
  const y = (v) => y1 - ((v - min) / (max - min)) * (y1 - y0);
  let body = '';
  for (let v = min; v <= max + 1e-9; v += step) {
    const yy = y(v).toFixed(1);
    if (grid) body += `<line x1="${x0}" x2="${x1}" y1="${yy}" y2="${yy}" stroke="#eaecf0"/>`;
    body += side === 'left' ? txt(x0 - 6, +yy + 4, fmt(v), `text-anchor="end" fill="${color}"`) : txt(x1 + 6, +yy + 4, fmt(v), `fill="${color}"`);
  }
  return { y, body };
}
const frame = (x0, x1, y0, y1) => `<line x1="${x0}" x2="${x1}" y1="${y1}" y2="${y1}" stroke="#54595d"/><line x1="${x0}" x2="${x0}" y1="${y0}" y2="${y1}" stroke="#54595d"/>`;
const title = (w, s) => txt(w / 2, 20, s, 'text-anchor="middle" font-size="13" font-weight="bold"');
const legend = (x, y, items) => items.map(([c, label, kind], i) => {
  const xx = x + i * 0;
  const yy = y + i * 16;
  const mark = kind === 'line' ? `<line x1="${xx}" x2="${xx + 18}" y1="${yy - 4}" y2="${yy - 4}" stroke="${c}" stroke-width="2.5"/>` : `<rect x="${xx + 3}" y="${yy - 10}" width="12" height="10" fill="${c}"/>`;
  return mark + txt(xx + 24, yy, label);
}).join('');

function barChart({ lang, w = 520, h = 300, ttl, data, max, step, fmt = nf, color = BLUE, unit, zeroLabel, valueLabels = true, valueFmt = fmt }) {
  const x0 = 60, x1 = w - 20, y0 = 40, y1 = h - 40;
  const ax = axis({ x0, x1, y0, y1, max, step, fmt });
  const bw = (x1 - x0) / data.length;
  let bars = '';
  data.forEach(([label, v], i) => {
    const x = x0 + i * bw + bw * 0.18;
    const bwid = bw * 0.64;
    if (v === 0 && zeroLabel) { bars += txt(x + bwid / 2, y1 - 6, zeroLabel, `text-anchor="middle" font-size="9" fill="${RED}"`); }
    else {
      bars += `<rect x="${x.toFixed(1)}" y="${ax.y(v).toFixed(1)}" width="${bwid.toFixed(1)}" height="${(y1 - ax.y(v)).toFixed(1)}" fill="${color}"/>`;
      if (valueLabels) bars += txt(x + bwid / 2, ax.y(v) - 4, valueFmt(v), 'text-anchor="middle" font-size="9" fill="#54595d"');
    }
    bars += txt(x + bwid / 2, y1 + 15, label, 'text-anchor="middle" font-size="10"');
  });
  return svg(w, h, title(w, ttl) + ax.body + bars + frame(x0, x1, y0, y1) + (unit ? txt(14, (y0 + y1) / 2, unit, `transform="rotate(-90 14 ${(y0 + y1) / 2})" text-anchor="middle" fill="#54595d"`) : ''));
}

function lineChart({ w = 520, h = 300, ttl, data, max, min = 0, step, fmt = nf, color = BLUE, unit, xTicks, pointLabels = [] }) {
  const x0 = 70, x1 = w - 24, y0 = 40, y1 = h - 40;
  const ax = axis({ x0, x1, y0, y1, max, min, step, fmt });
  const xs = data.map((d) => d[0]);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const X = (v) => x0 + 10 + ((v - xmin) / (xmax - xmin)) * (x1 - x0 - 20);
  const pts = data.map(([xv, yv]) => `${X(xv).toFixed(1)},${ax.y(yv).toFixed(1)}`).join(' ');
  let body = ax.body;
  for (const t of xTicks) body += `<line x1="${X(t)}" x2="${X(t)}" y1="${y1}" y2="${y1 + 4}" stroke="#54595d"/>` + txt(X(t), y1 + 16, t, 'text-anchor="middle" font-size="10"');
  body += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.2"/>`;
  body += data.map(([xv, yv]) => `<circle cx="${X(xv).toFixed(1)}" cy="${ax.y(yv).toFixed(1)}" r="2.8" fill="${color}"/>`).join('');
  for (const [xv, label] of pointLabels) {
    const d = data.find((p) => p[0] === xv);
    body += txt(X(xv), ax.y(d[1]) - 9, label, 'text-anchor="middle" font-size="9.5" fill="#54595d"');
  }
  return svg(w, h, title(w, ttl) + body + frame(x0, x1, y0, y1) + (unit ? txt(14, (y0 + y1) / 2, unit, `transform="rotate(-90 14 ${(y0 + y1) / 2})" text-anchor="middle" fill="#54595d"`) : ''));
}

export const charts = {
  climate(lang, D) {
    const ja = lang === 'ja';
    const c = D.climate;
    const w = 560, h = 330, x0 = 54, x1 = w - 56, y0 = 40, y1 = h - 64;
    const tA = axis({ x0, x1, y0, y1, max: 35, min: 0, step: 5, fmt: (v) => v, color: RED });
    const pA = axis({ x0, x1, y0, y1, max: 350, min: 0, step: 50, fmt: (v) => v, side: 'right', grid: false, color: BLUE });
    const bw = (x1 - x0) / 12;
    const months = ja ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] : ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    let body = tA.body + pA.body;
    c.precip.forEach((v, i) => {
      body += `<rect x="${(x0 + i * bw + bw * 0.2).toFixed(1)}" y="${pA.y(v).toFixed(1)}" width="${(bw * 0.6).toFixed(1)}" height="${(y1 - pA.y(v)).toFixed(1)}" fill="#9fc0e8"/>`;
      body += txt(x0 + i * bw + bw / 2, y1 + 15, months[i], 'text-anchor="middle"');
    });
    const line = (arr, col, dash = '') => `<polyline points="${arr.map((v, i) => `${(x0 + i * bw + bw / 2).toFixed(1)},${tA.y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="2.2" ${dash}/>` + arr.map((v, i) => `<circle cx="${(x0 + i * bw + bw / 2).toFixed(1)}" cy="${tA.y(v).toFixed(1)}" r="2.4" fill="${col}"/>`).join('');
    body += line(c.high, RED) + line(c.mean, ORANGE) + line(c.low, '#7b3294');
    body += frame(x0, x1, y0, y1) + `<line x1="${x1}" x2="${x1}" y1="${y0}" y2="${y1}" stroke="#54595d"/>`;
    body += txt(14, (y0 + y1) / 2, '°C', `transform="rotate(-90 14 ${(y0 + y1) / 2})" text-anchor="middle" fill="${RED}"`);
    body += txt(w - 10, (y0 + y1) / 2, 'mm', `transform="rotate(90 ${w - 10} ${(y0 + y1) / 2})" text-anchor="middle" fill="${BLUE}"`);
    const lg = ja ? ['平均最高気温', '日平均気温', '平均最低気温', '降水量'] : ['Mean max.', 'Mean', 'Mean min.', 'Precipitation'];
    body += [[RED, lg[0], 'line'], [ORANGE, lg[1], 'line'], ['#7b3294', lg[2], 'line'], ['#9fc0e8', lg[3], 'bar']].map(([col, l, k], i) => {
      const lx = x0 + i * 115, ly = h - 18;
      return (k === 'line' ? `<line x1="${lx}" x2="${lx + 18}" y1="${ly - 4}" y2="${ly - 4}" stroke="${col}" stroke-width="2.5"/>` : `<rect x="${lx + 3}" y="${ly - 10}" width="12" height="10" fill="${col}"/>`) + txt(lx + 24, ly, l);
    }).join('');
    return svg(w, h, title(w, ja ? '春川の気温と降水量（1991〜2020年平年値）' : 'Harukawa: temperature and precipitation (1991–2020)') + body);
  },
  population(lang, D) {
    const ja = lang === 'ja';
    return lineChart({ ttl: ja ? '春川市の人口の推移（1889〜2025年）' : 'Population of Harukawa, 1889–2025', data: D.population, max: 450000, step: 50000, fmt: (v) => (ja ? (v ? `${v / 10000}万` : '0') : (v ? `${v / 1000}k` : '0')), xTicks: [1900, 1920, 1940, 1960, 1980, 2000, 2020], pointLabels: [[1955, ja ? '1954年 合併' : '1954 merger'], [2005, ja ? '最多 431,072' : 'Peak 431,072'], [1947, ja ? '戦後' : 'post-war']], unit: ja ? '人口' : 'Population' });
  },
  sectors(lang, D) {
    const ja = lang === 'ja';
    const rows = [...D.sectors.rows].sort((a, b) => b[2] - a[2]);
    const w = 540, h = 40 + rows.length * 26 + 30, x0 = 220, x1 = w - 50;
    const X = (v) => x0 + (v / 25) * (x1 - x0);
    let body = '';
    for (let v = 0; v <= 25; v += 5) body += `<line x1="${X(v)}" x2="${X(v)}" y1="34" y2="${h - 26}" stroke="#eaecf0"/>` + txt(X(v), h - 12, `${v}%`, 'text-anchor="middle" fill="#54595d"');
    rows.forEach(([en, j, pct], i) => {
      const y = 40 + i * 26;
      body += txt(x0 - 8, y + 14, ja ? j : en, 'text-anchor="end"');
      body += `<rect x="${x0}" y="${y + 2}" width="${(X(pct) - x0).toFixed(1)}" height="17" fill="${i === 0 ? '#1b4f9c' : BLUE}"/>` + txt(X(pct) + 5, y + 15, `${pct.toFixed(1)}%`, 'font-size="10" fill="#54595d"');
    });
    return svg(w, h, title(w, ja ? `市内総生産の産業別構成比（${D.sectors.year.ja}）` : `Gross city product by sector, ${D.sectors.year.en}`) + body + `<line x1="${x0}" x2="${x0}" y1="34" y2="${h - 26}" stroke="#54595d"/>`);
  },
  visitors(lang, D) {
    const ja = lang === 'ja';
    return barChart({ ttl: ja ? '春川市の観光入込客数（百万人）' : 'Tourist visitors to Harukawa (millions)', data: D.visitors, max: 7, step: 1, fmt: (v) => v, valueFmt: (v) => v.toFixed(1), color: GREEN });
  },
  festival(lang, D) {
    const ja = lang === 'ja';
    return barChart({ ttl: ja ? '春川灯籠まつりの来場者数（千人）' : 'Harukawa Lantern Festival attendance (thousands)', data: D.festival.map(([y, v]) => [String(y), v]), max: 450, step: 50, zeroLabel: ja ? '中止' : 'cancelled', color: ORANGE });
  },
  yuzu(lang, D) {
    const ja = lang === 'ja';
    return barChart({ ttl: ja ? 'みのり県のユズ収穫量（トン）' : 'Yuzu production in Minori Prefecture (tonnes)', data: D.yuzu.map(([y, v]) => [String(y), v]), max: 5000, step: 1000, color: '#e0b000', valueFmt: nf });
  },
  'ware-output'(lang, D) {
    const ja = lang === 'ja';
    return lineChart({ ttl: ja ? '春川焼の生産額（億円）' : 'Harukawa ware production value (¥ billion)', data: D.wareOutput.map(([y, v]) => [y, ja ? v * 10 : v]), max: ja ? 50 : 5, step: ja ? 10 : 1, fmt: (v) => v, xTicks: [1975, 1985, 1995, 2005, 2015, 2024], color: '#8c564b', pointLabels: [[1991, ja ? '46億円（1991年）' : '¥4.6 bn (1991)']] });
  },
  ridership(lang, D) {
    const ja = lang === 'ja';
    return barChart({ ttl: ja ? '春川鉄道の年間輸送人員（百万人、年度）' : 'Harukawa Railway passengers per year (millions, fiscal year)', data: D.ridership.map(([y, v]) => [ja ? `${y}` : `FY${String(y).slice(2)}`, v]), max: 25, step: 5, fmt: (v) => v, valueFmt: (v) => v.toFixed(1), color: '#1f6fb2' });
  },
  railmap(lang, D) {
    const ja = lang === 'ja';
    const w = 800, h = 330;
    const K = D.kagamiStations, B = D.baysideStations;
    const kx = (i) => 40 + i * 51, ky = 120;
    const bx = (i) => 40 + i * 60, by = 220;
    let body = title(w, ja ? '春川鉄道 路線図' : 'Harukawa Railway route map');
    body += `<polyline points="${kx(0)},${ky} ${kx(13)},${ky}" stroke="#1f6fb2" stroke-width="6" fill="none"/>`;
    body += `<polyline points="${bx(0)},${ky} ${bx(0)},${by} ${bx(8)},${by}" stroke="#2a9d8f" stroke-width="6" fill="none" stroke-linejoin="round"/>`;
    K.forEach((s, i) => {
      const tk = s[6];
      body += `<circle cx="${kx(i)}" cy="${ky}" r="${tk ? 7 : 5}" fill="#fff" stroke="${tk ? '#c99a06' : '#1f6fb2'}" stroke-width="${tk ? 3.5 : 2.5}" ${tk === 'nov' ? 'stroke-dasharray="3 2"' : ''}/>`;
      if (i) body += txt(kx(i) + 2, ky - 14, ja ? s[2] : s[1], `transform="rotate(-40 ${kx(i) + 2} ${ky - 14})" font-size="11"`);
      body += txt(kx(i), ky + 22, s[4].toFixed(1), 'text-anchor="middle" font-size="9" fill="#72777d"');
    });
    B.forEach((s, i) => {
      if (!i) return;
      body += `<circle cx="${bx(i)}" cy="${by}" r="5" fill="#fff" stroke="#2a9d8f" stroke-width="2.5"/>`;
      body += txt(bx(i) - 2, by + 16, ja ? s[2] : s[1], `transform="rotate(30 ${bx(i) - 2} ${by + 16})" font-size="11"`);
      body += txt(bx(i), by - 11, s[4].toFixed(1), 'text-anchor="middle" font-size="9" fill="#72777d"');
    });
    body += `<rect x="${kx(0) - 10}" y="${ky - 10}" width="20" height="20" rx="4" fill="#fff" stroke="#202122" stroke-width="2.5"/>`;
    body += txt(kx(0) + 12, ky + 40, ja ? '春川中央' : 'Harukawa Central', 'font-weight="bold" font-size="12"');
    body += txt(kx(13), ky + 40, ja ? '鏡線 38.6 km・14駅' : 'Kagami Line 38.6 km, 14 stations', 'text-anchor="end" fill="#1f6fb2" font-weight="bold"');
    body += txt(bx(8), by - 30, ja ? '湾岸線 16.2 km・9駅' : 'Bayside Line 16.2 km, 9 stations', 'text-anchor="end" fill="#2a9d8f" font-weight="bold"');
    body +=  `<circle cx="46" cy="${h - 22}" r="6" fill="#fff" stroke="#c99a06" stroke-width="3.5"/>` + txt(58, h - 18, ja ? '特急「月影」停車駅（点線は11月14日から）' : 'Tsukikage stop (dashed: from 14 Nov 2026)') + txt(40, h - 40, ja ? '数字は春川中央からのキロ程' : 'Figures: km from Harukawa Central', 'font-size="9.5" fill="#72777d"');
    return svg(w, h, body);
  },
  'castle-plan'(lang) {
    const ja = lang === 'ja';
    const w = 520, h = 380;
    const l = (en, j) => (ja ? j : en);
    let b = title(w, l('Plan of Harukawa Castle', '春川城 縄張り図'));
    // river and outer moat remnants
    b += `<path d="M0 40 C 30 120, 10 250, 40 380 L0 380 Z" fill="#cfe3f5"/>` + txt(14, 210, l('Kagami River', '鏡川'), 'transform="rotate(-80 14 210)" fill="#1f6fb2" font-size="11"');
    b += `<rect x="70" y="36" width="440" height="334" fill="#f3efe4" stroke="#b9ad8f"/>` + txt(500, 360, l('Sannomaru', '三の丸'), 'text-anchor="end" fill="#8a7d5c" font-weight="bold"');
    b += `<rect x="140" y="44" width="300" height="12" fill="#9fc6ea"/>` + txt(290, 70, l('Outer moat (surviving 600 m)', '外堀（現存600 m）'), 'text-anchor="middle" font-size="9.5" fill="#1f6fb2"');
    // west moat + ninomaru ring
    b += `<rect x="96" y="84" width="44" height="262" fill="#9fc6ea"/>` + txt(118, 220, l('West Moat (64 m)', '西堀（幅64 m）'), 'transform="rotate(-90 118 220)" text-anchor="middle" fill="#1f4f8a" font-size="10"');
    b += `<rect x="140" y="84" width="320" height="262" fill="#9fc6ea"/>`;
    b += `<rect x="150" y="94" width="300" height="242" fill="#e9e2cc" stroke="#8a7d5c" stroke-width="2"/>` + txt(440, 328, l('Ninomaru', '二の丸'), 'text-anchor="end" fill="#6b5f40" font-weight="bold"');
    // inner moat + honmaru
    b += `<rect x="190" y="120" width="190" height="150" fill="#9fc6ea"/>`;
    b += `<rect x="200" y="130" width="170" height="130" fill="#d8cfb0" stroke="#5b5035" stroke-width="2.5"/>` + txt(285, 250, l('Honmaru', '本丸'), 'text-anchor="middle" fill="#4a4128" font-weight="bold"');
    b += `<path d="M200 130 L240 130 M200 130 L200 170" stroke="#3a3020" stroke-width="6"/>` + txt(204, 116, l('Byōbu Wall (21 m)', '屏風石垣（21 m）'), 'font-size="9.5"');
    b += `<rect x="226" y="148" width="40" height="36" fill="#fff" stroke="#202122" stroke-width="2"/>` + txt(246, 200, l('Keep (1966)', '天守（1966年）'), 'text-anchor="middle" font-size="10" font-weight="bold"');
    b += `<rect x="352" y="244" width="18" height="16" fill="#c0392b"/>` + txt(392, 288, l('Tatsumi Turret (1609)', '巽櫓（1609年）'), 'text-anchor="middle" font-size="10" fill="#c0392b" font-weight="bold"');
    b += `<rect x="290" y="326" width="28" height="20" fill="#c0392b"/>` + txt(304, 362, l('Sagimai Gate (1757)', '鷺舞門（1757年）'), 'text-anchor="middle" font-size="10" fill="#c0392b" font-weight="bold"');
    b += `<rect x="168" y="290" width="70" height="30" fill="none" stroke="#8a7d5c" stroke-dasharray="4 3"/>` + txt(203, 309, l('Domain kiln site', '藩窯跡'), 'text-anchor="middle" font-size="9.5"');
    b += `<rect x="390" y="110" width="50" height="40" fill="none" stroke="#8a7d5c" stroke-dasharray="4 3"/>` + txt(415, 134, l('Palace site', '御殿跡'), 'text-anchor="middle" font-size="9.5"');
    b += `<rect x="76" y="352" width="60" height="14" fill="#7f8c8d"/>` + txt(160, 336, l('Museum of Art', '県立美術館'), 'text-anchor="middle" font-size="9.5"') + `<path d="M140 340 L112 352" stroke="#7f8c8d"/>`;
    b += `<path d="M490 70 L490 50 M484 58 L490 48 L496 58" stroke="#202122" stroke-width="1.5" fill="none"/>` + txt(490, 84, 'N', 'text-anchor="middle" font-weight="bold"');
    b += txt(80, h - 4, l('Red: surviving original buildings', '赤：現存建造物'), 'font-size="9" fill="#c0392b"');
    return svg(w, h, b);
  },
};

// ---------- locator map of Minori Prefecture ----------
export const MAP_PLACES = ['prefecture', 'harukawa', 'mount-tsukimi', 'tsukimi-onsen', 'suyama', 'minori-port', 'kagami-river', 'minori-bay'];
const LAND = '40,200 58,128 108,72 170,40 240,30 300,52 350,88 376,150 362,210 332,252 302,290 276,318 263,302 250,284 236,270 226,262 214,266 204,272 190,290 172,314 150,302 120,282 82,264 50,236';
const BAY = '226,262 236,270 250,284 263,302 276,318 240,330 172,314 190,290 204,272 214,266';
const RIVER = 'M302,116 C292,128 286,140 287,160 C285,172 280,178 276,186 C270,196 266,202 262,206 C256,216 250,224 246,232 C242,240 238,246 234,252 C231,256 228,259 226,262';
const PLACES = {
  harukawa: [226, 260], 'mount-tsukimi': [304, 132], 'tsukimi-onsen': [287, 160], suyama: [238, 246], 'minori-port': [272, 312],
};
const CITIES = [
  ['Kitano', '北野', 252, 82], ['Nishiura', '西浦', 182, 272], ['Takasu', '高須', 92, 204], ['Hiwada', '日和田', 196, 92], ['Funao', '船尾', 332, 230],
  ['Ishiba', '石場', 344, 168], ['Okitsu', '沖津', 150, 290], ['Nakasato', '中里', 118, 146],
];
export function maps(place, lang) {
  const ja = lang === 'ja';
  const w = 400, h = 350;
  let b = `<rect width="${w}" height="${h}" fill="#d4e6f7"/>`;
  b += `<polygon points="${LAND}" fill="#f7f3e8" stroke="#8a8a7a" stroke-width="1.5"/>`;
  b += `<polygon points="${BAY}" fill="${place === 'minori-bay' ? '#7fb2e5' : '#d4e6f7'}" stroke="none"/>`;
  // surrounding land (neighbouring prefectures) hint
  b += `<path d="M0,0 L400,0 L400,60 L350,88 L300,52 L240,30 L170,40 L108,72 L58,128 L40,200 L0,210 Z" fill="#ececec" stroke="#b5b5b5"/>`;
  b += `<path d="M400,60 L350,88 L376,150 L362,210 L332,252 L400,260 Z" fill="#ececec" stroke="#b5b5b5"/>`;
  b += `<path d="M0,210 L40,200 L50,236 L0,250 Z" fill="#ececec" stroke="#b5b5b5"/>`;
  // relief: Mount Tsukimi and Mount Hiwada
  b += `<path d="M292,140 L304,120 L316,140 Z" fill="#b8a98a"/><path d="M190,74 L202,52 L214,74 Z" fill="#b8a98a"/>`;
  b += txt(218, 58, ja ? '日和田山 1,477 m' : 'Mt Hiwada 1,477 m', 'font-size="12" fill="#6b5f40"');
  b += txt(ja ? 300 : 280, 112, ja ? '月見山 1,214 m' : 'Mt Tsukimi 1,214 m', 'font-size="12" fill="#6b5f40"');
  // rivers
  b += `<path d="M262,206 C255,180 248,150 238,110" fill="none" stroke="#5b9bd5" stroke-width="1.4"/>`;
  b += `<path d="${RIVER}" fill="none" stroke="${place === 'kagami-river' ? '#0b5cad' : '#5b9bd5'}" stroke-width="${place === 'kagami-river' ? 4 : 2}"/>`;
  b += txt(268, 222, ja ? '鏡川' : 'Kagami R.', `font-size="12" font-style="italic" fill="#1f6fb2" ${place === 'kagami-river' ? 'font-weight="bold"' : ''}`);
  // islands
  b += `<ellipse cx="222" cy="306" rx="11" ry="5" fill="#f7f3e8" stroke="#8a8a7a"/><ellipse cx="246" cy="296" rx="4" ry="2.5" fill="#f7f3e8" stroke="#8a8a7a"/>`;
  b += txt(212, 324, ja ? '霞島' : 'Kasumi I.', 'font-size="11" fill="#54595d"');
  b += txt(206, 345, ja ? 'みのり湾' : 'Minori Bay', `font-size="13" font-style="italic" fill="#1f4f8a" ${place === 'minori-bay' ? 'font-weight="bold"' : ''}`);
  // railways
  b += `<path d="M226,260 L238,246 L250,226 L262,206 L276,186 L287,162" fill="none" stroke="#202122" stroke-width="1.6" stroke-dasharray="5 2"/>`;
  b += `<path d="M226,260 L240,272 L254,288 L264,302 L272,312" fill="none" stroke="#202122" stroke-width="1.6" stroke-dasharray="5 2"/>`;
  // towns
  for (const [en, j, x, y] of CITIES) b += `<circle cx="${x}" cy="${y}" r="2.6" fill="#54595d"/>` + txt(x + 5, y + 4, ja ? j : en, 'font-size="12" fill="#54595d"');
  b += `<circle cx="226" cy="260" r="4" fill="#202122"/>` + txt(ja ? 112 : 100, 250, ja ? '春川（県庁所在地）' : 'Harukawa (capital)', 'font-size="13" font-weight="bold"');
  b += `<circle cx="287" cy="160" r="2.6" fill="#54595d"/>` + txt(ja ? 232 : 200, 166, ja ? '月見温泉' : 'Tsukimi Onsen', 'font-size="12" fill="#54595d"');
  // marker
  if (PLACES[place]) {
    const [x, y] = PLACES[place];
    b += `<circle cx="${x}" cy="${y}" r="7" fill="#d33" stroke="#fff" stroke-width="2"/>`;
  }
  // scale and north arrow
  b += `<line x1="20" y1="330" x2="78" y2="330" stroke="#202122" stroke-width="2"/><line x1="20" y1="326" x2="20" y2="334" stroke="#202122"/><line x1="78" y1="326" x2="78" y2="334" stroke="#202122"/>` + txt(20, 322, '0', 'font-size="9"') + txt(66, 322, '20 km', 'font-size="9"');
  b += `<path d="M380,320 L380,296 M374,304 L380,292 L386,304" stroke="#202122" stroke-width="1.5" fill="none"/>` + txt(380, 334, 'N', 'text-anchor="middle" font-weight="bold" font-size="10"');
  b += txt(66, 112, ja ? 'みのり県' : 'MINORI', 'font-size="16" letter-spacing="2" fill="#8a7d5c"');
  return svg(w, h, b);
}
