# survey-backend

日本語版は [README.ja.md](README.ja.md) を参照してください。

The survey's own server (Express + TypeScript): the survey page, quiz-lib's
build and `/api/quiz/*`. It took these over from the Flask backend with the same
URLs, answers and log format, so quiz-lib only had its `backend` address
changed. The rest of the backend (chat, capture, read-aloud) is Flask's.

The survey's log is its own: nothing here writes to the study's
per-participant logs (`backend/study-logs/`). The participant (`pid`,
`session`) is still on every line, so the two can be joined later.

## Run

```bash
make init                 # from the repo root: also runs npm install here
make serve-survey         # http://localhost:5100/survey, rebuilds and restarts on save
make test-target survey-backend
```

`SURVEY_PORT` in `make-include.mk` sets the port.

## Endpoints

| Endpoint | Description |
|---|---|
| `GET /survey?quiz=<id>[&q=&pid=&session=&vid=&return=&tab=]` | The survey page (`survey.html`, quiz-lib in page mode). Without `quiz`, the list of surveys |
| `GET /survey/quiz.js` | quiz-lib's build (`quiz-lib/dist/`); 503 until `make build` |
| `POST /api/quiz/log[?pid=&session=]` | quiz-lib's events, `{"events": [...]}` as text/plain; appended to `<logs>/<quiz id>.jsonl` |
| `GET /api/quiz/<id>` | A survey's questions |
| `GET /api/quiz` | The surveys, defined or logged, with attempt and completion counts |
| `GET /api/quiz/<id>/results` | Each attempt with its answers and timings. Filters `?pid=`, `?session=`, `?attempt=`, `?user_id=`, `?survey_id=`, `?completed=1` |
| `GET /api/quiz/<id>/results.csv` | The same, one row per attempt, for Excel (UTF-8 with BOM) |
| `GET /api/quiz/<id>/progress?pid=&session=` (or `?vid=`) | One visitor's progress, for the test pages' button |
| `GET /health` | `{"status": "ok"}` |

## Configuration

All optional; relative paths are from this folder.

| Variable | Default | What |
|---|---|---|
| `SURVEY_PORT` | `5100` | The port |
| `SURVEY_LOGS_DIR` | `quiz-logs` | The answers' log (git-ignored) |
| `SURVEY_DEFINITIONS_DIR` | `quizzes` | The surveys' questions |
| `SURVEY_PAGE` | `survey.html` | The survey page |
| `QUIZ_LIB_DIST` | `../quiz-lib/dist` | quiz-lib's build |

To add a survey, put `quizzes/<id>.json` (format in `quiz-lib/README.md`; the
file name is the id its answers are logged under). The answers the Flask backend
collected before the move are in `backend/quiz-logs/`; copy them into
`quiz-logs/` to keep them in the results (the format is the same).

## Layout

```
src/
  core/      the survey's logic: what is logged, attempts, progress, CSV (no I/O)
  store/     where data lives: JsonlStore (answers), FileDefinitions (questions)
  handlers/  the API, Lambda-shaped: (request, deps) -> {statusCode, headers, body}
             write.ts  POST /api/quiz/log
             read.ts   every GET under /api/quiz
  app.ts     Express: routes to the handlers, the page, quiz.js
  server.ts  starts it
```

The handlers know nothing about Express, so they can later run behind API
Gateway as Lambda functions unchanged. The answers' storage is the
`QuizEventStore` interface (`store/types.ts`): a DynamoDB store replaces
`JsonlStore` without touching the handlers.

## Compared with the Flask backend's survey routes

Checked before the move by sending the same requests to both (about 130,000 responses and the
log files byte for byte, plus the real `unilens-poc` log): no differences, except
on purpose:

- No study-log copy (above).
- A survey answer containing U+2028/U+2029/U+0085 is kept. Flask writes such a
  line raw and then splits it when reading back, losing the event; here it is
  written escaped, and a raw one from Flask is read whole.
- An unknown path gets a JSON 404 rather than Flask's HTML page.
- An event whose `type` is a list or an object is dropped (counted in
  `dropped`) rather than failing the request with a 500.
