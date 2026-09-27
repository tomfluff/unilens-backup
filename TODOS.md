# TODOS

## unilens-lib

### A zoomed capture takes about 2.7 times as long

**What:** At 200% UniLens zoom, a capture of the fully expanded SoftBank page takes about 6.3 s against 2.3 s at 100%, in every html2canvas build. Without CJK fonts it is about 10 times as long. Find where the time goes (the frozen page's transform, the clone, fixed-element pins) and cut it.

**Why:** Found by the html2canvas-pro benchmark (2026-09-27). Low-vision users capture while zoomed, so they wait the longest.

**Context:** Benchmark and method: `.local/research/2026-09-27-html2canvas-pro-benchmark.md`. The capture renders the page unzoomed (`capture.ts`), so the zoom should not cost this much.

**Effort:** S
**Priority:** P2
**Depends on:** None

### Follow-ups from the review of #14–#16

**What:** Five smaller findings from the 2026-09-24 review of the three stacked PRs. The builder kept them for later. Reports are in `.local/reviews/2026-09-24-prs-14-16/`.
- **Citation ids across a view refresh.** Ids are numbered by position on each capture. After lazy-loaded content shifts the page, an earlier answer's `[[n30]]` can name a different element on the refreshed capture. Strip or namespace the ids of history turns that belong to another capture (`backend/app.py`, building `provider_history`).
- **Page text outside the datamarked block.** The clicked element's text, its nearest heading and the session note reach the prompt verbatim, and a code comment claims the inventory is the only page text the model sees. Datamark or delimit them the same way, and correct the comment.
- **Minimap redraws.** While zoomed, each highlight step rebuilds the whole minimap twice, forcing layout each time. Cache the page skeleton and redraw only the targets.
- **A click during a streaming answer drops that capture from the session.** `chat_stream` writes back the session it loaded before streaming. Reload it before saving, or lock per session.
- **No tests for the chat's async flows.** The capture queue, refresh binding, voice cancel and failed-capture paths were checked in the browser only. Add jsdom tests with mocked capture and fetch.

**Effort:** M
**Priority:** P3
**Depends on:** #14–#16 merged

### Harden UniLens against host pages

**What:** Build a local "hostile host" test page and run the end-to-end checks against it. Then address the open items in `docs/research/2026-09-24-host-page-hazards.md`, in order of how often study pages will hit them. First up: inner scroll containers, stale cited elements, patched built-ins, and the CSP limits of the embed.

**Why:** SoftBank's vendor bundle replaced `performance.now` with a lagging clock, which made every page glide jump. It was found only by accident (2026-09-24). The builder asked to keep these hazards in mind and record them.

**Context:** The research note lists each hazard with where it hits our code, what already guards against it, and what to try. The test page should have:
- a replaced clock;
- a strict CSP;
- an inner scroller;
- shadow DOM and an iframe;
- a capture-phase stopPropagation handler;
- a non-streaming fetch;
- `!important` button rules;
- a changing carousel.

**Effort:** M
**Priority:** P2
**Depends on:** None

### Live talk: what the first version leaves out

**What:** The chat's Live button (a spoken conversation over the OpenAI Realtime or Gemini Live API, `live.ts`) ships with open-mic turn-taking and the options that were clear. Still to do:
- push-to-talk (hold a key or the button), for users whose screen reader also speaks, or who think aloud;
- "wait until I say go" (no automatic reply);
- a language choice beyond the chat's language, and a headset/laptop mic setting (OpenAI noise reduction, Gemini sensitivity);
- sending the new view when the user scrolls or zooms mid-talk (OpenAI `conversation.item.delete` + a new item; Gemini `clientContent` between turns);
- test Gemini on laptop speakers: its audio plays through Web Audio, which the browser's echo canceller may not hear, so it could interrupt itself;
- test a talk past 10 minutes (Gemini resumes on `goAway`) and near OpenAI's 60-minute limit;
- host pages whose CSP blocks `wss://generativelanguage.googleapis.com` (Gemini) or the microphone (`Permissions-Policy`).

**Why:** The builder asked for live interactions (2026-09-24) and approved a first version with the undecided choices as settings (2026-09-27).

**Context:** Research brief: `.local/research/2026-09-27-realtime-apis.md` (parts E and F list the options and the untested points). Backend: `/api/live/<provider>` and `/api/live/log` in `backend/app.py`.

**Effort:** M
**Priority:** P2
**Depends on:** None

### A "New conversation" button

**What:** A control in the chat that starts over: a new session, an empty log, and the places numbered from P1 again. The current conversation stays in the backend's session history.

**Why:** Since #17, ✕ only hides the chat and keeps the conversation, so the only way to start fresh is a page reload. The builder asked for a button as a future step (2026-09-25).

**Context:**
- The session id lives on `UnilensClient` (`setSessionId(null)` starts a new one with the next capture).
- The chat's log is ChatPopover state; a fresh chat means a new React key in `UnilensRoot` (`chats++`), as with continuity off.
- Places are page-wide in `places.ts` (`clearPlaces()` exists).
- Questions to settle: where it sits (header or the minimized chat), whether it asks to confirm, and what screen readers hear.

**Effort:** S
**Priority:** P3
**Depends on:** #17 (✕ hides the chat)

### A reading that fails midway stops without saying so

**What:** When the streamed read-aloud audio fails partway (network drop, the backend's MP3 stream cut), `onerror` in `speech.ts` ends the reading silently. Decide what should happen: carry on in the browser's voice from about where it stopped, start the answer over in that voice, or say "Reading stopped" and offer play again.

**Why:** Codex review (2026-09-25). Before playback starts, a failure already falls back to the browser's voice. After it starts, the reading just ends, and the user can't tell a finished answer from a cut one.

**Context:** `speak()` in `unilens-lib/src/speech.ts` streams `/api/tts/<id>.mp3` (`backend/app.py`). Resuming mid-answer needs the played time mapped to a text offset. Restarting is simple but repeats what was heard.

**Effort:** S
**Priority:** P3
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

**What:** A one-page protocol in `docs/research/`: consent text (captures are a full-page PNG plus a text inventory of page elements, stored locally under `backend/captures` with the retention policy. The text inventory never holds what was typed in a field, but the screenshot shows whatever is on screen, field contents included; passwords stay masked), magnifier/zoom and high-contrast setup, the ~20-question task list per mirror, and what the observer records (time to acquisition, corrections, whether the target started off-screen, one surprise).

**Why:** Eventually a study needs a repeatable protocol. Builder's call (2026-09-19): the features are developed and decided first with the builder as the tester; participant testing and its protocol are considered only at the very end, after the fact.

**Context:** Raised by the Codex outside voice during the phase-1 eng review (2026-09-19). Not engineering scope; must precede the first participant, not step 0. The literature map is at `docs/research/2026-09-18-ai-element-highlighting-literature.md`; A11y-CUA's protocol is the nearest template.

**Effort:** S
**Priority:** P4
**Depends on:** Feature set decided with the builder as tester; not before
