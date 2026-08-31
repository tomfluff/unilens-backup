# softbank-a11y — Local Verification Mirror

日本語版は [README.ja.md](README.ja.md) を参照してください。

A local copy of https://www.softbank.jp/recruit/disability/index.html.
For developing and testing web accessibility features offline.

## Startup

```
make serve softbank-mirror-recruit
```

http://localhost:8002/recruit/disability/ (root `/` redirects automatically via a static `index.html`)

This is served as a plain static site (no custom server) — `live-server` serves this directory directly, since absolute
paths (`/recruit/...`) in the mirrored HTML match the directory structure 1:1.

To reflect library changes from the repository root using `make`:

```
make copy softbank-mirror-recruit
# → accessibility.js, unilens.js
```

`recruit/disability/index.html` loads `/accessibility.js` and `/unilens.js` at the end and starts the panel.

## Configuration

| Path | Contents |
| --- | --- |
| `recruit/`, `scsystem/`, `_ext/`, etc. | Serving root. Saved with the same path structure as production (`/recruit/...`), so absolute path references are resolved as-is |
| `scsystem/api/CreateRecruitJson/*/index.html` | Fixed API responses (JSON body, `.html` extension so a static file server serves them for the directory-style request regardless of query string) that the page fetches at runtime via axios |
| `_ext/fonts.*` | Google Fonts (Roboto) CSS and woff2 localized |
| `original/index.html` | Raw HTML at the time of acquisition. For diff checking |

### About List API Queries

The `SOFTBANK CAREER NOW!` and employee introduction lists are rendered by Vue components that call APIs at runtime.
At this time, **the number of items (`limit`) and filters (`category`) are determined by query parameters**, but since
a static server ignores query strings and only the one query combination actually used by the page was captured, each
endpoint directory contains a single `index.html` fixture with that exact response (no query matching needed):

| Request | Fixture contents |
| --- | --- |
| `CareerNowIntroduction/?start=0&limit=2&category=disability&language=ja-JP` | 2 items |
| `PeopleIntroduction/?category=disability&language=ja-JP` | 7 items (JS side filters to 6) |
| `NewInfoIntroduction/?category=disability&language=ja-JP` | 6 items |

## Changes from Original

The following transformations were applied to `recruit/disability/index.html` when it was mirrored.
DOM structure is preserved, external communications are blocked, and only validation scripts are added at the end.

- Changed Google Fonts `<link>` to local `/_ext/fonts.googleapis.com/css2.css`
- Removed `preconnect` to `fonts.gstatic.com`
- Changed external trackers/widgets to `type="text/plain"` + `data-local-disabled="..."` to stop execution only
  - Google Tag Manager (inline + noscript iframe)
  - Yahoo Tag Manager (yjtag)
  - User Insight (nakanohito.jp)
  - Twitter/X widgets.js
  - Disabled elements can be checked from the browser with `document.querySelectorAll('[data-local-disabled]')`
- Inserted `accessibility.js` / `unilens.js` and `Accessibility.init` / `UniLens.init` before `</body>`
  (Enclosed with `<!-- [local] unilens-a11y -->` … `<!-- [/local] unilens-a11y -->`, replaced on re-run)

Images and the site's own JS/CSS are not modified.

## Known Differences and Limitations

- **Only 1 file remains 404**: `/recruit/set/data/disability/project/merihariplan/img/thumb.jpg`.
  This is a reference that returns 404 on the production site, not an oversight in the mirror (similarly,
  `images/recruit/flow/ico_angle_right_bk.png` and `images/recruit/flow/ico/ico_arrow.svg` are also 404 on production.
  These are references in CSS and don't appear in rendering).
- **The 6 employee introductions change on each reload**. The JS shuffles the 7 target items and displays 6, same behavior as production. All 6 images display.
- **API responses are fixed at the time of acquisition**. Employee introduction and Career NOW lists are not updated.
- **Only this 1 page is mirrored**. Links to other pages in the header/footer return 404.
- Links to external domains (group company sites, application forms, etc.) are as-is. Not accessible offline.

## Re-fetching

There is no automated re-fetch script anymore. To refresh this mirror, fetch the page and its assets again by hand
(preserving the absolute `/recruit/...` path structure) and re-apply the changes described above.

