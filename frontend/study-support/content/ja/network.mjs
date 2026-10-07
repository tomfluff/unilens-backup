// エリア・障害情報（日本語）
import { PREF, NATIONAL_5G, MUNI, SPEED, MONTHS, COLORS, TEL, table, note, figure, coverageMap, lineChart } from '../shared.mjs';

const speeds = lineChart({
  title: '平均ダウンロード速度（Mbps）', standalone: true,
  series: [{ name: '5G', color: COLORS.g5, pts: SPEED.g5.map((v, i) => [i, v]) }, { name: '4G', color: COLORS.g4, pts: SPEED.g4.map((v, i) => [i, v]) }],
  xMax: 11, xTicks: [...Array(12).keys()], xFmt: (i) => MONTHS.ja[i], yMax: 400, yStep: 100, yFmt: (v) => v,
  xTitle: '2025年10月〜2026年9月', note: '当社測定・全エリア・日次測定の中央値',
});
export const files = { 'assets/charts/speeds-ja.svg': speeds };

const MMW = { yes: 'あり（都市中心部）', sapporo: '札幌市のみ', sendai: '仙台市のみ', nagoya: '名古屋市のみ', harukawa: '春川中央駅周辺', kyoto: '京都市中心部', hiroshima: '広島市中心部', fukuoka: '福岡市・北九州市', naha: '那覇市のみ' };

