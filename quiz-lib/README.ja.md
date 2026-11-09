# quiz-lib

> [README.md](README.md) の日本語訳です。規約の正典は英語版であり、両者が食い違った場合は英語版が優先されます。

UniLens の研究用アンケートです。研究では **アンケートサーバー（`survey-backend/`、ポート 5100）上の専用ページ** として、URL で開いて使います：

```
http://127.0.0.1:5100/survey?quiz=unilens-poc&pid=P01&session=1
```

質問は 1 問ずつ専用のページになっています（`&q=1`、`&q=2`、…）。検証用ページには緑のボタンだけを置き（link モード）、ボタンには進み具合が **「アンケート（2/4）」**（次に答える質問／全問数）のように表示されます。押すとその質問のページが**新しいタブ**で開き（アンケート用のタブは 1 つを使い回します）、参加者（`pid` / `session`）と戻り先を引き継ぎます。元のページは元のタブにそのまま残ります。回答すると「回答を記録しました」と「元のページに戻る」が表示され、「元のページに戻る」でアンケートのタブが閉じて、ボタンは「アンケート（3/4）」に変わります（ボタンを使わず URL で直接開いたアンケートページでは、同じタブで元のページを開きます）。最後の質問に答えて全問回答済みになったページでは、このボタンが「アンケートを終了する」になります。全問に答えると「アンケート（完了）」になり、押すとお礼のページが表示されます（回答内容の一覧や「もう一度回答する」はありません）。アンケートページは次の質問へ続けて進むことはありません。`&q=` を付けずに開いた場合も、次に答える質問を 1 問だけ表示し（URL に `&q=` を付け足します）、答えたら元のページに戻ります。

ライブラリは `accessibility-lib` と同じ構成（単一の `dist/quiz.js`、`window.UniLensQuiz`。同名のグローバルが無ければ `window.Quiz` も同じ API）で、ページの上にボタンとパネルとして重ねる使い方（`mode: "panel"`、後述）も引き続きできます。既定では正誤・正解・解説・得点は画面に一切表示しません。質問に正解（`answer`）を設定した場合は、ログにだけ正誤を記録します（`showFeedback: true` で画面にも表示）。

- アンケートページでは質問を `survey-backend/quizzes/<id>.json` から読み込みます。パネル型では、ホストページが渡します（インライン、または JSON ファイル）。
- 単一選択・複数選択・記述（入力）の 3 形式。
- 表示は日本語のみです。言語の切り替えボタンはなく、ページやブラウザの言語にも左右されません（`src/quizI18n.ts` の `SURVEY_LANG`）。質問を `{ "ja": …, "en": … }` で書いた場合は日本語が表示されます。英語の文とライブラリの英語メッセージは、2 言語に戻すときのために使わずに残しています。
- 最初の質問の前に、回答者が **ユーザーID** と **アンケートID**（ユーザーごとに実験者が振るアンケート番号）を入力します。どちらも必須で、URL に参加者の指定があっても毎回手入力です（半角英数字と `-` `_`、32 文字まで。全角で入力しても半角に直します）。ID は挑戦（回答 1 回分）に紐づくので、質問ごとのページでも入力は最初の 1 回だけです。以降の画面に表示され、ログのすべてのイベントに `user_id`・`survey_id` として入ります。
- 進捗はブラウザに保存され、再読み込みしても途中から再開します。進捗は参加者（`pid` / `session`）ごとに分けて保存するので、実験用の PC を共用しても次の参加者は最初から始まります。
- `backend`（アンケートサーバー）を指定すると、回答ごとにそのログへ記録します（`survey-backend/quiz-logs/<クイズ id>.jsonl`）。ページが参加者を指定している場合（`?pid=P01&session=1`）は、参加者も一緒に記録します。
- アクセシビリティは表示調整パネルに合わせています：44px のタップ領域、キーボード・スクリーンリーダー対応、正誤（表示する場合）は色だけで示さない、高コントラスト（`prefers-contrast: more` と表示調整パネルの高コントラストテーマ）。
- 誰でも読みやすい表示：文字は 18px・行間 1.7、UD（ユニバーサルデザイン）書体を優先（Windows は BIZ UDPゴシック、macOS はヒラギノ）、押せる部分の枠は背景とのコントラスト 3:1 以上、パネルは画面幅の 65%・高さ 75%（収まらない内容はパネル内でスクロール）で、UniLens の設定ボタンには重ならない。表示調整パネルの文字サイズが「大」「特大」のときは 24px / 30px になり、アイコンやボタンも一緒に大きくなります。

