# quiz-lib

> [README.md](README.md) の日本語訳です。規約の正典は英語版であり、両者が食い違った場合は英語版が優先されます。

任意の HTML ページに埋め込めるアンケート（設問）ウィジェットです。`accessibility-lib` と同じ構成で、ビルドすると単一の `dist/quiz.js` になり、`UniLensQuiz.init()` で起動します（ページに同名のグローバルが無ければ `window.Quiz` も同じ API です）。「アンケート」ボタンからパネルを開き、質問に順に答えると、最後にお礼と自分の回答の一覧が表示されます。既定では正誤・正解・解説・得点は画面に一切表示しません。質問に正解（`answer`）を設定した場合は、ログにだけ正誤を記録します（`showFeedback: true` で画面にも表示）。

- 問題はホストページが渡します（インライン、または JSON ファイル）。
- 単一選択・複数選択・記述（入力）の 3 形式。
- 日本語と英語に対応し、パネル上部に「日本語 / English」の切り替えボタンがあります。切り替えるまでは `<html lang>`、次にブラウザの言語に従い、訪問者が選んだ言語は記憶されて優先されます。質問の文を `{ "ja": …, "en": … }` で書くと、質問も切り替わります。
- 進捗はブラウザに保存され、再読み込みしても途中から再開します。
- `backend` を指定すると、回答ごとに UniLens バックエンドへ記録します（`backend/quiz-logs/<クイズ id>.jsonl`）。ページが参加者を指定している場合（`?pid=P01&session=1`）は研究ログにも記録します。
- アクセシビリティは表示調整パネルに合わせています：44px のタップ領域、キーボード・スクリーンリーダー対応、正誤（表示する場合）は色だけで示さない、高コントラスト（`prefers-contrast: more` と表示調整パネルの高コントラストテーマ）。
- 誰でも読みやすい表示：文字は 18px・行間 1.7、UD（ユニバーサルデザイン）書体を優先（Windows は BIZ UDPゴシック、macOS はヒラギノ）、押せる部分の枠は背景とのコントラスト 3:1 以上、パネルは画面幅の 65% で UniLens の設定ボタンの手前まで。表示調整パネルの文字サイズが「大」「特大」のときは 24px / 30px になり、アイコンやボタンも一緒に大きくなります。

作業ディレクトリは、特に断りのない限り **UniLens リポジトリのルート**です。

## ビルドと起動

```sh
make init-target quiz-lib          # npm install
make build                         # 全ライブラリを型チェック＋バンドルし frontend/* にコピー
make serve dev-demo                # バックエンド + http://localhost:8001 （サンプルのクイズ入り）
```

| コマンド | 内容 |
|---|---|
| `make serve-target quiz-lib` | watch ビルド（保存時に `frontend/*` へ `quiz.js` をコピー） |
| `cd quiz-lib && npm run dev` | 上と同じ（Make なし / Windows 向け） |
| `cd quiz-lib && make build` | 型チェック後に `dist/quiz.js` を出力 |
| `cd quiz-lib && make lint` | 型チェック |
| `cd quiz-lib && make test` | 単体テスト |

Make が無い場合：`cd quiz-lib && npm install && npm run build`

## 埋め込み

```html
<script src="quiz.js"></script>
<script>
  UniLensQuiz.init({
    src: "quiz.json",                    // または quiz: { ... } で直接指定
    backend: "http://127.0.0.1:5000",    // 省略するとブラウザ内だけに保存
  })
</script>
```

他のライブラリと併用する場合は、高コントラストテーマに追従できるよう `accessibility.js` を先に読み込みます：

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

## クイズの書式

