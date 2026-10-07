// Builds Openpedia (study-wiki) from content/ into en/, ja/ and assets/.
// Node standard library only. Run: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { charts, maps, MAP_PLACES } from './charts.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const C = (...p) => path.join(ROOT, 'content', ...p);
const LANGS = ['en', 'ja'];
const warnings = [];
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const DATA = JSON.parse(fs.readFileSync(C('data.json'), 'utf8'));
const CATS = JSON.parse(fs.readFileSync(C('categories.json'), 'utf8'));
CATS.stubs = ['Minori Prefecture stubs', 'みのり県関連のスタブ項目'];
CATS.disambig = ['Disambiguation pages', '曖昧さ回避'];
// every article the site is meant to have (missing ones are not reported as broken links while writing)
const PLANNED = ['harukawa', 'minori-prefecture', 'kagami-river', 'minori-bay', 'climate-of-harukawa', 'economy-of-harukawa', 'harukawa-castle', 'history-of-harukawa', 'asagiri-clan', 'tetsuo-saeki', 'kagami-bridge', 'kagami', 'harukawa-ware', 'hanae-ishizuka', 'michiyo-tono', 'minori-prefectural-museum-of-art', 'harukawa-university', 'harukawa-railway', 'kagami-line', 'bayside-line', 'tsukikage', 'harukawa-central-station', 'kenzo-hattori', 'tsukimi-tunnel', 'haruca', 'harukawa-lantern-festival', 'cuisine-of-harukawa', 'yuzu-cultivation-in-minori', 'mount-tsukimi', 'tsukimi-onsen'];
const MAIN = JSON.parse(fs.readFileSync(C('main.json'), 'utf8'));

// ---------- UI strings ----------
const T = {
  en: {
    site: 'Openpedia', tagline: 'The Free Encyclopedia', from: 'From Openpedia, the free encyclopedia',
    search: 'Search Openpedia', searchBtn: 'Search', lang: '日本語', langName: 'Language', other: 'ja',
    article: 'Article', talk: 'Talk', read: 'Read', edit: 'Edit', editSection: 'edit', history: 'View history', mainTab: 'Main Page',
    contents: 'Contents', hide: 'hide', show: 'show', categories: 'Categories', category: 'Category',
    nav: 'Navigation', mainPage: 'Main page', allPages: 'All articles', allCats: 'Categories', random: 'Random article',
    about: 'About Openpedia', contribute: 'Contribute', help: 'Help', portal: 'Community portal', recent: 'Recent changes',
    tools: 'Tools', print: 'Printable version', cite: 'Cite this page', languages: 'Languages',
    login: 'Log in', create: 'Create account', donate: 'Donate',
    cn: 'citation needed', cnTitle: 'This claim needs references to reliable sources.',
    seeMain: 'Main article: ', seeAlso: 'See also: ',
    stub: (t) => `This article about a place or topic in Minori Prefecture is a <a href="${t}">stub</a>. You can help Openpedia by expanding it.`,
    disambig: (title) => `This <a href="#">disambiguation</a> page lists articles associated with the title <b>${title}</b>. If an internal link led you here, you may wish to change the link to point directly to the intended article.`,
    lastEdited: (d, t) => `This page was last edited on ${d}, at ${t} (UTC).`,
    licence: 'Text is available under an open content licence; additional terms may apply. By using this site, you agree to the Terms of Use and Privacy Policy.',
    footLinks: ['Privacy policy', 'About Openpedia', 'Disclaimers', 'Contact Openpedia', 'Mobile view'],
    research: 'Fictional website made for research (UniLens user study).',
    catHead: (n) => `The following ${n} page${n === 1 ? ' is' : 's are'} in this category, out of ${n} total.`,
    catPrefix: 'Category:', pagesIn: (c) => `Pages in category "${c}"`,
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    monthLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    banner: '<b>To all our readers in Japan:</b> please don\'t skip this. Openpedia is kept running by readers. If everyone reading this right now gave ¥300, our fundraiser would be done within an hour. Most people ignore this message. If Openpedia has given you ¥300 worth of knowledge this year, please give back.',
    bannerBtn: 'Give ¥300', bannerLater: 'Maybe later', close: 'Close',
    readonly: 'This copy of Openpedia is read-only. Editing and talk pages are not available.',
    references: 'References', notes: 'Notes',
  },
  ja: {
    site: 'オープンペディア', tagline: 'フリー百科事典', from: '出典: フリー百科事典『オープンペディア（Openpedia）』',
    search: 'オープンペディア内を検索', searchBtn: '検索', lang: 'English', langName: '言語', other: 'en',
    article: 'ページ', talk: 'ノート', read: '閲覧', edit: '編集', editSection: '編集', history: '履歴表示', mainTab: 'メインページ',
    contents: '目次', hide: '非表示', show: '表示', categories: 'カテゴリ', category: 'カテゴリ',
    nav: '案内', mainPage: 'メインページ', allPages: '全ページ', allCats: 'カテゴリ一覧', random: 'おまかせ表示',
    about: 'オープンペディアについて', contribute: '貢献', help: 'ヘルプ', portal: 'コミュニティ・ポータル', recent: '最近の更新',
    tools: 'ツール', print: '印刷用バージョン', cite: 'この項目を引用', languages: '他言語版',
    login: 'ログイン', create: 'アカウント作成', donate: '寄付',
    cn: '要出典', cnTitle: 'この記述には信頼できる情報源の提示が求められています。',
    seeMain: '詳細は「', seeMainEnd: '」を参照', seeAlso: '「', seeAlsoEnd: '」も参照',
    stub: (t) => `この項目は、みのり県に関連した<a href="${t}">書きかけの項目</a>です。この項目を加筆・訂正などしてくださる協力者を求めています。`,
    disambig: (title) => `このページは<a href="#">曖昧さ回避</a>のためのページです。一つの語句が複数の意味・職能を有する場合の水先案内のために、異なる用法を一覧にしてあります。お探しの用語に一番近い記事を選んで下さい。このページへリンクしているページを見つけたら、リンクを適切な項目に張り替えて下さい。`,
    lastEdited: (d, t) => `最終更新 ${d} ${t} (UTC)`,
    licence: 'テキストはオープンコンテンツのライセンスの下で利用可能です。追加の条件が適用される場合があります。詳細は利用規約を参照してください。',
    footLinks: ['プライバシー・ポリシー', 'オープンペディアについて', '免責事項', 'お問い合わせ', 'モバイルビュー'],
    research: '研究用に作成した架空のウェブサイトです（UniLens ユーザー調査）。',
    catHead: (n) => `このカテゴリには ${n} ページが含まれており、そのうち以下の ${n} ページを表示しています。`,
    catPrefix: 'Category:', pagesIn: (c) => `カテゴリ「${c}」にあるページ`,
    month: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    banner: '<b>日本の読者の皆様へ：</b>どうか読み飛ばさないでください。オープンペディアは読者の皆様の寄付によって運営されています。いまこの文章を読んでいる皆様が300円ずつご寄付くだされば、募金活動は1時間で終わります。今年オープンペディアが300円分お役に立ったなら、どうかご支援をお願いします。',
    bannerBtn: '300円を寄付', bannerLater: 'あとで', close: '閉じる',
    readonly: 'このオープンペディアは閲覧専用です。編集やノートページは利用できません。',
    references: '出典', notes: '注釈',
  },
};

