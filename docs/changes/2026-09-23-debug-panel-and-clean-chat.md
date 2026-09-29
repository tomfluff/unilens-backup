---
Author: Yotam Sechayk
Date: 2026-09-23
---

# Developer information moves to the debug panel; the chat shows the conversation

## Context

The chat popover mixed two audiences. Above the conversation it showed the
capture thumbnails, click/scroll/trace metadata, what the backend stored,
the clicked element, and under every reply a provider/model/latency footer;
under a follow-up it showed the view that was sent. A participant sees all
of that; a developer sees only the latest capture and loses the history of
what went to the model. The builder asked to separate user-facing from
developer-facing information (phase-1 notes, A0).

## Decision

- **Chat:** messages, citation chips, the evidence action row, quick actions
  and the input. Nothing else; an empty conversation shows a one-line hint.
- **Debug panel (ctrl+shift+D):** a new "Sent to the model" section, newest
  first: every capture uploaded, including view refreshes, with the full
  annotated page and the close-up (each links to the backend's stored
  file), the metadata line, inventory size, what the backend stored, and
  every question asked against it with the reply's provider, model, image
  count, latency, cited ids, or error. The backend history page is linked
  for older sessions.
- **Panel handling:** drag the header to move it, the arrow folds it to its
  header; both are kept in settings (`debugPanel`) across reloads.
- **Log:** `sentLog.ts`, in memory for the page, capped at 20 captures
  because entries hold image data URLs.

## Consequences

- A developer checking what the model saw opens the debug panel; the
  popover no longer confirms the upload inline.
- Branch `f/debug-panel`, stacked on `f/ai-element-highlighting` because the
  chat code it moves changed there.
