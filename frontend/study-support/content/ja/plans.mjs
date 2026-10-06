// 料金プラン（日本語）
import { PLAN, DISC, CALL, DATA, OPT, CARE, CARE_HIGH, ROAM, ROAM_PASS, COLORS, yenJ, table, note, figure, lineChart, pricePoints } from '../shared.mjs';

const P = PLAN, NAME = { mini: 'クモ ミニ', basic: 'クモ ベーシック', unlimited: 'クモ アンリミテッド', senior: 'クモ 65+' };
const fam = (k, i) => (DISC.family[k][i] == null ? '—' : yenJ(-DISC.family[k][i]));
const after = (k, n) => P[k].price - (DISC.family[k][n] || 0);

const priceChart = lineChart({
  title: 'データ使用量別の月額料金（1回線・割引なし）',
  series: ['mini', 'senior', 'basic', 'unlimited'].map((k) => ({ name: NAME[k], color: COLORS[k], pts: pricePoints(k) })),
  xMax: 30, xTicks: [0, 5, 10, 15, 20, 25, 30], xFmt: (v) => `${v}GB`, yMax: 16000, yStep: 2000, yFmt: (v) => yenJ(v), xTitle: '1か月のデータ使用量',
});

const kome = (items) => `<ul class="kome">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const commonFine = kome([
  '表示料金はすべて税込です。ユニバーサルサービス料（月額3円）および電話リレーサービス料（月額1円）が別途かかります。',
  'ご契約月の月額料金は日割りで計算します。解約月の月額料金は日割りせず、1か月分を全額ご請求します。',
  '料金プランの変更は、お申し込みの翌月1日から適用されます。詳しくは<a href="@/procedures/change-plan.html">料金プランの変更</a>をご覧ください。',
  '0570から始まる番号（ナビダイヤル）、188などの特番への通話は有料で、無料通話の対象外です。',
]);

export const pages = {
  'plans/index.html': {
    title: '料金プラン比較', short: '料金プラン',
    lead: '料金プランは4種類。契約期間の縛りも解約金もありません。表示はすべて税込です。家族割・おうち割・U22割と組み合わせて、さらにおトクにご利用いただけます。',
    body: `
<div class="plan-cards">
${['mini', 'basic', 'unlimited', 'senior'].map((k) => `<div class="plan-card" style="--c:${COLORS[k]}"><h3>${NAME[k]}</h3><div class="price">${yenJ(P[k].price)}<small>/月</small></div><ul>${{
    mini: '<li>データ容量 3GB</li><li>メッセージや地図、ちょっとした調べもの中心の方に</li>',
    basic: '<li>データ容量 20GB</li><li>余ったデータは翌月にくりこし</li>',
    unlimited: `<li>データ使い放題</li><li>3GB以下の月は${yenJ(P.unlimited.price - P.unlimited.lowOff)}</li>`,
    senior: '<li>5GB＋1回10分以内の国内通話無料</li><li>65歳以上の方向け</li>',
  }[k]}</ul><a class="btn" href="@/plans/${k}.html">プランの詳細</a></div>`).join('')}
