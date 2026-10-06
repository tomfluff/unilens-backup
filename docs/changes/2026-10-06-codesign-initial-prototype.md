---
Author: Yotam Sechayk
Date: 2026-10-06
---

# An initial-prototype preset for the co-design study

## Context

The co-design study with six low-vision participants starts on 2026-10-07. Session 1 ends with a first try of a very basic UniLens. Later sessions add features as participants ask for them. The basic version is the same UniLens with a fixed arrangement of its settings. Yotam decided what it does:

- Alt+click a place, the chat opens, and the participant asks by typing or by voice.
- The microphone is on, answers can be read aloud, and the action sounds play. Live is off.
- Every answer highlights the places on the page it used. A source's chip scrolls the page there, and so does asking for it ("take me to the second one").
- The highlights are not grounded in the text: no underlined words, and no chips inside the sentences.
- Nothing else: no off-screen arrows, no minimap, no page zoom and no assistant zoom.
- Participants do not see the settings, but the facilitator can reach them.

## Decision

- **Presets** (`unilens-lib/src/presets.ts`): a named set of setting values. The first is `initial`, the initial prototype (Yotam, 2026-10-07: "baseline" is a term of user evaluations). Later sessions add theirs to the same table.
- **How a preset is chosen**, first match wins:
  1. the page address: `?unilens-preset=initial` or `?unilens-preset=off`, which is also remembered for the site (its other pages' links do not carry it);
  2. the facilitator's last choice on the site;
  3. the page's own `UniLens.init({ preset })`.
- **Applied whatever the browser's storage holds.** While a preset is on, every page load starts from the defaults plus the preset. A change made in the hidden settings panel is kept in this tab's `sessionStorage`, and only where it differs from the preset. It survives page changes and is gone when the tab closes. The user's own settings in `localStorage` are not read or changed, and come back when the preset is switched off. "Reset this tab" and the "changed" marks measure from the preset.
- **Hidden facilitator keys:**
  - `Ctrl+Alt+Shift+B` steps through the presets (off, the initial prototype, and later ones); with one preset it switches the initial prototype on or off and reloads. A short message says which is on.
  - `Ctrl+Alt+Shift+S` opens or closes the full settings, with or without the gear. The panel then says which preset is on.
  - `Ctrl+Alt+Shift+R` resets for the next participant: it forgets the kept conversation and the changes made in this tab, then reloads. From the key press on, nothing is saved, so a question or a restore still in flight cannot bring the conversation back. The reload waits until the store confirms the deletion (a few seconds at most), and the message after it says if the deletion could not be confirmed.
  - The keys go by the key's place (`KeyB`), so a Japanese IME or a Mac's Option key does not change them.
- **New settings** (each one is on, or today's behaviour, by default):
  - `citePlacement`: where an answer's source numbers go: in the sentence as the model put them (`inline`, the default and today's behaviour), at the end of each sentence (`sentence`), or all after the answer (`end`). Away from the words, the underlines of "Associate response text" are not drawn or asked for, and the row is hidden in the panel. No space is left where a number was taken out of a Japanese sentence.
  - `settingsButton`: shows or hides the gear. Hidden, `Ctrl+Alt+Shift+S` still opens the settings.
  - `aboutLine`: shows or hides the line above the field that says what the next question is about ("About all 3 sources"). Hidden, the outlined sources still go with the question, and the outlines on the page still show them.
  - `debugShortcut`: whether Ctrl+Shift+D opens the debug view. The debug view lists the highlight's look among its research settings.
- **`chatMovesAside` off now means the chat stays.** Before, a chat covering a chosen source still folded to its header in a short window (560 px high or less, which a browser zoom of 200% reaches on a laptop), whatever the setting. On, nothing changes.
- **Typed navigation in Japanese, and "take me to".** "Take me to the second one", "scroll to the first one", 「2番目に連れて行って」, 「3つ目」, 「次」, 「前の」, 「全部見せて」 and 「ハイライトを消して」 now steer the last answer's sources without a model call, like "show the second one" did. Questions that only start the same way still go to the model (「2番目の料金はいくら？」, 「次の電車は何時？」).
- **The initial prototype's values, and why:**
  - Asking: Alt+click only. Alt+drag region select is off (one way in, and a shaky Alt+click cannot turn into a drag). No quick-action buttons and no hints: participants say what they want.
  - Voice: the microphone is on and sends when the speaker pauses. Speech is recognised by the server with OpenAI (`sttEngine: openai`) for every participant, whatever the browser (Yotam, 2026-10-07): one recognizer, and the questions, the voice and a picture of the page go to one provider. The browser records. Once the voice was loud enough to count as speech, about 1.2 s under that level ends the message (background noise can keep it from ending; it stops after 60 s regardless). Pressing the microphone again also ends it. The recording then goes to the server to become text, and is sent; pressing the microphone while it is turned into text cancels it. Recording needs MediaRecorder, which Chrome and Edge (the study's browsers) have; a browser without it gets no microphone, and typing still works. Read-aloud is OpenAI too. Answers are read aloud on request, with the button on each answer, not automatically, so the facilitator and the participant can talk over a silent chat. The action sounds are on. Live is off.
  - Highlights: every answer outlines its sources (`autoHighlight: always`), numbered like its chips. One fixed look, every part named in the preset: the default black-and-white ring in yellow, with its glow and badges, 2 px, and no backdrop, so the page is not dimmed. Nothing shows participants that the look can change: no gear, and no debug shortcut. A chip moves the page only when its source is off-screen.
  - The chat never moves to uncover a source, on an answer or when a number is pressed (Yotam, 2026-10-07: stepping aside is a feature for later). It opens next to the click, and participants can drag it by its title.
  - No "About all 3 sources" line above the field (Yotam, 2026-10-07; not decided for good, so it is one value in the preset).
  - Source numbers go after the answer (`end`), not at sentence ends. Real answers in Japanese showed why: a number placed after 「。」 sits right before the next sentence's first word, so it reads as that sentence's. After the answer, the text reads plainly (and aloud), and no number claims a sentence, as "not grounded in the text" asks. Sentence ends stay available for a later session.
  - Nothing else moves or zooms the page: no off-screen arrows, no minimap, no Ctrl+wheel zoom, zoom keys or double-click fit, no lens panning, and no assistant zoom. The browser's own zoom and the participant's magnifier work as usual.
  - The chat: the standard assistant look, in English (the study runs in English, 2026-10-07), with the default click feedback (the orb). The conversation is kept across the site's pages. No gear and no debug panel.

- **An interaction log per participant and session** (Yotam, 2026-10-07). The page address names the participant and session (`?unilens-preset=initial&pid=P03&session=1`; each may come alone). The browser remembers them like the preset, nothing shows them, and the facilitator's reset forgets them. Every request to the backend then carries them, and the backend appends to `backend/study-logs/<pid>/session-<n>.jsonl` (git-ignored), one JSON event per line with its time:
  - from the widget (`POST /api/study/log`, sent in batches as plain text, so no preflight, and as the page closes): page loads; Alt+clicks (point, element) and captures (id, time taken); questions (typed or voice, the words, whether a command); answers (words, numbered sources with labels, model, time to answer); source numbers pressed (whether the page moved); commands such as "take me to the second one"; the microphone (start, end, what was heard); read-aloud (play, pause, resume, stop, and its states); outlines shown and cleared; the chat dragged or hidden; the facilitator's keys; errors; and every status line the chat said, with its sound;
  - from the routes: the capture saved, the model's answer and its latency, a transcript, a read-aloud request, and errors.
  - Pictures and page text stay in `backend/captures/<id>/`; the log names the capture. Nothing identifies the participant beyond the pid.
- **`backend/study_export.py`** turns one participant's logs, or all, into a CSV and a Markdown timeline per session, and a `summary.csv` with one row per participant and session.

## Consequences

- With no preset, everything behaves as before: the chips stay inline, the gear shows, and the settings are read from and saved to `localStorage`.
- A preset's values are checked like stored settings (`presets.test.ts`). Values equal to today's defaults are listed anyway, so a later change of a default does not change the initial prototype.
- In the initial prototype, an answer's outlines can sit under the chat. Participants press a number to scroll to a source, or drag the chat away. Stepping aside comes back in a later preset.
- The facilitator's guide and the frozen build for the sessions are kept locally, outside the repository.
