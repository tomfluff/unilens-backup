// Shopping list: combines the ingredients of the chosen recipes, scaled to their servings.
import { amount } from './units.js';

const lang = document.documentElement.lang;
const ja = lang === 'ja';
const { getList, setList, store } = window.DT;
const $ = (s) => document.querySelector(s);
const recipes = await fetch('/assets/data/recipes.json').then((r) => r.json());
let mode = store.get('dt-units', 'metric');
let view = 'merged';
const checked = new Set(store.get('dt-checked', []));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// "soy sauce, for the sauce" / "しょうゆ（こいくち）" -> "soy sauce" / "しょうゆ"
const baseName = (it) => it[lang].replace(/<[^>]+>/g, '').split(/[,（(]/)[0].trim();

function chosen() {
  return getList().filter((x) => recipes[x.slug]).map((x) => ({ ...x, r: recipes[x.slug], servings: x.servings || recipes[x.slug].servings }));
}

function renderChosen(list) {
  $('.shop-chosen').innerHTML = list.map((x) => `<li><img src="/assets/img/thumb/${x.r.image}.jpg" alt=""><a href="/${lang}/recipes/${x.slug}.html">${esc(x.r.title[lang])}</a>
    <input type="number" min="1" max="48" value="${x.servings}" data-slug="${x.slug}" aria-label="${ja ? '人数' : 'servings'}"><small>${x.r.unit ? esc(x.r.unit[lang]) : (ja ? '人分' : 'servings')}</small>
    <button class="icon-btn" data-remove="${x.slug}" aria-label="${ja ? '削除' : 'remove'}">✕</button></li>`).join('');
  $('.shop-empty').hidden = list.length > 0;
}

function row(key, text, note) {
  return `<li><label><input type="checkbox" data-key="${esc(key)}"${checked.has(key) ? ' checked' : ''}><span>${text}${note ? ` <small>${note}</small>` : ''}</span></label></li>`;
}

function renderItems(list) {
  const out = [];
  if (view === 'recipe') {
    for (const x of list) {
      out.push(`<li class="head">${esc(x.r.title[lang])}</li>`);
      const f = x.servings / x.r.servings;
      x.r.items.forEach((it, i) => {
        const a = amount(it, lang, mode, f);
        out.push(row(`${x.slug}#${i}`, ja ? `${esc(baseName(it))} ${a}` : `${a} ${esc(it[lang].replace(/<[^>]+>/g, ''))}`));
      });
    }
  } else {
    const merged = new Map();
    for (const x of list) {
      const f = x.servings / x.r.servings;
      for (const it of x.r.items) {
        const key = `${baseName(it).toLowerCase()}|${it.q == null ? 'free' : it.u}`;
        const m = merged.get(key) ?? { name: baseName(it), q: it.q == null ? null : 0, u: it.u, jaU: it.jaU, free: it.free, us: [0, it.us?.[1]], usOk: true, from: new Set() };
        if (it.q != null) {
          m.q += it.q * f;
          if (it.us && it.us[1] === m.us[1]) m.us[0] += it.us[0] * f; else m.usOk = false;
        }
        m.from.add(x.r.title[lang]);
        merged.set(key, m);
      }
    }
    const items = [...merged.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name, lang));
    for (const [key, m] of items) {
      const a = m.q == null ? (m.free?.[lang] ?? '') : amount({ q: m.q, u: m.u, jaU: m.jaU, us: m.usOk && m.us[1] ? m.us : undefined }, lang, mode);
      out.push(row(key, ja ? `${esc(m.name)} ${a}` : `${a} ${esc(m.name)}`, [...m.from].map(esc).join(', ')));
    }
  }
  $('.shop-list').innerHTML = out.join('');
}

function render() {
  const list = chosen();
  renderChosen(list);
  renderItems(list);
  document.querySelectorAll('[data-units]').forEach((b) => b.classList.toggle('on', b.dataset.units === mode));
  document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
}

document.addEventListener('click', (e) => {
  const rm = e.target.closest('[data-remove]');
  if (rm) { setList(getList().filter((x) => x.slug !== rm.dataset.remove)); return; }
  const u = e.target.closest('[data-units]');
  if (u) { mode = u.dataset.units; store.set('dt-units', mode); render(); return; }
  const v = e.target.closest('[data-view]');
  if (v) { view = v.dataset.view; render(); return; }
  if (e.target.closest('[data-clear]')) { checked.clear(); store.set('dt-checked', []); setList([]); }
});
document.addEventListener('change', (e) => {
  if (e.target.matches('.shop-chosen input')) {
    setList(getList().map((x) => (x.slug === e.target.dataset.slug ? { ...x, servings: Math.max(1, Number(e.target.value) || 1) } : x)));
  } else if (e.target.matches('.shop-list input')) {
    if (e.target.checked) checked.add(e.target.dataset.key); else checked.delete(e.target.dataset.key);
    store.set('dt-checked', [...checked]);
  }
});
$('.shop-add').addEventListener('submit', (e) => {
  e.preventDefault();
  const slug = e.target.querySelector('select').value;
  const list = getList();
  if (!list.some((x) => x.slug === slug)) setList([...list, { slug, servings: null }]);
});
document.addEventListener('dt-list', render);
render();
