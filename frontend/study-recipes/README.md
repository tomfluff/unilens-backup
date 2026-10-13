# Daily Table (デイリーテーブル) — study site

A fictional recipe website for UniLens user studies: choosing a dish, then cooking it while reading (following steps, scaling quantities, converting units, checking substitutions). Set in Springvale, Harvest Prefecture (see `../STUDY-SITES.md`). Served on port 8036: `make serve-frontend study-recipes`.

## Pages (48 per language, the same paths under `en/` and `ja/`)

- `index.html` — home: carousel, autumn recipes, categories, popular this week, meal-plan teaser, collections, guides.
- `recipes/index.html` — all recipes with category tabs; `recipes/<slug>.html` — 22 recipes (below).
- `category/<key>.html` — 6 categories: japanese, harukawa, western, weeknight, baking, vegetarian.
- `collections/index.html` and 5 collections: thirty-minute-dinners, cooking-for-two, lantern-festival-snacks, yuzu-season, make-ahead-autumn.
- `guides/index.html` and 7 guides: knife-cuts, measurement-conversions, oven-temperatures, rice-water-ratios, seasonal-produce, pantry-staples, dashi.
- `meal-plan.html` (week of 5 October 2026, a wide table and an inline chart), `shopping-list.html` (built on the client from chosen recipes), `search.html?q=` (filters: time, diet, cuisine, difficulty; sort), `about.html` (#advertising, #privacy, #contact).

Recipes: nikujaga, chicken-karaage, tamagoyaki, saba-misoni, kinoko-takikomi-gohan, agedashi-tofu, minato-nabe, yuzu-miso-salmon, yuzu-kosho, chochin-dango, daigaku-imo, hamburg-steak, beef-stew, kabocha-soup, ginger-pork, oyakodon, wafu-mushroom-pasta, sheet-pan-miso-chicken, milk-bread, yuzu-pound-cake, kabocha-pudding, autumn-vegetable-curry.

Each recipe page: a 400–580 word story with subheadings and buried tips, two in-text ads, "Jump to Recipe", print and shopping-list buttons, then a recipe card (prep/cook/extra/total times, servings scaler with 1x/2x/3x, Metric/US switch, ingredient groups with tick boxes, equipment, numbered steps with timers and some step photos, notes, substitutions table, make-ahead, storage, nutrition table and a macro chart image), a rating summary with distribution bars, 7–8 comments with author replies, a comment form and related recipes. A newsletter pop-up opens once per session on recipe pages (after 40 s or at 45% scroll); a cookie box sits bottom right.

## Rebuild

```bash
node check.mjs            # validate content/recipes/*.json (also run by the build)
node build.mjs            # writes en/, ja/, assets/data/, assets/charts/
```

`build.mjs` uses only the Node standard library. If the image originals exist in `/home/yotam/projects/unilens/.local/study-sites-src/recipes/`, it converts new or changed PNGs to `assets/img/*.jpg` (max 1000 px wide, under 200 KB) and `assets/img/thumb/*.jpg` (480 px) with ffmpeg.

## Files

- `content/recipes/<slug>.json` — one recipe, both languages (schema in `check.mjs`). Ingredient amounts are numbers with a metric unit; `us` gives a US cup/spoon equivalent for dry goods, everything else converts automatically.
- `content/site.mjs` — interface strings, categories, collections, ads, home, meal plan, about. `content/guides.mjs` — guides, knife cuts and chart data.
- `charts.mjs` — SVG charts and diagrams; `assets/js/units.js` — amount formatting shared by the build and the browser.
- `assets/js/site.js` (menus, carousel, cookie box, pop-up, tabs, search), `recipe.js` (scaler, units, timers, cook mode, rating), `shopping.js` (shopping list). Lists and settings are kept in `localStorage`.
- `unilens.js`, `accessibility.js` and their maps are copied in by `make bundle`; leave them alone.

## Charts and diagrams (SVG, drawn by `charts.mjs`)

- Rice-to-water bar chart (`<img alt="">`), cup-weight bar chart (`alt="chart"`), oven temperature scale (`alt=""`), Harvest Prefecture seasonal produce calendar (`alt="calendar"`), dashi temperature timeline (`alt=""`), a macro donut per recipe and language (`alt=""`), 12 knife-cut diagrams (`alt="diagram"`). The meal-plan chart is inline SVG with a text alternative.

## Images (Codex `gpt-6.1-sol` image generation)

30 photos, originals in `.local/study-sites-src/recipes/` (scripts `gen.sh`, `gen2.sh`): 22 finished dishes (one per recipe, named after the slug), plus `dashi`, `milk-bread-dough-before`, `milk-bread-dough-after`, `karaage-first-fry`, `tamagoyaki-rolling`, `yuzu-kosho-grinding`, `chochin-dango-shaping`, `kabocha-pudding-caramel` (step and guide photos). Step photos have empty alt text.
