---
Author: Yotam Sechayk
Date: 2026-09-18
---

# Restore typechecking and make `make check` able to fail

## Context

Two defects were found while smoke-testing every Make target.

**Typechecking was gone.** Both `tsconfig.json` files were deleted when the
formatters were introduced (PR #5), on the reasoning that Biome "runs both
linting and formatting". Biome does lint, but it is not a type checker, so
`strict: true` coverage silently disappeared from both libraries. esbuild
strips types without checking them, so nothing in the repo verified types at
all. `accessibility-lib`'s `lint` target survived the deletion and had been
failing ever since with `TS6053: File 'tsconfig.json' not found`, and
`unilens-lib`'s build carried a comment claiming it typechecked first when it
did not. This also contradicted CONTRIBUTING §7, which requires every package
to expose `lint`/`test` where applicable.

Restoring the configs surfaced one real defect that had been invisible:
`ProgressFill` in `unilens-lib/src/DebugPanel.tsx` declared `blocked: boolean`
while `hint.ts` supplies a `string` (the reason text, `""` when not blocked).
Runtime was accidentally correct, since `""` is falsy.

**`make check` could not fail.** Every aggregate target looped with
`@for item in $(TARGETS); do $(MAKE) ... $$item; done`. A shell `for` loop
exits with the status of its *last* iteration, so a failure in any earlier
target was discarded. Measured directly: with a deliberate type error in
`unilens-lib`, `make build-target unilens-lib` exited 2 while `make build-all`
and `make check` both exited 0. The CI rule runs `make check`, so it would
have reported success over a broken typecheck, a broken build, or failing
tests.

## Decision

1. Restore `tsconfig.json` to both libraries (recovered from
   `f/Accessibility-Develop`, where they still existed) and fix the
   `ProgressFill` prop type to `string`.
2. Give `unilens-lib` the `lint` target it was missing, and make `build`
   depend on `lint` in both libraries, so a typecheck runs before every
   bundle rather than as a step someone has to remember.
3. Add `|| exit 1` to all eight aggregate loops, so the first failing target
   stops the run.
4. Add `TEST_TARGETS` to `make-targets.mk` and a `test-all` target, and wire
   it into `check`. Only `accessibility-lib` has tests today; listing them in
   a variable follows the existing `JS_TARGETS`/`FRONTEND_TARGETS` idiom and
   avoids a stub target in `unilens-lib`.

`check` is now `build format fix test-all`, where `build` typechecks first.

## Consequences

- `make check` typechecks both libraries, builds, formats, lints and runs the
  58 unit tests — and exits non-zero when any of them fails.
- A type error now fails `make build` and `make check`. The dev server
  (`serve`, `serve-all`) deliberately uses the lint-free `bundle` target so an
  in-progress type error does not stop it from starting or rebuilding; `tsc`
  also costs roughly five times esbuild per save.
- Test files are typechecked too: the restored `accessibility-lib` config
  excluded `*.test.ts` for no reason that survives — they pass clean.
- The two libraries pin different TypeScript majors (`~6.0.2` and `^7.0.2`).
  Both typecheck clean today; aligning them is left for a separate change.
