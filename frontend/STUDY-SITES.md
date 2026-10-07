# Study sites: mock websites for UniLens user studies

Six small, realistic, information-dense websites for studies of UniLens, each a frontend target of its own (`make serve-frontend study-<slug>`). They are fictional, set in one fictional place, so participants and the assistant cannot answer from prior knowledge: the answers are on the page. English first, every page also in Japanese.

| Site | Folder | Port | Kind of web task |
|---|---|---|---|
| Kumo Mobile Support | `study-support` | 8031 | Following instructions and procedures: plans, fees, step-by-step guides, FAQs (like the SoftBank mirror) |
| Openpedia | `study-wiki` | 8032 | Reading and looking things up: an encyclopedia of interlinked articles |
| Marketa | `study-shop` | 8033 | Shopping: search, compare, read reviews, buy |
| Harukawa Railway | `study-transit` | 8034 | Planning: timetables, fares, route map, booking a seat |
| Harukawa Nippō (The Harukawa Herald) | `study-news` | 8035 | Keeping up: news articles, live updates, charts, weather |
| Daily Table | `study-recipes` | 8036 | Doing a task while reading: recipes, steps, conversions |

Each site's `STUDY-NOTES.md` lists 15 or so candidate study tasks (English and Japanese) with where the answer is and the answer; its `README.md` lists its pages and how to rebuild it. The railway site is the source of truth for railway facts and the support site for Kumo Mobile's; the news site and Openpedia follow them.

## The shared world (keep every site consistent with it)

- **Harukawa** (春川市, Harukawa-shi): a fictional city of 412,800 people (2025) in fictional **Minori Prefecture** (みのり県), on the **Kagami River** (鏡川) where it meets **Minori Bay** (みのり湾). A castle town since 1603: **Harukawa Castle** (春川城). Known for **Harukawa ware** pottery (春川焼), yuzu, and the **Harukawa Lantern Festival** (春川灯籠まつり), the second weekend of October. **Mount Tsukimi** (月見山, 1,214 m) and the hot-spring town **Tsukimi Onsen** (月見温泉) lie inland. **Harukawa University** (春川大学, founded 1949).
- **Harukawa Railway** (春川鉄道, "HaruTetsu"): the **Kagami Line** (鏡線, 14 stations, Harukawa Central to Tsukimi Onsen, 38.6 km) and the **Bayside Line** (湾岸線, 9 stations, Harukawa Central to Minori Port, 16.2 km); the limited express **Tsukikage** (特急「月影」); the IC card **HaruCa** (ハルカ). Fares from ¥170.
- **Kumo Mobile** (クモモバイル): a national mobile carrier with a shop at Harukawa Central.
- **Marketa** (マルケタ): an online marketplace. **Daily Table** (デイリーテーブル): a recipe site. **Openpedia** (オープンペディア): an encyclopedia. **Harukawa Nippō** (春川日報): the local newspaper; its English edition is The Harukawa Herald.
- Today is in early October 2026. Prices are in yen on every site, English pages included.
- Where a site mentions another (a news story about the railway, an encyclopedia article on the festival), the facts must agree with this list. Anything not listed is the site's own to invent, as long as it stays plausible and consistent within the site.

## Technical rules (all sites)

