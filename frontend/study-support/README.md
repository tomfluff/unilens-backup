# Kumo Mobile Support (クモモバイル サポート)

A mock support and procedures site of a fictional national mobile carrier, for UniLens user studies (see `../STUDY-SITES.md`). Port 8031: `make serve-frontend study-support`. Study tasks: `STUDY-NOTES.md`.

## Pages (39 in English, the same 39 in Japanese, same paths under `en/` and `ja/`)

- `index.html`: home (notices carousel, service status strip, search, popular procedures, notices, plans, PR banners)
- **Plans:** `plans/index.html` (comparison table of 4 plans, price chart, family discount, home internet bundle, under-22 discount, fine print), `plans/mini.html`, `plans/basic.html`, `plans/unlimited.html`, `plans/senior.html`, `plans/options.html` (call options, extra data, Device Care tiers, other options), `plans/roaming.html` (rates by zone)
- **Procedures:** `procedures/index.html`, `switch-to-kumo.html` (MNP, flow diagram), `new-contract.html` (ID documents, minors), `change-plan.html`, `esim.html` (iPhone/Android tabs), `sim-card.html` (SIM tray diagram), `data-usage.html` (usage chart), `lost-phone.html` (flow diagram), `repair.html`, `cancel.html`, `change-details.html`, `transfer.html`
- **Billing:** `billing/index.html` (payment methods, dates, late payment), `billing/read-your-bill.html` (annotated sample bill SVG, bill breakdown chart), `billing/fees.html`
- `network.html` (coverage map of Minori Prefecture, 5G by prefecture and municipality, speed chart as `<img>` with alt "graph"), `status.html` (incidents, maintenance)
- **Shops:** `shops/index.html`, `shops/harukawa-central.html`, `shops/appointments.html` (mock booking form)
- `contact.html`, `faq.html` (51 questions in 9 categories), `my-kumo.html`, `forms/index.html`, `forms/checklist.html`, `search.html`
- **Notices:** `news/index.html` (11 notices) and 4 detail pages: `price-revision-2026.html`, `maintenance-october-2026.html`, `scam-sms-warning.html`, `3g-service-end.html`

Every page has a language switch, breadcrumbs, a section sidebar with PR banners, related links, a cookie banner, a mock chat button (bottom right) and UniLens last in `<body>`.

## Rebuild

```bash
node build.mjs
```

- `content/shared.mjs`: every number shared by both languages (plans, discounts, fees, roaming, shops, network data, sample bill), the HTML helpers and the SVG chart and diagram generators.
- `content/en/*.mjs`, `content/ja/*.mjs`: page text per section; each exports `pages` (path → title, lead, body, related). `common.mjs` holds the header, footer and other interface text.
- `build.mjs` writes `en/`, `ja/`, `assets/search-en.json`, `assets/search-ja.json` and `assets/charts/speeds-*.svg`. `assets/site.css` and `assets/site.js` are hand-written.

## Images

Ten photos made with Codex image generation (gpt-6.1-sol), PNG originals in `unilens/.local/study-sites-src/support/`, JPEGs in `assets/img/`: `hero-phones`, `shop-interior`, `sim-tray`, `senior-hands`, `cracked-screen`, `lost-phone`, `travel-roaming`, `home-router`, `esim-setup`, `station-shop`.

Charts and diagrams drawn as SVG by the build: plan price by data used, average data use by plan, sample bill by category, average download speed (as `<img>`), coverage map, SIM tray diagram, annotated sample bill, flow diagrams (switching, lost phone).

## Checks

Scripts in `unilens/.local/study-sites-src/support/`: `crawl.mjs` (every page in both languages: links, anchors, images, console errors, language switch, UniLens gear), `shots.mjs` (screenshots into `shots/`).