const fmtDate = (iso, lang) => {
  const [y, m, d] = iso.split('-').map(Number);
  return lang === 'ja' ? `${y}年${m}月${d}日` : `${d} ${T.en.monthLong[m - 1]} ${y}`;
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const anchorId = (text) => text.replace(/<[^>]+>/g, '').replace(/'''|''/g, '').replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1').trim().replace(/\s+/g, '_').replace(/"/g, '');
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// ---------- load articles ----------
function parseFile(file, lang) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  const cut = raw.indexOf('\n---\n');
  if (cut < 0) { warn(file, 'no --- header separator'); return null; }
  const head = raw.slice(0, cut).split('\n');
  const a = { lang, slug: path.basename(file, '.txt'), body: raw.slice(cut + 5), ib: [], categories: [], type: 'article' };
  for (const line of head) {
    const m = line.match(/^([a-z-]+):\s?(.*)$/);
    if (!m) { if (line.trim()) warn(file, `bad header line "${line}"`); continue; }
    const [, k, v] = m;
    if (k === 'categories') a.categories = v.split(';').map((s) => s.trim()).filter(Boolean);
    else if (k === 'ib' || k === 'ib-section' || k === 'ib-image' || k === 'ib-map') a.ib.push([k, v]);
    else a[k] = v.trim();
  }
  if (!a.title) warn(file, 'no title');
  return a;
}
const ART = { en: {}, ja: {} };
for (const lang of LANGS) {
  for (const f of fs.readdirSync(C(lang)).filter((f) => f.endsWith('.txt')).sort()) {
    const a = parseFile(C(lang, f), lang);
    if (a) ART[lang][a.slug] = a;
  }
}

// collect section anchors per article (for link checking)
const ANCHORS = { en: {}, ja: {} };
for (const lang of LANGS) for (const a of Object.values(ART[lang])) {
  ANCHORS[lang][a.slug] = new Set([...a.body.matchAll(/^={2,4}\s*(.+?)\s*={2,4}\s*$/gm)].map((m) => anchorId(m[1])));
}

// ---------- wikitext renderer ----------
function splitTop(s, sep) {
  // split on sep outside [[ ]] and {{ }}
  const out = []; let depthL = 0, depthT = 0, cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s.startsWith('[[', i)) { depthL++; cur += '[['; i++; continue; }
    if (s.startsWith(']]', i) && depthL) { depthL--; cur += ']]'; i++; continue; }
    if (s.startsWith('{{', i)) { depthT++; cur += '{{'; i++; continue; }
    if (s.startsWith('}}', i) && depthT) { depthT--; cur += '}}'; i++; continue; }
    if (!depthL && !depthT && s.startsWith(sep, i)) { out.push(cur); cur = ''; i += sep.length - 1; continue; }
    cur += s[i];
  }
  out.push(cur);
  return out;
}
function findTemplates(s) {
  // returns [{start,end,inner}] for top-level {{...}}
  const res = []; let depth = 0, start = -1;
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] === '{' && s[i + 1] === '{') { if (!depth) start = i; depth++; i++; }
    else if (s[i] === '}' && s[i + 1] === '}' && depth) { depth--; i++; if (!depth) res.push({ start, end: i + 1, inner: s.slice(start + 2, i - 1) }); }
  }
  return res;
}

class Doc {
  constructor(lang, slug, prefix) {
    Object.assign(this, { lang, slug, prefix, refs: [], refByName: {}, notes: [], ph: [] });
  }
  where() { return `${this.lang}/${this.slug}`; }
  hold(html) { this.ph.push(html); return `\u0000${this.ph.length - 1}\u0001`; }
  restore(s) { let prev; do { prev = s; s = s.replace(/\u0000(\d+)\u0001/g, (_, i) => this.ph[+i]); } while (s !== prev); return s; }
  articleHref(slug, anchor) {
    return `${this.prefix}${this.lang}/wiki/${slug}.html${anchor ? '#' + encodeURI(anchor) : ''}`;
  }
  link(inner) {
    let [target, ...rest] = splitTop(inner, '|');
    let text = rest.length ? rest.join('|') : null;
    target = target.trim();
    if (target.startsWith('?')) {
      const t = target.slice(1).trim();
      return this.hold(`<a class="new" href="${this.prefix}${this.lang}/search.html?q=${encodeURIComponent(t)}&amp;redlink=1" title="${esc(t)} (page does not exist)">${this.inline(text ?? t)}</a>`);
    }
    const [slug, anchor] = target.split('#');
    if (!slug && anchor) return this.hold(`<a href="#${esc(anchorId(anchor))}">${this.inline(text ?? anchor)}</a>`);
    const a = ART[this.lang][slug];
    if (!a) {
      if (!PLANNED.includes(slug)) warn(this.where(), `link to unknown slug "${slug}"`);
      return this.hold(`<a class="new" href="${this.prefix}${this.lang}/search.html?q=${encodeURIComponent(slug)}&amp;redlink=1">${this.inline(text ?? slug)}</a>`);
    }
    if (anchor && !ANCHORS[this.lang][slug].has(anchorId(anchor))) warn(this.where(), `link to missing section "${slug}#${anchor}"`);
    const self = slug === this.slug && !anchor;
    if (self) return this.hold(`<a class="selflink"><b>${this.inline(text ?? a.title)}</b></a>`);
    return this.hold(`<a href="${this.articleHref(slug, anchor ? anchorId(anchor) : '')}" title="${esc(a.title)}">${this.inline(text ?? a.title)}</a>`);
  }
  cite(name, content) {
    let ref = name && this.refByName[name];
    if (!ref) {
      if (content == null) { warn(this.where(), `<ref name="${name}"/> used before definition`); content = ''; }
      ref = { n: this.refs.length + 1, id: name || `r${this.refs.length + 1}`, html: '', uses: 0 };
      this.refs.push(ref);
      if (name) this.refByName[name] = ref;
      ref.html = this.inline(content);
    } else if (content != null && !ref.html) ref.html = this.inline(content);
    ref.uses++;
    const back = `cite_ref-${ref.id}-${ref.uses}`;
    return this.hold(`<sup id="${esc(back)}" class="reference"><a href="#cite_note-${esc(ref.id)}">[${ref.n}]</a></sup>`);
  }
  note(text) {
    const n = this.notes.length;
    const letter = String.fromCharCode(97 + (n % 26));
    this.notes.push({ letter, html: this.inline(text) });
    return this.hold(`<sup id="cite_ref-note${letter}" class="reference"><a href="#cite_note-note${letter}">[${this.lang === 'ja' ? '注 ' + (n + 1) : letter}]</a></sup>`);
  }
  template(inner) {
    const parts = splitTop(inner, '|');
    const name = parts[0].trim().toLowerCase();
    const L = T[this.lang];
    if (name === 'cn' || name === 'citation needed' || name === '要出典') {
      return this.hold(`<sup class="noprint cn">[<i><a href="${this.prefix}${this.lang}/about.html#citations" title="${esc(L.cnTitle)}">${L.cn}</a></i>]</sup>`);
    }
    if (name === 'efn') return this.note(parts.slice(1).join('|'));
    if (name === 'nowrap') return this.hold(`<span class="nowrap">${this.inline(parts.slice(1).join('|'))}</span>`);
    if (name === 'lang' || name === 'lang-ja') return this.inline(parts[parts.length - 1]);
    warn(this.where(), `unknown inline template {{${parts[0]}}}`);
    return '';
  }
  inline(s) {
    if (s == null) return '';
    // refs
    s = s.replace(/<ref(?:\s+name\s*=\s*"?([^">/]+?)"?)?\s*\/>/g, (_, name) => this.cite(name.trim(), null));
    s = s.replace(/<ref(?:\s+name\s*=\s*"?([^">]+?)"?)?\s*>([\s\S]*?)<\/ref>/g, (_, name, c) => this.cite(name?.trim(), c));
    // templates
    const ts = findTemplates(s);
    for (let i = ts.length - 1; i >= 0; i--) s = s.slice(0, ts[i].start) + this.template(ts[i].inner) + s.slice(ts[i].end);
    // links (innermost first)
    let prev;
    do { prev = s; s = s.replace(/\[\[([^\[\]]+)\]\]/g, (_, inner) => (/^(File|Chart|Map):/i.test(inner) ? this.figure(inner, true) : this.link(inner))); } while (s !== prev);
    s = esc(s).replace(/&amp;(#?\w+);/g, '&$1;');
    s = s.replace(/&lt;(\/?)(br|sup|sub|small|s|u|code|wbr)\s*\/?&gt;/gi, '<$1$2>');
    s = s.replace(/'''(.+?)'''/g, '<b>$1</b>').replace(/''(.+?)''/g, '<i>$1</i>');
    return s;
  }
  figure(inner, inlineCtx = false) {
    const parts = splitTop(inner, '|');
    const [kind, ...nameParts] = parts[0].split(':');
    const name = nameParts.join(':').trim();
    let side = 'tright', caption = '';
    for (const p of parts.slice(1)) {
      const t = p.trim();
      if (t === 'left') side = 'tleft'; else if (t === 'right') side = 'tright'; else if (t === 'center' || t === 'none') side = 'tnone';
      else if (/^(thumb|upright|frameless|\d+px)$/.test(t)) { /* ignore */ } else caption = t;
    }
    const k = kind.toLowerCase();
    let src, alt, w = 250, cls = '';
    if (k === 'file') {
      src = `${this.prefix}assets/img/${name}`;
      if (!fs.existsSync(path.join(ROOT, 'assets/img', name))) warn(this.where(), `missing image ${name}`);
      alt = caption.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1').replace(/<ref[\s\S]*?(<\/ref>|\/>)|{{[^}]*}}|'''|''/g, '');
    } else if (k === 'chart') {
      if (!charts[name]) warn(this.where(), `unknown chart ${name}`);
      src = `${this.prefix}assets/charts/${name}.${this.lang}.svg`;
      // Like many real sites, charts get no useful alt text.
      alt = ['', 'chart', `${name}.svg`, 'graph'][hash(this.slug + name) % 4];
      w = name === 'railmap' ? 520 : 340; cls = ' chart';
    } else if (k === 'map') {
      if (!MAP_PLACES.includes(name)) warn(this.where(), `unknown map ${name}`);
      src = `${this.prefix}assets/charts/map-${name}.${this.lang}.svg`; alt = 'map'; w = 260;
    } else { warn(this.where(), `unknown figure kind ${kind}`); return ''; }
    const capHtml = this.inline(caption);
    const html = `<figure class="thumb ${side}${cls}" style="width:${w + 8}px"><a href="${src}" class="image"><img src="${src}" alt="${esc(alt)}" width="${w}" loading="lazy"></a><figcaption>${capHtml}</figcaption></figure>`;
    return inlineCtx ? this.hold(html) : html;
  }
  table(lines) {
    let caption = lines[0].replace(/^\{\|/, '').trim();
    caption = caption.replace(/^(class|style)=("[^"]*"|\S+)\s*/g, '');
    const rows = [];
    for (const line of lines.slice(1)) {
      const t = line.trim();
      if (!t || t === '|-' || t.startsWith('|-')) continue;
      if (t.startsWith('|+')) { caption = t.slice(2).trim(); continue; }
      if (t.startsWith('!')) rows.push({ head: true, cells: splitTop(t.slice(1), '!!').flatMap((c) => splitTop(c, '||')) });
      else if (t.startsWith('|')) rows.push({ head: false, cells: splitTop(t.slice(1), '||') });
      else if (rows.length) { const r = rows[rows.length - 1]; r.cells[r.cells.length - 1] += ' ' + t; }
      else warn(this.where(), `table line not understood: ${t.slice(0, 40)}`);
    }
    const cell = (c, head, colIdx) => {
      let attrs = '';
      const m = c.match(/^\s*((?:(?:colspan|rowspan|style|align|scope)\s*=\s*"?[^"|]*"?\s*)+)\|(?!\|)(.*)$/);
      if (m) {
        c = m[2];
        for (const am of m[1].matchAll(/(colspan|rowspan)\s*=\s*"?(\d+)"?/g)) attrs += ` ${am[1]}="${am[2]}"`;
      }
      const text = c.trim();
      const num = /^[-−–+]?[¥$]?[\d,.]+\s*(%|‰|km|m|mm|°C|t|h|万|億|円|人|基|ha|km²|m³\/s)?$/.test(text.replace(/<ref[\s\S]*?(<\/ref>|\/>)|{{[^}]*}}/g, '').trim());
      const tag = head || (colIdx === 0 && /^'''/.test(text)) ? 'th' : 'td';
      return `<${tag}${attrs}${num && !head ? ' class="num"' : ''}>${this.inline(text)}</${tag}>`;
    };
    const body = rows.map((r) => `<tr>${r.cells.map((c, i) => cell(c, r.head, i)).join('')}</tr>`).join('\n');
    return `<div class="table-wrap"><table class="wikitable">${caption ? `<caption>${this.inline(caption)}</caption>` : ''}\n${body}\n</table></div>`;
  }
  list(lines, ordered) {
    const tag = ordered ? 'ol' : 'ul';
    return `<${tag}>${lines.map((l) => `<li>${this.inline(l.replace(/^[*#]+\s*/, ''))}</li>`).join('')}</${tag}>`;
  }
  hatnote(kind, targets) {
    const L = T[this.lang];
    const links = targets.map((t) => this.restore(this.link(t.trim()))).join(this.lang === 'ja' ? '」、「' : ', ');
    if (this.lang === 'ja') return `<div class="hatnote">${kind === 'main' ? L.seeMain : L.seeAlso}${links}${kind === 'main' ? L.seeMainEnd : L.seeAlsoEnd}</div>`;
    return `<div class="hatnote">${kind === 'main' ? L.seeMain : L.seeAlso}${links}</div>`;
  }
  block(body) {
    const lines = body.split('\n');
    const out = []; let para = [];
    const L = T[this.lang];
    const flush = () => {
      if (para.length) out.push(`<p>${this.inline(para.join(this.lang === 'ja' ? '' : ' '))}</p>`);
      para = [];
    };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const t = line.trim();
      let m;
      if (!t) { flush(); continue; }
      if ((m = t.match(/^(={2,4})\s*(.+?)\s*\1$/))) {
        flush();
        const lvl = m[1].length;
        out.push({ heading: true, lvl, text: m[2] });
        continue;
      }
      if (t.startsWith('{|')) {
        flush();
        const tl = [t];
        while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('|}')) tl.push(lines[++i]);
        if (i + 1 >= lines.length) warn(this.where(), 'unclosed table');
        i++;
        out.push(this.table(tl));
        continue;
      }
      if (/^[*#]/.test(t)) {
        flush();
        const ordered = t[0] === '#';
        const ll = [t];
        while (i + 1 < lines.length && lines[i + 1].trim().startsWith(t[0])) ll.push(lines[++i].trim());
        out.push(this.list(ll, ordered));
        continue;
      }
      if ((m = t.match(/^\[\[((?:File|Chart|Map):.*)\]\]$/i)) && findTemplates(t).length === 0 && splitTop(t.slice(2, -2), '|').length >= 1 && !t.slice(2, -2).includes(']]['))  {
        flush(); out.push(this.figure(m[1])); continue;
      }
      if ((m = t.match(/^\{\{(.*)\}\}$/)) && findTemplates(t).length === 1) {
        const parts = splitTop(m[1], '|');
        const name = parts[0].trim();
        const lname = name.toLowerCase();
        if (lname === 'main' || lname === 'see' || lname === 'see also' || lname === 'further') { flush(); out.push(this.hatnote(lname === 'main' ? 'main' : 'see', parts.slice(1))); continue; }
        if (lname === 'reflist') { flush(); out.push('\u0002REFLIST\u0002'); continue; }
        if (lname === 'notelist') { flush(); out.push('\u0002NOTELIST\u0002'); continue; }
        if (lname === 'quote') { flush(); out.push(`<blockquote><p>${this.inline(parts[1] || '')}</p>${parts[2] ? `<div class="quote-src">— ${this.inline(parts[2])}</div>` : ''}</blockquote>`); continue; }
        if (lname === 'stub') { flush(); continue; }
        if (/^data:/i.test(name)) { flush(); out.push(dataTable(name.slice(5).trim(), this)); continue; }
      }
      para.push(t);
    }
    flush();
    return out;
  }
  render(a) {
    const L = T[this.lang];
    // infobox first so its refs are numbered first
    let infobox = '';
    if (a.infobox || a.ib.length) {
      const rows = [];
      for (const [k, v] of a.ib) {
        if (k === 'ib-section') rows.push(`<tr><th colspan="2" class="ib-section">${this.inline(v)}</th></tr>`);
        else if (k === 'ib-image' || k === 'ib-map') {
          const [file, ...cap] = splitTop(v, '|');
          const capt = cap.join('|').trim();
          let src, alt, w = 250;
          if (k === 'ib-image') {
            src = `${this.prefix}assets/img/${file.trim()}`; alt = capt.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1').replace(/'''|''/g, '');
            if (!fs.existsSync(path.join(ROOT, 'assets/img', file.trim()))) warn(this.where(), `missing image ${file.trim()}`);
          } else {
            if (!MAP_PLACES.includes(file.trim())) warn(this.where(), `unknown map ${file.trim()}`);
            src = `${this.prefix}assets/charts/map-${file.trim()}.${this.lang}.svg`; alt = ''; w = 240;
          }
          rows.push(`<tr><td colspan="2" class="ib-image"><a href="${src}"><img src="${src}" alt="${esc(alt)}" width="${w}"></a>${capt ? `<div class="ib-caption">${this.inline(capt)}</div>` : ''}</td></tr>`);
        } else {
          const [label, ...val] = splitTop(v, '|');
          rows.push(`<tr><th scope="row">${this.inline(label.trim())}</th><td>${this.inline(val.join('|').trim())}</td></tr>`);
        }
      }
      const sub = a['ib-subtitle'] ? `<div class="ib-subtitle">${this.inline(a['ib-subtitle'])}</div>` : '';
      infobox = `<table class="infobox"><tr><th colspan="2" class="ib-above">${this.inline(a.infobox || a.title)}${sub}</th></tr>${rows.join('')}</table>`;
    }
    const blocks = this.block(a.body);
    // TOC + headings
    const heads = blocks.filter((b) => b.heading);
    const used = new Set();
    let n2 = 0, n3 = 0, n4 = 0;
    for (const h of heads) {
      let id = anchorId(h.text); let k = 2;
      while (used.has(id)) id = `${anchorId(h.text)}_${k++}`;
      used.add(id); h.id = id;
      if (h.lvl === 2) { n2++; n3 = 0; n4 = 0; h.num = `${n2}`; } else if (h.lvl === 3) { n3++; n4 = 0; h.num = `${n2}.${n3}`; } else { n4++; h.num = `${n2}.${n3}.${n4}`; }
    }
    let toc = '';
    if (heads.length >= 3 && a.type !== 'disambiguation') {
      toc = `<div id="toc" class="toc" role="navigation"><div class="toctitle"><h2>${L.contents}</h2><span class="toctogglespan">[<a href="#" class="toctoggle" data-hide="${L.hide}" data-show="${L.show}">${L.hide}</a>]</span></div><ul>${heads.map((h) => `<li class="toclevel-${h.lvl - 1}"><a href="#${esc(h.id)}"><span class="tocnumber">${h.num}</span> <span class="toctext">${this.restore(this.inline(h.text)).replace(/<sup[\s\S]*?<\/sup>/g, '')}</span></a></li>`).join('')}</ul></div>`;
    }
    let html = ''; let tocDone = false;
    for (const b of blocks) {
      if (b.heading) {
        if (!tocDone) { html += toc; tocDone = true; }
        html += `<h${b.lvl} id="${esc(b.id)}"><span class="mw-headline">${this.inline(b.text)}</span><span class="mw-editsection"><span class="br">[</span><a href="#" class="js-static">${L.editSection}</a><span class="br">]</span></span></h${b.lvl}>\n`;
      } else html += b + '\n';
    }
    if (!tocDone) html += toc;
    // reference & note lists
    const refHtml = `<div class="reflist${this.refs.length > 12 ? ' cols' : ''}"><ol class="references">${this.refs.map((r) => {
      const backs = r.uses === 1 ? `<a href="#cite_ref-${esc(r.id)}-1">^</a>` : `^ ${Array.from({ length: r.uses }, (_, i) => `<a href="#cite_ref-${esc(r.id)}-${i + 1}"><sup><i><b>${String.fromCharCode(97 + i)}</b></i></sup></a>`).join(' ')}`;
      return `<li id="cite_note-${esc(r.id)}"><span class="mw-cite-backlink">${backs}</span> <span class="reference-text">${r.html}</span></li>`;
    }).join('')}</ol></div>`;
    const noteHtml = `<div class="reflist notelist"><ol class="references" style="list-style-type:${this.lang === 'ja' ? 'decimal' : 'lower-alpha'}">${this.notes.map((n) => `<li id="cite_note-note${n.letter}"><span class="mw-cite-backlink"><a href="#cite_ref-note${n.letter}">^</a></span> <span class="reference-text">${n.html}</span></li>`).join('')}</ol></div>`;
    if (this.refs.length && !html.includes('\u0002REFLIST\u0002')) warn(this.where(), 'has refs but no {{reflist}}');
    if (this.notes.length && !html.includes('\u0002NOTELIST\u0002')) warn(this.where(), 'has notes but no {{notelist}}');
    html = html.replace('\u0002REFLIST\u0002', refHtml).replace('\u0002NOTELIST\u0002', noteHtml);
    let notice = '';
    if (a.type === 'stub') notice = `<div class="stub-notice"><svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="13" fill="#e8f0f8" stroke="#7a9cc6"/><path d="M8 20 L15 8 L22 20 Z" fill="#7a9cc6"/></svg><span>${L.stub(this.prefix + this.lang + '/category/stubs.html')}</span></div>`;
    if (a.type === 'disambiguation') notice = `<div class="dmbox">${L.disambig(esc(a.title))}</div>`;
    const hat = a.hatnote ? `<div class="hatnote">${this.inline(a.hatnote)}</div>` : '';
    return this.restore(hat + infobox + html + notice);
  }
}

