# UniLens Project
Making web-browsing accessible with in-page AI-partners.

## Structure

There are three managed packages:

* `backend` - Flask server managed by python `venv`. See `backend/Makefile` for details
* `unilens-lib` - Unilens library managed by `npm`. See `unilens-lib/Makefile` for details
* `.` - Root dir managed by `npm`. Very small package which is used to serve sample sites such as `softbank-mirror`. `./Makefile` manages all three packages

Note that for `.`, the choice of `npm` vs `venv` is relatively arbitrary. We choose `npm` so that we can use `chokidar-cli` to stay consistent with the unilens watcher.

## Prototype

Embeddable capture + chat overlay for any HTML page. Alt+click captures a full-page
screenshot annotated with viewport, mouse trace, and click position, sends it to the
backend, and opens a chat popover at the cursor backed by an LLM/VLM.

```
unilens-lib/          Vite + React + TS — builds a single embeddable dist/unilens.js
backend/           Flask — stores captures, /api/chat with OpenAI / Gemini / stub
softbank-mirror/   Static copy of softbank.jp IR benefit page (test target)
example-of-track-and-screenshot/   Original vanilla JS proof of concept
```
## Setup and cleanup
To set up backend, unilens lib, and build system:
```
make run
```

To clean all packages and intermediates:
```
make clean
```

## Build, Run, and Serve

Verbs:
* `build` - Build a distribution (unilens lib only)
* `run` - Run a server (without building)
* `serve` - Build any distributions, run a server, watch for changes

### General Usage

To serve the backend, and serve a frontend from a given directory target `{target}`:
```
make serve softbank-mirror
# Starts backend, and serves `softbank-mirror` to localhost:8000. Open and alt+click anywhere
```

This will watch for changes in any of the three directories and will automatically rebuild/serve:
* `backend` - server code
* `unilens-lib` - javascript library source code
* `{target}` - base HTML and source of client (excluding unilens.js dist)

### Backend Only

Run backend and watch for changes (stub works without API keys; copy `.env.example` to `.env` for real LLM):

```
make serve-backend
# Serves flask server to http://127.0.0.1:5000
```

### Frontend Only

Run frontend dev demo to a given target dir and watch for changes (proxies /api to Flask):

```
make serve-frontend softbank-mirror
# Serves `softbank-mirror` to localhost:8000. Open and alt+click anywhere
```

## Embed in any HTML

```
cd unilens-lib && make build         # -> dist/unilens.js
```

```html
<script src="unilens.js"></script>
<script>
  UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })
</script>
```

Options: `trigger` (MouseEvent predicate, default alt+click), `mouseWindow` (seconds
of mouse trace), `backend` (Flask base URL).

To test against the SoftBank mirror: copy `unilens-lib/dist/unilens.js` into
`softbank-mirror/`, add the two script tags above to its `index.html`, and serve the
folder (`python -m http.server`).

## Data

Each capture is stored under `backend/captures/<id>/`: `capture.png` (annotated
screenshot), `meta.json` (click, scroll, viewport, page size, mouse trace),
`chat.json` (conversation history).
