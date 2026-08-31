# UniLens — parked work

日本語版は [NEXT.ja.md](NEXT.ja.md) を参照してください。

Picked-up-later queue, in intended order. Context: prototype branch `unilens-prototype`,
all of the original 13-item improvement list plus guardrails/history/voice/hint shipped,
and item 3 below largely done (magnifier zoom, minimap, two pan engines).

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

Largely done — see the settled decisions below before changing any of it.

Shipped: fixed-element seating (replaced the planned per-selector counter-transform;
no selector list needed), sticky neutralisation, the minimap, a second pan engine
behind `settings.lensPan`, and a 100% floor on zoom-out.

Still parked:
- Momentum/precision tuning of wheel steps (current: exp(-deltaY*0.002), feels OK but untuned).
- Zoom-to-region: alt+drag while zoomed could zoom-to-fit that rect instead of capturing?
  (conflicts with region select — resolve in interaction rethink first.)
- Reset affordance visible while zoomed (badge is display-only; make it clickable → 100%).
  The settings panel's % button already resets; the corner badge does not.

### Settled decisions — don't re-litigate

- **Magnify, not reflow.** CSS `zoom` and browser-style reflow zoom were considered and
  rejected. The page is one magnified surface; scrolling moves a lens over it.
- **Fixed elements are part of that surface.** They are seated at the place they hold on
  the *unzoomed* page and pan out of view as you move away. Two earlier builds were
  rejected: pinning them to the window edges, and seating them wherever zoom started.
- **UniLens' own chrome stays at 1x**, deliberately, outside the transform.

### Open: which pan engine wins

`settings.lensPan` off (default) scrolls the document; on, it freezes the document and
pans by transform. Frozen is the honest magnifier — the page fires no scroll events, so
sticky, JS scroll handlers and scroll-linked animation cannot misbehave. Decide after
piloting, then delete the loser. If frozen wins, the sticky neutralisation is redundant
(a page that never scrolls never sticks anything) and the seating can drop its scroll term.

Gaps in the frozen engine, all unhandled:
- Anchor links, `scrollIntoView` and focus-scrolls-into-view do nothing — not intercepted.
- Lazy loading and infinite scroll driven by *scroll events* never fire. IntersectionObserver
  ones do, since IO uses post-transform geometry (unverified on a real site).
- Entering zoom removes the scrollbar, reflowing the page by its width.
- Text-selection autoscroll at the viewport edge is gone.

### The big remaining gap: nested scrollers

Sites with `body{overflow:hidden}` and an inner scrolling div. Scaling body doubles the
scroller's box while its `scrollHeight` stays put, so the bottom half of the content is
unreachable with no scrollbar for it. Measured on a synthetic fixture. Most SPAs are this
shape; the SoftBank mirror is not, which is why it hasn't bitten yet. Either detect and
refuse to zoom on those pages, or scale the real scroll container's content instead of body.

## Deferred earlier

- **Backend auth** (deferred from pilot hardening): shared key in embed vs Cloudflare Access.
- **Onboarding overlay** (original item 5): first-visit explainer of the gestures.
- **Contextual hint brief**: metadata-only quick LLM call to personalize the dwell chip text
  (see memory note idea-contextual-hint-brief).
- **API STT** (whisper) if native mic transcription proves weak on mixed ja/en.
