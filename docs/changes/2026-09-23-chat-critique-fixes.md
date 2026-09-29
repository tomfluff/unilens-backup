---
Author: Yotam Sechayk
Date: 2026-09-23
---

# The chat after its first critique: one row of controls, places in the log, smooth movement

## Context

An Impeccable critique of the three chat styles scored them 23/40
(`.impeccable/critique/2026-09-23T14-01-50Z__unilens-lib-src-chatpopover-tsx.md`).
It confirmed all nine problems the builder noted after trying them:
- crowding;
- two rows of controls;
- jarring movement;
- pointer arrows clipped near the chat;
- small arrows;
- the chat jumping on a new click;
- the click location tied to the first question;
- "Explain this";
- station bubbles breaking one letter per line.

It added one blocking issue: at 300% browser zoom the chat shrank to a 150px sheet with its input outside it. The builder asked for everything to be fixed. They chose one row of controls that keeps each style's look, and chip-like click entries. The top display and strip were left to design judgement, since "chat and actions matter most".

## Decision

- **One row of controls per reply, in every style.**
  - Assistant: `‹ 2/3 › All … Back`.
  - Audio guide: `‹ 1 2 3 › ▦ ↶`.
  - Station: `‹ U1 U2 U3 › ▦ ↶`.

  A window of three number keys follows the current source. Read aloud sits at the end of the answer.
- **One home per fact.** The audio guide's top display and the station strip are gone as separate bands. The status line at the bottom now carries their look (amber display, blue information strip). "Places found" and the Assistant subtitle are gone.
- **Places are entries in the log.** Each click is its own chip-like entry (pin, P-number, label), placed before what was asked there. It goes back to the place when chosen. A follow-up after the user moved re-captures the view but stays the same place.
- **One chat per conversation.** With continuity on, a new Alt+click keeps the open chat. The history and the chips of older answers survive, and the chat glides to the new click. "Capturing…" shows at once.
- **Movement is a setting.** `motion` (smooth or instant) and `motionMs` (default 350ms) drive page moves, Back, minimap and cue jumps, log scrolling and the chat's glide. Smooth is always instant when the system asks for reduced motion, and so is smooth zoom now. A wheel, touch or key on the page stops a glide.
- **Back is a bookmark.** The first move of a run saves where the user was reading, and Back returns there. Moving by hand between moves starts a new run.
- **Off-screen arrows.**
  - Each arrow is drawn at the true bearing from where it sits to its target.
  - Arrows are kept on screen.
  - An arrow is pushed outward along its own line when the chat is in the way, and falls back to the screen edge otherwise.
  - New `cueSize` setting (default 72, was a fixed 48), with the arrowhead as the main shape.
- **Short screens.** The layout accounts for height as well as width. The chat never shrinks below its header, three lines and the input. Quick actions hide once a conversation starts, and the status keeps to one line. A header button folds the chat to its header and status. On a short screen, the chat folds itself when it still covers a source it moved to.
- **The page's floating controls stay usable.** When the chat is placed (on open, on a new click, on resize, but not while it is dragged), it moves the least distance that clears the page's fixed controls. That includes the UniLens display-adjust widget, which, like the chat, lives outside `<body>` and is never part of the page UniLens reads or highlights.
- **Smaller fixes:**
  - "Explain".
  - 3件中 2件目.
  - The position is announced once, not twice.
  - The connection error no longer shows raw text.
  - A stronger pressed state on the station's Highlight all.
  - The station header reads ユニレンズ / UniLens in Japanese.
  - The view re-capture says "Sending your current view…".
  - Unused CSS removed.

## Consequences

- Typed commands ("next", "back") stay without hints, by the builder's earlier decision.
- Known limits, kept as they are:
  - When three or more arrows crowd one spot, their numbers can swap order along the edge.
  - Near the screen edge, a pointer arrow can sit under the cursor.
  - A floating control smaller than 22px can slip between the grid points the chat checks, so the chat may still cover it.
- Tests: `places.test.ts`, `zoom.test.ts` (glide, cancel, bookmark) and `highlight.test.ts` (true bearing, inset, chat avoidance, spacing, over 400 random layouts).
