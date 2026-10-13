# quiz-lib

日本語版は [README.ja.md](README.ja.md) を参照してください。

An embeddable questionnaire widget for any HTML page, built the same way as
`accessibility-lib`: one script, `dist/quiz.js`, started with
`UniLensQuiz.init()` (`window.Quiz` is the same API when the page has no global
of that name). A pill labelled "アンケート" / "Survey" opens a panel that walks
the visitor through the questions and ends with a thank-you and their own
answers. By default nothing on screen says whether an answer was right: no
verdicts, correct answers, explanations or score. Questions may carry an answer
key; it is then graded in the log only (or on screen with `showFeedback: true`).

- The quiz comes from the host page: inline, or a JSON file.
- Single choice, multiple choice and typed answers.
- Japanese and English, with a 日本語 / English switch at the top of the panel.
  Until the visitor uses it the language follows `<html lang>`, then the browser;
  their choice is remembered and wins. Write each text as `{ "ja": …, "en": … }`
  so the switch changes the questions too.
- Progress is kept in the browser: a reload resumes the attempt.
- With `backend`, every answer is logged to the UniLens backend
  (`backend/quiz-logs/<quiz id>.jsonl`), and into the study log when the page
  names a participant (`?pid=P01&session=1`).
- Accessibility follows the display panel: 44px targets, keyboard and
  screen-reader support, right/wrong (when shown) never by colour alone, high contrast
  (`prefers-contrast: more`, and the display panel's high-contrast theme).
- Legible for everyone: 18px text at a 1.7 line height in a Universal Design
  typeface where installed (BIZ UDPGothic on Windows, Hiragino on macOS),
  outlines at 3:1 or more on everything you press, a panel 65% of the window
  wide that stops above UniLens' settings gear, and 24px / 30px text while the
  display panel's text size is large / extra large (icons and targets grow with it).

Unless stated otherwise, commands run from the **UniLens repository root**.

## Build and run

```sh
make init-target quiz-lib          # npm install
make build                         # typecheck + bundle every library, copy into frontend/*
make serve dev-demo                # backend + http://localhost:8001 (has a sample quiz)
```

| Command | What it does |
|---|---|
| `make serve-target quiz-lib` | Watch build; each save copies `quiz.js` into `frontend/*` |
| `cd quiz-lib && npm run dev` | Same, without Make (Windows) |
| `cd quiz-lib && make build` | Typecheck, then bundle `dist/quiz.js` |
| `cd quiz-lib && make lint` | Typecheck |
| `cd quiz-lib && make test` | Unit tests |

Without Make: `cd quiz-lib && npm install && npm run build`.

## Embedding

```html
<script src="quiz.js"></script>
<script>
  UniLensQuiz.init({
    src: "quiz.json",                    // or quiz: { ... } inline
    backend: "http://127.0.0.1:5000",    // omit to keep answers in the browser only
  })
</script>
```

With the other libraries, load `accessibility.js` first so the quiz can follow
its high-contrast theme:

```html
<script src="accessibility.js"></script>
<script src="unilens.js"></script>
<script src="quiz.js"></script>
<script>
  Accessibility.init()
  UniLens.init({ backend: "http://127.0.0.1:5000", mouseWindow: 5 })
  UniLensQuiz.init({ src: "quiz.json", backend: "http://127.0.0.1:5000" })
</script>
```

## Quiz format

```json
{
  "id": "ir-basics",
  "title": { "ja": "確認クイズ", "en": "Check what you read" },
  "description": "Three questions about this page.",
  "showFeedback": true,
  "shuffleChoices": false,
  "allowRetry": true,
  "questions": [
    {
      "id": "team-price",
      "prompt": { "ja": "Team プランの月額は？", "en": "How much is the Team plan?" },
      "choices": ["$9", "$29", "$99"],
      "answer": 1,
      "explanation": "The Pricing table lists Team at $29."
    },
    {
      "id": "fields",
      "type": "multiple",
      "prompt": "Which fields does the form have?",
      "choices": [
        { "id": "name", "text": "Name" },
        { "id": "phone", "text": "Phone" },
        { "id": "email", "text": "Email" }
      ],
      "answer": ["name", "email"]
    },
    {
      "id": "seats",
      "type": "text",
      "prompt": "How many seats in the Business plan?",
      "answer": ["25", "twenty-five"]
    }
  ]
}
```

| Field | Notes |
|---|---|
| `id` | Required. 1–64 letters, digits, `-`, `_`. Names the log file and the stored progress. |
| `title`, `description`, `prompt`, `explanation`, choice text | A string, or `{ "ja": "…", "en": "…" }`. A missing language falls back to the other. |
| `type` | `"single"` (default), `"multiple"` (all correct choices and nothing else), `"text"`. |
| `choices` | Strings, or `{ "id", "text" }`. Default ids: `c1`, `c2`, … |
| `answer` | Optional answer key. single: a choice id or 0-based index. multiple: a list of them. text: one or more accepted strings. Omit it for a plain survey question: the log then has `correct: null`. |
| `caseSensitive` | text only. Default false. Answers are always compared after Unicode NFKC and space trimming, so full-width `２５` matches `25`. |
| question `id` | Default `q1`, `q2`, … Set it yourself if you will reorder questions: the log refers to it. |
| `showFeedback` | Default false: the visitor never sees right/wrong, correct answers, explanations or a score. true: a verdict and explanation after each graded answer, and the score at the end. |
| `shuffleChoices` | Default false. Shuffled once per attempt; a reload keeps the order. |
| `allowRetry` | Default true. Offers "try again" on the result screen. |

Invalid questions are skipped with a console warning; a quiz with no valid
question is not shown. Editing a quiz (any change to its content) starts
visitors afresh rather than grading them against moved answers.

## `init()` options

| Option | Default | Description |
|---|---|---|
| `quiz` | — | The quiz object. Either this or `src`. |
| `src` | — | URL of a JSON file with the quiz. |
| `backend` | — | UniLens backend to log answers to. |
| `lang` | detected | `'ja'` or `'en'`: the starting language. The visitor's choice on the switch wins over it. |
| `position` | `'top-left'` | `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`. The panel opens from the toggle. The display panel's button sits bottom-right and UniLens' settings gear bottom-left: the bottom corners overlap them. |
| `open` | `false` | Open the panel once ready. |
| `followDisplayPanel` | `true` | Follow `accessibility-lib`'s high-contrast theme and text size (large → 24px, extra large → 30px). |
| `onAnswer(e)` | — | Called on each answer: `{ quizId, attempt, questionId, index, response, responseText, correct, ms }`. |
| `onComplete(r)` | — | Called at the end: `{ quizId, attempt, correct, total, answers, durationMs }`. |

`init()` returns a promise of `true` once shown, `false` if the quiz could not be
loaded.

Other methods: `UniLensQuiz.open()`, `close()`, `reset()` (forget this
browser's progress), `setLang('ja' | 'en')`, `getResult()`, `isOpen()`,
`destroy()`.

## The log

`POST /api/quiz/log` (plain-text JSON, `{ "events": [...] }`, optional
`?pid=&session=`) appends one line per event to
`backend/quiz-logs/<quiz id>.jsonl`:

| `type` | Fields |
|---|---|
| `quiz_open`, `quiz_close` | panel shown / hidden |
| `quiz_start` | `attempt`, `total`, `retry` |
| `quiz_answer` | `attempt`, `question`, `index`, `response`, `response_text`, `correct`, `ms` (time on the question) |
| `quiz_complete` | `attempt`, `correct`, `total`, `ms` (start to last answer) |
| `quiz_lang` | `lang` (the new language), `from`, `attempt`: the visitor used the 日本語 / English switch |

Every line also has `t`, `seq`, `quiz`, `lang`, `page` (path only), and `pid` /
`session` when the page named a participant; then the same events also go to
`backend/study-logs/<pid>/session-<n>.jsonl`. Nothing else about the visitor is
sent.

## Reading the results

The backend folds the log into one record per attempt.

| Endpoint | Returns |
|---|---|
| `GET /api/quiz` | The quizzes with a log: `{ "quizzes": [{ "id", "attempts", "completed", "last_event_at" }] }` |
| `GET /api/quiz/<quiz id>/results` | Every attempt with its answers and timings. Filters: `?pid=`, `?session=`, `?attempt=`, `?completed=1` |

```sh
curl "http://127.0.0.1:5000/api/quiz/dev-demo/results?pid=P01&completed=1"
```

```json
{
  "quiz": "dev-demo",
  "attempts": [
    {
      "attempt": "09b7ee309860", "pid": "P01", "session": "1", "lang": "ja", "page": "/",
      "started_at": "2026-10-08T01:00:00.000Z", "completed_at": "2026-10-08T01:02:41.500Z",
      "completed": true, "correct": 3, "answered": 5, "total": 5,
      "duration_ms": 161500,
      "answers": [
        { "question": "q1", "index": 0, "response": "c2", "response_text": "選択肢 B", "lang": "ja",
          "correct": true, "ms": 42100, "answered_at": "2026-10-08T01:00:42.100Z" }
      ]
    }
  ]
}
```

- `response` is what the widget graded (choice ids, or the typed text);
  `response_text` is the same answer in words, as the visitor saw it, in
  `lang`, the language the question was shown in.
- `ms` is the time on that question: from its first appearance to the answer,
  including time with the panel closed (the answer is usually looked up on the
  page). A reload restarts that question's clock.
- `duration_ms` runs from the start to the last answer. An attempt not
  completed has `completed: false` and its duration up to its last answer.

In the page, `UniLensQuiz.getResult()` gives the current attempt the same way
(`answers[questionId]` has `response`, `responseText`, `correct`, `at`, `ms`), and
`onAnswer` / `onComplete` receive it as it happens.
