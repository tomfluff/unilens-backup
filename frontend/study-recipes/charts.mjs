// SVG charts and diagrams for build.mjs. Each function returns an SVG string.
const FONT = `font-family="Helvetica, Arial, 'Hiragino Sans', 'Yu Gothic', Meiryo, sans-serif"`;
const C = { red: '#c8553d', mustard: '#e0a526', green: '#6b8f4e', ink: '#3d3a35', grey: '#8a847b', light: '#ece6dc', cream: '#faf6ef' };
const svg = (w, h, inner, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ${FONT} ${extra}><rect width="${w}" height="${h}" fill="#fff"/>${inner}</svg>\n`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (x, y, s, a = '') => `<text x="${x}" y="${y}" ${a}>${esc(s)}</text>`;

export function riceWater(data, lang) {
  const W = 680, H = 380, L = 56, B = 300, T = 60, max = 300, bw = 62, gap = (W - L - 20 - data.length * bw) / data.length;
  const y = (v) => B - ((B - T) * v) / max;
  let g = text(L, 30, lang === 'ja' ? '米1合（180ml）に対する水の量' : 'Water for 1 gō (180 ml) of rice', `font-size="17" font-weight="bold" fill="${C.ink}"`);
  for (let v = 0; v <= max; v += 50) g += `<line x1="${L}" x2="${W - 12}" y1="${y(v)}" y2="${y(v)}" stroke="${C.light}"/>` + text(L - 8, y(v) + 4, `${v}`, `font-size="11" fill="${C.grey}" text-anchor="end"`);
  g += text(14, T - 14, 'ml', `font-size="11" fill="${C.grey}"`);
  data.forEach((d, i) => {
    const x = L + gap / 2 + i * (bw + gap);
    g += `<rect x="${x}" y="${y(d.ml)}" width="${bw}" height="${B - y(d.ml)}" fill="${d.ml === 180 ? '#f0c86a' : C.mustard}" rx="3"/>` + text(x + bw / 2, y(d.ml) - 6, `${d.ml}`, `font-size="12" font-weight="bold" fill="${C.ink}" text-anchor="middle"`);
    g += text(x + bw / 2, B + 18, d[lang], `font-size="11.5" fill="${C.ink}" text-anchor="middle"`);
    g += text(x + bw / 2, B + 34, `×${(d.ml / 180).toFixed(2).replace(/0$/, '')}`, `font-size="11" fill="${C.grey}" text-anchor="middle"`);
  });
  g += `<line x1="${L}" x2="${W - 12}" y1="${y(180)}" y2="${y(180)}" stroke="${C.red}" stroke-dasharray="5 4" stroke-width="1.5"/>` + text(W - 14, y(180) - 6, lang === 'ja' ? '米 180ml（1合）' : 'rice 180 ml (1 gō)', `font-size="11" fill="${C.red}" text-anchor="end"`);
  g += `<line x1="${L}" x2="${W - 12}" y1="${B}" y2="${B}" stroke="${C.ink}"/>`;
  return svg(W, H, g);
}

export function cupWeights(data, lang) {
  const W = 680, row = 25, T = 50, L = 200, max = 350, H = T + data.length * row + 40, x = (v) => L + ((W - L - 60) * v) / max;
  let g = text(16, 28, lang === 'ja' ? 'USカップ1杯（240ml）の重さ' : 'Weight of 1 US cup (240 ml)', `font-size="17" font-weight="bold" fill="${C.ink}"`);
  for (let v = 0; v <= max; v += 50) g += `<line x1="${x(v)}" x2="${x(v)}" y1="${T - 6}" y2="${T + data.length * row}" stroke="${C.light}"/>` + text(x(v), T + data.length * row + 16, `${v} g`, `font-size="10.5" fill="${C.grey}" text-anchor="middle"`);
  data.forEach((d, i) => {
    const yy = T + i * row;
    g += text(L - 10, yy + 15, d[lang], `font-size="12.5" fill="${C.ink}" text-anchor="end"`);
    g += `<rect x="${L}" y="${yy + 3}" width="${x(d.g) - L}" height="${row - 8}" fill="${i % 2 ? C.red : '#d9775f'}" rx="2"/>` + text(x(d.g) + 6, yy + 15, `${d.g} g`, `font-size="12" font-weight="bold" fill="${C.ink}"`);
  });
  return svg(W, H, g);
}

export function ovenScale(lang) {
  const W = 760, H = 230, L = 40, R = 30, lo = 100, hi = 260, y0 = 110, x = (c) => L + ((W - L - R) * (c - lo)) / (hi - lo);
  const ja = lang === 'ja';
  let g = `<defs><linearGradient id="heat" x1="0" x2="1"><stop offset="0" stop-color="#9cc3d9"/><stop offset=".35" stop-color="#f3d27a"/><stop offset=".7" stop-color="#e8833a"/><stop offset="1" stop-color="#b8322a"/></linearGradient></defs>`;
  g += text(L, 26, ja ? 'オーブンの温度帯（ファンなし）' : 'Oven temperatures (conventional, no fan)', `font-size="17" font-weight="bold" fill="${C.ink}"`);
  const bands = ja ? [[100, 150, 'ごく低温〜低温'], [150, 175, 'やや低温'], [175, 195, '中温'], [195, 225, '高温'], [225, 260, 'ごく高温']] : [[100, 150, 'Very low – low'], [150, 175, 'Mod. low'], [175, 195, 'Moderate'], [195, 225, 'Hot'], [225, 260, 'Very hot']];
  for (const [a, b, l] of bands) g += `<line x1="${x(a)}" x2="${x(a)}" y1="${y0 - 26}" y2="${y0 + 22}" stroke="#fff" stroke-width="2"/>` + text((x(a) + x(b)) / 2, y0 - 32, l, `font-size="11" fill="${C.grey}" text-anchor="middle"`);
  g += `<rect x="${L}" y="${y0 - 20}" width="${W - L - R}" height="22" rx="11" fill="url(#heat)"/>`;
  for (let c = lo; c <= hi; c += 20) {
    g += `<line x1="${x(c)}" x2="${x(c)}" y1="${y0 + 2}" y2="${y0 + 9}" stroke="${C.ink}"/>` + text(x(c), y0 + 22, `${c}°C`, `font-size="11" fill="${C.ink}" text-anchor="middle"`) + text(x(c), y0 + 36, `${Math.round(c * 1.8 + 32)}°F`, `font-size="10" fill="${C.grey}" text-anchor="middle"`);
  }
  const marks = ja ? [[160, 'かぼちゃプリン'], [170, 'パウンドケーキ'], [180, '食パン'], [200, '鮭のゆず味噌焼き'], [220, '鶏の天板焼き']] : [[160, 'Kabocha pudding'], [170, 'Pound cake'], [180, 'Milk bread'], [200, 'Yuzu miso salmon'], [220, 'Sheet-pan chicken']];
  marks.forEach(([c, l], i) => {
    const yy = y0 + 58 + (i % 3) * 18;
    g += `<line x1="${x(c)}" x2="${x(c)}" y1="${y0 + 40}" y2="${yy - 10}" stroke="${C.ink}" stroke-dasharray="2 2"/><circle cx="${x(c)}" cy="${y0 - 9}" r="4" fill="${C.ink}"/>` + text(x(c), yy, `${l} ${c}°C`, `font-size="11" fill="${C.ink}" text-anchor="middle" font-weight="bold"`);
  });
  return svg(W, H, g);
}

export function produceCalendar(items, lang) {
  const ja = lang === 'ja', L = 175, mw = 44, row = 22, T = 70, W = L + 12 * mw + 20, H = T + items.length * row + 50;
  const months = ja ? Array.from({ length: 12 }, (_, i) => `${i + 1}月`) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const spans = ([a, b]) => (a <= b ? [[a, b]] : [[a, 12], [1, b]]);
  let g = text(16, 28, ja ? 'みのり県の旬カレンダー' : 'Minori Prefecture seasonal calendar', `font-size="17" font-weight="bold" fill="${C.ink}"`);
  g += `<rect x="${W - 250}" y="16" width="16" height="10" fill="#f2dcc0"/>` + text(W - 228, 25, ja ? '出回る時期' : 'Available', `font-size="11" fill="${C.ink}"`) + `<rect x="${W - 140}" y="16" width="16" height="10" fill="${C.red}"/>` + text(W - 118, 25, ja ? '最盛期' : 'Peak', `font-size="11" fill="${C.ink}"`);
  months.forEach((m, i) => { g += text(L + i * mw + mw / 2, T - 10, m, `font-size="11" fill="${C.grey}" text-anchor="middle"`) + `<line x1="${L + i * mw}" x2="${L + i * mw}" y1="${T - 4}" y2="${T + items.length * row}" stroke="${C.light}"/>`; });
  items.forEach(([en, jaName, avail, peak], i) => {
    const yy = T + i * row;
    if (i % 2) g += `<rect x="0" y="${yy}" width="${W}" height="${row}" fill="${C.cream}"/>`;
    g += text(L - 10, yy + 15, ja ? jaName : en, `font-size="12" fill="${C.ink}" text-anchor="end"`);
    for (const [a, b] of spans(avail)) g += `<rect x="${L + (a - 1) * mw + 2}" y="${yy + 5}" width="${(b - a + 1) * mw - 4}" height="${row - 10}" rx="5" fill="#f2dcc0"/>`;
    for (const [a, b] of spans(peak)) g += `<rect x="${L + (a - 1) * mw + 2}" y="${yy + 5}" width="${(b - a + 1) * mw - 4}" height="${row - 10}" rx="5" fill="${C.red}"/>`;
  });
  const now = L + 9.15 * mw;
  g += `<line x1="${now}" x2="${now}" y1="${T - 4}" y2="${T + items.length * row + 6}" stroke="${C.ink}" stroke-width="2"/>` + text(now, T + items.length * row + 22, ja ? '今（10月上旬）' : 'Now (early October)', `font-size="11" fill="${C.ink}" text-anchor="middle" font-weight="bold"`);
  return svg(W, H, g);
}

export function dashiTimeline(lang) {
  const ja = lang === 'ja', W = 700, H = 340, L = 50, R = 70, T = 70, B = 270, x = (m) => L + ((W - L - R) * m) / 46, y = (c) => B - ((B - T) * c) / 100;
  let g = text(16, 28, ja ? '合わせだしの温度と時間の目安（水1L）' : 'Awase dashi: temperature over time (1 litre)', `font-size="17" font-weight="bold" fill="${C.ink}"`);
  const phases = ja ? [[0, 30, '昆布を水につける'], [30, 42, '弱めの中火'], [42, 44, '2分おく'], [44, 46, 'こす']] : [[0, 30, 'Soak the kombu'], [30, 42, 'Heat gently'], [42, 44, 'Steep 2 min'], [44, 46, 'Strain']];
  phases.forEach(([a, b, l], i) => { g += `<rect x="${x(a)}" y="${T}" width="${x(b) - x(a)}" height="${B - T}" fill="${i % 2 ? '#fdf3e2' : '#f6f1e8'}"/>` + (b - a > 5 ? text((x(a) + x(b)) / 2, B - 10, l, `font-size="11" fill="${C.grey}" text-anchor="middle"`) : ''); });
  for (let c = 0; c <= 100; c += 20) g += `<line x1="${L}" x2="${W - R}" y1="${y(c)}" y2="${y(c)}" stroke="${C.light}"/>` + text(L - 6, y(c) + 4, `${c}°C`, `font-size="10.5" fill="${C.grey}" text-anchor="end"`);
  for (let m = 0; m <= 45; m += 5) g += text(x(m), B + 16, `${m}`, `font-size="10.5" fill="${C.grey}" text-anchor="middle"`);
  g += text((L + W - R) / 2, B + 34, ja ? '経過時間（分）' : 'Minutes', `font-size="11" fill="${C.grey}" text-anchor="middle"`);
  const pts = [[0, 20], [30, 20], [33, 38], [36, 58], [40, 90], [42, 100], [43, 96], [44, 93], [46, 88]];
  g += `<polyline points="${pts.map(([m, c]) => `${x(m)},${y(c)}`).join(' ')}" fill="none" stroke="${C.red}" stroke-width="3" stroke-linejoin="round"/>`;
  const notes = ja
    ? [[40, 90, '約90℃：昆布を取り出す', -10, 5, 'end'], [42, 100, '沸騰：かつお節20gを入れて火を止める', -10, -8, 'end'], [44, 93, 'こす（しぼらない）', 0, 36, 'middle']]
    : [[40, 90, '~90°C: take out the kombu', -10, 5, 'end'], [42, 100, 'Boil: add 20 g katsuobushi, heat off', -10, -8, 'end'], [44, 93, 'Strain, do not squeeze', 0, 36, 'middle']];
  for (const [m, c, l, dx, dy, anchor] of notes) g += `<circle cx="${x(m)}" cy="${y(c)}" r="5" fill="${C.ink}"/>` + text(x(m) + dx, y(c) + dy, l, `font-size="11.5" fill="${C.ink}" font-weight="bold" text-anchor="${anchor}"`);
  return svg(W, H, g);
}

export function macros(n, lang) {
  const ja = lang === 'ja';
  const parts = [[n.carbs * 4, ja ? '炭水化物' : 'Carbs', C.mustard, n.carbs], [n.protein * 4, ja ? 'たんぱく質' : 'Protein', C.green, n.protein], [n.fat * 9, ja ? '脂質' : 'Fat', C.red, n.fat]];
  const total = parts.reduce((s, p) => s + p[0], 0) || 1;
  const cx = 95, cy = 100, r = 70, sw = 28, circ = 2 * Math.PI * r;
  let off = 0, g = '';
  for (const [v, , col] of parts) { const len = (v / total) * circ; g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"/>`; off += len; }
  g += text(cx, cy + 2, `${n.calories}`, `font-size="24" font-weight="bold" fill="${C.ink}" text-anchor="middle"`) + text(cx, cy + 20, 'kcal', `font-size="11" fill="${C.grey}" text-anchor="middle"`);
  parts.forEach(([v, l, col, grams], i) => { const yy = 62 + i * 30; g += `<rect x="190" y="${yy - 11}" width="14" height="14" rx="3" fill="${col}"/>` + text(212, yy, `${l} ${Math.round((v / total) * 100)}%`, `font-size="12.5" fill="${C.ink}"`) + text(212, yy + 14, `${grams} g`, `font-size="11" fill="${C.grey}"`); });
  return svg(320, 200, g);
}

