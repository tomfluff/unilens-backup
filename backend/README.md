# UniLens Backend Overview (`backend/app.py`)

日本語版は [README.ja.md](README.ja.md) を参照してください。

**Role**: A lightweight Flask prototype API. It stores images and metadata captured by the frontend, then forwards them to an LLM/VLM to answer questions.

## Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/capture` | Saves the PNG (full-page image + close-up) and metadata sent from the frontend into `captures/<id>/`. Appends to an existing session if `session_id` is given, otherwise issues a new one |
| `GET /api/capture/<id>` | Reports the size of stored files (used by the "backend stored: ..." display at the top of the chat UI) |
| `GET /api/session/<sid>` | Returns the session's history and capture count (used to seed conversation continuity) |
| `POST /api/chat` | Passes the image, metadata, and history to the LLM, returning the reply all at once |
| `POST /api/chat/stream` | Same as above, but streams tokens incrementally via SSE (`text/event-stream`) |
| `GET /health` | Health check for confirming the active provider |
| `POST /api/tts/stream` | Reads `text` aloud as the POST's own answer: 16-bit mono PCM at 24 kHz, sent as it is made (OpenAI or Gemini), for the widget to play with WebAudio. A quick tunnel passes a POST's body on at once but holds a GET's until it is complete |
| `POST /api/study/log?pid=&session=` | The widget's events for a study participant, appended to `study-logs/<pid>/session-<n>.jsonl` (see Storage) |
| `GET /survey?quiz=<id>[&pid=&session=&lang=]` | The survey page (`survey.html`, running `quiz-lib` in page mode). Without `quiz`, a list of the surveys for the facilitator |
| `GET /api/quiz/<id>` | A survey's questions, from `quizzes/<id>.json` |
| `POST /api/quiz/log[?pid=&session=]` | The quiz widget's (`quiz-lib`) events, appended to `quiz-logs/<quiz id>.jsonl`; with a participant, also to their study log |
| `GET /api/quiz` | The surveys (in `quizzes/` or with a log): title, attempt and completion counts |
| `GET /api/quiz/<id>/results` | Each attempt at a quiz: its answers (`response`, `response_text`, `correct` — `null` for a question without an answer key), time per question (`ms`) and in all (`duration_ms`). Filters `?pid=`, `?session=`, `?attempt=`, `?completed=1` (see `quiz-lib/README.md`) |
| `GET /api/quiz/<id>/results.csv` | The same as a CSV for Excel (UTF-8 with BOM), one row per attempt: totals, then `<question>_ms`, `_s`, `_answer`, `_correct` for each question in the survey's order. Same filters |

## LLM provider selection

Switched automatically via environment variables (`_provider()`):
1. If `OPENAI_API_KEY` is set, use OpenAI (`gpt-5.4-mini`, Responses API)
2. Otherwise, if `GOOGLE_API_KEY` is set, use Gemini (`gemini-3-flash-preview`)
3. If neither is set, fall back to an **offline stub** (so the frontend can be verified without any keys; it just echoes things like the click position)

## Prompt design

`SYSTEM_PROMPT` instructs the model on how to read "an annotated screenshot (cyan = viewport, orange = mouse trace, red = click position) + a close-up image + page metadata." If clicked-DOM-element info or an Alt+drag selection region is present, the prompt tells the model to treat it as the top-priority clue.

## Session continuity

- `sessions/<sid>.json` stores `captures` (a list of capture IDs) and `history` (conversation history).
- When multiple captures span the same session, `_session_context_note()` passes a one-line summary of "where past captures were clicked" to the LLM (only the most recent image is resent, to save tokens).

## Storage

- `captures/<id>/`: `capture.png` (full annotated image), `viewport.png` (close-up, optional), `meta.json`, `chat.json` (one-off chat history outside of a session)
- `sessions/<sid>.json`: per-session history
- `quizzes/<id>.json`: the surveys shown at `/survey?quiz=<id>` (format in `quiz-lib/README.md`). In the repository.
- `quiz-logs/<quiz id>.jsonl`: every answer to a survey (`quiz-lib`), one event per line, append-only, with `pid`/`session` when the page named a participant. Git-ignored.
- `study-logs/<pid>/session-<n>.jsonl`: a study participant's interaction log, one event per line, append-only. Written only when the page address named a participant (`?pid=P03&session=1`); the widget then adds `pid` and `session` to every request. The widget sends its events (clicks, questions, answers, source presses, the microphone, read-aloud, outlines, errors) to `POST /api/study/log`, and the routes add the capture saved, the model's answer and latency, a transcript and a read-aloud request. Git-ignored. `study_export.py` turns them into a CSV and a Markdown timeline per session and a `summary.csv` (`.venv/bin/python study_export.py [pid…]`, into `study-logs/export/`).