作業ディレクトリは、特に断りのない限り **UniLens リポジトリのルート**です。

## アンケートページ

| URL | 表示内容 |
|---|---|
| `/survey` | アンケートの一覧と、それぞれの参加者用 URL の例（実験者向け） |
| `/survey?quiz=<id>` | `survey-backend/quizzes/<id>.json` のアンケートのうち、次に答える質問 1 問（全問回答済みならお礼） |
| `…&q=2` | 質問 2 だけのページ（ボタンは次に答える質問のページを開きます） |
| `…&pid=P01&session=1` | 参加者。回答ログにこの ID が入ります |
| `…&return=<URL>` | 回答後に戻るページ（ボタンが付けます） |
| `…&tab=1` | 専用のタブで開いたページ（ボタンが付けます）。戻るときはそのタブを閉じます |
| `…&vid=<id>` | 参加者の指定がないとき、ボタンがブラウザに割り当てる匿名 ID（進み具合をたどるため） |

ボタンが進み具合を知る仕組み：アンケートページはアンケートサーバー側にあるため、ボタンはアンケートサーバーに問い合わせます（`GET /api/quiz/<id>/progress?pid=&session=`、参加者の指定がなければ `?vid=`）。ページを開いたときと、再び表示されたとき（「元のページに戻る」やブラウザの「戻る」で戻ったとき）に問い合わせます。数えるのはその参加者の最新の挑戦で、どのページで答えた質問も回答済みとして数えます。アンケートサーバーから返事があるまで（またはアンケートサーバーが止まっているとき）は「アンケート」とだけ表示し、押すと `/survey?quiz=<id>` を開きます。この場合も次に答える質問が 1 問だけ表示されます。

検証用ページのボタン（`accessibility.js` と `unilens.js` の後に置く）：

```html
<script src="quiz.js"></script>
<script>
  UniLensQuiz.init({ mode: "link", survey: "unilens-poc", backend: "http://127.0.0.1:5100" })
</script>
```

`make build` は、ボタンを置くページ（`softbank-mirror`・`softbank-mirror-recruit`・`dev-demo`。`scripts/sync-dist.mjs` 参照）に `quiz.js` をコピーします。

アンケートを追加するときは `survey-backend/quizzes/<id>.json` を置き（書式は後述。ファイル名がログに使われる id になります）、`/survey?quiz=<id>` を開きます。ページは `quiz-lib/dist/quiz.js` をアンケートサーバー経由（`/survey/quiz.js`）で読み込むので、quiz-lib を変更したら一度 `make build` を実行してください。

## ビルドと起動

```sh
make init-target quiz-lib          # npm install
make build                         # 全ライブラリを型チェック＋バンドルし frontend/* にコピー
make serve-survey                  # その後 http://127.0.0.1:5100/survey を開く
```

| コマンド | 内容 |
|---|---|
| `make serve-target quiz-lib` | `dist/quiz.js` の watch ビルド（ボタンのあるページにもコピー。変更は再読み込みで反映） |
| `cd quiz-lib && npm run dev` | 上と同じ（Make なし / Windows 向け） |
| `cd quiz-lib && make build` | 型チェック後に `dist/quiz.js` を出力 |
| `cd quiz-lib && make lint` | 型チェック |
| `cd quiz-lib && make test` | 単体テスト |

Make が無い場合：`cd quiz-lib && npm install && npm run build`

## パネル型（ページへの埋め込み）

研究では使わなくなりましたが、ページの上にボタンとパネルとして重ねる使い方も引き続きできます。