// Knife-cut diagrams: the pieces each cut produces, on a cutting board.
export function cut(shape) {
  const W = 240, H = 150, o = '#e8833a', od = '#c9692a';
  let g = `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="12" fill="#ead6b4"/><rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="12" fill="none" stroke="#d4b98c" stroke-width="2"/>`;
  const rnd = (i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  switch (shape) {
    case 'rounds': for (let i = 0; i < 4; i++) { const x = 45 + i * 50; g += `<ellipse cx="${x}" cy="82" rx="22" ry="20" fill="${od}"/><ellipse cx="${x}" cy="75" rx="22" ry="20" fill="${o}"/><ellipse cx="${x}" cy="75" rx="9" ry="8" fill="#f2a066"/>`; } break;
    case 'halfmoons': for (let i = 0; i < 4; i++) { const x = 30 + i * 50; g += `<path d="M${x} 92 a22 22 0 0 1 44 0 z" fill="${od}" transform="translate(0 6)"/><path d="M${x} 92 a22 22 0 0 1 44 0 z" fill="${o}"/>`; } break;
    case 'quarters': for (let i = 0; i < 5; i++) { const x = 30 + i * 40; g += `<path d="M${x} 95 v-26 a26 26 0 0 1 26 26 z" fill="${od}" transform="translate(0 5)"/><path d="M${x} 95 v-26 a26 26 0 0 1 26 26 z" fill="${o}"/>`; } break;
    case 'rangiri': for (let i = 0; i < 6; i++) { const x = 40 + (i % 3) * 65, y = 50 + Math.floor(i / 3) * 50, a = rnd(i) * 360; g += `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-18 -10 L14 -16 L20 8 L-10 14 Z" fill="${o}"/><path d="M14 -16 L20 8 L10 4 Z" fill="${od}"/></g>`; } break;
    case 'wedges': for (let i = 0; i < 6; i++) { const x = 35 + i * 34; g += `<path d="M${x} 110 L${x - 14} 50 Q${x} 40 ${x + 14} 50 Z" fill="#f4ead6" stroke="#b79ab8" stroke-width="2"/><path d="M${x} 108 L${x - 7} 58 M${x} 108 L${x + 7} 58" stroke="#d8c3d6" stroke-width="1.5"/>`; } break;
    case 'julienne': for (let i = 0; i < 28; i++) { const x = 34 + rnd(i) * 116, y = 36 + rnd(i + 50) * 76, a = -20 + rnd(i + 99) * 40; g += `<rect x="${x}" y="${y}" width="56" height="3.5" rx="1.5" fill="${i % 3 ? o : od}" transform="rotate(${a} ${x + 28} ${y})"/>`; } break;
    case 'tanzaku': for (let i = 0; i < 8; i++) { const x = 28 + (i % 4) * 48, y = 32 + Math.floor(i / 4) * 52; g += `<rect x="${x + 3}" y="${y + 3}" width="36" height="14" fill="${od}"/><rect x="${x}" y="${y}" width="36" height="14" fill="${o}"/>`; } break;
    case 'dice': for (let i = 0; i < 9; i++) { const x = 50 + (i % 3) * 55, y = 40 + Math.floor(i / 3) * 34; g += `<path d="M${x} ${y} l12 -7 l12 7 l-12 7 z" fill="#f4a36b"/><path d="M${x} ${y} v14 l12 7 v-14 z" fill="${o}"/><path d="M${x + 24} ${y} v14 l-12 7 v-14 z" fill="${od}"/>`; } break;
    case 'mince': for (let i = 0; i < 90; i++) { const x = 40 + rnd(i) * 160, y = 35 + rnd(i + 200) * 80; g += `<rect x="${x}" y="${y}" width="4" height="4" fill="#f6f0e2" stroke="#cfc3a6" stroke-width=".8" transform="rotate(${rnd(i + 7) * 90} ${x + 2} ${y + 2})"/>`; } break;
    case 'diagonal': for (let i = 0; i < 6; i++) { const x = 40 + i * 32; g += `<ellipse cx="${x}" cy="75" rx="11" ry="26" fill="#eef3dc" stroke="#9cb36b" stroke-width="2" transform="rotate(35 ${x} 75)"/><ellipse cx="${x}" cy="75" rx="5" ry="15" fill="none" stroke="#c4d49a" stroke-width="1.5" transform="rotate(35 ${x} 75)"/>`; } break;
    case 'rings': for (let i = 0; i < 30; i++) { const x = 40 + rnd(i) * 160, y = 35 + rnd(i + 300) * 80; g += `<circle cx="${x}" cy="${y}" r="6" fill="#e3efc9" stroke="#5f8f3a" stroke-width="2.5"/>`; } break;
    case 'shavings': for (let i = 0; i < 16; i++) { const x = 40 + rnd(i) * 150, y = 35 + rnd(i + 400) * 75, a = rnd(i + 8) * 180; g += `<path d="M0 0 Q18 -6 36 0 Q18 4 0 0 Z" fill="#cdb58f" stroke="#8a6a44" stroke-width="1" transform="translate(${x} ${y}) rotate(${a})"/>`; } break;
  }
  return svg(W, H, g);
}

// Inline chart on the meal-plan page, with a text alternative (unlike the image charts).
export function planChart(days, lang) {
  const ja = lang === 'ja', W = 640, H = 230, L = 50, B = 180, T = 40, max = 80, bw = 48, step = (W - L - 20) / days.length, y = (v) => B - ((B - T) * v) / max;
  const title = ja ? '1日の調理時間（分）' : 'Active cooking time per day (minutes)';
  let g = text(16, 24, title, `font-size="15" font-weight="bold" fill="${C.ink}"`);
  for (let v = 0; v <= max; v += 20) g += `<line x1="${L}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}" stroke="${C.light}"/>` + text(L - 6, y(v) + 4, `${v}`, `font-size="10.5" fill="${C.grey}" text-anchor="end"`);
  days.forEach((d, i) => { const x = L + i * step + (step - bw) / 2; g += `<rect x="${x}" y="${y(d.active)}" width="${bw}" height="${B - y(d.active)}" rx="3" fill="${d.active > 40 ? C.red : C.green}"/>` + text(x + bw / 2, y(d.active) - 5, `${d.active}`, `font-size="11" font-weight="bold" fill="${C.ink}" text-anchor="middle"`) + text(x + bw / 2, B + 16, d.day[lang].replace(/ Oct|（.）/, ''), `font-size="11" fill="${C.ink}" text-anchor="middle"`); });
  const desc = days.map((d) => `${d.day[lang]}: ${d.active}`).join(', ');
  return `<figure class="chart inline-chart"><svg role="img" aria-label="${title}. ${desc}" viewBox="0 0 ${W} ${H}" width="100%" ${FONT}><title>${title}</title>${g}</svg></figure>`;
}
