# UniLens Backend 概要 (`backend/app.py`)

**役割**: Flaskの軽量プロトタイプAPI。フロントエンドがキャプチャした画像・メタデータを保存し、LLM/VLMに投げて質問応答を返す。

## エンドポイント

| エンドポイント | 内容 |
|---|---|
| `POST /api/capture` | フロントから送られたPNG(全体像+クローズアップ)とメタデータを`captures/<id>/`に保存。`session_id`があれば既存セッションに追加、なければ新規発行 |
| `GET /api/capture/<id>` | 保存済みファイルのサイズ確認用(チャットUI上部の「backend stored: ...」表示に使用) |
| `GET /api/session/<sid>` | セッションの履歴・キャプチャ数を返す(会話継続のシード用) |
| `POST /api/chat` | 画像+メタデータ+履歴をLLMに渡し、返答を一括で返す |
| `POST /api/chat/stream` | 同様だがSSE(`text/event-stream`)でトークンを逐次配信 |
| `GET /health` | プロバイダ確認用ヘルスチェック |

## LLMプロバイダ選択

環境変数で自動切り替え(`_provider()`):
1. `OPENAI_API_KEY`があれば OpenAI(`gpt-5.4-mini`、Responses API)
2. なければ`GOOGLE_API_KEY`でGemini(`gemini-3-flash-preview`)
3. どちらもなければ**オフラインのスタブ**(キーなしでもフロントが動作確認できるよう、クリック位置などをエコーするだけの応答)

## プロンプト設計

`SYSTEM_PROMPT`で「注釈付きスクリーンショット(シアン=ビューポート、オレンジ=マウス軌跡、赤=クリック位置)+クローズアップ画像+ページメタデータ」の読み方をモデルに指示。クリックしたDOM要素情報やAlt+ドラッグの選択領域があれば、それを最優先の手がかりとして扱うよう指定。

## セッション継続性

- `sessions/<sid>.json`に`captures`(キャプチャID一覧)と`history`(会話履歴)を保存。
- 同一セッション内の複数キャプチャをまたぐ場合、`_session_context_note()`が「これまでのキャプチャでどこをクリックしたか」を一行要約としてLLMに渡す(画像自体は最新の1枚のみ再送し、トークン節約)。

## ストレージ

- `captures/<id>/`: `capture.png`(全体注釈画像)、`viewport.png`(クローズアップ、任意)、`meta.json`、`chat.json`(セッション外の単発チャット履歴)
- `sessions/<sid>.json`: セッション単位の履歴