</div>
<h2 id="compare">プラン比較表</h2>
${table(['', '<span>クモ ミニ</span>', 'クモ ベーシック', 'クモ アンリミテッド', 'クモ 65+'], [
    ['月額料金', yenJ(P.mini.price), yenJ(P.basic.price), `${yenJ(P.unlimited.price)}<br><span class="small">3GB以下の月は${yenJ(P.unlimited.price - P.unlimited.lowOff)}</span>`, yenJ(P.senior.price)],
    ['月間データ容量', '3GB', '20GB', '無制限', '5GB'],
    ['データ容量を超えた後', `最大${P.mini.slow}`, `最大${P.basic.slow}`, '—', `最大${P.senior.slow}`],
    ['データ追加', `1GB ${yenJ(DATA.gb1)}／5GB ${yenJ(DATA.gb5)}`, `1GB ${yenJ(DATA.gb1)}／5GB ${yenJ(DATA.gb5)}`, '不要', `1GB ${yenJ(DATA.gb1)}／5GB ${yenJ(DATA.gb5)}`],
    ['余ったデータ', '月末で失効', '翌月にくりこし', '—', '月末で失効'],
    ['国内通話料', `30秒ごとに${yenJ(CALL.per30s)}`, `30秒ごとに${yenJ(CALL.per30s)}`, `30秒ごとに${yenJ(CALL.per30s)}`, '1回10分以内無料（超過分は30秒ごとに22円）'],
    ['通話オプション', 'クモ通話5分／クモ通話無制限', 'クモ通話5分／クモ通話無制限', 'クモ通話5分／クモ通話無制限', `65+向け通話無制限 ${yenJ(CALL.seniorUpgrade)}`],
    ['家族割（1回線あたり）', '割引対象外（回線数にはカウント）', `${yenJ(DISC.family.basic[0])}〜${yenJ(DISC.family.basic[2])}`, `${yenJ(DISC.family.unlimited[0])}〜${yenJ(DISC.family.unlimited[2])}`, `${yenJ(DISC.family.senior[0])}（2回線以上）`],
    ['おうち割（クモ光セット）', yenJ(DISC.home.mini), yenJ(DISC.home.basic), yenJ(DISC.home.unlimited), yenJ(DISC.home.senior)],
    ['U22割', '—', yenJ(DISC.u22.basic), yenJ(DISC.u22.unlimited), '—'],
    ['テザリング', '3GBに含む', '20GBに含む', `月${P.unlimited.tether}GBまで`, '5GBに含む'],
    ['海外ローミング無料（クモワールド）', '—', '—', `アジア・北米で月${P.unlimited.worldFree}GBまで`, '—'],
    ['お申し込みいただける方', 'どなたでも', 'どなたでも', 'どなたでも', '65歳以上の利用者'],
  ], { cls: 'compare' })}
${note('info', `<p>2026年12月1日より、クモ アンリミテッドの月額料金は<b>${yenJ(P.unlimited.newPrice)}</b>に改定します。<a href="@/news/price-revision-2026.html">お知らせを見る</a></p>`, '料金改定のお知らせ')}

<h2 id="chart">データ使用量に合ったプランは？</h2>
${figure(priceChart, 'クモ ミニ・クモ 65+・クモ ベーシックは、データ容量を超えた分を1GB単位（550円）で追加した場合の料金です。クモ アンリミテッドは3GB以下の月の割引（1,650円）を含みます。各種割引・通話オプションは含みません。クモ 65+は65歳以上の方のみお申し込みいただけます。')}
<p>割引なしの場合、3GBまではクモ ミニが最もおトクです。月のご利用が約7GBを超えると、データを追加したクモ ミニよりクモ ベーシックのほうが安くなり、約25GBを超えると、データを追加したクモ ベーシックよりクモ アンリミテッドのほうが安くなります（追加データを1GBずつ購入した場合）。5GBパックは1GBあたりの料金が割安なため、実際の境目は追加データの購入方法によって変わります。過去6か月の<a href="@/procedures/data-usage.html">データ使用量</a>はMy Kumoでご確認いただけます。</p>

<h2 id="family">家族割</h2>
<p>同じ家族グループの回線は、毎月の料金が割引になります。グループ内の音声回線が多いほど、対象回線1回線あたりの割引額が大きくなります。</p>
${table(['家族グループの回線数', 'クモ ベーシック', 'クモ アンリミテッド', 'クモ 65+', 'クモ ミニ'], [
    ['2回線', fam('basic', 0), fam('unlimited', 0), fam('senior', 0), '—'],
    ['3回線', fam('basic', 1), fam('unlimited', 1), fam('senior', 1), '—'],
    ['4〜10回線', fam('basic', 2), fam('unlimited', 2), fam('senior', 2), '—'],
  ], { caption: '家族割　1回線あたりの月額割引額' })}
