---
Author: Yotam Sechayk
Date: 2026-09-24
---

# Arrows fixed to the cursor, grouped settings, voice messages, and a smooth page glide

## Context

The builder tested the critique round and reported:
- Pointer arrows were shoved away near the chat.
- The settings panel was hard to navigate: the glow toggle sat far from the outline choice.
- The status line took space and was hard to read at magnification.
- Chat text size and panel size were one knob.
- The page glide jumped, then slid.

They also asked for a voice-message button (a step toward live voice interaction), plus play, pause and stop for reading aloud. The minimized chat should keep both.

## Decision

- **Pointer arrows are fixed to the cursor.**
  - Each arrow sits on the `cueRadius` circle at its bearing and points at its target.
  - No page element, chat or screen edge moves it.
  - Pointer arrows draw above the chat (their own layer; the chat moves to z-index 2147483646) and never take a click.
  - Several arrows in one direction still spread round the circle; how to show many arrows is filed in TODOS.md.
  - Edge mode is unchanged.
- **Settings in groups.** Chat, Answers and sources, Highlight look, Off-screen arrows, Movement, Minimap, Page zoom, Asking, and Capture and research. Each group folds, and each holds every kind of control about its topic. A test keeps every control in exactly one group.
- **Status line only when minimized.** Open, the controls show each action, and the live region speaks it. While a click is being captured, a dashed "Capturing…" entry stands in the log.
- **Chat scale and text size.** The old text-size choice is now "Chat scale" (the whole panel). A new "Text size" slider (80–200%) scales the words of each message on top of it; buttons, place entries and the input follow the chat scale, so the controls row never overflows.
- **Voice message.** A button next to send records a message with the browser's speech recognition. The transcript fills the field as it is heard and is sent when the speaker pauses or presses stop. Recognition listens in the chat language the user chose, or else their browser's language. The dictation mic stays for text they want to edit first.
- **Reading aloud** has play, pause, resume and stop on every answer. Minimized, the header keeps the voice-message button and "read the last answer".
- **The page glide starts where the reader is.**
  - SoftBank's vendor script replaces `performance.now` with a clock about 620ms behind the animation-frame clock. The glide mixed the two clocks, so its first frame thought the move was mostly done.
  - Glides are now timed from frame timestamps only.
  - A second bug surfaced once glides really ran: a move requested mid-glide copied a DOMRect by spreading it, lost its size, and sent the page to the top.
  - The curve is now ease-in-out, so the first frame no longer lurches.

- **Later the same day, from testing:**
  - **Minimap.** It draws in the highlight's layers (backdrop, outline, fill, glow, numbers). "Same look as the highlights" makes it follow the highlight settings. The marker-size knob is now "Smallest target on the map".
  - **Text size.** The slider scales only a message's words; buttons follow the chat scale, so the controls row fits.
  - **Alt+click feedback.** A ripple, then a breathing two-tone orb at the click until the chat opens (the first spinner was too thin to see), and typing dots until an answer's first words.
  - **Outlines can always be turned off.** The click entry and a lit source are toggles.
  - **Voice buttons** show in every browser. Where speech recognition is missing they explain in the chat instead of vanishing.

- **Click feedback styles.** After the builder compared six live studies, five became the `clickFx` setting ("Waiting at the click", Style): breathing orb (default), aurora, sonar, frame what was clicked, and screen edge glow. The "comet to the chat" study was dropped, because it left the click at once.

## Consequences

- Near the screen edge a pointer arrow can be partly off-screen, by design: its place follows the cursor alone.
- Live voice conversation (read back, listen again, barge-in) is filed in TODOS.md.
