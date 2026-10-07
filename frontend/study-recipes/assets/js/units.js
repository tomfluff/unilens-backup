// Ingredient units and amount formatting, shared by build.mjs (the HTML it writes)
// and recipe.js (the servings scaler and the Metric/US switch), so both print the same.

// en: label or [singular, plural]; ja: label; pre: the Japanese label goes before the number.
export const UNITS = {
  g: { en: 'g', ja: 'g' },
  kg: { en: 'kg', ja: 'kg' },
  ml: { en: 'ml', ja: 'ml' },
  l: { en: 'L', ja: 'L' },
  tsp: { en: 'tsp', ja: '小さじ', pre: true },
  tbsp: { en: 'tbsp', ja: '大さじ', pre: true },
  cup: { en: ['cup', 'cups'], ja: 'USカップ', pre: true },
  oz: { en: 'oz', ja: 'オンス' },
  lb: { en: 'lb', ja: 'ポンド' },
  cm: { en: 'cm', ja: 'cm' },
  in: { en: 'in', ja: 'インチ' },
  pc: { en: '', ja: '個' },
  clove: { en: ['clove', 'cloves'], ja: 'かけ' },
  sheet: { en: ['sheet', 'sheets'], ja: '枚' },
  slice: { en: ['slice', 'slices'], ja: '枚' },
  fillet: { en: ['fillet', 'fillets'], ja: '切れ' },
  stalk: { en: ['stalk', 'stalks'], ja: '本' },
  leaf: { en: ['leaf', 'leaves'], ja: '枚' },
  pack: { en: ['pack', 'packs'], ja: 'パック' },
  block: { en: ['block', 'blocks'], ja: '丁' },
  can: { en: ['can', 'cans'], ja: '缶' },
  bunch: { en: ['bunch', 'bunches'], ja: '束' },
  pinch: { en: ['pinch', 'pinches'], ja: 'つまみ' },
};

// Units a recipe may use on the metric side; the rest only appear after conversion.
export const METRIC_UNITS = Object.keys(UNITS).filter((u) => !['cup', 'oz', 'lb', 'in'].includes(u));

const FRACS = [[0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'], [1, '']];
const JA_FRACS = { '⅛': '1/8', '¼': '1/4', '⅓': '1/3', '⅜': '3/8', '½': '1/2', '⅝': '5/8', '⅔': '2/3', '¾': '3/4', '⅞': '7/8' };

// 1.5 -> "1½" (en) or "1と1/2" (ja), to the nearest eighth or third.
export function fraction(n, lang) {
  let whole = Math.floor(n);
  let best = FRACS[0];
  for (const f of FRACS) if (Math.abs(n - whole - f[0]) < Math.abs(n - whole - best[0])) best = f;
  if (best[0] === 1) { whole += 1; best = FRACS[0]; }
  const sym = best[1];
  if (!sym) return whole === 0 && n > 0 ? (lang === 'ja' ? '1/8' : '⅛') : String(whole);
  if (lang === 'ja') return whole ? `${whole}と${JA_FRACS[sym]}` : JA_FRACS[sym];
  return whole ? `${whole}${sym}` : sym;
}

function decimal(n, unit) {
  if (unit === 'g' || unit === 'ml') {
    if (n < 10) return String(Math.round(n * 2) / 2);
    if (n < 100) return String(Math.round(n));
    return String(Math.round(n / 5) * 5);
  }
  if (unit === 'kg' || unit === 'l') return String(Math.round(n * 100) / 100);
  if (unit === 'cm') return String(Math.round(n * 2) / 2);
  return null; // spoon, cup, imperial and count units use fractions
}

export function number(n, unit, lang) {
  return decimal(n, unit) ?? fraction(n, lang);
}

// Metric amount -> US customary amount. Spoons and counts stay as they are.
export function toUS(q, u) {
  switch (u) {
    case 'g': return q >= 453.6 ? [q / 453.6, 'lb'] : [q / 28.35, 'oz'];
    case 'kg': return [q * 2.2046, 'lb'];
    case 'ml': return q < 15 ? [q / 5, 'tsp'] : q < 60 ? [q / 15, 'tbsp'] : [q / 240, 'cup'];
    case 'l': return [q * 1000 / 240, 'cup'];
    case 'cm': return [q / 2.54, 'in'];
    default: return [q, u];
  }
}

function roundUS(q, u) {
  if (u === 'oz') return q < 4 ? Math.round(q * 4) / 4 : Math.round(q * 2) / 2;
  return q;
}

function label(u, n, lang, jaU) {
  const d = UNITS[u];
  if (lang === 'ja') return jaU && !['cup', 'oz', 'lb', 'in'].includes(u) ? jaU : d.ja;
  return Array.isArray(d.en) ? d.en[n > 1 ? 1 : 0] : d.en;
}

// The amount text of one ingredient, e.g. "2 tbsp" / "大さじ2" / "10½ oz" / "" (no amount).
// item: { q, q2?, u, us?: [q, u], jaU?, free?: {en, ja} }; mode: 'metric' | 'us'; factor: servings multiplier.
export function amount(item, lang, mode = 'metric', factor = 1) {
  if (item.q == null) return item.free ? item.free[lang] : '';
  let q = item.q * factor;
  let q2 = item.q2 != null ? item.q2 * factor : null;
  let u = item.u;
  if (mode === 'us') {
    if (item.us) {
      const r = item.us[0] / item.q;
      [q, u] = [q * r, item.us[1]];
      if (q2 != null) q2 *= r;
    } else {
      const from = u;
      [q, u] = toUS(q, from);
      if (q2 != null) q2 = toUS(q2, from)[0];
    }
    q = roundUS(q, u);
    if (q2 != null) q2 = roundUS(q2, u);
  }
  if (u === 'pinch' && lang === 'ja') return q <= 1 ? 'ひとつまみ' : `${number(q, u, lang)}つまみ`;
  const num = number(q, u, lang) + (q2 != null ? (lang === 'ja' ? '〜' : '–') + number(q2, u, lang) : '');
  const lab = label(u, q2 ?? q, lang, item.jaU);
  if (lang === 'ja') return UNITS[u].pre ? `${lab}${num}` : `${num}${lab}`;
  return lab ? `${num} ${lab}` : num;
}

// Minutes -> "1 hr 5 mins" / "1時間5分"; days or weeks for long waits ("7 days 30 mins").
export function duration(min, lang) {
  const ja = lang === 'ja';
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  const parts = [];
  if (d && d % 7 === 0 && !h && !m) return ja ? `${d / 7}週間` : `${d / 7} week${d > 7 ? 's' : ''}`;
  if (d) parts.push(ja ? `${d}日` : `${d} day${d > 1 ? 's' : ''}`);
  if (h) parts.push(ja ? `${h}時間` : `${h} hr${h > 1 ? 's' : ''}`);
  if (m || !parts.length) parts.push(ja ? `${m}分` : `${m} min${m === 1 ? '' : 's'}`);
  return parts.join(ja ? '' : ' ');
}