<h3>適用条件</h3>
<ul class="fine">
<li>1つの家族グループに登録できる音声回線は最大${DISC.maxLines}回線です。対象は3親等以内のご親族（配偶者および自治体のパートナーシップ制度に登録されたパートナーを含む）、または同一住所にお住まいの方です。</li>
<li>回線数には、<b>クモ ミニの回線も含めてカウントします（クモ ミニ自体は割引対象外）</b>。データ専用回線、および料金未払いにより利用停止中の回線はカウントしません。</li>
<li>クモ 65+の回線は、グループの回線数にかかわらず${yenJ(DISC.family.senior[0])}の割引です。</li>
<li>割引は、グループ登録または回線追加の翌月分のご請求から適用されます。解約などで回線がグループから外れた場合、残りの回線の割引額は翌月から再計算されます。</li>
<li>姓または住所が異なる場合は、ご家族であることを確認できる書類（発行から3か月以内の戸籍謄本または住民票）が必要です。登録は、グループの代表者が<a href="@/my-kumo.html">My Kumo</a>またはショップでお手続きください。</li>
</ul>
<h3>料金例</h3>
<p>ご両親がクモ ベーシック、祖父母のおひとりがクモ 65+の3回線の場合：${yenJ(after('basic', 1))}＋${yenJ(after('basic', 1))}＋${yenJ(after('senior', 1))}＝3回線のプラン料金合計<b>${yenJ(after('basic', 1) * 2 + after('senior', 1))}</b>／月</p>

<h2 id="home-bundle">おうち割（クモ光セット）</h2>
<img class="photo" src="/assets/img/home-router.jpg" alt="棚に置かれた光回線ルーター">
<p>家族グループのどなたかが光回線「クモ光」（戸建て 月額${yenJ(OPT.hikari)}、マンション 月額${yenJ(OPT.hikariMansion)}）をご契約の場合、グループ内のすべての回線がさらに割引になります。</p>
${table(['料金プラン', '1回線あたりの月額割引額'], [['クモ ベーシック', yenJ(-DISC.home.basic)], ['クモ アンリミテッド', yenJ(-DISC.home.unlimited)], ['クモ ミニ', yenJ(-DISC.home.mini)], ['クモ 65+', yenJ(-DISC.home.senior)]])}
<ul class="fine">
<li>クモ光契約者の家族グループ内で最大${DISC.maxLines}回線まで。家族割・U22割と併用できます。</li>
<li>割引は、クモ光の開通月の翌月分のご請求から適用されます。クモ光を解約された場合は、その月のご請求分をもって割引終了となります。</li>
<li>クモ光は別契約となり、独自の利用規約が適用されます。工事費26,400円（24か月継続利用で実質無料。途中解約の場合は残額をご請求します）。</li>
</ul>

<h2 id="u22">U22割（22歳未満の方）</h2>
<p>22歳未満の方のご利用で、クモ ベーシックは毎月${yenJ(DISC.u22.basic)}、クモ アンリミテッドは毎月${yenJ(DISC.u22.unlimited)}を割引します。</p>
<ul class="fine">
<li>お申し込み日時点で、回線の<b>利用者</b>が22歳未満であることが条件です（ご契約者が保護者の場合も対象）。利用者の年齢を確認できる書類が必要です。</li>
<li>割引は、利用者が22歳の誕生日を迎える月のご請求分まで適用されます。</li>
<li>クモ ミニ・クモ 65+は対象外です。これらのプランに変更すると割引は終了し、元のプランに戻しても再適用されません。</li>
<li>家族割・おうち割（クモ光セット）と併用できます。</li>
<li>新規のお申し込み受付は2027年3月31日までです。</li>
</ul>
<h2>注意事項</h2>
${commonFine}`,
    related: ['plans/options.html', 'procedures/change-plan.html', 'procedures/data-usage.html', 'billing/fees.html'],
  },

  'plans/mini.html': {
    title: 'クモ ミニ（3GB）', short: 'クモ ミニ',
    lead: '最もお手頃な料金プラン。ご自宅ではWi-Fi中心で、外出先で少しだけデータを使う方におすすめです。',
    body: `