```html
<script src="quiz.js"></script>
<script>
  UniLensQuiz.init({
    src: "quiz.json",                    // または quiz: { ... } で直接指定
    backend: "http://127.0.0.1:5100",    // アンケートサーバー。省略するとブラウザ内だけに保存
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
  UniLensQuiz.init({ src: "quiz.json", backend: "http://127.0.0.1:5100" })
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
| `next` | 省略可。すべての質問に回答した後の画面（最後の質問のページとお礼のページ）に「次のアンケートへ進む」ボタンを出します。`{ "url": "…", "label": "…" }`（`label` は省略可）。`url` の中の `{user_id}` と `{survey_id}` は、回答者が入力したユーザーIDとアンケートIDに置き換わります（回答内容や `pid`・`session` は渡しません）。Google フォームの「事前入力した URL」の値をそれぞれ `{user_id}`・`{survey_id}` にしておくと、2 つの ID が入った状態でフォームが開きます。例：`"next": { "url": "https://docs.google.com/forms/d/e/<フォームID>/viewform?usp=pp_url&entry.123456={user_id}&entry.654321={survey_id}" }`。アンケートページではこのタブがフォームに移ります（最後の回答をアンケートサーバーに送ってから）。http(s) 以外の URL は無視します。 |

不正な問題は console に警告を出して読み飛ばします。有効な問題が 1 つも無いクイズは表示しません。クイズの内容を変更すると、保存済みの進捗は破棄され最初からになります。

## `init()` オプション

| オプション | 既定 | 説明 |
|---|---|---|
| `quiz` | — | クイズのオブジェクト。これか `src` のどちらか。 |
| `src` | — | クイズの JSON ファイルの URL。 |
| `backend` | — | 回答を記録するアンケートサーバー（`survey-backend`、ポート 5100）。 |
| `mode` | `'panel'` | `'link'`：ボタンだけを表示し、押すとアンケートページへ移動（検証用ページ）。`'page'`：`container` いっぱいにアンケートを表示（アンケートページ）。`'panel'`：ボタンと浮かぶパネル。 |
| `survey` | — | link モードで開くアンケートの id（`survey-backend/quizzes/<id>.json`）。 |
| `container` | `<body>` の末尾 | page モードで表示する要素、またはそのセレクタ。 |
| `question` | 次に答える質問 | page モード：この質問（1 始まり）だけを表示。省略すると、まだ答えていない最初の質問（複数の質問を続けて表示することはありません）。アンケートに無い番号なら `init()` は false を返します。 |
| `returnTo` | — | page モード：回答後に戻るページ（http(s) の絶対 URL のみ）。 |
| `ownTab` | `false` | page モード：専用のタブで開いたページ。戻るときはタブを閉じます（ブラウザが閉じさせない場合は、そのタブで `returnTo` を開きます）。 |
| `position` | `'top-left'` | `'top-left'`・`'top-right'`・`'bottom-left'`・`'bottom-right'`。パネルはボタンの位置から開きます。表示調整のボタンは右下、UniLens の設定ボタンは左下にあるため、下の角を選ぶと重なります。 |
| `open` | `false` | 準備ができたらパネルを開く。 |
| `followDisplayPanel` | `true` | `accessibility-lib` の高コントラストテーマと文字サイズ（大 → 24px、特大 → 30px）に追従する。 |
| `onAnswer(e)` | — | 回答ごとに呼ばれます：`{ quizId, attempt, questionId, index, response, responseText, correct, ms }` |
| `onComplete(r)` | — | 最後に呼ばれます：`{ quizId, attempt, correct, total, answers, durationMs }` |

`init()` は表示できたら `true`、読み込めなかったら `false` を返す Promise です。

その他のメソッド：`UniLensQuiz.open()`、`close()`、`reset()`（このブラウザの進捗を消去）、`getResult()`、`isOpen()`、`destroy()`。

## ログ

`POST /api/quiz/log`（本文は plain text の JSON `{ "events": [...] }`、`?pid=&session=` は任意）が、1 イベント 1 行で `survey-backend/quiz-logs/<クイズ id>.jsonl` に追記します。

| `type` | 内容 |
|---|---|
| `quiz_open`・`quiz_close` | パネルを開いた / 閉じた。アンケートページではページを開いた（質問のページなら `question` 付き） |
| `quiz_start` | `attempt`、`total`、`retry` |
| `quiz_answer` | `attempt`、`question`、`index`、`response`、`response_text`、`correct`、`ms`（その問題に要した時間） |
| `quiz_complete` | `attempt`、`correct`、`total`、`ms`（開始から最後の回答まで） |
| `quiz_lang` | 現在は送信しません（日本語のみのため）。以前のログには `lang`（切り替え後の言語）、`from`、`attempt` が残っています |
| `quiz_ids` | `attempt`：ID を聞く前に始まっていた挑戦（以前の版で開始したもの）に ID を入力した |

各行には `t`、`seq`、`quiz`、`lang`、`page`（パスのみ）、入力後は `user_id`・`survey_id`、参加者が指定されていれば `pid`・`session` も入ります（指定がなくボタンの匿名 ID があれば `vid`）。それ以外の訪問者の情報は送信せず、研究用の参加者別ログ（`backend/study-logs/`）にも記録しません。

## 結果の取得

アンケートサーバーはログを挑戦（attempt）ごとにまとめて返します。

| エンドポイント | 返す内容 |
|---|---|
| `GET /api/quiz` | ログのあるクイズの一覧：`{ "quizzes": [{ "id", "attempts", "completed", "last_event_at" }] }` |
| `GET /api/quiz/<クイズ id>/results` | 各挑戦の回答内容と所要時間（`user_id`・`survey_id` 付き）。絞り込み：`?pid=`、`?session=`、`?attempt=`、`?user_id=`、`?survey_id=`、`?completed=1` |
| `GET /api/quiz/<クイズ id>/progress?pid=&session=`（または `?vid=`） | ボタン用の進み具合：`{ "total": 4, "answered": 1, "answered_questions": ["q1"], "next": 2, "completed": false, "attempt": "…" }`（`next` は 1 始まり。全問回答済みなら null） |
| `GET /api/quiz/<クイズ id>/results.csv` | 同じ内容を 1 挑戦 1 行の CSV で（Excel 用）。全体の集計のあとに、問題ごとの `<id>_ms`・`<id>_s`・`<id>_answer`・`<id>_correct`。絞り込みも同じ |

```sh
curl "http://127.0.0.1:5100/api/quiz/dev-demo/results?pid=P01&completed=1"
curl -o results.csv "http://127.0.0.1:5100/api/quiz/unilens-poc/results.csv?completed=1"
```

アンケート一覧（`/survey`）にも各アンケートの CSV へのリンクがあります。

CSV の列は `attempt, user_id, survey_id, pid, session, lang, started_at, completed_at, completed, answered, correct, duration_ms, duration_s` のあと、アンケートの問題順に 4 列ずつ（`q1_ms, q1_s, q1_answer, q1_correct, q2_ms, …`）です。未回答の問題は空欄になります。BOM 付き UTF-8 なので、Excel で開いても日本語が文字化けしません。

返り値の例は [README.md](README.md#reading-the-results) を参照してください。各挑戦の `question_ms` に問題 id ごとの所要時間（ミリ秒）がまとまっています。

- `response` は採点に使った値（選択肢の id、または入力した文字列）、`response_text` は同じ回答を訪問者が見た文言で表したもので、その言語は `lang` に入ります。
- `ms` はその問題に要した時間です。問題が表示されてから回答するまでで、パネルを閉じていた時間も含みます（答えはたいていページ上で探すため）。問題が表示された時刻は進捗と一緒に保存されるので、再読み込みしても計測がやり直しになることはありません。
- `duration_ms` は開始から最後の回答までの時間です。完了していない挑戦は `completed: false` で、最後の回答までの時間が入ります。

ページ内では `UniLensQuiz.getResult()` で現在の挑戦を同じ形で取得できます（`answers[問題id]` に `response`・`responseText`・`correct`・`at`・`ms`）。`onAnswer`・`onComplete` でも回答のたびに受け取れます。
