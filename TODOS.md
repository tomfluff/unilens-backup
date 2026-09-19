# TODOS

## unilens-lib

### Correct abort and close handling in the popover chat

**What:** Make in-flight chat, stream, and locate requests cancel or be ignored when the popover closes or a new capture opens it, instead of resolving into a component that no longer exists.

**Why:** `openPopover` (`unilens-lib/src/main.tsx:76-82`) unmounts and re-creates `ChatPopover` on every capture, and `ChatPopover.tsx` has no `AbortController` or unmount guard on any fetch (the only cleanup at `:331` stops speech). A late response from the previous capture can call `setMsgs` on an unmounted tree and, once highlighting lands, call module-level `showHighlights` for the wrong capture. Phase 1 papers over the highlight half with a capture-id guard in `highlight.ts` (eng review issue 1A); the general problem stays.

**Context:** Parked during the phase-1 eng review on 2026-09-18 at the builder's request so the highlighting work is not blocked on it. The clean fix is one `AbortController` per popover instance, created in the mount effect and aborted in cleanup, passed as `signal` to every `fetch` in `sendStreaming`, `sendPlain`, the session/capture detail fetches, and the future locate call; plus catching `AbortError` so it is not rendered as an error bubble. The stream reader loop also needs to stop on abort. Once that exists, the capture-id guard in `highlight.ts` becomes belt-and-braces rather than the only defence. Start in `ChatPopover.tsx` around the two `fetch(`${backend}/api/chat...` calls (~:453 and ~:513).

**Effort:** S
**Priority:** P2
**Depends on:** None (independent of the highlighting steps; best landed before step two's trial runner, which fires many requests quickly)

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

## unilens-lib (inventory)

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