<dl class="spec"><div><dt>月額料金</dt><dd>${yenJ(P.mini.price)}</dd></div><div><dt>データ容量</dt><dd>3GB／月</dd></div><div><dt>通話料</dt><dd>${yenJ(CALL.per30s)}／30秒</dd></div></dl>
<h2>3GBを超えた場合</h2>
<p>当月のご利用が3GBに達すると、翌月1日まで通信速度が<b>最大${P.mini.slow}</b>になります。メッセージの送受信程度は可能ですが、ウェブページや地図の表示に時間がかかり、動画はスムーズに再生できません。データはMy Kumoからいつでも追加購入できます。</p>
${table(['追加データ', '料金', '有効期限'], [['1GB', yenJ(DATA.gb1), `購入日から${DATA.validDays}日間`], ['5GB', yenJ(DATA.gb5), `購入日から${DATA.validDays}日間`]])}
<p>追加データは、毎月の3GBを使い切った後に消費されます。データ容量の80％・100％に達した時点でSMSでお知らせします。</p>
<h2>月額料金の例</h2>
${table(['当月のデータ使用量', '追加したデータ', '月額合計（プラン料金＋追加データ）'], [
    ['2GB', 'なし', yenJ(P.mini.price)], ['3GB', 'なし', yenJ(P.mini.price)], ['4GB', '1GB', yenJ(P.mini.price + DATA.gb1)], ['5GB', '1GB×2回', yenJ(P.mini.price + 2 * DATA.gb1)], ['7GB', '1GB×4回', yenJ(P.mini.price + 4 * DATA.gb1)], ['8GB', '5GBパック', yenJ(P.mini.price + DATA.gb5)],
  ])}
${note('info', `<p>毎月5GB以上ご利用の場合は、<a href="@/plans/basic.html">クモ ベーシック</a>（${yenJ(P.basic.price)}）のほうがおトクになる可能性があります。プラン変更は月1回まで可能で、翌月1日から適用されます（容量の大きいプランへの変更は当日からの適用も選べます）。</p>`, 'データをもっと使う方は')}
<h2>割引</h2>
<ul>
<li><b>家族割：</b>クモ ミニの回線は割引対象外ですが、家族グループの回線数にはカウントされるため、ほかのご家族の割引額が増える場合があります。<a href="@/plans/index.html#family">詳しく見る</a></li>
<li><b>おうち割（クモ光セット）：</b>クモ光とのセットで毎月${yenJ(DISC.home.mini)}割引。<a href="@/plans/index.html#home-bundle">詳しく見る</a></li>
<li><b>U22割：</b>対象外です。</li>
</ul>
<h2>注意事項</h2>
${kome(['余ったデータの翌月くりこしはありません。', 'テザリングはご利用いただけます（3GBに含みます）。', 'クモワールドの24時間パスをご利用いただけます。<a href="@/plans/roaming.html">海外ローミング</a>をご覧ください。'])}${commonFine}`,
    related: ['plans/index.html', 'plans/basic.html', 'procedures/data-usage.html'],
  },

  'plans/basic.html': {
    title: 'クモ ベーシック（20GB）', short: 'クモ ベーシック',
    lead: 'いちばん人気の料金プラン。毎月20GB、使わなかったデータは翌月にくりこせます。',
    body: `
<img class="photo" src="/assets/img/hero-phones.jpg" alt="カフェのテーブルでスマートフォンを持つ3人の手元">
<dl class="spec"><div><dt>月額料金</dt><dd>${yenJ(P.basic.price)}</dd></div><div><dt>データ容量</dt><dd>20GB／月</dd></div><div><dt>20GB超過後</dt><dd>最大${P.basic.slow}</dd></div></dl>
<h2>データくりこし</h2>
<p>その月に使わなかったデータは、最大20GBまで翌月にくりこせます。くりこしたデータから先に消費され、くりこした月の月末で失効します（くりこしは1回のみです）。</p>
${table(['月', '基本容量', 'くりこし分', '使用量', '残り'], [['8月', '20GB', '0GB', '12GB', '8GB → 9月へくりこし'], ['9月', '20GB', '8GB', '25GB', '3GB → 10月へくりこし'], ['10月', '20GB', '3GB', '—', '—']], { caption: 'くりこしの例' })}
<p class="small">ご契約月の分はくりこしの対象外です。ほかのプランに変更すると、くりこし分は失効します。</p>
<h2>20GBを超えた場合</h2>
<p>通信速度が<b>最大${P.basic.slow}</b>になります。音楽ストリーミングや地図、低画質のビデオ通話であればご利用いただけます。追加データ：1GB ${yenJ(DATA.gb1)}、5GB ${yenJ(DATA.gb5)}（有効期限${DATA.validDays}日間）。</p>
<h2>割引適用後の料金</h2>
${table(['家族グループの回線数', 'ベーシックのみ', 'おうち割適用', 'おうち割＋U22割適用'], [1, 2, 3, 4].map((n) => {
    const f = n === 1 ? 0 : DISC.family.basic[Math.min(n, 4) - 2];
    return [n === 4 ? '4回線以上' : `${n}回線`, yenJ(P.basic.price - f), yenJ(P.basic.price - f - DISC.home.basic), yenJ(P.basic.price - f - DISC.home.basic - DISC.u22.basic)];
  }), { caption: 'クモ ベーシック1回線あたりの月額料金' })}
