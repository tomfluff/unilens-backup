---
Author: Yotam Sechayk
Date: 2026-09-27
---

# The assistant can zoom the page

## Context

In a Live talk the builder asked "Can you zoom into that?" about a lit link; Live could not, so it lit the link again and said it had. They asked for the assistant, in the chat and in Live, to operate the zoom the way the user does with Ctrl and the wheel: into a highlight, or into a section of the page (R1 of the 2026-09-27 testing report). Later, not now: the assistant operates the accessibility panel's features too.

## Decision

- **What it can do:** zoom into an element, fitted to the screen and centred the way the double-click smart zoom fits a block (at most 5×); zoom a step in or out (the Ctrl + and Ctrl − step, 1.25×); or go back to 100%. The element zoomed into is lit, and the chat steps aside for it.
- **Only when asked.** The rules say to zoom only when the user asks; a new setting, "The assistant can zoom the page when asked" (on, under the evidence settings), turns it off, and then the model is not told it can.
- **Back returns to where the user was, at the zoom they had.** The view is bookmarked as any move to a source is, now with its zoom.
- **Live:** a `zoom` tool, with an element's id or a change (in, out, reset). A reset or a step out wins over an id sent with it (a model sent both for "zoom back out to normal"). Its result tells the model the zoom it went to ("315%").
- **Typed chat:** the answer carries a marker, `[[zoom:ID]]`, `[[zoom:in]]`, `[[zoom:out]]` or `[[zoom:reset]]`, which the widget acts on once the answer is complete, after its sources are lit. It is never shown or read aloud; a zoom into an element shows as that element's source number. The history keeps no zoom marker, so a later turn does not copy it and a chat back from a reload does not zoom again.

## Tried

- Typed chat, answers scripted: "zoom into the PayPay link" zoomed to 315%, centred, the link lit on both its lines; "zoom out a bit" stepped to 252%.
- Live, `gpt-realtime-2.1-mini`: "Can you zoom into the PayPay link?" called zoom with the link's id (315%); "Now zoom back out to normal" reset to 100%.

## Not in this change

- Zooming on its own initiative when something is small.
- Operating the accessibility panel (text size, colours): TODOS.md.
