---
Author: Faith Luo
Date: 2027-09-24
---

# Refactor `main.tsx`


Refactor `main.tsx` to use reuseable window components. Instead of hard-coding only a single static instance of a popover, use dynamically-generated popovers so that it is possible to create multiple windows.

The old behavior of pinned positions is replaced by a more general interface where your entire window state is synced to settings.

This change also introduces cleanup and refactoring to keep the 
systems reuseable and modular and follow good code style:

- Remove global statics when possible and replace them with a UnilensClient interface to wrap them
- Break out large functions into smaller hooks and library calls, including creating a separate `RequestApi.ts` to handle communication with the backend
- Wrap component logic in `UnilensRoot.tsx` to isolate the implementation of the React logic from the `init` scaffolding
- Add `Monomitter` event bus
- Separate click-event generation logic from handling logic by creating `clickHandlers.ts` which generates a monomitter that any interaction can subscribe to

Incidental:
- Removes the `regionSelect` setting in order to more generically support click-and-drag actions. Can easily be re-added if needed.
- Removes `pinnedState` settingin favor of a more general setting to save the entire session