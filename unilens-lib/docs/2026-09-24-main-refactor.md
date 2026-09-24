---
Author: Faith Luo
Date: 2026-09-24
---

# Refactor `main.tsx`


Refactor `main.tsx` into modules, so `init` only sets up the page-wide parts and a React root holds the chat.

This change also introduces cleanup and refactoring to keep the
systems reuseable and modular and follow good code style:

- Remove global statics when possible and replace them with a UnilensClient interface to wrap them (options, the backend, the conversation session)
- Break out large functions into smaller hooks and library calls, including creating a separate `requestApi.ts` to handle communication with the backend
- Wrap component logic in `UnilensRoot.tsx` to isolate the implementation of the React logic from the `init` scaffolding
- Add `Monomitter` event bus
- Separate click-event generation logic from handling logic by creating `clickHandlers.ts` which generates a monomitter that any interaction can subscribe to

## Rebuilt on the chat stack (2026-09-25)

The split was first written against the old `main.tsx`. Before merging, it was rebuilt on the chat stack (#14, #15 and #16), which rewrote `main.tsx`, `ChatPopover.tsx` and `settings.ts`. Changes from the first version:

- UniLens keeps one chat. Every click becomes a place in the same conversation, so multi-window mode is dropped. `UnilensRoot` holds that one chat and the capture flow that opens it or moves it to a new place.
- Saving the session to `localStorage` is dropped. Restoring after a reload will come in its own PR, and it will keep interaction data only (no screenshots).
- The `init` calls (zoom, minimap, highlights, settings) run once in `init`, and the debug panel and hint once when the root mounts, so nothing is set up twice.
- The `regionSelect` and `pinnedPos` settings stay, since the settings panel and settings files use them. `clickHandlers.ts` takes one trigger for clicks and one for starting a drag, and the drag trigger checks `regionSelect`.
- The chat header keeps pointer events for dragging, so pen and touch still work.
- `auto-bind` and the empty `consts.ts` are dropped. Nothing calls the client's methods unbound.
- `#unilens-root` now stays in the document. The chat inside it is what is open.
