---
Author: Yotam Sechayk
Date: 2026-10-06
---

# A baseline preset for the co-design study

## Context

The co-design study with six low-vision participants starts on 2026-10-07. Session 1 ends with a first try of a very basic UniLens. Later sessions add features as participants ask for them. The basic version is the same UniLens with a fixed arrangement of its settings. Yotam decided what it does:

- Alt+click a place, the chat opens, and the participant asks by typing or by voice.
- The microphone is on, answers can be read aloud, and the action sounds play. Live is off.
- Every answer highlights the places on the page it used. A source's chip scrolls the page there, and so does asking for it ("take me to the second one").
- The highlights are not grounded in the text: no underlined words, and no chips inside the sentences.
- Nothing else: no off-screen arrows, no minimap, no page zoom and no assistant zoom.
- Participants do not see the settings, but the facilitator can reach them.

## Decision

- **Presets** (`unilens-lib/src/presets.ts`): a named set of setting values. The first is `baseline`. Later sessions add theirs to the same table.
- **How a preset is chosen**, first match wins:
  1. the page address: `?unilens-preset=baseline` or `?unilens-preset=off`, which is also remembered for the site (its other pages' links do not carry it);
  2. the facilitator's last choice on the site;
  3. the page's own `UniLens.init({ preset })`.
- **Applied whatever the browser's storage holds.** While a preset is on, every page load starts from the defaults plus the preset. A change made in the hidden settings panel is kept in this tab's `sessionStorage`, and only where it differs from the preset. It survives page changes and is gone when the tab closes. The user's own settings in `localStorage` are not read or changed, and come back when the preset is switched off. "Reset this tab" and the "changed" marks measure from the preset.
- **Hidden facilitator keys:**
  - `Ctrl+Alt+Shift+B` steps through the presets (off, baseline, and later ones) and reloads. A short message says which is on.
  - `Ctrl+Alt+Shift+S` opens or closes the full settings, with or without the gear. The panel then says which preset is on.
  - `Ctrl+Alt+Shift+R` resets for the next participant: it forgets the kept conversation and the changes made in this tab, then reloads. From the key press on, nothing is saved, so a question or a restore still in flight cannot bring the conversation back. The reload waits until the store confirms the deletion (a few seconds at most), and the message after it says if the deletion could not be confirmed.
  - The keys go by the key's place (`KeyB`), so a Japanese IME or a Mac's Option key does not change them.
- **Two new settings:**
  - `citePlacement`: where an answer's source numbers go: in the sentence as the model put them (`inline`, the default and today's behaviour), at the end of each sentence (`sentence`), or all after the answer (`end`). Away from the words, the underlines of "Associate response text" are not drawn or asked for, and the row is hidden in the panel. No space is left where a number was taken out of a Japanese sentence.
  - `settingsButton`: shows or hides the gear. Hidden, `Ctrl+Alt+Shift+S` still opens the settings.
- **Typed navigation in Japanese, and "take me to".** "Take me to the second one", "scroll to the first one", 「2番目に連れて行って」, 「3つ目」, 「次」, 「前の」, 「全部見せて」 and 「ハイライトを消して」 now steer the last answer's sources without a model call, like "show the second one" did. Questions that only start the same way still go to the model (「2番目の料金はいくら？」, 「次の電車は何時？」).
- **The baseline's values, and why:**
  - Asking: Alt+click only. Alt+drag region select is off (one way in, and a shaky Alt+click cannot turn into a drag). No quick-action buttons and no hints: participants say what they want.
  - Voice: the microphone is on and sends when the speaker pauses. Answers are read aloud on request, with the button on each answer, not automatically, so the facilitator and the participant can talk over a silent chat. The action sounds are on. Live is off.
  - Highlights: every answer outlines its sources (`autoHighlight: always`), numbered like its chips. The look is the default black-and-white ring with its glow and badges, and no backdrop, so the page is not dimmed. A chip moves the page only when its source is off-screen. A chat covering a source moves aside when a chip is pressed.
  - Source numbers go after the answer (`end`), not at sentence ends. Real answers in Japanese showed why: a number placed after 「。」 sits right before the next sentence's first word, so it reads as that sentence's. After the answer, the text reads plainly (and aloud), and no number claims a sentence, as "not grounded in the text" asks. Sentence ends stay available for a later session.
  - Nothing else moves or zooms the page: no off-screen arrows, no minimap, no Ctrl+wheel zoom, zoom keys or double-click fit, no lens panning, and no assistant zoom. The browser's own zoom and the participant's magnifier work as usual.
  - The chat: the standard assistant look, in the page's language (Japanese on `/ja/` pages), with the default click feedback (the orb). The conversation is kept across the site's pages. No gear and no debug panel.

## Consequences

- With no preset, everything behaves as before: the chips stay inline, the gear shows, and the settings are read from and saved to `localStorage`.
- A preset's values are checked like stored settings (`presets.test.ts`). Values equal to today's defaults are listed anyway, so a later change of a default does not change the baseline.
- When an answer arrives, the chat does not move on its own, as in Live. Its outlines can sit under the chat until a chip is pressed. Whether the chat should step aside when an answer arrives is open.
- The facilitator's guide and the frozen build for the sessions are kept locally, outside the repository.
