---
Author: Yotam Sechayk
Date: 2026-09-25
---

# Closing hides the chat, and the conversation goes on

## Context

The chat's ✕ ended the conversation. It dropped the session, so the next click opened an empty chat with only the new place. The places before it were gone from the chat, although the product promise is one conversation where every click becomes a place you can go back to.

## Decision

- **✕ hides the chat.** Its log, places and session stay. The next alt+click (or the hint chip) shows it again at the new place, and the next question joins the same session.
- **A divider marks the gap.** Every time a hidden chat shows again, the log gets a horizontal rule with the time in its middle ("Reopened at 14:32", "14:32 に再表示"), just before the new place's entry.
- **Hidden means closed in every other way.**
  - Speech stops, the mic stops without sending, and the keyboard goes back to where it was.
  - An answer still on its way lands in the log. It makes no sound, is not read aloud, and draws nothing on the page.
  - Escape clears highlights, as it does with no chat open.
  - The dwell hint can show, and a capture running at the time is dropped.
- **Continuity off is unchanged.** Every click opens a fresh chat, so ✕ followed by a click gives a new one.
- ✕'s label says so: "Hide the chat. It keeps the conversation".

## Not in this change

- **Starting over.** A new conversation still needs a page reload. A "New conversation" button is in TODOS.md as a future step.
- **Keeping the conversation across a reload.** That is the restore-after-reload PR (TODOS.md), with interaction data only.
