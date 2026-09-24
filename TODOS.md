# TODOS

## unilens-lib

### Correct abort and close handling in the popover chat

**What:** Make in-flight chat, stream, and locate requests cancel or be ignored when the popover closes or a new capture opens it, instead of resolving into a component that no longer exists.

**Why:** closing the chat unmounts `ChatPopover`, and `openPopover` (`unilens-lib/src/main.tsx`) re-creates it on a new capture when continuity is off (with continuity on, the open chat is kept since 2026-09-23), and `ChatPopover.tsx` has no `AbortController` or unmount guard on any fetch (the only cleanup at `:331` stops speech). A late response from the previous capture can call `setMsgs` on an unmounted tree and, once highlighting lands, call module-level `showHighlights` for the wrong capture. Phase 1 papers over the highlight half with a capture-id guard in `highlight.ts` (eng review issue 1A); the general problem stays.

**Context:** Parked during the phase-1 eng review on 2026-09-18 at the builder's request so the highlighting work is not blocked on it. The clean fix is one `AbortController` per popover instance, created in the mount effect and aborted in cleanup, passed as `signal` to every `fetch` in `sendStreaming`, `sendPlain`, the session/capture detail fetches, and the future locate call; plus catching `AbortError` so it is not rendered as an error bubble. The stream reader loop also needs to stop on abort. Once that exists, the capture-id guard in `highlight.ts` becomes belt-and-braces rather than the only defence. Start in `ChatPopover.tsx` around the two `fetch(`${backend}/api/chat...` calls (~:453 and ~:513).

