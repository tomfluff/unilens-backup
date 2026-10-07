// Checks recipe content files against the schema in README.md.
// Used by build.mjs; also runs alone: `node check.mjs [slug ...]` (no slug = every recipe).
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { METRIC_UNITS, UNITS, amount } from './assets/js/units.js';

const DIR = new URL('./content/recipes/', import.meta.url);
export const SLUGS = ['nikujaga', 'chicken-karaage', 'tamagoyaki', 'saba-misoni', 'kinoko-takikomi-gohan', 'agedashi-tofu',
  'minato-nabe', 'yuzu-miso-salmon', 'yuzu-kosho', 'chochin-dango', 'daigaku-imo',
  'hamburg-steak', 'beef-stew', 'kabocha-soup', 'ginger-pork', 'oyakodon', 'wafu-mushroom-pasta',
  'sheet-pan-miso-chicken', 'milk-bread', 'yuzu-pound-cake', 'kabocha-pudding', 'autumn-vegetable-curry'];
export const GUIDES = ['knife-cuts', 'measurement-conversions', 'oven-temperatures', 'rice-water-ratios', 'seasonal-produce', 'pantry-staples', 'dashi'];
export const CATEGORIES = ['japanese', 'harukawa', 'western', 'weeknight', 'baking', 'vegetarian'];
const CUISINES = ['japanese', 'harukawa', 'western', 'fusion'];
const DIETS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'pescatarian'];
const COURSES = ['main', 'side', 'soup', 'rice', 'noodles', 'dessert', 'bread', 'snack', 'condiment'];
const NUTRITION = ['calories', 'carbs', 'protein', 'fat', 'satFat', 'cholesterol', 'sodium', 'fiber', 'sugar'];
const TEXT_KEYS = ['title', 'teaser', 'intro', 'equipment', 'notes', 'subs', 'makeAhead', 'storage'];

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\{\{[^}]+\}\}/g, '');
const blockText = (b) => (typeof b === 'string' ? b : b.h ?? (b.ul ?? []).join(' '));

