# What a host page can do to UniLens: findings and things to try

Date: 2026-09-24. UniLens runs inside someone else's page, and that page's scripts, styles and policies are not ours. This note records what we found on the SoftBank mirror. It also lists the other ways a host page can break the widget or limit it. It is a reference for deployment and hardening work, not a plan: each item says where it would hit our code, what already guards against it, and what to try.

## The finding that prompted this

On the SoftBank mirror, every page glide jumped most of the way and then slid. SoftBank's vendor bundle (`site/set/common/jupiter/p/js/l3-vendor_2023.js`) polyfills `performance.now`, guarded by `!Object.prototype.hasOwnProperty.call(performance, "now")`. In a modern browser `now` lives on the prototype, so the guard is always true. The bundle therefore always replaces the native clock, with `Date.now() - (time the script ran)`. On the mirror that clock ran about 620ms behind the animation-frame clock.

The glide took its start time from `performance.now()` and each frame's time from the `requestAnimationFrame` timestamp. So the first frame believed the move was already mostly over. Fixed in `653f732`: glides use frame timestamps only (`zoom.ts`, see the comment at the glide's start).

A second bug was hidden behind it and surfaced once glides really ran. A move requested mid-glide spread a `DOMRect` (`{...rect}`). A DOMRect's fields are prototype getters, so the spread dropped the width and height, and the page scrolled to (0, 0). The same mistake bit us once before, in the cue code. **Never spread a DOMRect; copy its fields by name.**

How common this is: patching `performance.now` is rare on modern sites. It is not rare on large corporate sites that still ship jQuery-era polyfill kits, and the always-true `hasOwnProperty` guard is a known mistake in those kits. The general class, a page changing browser built-ins, is common enough to design for. For example, every Angular app patches timers, events and Promise through zone.js.

Our other clock use was checked the same day. Each comparison uses a single clock (`Date.now` against `Date.now`, `performance.now` against itself), so a slow but consistent replacement does no harm elsewhere.

## Already handled

| Hazard | Guard |
|---|---|
| Host CSS reaching the chat (`button {…}`, `img { height }`) | Every chat element is reset with `all: revert`, then styled (`chatStyles.ts`) |
| A transformed or zoomed `<body>` breaking `position: fixed` | All UniLens UI (chat, settings, highlights, minimap) and the accessibility widget mount on `<html>`, outside `<body>` |
| UniLens UI captured, inventoried or Alt+clicked as page content | Capture and inventory read `<body>` only; `isOwnUI` ignores clicks outside it |
| `scroll-behavior: smooth` on the host making each glide frame animate | Glide frames scroll with `behavior: "instant"` |
| AMD/RequireJS pages capturing a UMD bundle | esbuild emits an IIFE, which sets its own global |
| A patched `performance.now` | Glides use frame timestamps only |
| The page's own floating controls under the chat | The chat moves off fixed controls when it is placed (`clearOfHostControls`) |

## Open: where UniLens can work

1. **Content Security Policy.** A real site's CSP can block our script (`script-src`), the `<style>` we inject (`style-src` without `'unsafe-inline'`), calls to the backend (`connect-src`), the read-aloud audio (`media-src`) and data URLs. This is the main obstacle to embedding on sites we do not control.
   - *Try:* running as a browser extension, which avoids most of it for the study; adopting constructable stylesheets if the page allows them.
2. **Pages that scroll inside a container.** App shells often scroll a `div`, not the window. `revealElement` and the glide move only the window, so a source inside an inner scroller is not brought into view, and `directionOf` may be wrong.
   - *Try:* find the nearest scrollable ancestor of the target and glide it, then the window.
3. **Iframes and closed shadow DOM.** Capture, inventory and highlights cannot see inside them. Open shadow roots are reachable but not walked today.
   - *Try:* walk open shadow roots in `inventory.ts`; mark iframes as opaque regions the model is told about.
4. **Pages that change under us** (single-page-app re-renders, carousels, lazy loading, infinite scroll). A cited element can be replaced, leaving its chip pointing at nothing (`isConnected` is false).
   - *Try:* re-resolve a stale id by its inventory signature (role, name, text, position); say "that part of the page changed" instead of failing silently.
5. **Host `!important` rules.** `all: revert` does not beat `!important`.
   - *Try:* a shadow root for the chat (already in TODOS.md as host CSS isolation).
6. **Input conflicts.**
   - A host handler that stops propagation in the capture phase can swallow Alt+click or Escape.
   - Linux desktops use Alt+drag to move windows, which collides with region select.
   - Safari's Option+click downloads links.
   - *Try:* a configurable trigger (UniLens.init already takes `trigger`), a keyboard entry, and listening in the capture phase on `window`.
7. **Other patched built-ins.**
   - `fetch` polyfills without streaming bodies break `res.body.getReader()`, which the streaming reply depends on.
   - Patched `requestAnimationFrame`, `setTimeout`, `Promise` or `JSON` (Prototype.js-era `toJSON`) can misbehave in subtler ways.
   - *Try:* take pristine built-ins from a same-origin `about:blank` iframe at start-up; check for `[native code]` and fall back (for example, non-streaming chat when `getReader` is missing).

## Open: study, privacy and runtime

8. **Speech recognition goes to the cloud.** By default Chrome's `SpeechRecognition` sends microphone audio to Google's servers. Firefox has no speech recognition, and Safari's is partial. This matters for participant consent and ethics review of the voice message.
   - *Try:* state it in the consent form, or use on-device or our own backend transcription for study sessions.
9. **Autoplay rules.** Reading an answer aloud when it arrives, without a click, can be blocked by the browser.
   - *Try:* treat the send click as the gesture that unlocks audio (resume one shared audio element then); show a play prompt when blocked.
10. **Capture fidelity.** html2canvas cannot draw cross-origin images (they taint the canvas) or some CSS features, and fonts can differ (see the dev-demo font probe bug). The html2canvas-pro trial is in TODOS.md.
11. **Blocked storage.** `localStorage` can be unavailable in private windows and some iframes, so settings do not persist.
    - *Try:* confirm the settings store degrades to memory without throwing.
12. **HTTPS.** Browsers treat `127.0.0.1` as secure, but a deployed backend must be served over HTTPS or the page's requests will be blocked as mixed content.

## A test page for all of this

Most of these can be reproduced on one local page:
- a `performance.now` replaced with a lagging clock;
- a strict CSP header;
- the content in an inner scroller;
- an open shadow root and an iframe;
- a capture-phase `stopPropagation` handler;
- a `fetch` without streaming;
- `!important` button rules;
- a carousel that swaps its elements.

Running the end-to-end checks against it would catch regressions that the SoftBank mirror only shows by accident.