- **Static, multi-page, no dependencies.** Plain HTML, CSS and a little vanilla JS. No frameworks, no CDNs, no web fonts, no requests to other origins at runtime (the assistant captures the page; a cross-origin image breaks that). Generate the pages with a Node script using only the standard library (`build.mjs` in the site folder) from content files, and keep the generated HTML in the folder: the folder is served as is.
- **Layout of a site folder:** `index.html` (sends the visitor to `en/`), `en/…` and `ja/…` (the same pages, the same paths), `assets/` (CSS, JS, images, charts), `build.mjs`, `content/` (the site's data, English and Japanese), `README.md`, `STUDY-NOTES.md`. Leave `unilens.js`, `unilens.js.map`, `accessibility.js` and `accessibility.js.map` in the folder root alone: they are copied in by `make bundle`.
- **Languages:** `<html lang="en">` and `<html lang="ja">`; every page links to the same page in the other language (a language switch in the header). The Japanese is complete and natural, written as a Japanese site would write it, not translated word for word.
- **UniLens on every page,** last in `<body>`:
  ```html
  <script src="/unilens.js"></script>
  <script>UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })</script>
  ```
- **Search:** a search box in the header; a `search.html?q=` page filtering a generated JSON index on the client.
- **Images:** photographs and illustrations made with Codex image generation (below); charts and diagrams drawn as SVG by the build script. Some charts are shown as `<img>` with no useful alt text, as many real sites do.
- A small footer line on every page: "Fictional website made for research (UniLens user study)." / 「研究用に作成した架空のウェブサイトです（UniLens ユーザー調査）。」

## Design: an ordinary website, not an accessible one

Design each site the way an average commercial or public website of its kind is designed, with the accessibility of an average website: realistic, attractive, dense. Do not optimise for low vision, and do not break things on purpose either. Typical of the real web, and wanted here: body text around 13–15 px, grey secondary text, small links and icon-only buttons, a sticky header, hover menus, tabs and accordions, carousels, a cookie banner, promotional banners or ads in a sidebar, long footers, tables wider than the screen at high zoom. Each site has its own visual identity (colours, type scale, logo drawn in SVG or CSS) matching its kind.

## Content: dense, interlinked, interesting to ask about

The study needs pages worth asking an assistant about: many details, numbers, conditions and exceptions, things spread across pages, comparisons, tables and charts, FAQs, fine print. Every page has real content (no lorem ipsum, no "coming soon"). Cross-link generously (related pages, breadcrumbs, "see also", category pages).

## Images with Codex

Codex (`gpt-6.1-sol`, through the ChatGPT plan) generates images with its image tool and saves them where asked. About a minute per image. Ask for up to 5 images per call, run one call at a time, and retry a failed call once:

```bash
SRC=/home/yotam/projects/unilens/.local/study-sites-src/<slug>
mkdir -p $SRC && cd $SRC && codex exec -m gpt-6.1-sol -c model_reasoning_effort=low \
  --sandbox workspace-write --skip-git-repo-check \
  "Generate these images with your image generation tool and save each in the current directory as PNG with the given file name: 1) kettle-01.png: <description>; 2) … Photorealistic, no text, no logos, no real brands. Reply with the saved file names only." < /dev/null
```

Then convert each to JPEG in the site: `ffmpeg -y -loglevel error -i $SRC/kettle-01.png -vf "scale='min(1000,iw)':-2" -q:v 5 assets/img/kettle-01.jpg` (keep each under about 200 KB; the PNG originals stay in `.local/study-sites-src/`, out of the repo). No text in generated images (it comes out garbled), no real brands, no real people. Up to about 30 images per site; prefer fewer, good ones. If image generation fails twice, draw an SVG illustration instead and say so in the report.

## Checks before reporting

- Serve the folder: `npx live-server frontend/study-<slug> --port=<port> --no-browser &` (from `/home/yotam/projects/unilens-study`).
- Crawl every page in both languages with Playwright (`import { chromium } from "/home/yotam/.claude/skills/gstack/node_modules/playwright-core/index.mjs"`): every link and image resolves, no console errors from the site's own scripts, the language switch lands on the same page.
- Screenshot about eight pages (both languages) into `.local/study-sites-src/<slug>/shots/` and look at them.
- Check that UniLens loads: its gear button (`#unilens-settings-root button`) appears at the bottom left of a page, and an Alt+click opens the chat with a captured place.

## Deliverables per site

- The site in `frontend/study-<slug>/`, built and checked.
- `README.md`: what the site has (page list), how to rebuild it, the images made.
- `STUDY-NOTES.md`: 10 to 15 candidate study tasks in English and Japanese, each a realistic question or goal a participant might bring ("Which plan is cheapest for 5 GB with a family discount?"), with where the answer is, why it is interesting for an assistant (spread across pages, in a chart, in fine print, needs comparing), and the answer itself.
- Do not commit, and do not change anything outside the site's folder and its `.local/study-sites-src/<slug>/` folder.
