# UniLens — parked work

Picked-up-later queue, in intended order. Context: prototype branch `unilens-prototype`,
all of the original 13-item improvement list plus guardrails/history/voice/hint shipped.

## 1. Interaction rethink (design conversation + prototype)

Current assignments and their problems:
- **alt+click** capture — alt is a browser/OS shortcut on some setups (alt+click = download
  in some browsers; alt focuses menu bar on Windows/Firefox); undiscoverable without hint chip.
- **alt+drag** region select — same modifier baggage.
- **ctrl+wheel** zoom — overrides the browser-native page zoom users may expect.
- **double-click** fit-zoom — collides with text-selection habits.
- **No touch story** — no alt, no wheel, no hover on mobile/tablet; pinch is native there.

Directions to explore:
- Select-mode entry: small persistent UniLens bubble (like the settings gear) that arms a
  one-shot "click/drag what you want to ask about" mode — no modifiers at all.
- The dwell hint chip already provides a zero-shortcut path; measure how far it carries.
- Keyboard-only path for accessibility (tab-to-activate, arrow-select region?).
- Touch: long-press as capture, native pinch left alone (visualViewport already recorded).
- Decide what stays on modifiers as the "power user" layer vs. the discoverable layer.

## 2. Cleaner chat interaction (popover polish pass)

- Message grouping/spacing rhythm, tighter typography scale.
- Proper thinking indicator while streaming (replace bare "…").
- Distinct error message styling (currently plain bubbles).
- Empty-state copy when a capture opens with no messages yet.
- Thumbnail treatment: collapse capture preview after first message? click-to-expand full size.
- Scroll behavior: pin-to-bottom during streaming, but don't fight user scrollback.
- Input affordances: multiline (shift+enter), char limit indicator near cap.

## 3. Better zoom experience

- Momentum/precision tuning of wheel steps (current: exp(-deltaY*0.002), feels OK but untuned).
- Minimap overlay while zoomed >1 (page thumbnail + viewport rect, like the capture's).
- Fixed-element counter-transform for known selectors (mirror header/footer) so they stay
  pinned during zoom — see limitation notes in zoom.ts.
- Zoom-to-region: alt+drag while zoomed could zoom-to-fit that rect instead of capturing?
  (conflicts with region select — resolve in interaction rethink first.)
- Reset affordance visible while zoomed (badge is display-only; make it clickable → 100%).

## Deferred earlier

- **Backend auth** (deferred from pilot hardening): shared key in embed vs Cloudflare Access.
- **Onboarding overlay** (original item 5): first-visit explainer of the gestures.
- **Contextual hint brief**: metadata-only quick LLM call to personalize the dwell chip text
  (see memory note idea-contextual-hint-brief).
- **API STT** (whisper) if native mic transcription proves weak on mixed ja/en.
