---
Author: Yotam Sechayk
Date: 2026-10-03
---

# A settings panel that shows what it changes

## Context

The settings panel had grown to 88 rows in 12 sections. It was a dark developer list of checkboxes and selects, in a look of its own, opened from a ⚙ glyph. It mixed the few settings a participant changes (text size, contrast, voice, highlight colour) with every research variable of the studies. Nothing showed what a choice would look like. The builder asked for it to be "more WYSIWYG and user friendly, but not overwhelming".

## Decision

- **Tabs by area** (Yotam, after trying a first version with a separate "Study" tab).
  - General, Look and feel, Conversation, Zoom, Voice and sound, AI, and Advanced. Each setting sits where it acts, whether participants or the research team change it.
  - "Find a setting" at the top of every tab searches all of them.
  - Every setting keeps its key, default, bounds and storage. Each sits in exactly one group (`PANEL_TABS`).
  - Two settings change:
    - `liveTalk` is new: "Talk live", beside "Speak your question". It shows or hides the chat's Live button, as `voiceInput` does the microphone. It is on by default, as the button was always shown; a talk already going keeps its stop button.
    - `minimap` becomes a choice: off, while zoomed (as before), or always. Older stored settings and files read `true` as while zoomed and `false` as off.
- **Previews and thumbnails drawn by the feature's own code.** The first version drew its thumbnails by hand, and they drifted from the features: the arrows were circles, the pointer cue a dot, the spotlight hard-edged. Now:
  - the highlight's outline and badge come from `paintOutline`, and its backdrop from `paintBackdrop`, split out of the page's own backdrop drawing;
  - the arrows come from the arrow painter (`cueSvg`, `aimCue`), at their real size and distance from the pointer;
  - the click feedback comes from its own markup and stylesheet (`fxStill`), paused partway;
  - the minimap's markers come from its marker painter (`paintMapTargets`), in its own box and lens;
  - the chat styles are the chat specimen, scaled.
  - Thumbnails are a close crop of a stage drawn at the page's size, then scaled down.
  - Previews: the chat (General, Conversation with the quick-action buttons, Voice and sound with the microphone and Live buttons and "Hear the action sound"), the highlighted page with an off-screen arrow (Look and feel, with "Try the click feedback" playing on the sample), and the page with its minimap (Zoom). AI and Advanced have no preview.
- **Third round (Yotam's review).**
  - The chat preview is the open chat's own markup, header to input row: a clicked place, a question, and an answer cited by the chat's citation code, so the chip, its station code and the "Associate response text" underline show as they will. The quick-action buttons and the microphone and Live buttons follow their switches.
  - The chat-look cards are bigger, and draw the chat at its real width.
  - The spotlight's holes are 1.5 feathers (21px) larger than their elements, on the page as in the previews: the blur had darkened a one-line source's own text. The holes are cut as their union (`unionRects`), so where the enlarged holes of a wrapped link's lines overlap, the overlap stays lit instead of going dark again under the even-odd rule.
  - Outline and backdrop thumbnails are a closer crop, so the black-and-white ring's bands show apart from "None".
  - A changed setting is marked by a bar beside its row instead of a "Changed" tag, which had moved the rows.
- **High contrast belongs to the chat.** It changes the chat and its preview, not the settings panel.
- **A modal dialog centred on the page, the settings beside their preview.**
  - The first version opened above the gear, 28em wide. At the Large and Extra large chat sizes its preview took most of a laptop window's height, leaving little room for the settings.
  - When the window holds 40em of the chat scale, the settings sit on the left and the preview on the right, each scrolling on its own. Narrower (a phone, a high zoom), the settings sit on top and the preview under them, in view while choosing.
  - A "Preview" switch in the header hides the preview; the dialog then narrows to the settings alone.
  - The dialog is a native modal `<dialog>`: the page and the chat wait behind a light scrim, the keyboard stays inside, and it sits above any host layer. Escape, the close key or a click on the scrim closes it.
- **Controls by kind.**
  - Looks are thumbnail cards.
  - Short choices are segmented rows.
  - Booleans are switches.
  - Sizes and times are sliders, each with an editable value and a unit.
  - The highlight colour has swatches and an "Other colour" picker.
  - Rarer settings sit behind "More options". A changed setting carries a "Changed" tag.
- **The chat's Assistant world:**
  - the same tokens and forced-colors borders;
  - em sizing from the chat scale;
  - an SVG gear.
- **The footer:** "Reset this tab", plus panel-wide save and load. The settings file format is unchanged.
- **Escape claims are a stack.** Opening the settings over the chat's "Start a new conversation?" no longer drops that claim when the settings close.

## How it was decided

- An impeccable concept roll dealt three structures: a preview with tabs, a category rail, and "yours, then the study's".
- Codex (gpt-6.1-sol) chose a hybrid of the first and last, and assigned all 100 settings.
- A finish review and a Codex code review followed, and their findings are fixed:
  - the preview stays in view while choosing;
  - the panel works at 400% zoom: the whole panel scrolls on a 320×180 window;
  - the sample is neutral, not an offer from the host site;
  - a changed setting is not marked by colour alone (now a bar beside the row, with the word for screen readers and the tooltip);
  - focus shows on "Other colour";
  - forced colors keeps the swatch colours;
  - resetting Study clears a voice from another provider;
  - a backdrop-only look draws no ring in the preview.
- Yotam reviewed three rounds in the browser; the dialog, the tabs by area, the drawing by the features' own code and the chat preview came from those rounds.
- Yotam confirmed two defaults: the panel always looks like the Assistant chat, whatever chat style is chosen, and participants may change their settings freely during studies.
- Every setting and choice has a Japanese name, the research variables included (`NAMES_JA`, `CHOICES_JA`; a test checks none is missing). The providers' model and voice names stay as they are.

## Not in this change

- The 表示調整 panel (accessibility widget) can stay open behind the settings. The settings dialog is modal, so only one can be used at a time, but closing 表示調整 when the settings open needs both widgets.
- The private demo recorder looks for the old panel's sections and labels, and needs updating before settings scenes are re-recorded.
