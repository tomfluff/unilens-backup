# survey-backend

> [README.md](README.md) の日本語訳です。正典は英語版であり、両者が食い違った場合は英語版が優先されます。

アンケート専用のサーバー（Express + TypeScript）です。Flask バックエンドからアンケートのルートを切り出したもので、URL・応答・ログ形式は同じです。quiz-lib は `backend` のアドレスをここに向けるだけで移行できます。それ以外（chat、capture、読み上げ）は Flask に残ります。

アンケートのログは独立しています。研究用の参加者別ログ（`backend/study-logs/`）には何も書きません。参加者（`pid`、`session`）は各行に残るので、後から突き合わせられます。

## 実行

```bash
make init                 # リポジトリのルートで。ここの npm install も行う
make serve-survey         # http://localhost:5100/survey 。保存すると再ビルドして再起動
make test-target survey-backend
```

ポートは `make-include.mk` の `SURVEY_PORT` で変えられます。

## エンドポイント

| エンドポイント | 説明 |
|---|---|
| `GET /survey?quiz=<id>[&q=&pid=&session=&vid=&return=&tab=]` | アンケートページ（`backend/survey.html`、quiz-lib の page モード）。`quiz` がなければアンケート一覧 |
| `GET /survey/quiz.js` | quiz-lib のビルド（`quiz-lib/dist/`）。`make build` 前は 503 |
| `POST /api/quiz/log[?pid=&session=]` | quiz-lib のイベント。`{"events": [...]}` を text/plain で受け、`<ログ>/<quiz id>.jsonl` に追記 |
| `GET /api/quiz/<id>` | アンケートの質問 |
| `GET /api/quiz` | アンケート一覧（定義のあるもの・ログのあるもの）と回答数・完了数 |
| `GET /api/quiz/<id>/results` | 回答ごとの答えと所要時間。絞り込み `?pid=`、`?session=`、`?attempt=`、`?user_id=`、`?survey_id=`、`?completed=1` |
| `GET /api/quiz/<id>/results.csv` | 同じ内容を 1 回答 1 行で、Excel 用 CSV（BOM 付き UTF-8） |
| `GET /api/quiz/<id>/progress?pid=&session=`（または `?vid=`） | 1 人分の進み具合（テストページのボタン用） |
| `GET /health` | `{"status": "ok"}` |

## 設定

すべて任意です。相対パスはこのフォルダから見た位置です。

| 変数 | 既定値 | 内容 |
|---|---|---|
| `SURVEY_PORT` | `5100` | ポート |
| `SURVEY_LOGS_DIR` | `quiz-logs` | 回答ログ（git 管理外） |
| `SURVEY_DEFINITIONS_DIR` | `../backend/quizzes` | アンケートの質問 |
| `SURVEY_PAGE` | `../backend/survey.html` | アンケートページ |
| `QUIZ_LIB_DIST` | `../quiz-lib/dist` | quiz-lib のビルド |

両方のバックエンドがアンケートを配信している間は、質問とページを `backend/` に置いたままにして 1 か所で管理します。Flask のアンケート用ルートを消すときに、ここへ移します。これまでの回答を引き継ぐには、`backend/quiz-logs/*.jsonl` を `quiz-logs/` にコピーしてください（形式は同じです）。`SURVEY_LOGS_DIR` を `../backend/quiz-logs` に向けても構いません。

## 構成

```
src/
  core/      アンケートのロジック：記録するもの、回答のまとめ、進み具合、CSV（I/O なし）
  store/     データの置き場所：JsonlStore（回答）、FileDefinitions（質問）
  handlers/  API。Lambda と同じ形：(request, deps) -> {statusCode, headers, body}
             write.ts  POST /api/quiz/log
             read.ts   /api/quiz 以下の GET すべて
  app.ts     Express：ハンドラへのルーティング、ページ、quiz.js
  server.ts  起動
```

ハンドラは Express に依存しないので、後で API Gateway の裏の Lambda としてそのまま動かせます。回答の保存先は `QuizEventStore` インターフェース（`store/types.ts`）です。DynamoDB 版のストアを作れば、ハンドラを変えずに `JsonlStore` と差し替えられます。

## Flask バックエンドとの違い

同じリクエストを両方に送って確認しました（応答約 13 万件、ログファイルはバイト単位、加えて実際の `unilens-poc` のログ）。違いは次の意図的なものだけです。

- study-logs への書き込みがない（上記）。
- U+2028／U+2029／U+0085 を含む回答も残る。Flask はこれらをそのまま書き込み、読み戻すときにその行を分割してしまうため、イベントが失われます。ここではエスケープして書き込み、Flask が書いた行も 1 行として読みます。
- 存在しないパスへの 404 が、Flask の HTML ページではなく JSON になる。
- `type` がリストやオブジェクトのイベントは、500 エラーにせず破棄して `dropped` に数える。