// ---------- generated data tables ----------
function dataTable(name, doc) {
  const ja = doc.lang === 'ja';
  const L = T[doc.lang];
  const n1 = (v) => (v < 0 ? '−' + Math.abs(v).toFixed(1) : v.toFixed(1));
  const nf = (v) => v.toLocaleString('en-US');
  if (name === 'climate') {
    const c = DATA.climate;
    const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const rows = [
      [ja ? '最高気温記録 °C' : 'Record high °C', c.recordHigh, Math.max(...c.recordHigh), n1, 'rec'],
      [ja ? '平均最高気温 °C' : 'Mean daily maximum °C', c.high, avg(c.high), n1, 'hi'],
      [ja ? '日平均気温 °C' : 'Daily mean °C', c.mean, avg(c.mean), n1, 'mean'],
      [ja ? '平均最低気温 °C' : 'Mean daily minimum °C', c.low, avg(c.low), n1, 'lo'],
      [ja ? '最低気温記録 °C' : 'Record low °C', c.recordLow, Math.min(...c.recordLow), n1, 'rec'],
      [ja ? '降水量 mm' : 'Average precipitation mm', c.precip, sum(c.precip), n1, 'rain'],
      [ja ? '平均降水日数（≥1.0 mm）' : 'Average precipitation days (≥ 1.0 mm)', c.rainDays, sum(c.rainDays), n1, 'rain'],
      [ja ? '平均湿度 %' : 'Average relative humidity (%)', c.humidity, Math.round(avg(c.humidity)), (v) => String(v), ''],
      [ja ? '日照時間 h' : 'Mean monthly sunshine hours', c.sunshine, sum(c.sunshine), n1, 'sun'],
    ];
    const head = `<tr><th>${ja ? '月' : 'Month'}</th>${L.month.map((m) => `<th>${m}</th>`).join('')}<th>${ja ? '年' : 'Year'}</th></tr>`;
    const body = rows.map(([label, vals, year, f, cls]) => `<tr><th scope="row">${label}</th>${vals.map((v) => `<td class="num ${cls}">${f(v)}</td>`).join('')}<td class="num ${cls} year">${f(year)}</td></tr>`).join('');
    return `<div class="table-wrap"><table class="wikitable climate"><caption>${ja ? '春川（1991年 - 2020年）の気候' : 'Climate data for Harukawa (1991–2020 normals, extremes 1891–present)'}</caption>${head}${body}<tr><td colspan="14" class="source">${ja ? '出典：' : 'Source: '}${c.source[doc.lang]}</td></tr></table></div>`;
  }
  if (name === 'population') {
    const p = DATA.population;
    const rows = p.map(([y, v], i) => {
      const pct = i ? ((v - p[i - 1][1]) / p[i - 1][1]) * 100 : null;
      return `<tr><td>${y}${y === 2025 ? (ja ? '（推計）' : ' (est.)') : ''}</td><td class="num">${nf(v)}</td><td class="num">${pct == null ? '—' : (pct >= 0 ? '+' : '−') + Math.abs(pct).toFixed(1) + '%'}</td></tr>`;
    }).join('');
    return `<div class="table-wrap poptable"><table class="wikitable"><caption>${ja ? '春川市の人口推移' : 'Historical population'}</caption><tr><th>${ja ? '年' : 'Year'}</th><th>${ja ? '人口' : 'Pop.'}</th><th>±%</th></tr>${rows}<tr><td colspan="3" class="source">${ja ? '出典：国勢調査（1920年以降）、2025年はみのり県推計' : 'Source: national census (1920 onwards); 2025 prefectural estimate'}</td></tr></table></div>`;
  }
  if (name === 'sectors') {
    const s = DATA.sectors;
    const rows = s.rows.map(([en, j, pct]) => `<tr><td>${ja ? j : en}</td><td class="num">${pct.toFixed(1)}%</td><td class="num">${nf(Math.round((s.totalBillion * pct) / 100))}</td></tr>`).join('');
    return `<div class="table-wrap"><table class="wikitable"><caption>${ja ? `市内総生産の産業別構成（${s.year.ja}）` : `Gross city product by sector (${s.year.en})`}</caption><tr><th>${ja ? '産業' : 'Sector'}</th><th>${ja ? '構成比' : 'Share'}</th><th>${ja ? '金額（億円）' : '¥ billion'}</th></tr>${ja ? rows.replace(/<td class="num">([\d,]+)<\/td><\/tr>/g, (_, v) => `<td class="num">${nf(Number(v.replace(/,/g, '')) * 10)}</td></tr>`) : rows}<tr><th>${ja ? '合計' : 'Total'}</th><th class="num">100.0%</th><th class="num">${ja ? nf(s.totalBillion * 10) : nf(s.totalBillion)}</th></tr></table></div>`;
  }
  if (name === 'kagami-stations' || name === 'bayside-stations') {
    const kag = name === 'kagami-stations';
    const st = kag ? DATA.kagamiStations : DATA.baysideStations;
    const head = ja
      ? ['駅番号', '駅名', 'よみ', '駅間キロ', '営業キロ', ...(kag ? ['特急「月影」'] : []), '開業日', '1日平均乗車人員（2025年度）', '接続・備考', '所在地']
      : ['No.', 'Station', 'Japanese', 'Between (km)', 'Distance (km)', ...(kag ? ['Tsukikage'] : []), 'Opened', 'Daily boardings (FY2025)', 'Transfers and notes', 'Location'];
    const rows = st.map((r, i) => {
      const [no, en, j, kana, km, opened, tk, muni, munij, board, note, notej] = r;
      const between = i ? (km - st[i - 1][4]).toFixed(1) : '—';
      const tkCell = tk === 'stop' ? '●' : tk === 'nov' ? '◇' : '｜';
      const boardCell = board ? nf(board) : (ja ? '（鏡線に含む）' : '(see Kagami Line)');
      return `<tr><td>${kag ? 'K' : 'B'}${String(no).padStart(2, '0')}</td><td>${ja ? j : en}</td><td>${ja ? kana : j}</td><td class="num">${between}</td><td class="num">${km.toFixed(1)}</td>${kag ? `<td class="center">${tkCell}</td>` : ''}<td>${fmtDate(opened, doc.lang)}</td><td class="num">${boardCell}</td><td>${ja ? notej : note}</td><td>${ja ? munij : muni}</td></tr>`;
    }).join('');
    const legend = kag ? `<tr><td colspan="${head.length}" class="source">${ja ? '●：特急「月影」停車、◇：2026年11月14日のダイヤ改正から停車、｜：通過。快速は川端（2026年11月13日まで）・西春野・大塚を除く各駅に停車。乗車人員は春川中央が両線の合計。' : '●: Tsukikage stops; ◇: Tsukikage stops from the timetable revision of 14 November 2026; ｜: passes. Rapid trains stop at all stations except Kawabata (until 13 November 2026), Nishi-Haruno and Ōtsuka. Boardings at Harukawa Central are for both lines.'}</td></tr>` : `<tr><td colspan="${head.length}" class="source">${ja ? '全列車が各駅に停車。' : 'All trains stop at every station.'}</td></tr>`;
    return `<div class="table-wrap"><table class="wikitable stations"><caption>${ja ? (kag ? '鏡線 駅一覧' : '湾岸線 駅一覧') : (kag ? 'Kagami Line stations' : 'Bayside Line stations')}</caption><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${rows}${legend}</table></div>`;
  }
  warn(doc.where(), `unknown data table ${name}`);
  return '';
}