**Effort:** S
**Priority:** P2
**Depends on:** None (independent of the highlighting steps; best landed before step two's trial runner, which fires many requests quickly)

### Live voice conversation

**What:** Turn the voice message into a live exchange: speak, hear the answer read back, and speak again without touching the chat. Barge-in stops the reading when the user starts talking.

**Why:** The builder's direction (2026-09-24): "in the future, what we want to do is enable sort of like live interactions." The voice message button is the first step.

**Context:**
- Today the voice message records with the browser's SpeechRecognition, which ends on a pause. It sends the transcript as a typed message (`toggleVoiceMessage` in `unilens-lib/src/ChatPopover.tsx`).
- Reading aloud uses `/api/tts` with a native fallback, and has play, pause and stop (`speech.ts`).
- Next steps:
  - a conversation mode that reads each answer aloud and listens again after it;
  - a way to interrupt, spoken or a key;
  - the earcons as turn-taking cues;
  - possibly a streaming speech API instead of browser STT, for Japanese quality and interruption.

**Effort:** M
**Priority:** P2
**Depends on:** None

### Many pointer arrows pointing the same way

**What:** Decide how "arrows around the pointer" show several targets that lie in about the same direction. Today they spread round the cursor circle so they do not stack. The spreading moves each arrow away from its true direction, and it reads as noise when there are many.

**Why:** The builder tested pointer mode and found the spreading "not the best kind of behavior we want", but had no better answer yet (2026-09-24). Arrows are now fixed to the cursor: a cue's position depends only on the pointer, its target and the other cues, never on page elements or the chat.

**Context:** Options to try with participants:
- one arrow per direction, with a count badge ("3");
- stacking the numbers inside one arrowhead;
- a fan that opens only on hover.

The spread lives in `settleCues` in `unilens-lib/src/highlight.ts`.

**Effort:** S–M
**Priority:** P3
**Depends on:** None

### Move research knobs out of the participant-facing settings panel

**What:** Render the inventory/locate research knobs (`inventoryMaxDepth`, `inventorySummaryDepth`, `inventorySummaryCap`, `inventoryMaxBytes`, `locateScreenshot`, `escapeOrder`) in a "Research" section of `DebugPanel` (ctrl+shift+D) instead of `SettingsPanel`, and clamp persisted values on read.

**Why:** `SettingsPanel.tsx:156` already notes the feature list "outgrew the window"; a low-vision participant should not scroll past byte caps and tree depths to reach font size. `min`/`max` on `<input type=number>` do not validate what zustand `persist` rehydrates from localStorage (`settings.ts:93`), so a stale or hand-edited value can be `NaN` or out of range.

**Context:** Raised by the Codex outside voice during the phase-1 eng review (2026-09-19); builder chose to park it. Phase 1 ships the `NUMBER_KNOBS` table in `SettingsPanel` (eng review 5A). The move is UI-only: the table and the `settings.ts` store stay; `DebugPanel` gets its first controls; add a `clamp()` pass in `settings.ts` on rehydrate. Do it before the first participant session if the panel proves distracting, otherwise with the step-two runner.

**Effort:** S
**Priority:** P3
**Depends on:** Phase-1 step 6 (the knobs exist)

### Choose the inventoryMaxBytes default from runner data

**What:** Lower `inventoryMaxBytes` from its 200 000-byte default once the step-two trial runner shows where recall stops improving with inventory size.

**Why:** Measured 2026-09-19 at default knobs (before depth-≤2 summaries): softbank-mirror ≈125 KB (~31k tokens), softbank-mirror-recruit ≈102 KB (~25k tokens), dev-demo 2 KB. 200 KB keeps every mirror whole but costs ~25–31k tokens per locate; 40 KB would truncate the SoftBank pages to their first third and make bottom-of-page targets unreachable by construction. A byte cap is a stand-in for a token budget; the right number is empirical.

**Context:** Raised by the Codex outside voice during the phase-1 eng review; builder chose to decide with data. Phase 1 ships 200 KB and a bytes + estimated-tokens readout in DebugPanel. When the runner exists, sweep `inventoryMaxBytes` ∈ {40k, 80k, 120k, 160k, 200k} over the ~20-question set per mirror and pick the smallest value whose hand-marked correctness matches 200 KB. Consider making the cap token-based once a tokenizer estimate is in the client.

**Effort:** S
**Priority:** P3
**Depends on:** Step-two trial runner

### Isolate UniLens UI from host page CSS

**What:** Render the popover, settings panel, debug panel, hint chip, minimap, and zoom badge inside a shadow root (styled-components via `StyleSheetManager target={shadowRoot}`), or at minimum give every UniLens root `all: initial` plus explicit values for the properties host type selectors commonly set.

**Why:** All UniLens UI is appended to `documentElement` in the light DOM, so any host type selector applies to it. On 2026-09-19 dev-demo's `img { width:100%; height:260px; object-fit:cover }` turned the popover's close-up into a 176×262 vertical strip; fixed by setting width/height/object-fit explicitly on the two images (`ChatPopover.tsx`). The same leak waits for `button`, `input`, `div`, `span`, `p` rules on the SoftBank mirrors and on any real host, and the fix-per-property approach does not scale.

**Context:** Shadow DOM is the real fix but touches event plumbing: `container.contains(e.target)` checks in `main.tsx` need `e.composedPath()`, the Escape single-owner in `highlight.ts` and `registerPopoverClose` must still see keydown from inside the shadow, `document.activeElement` becomes the host, and the live region for `announce` should stay in the light DOM so screen readers read it. Do it as its own lane with a Codex review; verify on both mirrors at 100/200/400% zoom. Cheaper interim: `all: initial; font: ...` on `PopoverContainer` and the two panels' roots.

**Effort:** M
**Priority:** P2
**Depends on:** None; land before the feel-check on the mirrors if their CSS leaks visibly

### Trial html2canvas-pro as the capture renderer and decide

**What:** Swap `html2canvas` (1.4.1, last release 2022, unmaintained) for `html2canvas-pro` (free, MIT, same API) on a branch, capture `dev-demo` and both SoftBank mirrors at 100/200/400% zoom, diff the PNGs against the current renderer, and decide whether to keep it.

**Why:** On 2026-09-19 a host rule `img { height: 260px }` in dev-demo broke html2canvas's font-metrics probe and shifted every glyph ~245px; fixed by pinning the probe in `capture.ts` (`guardFontProbe`). That is one known fault in a library that will not get patches; the fork carries fixes for modern CSS colours (oklch, color-mix), some layout regressions, and newer Chrome. If the mirrors hit another html2canvas fault, the swap is the remedy to try first.

**Context:** Drop-in: change the import in `unilens-lib/src/capture.ts` and the dependency in `unilens-lib/package.json`; keep the probe guard and the object-fit image preprocessing (check whether the fork makes either redundant). Verify with the headless capture script pattern used for the 2026-09-19 bisect (Playwright, alt+click, read `backend/captures/<id>/capture.png`). No cost involved.

**Effort:** S
**Priority:** P3
**Depends on:** None; do it when a second html2canvas fault appears, or before the step-two runner if capture time matters

### Think through "Guide to" in its own session

**What:** Decide what "Guide to" means for magnifier users, then build it as the third evidence action: a camera move, a drawn trail from the pointer, a step list, or something else.

**Why:** Builder's call (2026-09-23): clicking a chip or the navigator already moves to an item, so a plain "Scroll to" was removed; "Guide to" must earn its place as deliberate guidance, and needs its own thought session outside phase 1.

**Context:** Options page https://claude.ai/artifact/TmaPQ7ZRpSZ9pEmhn2CnB5 (G1 camera move, G2 trail, G3 step list). Role-play synthesis on movement: `docs/research/2026-09-23-evidence-movement-roleplay.md`. The Back stack in `zoom.ts` (revealElement, returnToPreviousView) is the return path any guide should use.

**Effort:** M
**Priority:** P2
**Depends on:** Its own design session

### Inventory completeness beyond phase 1

**What:** Extend the walker to pierce open shadow roots, record iframes as opaque nodes, use `getComputedStyle` for `visibility:hidden` / `display:none` (a non-zero rect is not enough), and stop mapping every `tabindex >= 0` element to `button`.

**Why:** Phase 1's inventory is not an accessibility tree; free-form "where is X?" accuracy on real sites will hit these. `aria-labelledby` and `<label for>` are already in the phase-1 fallback chain (privacy change T4); the rest is input to the inventory-structure office-hours session.

**Context:** Raised by the Codex outside voice during the phase-1 eng review. Start in `unilens-lib/src/inventory.ts` (walker pass 0 skip rules and the role table). Let the step-two runner show which misses are actually these before building; `dom-accessibility-api` is the library if full accname computation is ever wanted.

**Effort:** M
**Priority:** P2
**Depends on:** Step-two runner data

## Feel-check (after step 5)

### Feel-check the decided interaction mechanics on the real build, on the mirrors

**What:** With phase 1 running on `softbank-mirror` (:8000) and `softbank-mirror-recruit` (:8002) at 100/200/400% zoom, sit with the feature for 20 minutes and re-check four decisions that were made on principle rather than on a used surface: (1) Escape single owner (T1): with an outline and the chat open, does one Escape do the expected thing under each `escapeOrder`, and does the host page's own Escape (cookie banner, modal) still work? (2) Stale-answer discard (T6): ask, then alt+click elsewhere before the answer lands; is the silent discard understandable, or does the user need a short "answer for the previous capture discarded" note? Ask twice fast; does the outline always belong to the last question? (3) Minimap marker (D11): at 400% with an off-screen target, is the marker perceivable in high contrast, and is "no cue at 100%" acceptable in practice? (4) Rung-2 preview: try a hand-triggered pan-to-target and note whether it disorients; this informs rung 2, not phase 1.

**Why:** The simulator proved the mechanics but was "a bit difficult to use"; the builder chose the most predictable option for T1 and T6 and asked to re-check the feel on the developed case. Decisions that hold up on a real page get promoted to defaults; ones that don't get a knob or a rung-2 ticket.

**Context:** Design doc: `~/.gstack/projects/tomfluff-unilens/yotam-f-ai-element-highlighting-design-20260918-193605.md` (Definitions: dismissal, current-capture guard). Simulator for reference: https://claude.ai/artifact/MN1mZqzqC2HmUEYiqdQrGk (settings → "Open decisions"). Record findings in `docs/research/` next to the participant protocol so they feed the first session.

**Effort:** S
**Priority:** P1
**Depends on:** Phase-1 step 5 (popover wired to /api/locate) on the mirrors

## Later (after the features settle)

### Participant session protocol for the first low-vision session

**What:** A one-page protocol in `docs/research/`: consent text (captures are a full-page PNG plus a text inventory of page elements, stored locally under `backend/captures` with the retention policy; no form values are ever captured), magnifier/zoom and high-contrast setup, the ~20-question task list per mirror, and what the observer records (time to acquisition, corrections, whether the target started off-screen, one surprise).

**Why:** Eventually a study needs a repeatable protocol. Builder's call (2026-09-19): the features are developed and decided first with the builder as the tester; participant testing and its protocol are considered only at the very end, after the fact.

**Context:** Raised by the Codex outside voice during the phase-1 eng review (2026-09-19). Not engineering scope; must precede the first participant, not step 0. The literature map is at `docs/research/2026-09-18-ai-element-highlighting-literature.md`; A11y-CUA's protocol is the nearest template.

**Effort:** S
**Priority:** P4
**Depends on:** Feature set decided with the builder as tester; not before
