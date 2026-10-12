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
- **The highlight colour adapts to the page (`hlColorMode`, #26, Yotam 2026-10-12)**: a participant found a highlight that showed on one section's background vanish on another. "Adaptive color" (Look and feel, right after Highlight color; also in the session-2 panel) has four choices, each drawn on a light and a dark section in its tile. The band, brackets, underline, fill and glow follow it. The black and white ring and the thin border stay as they are, as do the numbers, the arrows and the page map.
  - **Off** (`fixed`): the highlight color as before. The initial prototype keeps it.
  - **Invert** (`invert`): the coloured parts are drawn in white, in a layer of their own under the numbers, blended with `mix-blend-mode: difference`, so they invert whatever is under them. The band inverts fully, so text it crosses stays readable. The fill and glow invert at most a quarter (a partial inversion greys text; at a quarter, black text on white keeps over 5:1).
  - **Best contrast** (`contrast`): from a palette of eight vivid colours (never black or white), the one whose worst contrast over the backgrounds under the highlight is highest. Near ties go to the earlier colour: yellow first, blue before red.
  - **Near this colour** (`near`): the chosen colour, its OKLCH lightness moved only as far as 3:1 over every background needs, within "How far the colour may change" (`hlColorRange`): a little (0.15), some (0.3), or as far as needed.
  - The backgrounds are read where the highlight is drawn: eight points just outside the element and five inside, each the stack of page elements under it, blended top-down. Gradients count each stop; same-origin images are sampled; anything unreadable counts as both black and white. A highlight across two backgrounds is judged by the worse. UniLens's own layers, chat and panels are never read. A colour whose fill or glow would push the element's text below 4.5:1 is left out.
  - Each box is re-read when it is drawn, at most every 200 ms while the page scrolls or changes, once more after it stops, and when an image loads.
  - The default is Off, in session 2 too (Yotam, 2026-10-12); the other three are in the participant panel. The UI spells it "color" (US spelling throughout).
- **"Both" source style (`sourceStyle: "both"`, #27, P04's request)**: a fourth style beside numbers in the text, underlined words and numbers after the answer. The numbers stay where the model put them, and every number appears again, once and in order, on a line after the answer. It sets `citePlacement: "both"` ("In the sentence, and again after the answer"); words are not underlined in it. The Sources button cycles in text → underlined → after → both, with its own icon, and `?sources=both` works in a link. The style setting now has tiles: a short two-source answer drawn by the chat's renderer, one per style. The session-2 default stays "In the text".
- **Read-aloud says the source numbers (`readSources`, #28)**: "Say the source numbers when reading aloud" (Conversation, Speaking and listening; also in the session-2 panel), off by default. With it on, reading an answer aloud (the Listen button, the folded header's, autoplay) says each number where the chat shows it, numbered as its chips: "(source 2)", "(sources 1 and 2)", and for the row after the answer "Sources: 1 and 2." Japanese: 「（根拠2）」, 「根拠：1と2。」. "Both" says them once, in the text. A failed answer says none. Not yet heard with either voice (no OpenAI credits); to check by ear before session 2.
- **A pulse (`hlPulse`, P02's request)**: "Pulse" in the highlight's settings and the session-2 panel, off by default. A ring in the highlight color, between black rims so it reads on any page, grows out from each highlight and fades, as the highlight appears: "A few times, then still" (three pulses) or "For as long as it shows". A source pressed again pulses again. Never under reduced motion. In forced colors it is drawn in the system's text color.
- **Lasting click marks (`clickMarks`, P02's and P03's request)**: "Keep a numbered mark where I clicked" (Conversation, and the session-2 panel), off by default. Each Alt+click leaves a ring and dot in the highlight color, between black rims, with its number, P1, P2, … as the chat's place entries are numbered; those entries still take the user back. A mark follows what was clicked when the page moves or re-wraps, and the clicked point when that is gone (a place brought back after a reload). The marks go when the conversation starts over. They sit outside the page, so captures never include them, and they never take a click.
- **The `session2` preset**: the initial prototype, plus numbers in the text, the Sources button, the 2 s pause, go-to and the gear with the participant panel. Ctrl+Alt+Shift+B now steps off → initial → session 2. `PRESET=session2 tunnel.sh` builds it into the tunnelled copy and its links.

## Consequences

- The initial prototype is unchanged, except that its voice pause is now also 2 s (the new default). The frozen session-1 build keeps its own copy until it is refrozen.
- Asking for the supported words adds a little to each answer in session 2.
- Go-to also answers "where are the notes" or "show me the title" by moving the page, because the model reads those as asking to be shown. Pressing the round arrow takes the page back.
- The chat never moves (as in session 1), so the place the page goes to can sit under the chat; the outline and its number show beside it.
