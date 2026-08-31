# UniLens プロジェクト

> [README.md](README.md) の日本語訳です。規約の正典は英語版であり、両者が食い違った場合は英語版が優先されます。

ページ内 AI パートナーでウェブ閲覧をアクセシブルにする。

## 構成

管理対象のパッケージは 4 つです:

* `backend` - Python `venv` で管理する Flask サーバ。詳細は `backend/Makefile` を参照
* `unilens-lib` - `npm` で管理する Unilens ライブラリ。詳細は `unilens-lib/Makefile` を参照
* `accessibility-lib` - `npm` で管理する Unilens ライブラリ。詳細は `unilens-lib/Makefile` を参照
* `.` - `npm` で管理するルートディレクトリ。`softbank-mirror` のようなサンプルサイトの配信に使う、ごく小さなパッケージ。`./Makefile` が全パッケージを管理する

`.` については `npm` と `venv` のどちらを使うかは比較的恣意的な選択です。クライアントビルドと一貫性を保つために `npm` を選んでいます。

## プロトタイプ

任意の HTML ページに組み込めるキャプチャ + チャットオーバーレイ。Alt+クリックでビューポート・
マウス軌跡・クリック位置を注釈したフルページのスクリーンショットを撮影してバックエンドに送信し、
カーソル位置に LLM/VLM 駆動のチャットポップオーバーを開きます。

```
unilens-lib/          React + TS — esbuild で単一の埋め込み用 dist/unilens.js をビルド
accessibility-lib/    React + TS — esbuild で単一の埋め込み用 dist/accessibility.js をビルド
backend/           Flask — キャプチャを保存し、OpenAI / Gemini / スタブで /api/chat を提供
softbank-mirror/   softbank.jp の IR ベネフィットページの静的コピー（テスト対象）
softbank-mirror-recruit/  softbank.jp の recruit/disability ページの静的コピー（テスト対象。配信ルートは `site/`）
```
## セットアップとクリーンアップ
バックエンド、unilens lib、ビルドシステムをセットアップする:
```
make init
```

全パッケージと中間生成物をクリーンにする:
```
make clean
```

## ビルド・実行・serve

動詞:
* `build` - ディストリビューションをビルド（unilens lib のみ）
* `run` - サーバを実行（ビルドせずに）
* `serve` - 任意のディストリビューションをビルドし、サーバを実行し、変更を監視する

### 一般的な使い方

バックエンドを起動し、指定したフロントエンドターゲット `{target}` を配信する:
```
make serve softbank-mirror
# バックエンドを起動し、`softbank-mirror` を localhost:8000 に配信。開いて任意の場所を alt+クリック
```

これは以下 3 つのディレクトリいずれかの変更を監視し、自動で再ビルド/再配信します:
* `backend` - サーバコード
* `unilens-lib` - Unilens の JavaScript ライブラリソース
* `accessibility-lib` - Accessibility の JavaScript ライブラリソース
* `frontend/{target}` - クライアントの基本 HTML とソース（unilens.js の dist を除く）

### バックエンドのみ

バックエンドを実行し変更を監視する（API キーなしでもスタブが動作。実際の LLM を使う場合は `.env.example` を `.env` にコピー）:

```
make serve-backend
# Flask サーバを http://127.0.0.1:5000 に配信
```

### フロントエンドのみ

指定したターゲットディレクトリでフロントエンドの dev demo を実行し変更を監視する（/api を Flask にプロキシ）:

```
make serve-frontend softbank-mirror
# `softbank-mirror` を localhost:8000 に配信。開いて任意の場所を alt+クリック
```

```
make serve-frontend softbank-mirror-recruit
# `frontend/softbank-mirror-recruit/site` を localhost:8002 に配信
```

### JavaScript ライブラリのみ

unilens lib を dist にビルドして監視する
```
make serve-target unilens
```

accessibility lib を dist にビルドして監視する
```
make serve-target accessibility
```

### 複数のフロントエンドを実行する

すべての JS ターゲットをすべてのフロントエンドターゲットにビルドする:
```
make serve-all
```

代わりに個別に実行する場合は、`make serve-backend` を単独で実行し、各ターゲットごとに `make serve-frontend {target}` を実行してください。ターミナルを 3 つ開くだけでこれができます。ルート `.` のディストリビューションに含まれる `npx concurrently` を使うこともできます:
```
npx concurrently "make serve-backend" "make serve-frontend dev-demo" "make serve-frontend softbank-mirror"
# 'dev-demo' からのフロントエンドを localhost:8000 に配信
# http://0.0.0.0:8080 is already in use. Trying another port.
# Serving "dev-demo" at http://127.0.0.1:53252
```

## 任意の HTML への埋め込み

```
cd unilens-lib && make build         # -> dist/unilens.js
```

```html
<script src="unilens.js"></script>
<script>
  UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })
</script>
```

オプション: `trigger`（MouseEvent 述語、既定は alt+クリック）、`mouseWindow`（マウス軌跡の秒数）、
`backend`（Flask のベース URL）。

SoftBank ミラーに対してテストする場合: `unilens-lib/dist/unilens.js` を `softbank-mirror/` に
コピーし、上記 2 つの script タグをその `index.html` に追加して、フォルダを配信します
（`python -m http.server`）。

## ライブラリの切り替え

`unilens-lib` と `accessibility-lib` の両方をテストしている場合、最も簡単なのはフロントエンド
ターゲットの HTML に両方を含め、今テストしていない方をコメントアウトすることです:
```html
<script src="accessibility.js"></script>
<script src="unilens.js"></script>
<script>
  // Accessibility.init( ... );
  UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })
</script>
```

## 新しいターゲットの追加

新しい JavaScript ターゲットやフロントエンドターゲットを追加するには、`make-targets.mk` を更新します:
```Makefile
# JS build targets

# Define all targets here, this allows us to iterate through them
JS_TARGETS:= unilens-lib accessibility-lib

target_dist_unilens-lib=unilens.js
target_dist_accessibility-lib=accessibility.js

# Frontend build targets
FRONTEND_TARGETS:= softbank-mirror dev-demo

# To add a target, use the format `frontend_port_{subdir name}=<PORT>`
frontend_port_softbank-mirror=8000
frontend_port_dev-demo=8001
```

## データ

各キャプチャは `backend/captures/<id>/` に保存されます: `capture.png`（注釈付き
スクリーンショット）、`meta.json`（クリック、スクロール、ビューポート、ページサイズ、マウス軌跡）、
`chat.json`（会話履歴）。
