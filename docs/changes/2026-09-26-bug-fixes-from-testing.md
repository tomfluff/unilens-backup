---
Author: Yotam Sechayk
Date: 2026-09-26
---

# Fixes from the builder's testing on main

## Context

The builder tested main after the #14–#17 merge and filed seven bugs with screenshots. Two more turned up while benchmarking html2canvas-pro, and one while testing the AI settings.

## Decision

- **Invert keeps UniLens on screen.** The display panel's Invert puts a `filter` on the page, which makes it the containing block for UniLens's fixed layers, so the chat and the settings button moved to the page's end. The counter-invert now targets the children of UniLens's roots, not the roots.
- **A source clicked in a long answer keeps the chat where the reader is.** Pressing a chip in the text no longer scrolls the log to the answer's end.
- **Nested sources draw one outline, by the builder's rule.** The inner element stays when the outer adds nothing (the same text, or the inner covers 90% of it); otherwise the outer stays. Their badges merge, as "1·2".
- **A revealed source goes to the middle of the screen, and the chat steps aside for it.** The chat moves the shortest way left or right that clears the source, with a gap. It folds to its header only when neither side has room. The new setting "Move the chat out of the way of sources" turns the step off, and a pinned chat stays put.
- **"This" means the selected source.** The question goes with the sources outlined on the page, and the backend tells the model that "this" means them. A line above the field says what "this" will mean, with a button to drop it.
- **A minimized chat drags freely, and moves up to fit when unfolded.**
- **Stop closes the reading's audio stream**, so read-aloud no longer sticks on "Preparing audio".
- **A chat that goes cancels its requests.** Its streaming answer stops, so no provider keeps writing an answer nobody will see.
- **Gemini answers again.** Its client was garbage-collected mid-request ("client has been closed"); every call now keeps it alive.
- **A page that grew after load no longer captures blank.** The page size was measured at load only, so after a tab or accordion opened, a click below the old end gave a white close-up. It is measured again at every capture, and when the body resizes.
- **Alt+click no longer also clicks the page's own control.** The trigger click is taken in the window's capture phase, so a FAQ question no longer opens or closes as it is captured.

### From the second round of testing (2026-09-27)

- **A link that wraps onto two lines is outlined line by line.** An outline was the element's bounding box, which for a wrapped link covers most of its sentence. An inline element that wraps now gets one outline per line, with its number on the first; the minimap and the off-screen cues still use its whole box.
- **A link or a button inside a sentence keeps its own outline** when the two are drawn together (the builder's choice, amending the nested rule above), unless the sentence holds nothing else.
- **"This" survives a view refresh.** Choosing a source moves the page, so the next question takes a fresh capture whose ids differ from the answer's; the source is now sent by its id in that capture, found by its element. Before, "Translate this" on source 1 translated the row that held both sources.
- **Gemini's joined citations become chips.** Gemini writes two sources as `[[n42], [n43]]`; the chat, read-aloud and the saved history now split them into one marker each.

## Not in this change

- Scroll positions inside the page's own scroll containers (TODOS.md, host-page hazards).