// ---------- page shell ----------
const LOGO = `<svg class="logo-mark" viewBox="0 0 64 64" width="44" height="44" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#fff" stroke="#54595d" stroke-width="2"/><path d="M12 22 Q22 18 32 23 Q42 18 52 22 L52 46 Q42 42 32 47 Q22 42 12 46 Z" fill="#eaecf0" stroke="#54595d" stroke-width="2" stroke-linejoin="round"/><path d="M32 23 L32 47" stroke="#54595d" stroke-width="2"/><path d="M16 27 Q22 25 28 28 M16 32 Q22 30 28 33 M16 37 Q22 35 28 38 M36 28 Q42 25 48 27 M36 33 Q42 30 48 32 M36 38 Q42 35 48 37" stroke="#72777d" stroke-width="1.4" fill="none"/><circle cx="46" cy="14" r="5" fill="#f2c14e" stroke="#54595d" stroke-width="1.2"/></svg>`;

function shell({ lang, relPath, title, htmlTitle, content, bodyClass = '', tabs = 'article', lastEdited = null, extraHead = '' }) {
  const L = T[lang];
  const depth = relPath.split('/').length - 1; // e.g. en/wiki/x.html -> 2
  const P = '../'.repeat(depth);
  const otherPath = relPath.replace(/^(en|ja)\//, `${L.other}/`);
  const href = (p) => `${P}${lang}/${p}`;
  const pageTitle = `${htmlTitle ?? title} - ${L.site}`;
  const tabHtml = tabs === 'none' ? '' : `<div class="tabs">
    <div class="tabs-left"><a class="tab selected" href="#">${tabs === 'main' ? L.mainTab : L.article}</a><a class="tab js-static" href="#">${L.talk}</a></div>
    <div class="tabs-right"><a class="tab selected" href="#">${L.read}</a><a class="tab js-static" href="#">${L.edit}</a><a class="tab js-static" href="#">${L.history}</a><a class="tab more js-static" href="#" title="More">⋯</a></div>
  </div>`;
  const edited = lastEdited ? `<li>${lastEdited}</li>` : '';
  return `<!DOCTYPE html>
<html lang="${lang}" data-root="${P}" data-page="${esc(relPath)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<link rel="stylesheet" href="${P}assets/wiki.css">
<link rel="icon" href="${P}assets/favicon.svg" type="image/svg+xml">
${extraHead}</head>
<body class="${bodyClass}">
<div id="banner" class="banner" hidden><div class="banner-inner"><div class="banner-text">${L.banner}</div><div class="banner-actions"><a class="banner-btn" href="${href('about.html#donate')}">${L.bannerBtn}</a><a href="#" class="banner-later">${L.bannerLater}</a></div><button class="banner-close" type="button" title="${L.close}">✕</button></div></div>
<header class="site-header">
  <button class="menu-btn" type="button" title="Menu" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 20 20"><path d="M2 4h16M2 10h16M2 16h16" stroke="#202122" stroke-width="2"/></svg></button>
  <a class="logo" href="${href('index.html')}">${LOGO}<span class="wordmark"><span class="wm-name">${lang === 'ja' ? 'オープンペディア' : 'Openpedia'}</span><span class="wm-tag">${L.tagline}</span></span></a>
  <form class="search" action="${href('search.html')}" method="get" role="search">
    <div class="search-box"><svg class="search-icon" width="16" height="16" viewBox="0 0 20 20"><circle cx="8" cy="8" r="6" fill="none" stroke="#72777d" stroke-width="2"/><path d="M13 13l5 5" stroke="#72777d" stroke-width="2"/></svg><input type="search" name="q" placeholder="${L.search}" autocomplete="off" aria-label="${L.search}"><ul class="suggestions" hidden></ul></div>
    <button type="submit" class="search-btn">${L.searchBtn}</button>
  </form>
  <nav class="personal">
    <a class="lang-switch" href="${P}${otherPath}" lang="${L.other}" title="${L.langName}"><svg width="18" height="18" viewBox="0 0 20 20"><path d="M2 4h9M6.5 2v2M4 4c0 4 3 7 6 8M9 4c0 4-3 7-6 8" stroke="#36c" stroke-width="1.5" fill="none"/><path d="M11 18l3.5-9 3.5 9M12.2 15h4.6" stroke="#36c" stroke-width="1.5" fill="none"/></svg>${L.lang}</a>
    <a href="${href('about.html#donate')}">${L.donate}</a><a href="#" class="js-static">${L.create}</a><a href="#" class="js-static">${L.login}</a>
  </nav>
</header>
<div class="page">
<nav class="sidebar">
  <div class="portal"><h3>${L.nav}</h3><ul>
    <li><a href="${href('index.html')}">${L.mainPage}</a></li><li><a href="${href('all-pages.html')}">${L.allPages}</a></li><li><a href="${href('categories.html')}">${L.allCats}</a></li><li><a href="${href('random.html')}">${L.random}</a></li><li><a href="${href('about.html')}">${L.about}</a></li></ul></div>
  <div class="portal"><h3>${L.contribute}</h3><ul><li><a href="${href('about.html#help')}">${L.help}</a></li><li><a href="${href('about.html#community')}">${L.portal}</a></li><li><a href="#" class="js-static">${L.recent}</a></li></ul></div>
  <div class="portal"><h3>${L.tools}</h3><ul><li><a href="#" class="js-print">${L.print}</a></li><li><a href="${href('about.html#citations')}">${L.cite}</a></li></ul></div>
  <div class="portal"><h3>${L.languages}</h3><ul><li><a href="${P}${otherPath}" lang="${L.other}">${L.lang}</a></li></ul></div>
</nav>
<main class="content" id="content">
  ${tabHtml}
  ${content}
</main>
</div>
<footer class="site-footer">
  <ul class="footer-info">${edited}<li>${L.licence}</li></ul>
  <ul class="footer-links">${L.footLinks.map((t, i) => `<li><a href="${href('about.html' + ['#privacy', '', '#disclaimers', '#contact', ''][i])}">${t}</a></li>`).join('')}</ul>
  <p class="research-note">${L.research}</p>
</footer>
<div class="toast" hidden></div>
<script src="${P}assets/wiki.js"></script>
<script src="/unilens.js"></script>
<script>UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })</script>
</body>
</html>
`;
}

function catLinks(cats, lang, prefix) {
  const L = T[lang];
  if (!cats.length) return '';
  return `<div class="catlinks"><a href="${prefix}${lang}/categories.html">${L.categories}</a>: <ul>${cats.map((c) => `<li><a href="${prefix}${lang}/category/${c}.html">${esc(CATS[c][lang === 'ja' ? 1 : 0])}</a></li>`).join('')}</ul></div>`;
}

function editedLine(slug, lang) {
  const h = hash(slug + 'x');
  const day = new Date(Date.UTC(2026, 7, 1) + (h % 62) * 86400000);
  const iso = day.toISOString().slice(0, 10);
  const time = `${String(h % 24).padStart(2, '0')}:${String((h >> 5) % 60).padStart(2, '0')}`;
  return T[lang].lastEdited(fmtDate(iso, lang), time);
}

// ---------- write ----------
const write = (rel, s) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
for (const lang of LANGS) fs.rmSync(path.join(ROOT, lang), { recursive: true, force: true });

const catMembers = { en: {}, ja: {} };
const index = { en: [], ja: [] };
for (const lang of LANGS) {
  for (const a of Object.values(ART[lang])) {
    const cats = [...a.categories];
    if (a.type === 'stub') cats.push('stubs');
    if (a.type === 'disambiguation') cats.push('disambig');
    for (const c of cats) {
      if (!CATS[c]) { warn(`${lang}/${a.slug}`, `unknown category "${c}"`); continue; }
      (catMembers[lang][c] ||= []).push(a);
    }
    a.cats = cats.filter((c) => CATS[c]);
    const doc = new Doc(lang, a.slug, '../../');
    const body = doc.render(a);
    const content = `<h1 class="firstHeading">${esc(a.title)}</h1><div class="tagline">${T[lang].from}</div><div class="mw-body${a.type === 'disambiguation' ? ' disambig' : ''}">${body}</div>${catLinks(a.cats, lang, '../../')}`;
    write(`${lang}/wiki/${a.slug}.html`, shell({ lang, relPath: `${lang}/wiki/${a.slug}.html`, title: a.title, content, bodyClass: 'article', lastEdited: editedLine(a.slug, lang) }));
    const text = body.replace(/<sup[\s\S]*?<\/sup>/g, '').replace(/<figure[\s\S]*?<\/figure>/g, ' ').replace(/<\/(p|li|h\d|div|ol|ul|td|th|caption)>/g, ' ').replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
    index[lang].push({ s: a.slug, t: a.title, d: a.short || '', r: a.reading || '', c: a.cats.map((c) => CATS[c][lang === 'ja' ? 1 : 0]), x: text });
    if (!a.short) warn(`${lang}/${a.slug}`, 'no short description');
    if (lang === 'ja' && !a.reading) warn(`${lang}/${a.slug}`, 'no reading');
  }
}

const sortKey = (a, lang) => (lang === 'ja' ? a.reading || a.title : a.title.replace(/^The /, ''));
const collator = { en: new Intl.Collator('en'), ja: new Intl.Collator('ja') };
const groupLetter = (a, lang) => {
  const k = sortKey(a, lang);
  if (lang === 'en') return k[0].normalize('NFD')[0].toUpperCase();
  const rows = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'];
  const c = k[0].replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  let g = rows[0];
  for (const r of rows) if (collator.ja.compare(c, r) >= 0) g = r;
  return /[a-zA-Z]/.test(c) ? c.toUpperCase() : g;
};
function groupedList(arts, lang, prefix) {
  const sorted = [...arts].sort((x, y) => collator[lang].compare(sortKey(x, lang), sortKey(y, lang)));
  const groups = {};
  for (const a of sorted) (groups[groupLetter(a, lang)] ||= []).push(a);
  return `<div class="mw-category">${Object.entries(groups).map(([g, list]) => `<div class="mw-category-group"><h3>${g}</h3><ul>${list.map((a) => `<li><a href="${prefix}${lang}/wiki/${a.slug}.html">${esc(a.title)}</a></li>`).join('')}</ul></div>`).join('')}</div>`;
}

for (const lang of LANGS) {
  const L = T[lang];
  const ja = lang === 'ja';
  // category pages
  for (const [c, members] of Object.entries(catMembers[lang])) {
    const name = CATS[c][ja ? 1 : 0];
    const content = `<h1 class="firstHeading"><span class="ns">${L.catPrefix}</span>${esc(name)}</h1><div class="tagline">${L.from}</div><div class="mw-body"><p class="cat-desc">${ja ? `このカテゴリには「${esc(name)}」に関する記事が含まれます。` : `This category contains articles about ${esc(name.charAt(0).toLowerCase() + name.slice(1)).replace(/^(harukawa|minori|asagiri|japanese|important|living|bays|railway|named|mayors|people|universities|museums|hot|tourist|traditional|castles|rivers|mountains|festivals|bridges|contactless|autumn|dormant|edo|citrus|cuisine|culture|climate|economy|agriculture|history|geography)/i, (w) => (['harukawa', 'minori', 'asagiri', 'japanese', 'edo'].includes(w.toLowerCase()) ? w.charAt(0).toUpperCase() + w.slice(1) : w))}.`}</p><h2>${L.pagesIn(esc(name))}</h2><p>${L.catHead(members.length)}</p>${groupedList(members, lang, '../../')}</div>`;
    write(`${lang}/category/${c}.html`, shell({ lang, relPath: `${lang}/category/${c}.html`, title: `${L.catPrefix}${name}`, content, tabs: 'article' }));
  }
  // categories overview
  const catList = Object.keys(catMembers[lang]).sort((x, y) => collator[lang].compare(CATS[x][ja ? 1 : 0], CATS[y][ja ? 1 : 0]));
  write(`${lang}/categories.html`, shell({ lang, relPath: `${lang}/categories.html`, title: L.allCats, tabs: 'none', content: `<h1 class="firstHeading">${L.allCats}</h1><div class="mw-body"><p>${ja ? '以下はオープンペディアのカテゴリの一覧です（記事数）。' : 'The following categories contain pages (number of pages in brackets).'}</p><ul class="cat-columns">${catList.map((c) => `<li><a href="category/${c}.html">${esc(CATS[c][ja ? 1 : 0])}</a> (${catMembers[lang][c].length})</li>`).join('')}</ul></div>` }));
  // all pages
  write(`${lang}/all-pages.html`, shell({ lang, relPath: `${lang}/all-pages.html`, title: L.allPages, tabs: 'none', content: `<h1 class="firstHeading">${L.allPages}</h1><div class="mw-body"><p>${ja ? `オープンペディア日本語版の全 ${Object.keys(ART[lang]).length} 記事を五十音順に表示しています。` : `All ${Object.keys(ART[lang]).length} articles in the English Openpedia, in alphabetical order.`}</p>${groupedList(Object.values(ART[lang]), lang, '../')}</div>` }));
  // search page
  write(`${lang}/search.html`, shell({ lang, relPath: `${lang}/search.html`, title: ja ? '検索結果' : 'Search results', tabs: 'none', bodyClass: 'special-search', content: `<h1 class="firstHeading">${ja ? '検索結果' : 'Search results'}</h1><div class="mw-body"><form class="search-page-form" action="search.html" method="get"><input type="search" name="q" class="search-page-input" aria-label="${L.search}"><button type="submit" class="search-btn primary">${L.searchBtn}</button></form><div id="search-results" class="search-results"><p class="muted">${ja ? '検索語を入力してください。' : 'Enter a search term.'}</p></div></div>` }));
  // random
  write(`${lang}/random.html`, shell({ lang, relPath: `${lang}/random.html`, title: L.random, tabs: 'none', content: `<h1 class="firstHeading">${L.random}</h1><div class="mw-body"><p id="random-msg">${ja ? 'ランダムな記事に移動しています…' : 'Taking you to a random article…'}</p><noscript><ul>${Object.values(ART[lang]).map((a) => `<li><a href="wiki/${a.slug}.html">${esc(a.title)}</a></li>`).join('')}</ul></noscript><script>(function(){var s=${JSON.stringify(Object.keys(ART[lang]))};location.replace('wiki/'+s[Math.floor(Math.random()*s.length)]+'.html');})();</script></div>` }));
  // about
  const doc = new Doc(lang, 'about', '../');
  const about = MAIN.about[lang].map((s) => (s.startsWith('== ') ? (() => { const t = s.replace(/^==\s*|\s*==$/g, ''); const [id, txt] = t.split('::'); return `<h2 id="${id}"><span class="mw-headline">${esc(txt)}</span></h2>`; })() : `<p>${doc.restore(doc.inline(s))}</p>`)).join('\n');
  write(`${lang}/about.html`, shell({ lang, relPath: `${lang}/about.html`, title: L.about, content: `<h1 class="firstHeading">${L.about}</h1><div class="tagline">${L.from}</div><div class="mw-body">${about}</div>` }));
  // main page
  write(`${lang}/index.html`, shell({ lang, relPath: `${lang}/index.html`, title: L.mainPage, htmlTitle: ja ? 'オープンペディア - フリー百科事典' : 'Openpedia, the free encyclopedia', tabs: 'main', bodyClass: 'main-page', content: mainPage(lang) }));
  // search index
  write(`assets/search-${lang}.json`, JSON.stringify(index[lang]));
}

function mainPage(lang) {
  const M = MAIN[lang];
  const doc = new Doc(lang, 'index', '../');
  const r = (s) => doc.restore(doc.inline(s));
  const box = (cls, title, inner) => `<div class="mp-box ${cls}"><h2 class="mp-h2">${title}</h2><div class="mp-inner">${inner}</div></div>`;
  const img = (file, cap, w = 140) => `<figure class="mp-img"><a href="../assets/img/${file}"><img src="../assets/img/${file}" alt="${esc(cap)}" width="${w}"></a></figure>`;
  const fa = `${img(M.featured.image, M.featured.imageAlt)}<p>${r(M.featured.text)}</p><p class="mp-more">${r(M.featured.more)}</p>`;
  const dyk = `${img(M.dyk.image, M.dyk.imageAlt, 110)}<ul>${M.dyk.items.map((s) => `<li>${r(s)}</li>`).join('')}</ul><p class="mp-more">${r(M.dyk.more)}</p>`;
  const itn = `${img(M.news.image, M.news.imageAlt, 110)}<ul>${M.news.items.map((s) => `<li>${r(s)}</li>`).join('')}</ul><p class="mp-ongoing">${r(M.news.ongoing)}</p><p class="mp-more">${r(M.news.more)}</p>`;
  const otd = `<p><b>${M.onThisDay.date}</b>: ${r(M.onThisDay.lead)}</p><ul>${M.onThisDay.items.map((s) => `<li>${r(s)}</li>`).join('')}</ul><p class="mp-more">${r(M.onThisDay.more)}</p>`;
  const potd = `<figure class="potd"><a href="../assets/img/${M.picture.image}"><img src="../assets/img/${M.picture.image}" alt="" width="640"></a><figcaption>${r(M.picture.caption)}</figcaption></figure>`;
  const other = `<ul class="mp-portals">${M.portals.map(([head, ids]) => `<li><b>${head}</b>: ${ids.filter((c) => catMembers[lang][c]).map((c) => `<a href="category/${c}.html">${esc(CATS[c][lang === 'ja' ? 1 : 0])}</a>`).join(' · ')}</li>`).join('')}</ul>`;
  return `<div class="mp-welcome"><h1>${r(M.welcome)}</h1><p>${r(M.welcomeSub)}</p></div>
<div class="mp-cols"><div class="mp-left">${box('mp-tfa', M.featured.title, fa)}${box('mp-dyk', M.dyk.title, dyk)}</div><div class="mp-right">${box('mp-itn', M.news.title, itn)}${box('mp-otd', M.onThisDay.title, otd)}</div></div>
${box('mp-tfp', M.picture.title, potd)}${box('mp-other', M.portalsTitle, other)}`;
}

// root redirect, charts, favicon
write('index.html', `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Openpedia</title><meta http-equiv="refresh" content="0; url=en/index.html"></head>
<body><p><a href="en/index.html">Openpedia (English)</a> · <a href="ja/index.html">オープンペディア（日本語）</a></p>
<script src="/unilens.js"></script>
<script>UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })</script>
</body></html>
`);
for (const lang of LANGS) {
  for (const [id, fn] of Object.entries(charts)) write(`assets/charts/${id}.${lang}.svg`, fn(lang, DATA));
  for (const place of MAP_PLACES) write(`assets/charts/map-${place}.${lang}.svg`, maps(place, lang));
}
write('assets/favicon.svg', LOGO.replace('class="logo-mark" ', 'xmlns="http://www.w3.org/2000/svg" '));

const counts = LANGS.map((l) => `${l}: ${Object.keys(ART[l]).length} articles, ${Object.keys(catMembers[l]).length} categories`).join('; ');
console.log(`Built Openpedia (${counts}).`);
for (const s of PLANNED) for (const l of LANGS) if (!ART[l][s]) warn(`${l}/${s}`, 'planned article not written yet');
const uniq = [...new Set(warnings)].sort();
if (uniq.length) { console.log(`${uniq.length} warning(s):`); for (const w of uniq) console.log('  ' + w); }