<p class="small">U22割は、利用者が22歳未満の回線のみが対象です。<a href="@/plans/index.html#u22">適用条件</a></p>
<h2>注意事項</h2>
${kome(['テザリングはご利用いただけます（データ容量に含みます）。', 'ネットワーク混雑時は、動画の画質を抑えて配信する場合があります。'])}${commonFine}`,
    related: ['plans/index.html', 'plans/unlimited.html', 'plans/options.html', 'procedures/change-plan.html'],
  },

  'plans/unlimited.html': {
    title: 'クモ アンリミテッド', short: 'クモ アンリミテッド',
    lead: '5G・4Gのデータが使い放題。あまり使わなかった月は自動で割引になります。',
    body: `
<dl class="spec"><div><dt>月額料金</dt><dd>${yenJ(P.unlimited.price)}</dd></div><div><dt>3GB以下の月</dt><dd>${yenJ(P.unlimited.price - P.unlimited.lowOff)}</dd></div><div><dt>データ容量</dt><dd>無制限</dd></div></dl>
${note('warn', `<p>2026年12月1日より、月額料金は<b>${yenJ(P.unlimited.newPrice)}</b>（3GB以下の月は${yenJ(P.unlimited.newPrice - P.unlimited.lowOff)}）に改定します。既にご契約中のお客さまも、2026年12月ご利用分（2027年1月ご請求分）から新料金となります。<a href="@/news/price-revision-2026.html">お知らせを見る</a></p>`, '料金改定のお知らせ')}
<h2>3GB以下の月の割引</h2>
<p>1か月（1日〜末日）のデータ使用量が${P.unlimited.lowGb}GB以下の場合、その月の料金から${yenJ(P.unlimited.lowOff)}を自動で割り引きます。お申し込みは不要です。テザリングや海外ローミングで使ったデータも3GBに含みます。</p>
<h2>テザリング</h2>
<p>ほかの機器とのデータ共有（テザリング）は<b>月${P.unlimited.tether}GBまで</b>ご利用いただけます。超過後は月末までテザリングの通信速度が最大300kbpsになります。スマートフォン本体でのデータ通信は引き続き無制限です。</p>
<h2>アジア・北米で海外ローミングが無料</h2>
<p>毎月、アジアおよび北米エリアでご利用のデータは最初の<b>${P.unlimited.worldFree}GB</b>まで無料。パスのご購入は不要です。${P.unlimited.worldFree}GBを超えた後は、クモワールドの24時間パスをご購入ください。<a href="@/plans/roaming.html">海外ローミング</a>をご覧ください。</p>
<h2>割引適用後の料金</h2>
${table(['家族グループの回線数', '通常の月', '通常の月＋おうち割', '3GB以下の月＋おうち割'], [1, 2, 3, 4].map((n) => {
    const f = n === 1 ? 0 : DISC.family.unlimited[Math.min(n, 4) - 2];
    return [n === 4 ? '4回線以上' : `${n}回線`, yenJ(P.unlimited.price - f), yenJ(P.unlimited.price - f - DISC.home.unlimited), yenJ(P.unlimited.price - f - DISC.home.unlimited - P.unlimited.lowOff)];
  }), { caption: 'クモ アンリミテッド1回線あたりの月額料金（現行料金）' })}
<p>22歳未満の方は、さらに${yenJ(DISC.u22.unlimited)}を割引します。<a href="@/plans/index.html#u22">適用条件</a></p>
<h2>注意事項</h2>
${kome(['すべてのお客さまに快適にご利用いただくため、短期間に大量のデータ通信をされたお客さま（例：3日間で150GB超）は、混雑時に通信速度を制限する場合があります。', '混雑時は動画の通信を最適化する場合があります。', '本プランではデータの追加購入はできません（必要ありません）。'])}${commonFine}`,
    related: ['plans/index.html', 'plans/roaming.html', 'news/price-revision-2026.html'],
  },

  'plans/senior.html': {
    title: 'クモ 65+（65歳以上の方向け）', short: 'クモ 65+',
    lead: 'データ5GB、1回10分以内の国内通話無料、見守りサービス付きのシンプルなプランです。',
    body: `
