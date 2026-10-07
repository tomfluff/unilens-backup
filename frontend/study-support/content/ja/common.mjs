// 共通の画面テキスト（日本語）
import { TEL } from '../shared.mjs';

export const ui = {
  siteName: 'クモモバイル サポート',
  logoSub: 'サポート',
  home: 'ホーム',
  skip: '本文へ移動',
  crumbLabel: 'パンくずリスト',
  navLabel: 'メインメニュー',
  otherLang: 'English',
  search: '検索',
  searchPh: 'サポート情報を検索',
  myKumo: 'My Kumo ログイン',
  related: '関連ページ',
  utilLeft: '個人のお客さま',
  util: [['障害・メンテナンス情報', '@/status.html'], ['ショップを探す', '@/shops/index.html'], ['お問い合わせ', '@/contact.html']],
  nav: [
    ['料金プラン', '@/plans/index.html', [['料金プランを比較', '@/plans/index.html'], ['クモ ミニ（3GB）', '@/plans/mini.html'], ['クモ ベーシック（20GB）', '@/plans/basic.html'], ['クモ アンリミテッド', '@/plans/unlimited.html'], ['クモ 65+', '@/plans/senior.html'], ['オプション・クモ端末補償', '@/plans/options.html'], ['クモワールド（海外ローミング）', '@/plans/roaming.html']]],
    ['お手続き', '@/procedures/index.html', [['お手続き一覧', '@/procedures/index.html'], ['他社からのお乗り換え（MNP）', '@/procedures/switch-to-kumo.html'], ['新規契約', '@/procedures/new-contract.html'], ['料金プランの変更', '@/procedures/change-plan.html'], ['eSIMの設定', '@/procedures/esim.html'], ['SIMカードの取り付け', '@/procedures/sim-card.html'], ['データ使用量の確認', '@/procedures/data-usage.html'], ['紛失・盗難', '@/procedures/lost-phone.html'], ['修理・交換', '@/procedures/repair.html'], ['解約', '@/procedures/cancel.html'], ['氏名・住所の変更', '@/procedures/change-details.html'], ['ご家族への譲渡', '@/procedures/transfer.html']]],
    ['ご請求・お支払い', '@/billing/index.html', [['お支払い方法・請求日', '@/billing/index.html'], ['請求書の見方', '@/billing/read-your-bill.html'], ['手数料一覧', '@/billing/fees.html']]],
    ['エリア・通信', '@/network.html', [['サービスエリア・5G', '@/network.html'], ['障害・メンテナンス情報', '@/status.html']]],
    ['ショップ', '@/shops/index.html', [['ショップを探す', '@/shops/index.html'], ['クモショップ 春川中央店', '@/shops/harukawa-central.html'], ['来店予約', '@/shops/appointments.html']]],
    ['ヘルプ', '@/faq.html', [['よくあるご質問', '@/faq.html'], ['お問い合わせ', '@/contact.html'], ['申込書・ダウンロード', '@/forms/index.html'], ['お知らせ', '@/news/index.html'], ['My Kumo について', '@/my-kumo.html']]],
  ],
  side: `<a class="promo promo-a" href="@/plans/index.html#home-bundle"><span class="ad">PR</span><b>スマホ＋おうちのネット</b>クモ光とセットで、ご家族のスマホ1回線ごとに毎月最大1,100円割引。</a>
<a class="promo promo-b" href="@/plans/options.html#care"><span class="ad">PR</span><b>画面が割れたら？</b>クモ端末補償は月額550円から。プレミアムなら修理代0円から。</a>
<a class="promo promo-c" href="@/plans/senior.html"><span class="ad">PR</span><b>クモ 65+</b>5GB＋10分以内の通話無料で月額2,728円。見守りサービスも無料に。</a>
<div class="side-box"><h3>お困りのときは</h3><p>インフォメーションセンター<br><b>${TEL.info.free}</b>（無料）<br>クモモバイルの携帯電話から：<b>${TEL.info.short}</b><br><span class="small">受付時間 ${TEL.info.hours[0]}:00〜${TEL.info.hours[1]}:00（年中無休）</span></p><p>紛失・盗難窓口（24時間）<br><b>${TEL.lost.free}</b></p><p><a href="@/contact.html">お問い合わせ窓口一覧 ›</a></p></div>`,
  helpful: `<div class="helpful">このページは役に立ちましたか？ <button type="button">はい</button><button type="button">いいえ</button></div>`,
  footer: `<div class="ftr-cols">
<div><h3>料金プラン・サービス</h3><ul><li><a href="@/plans/index.html">料金プランを比較</a></li><li><a href="@/plans/mini.html">クモ ミニ</a></li><li><a href="@/plans/basic.html">クモ ベーシック</a></li><li><a href="@/plans/unlimited.html">クモ アンリミテッド</a></li><li><a href="@/plans/senior.html">クモ 65+</a></li><li><a href="@/plans/options.html">オプション・クモ端末補償</a></li><li><a href="@/plans/roaming.html">クモワールド（海外ローミング）</a></li></ul></div>
<div><h3>お手続き</h3><ul><li><a href="@/procedures/switch-to-kumo.html">他社からのお乗り換え</a></li><li><a href="@/procedures/new-contract.html">新規契約</a></li><li><a href="@/procedures/change-plan.html">料金プランの変更</a></li><li><a href="@/procedures/esim.html">eSIMの設定</a></li><li><a href="@/procedures/lost-phone.html">紛失・盗難</a></li><li><a href="@/procedures/cancel.html">解約</a></li><li><a href="@/procedures/index.html">お手続き一覧</a></li></ul></div>
<div><h3>ご請求・お支払い</h3><ul><li><a href="@/billing/index.html">お支払い方法</a></li><li><a href="@/billing/read-your-bill.html">請求書の見方</a></li><li><a href="@/billing/fees.html">手数料一覧</a></li></ul><h3 style="margin-top:14px">エリア・通信</h3><ul><li><a href="@/network.html">サービスエリア・5G</a></li><li><a href="@/status.html">障害・メンテナンス情報</a></li></ul></div>
<div><h3>ショップ</h3><ul><li><a href="@/shops/index.html">ショップを探す</a></li><li><a href="@/shops/harukawa-central.html">春川中央店</a></li><li><a href="@/shops/appointments.html">来店予約</a></li></ul></div>
<div><h3>ヘルプ</h3><ul><li><a href="@/faq.html">よくあるご質問</a></li><li><a href="@/contact.html">お問い合わせ</a></li><li><a href="@/forms/index.html">申込書・ダウンロード</a></li><li><a href="@/forms/checklist.html">ご来店時の持ち物チェックリスト</a></li><li><a href="@/news/index.html">お知らせ</a></li><li><a href="@/my-kumo.html">My Kumo について</a></li><li><a href="@/search.html">サイト内検索</a></li></ul></div>
</div>
<div class="ftr-bottom"><span>© 2026 Kumo Mobile Corporation. 記載の金額は特に記載のない限り税込（消費税10%）です。</span><span>電気通信事業者 登録番号 第412号</span></div>`,
  fictional: '研究用に作成した架空のウェブサイトです（UniLens ユーザー調査）。',
  cookie: '当サイトでは、利便性の向上とサポートページの利用状況の把握のためにCookieを使用しています。閲覧を続けることで、Cookieの使用に同意したものとみなします。',
  cookieOk: '同意する',
  chat: {
    label: 'チャットサポートを開く',
    btn: 'チャット',
    panel: `<div class="chat-h">クモ サポートチャット <button type="button" class="chat-close" aria-label="閉じる">×</button></div>
<div class="chat-b"><div class="chat-msg">こんにちは！クモモバイルのサポートアシスタントです。ご用件をお選びいただくか、ご質問を入力してください。オペレーターとのチャットは毎日9:00〜21:00に受け付けています。</div>
<ul><li><a href="@/procedures/switch-to-kumo.html">お乗り換え</a></li><li><a href="@/billing/read-your-bill.html">ご請求について</a></li><li><a href="@/procedures/lost-phone.html">紛失・盗難</a></li><li><a href="@/procedures/esim.html">eSIM</a></li><li><a href="@/faq.html">よくあるご質問</a></li></ul></div>
<form class="chat-f"><input type="text" placeholder="メッセージを入力" aria-label="メッセージ"><button type="submit" class="btn" style="padding:6px 12px">送信</button></form>`,
  },
};
