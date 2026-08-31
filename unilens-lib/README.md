# UniLens Frontend Summary

日本語版は [README.ja.md](README.ja.md) を参照してください。

![Overview diagram](../docs/architecture.drawio.png)

**Overview**: An embeddable AI chat widget that adds visual context to any web page. It's a drop-in library — a single `<script>` tag plus `window.UniLens.init()` — built with React + TypeScript + Vite (`frontend/src/main.tsx`).

## Key modules

- **`main.tsx`** — Entry point. Alt+click (or Alt+drag for a region selection) triggers a capture, uploads it to the backend, and opens the chat popover. The popover's pinned position is persisted to localStorage and restored across reloads.

- **`capture.ts`** — The core capture logic. Renders a full-page screenshot with `html2canvas` and overlays:
  - a crosshair at the click position
  - a fading trail of the recent mouse trace
  - the current viewport rectangle (cyan outline)
  - the Alt+drag-selected region (magenta outline)

  It also produces a separate clean, high-resolution close-up of what the user is currently viewing. `object-fit` images are pre-rendered onto canvases beforehand to work around an html2canvas limitation. It also collects context on the clicked DOM element (tag, text, role, nearest heading, etc.).

- **`zoom.ts`** — Pinch-style page zoom via Ctrl+wheel (including trackpad pinch gestures). Applies `scale()` to `document.body`, compensating scroll to keep the zoom anchored at the cursor. Also supports double-click "smart zoom" to fit an element. Coordinates are always recorded in a zoom-independent "content space" so they align with the unzoomed screenshot.

- **`ChatPopover.tsx`** — The draggable chat UI. Displays the capture image and talks to the backend (`/api/chat` or `/api/chat/stream`). Supports streaming replies, conversation continuity (session ID), quick-action chips ("Explain this," "Summarize," "→ English"), and accessibility-oriented settings like high-contrast mode and adjustable text size.

- **`settings.ts`** — The settings panel opened from the gear icon (bottom-left). Persists per-feature toggles, capture resolution, and chat font size to localStorage, applying changes live.


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

