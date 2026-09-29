---
Author: Yotam Sechayk
Date: 2026-09-27
---

# New conversation

## Context

Since ✕ hides the chat and keeps the conversation (#17), the only way to start fresh was a page reload. The builder asked for a button.

## Decision

- **A "Start a new conversation" button in the chat's header.** It asks first: "Start a new conversation? This one ends, and its places are cleared." The choices are "New conversation" and "Keep this one".
- **Escape answers "Keep this one"**, wherever the keyboard is in the chat, and before it would clear an outline. The keyboard goes back to the button.
- **Starting over:**
  - a new session starts on the capture the chat is on (`POST /api/session`), with continuity on or off;
  - the old conversation stays in the backend's history;
  - places count from P1 again, and outlines clear;
  - screen readers hear "New conversation".
- **If it cannot start**, the chat stays as it was and says so, and the button can be pressed again. A click made in the meantime keeps its own chat.

## Not in this change

- Going back to an earlier conversation.
