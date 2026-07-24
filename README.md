# UniLens Project
Making web-browsing accessible with in-page AI-partners.

## Prototype

Embeddable capture + chat overlay for any HTML page. Alt+click captures a full-page
screenshot annotated with viewport, mouse trace, and click position, sends it to the
backend, and opens a chat popover at the cursor backed by an LLM/VLM.

```
frontend/          Vite + React + TS — builds a single embeddable dist/unilens.js
backend/           Flask — stores captures, /api/chat with OpenAI / Gemini / stub
softbank-mirror/   Static copy of softbank.jp IR benefit page (test target)
example-of-track-and-screenshot/   Original vanilla JS proof of concept
```

## Run

Backend (stub works without API keys; copy `.env.example` to `.env` for real LLM):

```
cd backend
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python app.py          # http://127.0.0.1:5000
```

Frontend dev demo (proxies /api to Flask):

```
cd frontend
npm install
npm run dev                          # open the shown URL, alt+click anywhere
```

## Embed in any HTML

```
cd frontend && npm run build         # -> dist/unilens.js
```

```html
<script src="unilens.js"></script>
<script>
  UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })
</script>
```

Options: `trigger` (MouseEvent predicate, default alt+click), `mouseWindow` (seconds
of mouse trace), `backend` (Flask base URL).

To test against the SoftBank mirror: copy `frontend/dist/unilens.js` into
`softbank-mirror/`, add the two script tags above to its `index.html`, and serve the
folder (`python -m http.server`).

## Data

Each capture is stored under `backend/captures/<id>/`: `capture.png` (annotated
screenshot), `meta.json` (click, scroll, viewport, page size, mouse trace),
`chat.json` (conversation history).
