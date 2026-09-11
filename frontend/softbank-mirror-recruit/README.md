# softbank-a11y — local verification mirror

The Japanese translation is [README.ja.md](README.ja.md). If the two disagree, this English file is canonical.

A local copy of https://www.softbank.jp/recruit/disability/index.html.
Used to develop and verify the accessibility widget offline.

## Run

From the repository root:

```
make serve-frontend softbank-mirror-recruit
```

http://localhost:8002/recruit/disability/ (root `/` redirects there via `index.html`).

This is a plain static site. `live-server` serves this directory as the document root, so absolute `/recruit/...` paths match the on-disk layout.

Copy library builds from the repository root:

```
make copy softbank-mirror-recruit
# → accessibility.js, unilens.js
```

Page-theme CSS is bundled inside `accessibility.js`. `recruit/disability/index.html` loads `/accessibility.js` and `/unilens.js` at the end of the body and calls `Accessibility.init()`.

## Layout

| Path | What it is |
| --- | --- |
| `recruit/`, `scsystem/`, `_ext/`, … | Served as the site root. Same path layout as production (`/recruit/...`) |
| `scsystem/api/CreateRecruitJson/*/index.html` | Frozen API responses (`.html` so a static server returns them regardless of query string) |
| `_ext/fonts.*` | Localised Google Fonts (Roboto) CSS and woff2 |
| `original/index.html` | Unmodified HTML at fetch time, for diffs |

There is no download / re-mirror script and no custom Node server. The snapshot is static.

### List APIs and query strings

`SOFTBANK CAREER NOW!` and the employee intro list are Vue components that fetch at runtime.
Count (`limit`) and filter (`category`) are query parameters. A static server ignores the query string, so only the one pattern the page actually uses is frozen as `index.html`:

| Request | Frozen payload |
| --- | --- |
| `CareerNowIntroduction/?start=0&limit=2&category=disability&language=ja-JP` | 2 items |
| `PeopleIntroduction/?category=disability&language=ja-JP` | 7 items (the page JS keeps 6) |
| `NewInfoIntroduction/?category=disability&language=ja-JP` | 6 items |

## Edits vs the original

Rewrites on `recruit/disability/index.html` keep the DOM and only stop outbound traffic plus inject the verification scripts:

- Google Fonts `<link>` points at `/_ext/fonts.googleapis.com/css2.css`
- `fonts.gstatic.com` preconnect removed
- External trackers / widgets set to `type="text/plain"` + `data-local-disabled="..."` so they do not run
  - Google Tag Manager (inline + noscript iframe)
  - Yahoo tag manager (yjtag)
  - User Insight (nakanohito.jp)
  - Twitter/X widgets.js
  - Disabled nodes: `document.querySelectorAll('[data-local-disabled]')`
- `accessibility.js` / `unilens.js` and `Accessibility.init` / `UniLens.init` inserted before `</body>`
  (wrapped in `<!-- [local] unilens-a11y -->` … `<!-- [/local] unilens-a11y -->`)

Host-site images / JS / CSS are untouched.

## Known gaps

- **One remaining 404**: `/recruit/set/data/disability/project/merihariplan/img/thumb.jpg` is 404 on production (same for `images/recruit/flow/ico_angle_right_bk.png` and `images/recruit/flow/ico/ico_arrow.svg` in CSS; they do not paint).
- **The six employee cards reshuffle on reload.** The page JS shuffles 7 items and draws 6 — same as production. All six have images.
- **API payloads are frozen** at fetch time.
- **Only this one page is mirrored.** Header/footer links to other pages 404.
- Off-origin links (group sites, application forms) stay as-is and will not open offline.

## Refreshing the snapshot

Automatic re-fetch scripts are removed. To refresh, download the page and assets by hand (keep the `/recruit/...` path layout) and re-apply the edits above.