export function checkRecipe(r, file) {
  const errs = [];
  const err = (m) => errs.push(`${file}: ${m}`);
  const isLang = (o) => o && typeof o.en === 'string' && typeof o.ja === 'string' && o.en && o.ja;
  if (file && r.slug + '.json' !== file) err(`slug "${r.slug}" does not match the file name`);
  if (!SLUGS.includes(r.slug)) err(`unknown slug ${r.slug}`);
  if (!r.categories?.length || r.categories.some((c) => !CATEGORIES.includes(c))) err('categories');
  if (!CUISINES.includes(r.cuisine)) err('cuisine');
  if (!Array.isArray(r.diet) || r.diet.some((d) => !DIETS.includes(d))) err('diet');
  if (!['easy', 'medium', 'hard'].includes(r.difficulty)) err('difficulty');
  if (!COURSES.includes(r.course)) err('course');
  const t = r.times ?? {};
  if (!Number.isFinite(t.prep) || !Number.isFinite(t.cook)) err('times.prep / times.cook');
  if (t.extra && !isLang(t.extraLabel)) err('times.extraLabel needed with times.extra');
  if (!Number.isFinite(r.servings) || r.servings <= 0) err('servings');
  if (r.servingsUnit && !isLang(r.servingsUnit)) err('servingsUnit');
  if (typeof r.image !== 'string') err('image');
  if (!(r.rating >= 1 && r.rating <= 5) || !Number.isInteger(r.ratings)) err('rating / ratings');
  for (const k of ['published', 'updated']) if (!/^\d{4}-\d\d-\d\d$/.test(r[k] ?? '')) err(k);
  if (!Array.isArray(r.related) || r.related.length < 3 || r.related.some((s) => !SLUGS.includes(s) || s === r.slug)) err('related: 3+ other known slugs');
  for (const lang of ['en', 'ja']) {
    const L = r[lang] ?? {};
    for (const k of TEXT_KEYS) if (L[k] == null || (Array.isArray(L[k]) && !L[k].length)) err(`${lang}.${k} missing`);
    if (!Array.isArray(L.intro)) continue;
    const text = strip(L.intro.map(blockText).join(' '));
    const n = lang === 'en' ? text.split(/\s+/).filter(Boolean).length : text.replace(/\s/g, '').length;
    const [lo, hi] = lang === 'en' ? [300, 600] : [700, 1700];
    if (n < lo || n > hi) err(`${lang}.intro is ${n} ${lang === 'en' ? 'words' : 'characters'}, want ${lo}–${hi}`);
    if (!Array.isArray(L.subs) || L.subs.some((p) => !Array.isArray(p) || p.length !== 2)) err(`${lang}.subs: [[from, to], ...]`);
  }
  if (!Array.isArray(r.ingredients) || !r.ingredients.length) err('ingredients');
  for (const g of r.ingredients ?? []) {
    if (g.group && !isLang(g.group)) err('ingredient group name needs en and ja');
    for (const it of g.items ?? []) {
      const where = `ingredient "${it.en}"`;
      if (!isLang(it)) err(`${where}: en and ja names`);
      if (it.q === null) { if (it.u) err(`${where}: no unit without a quantity`); continue; }
      if (!Number.isFinite(it.q) || !METRIC_UNITS.includes(it.u)) err(`${where}: q must be a number and u one of ${METRIC_UNITS.join(' ')}`);
      if (it.us && (!Number.isFinite(it.us[0]) || !UNITS[it.us[1]])) err(`${where}: us must be [number, unit]`);
      try { for (const l of ['en', 'ja']) for (const m of ['metric', 'us']) amount(it, l, m, 1.5); } catch (e) { err(`${where}: ${e.message}`); }
    }
  }
  if (!Array.isArray(r.steps) || r.steps.length < 4) err('steps: at least 4');
  for (const [i, s] of (r.steps ?? []).entries()) {
    if (!isLang(s)) err(`step ${i + 1}: en and ja`);
    if (s.timer != null && !(s.timer > 0)) err(`step ${i + 1}: timer is minutes > 0`);
  }
  if (NUTRITION.some((k) => !Number.isFinite(r.nutrition?.[k]))) err(`nutrition needs ${NUTRITION.join(', ')}`);
  const cs = r.comments ?? [];
  if (cs.length < 5 || cs.length > 12) err(`comments: 5–12, has ${cs.length}`);
  if (cs.filter((c) => c.reply).length < 2) err('comments: at least 2 author replies');
  for (const [i, c] of cs.entries()) {
    if (!isLang(c) || !isLang(c.name)) err(`comment ${i + 1}: name {en, ja}, en, ja`);
    if (!/^\d{4}-\d\d-\d\d$/.test(c.date ?? '') || c.date > '2026-10-03') err(`comment ${i + 1}: date YYYY-MM-DD, not after 2026-10-03`);
    if (c.stars != null && !(Number.isInteger(c.stars) && c.stars >= 1 && c.stars <= 5)) err(`comment ${i + 1}: stars 1–5 or null`);
    if (c.reply && !isLang(c.reply)) err(`comment ${i + 1}: reply {en, ja}`);
  }
  for (const m of JSON.stringify(r).matchAll(/\{\{(\w+):([\w-]+)\}\}/g)) {
    if (m[1] === 'recipe' ? !SLUGS.includes(m[2]) : m[1] === 'guide' ? !GUIDES.includes(m[2]) : true) err(`bad link ${m[0]}`);
  }
  return errs;
}

export function loadRecipes() {
  return readdirSync(DIR).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const r = JSON.parse(readFileSync(new URL(f, DIR), 'utf8'));
    r._file = f;
    return r;
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const want = process.argv.slice(2);
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json') && (!want.length || want.includes(f.replace('.json', ''))));
  let bad = 0;
  for (const f of files) {
    let r;
    try { r = JSON.parse(readFileSync(new URL(f, DIR), 'utf8')); } catch (e) { console.log(`${f}: invalid JSON: ${e.message}`); bad++; continue; }
    const errs = checkRecipe(r, f);
    bad += errs.length;
    console.log(errs.length ? errs.join('\n') : `${f}: ok`);
  }
  process.exit(bad ? 1 : 0);
}
