# accessibility-lib

> [README.md](README.md) の日本語訳です。規約の正典は英語版であり、両者が食い違った場合は英語版が優先されます。

任意の HTML ページに埋め込める表示調整ライブラリです。ビルドすると単一の `dist/accessibility.js` になり、`window.Accessibility.init()` で起動します（`window.UniLensA11y` も同じ API です）。

作業ディレクトリは、特に断りのない限り **UniLens リポジトリのルート**（このフォルダの一つ上）です。

## 必要なもの

- Node.js と npm
- Python 3（デモサイトを静的配信する場合、またはバックエンドを動かす場合）
- GNU Make（ある場合。Linux / macOS は標準。Windows は Git for Windows 付属の make か、別途導入）

GNU Make が無い PC でも、下の「GNU Make がない場合」で起動できます。

## GNU Make がある場合（推奨）

初回:

```sh
make init
```

デモ（SoftBank ミラー）:

```sh
make serve softbank-mirror
```

ブラウザで http://localhost:8000/ を開きます。右上の **♿ 表示調整** がこのライブラリです。

採用サイトミラー（`softbank-mirror-recruit`）へビルド成果物を反映する場合:

```sh
make build
# または特定ターゲットのみ: make copy softbank-mirror-recruit
```

成果物は `frontend/softbank-mirror-recruit/site/` にコピーされます（配信ルートが `site/` のため）。  
フロントのみ起動する例: `make serve-frontend softbank-mirror-recruit`（ポート 8002）。API レスポンスまで本番に近づける場合は `cd frontend/softbank-mirror-recruit && node server.mjs`（ポート 8787）。

| コマンド | 内容 |
|---|---|
| `make serve-frontend softbank-mirror` | フロントのみ（ポート 8000） |
| `make serve-frontend softbank-mirror-recruit` | 採用ミラー（ポート 8002、`site/` を配信） |
| `make serve-frontend dev-demo` | 簡易デモ（ポート 8001） |
| `make serve-target accessibility-lib` | このライブラリだけ watch ビルド |
| `cd accessibility-lib && make build` | 型チェック後に単一の `dist/accessibility.js` を出力 |
| `cd accessibility-lib && make lint` | 型チェック |
| `cd accessibility-lib && make test` | 単体テスト |

## GNU Make がない場合

Node.js / npm / Python 3 だけで動かします。シェルは macOS / Linux の例です。Windows は下の PowerShell を使ってください。

### 1. 依存関係

```sh
cd accessibility-lib
npm install
```

AI チャット（`unilens-lib`）も同じページで試す場合:

```sh
cd ../unilens-lib
npm install
```

### 2. ビルド

```sh
cd accessibility-lib
npx tsc -b
npx esbuild src/main.tsx --outfile=dist/accessibility.js --bundle --minify --loader:.css=text
```

`unilens-lib` もビルドする場合:

```sh
cd ../unilens-lib
npx esbuild src/main.tsx --outfile=dist/unilens.js --bundle --minify --sourcemap
```

### 3. デモサイトへコピー

`softbank-mirror`（ページルート直下）:

```sh
cd ..
cp accessibility-lib/dist/accessibility.js frontend/softbank-mirror/accessibility.js
cp unilens-lib/dist/unilens.js frontend/softbank-mirror/unilens.js
```

`softbank-mirror-recruit`（配信ルートは `site/`）:

```sh
cd ..
cp accessibility-lib/dist/accessibility.js frontend/softbank-mirror-recruit/site/accessibility.js
cp unilens-lib/dist/unilens.js frontend/softbank-mirror-recruit/site/unilens.js
```

`unilens.js` が無い場合は、そのコピー行は省略してかまいません。`Accessibility.init()` だけでもパネルは動きます。

### 4. サーバ起動

```sh
cd frontend/softbank-mirror
python3 -m http.server 8000
```

採用ミラーの場合:

```sh
cd frontend/softbank-mirror-recruit
node server.mjs
# → http://localhost:8787/recruit/disability/
```

Windows で `python3` が無いときは `python -m http.server 8000` を使います。

ブラウザで http://127.0.0.1:8000/ を開きます。ソースを直したら **2 → 3 を再実行**し、ブラウザを再読み込みしてください。

型チェックとテスト:

```sh
cd accessibility-lib
npx tsc -b
npx vitest run
```

### Windows PowerShell（Make なし）

リポジトリルートから:

```powershell
cd accessibility-lib
npm install
npx tsc -b
npx esbuild src/main.tsx --outfile=dist/accessibility.js --bundle --minify --loader:.css=text

cd ..
Copy-Item accessibility-lib/dist/accessibility.js frontend/softbank-mirror/accessibility.js -Force

# 採用ミラーへも反映する場合:
Copy-Item accessibility-lib/dist/accessibility.js frontend/softbank-mirror-recruit/site/accessibility.js -Force

cd frontend/softbank-mirror
python -m http.server 8000
```

## 任意の HTML への埋め込み

```html
<script src="accessibility.js"></script>
<script>
  Accessibility.init()
</script>
```

ページ表示調整用の CSS は `accessibility.js` に含まれ、初期化時に自動で注入されます。

`unilens-lib` と同時に使う場合:

```html
<script src="accessibility.js"></script>
<script src="unilens.js"></script>
<script>
  Accessibility.init()
  UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })
</script>
```

## `init()` オプション

`Accessibility.init()` / `UniLensA11y.init()` に渡せる主なオプションです。省略時は各項目の既定値が使われます。

| オプション | 既定 | 説明 |
|---|---|---|
| `panel` | `true` | 右上の ♿ パネルを表示 |
| `selection` | `true` | 選択範囲の文字サイズ変更 |
| `speech` | `true` | 選択テキストの読み上げ |
| `autoText` | `true` | ページ文字サイズの自動分析 |
| `bodyTextExpand` | `true` | 本文のみの拡大（見出し除外） |
| `smallTextBoost` | `true` | 16px 未満の文字の底上げ |
| `followSystemPreferences` | `false` | 初回のみ OS の表示設定を反映 |
| `lang` | 自動検出 | パネル言語（`'ja'` / `'en'`）。パネルでの選択は常に優先 |

パネル言語の初期値は `<html lang>` とブラウザ言語から推定されます。パネルで選んだ言語は保存され、次回以降も使われます。

全体のビルド／serve はリポジトリルートの `README.md` も参照してください。
