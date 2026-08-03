# UniLens Project
Making web-browsing accessible with in-page AI-partners.

## Structure

There are four managed packages:

* `backend` - Flask server managed by python `venv`. See `backend/Makefile` for details
* `unilens-lib` - Unilens library managed by `npm`. See `unilens-lib/Makefile` for details
* `accessibility-lib` - Unilens library managed by `npm`. See `unilens-lib/Makefile` for details
* `.` - Root dir managed by `npm`. Very small package which is used to serve sample sites such as `softbank-mirror`. `./Makefile` manages all packages

Note that for `.`, the choice of `npm` vs `venv` is relatively arbitrary. We choose `npm` to stay consistent with the client builds.

## Prototype

Embeddable capture + chat overlay for any HTML page. Alt+click captures a full-page
screenshot annotated with viewport, mouse trace, and click position, sends it to the
backend, and opens a chat popover at the cursor backed by an LLM/VLM.

```
unilens-lib/          React + TS — builds a single embeddable dist/unilens.js using esbuild
accessibility-lib/    React + TS — builds a single embeddable dist/accessibility.js using esbuild
backend/           Flask — stores captures, /api/chat with OpenAI / Gemini / stub
softbank-mirror/   Static copy of softbank.jp IR benefit page (test target)
```
## Setup and cleanup
To set up backend, unilens lib, and build system:
```
make init
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

To serve the backend, and serve a frontend from a given frontend target `{target}`:
```
make serve softbank-mirror
# Starts backend, and serves `softbank-mirror` to localhost:8000. Open and alt+click anywhere
```

This will watch for changes in any of the three directories and will automatically rebuild/serve:
* `backend` - server code
* `unilens-lib` - Unilens javascript library source code
* `accessibility-lib` - Accessibility javascript library source code
* `frontend/{target}` - base HTML and source of client (excluding unilens.js dist)

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

### Javascript Libs Only

Build and watch unilens lib into a dist
```
make serve-target unilens
```

Build and watch accessibility lib into a dist
```
make serve-target accessibility
```

### Run Multiple Frontends

To build all JS targets into all frontend targets:
```
make serve-all
```

Alternatively, to run them individually, just run `make serve-backend` separately and then run `make serve-frontend {target}` for each individual target. You can do this just by opening up three terminals. You can also do this via `npx concurrently`, which is included as part of the root `.` distribution:
```
npx concurrently "make serve-backend" "make serve-frontend dev-demo" "make serve-frontend softbank-mirror"
# Serving frontend from 'dev-demo' to localhost:8000
# http://0.0.0.0:8080 is already in use. Trying another port.
# Serving "dev-demo" at http://127.0.0.1:53252
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

## Switching Between Libraries
If you are testing both `unilens-lib` and `accessibility-lib`, the easiest way to do so is simply include both in your frontend target HTML and comment out the one you are testing at a given time:
```html
<script src="accessibility.js"></script>
<script src="unilens.js"></script>
<script>
  // Accessibility.init( ... );
  UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })
</script>
```

## Adding new targets
To add new javascript targets or new frontend targets, update `make-targets.mk`:
```Makefile
# JS build targets

# Define all targets here, this allows us to iterate through them
JS_TARGETS:= unilens-lib accessibility-lib

target_dist_unilens-lib=unilens.js
target_dist_accessibility-lib=accessibility.js

# Frontend build targets
FRONTEND_TARGETS:= softbank-mirror dev-demo

# To add a target, use the format `frontend_port_{subdir name}=<PORT>`
frontend_port_softbank-mirror=8000
frontend_port_dev-demo=8001
```

## Data

Each capture is stored under `backend/captures/<id>/`: `capture.png` (annotated
screenshot), `meta.json` (click, scroll, viewport, page size, mouse trace),
`chat.json` (conversation history).
