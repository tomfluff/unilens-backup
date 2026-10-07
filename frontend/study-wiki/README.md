# Openpedia (study-wiki)

A mock encyclopedia for UniLens user studies: "reading and looking things up". A classic wiki skin (left sidebar, Article/Talk and Read/Edit/View history tabs, infoboxes, tables of contents, footnotes, categories) with about 30 interlinked articles about the fictional city of Springvale and Harvest Prefecture, in English and Japanese. Served on port 8032:

```bash
make serve-frontend study-wiki        # or, from the repo root:
npx live-server frontend/study-wiki --port=8032 --no-browser
```

## Pages (same paths under `en/` and `ja/`)

- `index.html`: main page (featured article, Did you know, In the news, On this day for 4 October, picture of the day, browse by category). The root `index.html` redirects to `en/index.html`.
- `wiki/<slug>.html`: 30 articles.
  - Long (2,000+ words): `harukawa`, `harukawa-castle`, `history-of-harukawa` (timeline), `harukawa-ware`, `harukawa-lantern-festival`.
  - Medium: `minori-prefecture`, `kagami-river`, `minori-bay`, `climate-of-harukawa` (climate table and chart), `economy-of-harukawa` (sector and visitor charts), `asagiri-clan`, `tetsuo-saeki` (mayor), `hanae-ishizuka` (potter), `michiyo-tono` (novelist), `kenzo-hattori` (railway engineer), `harukawa-university`, `harukawa-railway`, `kagami-line` and `bayside-line` (station tables), `tsukikage` (rolling stock), `harukawa-central-station`, `cuisine-of-harukawa` (dish table), `yuzu-cultivation-in-minori`, `mount-tsukimi`, `tsukimi-onsen`, `minori-prefectural-museum-of-art`.
  - Stubs (with a stub notice): `kagami-bridge`, `tsukimi-tunnel`, `haruca`.
  - Disambiguation: `kagami`.
- `category/<id>.html`: one page per category (44), plus `categories.html` (all categories) and `all-pages.html` (A–Z / 五十音順).
- `search.html?q=`: results filtered on the client from `assets/search-<lang>.json`; an exact title match jumps to the article (add `&fulltext=1` to list results instead). The header search box shows suggestions as you type. Red links (`[[?Title]]`) go to `search.html?q=Title&redlink=1`, which says the page does not exist.
- `random.html`: jumps to a random article. `about.html`: about, help, citations, privacy, disclaimers.

Static on purpose: the Talk, Edit and View history tabs, section "edit" links, Create account and Log in show a "read-only" toast. A fundraising banner appears on the main page and articles until closed (remembered in localStorage).

## Rebuild

```bash
node build.mjs          # from this folder; prints warnings (unknown links, categories, images, anchors)
```

- `content/en/<slug>.txt`, `content/ja/<slug>.txt`: one article per language, same slug. Header lines (`title:`, `short:`, `reading:` (Japanese only, used for sorting and search), `type: article|stub|disambiguation`, `categories:` ids separated by `;`, `hatnote:`, `infobox:`, `ib-subtitle:`, `ib-image: file | caption`, `ib-map: place | caption`, `ib-section:`, `ib: label | value`), a line `---`, then the body in a small wikitext dialect:
  - `== Heading ==` / `=== Sub ===` (a table of contents is added for 3+ headings); `'''bold'''`, `''italic''`; `* ` and `# ` lists.
  - Links `[[slug]]`, `[[slug|text]]`, `[[slug#Section heading|text]]`; red links `[[?Title]]`.
  - Figures on their own line: `[[File:castle-02.jpg|left|Caption]]`, `[[Chart:climate|Caption]]`, `[[Map:mount-tsukimi|Caption]]`.
  - Footnotes `<ref>…</ref>`, `<ref name="x">…</ref>` / `<ref name="x"/>`, notes `{{efn|…}}`, `{{cn}}`; lists of them with `{{reflist}}` and `{{notelist}}`.
  - Hatnotes `{{main|slug}}`, `{{see|slug|slug}}`; `{{quote|text|source}}`.
  - Tables: `{| Caption`, then one row per line (`! a !! b` header, `| a || b` cells), then `|}`. Generated tables: `{{Data:climate}}`, `{{Data:population}}`, `{{Data:sectors}}`, `{{Data:kagami-stations}}`, `{{Data:bayside-stations}}`.
- `content/data.json`: the numbers behind the generated tables and charts (climate normals, population, GDP by sector, visitors, festival attendance, yuzu, pottery output, ridership, both station lists).
- `content/categories.json`: category ids and their English and Japanese names.
- `content/main.json`: main page and about page text.
- `build.mjs` writes `en/`, `ja/`, `assets/search-*.json`, `assets/charts/*.svg` and `assets/favicon.svg`; `charts.mjs` draws the SVG charts, the route map, the castle plan and the locator maps. `assets/wiki.css` and `assets/wiki.js` are hand-written.

## Images

Twenty photographs generated with Codex image generation (`gpt-6.1-sol`), converted to JPEG under 200 KB in `assets/img/` (PNG originals in `.local/study-sites-src/wiki/`, outside the repo): `castle-01` (keep across the moat), `castle-02` (Tatsumi Turret in mist), `river-01` (Mirror River through the city), `lanterns-01` (floating lanterns), `lanterns-02` (lantern street), `ware-01` (kasumi-glaze tea bowl), `ware-02` (jar with river-line brushwork), `kiln-01` (climbing kiln), `dish-01` (sea bream rice), `dish-02` (lantern buns), `dish-03` (oyster hot pot), `train-01` (Comet on a truss bridge), `train-02` (local train at a rural station), `station-01` (Springvale Central), `mountain-01` (Mount Moonview), `onsen-01` (Moonview Spa), `university-01` (Old Main Building), `museum-01` (Museum of Art), `yuzu-01` (yuzu terraces), `bay-01` (oyster rafts on Harvest Bay).

Charts and diagrams (SVG, drawn by the build, per language): `climate`, `population`, `sectors`, `visitors`, `festival`, `yuzu`, `ware-output`, `ridership`, `railmap` (route diagram), `castle-plan`, and locator maps of the prefecture (`map-<place>`). Charts are shown as `<img>` with no useful alt text (empty, "chart", "graph" or the file name), as on many real sites; most have the same numbers in a table nearby, some do not (the yuzu, ware-output and ridership charts carry values only as small bar labels).