<img class="photo" src="/assets/img/senior-hands.jpg" alt="リビングでスマートフォンを持つ年配の方の手元">
<dl class="spec"><div><dt>月額料金</dt><dd>${yenJ(P.senior.price)}</dd></div><div><dt>データ容量</dt><dd>5GB／月</dd></div><div><dt>通話</dt><dd>1回10分以内無料</dd></div></dl>
<h2>お申し込みいただける方</h2>
<p>お申し込み日時点で、<b>利用者</b>が65歳以上であることが条件です。ご契約者は利用者ご本人以外でもかまいません（例：料金をお支払いになるお子さま）。利用者の生年月日が確認できる本人確認書類をお持ちください。ほかのプランからクモ 65+へ変更する場合も、あらためて利用者の年齢を確認します。</p>
<h2>プランの内容</h2>
<ul>
<li><b>1回10分以内の国内通話が無料。</b>10分を超えた分は30秒ごとに${yenJ(CALL.per30s)}です。月額${yenJ(CALL.seniorUpgrade)}で通話無制限（65+向け通話無制限）にできます。</li>
<li><b>データ容量5GB。</b>超過後は最大${P.senior.slow}になります。追加データ：1GB ${yenJ(DATA.gb1)}。</li>
<li><b>見守りサービス</b>（通常 月額${yenJ(OPT.watch)}）：スマートフォンが24時間操作されていない場合、最大3人のご家族に毎日お知らせします。2026年9月1日から無料で付いています。</li>
<li><b>紙の請求書発行手数料が無料。</b>通常かかる${yenJ(209)}の手数料はかかりません。</li>
<li><b>無料のスマホ教室</b>を多くのショップで開催しています（要予約）。<a href="@/shops/harukawa-central.html">クモショップ 春川中央店</a>をご覧ください。</li>
</ul>
<h2>割引</h2>
<ul>
<li>家族割：家族グループが2回線以上であれば毎月${yenJ(DISC.family.senior[0])}割引（回線数が増えても割引額は変わりません）。</li>
<li>おうち割（クモ光セット）：毎月${yenJ(DISC.home.senior)}割引。</li>
<li>U22割：対象外です。</li>
</ul>
<p>料金例：家族グループ3回線・クモ光ありの場合、クモ 65+の1回線は${yenJ(P.senior.price)}−${yenJ(DISC.family.senior[1])}−${yenJ(DISC.home.senior)}＝<b>${yenJ(P.senior.price - DISC.family.senior[1] - DISC.home.senior)}</b>／月です。</p>
<h2>注意事項</h2>
${kome(['0570番号への通話、国際電話、海外での通話は無料通話の対象外です。', '通話時間は1回ごとに計算します。12分間の通話の場合、2分間分（88円）の通話料がかかります。', '利用者を65歳未満の方に変更した場合、翌月から料金プランがクモ ベーシックに変更されます。'])}${commonFine}`,
    related: ['plans/index.html', 'plans/options.html', 'shops/harukawa-central.html', 'procedures/transfer.html'],
  },

  'plans/options.html': {
    title: 'オプション・クモ端末補償', short: 'オプション・端末補償',
    lead: 'どの料金プランにも追加できる通話オプション、データ追加、端末補償などのサービスです。',
    body: `
<div class="toc"><p>このページの内容</p><ol><li><a href="#calls">通話オプション</a></li><li><a href="#data">データ追加</a></li><li><a href="#care">クモ端末補償</a></li><li><a href="#other">そのほかのオプション</a></li></ol></div>
<h2 id="calls">通話オプション</h2>
${table(['オプション', '月額料金', '内容', '対象プラン'], [
    ['標準（オプションなし）', '0円', `国内通話 30秒ごとに${yenJ(CALL.per30s)}、SMS 1通${yenJ(CALL.sms)}`, '全プラン'],
    ['クモ通話5分', yenJ(CALL.talk5), '1回5分以内の国内通話が無料（超過分は30秒ごとに22円）', 'ミニ・ベーシック・アンリミテッド'],
    ['クモ通話無制限', yenJ(CALL.talkAll), '国内通話がすべて無料', 'ミニ・ベーシック・アンリミテッド'],
    ['65+向け通話無制限', yenJ(CALL.seniorUpgrade), '1回10分以内の無料通話を、時間無制限に変更', 'クモ 65+'],
  ])}
