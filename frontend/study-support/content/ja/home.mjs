// トップページ（日本語）
import { PLAN, TEL, yenJ, cards } from '../shared.mjs';
import { NEWS, newsList } from './news.mjs';

const slide = (img, kicker, title, text, href, cta, on) => `<div class="slide${on ? ' on' : ''}"><img src="/assets/img/${img}.jpg" alt=""><div class="slide-txt"><span class="kicker">${kicker}</span><h2>${title}</h2><p>${text}</p><a class="btn" href="${href}">${cta}</a></div></div>`;

export const pages = {
  'index.html': {
    title: 'クモモバイル サポート', wide: true, noH1: true,
    desc: 'クモモバイルをご利用のお客さま向けに、料金プラン、各種お手続き、ご請求、エリア、ショップの情報をご案内します。',
    hero: `<section class="hero"><div class="carousel">
${slide('travel-roaming', 'お知らせ', '12月1日から「クモ アンリミテッド」の料金を改定', `クモ アンリミテッドは月額${yenJ(PLAN.unlimited.newPrice)}に、アジアの24時間パスは1,080円になります。変更点をご確認ください。`, '@/news/price-revision-2026.html', 'お知らせを読む', true)}
${slide('hero-phones', '安全のために', '「クモモバイル」をかたる偽SMSが増えています', 'クモモバイルがSMSでパスワードやカード番号をお尋ねすることはありません。詐欺メッセージの見分け方をご確認ください。', '@/news/scam-sms-warning.html', '詐欺SMSへの対策')}
${slide('station-shop', '春川灯籠まつり', '春川中央店は21:00まで営業', '10月10日（土）・11日（日）は営業時間を延長します。混雑が予想されますので、ご来店予約がおすすめです。', '@/shops/harukawa-central.html', '店舗情報を見る')}
<button type="button" class="arrow prev" aria-label="前へ">‹</button><button type="button" class="arrow next" aria-label="次へ">›</button>
<div class="dots"><button type="button" class="on" aria-label="スライド1"></button><button type="button" aria-label="スライド2"></button><button type="button" aria-label="スライド3"></button></div>
</div></section>`,
    body: `
<h1 class="h1" style="border:0;margin:6px 0 0;padding:0;font-size:22px">クモモバイル サポート</h1>
<div class="status-strip"><b>障害・メンテナンス情報</b><span><span class="dot dot-bad"></span>春川中央駅周辺で5Gのデータ通信がつながりにくい状況です（調査中）</span><span><span class="dot dot-warn"></span>My Kumoアプリ（Android）でログインできない事象</span><span><span class="dot dot-ok"></span>その他のサービスは正常です</span><a href="@/status.html">詳細 ›</a></div>
<div class="home-search"><b>お困りごとを検索</b><form action="@/search.html"><input type="search" name="q" placeholder="例：eSIM、家族割、解約" aria-label="サポート情報を検索"><button class="btn" type="submit">検索</button></form>
<div class="kw">よく検索されるキーワード：<a href="@/search.html?q=eSIM">eSIM</a><a href="@/search.html?q=%E5%AE%B6%E6%97%8F%E5%89%B2">家族割</a><a href="@/search.html?q=MNP">MNP</a><a href="@/search.html?q=%E7%B4%99%E3%81%AE%E8%AB%8B%E6%B1%82%E6%9B%B8">紙の請求書</a><a href="@/search.html?q=%E3%83%AD%E3%83%BC%E3%83%9F%E3%83%B3%E3%82%B0">ローミング</a></div></div>
<div class="home-grid"><div>
<div class="panel"><h2>よく利用されるお手続き</h2>
${cards([['@/procedures/switch-to-kumo.html', '他社からのお乗り換え', '今の電話番号のまま', 'switch'], ['@/procedures/esim.html', 'eSIMの設定', 'iPhone・Android', 'esim'], ['@/procedures/change-plan.html', '料金プランの変更', '無料・翌月から適用', 'plan'], ['@/procedures/data-usage.html', 'データ使用量の確認', 'My Kumo・SMS', 'data'], ['@/procedures/lost-phone.html', '紛失・盗難', '24時間すぐに回線停止', 'lost'], ['@/procedures/repair.html', '修理', 'クモ端末補償のお申し込み', 'repair'], ['@/billing/read-your-bill.html', '請求書の見方', '項目ごとに解説', 'bill'], ['@/procedures/cancel.html', '解約', '料金と時期', 'cancel']])}
</div>
<div class="panel"><h2>お知らせ</h2>${newsList(NEWS.slice(0, 6))}<p style="margin:10px 0 0;font-size:12.5px"><a href="@/news/index.html">お知らせ一覧 ›</a></p></div>
</div><div>
<div class="panel"><h2>料金プラン</h2><ul style="padding-left:18px;font-size:13px;margin:0">
<li><a href="@/plans/mini.html">クモ ミニ</a> 3GB・月額${yenJ(PLAN.mini.price)}</li><li><a href="@/plans/basic.html">クモ ベーシック</a> 20GB・月額${yenJ(PLAN.basic.price)}</li><li><a href="@/plans/unlimited.html">クモ アンリミテッド</a>・月額${yenJ(PLAN.unlimited.price)}</li><li><a href="@/plans/senior.html">クモ 65+</a> 5GB・月額${yenJ(PLAN.senior.price)}</li></ul>
<p style="margin:10px 0 0;font-size:12.5px"><a href="@/plans/index.html">料金プラン・割引を比較 ›</a></p></div>
<a class="promo promo-b" href="@/plans/index.html#family"><span class="ad">PR</span><b>家族割</b>4回線以上のご家族なら、毎月1回線ごとに最大1,210円割引。</a>
<a class="promo promo-c" href="@/plans/roaming.html"><span class="ad">PR</span><b>海外旅行に</b>クモワールドの24時間パスはアジアなら980円から。</a>
<div class="panel"><h2>お問い合わせ</h2><p style="font-size:12.5px;margin:0 0 6px">インフォメーションセンター <b>${TEL.info.free}</b><br>${TEL.info.hours[0]}:00〜${TEL.info.hours[1]}:00（年中無休）</p><p style="font-size:12.5px;margin:0 0 6px">紛失・盗難窓口（24時間） <b>${TEL.lost.free}</b></p><p style="font-size:12.5px;margin:0"><a href="@/contact.html">窓口一覧</a>・<a href="@/shops/index.html">ショップを探す</a>・<a href="@/faq.html">よくあるご質問</a></p></div>
</div></div>`,
  },
};
