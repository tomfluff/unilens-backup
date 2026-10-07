---
Author: gleamorb-k-kinjo
Date: 2026-10-06
---

# Accessibility panel buttons respond at once

## Context

A press on an accessibility panel button took a visible moment before the button showed its new state. The panel's own React render was cheap (1–5 ms). The time went to page-wide work that ran synchronously inside the click handler, so the browser could not paint the pressed button until it ended:

- **Themed surfaces.** With any colour mode other than standard, every apply walked every page node, forced a reflow and read computed style three times per node (element, `::before`, `::after`) to mark opaque host plates. This ran for every button, a link-underline toggle included.
- **Text plates (high contrast).** The per-node plate pass ran twice per apply.
- **Page text size.** Every apply walked the page again. A size change wrote one node and then read `position` from it, node after node, which forced a style recalculation per node.
- **Body-text expand and small-text boost** cleared and rescanned the page on a change to any accessibility setting, not only their own level.
- **Auto text size** re-measured the page on a change to any setting.
- **A second walk.** The surface observer reacted to the text-size features' own `class` / `style` writes and walked the page once more right after the click.

Measured on the SoftBank mirror (about 1,700 page nodes) in Chromium, click to next paint:

| Press (state before it) | Before | After | Before, CPU ×4 | After, CPU ×4 |
|---|---|---|---|---|
| Link underline (all standard) | 24–40 ms | 24–40 ms | 120 ms | 104 ms |
| Colour mode → dark | 136–160 ms | 56–64 ms | 600 ms | 144 ms |
| Link underline (dark) | 96 ms | 24 ms | 440 ms | 80 ms |
| Colour mode → high contrast | 232–240 ms | 40–48 ms | 880 ms | 144 ms |
| Link underline (high contrast) | 136–160 ms | 24 ms | 696 ms | 104 ms |
| Text size → large (high contrast) | 536–544 ms | 32 ms | 2,512 ms | 128 ms |
| Link underline (high contrast + large) | 360–408 ms | 32–40 ms | 1,848 ms | 88 ms |
| Low-vision preset | 400 ms | 136 ms | — | — |

Total main-thread work per press dropped too. For example, link underline with high contrast and large text went from 350 ms to none, and large text from 519 ms to 188 ms.

## Decision

- **Page walks run after the next paint** (`afterPaint.ts`: `requestAnimationFrame` and then a timeout). The html-level attributes and the panel repaint first, and the page-wide marking follows. Repeated presses coalesce into one walk.
  - Themed surfaces and text plates (`documentEffects.ts`).
  - A page text-size change (`pageFontScale.ts`). The first apply on page load stays synchronous, so a saved size shows without a 1× flash.
  - A body-text-expand or small-text-boost level change. The panel announces the count and re-renders its note when the walk is done (`afterBodyTextApplied` / `onBodyTextScan` and the small-text equivalents).
- **Walk only when an input changed.**
  - The surface pass depends on the theme and link backgrounds only (`surfaceInputsKey`). The link-background rule has no bg-sample opt-out, so it shows in the sampled colour. No other setting touches `background-color`.
  - An unchanged page text size does not walk the page.
  - Body expand, small boost and auto text size react only to their own settings.
- **One plate pass**, before the markers pass. Pseudo-element sampling sees the plate rule, so the order is the same as before.
- **The surface observer ignores the library's own writes** (`unilens-*` classes, `--unilens-*` custom properties). Host class, style, hidden and src changes and added nodes still trigger a pass.
- **Text-size scan without layout thrashing.** It reads `position` for the whole batch, writes every node at the full scale, and then measures only out-of-flow nodes against their neighbours.
  - Those nodes are now measured against the final, already-scaled layout. Before, a neighbour that came later in the document was still at 1× when measured.
- **Originals are read at 0.01 px** (`readOriginalFontPx`). Before, the first read was 13.3333 px and the stored value was 13.33, so form controls were re-applied, and re-measured, on the next scan.

## Tried

- `make check` cannot run on this machine's Linux shell: the installed vitest/biome binaries are Windows builds. The unit tests ran through a small vitest-compatible runner, and the types were checked with `tsc` (TypeScript 6):
  - Before the change: 0 failures.
  - After it: 0 failures, with new tests for `isOwnStyleMutation`, `surfaceInputsKey` and the 0.01 px read.
- **Same result after the page settles,** old build against new build, comparing markers, background, colour and font size of every page node:
  - Dark, high contrast, large and extra-large text, high contrast with large text, link background with dark, and dark back to standard: no differences.
  - Body expand 2 with small boost 1: the old build double-expanded 23 nodes on a click (20 px; a reload gives 16 px). The new build matches the reload.
  - Low-vision preset: one out-of-flow badge stops short of its neighbour (17.9 px instead of 41.6 px; a reload gives 16 px).
  - Loading the page with stored settings: identical in every case.
- **Host changes still trigger a pass with high contrast on:** an added opaque box and a changed inline background were both marked.
- Idle for 5 s with dark, high contrast, and high contrast with large text: no long tasks.

## Not in this change

- The selection card calls `getSelectionInfo()` during render, which forces layout (10–25 ms on the Lab tab). That work would happen before the paint anyway.
- `isUniLensOverlayNode` runs `closest()` for each overlay id per node.
- The panel subscribes to the whole settings store (1–5 ms per press).
- For one frame after the first switch to a colour mode, host plates are transparent, until the surface pass marks them.