<p class="small">通話オプションは、お申し込み月は日割り、解約月は1か月分の料金がかかります。変更はお申し込み後すぐに反映されます。</p>
<h2 id="data">データ追加</h2>
${table(['パック', '料金', '有効期限', '対象プラン'], [['1GB', yenJ(DATA.gb1), `${DATA.validDays}日間`, 'ミニ・ベーシック・65+'], ['5GB', yenJ(DATA.gb5), `${DATA.validDays}日間`, 'ミニ・ベーシック・65+']])}
<p class="small">My Kumo（24時間）またはクモモバイルの携帯電話から1580に電話してお申し込みいただけます。追加データは、プランのデータ容量およびくりこし分を使い切った後に消費されます。使い切れなかった追加データの返金はできません。</p>
<h2 id="care">クモ端末補償</h2>
<img class="photo" src="/assets/img/cracked-screen.jpg" alt="修理マットの上に置かれた画面の割れたスマートフォン">
<p>破損・水濡れ・故障、さらにスタンダードとプレミアムでは紛失・盗難も補償します。</p>
${table(['', 'ライト', 'スタンダード', 'プレミアム'], [
    ['月額料金', yenJ(CARE[0].fee), yenJ(CARE[1].fee), yenJ(CARE[2].fee)],
    ['修理（1回あたりの負担金）', yenJ(CARE[0].repair), yenJ(CARE[1].repair), `1回目${yenJ(0)}、2回目以降${yenJ(CARE[2].repairNext)}`],
    ['紛失・盗難時の交換', '対象外', yenJ(CARE[1].replace), yenJ(CARE[2].replace)],
    ['ご利用回数（12か月あたり）', `${CARE[0].claims}回`, `${CARE[1].claims}回`, `${CARE[2].claims}回`],
    ['バッテリー交換', '—', '—', '加入から24か月以降に1回無料'],
    ['修理中の代替機', '無料', '無料', '無料'],
  ], { cls: 'compare' })}
<h3>ご加入条件</h3>
<ul class="fine">
<li>クモモバイルで端末をご購入の際、またはご購入日から14日以内にお申し込みください。後から加入することはできません。また、一度退会すると同じ端末で再加入することはできません。</li>
<li>他社で購入した端末をお持ち込みの場合は、開通日から14日以内にクモショップで端末の確認（無料）を受けたうえで、ライトまたはスタンダードにご加入いただけます。</li>
<li>販売価格が${yenJ(CARE_HIGH.over)}を超える端末は、各コースの月額料金に${yenJ(CARE_HIGH.add)}が加算されます。</li>
<li>紛失・盗難でのお申し込みには、警察に届け出た際の受理番号が必要です。使用に支障のない傷や外装のみの損傷は補償の対象外です。</li>
<li>12か月あたりのご利用回数は、最初にご利用された日から数えます。</li>
</ul>
<p>お申し込み方法は<a href="@/procedures/repair.html">修理・交換</a>をご覧ください。</p>
<h2 id="other">そのほかのオプション</h2>
${table(['オプション', '月額料金', '内容'], [
    ['見守りサービス', yenJ(OPT.watch), 'スマートフォンが24時間操作されていない場合に、最大3人のご家族にお知らせします。クモ 65+は無料。'],
    ['セキュリティパック', yenJ(OPT.security), '詐欺電話の警告、迷惑SMSフィルター、ウイルスチェック。初回31日間無料。'],
    ['番号保管サービス', yenJ(OPT.numberKeep), `回線を利用せずに電話番号だけを最大${OPT.numberKeepMonths}か月保管できます（海外赴任中など）。`],
    ['メール持ち運び', yenJ(OPT.mailKeep), '解約後も@kumo.ne.jpのメールアドレスを使い続けられます。'],
    ['クモ光（光回線）', `${yenJ(OPT.hikari)}（戸建て）／${yenJ(OPT.hikariMansion)}（マンション）`, 'ご家族の回線に<a href="@/plans/index.html#home-bundle">おうち割（クモ光セット）</a>が適用されます。'],
  ])}`,
    related: ['plans/index.html', 'procedures/repair.html', 'procedures/lost-phone.html', 'billing/fees.html'],
  },

  'plans/roaming.html': {
    title: '海外ローミング（クモワールド）', short: '海外ローミング',
    lead: '海外でも、いつものスマートフォンと電話番号がそのまま使えます。約180の国・地域で、24時間パスまたは従量制でご利用いただけます。',
    body: `
