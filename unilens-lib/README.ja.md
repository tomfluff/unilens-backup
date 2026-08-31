# UniLens フロントエンド要約

> [README.md](README.md) の日本語訳です。規約の正典は英語版であり、両者が食い違った場合は英語版が優先されます。

![概要図](../docs/architecture.drawio.png)

**概要**: どんなウェブページにも埋め込める、視覚的コンテキスト付きAIチャットのウィジェット。`<script>`タグ1本で`window.UniLens.init()`を呼ぶだけで動く埋め込み型ライブラリ(React + TypeScript + Vite、`frontend/src/main.tsx`)。

## 主要モジュール

- **`main.tsx`** — エントリポイント。Alt+クリック(またはAlt+ドラッグで範囲選択)をトリガーにキャプチャを実行し、バックエンドにアップロードしてチャットポップオーバーを開く。ポップオーバーはピン留め位置をlocalStorageに保存し、再読込後も同じ場所に復元。

- **`capture.ts`** — キャプチャの中核。`html2canvas`でページ全体をスクリーンショット化し、以下を重ねて描画:
  - クリック位置のクロスヘア
  - 直近のマウス軌跡(フェードするトレイル)
  - 現在のビューポート範囲(シアン枠)
  - Alt+ドラッグで選択した範囲(マゼンタ枠)

  加えて「今見えている部分」のクリーンな高解像度クローズアップも別途生成。`object-fit`画像はhtml2canvasの不具合を避けるため事前にcanvasへ焼き直す。クリックされたDOM要素の文脈(タグ、テキスト、role、直近の見出しなど)も収集。

- **`zoom.ts`** — Ctrl+ホイール(トラックパッドのピンチも含む)によるページ全体のピンチズーム。`document.body`に`scale()`を適用し、カーソル位置を基準にスクロール補正。ダブルクリックで要素にスマートズームする機能も。座標は常にズーム非依存の「content space」で記録され、非ズーム状態のスクリーンショットと整合する。

- **`ChatPopover.tsx`** — ドラッグ可能なチャットUI。キャプチャ画像を表示しつつ、バックエンド(`/api/chat`または`/api/chat/stream`)とやり取り。ストリーミング応答、会話の継続性(セッションID)、クイックアクション(「これを説明して」「要約して」「英訳して」)、ハイコントラストモードや文字サイズ調整など、アクセシビリティ寄りの設定に対応。

- **`settings.ts`** — 左下の歯車アイコンから開く設定パネル。各機能のON/OFFやキャプチャ解像度、チャット文字サイズなどをlocalStorageに永続化し、即座に反映。


# React + TypeScript + Vite

このテンプレートは、HMR といくつかの Oxlint ルールを備えた、Vite 上で React を動かすための最小構成を提供します。

現時点で 2 つの公式プラグインがあります:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) は [Oxc](https://oxc.rs) を使用
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) は [SWC](https://swc.rs/) を使用

## React Compiler

このテンプレートでは、開発/ビルドパフォーマンスへの影響のため React Compiler は有効化されていません。導入する場合は[こちらのドキュメント](https://react.dev/learn/react-compiler/installation)を参照してください。

## Oxlint 設定の拡張

本番アプリケーションを開発している場合は、`oxlint-tsgolint` をインストールして `.oxlintrc.json` を編集し、型を考慮した lint ルールを有効にすることを推奨します:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

ルールとカテゴリの全一覧は [Oxlint ルールのドキュメント](https://oxc.rs/docs/guide/usage/linter/rules)を参照してください。
