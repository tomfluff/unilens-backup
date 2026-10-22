# quiz-lib

日本語版は [README.ja.md](README.ja.md) を参照してください。

A questionnaire for the UniLens studies. The study uses it as **a page of its
own on the survey server** (`survey-backend/`, port 5100), opened by its address:

```
http://127.0.0.1:5100/survey?quiz=unilens-poc&pid=P01&session=1
```

Each question has a page of its own (`&q=1`, `&q=2`, …). The test pages carry
only the green button (link mode), which shows how far the participant is —
**"アンケート（2/4）"**, the next question to answer of all — and opens that
question's page **in a new tab** (one survey tab, reused), with the participant
(`pid` / `session`) and the way back; the test page stays as it is in its own
tab. After the answer the page says it is saved and offers "元のページに戻る"
(back to the page), which closes the survey tab; the button then shows
"アンケート（3/4）". (A survey page opened by its address, not by the button,
loads the test page in the same tab instead.) On the last question's page, with every
question answered, the same button reads "アンケートを終了する" (finish the survey).
Once every question is answered it shows
"アンケート（完了）" and opens the survey page, which says thank you (the answers
are not listed again, and there is no "answer again"). The survey page never runs on to the next question:
opened without `&q=` it shows the next question to answer (and adds its `&q=` to
the address), so every visit is one question, then back to the page.

The library is built the same way as `accessibility-lib` (one script,
`dist/quiz.js`, `window.UniLensQuiz`; `window.Quiz` too when the page has no
global of that name), and can still float over a host page as a button and
panel (`mode: "panel"`, below). By default nothing on screen says whether an answer was right: no
verdicts, correct answers, explanations or score. Questions may carry an answer
key; it is then graded in the log only (or on screen with `showFeedback: true`).

- On the survey page the questions come from `survey-backend/quizzes/<id>.json`; in
  panel mode, from the host page (inline, or a JSON file).
- Single choice, multiple choice and typed answers.
- Japanese only: there is no language switch, and the page's or browser's
  language does not change it (`SURVEY_LANG` in `src/quizI18n.ts`). A survey
  written as `{ "ja": …, "en": … }` shows its Japanese; the English text and the
  library's English messages are kept, unused, for a return to two languages.
