# Contributing to UniLens

Conventions for this repository. They exist so the codebase reads as one voice;
match them rather than importing habits from other projects.

## 1. Architecture: React vs imperative

Both libraries are embeddable widgets built from two kinds of code, and the
boundary between them is deliberate:

- **React** — anything that owns state that must stay in sync with a view:
  panels, popovers, settings UIs. Examples: `ChatPopover`, `SettingsPanel`,
  `DebugPanel`. Declarative rendering replaces hand-written DOM patching,
  focus bookkeeping, and re-render batching.
- **Imperative DOM** — anything that runs on a frame loop or mutates the
  *host page's* DOM: the zoom engine, drag rubber band, zoom badge, minimap,
  hint chip, capture pipeline. React adds nothing to a style write per
  mousemove, and must never manage DOM it doesn't own.

Rule of thumb: *owns state that syncs to a view → React; owns a frame loop or
the host's DOM → imperative.* Don't port ephemeral overlays to React, and
don't hand-roll a stateful panel.

React roots are mounted lazily into dedicated containers on
`document.documentElement` (`#unilens-root`, `#unilens-settings-root`, …) —
outside the zoom-transformed `body` and excluded from captures.

## 2. State and persistence

One zustand store per library, defined in the store module
(`unilens-lib/src/settings.ts`):

```ts
export const useSettings = create<Settings>()(persist(() => ({ ...DEFAULTS }), { name: 'unilens-settings' }))
export const getSettings = () => useSettings.getState()
export const onSettingsChange = (cb: () => void) => useSettings.subscribe(cb)
```

- React components subscribe with the `useSettings()` hook (or a selector).
- Imperative modules read live state with `getSettings()` — never cache a
  snapshot across an `await` if the user may change the setting meanwhile.
- Persistence goes through the `persist` middleware only. No raw
  `localStorage` calls anywhere else; new persisted values become store
  fields (see `pinnedPos`), not new keys.
- Storage keys are prefixed `unilens-`.
- While the project is in development, no backward-compatibility migrations:
  a format change may drop stored values back to defaults.
- Validate hydrated values where they are consumed if garbage would break
  layout or math (finiteness checks on coordinates, range checks on numbers).

## 3. Host-page citizenship

The libraries run inside arbitrary host pages. Treat the host as territory we
are a guest in:

- **Never destroy host state.** If you overwrite a style or attribute,
  save and restore the previous value. Undo must be a deletion of our own
  markers, never a reconstruction of the host's.
- **Prefix everything.** DOM ids, classes, and data attributes we add use a
  `unilens` prefix (`data-unilens-img`, `#unilens-settings-root`).
- **Encode interpolated values.** Anything variable that lands in a URL path
  or query goes through `encodeURIComponent`, no exceptions.
- **Document-level listeners must not leak state.** Any interaction state
  machine (drags, suppression flags) needs recovery paths for events that
  never arrive: reset on the next `mousedown`, cancel on `window` `blur`,
  detect a missed `mouseup` via `e.buttons === 0`.
- **Fail soft.** Blocked storage, a missing backend, or an unexpected page
  structure degrade a feature; they never throw out of an event handler.

## 4. TypeScript and build

- `strict` TypeScript; the build depends on the type check
  (`make build` runs `tsc -b` first — esbuild strips types without checking
  them).
- Derive types instead of duplicating literals. If a list of keys already
  exists in a type, compute it:

  ```ts
  type BoolSettingKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings]
  ```

- Each library bundles to a single dist file via esbuild (`make build`);
  no per-module output.

## 5. Comments

Written in **English**.

- **Why by default.** Comments carry rationale the code cannot: the bug a
  guard prevents, the browser quirk a branch works around, the reason a
  simpler approach was rejected.
- **"What" comments only when the code is harder to read than the sentence.**
  Three legitimate forms:
  - section banners in long files: `// ── Alt+drag region select ──`
  - one-line summaries of dense logic (coordinate math, regexes)
  - doc comments on exported APIs: `/** live snapshot for non-React modules */`
- Never restate obvious code (`// set flag` above `flag = true`).
- One comment per concern; delete a comment when its code changes rather
  than letting it drift out of date.
- A deliberate simplification with a known ceiling gets a comment naming the
  ceiling and the upgrade path, e.g.
  `// 24MP canvas cap guards very long pages; switch to tiled rendering if it ever bites`.
- Match the file's existing density — this codebase is comment-rich by
  choice, but every line must still pay rent.

## 6. Commits and PRs

- Conventional prefixes: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.
- Subject in the imperative, describing the user-visible effect, not the
  mechanics: `fix: do not submit chat input on IME-composition Enter`.
- Body says **why** the change is correct and, when relevant, how it was
  verified.
- One logical change per commit. A review finding fixed during a refactor is
  its own commit, not a fixup squashed into unrelated work.
- PRs to `main` from `f/`-prefixed feature branches.

## 7. Build system

- Every package exposes the same Make verbs: `init`, `clean`, `build`,
  `serve` (JS libs), plus `lint`/`test` where applicable.
- New JS or frontend targets are declared in `make-targets.mk`
  (`JS_TARGETS`, `target_dist_*`, `frontend_port_*`); the root `Makefile`
  iterates over them — never hardcode a target list in a recipe.

## 8. Dependencies

Climb this ladder and stop at the first rung that holds:

1. Platform feature (CSS instead of JS, `max()`/`dvh` instead of resize
   listeners, DOM APIs instead of helpers).
2. Something already in the codebase — look before writing.
3. An already-installed dependency.
4. A new, small, focused dependency (zustand-class: ~1KB, one job) —
  justified in the PR description.

Never a framework-sized addition for a single feature. Bundle size matters:
these libraries are `<script>`-embedded into other people's pages.
