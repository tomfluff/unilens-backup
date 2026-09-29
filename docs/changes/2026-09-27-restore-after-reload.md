---
Author: Yotam Sechayk
Date: 2026-09-27
---

# After a reload, the conversation on this site comes back

## Context

A reload lost the chat, its places and the zoom. PR #13 tried restoring from the site's `localStorage`, with each click's screenshots (about 830 KB each): the quota ran out after about five clicks, and the images sat where the site's scripts could read them. The builder decided on UniLens's own store, per site, with interaction data only (2026-09-24).

## Decision

- **"Keep the conversation across reloads"**, on by default, with continuity on.
- **UniLens's own store.** The backend serves a small page (`GET /store`) that the widget loads in a hidden frame and talks to with `postMessage`. It keeps the data in IndexedDB under the backend's origin: not among the site's own keys, and kept apart per site by the browser. Keys carry the embedding page's origin too, for browsers that do not partition.
- **Interaction data only:** the session id, the capture the chat was on, the places, and the zoom and view. The page is kept as a hash, not its address. No screenshots and no messages: the session's history on the backend brings the messages back.
- **After a reload:**
  - a chat that was open reopens, without taking the keyboard, and screen readers hear that it is back;
  - one hidden with ✕ comes back with the next click;
  - either way, a "Page reloaded at…" divider follows the earlier messages;
  - places and the zoom come back on the same page only;
  - the first question captures the view again, since the page's elements are new.
- **Saved when the chat changes, and as the page goes.** Kept a week. Turning the setting (or continuity) off forgets it.
- **A click while the page loads starts its own conversation**, and the restore stands aside.

## Trust model

The store keeps the conversation out of the site's storage and away from other sites. It cannot hide it from the site that embeds UniLens: a script on that page runs as the widget does, so it could ask the frame too, and it already sees the widget's requests. That site is trusted with its own users' conversations.

## Not in this change

- Restoring the scroll position at 100% zoom: the browser already does it on a reload.
- Outlines and chips for answers from before the reload: their elements are gone.