export const pages = {
  'network.html': {
    title: 'サービスエリア・5G', short: 'サービスエリア・5G',
    lead: 'クモモバイルの5Gは全国の人口カバー率95.6%。みのり県のサービスエリアマップと、都道府県別の5Gエリアをご確認いただけます。',
    updated: 'エリアの数値は2026年9月30日時点のものです',
    body: `
<h2>サービスエリアマップ：みのり県</h2>
${figure(coverageMap({ title: 'クモモバイル みのり県サービスエリアマップ', harukawa: '春川', port: 'みのり港', onsen: '月見温泉', mikage: '御影', hanaoka: '花岡', shiose: '潮瀬', mountain: '月見山（1,214m）', bay: 'みのり湾', river: '鏡川', g5: '5G', planned: '5G（2027年3月までに提供予定）', g4: '4G', limited: 'つながりにくいエリア（山間部）', kagami: '春鉄 鏡線', bayside: '春鉄 湾岸線' }), '屋外のエリアです。屋内、地下、谷あいなどでは電波が弱くなる場合があります。マップは目安であり、サービスの提供を保証するものではありません。')}
<p>鏡線沿線では、春川中央駅から谷の中ほどまで5Gをご利用いただけます。月見温泉方面の区間は現在4Gで、2027年3月までの5G整備を予定しています。月見山の山頂付近と北東部の山間部では、4Gでもつながりにくい場合があります。</p>
<h2>みのり県の5Gエリア</h2>
${table(['市町村', '現在の5G人口カバー率', '目標（2027年3月）'], MUNI.map(([, ja, now, target]) => [ja, `${now.toFixed(1)}%`, `${target.toFixed(1)}%`]))}
<h2>都道府県別の5Gエリア</h2>
${table(['都道府県', '5G人口カバー率', '2025年9月からの増減', '5G基地局数', 'ミリ波（n257）'], [...PREF.map(([en, ja, cov, ch, sites, mm]) => Object.assign([ja, `${cov.toFixed(1)}%`, `+${ch.toFixed(1)}ポイント`, sites.toLocaleString('en-US'), mm ? MMW[mm] : '—'], en === 'Minori' ? { cls: 'hl' } : {})), Object.assign(['全国（47都道府県）', `${NATIONAL_5G}%`, '+2.4ポイント', '118,560', '—'], { cls: 'hl' })], { caption: '主な都道府県。人口カバー率は、屋外で5Gを利用できるエリアに住む人口の割合です。' })}
<h2>通信速度</h2>
<figure class="fig"><img src="/assets/charts/speeds-ja.svg" alt="グラフ" width="680" height="330"></figure>
<p>通信速度は、エリア、時間帯、ご利用の機種、接続している人数などによって変わります。2026年3月は春の引っ越しシーズン、2026年7月は夏のイベントの影響で低下しました。</p>
<h2>周波数帯</h2>
${table(['ネットワーク', 'バンド', '備考'], [['5G', 'n77・n78（Sub6）、n257（ミリ波）', 'ミリ波はアンテナの近くで見通しのよい場所でのみ利用できます'], ['4G LTE', 'バンド1・3・8・28', 'バンド8・28は遠くまで届き、建物の中でもつながりやすい周波数です'], ['3G', 'バンド1', '<b>2027年3月31日に終了します。</b><a href="@/news/3g-service-end.html">詳しくはこちら</a>']])}
${note('info', `<p>ご自宅や職場で電波が弱いときは、My Kumo（サポート → 電波のご相談）からお知らせいただくか、テクニカルサポート（${TEL.tech.free}、${TEL.tech.hours[0]}:00〜${TEL.tech.hours[1]}:00）へお電話ください。無料で電波の測定に伺う場合があります。</p>`)}`,
    related: ['status.html', 'news/3g-service-end.html', 'plans/unlimited.html'],
  },

  'status.html': {
    title: '障害・メンテナンス情報', short: '障害・メンテナンス情報',
    lead: '現在発生している通信障害と、予定しているメンテナンスをお知らせします。',
    updated: '最終更新：2026年10月4日（日）10:15',
    body: `
<div class="status-strip"><span><span class="dot dot-bad"></span>みのり県で<b>障害1件</b></span><span><span class="dot dot-warn"></span>My Kumoアプリで<b>不具合1件</b></span><span><span class="dot dot-ok"></span>その他のサービスは正常です</span></div>
<h2>発生中の障害</h2>
${table(['発生日時', 'エリア', '影響のあるサービス', '詳細', '状況'], [
    ['2026年10月4日 8:52', 'みのり県 春川市（駅前通、北町、春川中央駅周辺）', '5Gのデータ通信', '5Gでのデータ通信が遅い、またはつながりにくい状況です。4Gのデータ通信、通話、SMSには影響ありません。お使いの機種で5Gをオフにすると改善する場合があります。', '<span class="st st-inv">調査中</span>'],
    ['2026年10月3日 21:10', '全国', 'My Kumoアプリ（Android）', '一部のAndroidをご利用のお客さまが、My Kumoアプリ（バージョン8.4.0）にログインできない事象が発生しています。Web版のMy Kumoをご利用ください。', '<span class="st st-fix">対応中</span>'],
  ])}
<h2>過去7日間に復旧した障害</h2>
${table(['期間', 'エリア', '影響のあったサービス', '原因'], [
    ['2026年9月30日 14:05〜16:40', 'みのり県 月見町の一部', '通話・SMS・データ通信', '大雨による基地局の停電'],
    ['2026年9月28日 2:10〜3:00', '全国', 'SMSの配信遅延', '設備の故障'],
    ['2026年9月27日 11:30〜12:15', '北海道 札幌市の一部', '5Gのデータ通信', '設備の故障'],
  ])}
<h2 id="maintenance">メンテナンス予定</h2>
${table(['日時', 'エリア', '影響のあるサービス', '詳細'], [
    ['2026年10月8日（木）1:00〜6:00', '全国', 'My Kumo（Web・アプリ）', '回線の一時停止、データの追加購入、ご請求額の確認を含む、すべてのオンライン手続きがご利用いただけません。携帯電話を紛失した場合は、紛失・盗難窓口へお電話ください。'],
    ['2026年10月14日（水）1:00〜5:00', 'みのり県 月見町・潮瀬村', '通話・SMS・データ通信（5G・4G）', '1回あたり最大10分程度、サービスが停止する場合があります。<b>停止中は緊急通報もご利用いただけない場合があります。</b>'],
    ['2026年10月21日（水）2:00〜4:00', '全国', 'SMS', 'メッセージの配信が遅れる場合があります。'],
    ['2026年10月27日（火）0:30〜5:30', 'みのり県 鏡線沿線（春川市〜月見町）', 'データ通信（5G）', '5Gエリア拡大のための基地局工事です。数分間、5Gが4Gに切り替わる場合があります。'],
    ['2026年11月5日（木）0:00〜3:00', '全国', 'My Kumoでのカード払い', 'My Kumoでのクレジットカードによるお支払いがご利用いただけません。'],
  ])}
<p>あわせてご確認ください：<a href="@/news/maintenance-october-2026.html">2026年10月のメンテナンスについて</a></p>
${note('info', `<p>障害情報がないのに電波がつながらない場合は、携帯電話を再起動し、<a href="@/procedures/sim-card.html">つながらないときの確認方法</a>をお試しください。それでも解決しない場合は、テクニカルサポート（${TEL.tech.free}）へお問い合わせください。</p>`)}`,
    related: ['network.html', 'news/maintenance-october-2026.html', 'contact.html'],
  },
};
