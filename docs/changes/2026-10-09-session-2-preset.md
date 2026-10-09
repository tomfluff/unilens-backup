---
Author: Yotam Sechayk
Date: 2026-10-09
---

# Session 2: numbers in the text, a Sources button, a longer voice pause

## Context

Session 1 of the co-design study (P01–P06) used the initial prototype. Two things came up for session 2:

- The 1.2 s pause that ends a voice message cut P03 off mid-sentence.
- Yotam wants the source numbers back inside the answer's text by default. Participants should be able to try the other ways: the words each source supports underlined, or the numbers after the answer. Sessions are remote, so the facilitator cannot press keys on the participant's computer.

## Decision

- **`voicePauseMs`**, a setting (600–4000 ms), replaces the fixed 1.2 s. It is how long a pause ends a voice message recorded for the server's recognizer. The default is **2000 ms**. Pressing the microphone again still ends the recording at once.
- **The Sources button (`sourceStyleButton`)**: a button in the chat's header that cycles where the source numbers go:
  - in the text (the default);
  - in the text, with the words they support underlined;
  - after the answer.
  - Each press is announced ("Sources now: …") and logged. It sets the existing `citePlacement` and `associateText`.
  - While the button is shown, every answer asks for the supported words, so a switch to underlines is exact at once, for earlier answers too.
- **`?sources=inline|underline|end`** in the page address sets the starting style, so the facilitator can put it in a participant's link. `tunnel.sh link P03 2 underline` writes it.
- **The `session2` preset**: the initial prototype, plus numbers in the text, the Sources button and the 2 s pause. Ctrl+Alt+Shift+B now steps off → initial → session 2. `PRESET=session2 tunnel.sh` builds it into the tunnelled copy and its links.

## Consequences

- The initial prototype is unchanged, except that its voice pause is now also 2 s (the new default). The frozen session-1 build keeps its own copy until it is refrozen.
- Asking for the supported words adds a little to each answer in session 2.
