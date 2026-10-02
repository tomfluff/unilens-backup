# 表示調整パネルの幅拡大を元に戻す

## 現象
9/10 の指示でパネル幅が 380px → 400px → 500px に広がり、内部も `calc(500 / 380)` で拡大されている。

## 方針
`--unilens-a11y-panel-ui-scale` を廃止し、幅・タップ・ボタン寸法を拡大前（380px / 倍率 1）に戻す。
カード見出しなど「ボタン以外の文字 20%」は別指示なので残す。

## 進捗
- [ ] スケール変数と寸法を拡大前へ戻す
- [ ] テスト / ビルド / frontend へコピー
- [ ] ブラウザでパネル幅を確認

---

# 新ブランチ f/Accessibility-NewDev-2

相手指摘: main で揃えた流儀から drift していないか監査し、rebase より新しい `f/` ブランチ。

## 進捗
- [x] 現行 NewDev 作業を stash（`wip: NewDev before f/a11y-lib cut`）
- [x] `origin/main` からブランチを切る（現在名 `f/Accessibility-NewDev-2`）
- [x] accessibility-lib 機能ソースだけ移す
- [x] Makefile / gitignore / make-targets は main のまま
- [x] site/・server.mjs・`_a11y_port`・xlsx は載せない
- [x] ドキュメントの `site/` / `server.mjs` 記述を直す
- [x] tsc / biome / vitest 145 / esbuild
- [x] push (`origin/f/Accessibility-NewDev-2`、旧 `f/a11y-lib` は削除)
- [ ] PR: https://github.com/tomfluff/unilens/pull/new/f/Accessibility-NewDev-2 （この環境に `gh` が無い）

## 戻し方
NewDev の未コミット作業は stash に残っている。
`git checkout f/Accessibility-NewDev` のあと `git stash pop`。

---

## 手動変更の反映（進行中）
読み上げガイド既定色 `whiteBlue` → `blackYellow`（ソースとテストは手動済み）。
- [x] vitest（readingGuide）7 passed
- [x] `npm run build` で dist を各 frontend にコピー（この環境に make が無いため）
- [x] ホストページで既定色を確認（採用ミラー: 棒の色「黒と黄」が選択、棒は黒地・黄枠）
