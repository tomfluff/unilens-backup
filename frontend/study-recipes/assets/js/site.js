// Daily Table: behaviour shared by every page (menus, carousel, cookie banner, newsletter pop-up,
// shopping-list buttons, recipe tabs, search page).
(() => {
  const lang = document.documentElement.lang;
  const ja = lang === 'ja';
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ----- shopping list (stored as [{slug, servings}]) -----
  const getList = () => store.get('dt-list', []);
  function setList(list) { store.set('dt-list', list); updateBadge(); document.dispatchEvent(new Event('dt-list')); }
  function updateBadge() {
    const list = getList();
    $$('[data-list-count]').forEach((b) => { b.hidden = !list.length; b.textContent = list.length; });
    $$('.save-btn').forEach((b) => b.classList.toggle('saved', list.some((x) => x.slug === b.dataset.add)));
  }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.append(t);
    setTimeout(() => t.remove(), 2600);
  }
  window.DT = { getList, setList, toast, store };
  updateBadge();

  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      const slug = add.dataset.add;
      const list = getList();
      const i = list.findIndex((x) => x.slug === slug);
      if (add.classList.contains('save-btn') && i >= 0) { list.splice(i, 1); setList(list); toast(ja ? '買い物リストから外しました' : 'Removed from your shopping list'); return; }
      const input = $('.sc-input');
      const servings = input && $('#recipe-data') && JSON.parse($('#recipe-data').textContent).slug === slug ? Number(input.value) : null;
      if (i >= 0) list[i].servings = servings ?? list[i].servings; else list.push({ slug, servings });
      setList(list);
      toast(ja ? '買い物リストに追加しました' : 'Added to your shopping list');
      return;
    }
    const all = e.target.closest('[data-add-all]');
    if (all) {
      const list = getList();
      for (const slug of all.dataset.addAll.split(',')) if (!list.some((x) => x.slug === slug)) list.push({ slug, servings: null });
      setList(list);
      toast(all.dataset.done || (ja ? '買い物リストに追加しました' : 'Added to your shopping list'));
      return;
    }
    if (e.target.closest('[data-print]')) { window.print(); return; }
    if (e.target.closest('[data-pin]')) { toast(ja ? 'お気に入りに保存しました' : 'Saved to your recipe box'); return; }
    if (e.target.closest('.share-btn')) {
      navigator.clipboard?.writeText(location.href).catch(() => {});
      toast(ja ? 'リンクをコピーしました' : 'Link copied');
      return;
    }
    const x = e.target.closest('.ad-x');
    if (x) { x.closest('.ad').style.display = 'none'; return; }
    if (e.target.closest('.nav-toggle')) $('.main-nav').classList.toggle('open');
  });

  // ----- newsletter forms and pop-up -----
  $$('.nl-form').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    store.set('dt-subscribed', true);
    f.outerHTML = `<p class="fine">${ja ? 'ありがとうございます！確認メールをお送りしました。' : 'Thanks! Check your inbox to confirm.'}</p>`;
  }));
  const pop = $('.nl-pop');
  const closePop = () => { pop.hidden = true; };
  pop.addEventListener('click', (e) => { if (e.target === pop || e.target.closest('.nl-close, .nl-no')) closePop(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(); });
  let seen = false;
  try { seen = sessionStorage.getItem('dt-pop') === '1'; } catch { /* ignore */ }
  if (document.body.classList.contains('recipe-page') && !seen && !store.get('dt-subscribed', false)) {
    const show = () => {
      if (seen) return;
      seen = true;
      try { sessionStorage.setItem('dt-pop', '1'); } catch { /* ignore */ }
      pop.hidden = false;
      removeEventListener('scroll', onScroll);
    };
    const onScroll = () => { if (scrollY > (document.body.scrollHeight - innerHeight) * 0.45) show(); };
    addEventListener('scroll', onScroll, { passive: true });
    setTimeout(show, 40000);
  }

  // ----- cookie banner -----
  const cookie = $('.cookie');
  if (!store.get('dt-cookie', null)) cookie.hidden = false;
  cookie.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cookie]');
    if (!b) return;
    store.set('dt-cookie', b.dataset.cookie === 'accept' ? 'all' : 'essential');
    cookie.hidden = true;
  });

  // ----- carousel -----
  const car = $('.carousel');
  if (car) {
    const slides = $$('.slide', car), dots = $$('.car-dots button', car);
    let i = 0, timer;
    const go = (n) => { i = (n + slides.length) % slides.length; slides.forEach((s, k) => s.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); };
    const auto = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); };
    $('.car-prev', car).onclick = () => { go(i - 1); auto(); };
    $('.car-next', car).onclick = () => { go(i + 1); auto(); };
    dots.forEach((d, k) => { d.onclick = () => { go(k); auto(); }; });
    car.addEventListener('mouseenter', () => clearInterval(timer));
    car.addEventListener('mouseleave', auto);
    auto();
  }

  // ----- recipe index tabs -----
  $$('.tabs').forEach((tabs) => tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    $$('[data-tab]', tabs).forEach((x) => x.setAttribute('aria-selected', x === b));
    $$('.filterable .card').forEach((c) => { c.hidden = b.dataset.tab !== 'all' && !c.dataset.cats.split(' ').includes(b.dataset.tab); });
  }));

  // ----- search page -----
  if (document.body.classList.contains('search')) {
    const form = $('.search-page'), out = $('.search-results'), count = $('.search-count'), none = $('.search-none');
    const params = new URLSearchParams(location.search);
    form.q.value = params.get('q') || '';
    for (const k of ['time', 'cuisine', 'difficulty', 'sort']) form[k].value = params.get(k) || '';
    const diets = params.getAll('diet');
    $$('input[name=diet]', form).forEach((c) => { c.checked = diets.includes(c.value); });
    const labels = { recipe: ja ? 'レシピ' : 'Recipe', guide: ja ? 'ガイド' : 'Guide', collection: ja ? '特集' : 'Collection' };
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    fetch(`/assets/data/search-${lang}.json`).then((r) => r.json()).then((index) => {
      const run = () => {
        const fd = new FormData(form);
        const q = (fd.get('q') || '').toLowerCase().split(/[\s　]+/).filter(Boolean);
        const f = { time: Number(fd.get('time')) || 0, diet: fd.getAll('diet'), cuisine: fd.get('cuisine'), difficulty: fd.get('difficulty'), sort: fd.get('sort') };
        const filtering = f.time || f.diet.length || f.cuisine || f.difficulty;
        let res = index.map((it) => {
          const title = it.title.toLowerCase(), hay = `${title} ${it.text} ${it.kw}`.toLowerCase();
          if (!q.every((w) => hay.includes(w))) return null;
          if (filtering && (it.type !== 'recipe' || (f.time && it.time > f.time) || f.diet.some((d) => !it.diet.includes(d)) || (f.cuisine && it.cuisine !== f.cuisine) || (f.difficulty && it.difficulty !== f.difficulty))) return null;
          return { it, score: q.reduce((s, w) => s + (title.includes(w) ? 3 : 1), 0) + (it.type === 'recipe' ? 0.5 : 0) };
        }).filter(Boolean);
        if (f.sort === 'rating') res.sort((a, b) => (b.it.rating || 0) - (a.it.rating || 0));
        else if (f.sort === 'time') res.sort((a, b) => (a.it.time ?? 1e9) - (b.it.time ?? 1e9));
        else res.sort((a, b) => b.score - a.score);
        out.innerHTML = res.map(({ it }) => `<a class="result" href="${it.url}">${it.img ? `<img src="${it.img}" alt="" loading="lazy">` : '<span></span>'}<div><span class="rtype">${labels[it.type]}</span><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p>${it.type === 'recipe' ? `<div class="meta">★ ${it.rating} (${it.ratings.toLocaleString('en')}) · ${it.timeText}</div>` : ''}</div></a>`).join('');
        count.textContent = (fd.get('q') ? (ja ? `「${fd.get('q')}」の検索結果：` : `Results for "${fd.get('q')}": `) : '') + (ja ? `${res.length}件` : `${res.length} results`);
        none.hidden = res.length > 0;
        const u = new URLSearchParams();
        for (const [k, v] of fd) if (v) u.append(k, v);
        history.replaceState(null, '', `?${u}`);
      };
      form.addEventListener('change', run);
      form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
      run();
    });
  }
})();
