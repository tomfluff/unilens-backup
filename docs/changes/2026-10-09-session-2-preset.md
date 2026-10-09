---
Author: Yotam Sechayk
Date: 2026-10-09
---

# Session 2: numbers in the text, a Sources button, a longer voice pause, go-to, a participant panel

## Context

Session 1 of the co-design study (P01–P06) used the initial prototype. Two things came up for session 2:

- The 1.2 s pause that ends a voice message cut P03 off mid-sentence.
- Yotam wants the source numbers back inside the answer's text by default. Participants should be able to try the other ways: the words each source supports underlined, or the numbers after the answer. Sessions are remote, so the facilitator cannot press keys on the participant's computer.
- Participants asked UniLens to take them somewhere in their own words (P02: "take me to the notise"; P03: "Take me to the place on this page showing me the punctuality notifications for the months during 2026."). The matcher only takes short fixed phrases ("take me to the second one"), so these went to the model, which only described where to look.
- Participants should be able to change some settings themselves in session 2, but not all 90.

## Decision

- **`voicePauseMs`**, a setting (600–4000 ms), replaces the fixed 1.2 s. It is how long a pause ends a voice message recorded for the server's recognizer. The default is **2000 ms**. Pressing the microphone again still ends the recording at once.
- **The Sources button (`sourceStyleButton`)**: a button in the chat's header that cycles where the source numbers go:
  - in the text (the default);
  - in the text, with the words they support underlined;
  - after the answer.
  - Each press is announced ("Sources now: …") and logged. It sets the existing `citePlacement` and `associateText`.
  - While the button is shown, every answer asks for the supported words, so a switch to underlines is exact at once, for earlier answers too.
- **`?sources=inline|underline|end`** in the page address sets the starting style, so the facilitator can put it in a participant's link. `tunnel.sh link P03 2 underline` writes it.
- **Go-to (`assistantGoTo`)**: when the user asks to be taken to something, shown where it is, or to see it on the page, the model adds a go-to marker, `[[goto:nX]]`, with the inventory element's id. Once the answer is complete the widget acts on it the way pressing that source's number does: the page scrolls there if it is off-screen, and the element is outlined. There is no guard: the model decides (Yotam, 2026-10-09).
  - The marker shows as that element's citation, a single number even when the model also cites the element. It is never read aloud, and the history keeps it as a citation, so a later answer cannot copy it.
  - Each go-to is logged (`goto`) with the question that led to it, the element, its label, whether the page moved, or why nothing happened (the element is not a source of the answer, or no longer on the page). The export counts these apart from the sources the participant chose.
  - A late answer moves nothing: if the user closed the chat, or asked or Alt+clicked again before the answer finished, the go-to is logged as not done, with the reason.
  - The matcher still takes the exact short phrases at once, without the model.
- **A participant settings panel**: a preset may list the settings a participant may change (`panel`). In it, the gear (bottom left, "UniLens settings") opens a panel with only those settings, under the usual tabs; its search finds only them, and saving and loading settings files are hidden. The facilitator key Ctrl+Alt+Shift+S still opens every setting. For session 2 (agreed with the session lead): highlight colour, outline and backdrop; page zoom and the zoom keys; off-screen arrows; the page map; Live; drawing a box; speak your question, read answers aloud, the reading voice; sounds; chat text size; high contrast. The source style stays on the Sources button, and the voice pause is not in it.
- **Kept per participant (`keepPerParticipant`)**: in session 2 each task link, pasted in the Zoom chat, opens a new tab. So the session2 preset keeps a participant's changes (the panel, the Sources button) in the browser's localStorage under the preset and their pid, not in the tab. Tabs still open take up each other's changes. The facilitator's reset (Ctrl+Alt+Shift+R) forgets them. Without a pid, changes last for the tab, as in session 1.
- **The `session2` preset**: the initial prototype, plus numbers in the text, the Sources button, the 2 s pause, go-to and the gear with the participant panel. Ctrl+Alt+Shift+B now steps off → initial → session 2. `PRESET=session2 tunnel.sh` builds it into the tunnelled copy and its links.

## Consequences

- The initial prototype is unchanged, except that its voice pause is now also 2 s (the new default). The frozen session-1 build keeps its own copy until it is refrozen.
- Asking for the supported words adds a little to each answer in session 2.
- Go-to also answers "where are the notes" or "show me the title" by moving the page, because the model reads those as asking to be shown. Pressing the round arrow takes the page back.
- The chat never moves (as in session 1), so the place the page goes to can sit under the chat; the outline and its number show beside it.
