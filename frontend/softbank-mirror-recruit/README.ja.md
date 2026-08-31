# softbank-a11y — ローカル検証用ミラー

> [README.md](README.md) の日本語訳です。規約の正典は英語版であり、両者が食い違った場合は英語版が優先されます。

https://www.softbank.jp/recruit/disability/index.html のローカルコピー。
ウェブアクセシビリティ機能の開発・検証をオフラインで回すためのもの。

## 起動

```
make serve softbank-mirror-recruit
```

http://localhost:8002/recruit/disability/ （ルート `/` は静的な `index.html` により自動リダイレクト）

カスタムサーバなしの単純な静的サイトとして配信される。`live-server` がこのディレクトリをそのまま
ドキュメントルートとして配信し、ミラー内の絶対パス（`/recruit/...`）とディレクトリ構造が一致する。

リポジトリルートから `make` でライブラリを反映する場合:

```
make copy softbank-mirror-recruit
# → accessibility.js, unilens.js
```

`recruit/disability/index.html` 末尾で `/accessibility.js` と `/unilens.js` を読み込み、パネルを起動します。

## 構成

| パス | 内容 |
| --- | --- |
| `recruit/`, `scsystem/`, `_ext/` など | 配信ルート。本番と同じパス構造（`/recruit/...`）で保存してあるので、絶対パス参照がそのまま解決される |
| `scsystem/api/CreateRecruitJson/*/index.html` | ページが実行時に axios で取りに行く API のレスポンスを固定化したもの（拡張子を `.html` にすることで、クエリ文字列に関係なく静的サーバがディレクトリ配下のレスポンスとして返す） |
| `_ext/fonts.*` | Google Fonts（Roboto）の CSS と woff2 をローカル化したもの |
| `original/index.html` | 取得時点の無加工 HTML。差分確認用 |

### 一覧 API のクエリについて

`SOFTBANK CAREER NOW!` と `社員紹介` の一覧は Vue コンポーネントが実行時に API を叩いて描画する。
本来 **件数（`limit`）と絞り込み（`category`）はクエリパラメータで決まる**が、静的サーバはクエリ文字列を
無視するため、実際にページが使っている1パターンだけを `index.html` として固定化してある：

| リクエスト | 固定化した内容 |
| --- | --- |
| `CareerNowIntroduction/?start=0&limit=2&category=disability&language=ja-JP` | 2 件 |
| `PeopleIntroduction/?category=disability&language=ja-JP` | 7 件（JS 側が 6 件に絞る） |
| `NewInfoIntroduction/?category=disability&language=ja-JP` | 6 件 |

## 原本からの変更点

ミラー取得時に `recruit/disability/index.html` に対して行った書き換えは次のとおり。
DOM 構造は保ったまま、外部通信を止め、検証用スクリプトだけ末尾に足している。

- Google Fonts の `<link>` をローカルの `/_ext/fonts.googleapis.com/css2.css` に向けた
- `fonts.gstatic.com` への `preconnect` を削除
- 外部トラッカー／ウィジェットを `type="text/plain"` + `data-local-disabled="..."` にして実行だけ停止
  - Google Tag Manager（inline + noscript iframe）
  - Yahoo タグマネージャー（yjtag）
  - User Insight（nakanohito.jp）
  - Twitter/X widgets.js
  - 停止済みの要素はブラウザから `document.querySelectorAll('[data-local-disabled]')` で確認できる
- `</body>` 直前に `accessibility.js` / `unilens.js` と `Accessibility.init` / `UniLens.init` を挿入
  （`<!-- [local] unilens-a11y -->` … `<!-- [/local] unilens-a11y -->` で囲み、再実行時は差し替え）

画像・サイト本体の JS/CSS は加工していない。

## 既知の差分・制限

- **1 ファイルだけ 404 が残る**: `/recruit/set/data/disability/project/merihariplan/img/thumb.jpg`。
  本番サイト側で 404 になっている参照で、ミラーの取りこぼしではない（同様に
  `images/recruit/flow/ico_angle_right_bk.png`、`images/recruit/flow/ico/ico_arrow.svg` も本番 404。
  こちらは CSS 内の参照で描画には出てこない）。
- **社員紹介の 6 人は再読み込みごとに入れ替わる**。JS が対象 7 件をシャッフルして 6 件描画する仕様で、
  本番と同じ挙動。6 件とも画像は表示される。
- **API レスポンスは取得時点で固定**。社員紹介・キャリアNOW の一覧は更新されない。
- **ミラーしたのはこの 1 ページのみ**。ヘッダー・フッターの他ページへのリンクは 404 になる。
- 外部ドメインへのリンク（グループ会社サイト、応募フォーム等）はそのまま。オフラインでは開けない。

## 取り直し

自動の再取得スクリプトは廃止した。取り直す場合は本番から手動でページとアセットを再取得し
（絶対パス `/recruit/...` の構造を保ったまま）、上記の変更点を再適用すること。
