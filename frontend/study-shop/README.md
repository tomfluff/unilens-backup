# Marketa (マルケタ): study site for shopping

A fictional Amazon-like marketplace for UniLens user studies, served on port 8033 (`make serve-frontend study-shop`). English in `en/`, Japanese in `ja/`, the same pages at the same paths. It is set in the shared world of `frontend/STUDY-SITES.md`. Today on the site is **Monday 5 October 2026, 10:40**. The shopper is Aki Mori in Harukawa, who is not a Marketa Fast member.

## Pages (55 per language, 110 in all)

- `index.html`: the home page, with a hero deals carousel, four promo cards, department tiles, "Recommended for you", a sponsored banner, browsing history (from localStorage), best sellers in Kitchen and Electronics, and festival gifts.
- `p/<id>.html`: **32 products** in 6 departments and 8 groups of four similar items:
  - **Kitchen:** kettles and rice cookers (including a Harukawa ware donabe).
  - **Home & Tableware:** Harukawa ware.
  - **Electronics:** headphones and power banks.
  - **Sports & Outdoors:** rain jackets.
  - **Health & Beauty:** yuzu bath and body.
  - **Food & Gifts:** local food and gifts.

  Each product page has:
  - a gallery, price, list price and discount, points, and a coupon to clip;
  - options with their own price, stock and delivery;
  - a buy box with delivery to Harukawa, ships-from/sold-by and returns;
  - "About this item" and "Frequently bought together";
  - a comparison with 3 similar items and a sponsored row;
  - a spec table, description and extra tables (size charts and the like);
  - a 90-day price history chart (an `<img>` whose alt text is just "chart");
  - Q&A you can search, 10–13 reviews with a star histogram filter and sort, and "also viewed".
- `c/<department>.html` (6) and `search.html?q=`: listings built on the client from `assets/data/index-<lang>.json`.
  - Filters: department or group, delivery day, rating, brand, price range, on sale, coupon, and seller or local seller.
  - Sort orders, pagination of 6 per page, and one sponsored result.
- `cart.html`: the basket, kept in localStorage and grouped by who ships it.
- `checkout.html`: address, a delivery options table, payment, then review. It includes the Fast free-trial option and payment limits.
- `confirmation.html`: the mock order. Nothing is charged.
- `deals.html`: Lightning Deals with how much is claimed, the Deal of the Day, upcoming deals, all discounts, and coupons with their terms.
- `seller/kagami.html`, `seller/minori.html`, `seller/brightdeal.html`: tabs for about, shipping, returns, contact and legal notice, plus products and feedback.
- `orders.html`: 7 past orders plus any orders placed in this browser. One is a made-to-order item, one a delayed parcel, one a return in progress, and one a cancelled convenience-store order.
- `track.html`: a delayed delivery timeline and a return timeline.
- `help/`: `index`, `shipping` (rates by region and speed, cut-offs), `returns` (time limits, restocking fee, exceptions, who pays, refund timing), `fast` (fees, benefits, trial conditions), `payment`, and `faq` (30 questions).

## Rebuild

```bash
node build.mjs        # from this folder; Node standard library only
```

The build regenerates `en/`, `ja/`, `assets/data/`, `assets/charts/` and `index.html` from `content/`. It also checks the content and prints warnings: unknown product ids, missing images, histograms that don't sum to 100, review counts, and variant ids.

- `content/site.mjs`: departments, home page, deals, the mock account, orders and tracking.
- `content/products/<group>.mjs`: the products. The fields are described in the Corvo kettle in `kettles.mjs`.
- `content/help.mjs` and `content/sellers.mjs`: the help centre and the three seller pages.
- The page templates, delivery rules and price-history charts are in `build.mjs`; the styles are in `assets/css/site.css`; the basket, options, filters and checkout are in `assets/js/site.js`.

## Images

35 product photos were made with Codex image generation (gpt-6.1-sol): one per product, plus a second angle for the Hearth kettle (lid open), the Kagami donabe (with cooked rice) and the Northpine jacket (packed in its pouch). They are in `assets/img/*.jpg` (2.5 MB in all, each under 200 KB). The PNG originals, the generation script `gen-images.sh` and its prompts are in `/home/yotam/projects/unilens/.local/study-sites-src/shop/`. The logo, favicon and price charts are SVG drawn by the build.

## Checks

- Crawl: every page in both languages loads; every same-origin link and image resolves; all anchors exist; no console errors from site scripts; the language switch lands on the same page; nothing external is requested; the UniLens scripts come last in `<body>`.
- Flow test, in both languages: choose an option, add to basket, filter, search, basket, checkout with the trial, place the order, then see it in the order history.
- The scripts are in the session scratchpad. Screenshots are in `.local/study-sites-src/shop/shots/`.
- UniLens loads on every page. The bundle copied from `main` (0658cf3) draws its gear as a button in `#unilens-settings-root`. It has no `.ul-set-launch` class; that class only exists in newer builds.
