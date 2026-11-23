# accessibility-lib

The Japanese translation is [README.ja.md](README.ja.md). If the two disagree, this English file is canonical.

An embeddable accessibility library for page display adjustments. The build output is a single `dist/accessibility.js`, started with `window.Accessibility.init()` (`window.UniLensA11y` exposes the same API).

Unless noted otherwise, commands run from the **UniLens repository root** (the parent of this folder).

## Requirements

- Node.js and npm
- Python 3 (to serve the demo, or to run the backend)
- GNU Make, if available (usual on Linux / macOS; on Windows, Git for Windows or a separate Make install)

If the machine has no GNU Make, use [Without GNU Make](#without-gnu-make) below.

## With GNU Make (recommended)

First-time setup:

```sh
make init
```

Demo (SoftBank mirror):

```sh
make serve softbank-mirror
```

Open http://localhost:8000/ (verification checklist: http://localhost:8000/verify.html). The top-right **♿ accessibility** panel is this library.

To copy build outputs into the recruit mirror (`softbank-mirror-recruit`):

```sh
make build
# or one target only: make copy softbank-mirror-recruit
```

Artifacts land in `frontend/softbank-mirror-recruit/` (that folder is the document root).
Frontend only: `make serve-frontend softbank-mirror-recruit` (port 8002). Open http://localhost:8002/recruit/disability/ .

| Command | What it does |
|---|---|
| `make serve-frontend softbank-mirror` | Frontend only (port 8000) |
| `make serve-frontend softbank-mirror-recruit` | Recruit mirror (port 8002) |
| `make serve-frontend dev-demo` | Small demo (port 8001) |
| `make serve-frontend study-support`, etc. | User-study mock sites (ports 8031–8036; `frontend/STUDY-SITES.md`) |
| `make serve-target accessibility-lib` | Watch-build this library only |
| `cd accessibility-lib && make build` | Typecheck, then write a single `dist/accessibility.js` |
| `cd accessibility-lib && make lint` | Typecheck |
| `cd accessibility-lib && make test` | Unit tests |

## Without GNU Make

Node.js / npm / Python 3 are enough. Examples below are for macOS / Linux. On Windows, use the PowerShell block.

### 1. Install dependencies

```sh
cd accessibility-lib
npm install
```

If you also want AI chat (`unilens-lib`) on the same page:

```sh
cd ../unilens-lib
npm install
```

### 2. Build

```sh
cd accessibility-lib
npx tsc -b
npx esbuild src/main.tsx --outfile=dist/accessibility.js --bundle --minify --sourcemap --loader:.css=text --jsx=automatic
```

To build `unilens-lib` as well:

```sh
cd ../unilens-lib
npx esbuild src/main.tsx --outfile=dist/unilens.js --bundle --minify --sourcemap
```

### 3. Copy into the demo site

`softbank-mirror` (files next to the page root):

```sh
cd ..
cp accessibility-lib/dist/accessibility.js frontend/softbank-mirror/accessibility.js
cp unilens-lib/dist/unilens.js frontend/softbank-mirror/unilens.js
```

`softbank-mirror-recruit` (this directory is the document root):

```sh
cd ..
cp accessibility-lib/dist/accessibility.js frontend/softbank-mirror-recruit/accessibility.js
cp unilens-lib/dist/unilens.js frontend/softbank-mirror-recruit/unilens.js
```

Skip the `unilens.js` copy if you did not build it. The panel still runs with `Accessibility.init()` alone.

### 4. Serve

```sh
cd frontend/softbank-mirror
python3 -m http.server 8000
```

For the recruit mirror:

```sh
cd frontend/softbank-mirror-recruit
python3 -m http.server 8002
# → http://localhost:8002/recruit/disability/
```

If `python3` is missing (common on Windows), use `python -m http.server`.

Open http://127.0.0.1:8000/ . After editing sources, repeat **steps 2–3** and reload the browser.

Typecheck and tests:

```sh
cd accessibility-lib
npx tsc -b
npx vitest run
```

### Windows PowerShell (no Make)

From the repository root:

```powershell
cd accessibility-lib
npm install
npx tsc -b
npx esbuild src/main.tsx --outfile=dist/accessibility.js --bundle --minify --sourcemap --loader:.css=text --jsx=automatic

cd ..
Copy-Item accessibility-lib/dist/accessibility.js frontend/softbank-mirror/accessibility.js -Force

# Also copy into the recruit mirror when needed:
Copy-Item accessibility-lib/dist/accessibility.js frontend/softbank-mirror-recruit/accessibility.js -Force

cd frontend/softbank-mirror
python -m http.server 8000
```

## Embed in any HTML

```html
<script src="accessibility.js"></script>
<script>
  Accessibility.init()
</script>
```

Page display CSS is bundled into `accessibility.js` and injected on init.

Together with `unilens-lib`:

```html
<script src="accessibility.js"></script>
<script src="unilens.js"></script>
<script>
  Accessibility.init()
  UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })
</script>
```

## `init()` options

Main options for `Accessibility.init()` / `UniLensA11y.init()`. Omitted keys use the defaults below.

| Option | Default | Description |
|---|---|---|
| `panel` | `true` | Show the top-right ♿ panel |
| `selection` | `true` | Resize text in the current selection |
| `speech` | `true` | Read selected text aloud |
| `autoText` | `true` | Automatic page text-size analysis |
| `oppZoom` | `true` | Makes Lab's "Zoom as far as it fits" available (whole-page zoom up to just before the layout breaks; Bigham, UIST 2014). The visitor turns it on |
| `bodyTextExpand` | `true` | Expand body text only (headings excluded) |
| `smallTextBoost` | `true` | Raise a floor for text under 16px |
| `followSystemPreferences` | `false` | On first run only, adopt OS display preferences |
| `lang` | auto-detected | Panel language (`'ja'` / `'en'`); an explicit panel choice always wins |
| `cspNonce` | the loading `<script>`'s nonce | Nonce for the injected `<style>` elements on sites whose Content-Security-Policy restricts `style-src` |

The initial panel language is inferred from `<html lang>` and browser languages. A language chosen in the panel is persisted and reused on later visits.

The ♿ button and panel render inside a shadow root, so the site's CSS (including `!important` rules) does not reach them — and cannot be used to restyle them either.

On a site whose Content-Security-Policy refuses inline styles and no nonce is available, the rules are applied through constructed stylesheets (`document.adoptedStyleSheets`, which CSP does not restrict) instead; the browser then reports one CSP violation for the first refused `<style>` only.

See the repository-root `README.md` for the full build and serve workflow.
