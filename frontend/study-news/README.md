# Springvale Herald / The Springvale Herald (study-news)

A mock local-newspaper website for UniLens user studies (port 8035): a dense front page, section pages, 23 articles, a typhoon live blog, a weather page, charts and tables, a cookie banner, a newsletter pop-up, ads, comments and a paywall. Fictional, set in Springvale (see `../STUDY-SITES.md`). Every page exists in English (`en/`) and Japanese (`ja/`) at the same path. Site "now" is Sunday 4 October 2026, about 18:00 JST.

Serve: `make serve-frontend study-news`, or `npx live-server frontend/study-news --port=8035 --no-browser`.

## Pages (per language, 60 pages)

- `index.html`: front page (live typhoon lead, latest list, top stories, section blocks, opinion, a photo carousel, most read/most commented tabs, a weather widget, ads)
- `section/<id>.html`: Local, Politics, Business, Science & Tech, Health, Sports, Culture, Opinion. Weather is `weather.html`
- `articles/<id>.html`: 23 articles (below)
- `live/typhoon-21.html`: live blog, 28 timestamped updates (newest first), a pinned summary, category filter chips, a shelters table
- `weather.html`: warnings (accordions), today's details, a 24-hour chart (`<img alt="">`), a 7-day table, the typhoon track map (inline SVG), tides
- `tag/<id>.html`: 21 topic pages; `archive.html` (by date, 21 Sep – 4 Oct); `search.html?q=` (client-side, `search-index.json`)
- `corrections.html`, `about.html`, `subscribe.html` (plans table, FAQ accordions, newsletters)

Articles: festival-road-closures (SVG map + closures table), lantern-workshop, crowd-sensors, embankment-works, railway-timetable, central-library, city-budget (3 charts/tables), mayoral-election-poll (candidates table, 2 charts), water-rates, kumo-mobile-prices (table + chart), harukawa-ware-exports (paywall), port-cargo (paywall), seagrass-research (chart), flu-vaccination (table + chart), pediatric-night-clinic, seagulls-clinch (standings, line score, batting, pitching), castle-marathon, museum-review, typhoon-forecast, editorial-embankment, column-timetable (paywall), column-library, correction-library-date. Four articles carry correction notes; eight have comments.

Charts (SVG, drawn by `build.mjs` into `assets/charts/`): budget by purpose and seagrass area are inline SVG with a title; budget revenue, election poll, election issues, Kumo prices, ware exports, port monthly, flu weekly, the hourly weather chart and the festival map are `<img>` with empty or useless alt text ("chart", "graph", "image", "Springvale ware", "Map"), on purpose.

## Rebuild

```bash
node build.mjs          # writes en/, ja/, assets/charts/, index.html; prints warnings for broken refs
node build.mjs --stats  # also prints word counts (English words, Japanese characters)
```

Content: `content/site.mjs` (articles' metadata, sections, tags, authors, tables, chart data, weather, corrections), `content/pages.mjs` (interface strings, ads, fixed pages), `content/articles/<id>.<lang>.md` and `content/live.<lang>.md` (text). Markup: `## ` subheadings, `> quote -- Name` pull quotes, `!! Title` fact boxes, `- ` lists, `**bold**`, `[text](article-id | tag:id | page:live)`, `[[table:id]]`, `[[chart:id]]`, `[[map:festival]]`, `[[photo:name|caption]]`, `[[paywall]]` (nothing after it is published), and `=== correction` / `=== comments` sections.

## Images

23 photographs made with Codex image generation (`gpt-6.1-sol`), JPEGs in `assets/img/` (PNG originals in `.local/study-sites-src/news/`): river-works, lanterns-street, lantern-workshop, library-interior, council-chamber, baseball-night, bay-storm, train-bridge, station-rain, pottery, port-cranes, smartphones, seagrass, vaccine, museum, sandbags, castle, runners, city-hall, riverside-path, lamp-sensor, clinic-night, water-main. The logo and favicon are SVG.