書式の例は [README.md](README.md#quiz-format) と `frontend/dev-demo/quiz.json` を参照してください。

| 項目 | 説明 |
|---|---|
| `id` | 必須。英数字・`-`・`_` で 1〜64 文字。ログファイル名と進捗の保存に使います。 |
| `title`・`description`・`prompt`・`explanation`・選択肢の文 | 文字列、または `{ "ja": "…", "en": "…" }`。片方の言語が無ければもう片方を表示します。 |
| `type` | `"single"`（既定）、`"multiple"`（正解をすべて選び、それ以外は選ばない）、`"text"`。 |
| `choices` | 文字列、または `{ "id", "text" }`。id の既定は `c1`、`c2`、… |
| `answer` | 省略可（正解の設定）。single：選択肢の id か 0 始まりの番号。multiple：そのリスト。text：正解とする文字列（複数可）。省略すると通常のアンケート設問になり、ログの `correct` は `null` です。 |
| `caseSensitive` | text のみ。既定 false。比較は常に Unicode NFKC 正規化と前後の空白除去の後に行うため、全角の `２５` も `25` と一致します。 |
| 問題の `id` | 既定は `q1`、`q2`、… ログが参照するので、問題を並べ替える予定があれば明示してください。 |
| `showFeedback` | 既定 false：正誤・正解・解説・得点を画面に表示しません。true：正解を設定した設問で回答ごとに正誤と解説を、最後に得点を表示します。 |
| `shuffleChoices` | 既定 false。挑戦ごとに 1 回だけ並べ替え、再読み込みしても順序は変わりません。 |
| `allowRetry` | 既定 true。結果画面に「もう一度挑戦する」を表示します。 |

不正な問題は console に警告を出して読み飛ばします。有効な問題が 1 つも無いクイズは表示しません。クイズの内容を変更すると、保存済みの進捗は破棄され最初からになります。

## `init()` オプション

| オプション | 既定 | 説明 |
|---|---|---|
| `quiz` | — | クイズのオブジェクト。これか `src` のどちらか。 |
| `src` | — | クイズの JSON ファイルの URL。 |
| `backend` | — | 回答を記録する UniLens バックエンド。 |
| `lang` | 自動判定 | `'ja'` または `'en'`：最初に表示する言語。訪問者が切り替えボタンで選んだ言語が優先されます。 |
| `position` | `'top-left'` | `'top-left'`・`'top-right'`・`'bottom-left'`・`'bottom-right'`。パネルはボタンの位置から開きます。表示調整のボタンは右下、UniLens の設定ボタンは左下にあるため、下の角を選ぶと重なります。 |
| `open` | `false` | 準備ができたらパネルを開く。 |
| `followDisplayPanel` | `true` | `accessibility-lib` の高コントラストテーマと文字サイズ（大 → 24px、特大 → 30px）に追従する。 |
| `onAnswer(e)` | — | 回答ごとに呼ばれます：`{ quizId, attempt, questionId, index, response, responseText, correct, ms }` |
| `onComplete(r)` | — | 最後に呼ばれます：`{ quizId, attempt, correct, total, answers, durationMs }` |

`init()` は表示できたら `true`、読み込めなかったら `false` を返す Promise です。

その他のメソッド：`UniLensQuiz.open()`、`close()`、`reset()`（このブラウザの進捗を消去）、`setLang('ja' | 'en')`、`getResult()`、`isOpen()`、`destroy()`。

## ログ

`POST /api/quiz/log`（本文は plain text の JSON `{ "events": [...] }`、`?pid=&session=` は任意）が、1 イベント 1 行で `backend/quiz-logs/<クイズ id>.jsonl` に追記します。

| `type` | 内容 |
|---|---|
| `quiz_open`・`quiz_close` | パネルを開いた / 閉じた |
| `quiz_start` | `attempt`、`total`、`retry` |
| `quiz_answer` | `attempt`、`question`、`index`、`response`、`response_text`、`correct`、`ms`（その問題に要した時間） |
| `quiz_complete` | `attempt`、`correct`、`total`、`ms`（開始から最後の回答まで） |
| `quiz_lang` | `lang`（切り替え後の言語）、`from`、`attempt`：訪問者が「日本語 / English」を切り替えた |

各行には `t`、`seq`、`quiz`、`lang`、`page`（パスのみ）と、参加者が指定されていれば `pid`・`session` も入ります。その場合は同じイベントが `backend/study-logs/<pid>/session-<n>.jsonl` にも記録されます。それ以外の訪問者の情報は送信しません。

## 結果の取得

バックエンドはログを挑戦（attempt）ごとにまとめて返します。

| エンドポイント | 返す内容 |
|---|---|
| `GET /api/quiz` | ログのあるクイズの一覧：`{ "quizzes": [{ "id", "attempts", "completed", "last_event_at" }] }` |
| `GET /api/quiz/<クイズ id>/results` | 各挑戦の回答内容と所要時間。絞り込み：`?pid=`、`?session=`、`?attempt=`、`?completed=1` |

```sh
curl "http://127.0.0.1:5000/api/quiz/dev-demo/results?pid=P01&completed=1"
```

返り値の例は [README.md](README.md#reading-the-results) を参照してください。

- `response` は採点に使った値（選択肢の id、または入力した文字列）、`response_text` は同じ回答を訪問者が見た文言で表したもので、その言語は `lang` に入ります。
- `ms` はその問題に要した時間です。問題が表示されてから回答するまでで、パネルを閉じていた時間も含みます（答えはたいていページ上で探すため）。再読み込みするとその問題の計測は最初からになります。
- `duration_ms` は開始から最後の回答までの時間です。完了していない挑戦は `completed: false` で、最後の回答までの時間が入ります。

ページ内では `UniLensQuiz.getResult()` で現在の挑戦を同じ形で取得できます（`answers[問題id]` に `response`・`responseText`・`correct`・`at`・`ms`）。`onAnswer`・`onComplete` でも回答のたびに受け取れます。
