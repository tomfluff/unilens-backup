# Springvale Railway (春川鉄道) — study site

English pages use English names (Springvale, the Comet, Moonview Spa…; Yotam, 2026-10-07: participants found the Japanese names hard to say and to catch); the Japanese pages keep the Japanese names. Each station's old romaji is kept as `romaji` in `content/data.mjs` for the Japanese station pages.

A fictional regional railway website for UniLens user studies (planning tasks: timetables, fares, route map, seat booking). Port 8034: `make serve-frontend study-transit`. English under `en/`, Japanese under `ja/`, same paths; `index.html` redirects by browser language.

## Rebuild

```bash
node build.mjs   # Node standard library only; rewrites en/, ja/, assets/data/, assets/charts/
```

`build.mjs` also asserts that the facts quoted in the prose (last trains, Comet numbers, fares, lists of stations) still match the generated timetable, so the build fails if `content/data.mjs` and the text drift apart.

- `content/data.mjs`: stations (km, platforms, step-free access, facilities, ridership), running patterns, the service plan (departure times per day type), fares, surcharges, service status. Every timetable, the planner, the fare tables and the station pages come from it.
- `content/pages-en.mjs`, `content/pages-ja.mjs`: prose pages (tickets, Comet, rules, FAQ, trips, notices), with tables filled from the data.
- `assets/js/site.js`: tabs, carousel, cookie banner, timetable popovers, journey planner (connection scan over the generated trains), fare calculator, seat reservation (seeded seat occupancy), site search.
- `assets/data/`: `trains.json` (445 trains), `network.json`, `search-en.json`, `search-ja.json`.

## Pages (102 per language)

| Section | Pages |
|---|---|
| Home | service status strip, journey planner box (planner / timetable / fare tabs), status box, notices, featured trips, carousel, banners, mini route map |
| Route map | SVG diagram of both lines with station numbers, transfer mark, Comet stops |
| Lines | `lines/kagami.html`, `lines/bayside.html`: stations, km, stopping patterns, minutes from Springvale Central, fares, step-free access by platform |
| Stations | index (table + ridership chart as `<img>`), 22 station pages; 6 major (Springvale Central, Castle Town, University Gate, Clayfield, Moonview Spa, Ferry Port) with SVG station plan, exits, buses, taxis, nearby places |
| Timetables | index + 42 pages (each station and direction), weekday and Saturday/holiday tabs, footnote marks, first and last trains, click a time for the train's stops |
| Fares | fare table + fare chart (`<img>`), 22×22 fare matrix (ticket upper right, RideCard lower left), client fare calculator |
| Tickets | overview, RideCard (types, deposit, charge, points, refund, loss), passes (1-Day, Rail & Bus, Spa Day), commuter passes (table), discounts |
| Comet | cars and seats, timetable, surcharges, reservation rules, changes and refunds, occupancy chart |
| Reservation | `reserve/index.html` (train search with availability), `seat.html` (clickable SVG seat map), `details.html`, `complete.html` (mock, no payment) |
| Planner | `planner.html`: depart-after / arrive-by, transfers, fares, Comet surcharges, peak dates |
| Service info | status (today's delay, 7-day history, delay certificates, punctuality chart), notices index + 8 notices (incl. the 14 Nov 2026 timetable revision with before/after table), accessibility, lost and found, rules, FAQ (30 questions) |
| Other | trips (Moonview Spa, Lantern Festival), about (company, history, ridership chart), search |

## Images

Ten photographs made with Codex image generation (`gpt-6.1-sol`), originals (PNG) in `/home/yotam/projects/unilens/.local/study-sites-src/transit/`: `tsukikage-bridge`, `local-train-rural`, `concourse`, `platform`, `onsen-station`, `ticket-machines`, `bayside-coast`, `tsukikage-interior`, `lantern-festival`, `pottery-village` (JPEG in `assets/img/`). Charts (ridership, fare by distance, punctuality, Comet occupancy) and the route map and station plans are SVG drawn by `build.mjs`.

## Fixed "today"

Sunday 4 October 2026, 14:20: the status strip shows a Mirror Line delay; timetable pages open on the Saturday/holiday tab. The planner and reservation accept dates from 4 October to 13 November 2026 (the current timetable).
