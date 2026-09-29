# Running UniLens

Everything runs through `make` from the repo root. Requires Node 20+ and Python 3.10+.

| Part | Dir | What it is |
|---|---|---|
| Backend | `backend/` | Flask API, port `5000` |
| JS libs | `unilens-lib/`, `accessibility-lib/` | esbuild bundles, copied into frontends as `unilens.js` / `accessibility.js` |
| Frontends | `frontend/softbank-mirror` (8000), `frontend/dev-demo` (8001), `frontend/softbank-mirror-recruit` (8002) | static sites served by `live-server` |

## Setup

```bash
make init                              # root npm + backend venv + both JS libs
cp backend/.env.example backend/.env   # add OPENAI_API_KEY or GOOGLE_API_KEY; neither = offline stub
```

If `make init` fails with `ensurepip is not available`, see [Troubleshooting](#troubleshooting).

## Run

```bash
make serve softbank-mirror     # backend + one frontend, rebuild on save. The usual one.
make serve-all                 # backend + all three frontends
make run dev-demo              # one frontend, no build, no backend
make serve-backend             # backend only
```

`serve` bundles once at startup, then rebuilds and recopies on any change under
the libs' `src/` or the frontend dir. It does **not** typecheck — see below.

## Check, build, test

```bash
make check         # what CI runs: typecheck + build + format + fix + tests; exits non-zero on any failure
make lint          # typecheck both libs (tsc), nothing else
make build         # typecheck, then bundle all libs -> all frontends
make bundle        # bundle only, no typecheck — what the dev server uses
make test-all      # unit tests for every target in TEST_TARGETS
make format        # black on backend, biome on both libs
make fix           # biome --unsafe --write on both libs
```

`build` typechecks first because esbuild strips types without checking them.
The dev server deliberately uses `bundle` instead, so an in-progress type
error does not stop it from starting or rebuilding (`tsc` also costs ~5x
esbuild per save). Run `make lint` or `make check` before you push.

Single-target forms: `make build-and-copy <lib> <frontend>`,
`make <verb>-target <lib>` for `init`, `clean`, `lint`, `bundle`, `build`,
`serve`, `format`, `fix`, `test`. Targets are directory names (`unilens-lib`,
not `unilens`).

## Config

No env vars in the build; two files:

- `make-include.mk` — `FLASK_PORT=5000`, binary names, dir names.
- `make-targets.mk` — `JS_TARGETS`, `FRONTEND_TARGETS`, `TEST_TARGETS`, and
  `frontend_port_<name>=<port>`. Add a frontend by dropping it in `frontend/`,
  appending its name and a port line.

Override per command: `make serve-backend FLASK_PORT=5050`.

## Clean

```bash
make clean                 # node_modules, venv, dist, copied bundles
make clean-frontend        # only the bundles copied into frontends
```

## Troubleshooting

**`make init` fails with `ensurepip is not available … apt install python3.X-venv`.**
`make init` builds the backend venv with `python3 -m venv`, which needs the
distro package. Either install it and rerun:

```bash
sudo apt install python3-venv          # or python3.14-venv, matching `python3 -V`
make init
```

or build the venv with [uv](https://docs.astral.sh/uv/) and run the two
remaining init steps yourself (`make init` stopped before them):

```bash
cd backend && uv venv --clear && uv pip install -r requirements.txt && cd ..
make init-self      # root npm
make init-all       # both JS libs
```

`--clear` is needed because the failed `make init` leaves a half-built
`backend/.venv` behind, and plain `uv venv` refuses to replace one. Run the two
`make` lines separately — `make init-self init-all` triggers a harmless but noisy
`overriding recipe for target 'init-all'` warning. `make clean` deletes the venv;
on uv, redo the `uv venv --clear` line afterwards.

**`uv venv` has no `pip`.** Add packages with
`uv pip install <pkg> --python backend/.venv/bin/python`. Every make target only
sources `backend/.venv/bin/activate`, so nothing else cares how the venv was made.

**A `make serve-target <lib>` watcher exits as soon as you background it.**
esbuild's `--watch` stops when stdin closes; that is how it notices its parent
`make` is gone and avoids orphaning itself. For `nohup`/CI, opt out with
`make serve-target unilens-lib WATCH=--watch=forever` and kill it by PID when done.

**Sharing a local run.** `./restart-tunnels.sh` opens two cloudflared tunnels
(backend `:5000`, mirror `:8000`) and rewrites `backend:` in
`frontend/softbank-mirror/index.html`. Windows/Git Bash paths are hardcoded.
