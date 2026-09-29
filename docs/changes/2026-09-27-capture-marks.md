---
Author: Yotam Sechayk
Date: 2026-09-27
---

# Clearer marks on the pictures the assistant gets

## Context

The builder asked for the click to be marked the way an earlier project of theirs did, on both pictures the assistant gets, with every mark explained to the assistant so it can see, and refer to, where the user has been and what they clicked (R3 of the 2026-09-27 testing report). The click is the mark that matters most. Before, the full page had a red dashed crosshair across the whole page with a ring, an amber trail, a cyan view box and a magenta Alt+drag box; the close-up had no marks, so Live, which gets only the close-up, never saw the click.

## Decision

- **The click: a magenta ring with a white edge**, so it reads on light and dark pages. The full page has a dot in its centre; the close-up has the ring alone, to hide less of what was clicked. The crosshair is gone. Sizes are content pixels, so the ring looks the same size next to the text in both pictures, whatever the zoom.
- **The view: a red box.** An Alt+drag selection is red and dashed, so the two boxes differ by line.
- **The pointer's trail: orange or lime**, a setting for now ("Pointer trail colour", in Capture and research), drawn over a thin dark edge so either reads on a white page. The colour goes with the metadata (`trailColor`).
- **The chat's rules describe every mark**: the click first ("the question is about what is under it"), the view, a selection, the trail and which end is newest, the ring on the close-up, that a mark can cover a little of what it marks, and that after a view refresh the ring may be outside the close-up. Live's rules say a magenta ring marks the point the user clicked.

## Tried

Real Alt+clicks on the SoftBank mirror, with each trail colour and an Alt+drag selection: the marks as above on the full page, the ring alone on the close-up.

## Not in this change

- Whether the ring still hides too much of what was clicked, from the assistant's answers over time (the builder's check).
- The debug panel's own colours, which still follow the old marks.