- Before the first question the respondent types a **user ID** and a **survey
  ID** (a number the facilitator gives each user's survey). Both are required and
  always typed by hand, even when the address names a participant: letters,
  digits, `-` and `_`, up to 32 (full-width input is converted). They belong to
  the attempt, so the pages of one survey (one per question) ask only once; every
  later screen shows them, and every logged event carries them (`user_id`,
  `survey_id`).
- Progress is kept in the browser: a reload resumes the attempt. It is kept per
  participant (`pid` / `session`), so on a shared lab laptop the next participant
  starts afresh.
- With `backend` (the survey server), every answer is logged to its log
  (`survey-backend/quiz-logs/<quiz id>.jsonl`), with the participant when the
  page names one (`?pid=P01&session=1`).
- Accessibility follows the display panel: 44px targets, keyboard and
  screen-reader support, right/wrong (when shown) never by colour alone, high contrast
  (`prefers-contrast: more`, and the display panel's high-contrast theme).
- Legible for everyone: 18px text at a 1.7 line height in a Universal Design
  typeface where installed (BIZ UDPGothic on Windows, Hiragino on macOS),
  outlines at 3:1 or more on everything you press, a panel 65% of the window
  wide and 75% tall (longer content scrolls inside) that stops above UniLens'
  settings gear, and 24px / 30px text while the
  display panel's text size is large / extra large (icons and targets grow with it).

Unless stated otherwise, commands run from the **UniLens repository root**.

## The survey page

| Address | Shows |
|---|---|
| `/survey` | The list of surveys, with a ready-made participant address for each (for the facilitator) |
| `/survey?quiz=<id>` | The survey in `survey-backend/quizzes/<id>.json`: its next question to answer (one per visit), or, once all are answered, the thank-you |
| `…&q=2` | Question 2 only (one page per question; the button opens the next one to answer) |
| `…&pid=P01&session=1` | The participant: answers go to the survey's log with these |
| `…&return=<address>` | The test page to go back to after answering (the button sets it) |
| `…&tab=1` | The page has a tab of its own (the button sets it): going back closes the tab |
| `…&vid=<id>` | Without a participant: the anonymous id the button gives the browser, so its progress can still be found |

How the button knows the progress: the survey page lives on the survey server,
so the button asks it (`GET /api/quiz/<id>/progress?pid=&session=`, or `?vid=` without
a participant) when the page loads and whenever it is shown again (back from
the survey, with the page's link or the browser's Back). It counts the
participant's latest attempt; a question answered on its own page counts
wherever it was answered. Until the survey server answers (or when it is down) the
button reads just "アンケート" and opens `/survey?quiz=<id>`, which shows the next
question to answer all the same.

The button on a test page (after `accessibility.js` and `unilens.js`):

```html
<script src="quiz.js"></script>
<script>
  UniLensQuiz.init({ mode: "link", survey: "unilens-poc", backend: "http://127.0.0.1:5100" })
</script>
```

`make build` copies `quiz.js` into the pages that carry the button
(`softbank-mirror`, `softbank-mirror-recruit`, `dev-demo`; see
`scripts/sync-dist.mjs`).

To add a survey, put `survey-backend/quizzes/<id>.json` (format below; the file
name is the id the answers are logged under) and open `/survey?quiz=<id>`. The
page loads `quiz-lib/dist/quiz.js` from the survey server (`/survey/quiz.js`), so run
`make build` once after a change to quiz-lib.

## Build and run

```sh
make init-target quiz-lib          # npm install
make build                         # typecheck + bundle every library, copy into frontend/*
make serve-survey                  # then open http://127.0.0.1:5100/survey
```

| Command | What it does |
|---|---|
| `make serve-target quiz-lib` | Watch build of `dist/quiz.js` (copied to the pages with the button); reload to see a change |
| `cd quiz-lib && npm run dev` | Same, without Make (Windows) |
| `cd quiz-lib && make build` | Typecheck, then bundle `dist/quiz.js` |
| `cd quiz-lib && make lint` | Typecheck |
| `cd quiz-lib && make test` | Unit tests |

Without Make: `cd quiz-lib && npm install && npm run build`.

## Panel mode (embedding in a page)

Not used by the study any more, but still available: a button and floating
panel over any page.

```html
<script src="quiz.js"></script>
<script>
  UniLensQuiz.init({
    src: "quiz.json",                    // or quiz: { ... } inline
    backend: "http://127.0.0.1:5100",    // the survey server; omit to keep answers in the browser only
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
  UniLensQuiz.init({ src: "quiz.json", backend: "http://127.0.0.1:5100" })
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

Invalid questions are skipped with a console warning; a quiz with no valid
question is not shown. Editing a quiz (any change to its content) starts
visitors afresh rather than grading them against moved answers.

## `init()` options

| Option | Default | Description |
|---|---|---|
| `quiz` | — | The quiz object. Either this or `src`. |
| `src` | — | URL of a JSON file with the quiz. |
| `backend` | — | The survey server to log answers to (`survey-backend`, port 5100). |
| `mode` | `'panel'` | `'link'`: only the button, opening the survey page (test pages). `'page'`: the survey fills `container` (the survey page). `'panel'`: button and floating panel. |
| `survey` | — | Link mode: the survey's id (`survey-backend/quizzes/<id>.json`). |
| `container` | end of `<body>` | Page mode: the element, or a selector, to fill. |
| `question` | next to answer | Page mode: show only this question (1-based). Without it, the first question not answered yet (the page never runs through several). `init()` resolves false for a question the survey does not have. |
| `returnTo` | — | Page mode: the page to go back to after answering (absolute http(s) only). |
| `ownTab` | `false` | Page mode: the page was opened in a tab of its own; going back closes it (and falls back to loading `returnTo` if the browser will not let it close). |
| `position` | `'top-left'` | `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`. The panel opens from the toggle. The display panel's button sits bottom-right and UniLens' settings gear bottom-left: the bottom corners overlap them. |
| `open` | `false` | Open the panel once ready. |
| `followDisplayPanel` | `true` | Follow `accessibility-lib`'s high-contrast theme and text size (large → 24px, extra large → 30px). |
| `onAnswer(e)` | — | Called on each answer: `{ quizId, attempt, questionId, index, response, responseText, correct, ms }`. |
| `onComplete(r)` | — | Called at the end: `{ quizId, attempt, correct, total, answers, durationMs }`. |

`init()` returns a promise of `true` once shown, `false` if the quiz could not be
loaded.

Other methods: `UniLensQuiz.open()`, `close()`, `reset()` (forget this
browser's progress), `getResult()`, `isOpen()`,
`destroy()`.

## The log

`POST /api/quiz/log` (plain-text JSON, `{ "events": [...] }`, optional
`?pid=&session=`) appends one line per event to
`survey-backend/quiz-logs/<quiz id>.jsonl`:

| `type` | Fields |
|---|---|
| `quiz_open`, `quiz_close` | panel shown / hidden; on the survey page, the page opened (`question` on a question's page) |
| `quiz_start` | `attempt`, `total`, `retry` |
| `quiz_answer` | `attempt`, `question`, `index`, `response`, `response_text`, `correct`, `ms` (time on the question) |
| `quiz_complete` | `attempt`, `correct`, `total`, `ms` (start to last answer) |
| `quiz_lang` | No longer sent (the survey is Japanese only). Older logs have it: `lang` (the new language), `from`, `attempt` |
| `quiz_ids` | `attempt`: the IDs were typed into an attempt begun before they were asked (one started by an earlier version) |

Every line also has `t`, `seq`, `quiz`, `lang`, `page` (path only), the typed
`user_id` / `survey_id` once entered, and `pid` /
`session` when the page named a participant (else `vid`, the button's anonymous id, when there is one).
Nothing else about the visitor is sent, and nothing goes to the study's
per-participant logs (`backend/study-logs/`).

## Reading the results

The survey server folds the log into one record per attempt.

| Endpoint | Returns |
|---|---|
| `GET /api/quiz` | The quizzes with a log: `{ "quizzes": [{ "id", "attempts", "completed", "last_event_at" }] }` |
| `GET /api/quiz/<quiz id>/results` | Every attempt with its answers and timings. Each has `user_id` and `survey_id`. Filters: `?pid=`, `?session=`, `?attempt=`, `?user_id=`, `?survey_id=`, `?completed=1` |
| `GET /api/quiz/<quiz id>/progress?pid=&session=` (or `?vid=`) | One visitor's progress, for the button: `{ "total": 4, "answered": 1, "answered_questions": ["q1"], "next": 2, "completed": false, "attempt": "…" }` (`next` is 1-based; null once all are answered) |
| `GET /api/quiz/<quiz id>/results.csv` | The same, one row per attempt, for Excel: the totals, then for each question `<id>_ms`, `<id>_s`, `<id>_answer`, `<id>_correct`. Same filters. |

```sh
curl "http://127.0.0.1:5100/api/quiz/dev-demo/results?pid=P01&completed=1"
curl -o results.csv "http://127.0.0.1:5100/api/quiz/unilens-poc/results.csv?completed=1"
```

The survey list (`/survey`) links each survey's CSV.

CSV columns: `attempt, user_id, survey_id, pid, session, lang, started_at, completed_at, completed,
answered, correct, duration_ms, duration_s`, then the four columns per question,
in the survey's order (`q1_ms, q1_s, q1_answer, q1_correct, q2_ms, …`). A
question not answered leaves its columns empty. The file is UTF-8 with a BOM, so
Excel shows Japanese answers correctly.

```json
{
  "quiz": "dev-demo",
  "attempts": [
    {
      "attempt": "09b7ee309860", "pid": "P01", "session": "1", "lang": "ja", "page": "/",
      "started_at": "2026-10-08T01:00:00.000Z", "completed_at": "2026-10-08T01:02:41.500Z",
      "completed": true, "correct": 3, "answered": 5, "total": 5,
      "duration_ms": 161500,
      "question_ms": { "q1": 42100, "q2": 38000, "q3": 51200, "q4": 30200 },
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
  page). The moment it appeared is kept with the progress, so a reload does not
  restart the clock. `question_ms` lists the same
  times by question id.
- `duration_ms` runs from the start to the last answer. An attempt not
  completed has `completed: false` and its duration up to its last answer.

In the page, `UniLensQuiz.getResult()` gives the current attempt the same way
(`answers[questionId]` has `response`, `responseText`, `correct`, `at`, `ms`), and
`onAnswer` / `onComplete` receive it as it happens.
