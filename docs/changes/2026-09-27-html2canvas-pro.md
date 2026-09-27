---
Author: Yotam Sechayk
Date: 2026-09-27
---

# Capture with html2canvas-pro 2.0.4

## Context

html2canvas 1.4.1 throws on modern CSS colors (`color-mix()`, `color()`, `oklch()`), so a capture failed outright on such pages. Our own accessibility widget's link backgrounds use `color-mix()`. The builder asked to try html2canvas-pro end to end, and to compare capture times on the longest page, with its tabs and FAQs open.

## Decision

- **html2canvas-pro, pinned to 2.0.4.** It is a drop-in fork that parses the modern colors.
- **Not 2.1 or later:** from 2.1.0 it loses block `::after` boxes (heading underlines, icons after links). That shifts everything below them up about 30 px and puts the click marker off the element the user clicked.

## Measurements

On the SoftBank mirror with everything open (1280×24,105 px, 10 runs each):

| Build | End-to-end median | p90 |
|---|---|---|
| html2canvas 1.4.1 | 2.47 s | 2.76 s |
| html2canvas-pro 2.0.4 | 2.25 s | 2.42 s |
| html2canvas-pro 2.4.5 | 2.05 s | 2.72 s |

- 2.0.4 matches Chromium's own screenshot within 1 px. 1.4.1 drifts up to 12 px on the lower half, and dims the footer with a hidden modal.
- Upload sizes are the same within 0.1%.
- The bundle grows by 26 KB.
- At 200% zoom a capture takes about 2.7× as long in every build: that is UniLens's, not the library's.

## Not in this change

- Why a zoomed capture is slower (TODOS.md).
