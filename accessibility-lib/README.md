# accessibility-lib

An embeddable display-adjustment library. The build output is a single `dist/accessibility.js`, started with `window.Accessibility.init()` (`window.UniLensA11y` exposes the same API).

Unless noted otherwise, commands run from the **UniLens repository root** (the parent of this folder).

日本語版は [README.ja.md](README.ja.md) を参照してください。

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

Open http://localhost:8000/ . The **♿ display-adjustment** control at the top right is this library.

To copy build outputs into the recruit mirror (`softbank-mirror-recruit`):

```sh
make build
# or one target only: make copy softbank-mirror-recruit
```

Artifacts land under `frontend/softbank-mirror-recruit/site/` (that folder is the docroot).  
Frontend only: `make serve-frontend softbank-mirror-recruit` (port 8002). For API responses closer to production: `cd frontend/softbank-mirror-recruit && node server.mjs` (port 8787).

| Command | What it does |
|---|---|
| `make serve-frontend softbank-mirror` | Frontend only (port 8000) |
| `make serve-frontend softbank-mirror-recruit` | Recruit mirror (port 8002, serves `site/`) |
| `make serve-frontend dev-demo` | Small demo (port 8001) |
| `make serve-target accessibility-lib` | Watch-build this library only |
| `cd accessibility-lib && make build` | Typecheck, then write the single `dist/accessibility.js` |
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
npx esbuild src/main.tsx --outfile=dist/accessibility.js --bundle --minify --loader:.css=text
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

`softbank-mirror-recruit` (docroot is `site/`):

```sh
cd ..
cp accessibility-lib/dist/accessibility.js frontend/softbank-mirror-recruit/site/accessibility.js
cp unilens-lib/dist/unilens.js frontend/softbank-mirror-recruit/site/unilens.js
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
node server.mjs
# → http://localhost:8787/recruit/disability/
```

If `python3` is missing (common on Windows), use `python -m http.server 8000`.

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
npx esbuild src/main.tsx --outfile=dist/accessibility.js --bundle --minify --loader:.css=text

cd ..
Copy-Item accessibility-lib/dist/accessibility.js frontend/softbank-mirror/accessibility.js -Force

# Also copy into the recruit mirror when needed:
Copy-Item accessibility-lib/dist/accessibility.js frontend/softbank-mirror-recruit/site/accessibility.js -Force

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

The page display CSS is included in `accessibility.js` and injected automatically at initialization.

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
| `bodyTextExpand` | `true` | Expand body text only (headings excluded) |
| `smallTextBoost` | `true` | Raise a floor for text under 16px |
| `followSystemPreferences` | `false` | On first run only, adopt OS display preferences |
| `lang` | auto-detected | Panel language (`'ja'` / `'en'`); an explicit panel choice always wins |

The initial panel language is inferred from `<html lang>` and browser languages. A language chosen in the panel is persisted and reused on later visits.

See the repository-root `README.md` for the full build and serve workflow.
