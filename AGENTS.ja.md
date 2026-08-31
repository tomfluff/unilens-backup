# UniLens エージェント クイックルール

> [AGENTS.md](AGENTS.md) の日本語訳です。規約の正典は英語版であり、両者が食い違った場合は英語版が優先されます。

- 変更は最小限にし、スコープを絞り、検証可能にしておくこと。
- 明示的に挙動の変更を求められない限り、既存の挙動を維持すること。
- 明示的な指示がない限り、`frontend/softbank-mirror/ext/` にあるミラーされたベンダーファイルの編集は避けること。

## リポジトリ簡易マップ
- `backend/`: Flask API（`/api/capture`、`/api/chat`、セッション/キャプチャの保存先）。
- `unilens-lib/`: 埋め込み型のメイン React + TypeScript ウィジェット。
- `accessibility-lib/`: アクセシビリティに特化した埋め込み型ウィジェット。
- `frontend/`: 静的テストターゲット（`dev-demo`、`softbank-mirror`）。

## 必須チェック
- `make build`
- `make format`

## 便利な実行コマンド
- `make serve <target>` (バックエンド + 対象フロントエンド 1 つ)
- `make serve-backend`
- `make serve-frontend <target>`

## 変更完了前の確認事項
変更のテストおよび検証のために、必ず以下を実行してください：
- `make build` - すべてのコードがビルド可能であることを確認
- `make format` - すべてのフォーマッターチェックを通過することを確認

`unilens-lib` または `accessibility-lib` 内で作業している場合は、追加で以下も実行してください：
- `make fix` - これは `make format` よりも強力で、構文エラーを特定して修正を試み、修正できないエラーがある場合は停止します。完了前に、コードが警告やエラー 0 件で `make fix` を通過することを確認してください。