<img class="photo-wide" src="/assets/img/travel-roaming.jpg" alt="">
<h2>エリア別料金</h2>
${table(['エリア', '主な国・地域', '24時間パス', '現地での通話（1分）', '日本への通話（1分）', '着信（1分）', 'SMS送信'], ROAM.map((z) => [
    { asia: 'アジア', na: '北米', eu: 'ヨーロッパ', oc: 'オセアニア', mea: '中東・アフリカ', la: '中南米', sea: '船舶・航空機' }[z.id],
    { asia: '韓国、台湾、香港、マカオ、中国、タイ、ベトナム、シンガポール、フィリピン、マレーシア、インドネシア', na: 'アメリカ（ハワイ・グアム・サイパンを含む）、カナダ', eu: 'イギリス、フランス、ドイツ、イタリア、スペインほか32か国', oc: 'オーストラリア、ニュージーランド、フィジー', mea: 'アラブ首長国連邦、トルコ、エジプト、南アフリカほか18か国', la: 'メキシコ、ブラジル、ペルー、チリほか11か国', sea: '一部のクルーズ船・航空機' }[z.id],
    z.pass ? yenJ(z.pass) + (z.newPass ? `<br><span class="small">2026年12月1日から${yenJ(z.newPass)}</span>` : '') : 'ご利用不可',
    yenJ(z.local), yenJ(z.toJp), yenJ(z.recv), yenJ(z.sms),
  ]))}
<p class="small">SMSの受信は無料です。通話料は1分単位で計算します。各種割引の対象外です。</p>
<h2>クモワールド 24時間パス</h2>
<ul>
<li>購入後、最初にデータ通信をした時点から24時間（日本時間）ご利用いただけます。</li>
<li>1パスあたり高速データ通信は${ROAM_PASS.gb}GBまで。超過後はパスの終了まで最大${ROAM_PASS.slow}になります。</li>
<li>My KumoまたはMy Kumoアプリで、出発前でも到着後でもご購入いただけます。購入したエリア以外ではご利用になれません。</li>
<li>クモ アンリミテッドをご契約の方は、アジア・北米で毎月最初の${PLAN.unlimited.worldFree}GBまでパスなしで無料です。</li>
</ul>
<h2>パスを購入しない場合（従量制）</h2>
<p>データローミングがオンでパスをお持ちでない場合、データ通信料は1KBあたり${yenJ(ROAM_PASS.perKb)}です。1日（日本時間）あたりの上限額は次のとおりです。</p>
${table(['エリア', '1日の上限額'], [['アジア、北米、ヨーロッパ、オセアニア', yenJ(2980)], ['中東・アフリカ、中南米', yenJ(4980)], ['船舶・航空機', '上限なし']])}
${note('alert', '<p>船舶・航空機では1日の上限額がありません。1時間の動画視聴で10万円を超える場合もあります。乗船・搭乗中はデータローミングをオフにするか、機内モードをご利用ください。</p>', '船舶・航空機では上限額がありません')}
<h2>ご出発前に</h2>
<ol>
<li>My Kumoで国際ローミングが「利用する」になっているかご確認ください（2023年4月以降のご契約は初期設定で「利用する」です）。</li>
<li>パスを購入するまで、または従量制で使うと決めるまでは、スマートフォンのデータローミングを<b>オフ</b>にしておいてください。</li>
<li>海外からの紛失・盗難のご連絡先 <b>+81-3-6300-0110</b>（有料・24時間）を控えておいてください。</li>
<li>海外滞在中にかかってきた電話には、着信料がかかります。</li>
</ol>`,
    related: ['plans/unlimited.html', 'news/price-revision-2026.html', 'procedures/lost-phone.html', 'contact.html'],
  },
};
