// Shared data for The Springvale Herald / 春川日報: everything that is the same in both
// languages (ids, dates, sections, numbers) plus the per-language labels of tables and charts.
// Article text lives in content/articles/<id>.<lang>.md; page text in content/pages.mjs.

export const NOW = '2026-10-04T18:00'; // the site's "now": Sunday 4 October 2026, evening

export const sections = [
  { id: 'local', en: 'Local', ja: '地域' },
  { id: 'politics', en: 'Politics', ja: '政治' },
  { id: 'business', en: 'Business', ja: '経済' },
  { id: 'science', en: 'Science & Tech', ja: '科学・技術' },
  { id: 'health', en: 'Health', ja: '健康・医療' },
  { id: 'sports', en: 'Sports', ja: 'スポーツ' },
  { id: 'culture', en: 'Culture', ja: '文化' },
  { id: 'opinion', en: 'Opinion', ja: 'オピニオン' },
  { id: 'weather', en: 'Weather', ja: '天気' },
];

export const tags = {
  'lantern-festival': { en: 'Lantern Festival', ja: '春川灯籠まつり' },
  'typhoon-21': { en: 'Typhoon No. 21', ja: '台風21号' },
  'kagami-river': { en: 'Mirror River', ja: '鏡川' },
  harutetsu: { en: 'Springvale Railway', ja: '春川鉄道' },
  transport: { en: 'Transport', ja: '交通' },
  'election-2026': { en: 'Mayoral election 2026', ja: '春川市長選2026' },
  'city-budget': { en: 'City budget', ja: '市の予算' },
  'city-council': { en: 'City council', ja: '市議会' },
  library: { en: 'Libraries', ja: '図書館' },
  'harukawa-ware': { en: 'Springvale ware', ja: '春川焼' },
  'minori-port': { en: 'Ferry Port', ja: 'みのり港' },
  'kumo-mobile': { en: 'Kumo Mobile', ja: 'クモモバイル' },
  'harukawa-university': { en: 'Springvale University', ja: '春川大学' },
  'minori-bay': { en: 'Harvest Bay', ja: 'みのり湾' },
  seagulls: { en: 'Springvale Seagulls', ja: '春川シーガルズ' },
  vaccination: { en: 'Vaccination', ja: '予防接種' },
  children: { en: 'Children', ja: '子ども' },
  'disaster-prevention': { en: 'Disaster prevention', ja: '防災' },
  'cost-of-living': { en: 'Cost of living', ja: '暮らしと家計' },
  museums: { en: 'Museums', ja: '美術館・博物館' },
  corrections: { en: 'Corrections', ja: '訂正' },
};

export const authors = {
  fujisawa: { en: 'Mariko Fujisawa', ja: '藤沢真理子', role: { en: 'City affairs reporter', ja: '市政担当' } },
  ogawa: { en: 'Kenta Ogawa', ja: '小川健太', role: { en: 'Politics reporter', ja: '政治担当' } },
  hamada: { en: 'Yui Hamada', ja: '浜田結衣', role: { en: 'Business and transport reporter', ja: '経済部' } },
  mizuno: { en: 'Daisuke Mizuno', ja: '水野大輔', role: { en: 'Science and health reporter', ja: '科学・医療担当' } },
  kondo: { en: 'Takeshi Kondo', ja: '近藤剛', role: { en: 'Sports reporter', ja: '運動部' } },
  ueno: { en: 'Haruka Ueno', ja: '上野遥', role: { en: 'Arts writer', ja: '文化部' } },
  murata: { en: 'Keiko Murata', ja: '村田恵子', role: { en: 'Columnist', ja: 'コラムニスト' } },
  arima: { en: 'Shota Arima', ja: '有馬翔太', role: { en: 'Weather and disaster desk', ja: '防災・気象担当' } },
  editorial: { en: 'Editorial board', ja: '論説委員会', role: { en: 'The Springvale Herald', ja: '春川日報' } },
  hayakawa: { en: 'Tomoko Hayakawa', ja: '早川知子', role: { en: 'Guest writer, retired school librarian', ja: '寄稿・元学校司書' } },
  desk: { en: 'Herald staff', ja: '春川日報', role: { en: 'News desk', ja: '編集局' } },
};

export const credits = {
  kanda: { en: 'Ryo Kanda / The Springvale Herald', ja: '神田亮撮影' },
  morishita: { en: 'Aya Morishita / The Springvale Herald', ja: '森下彩撮影' },
  city: { en: 'Springvale City', ja: '春川市提供' },
  univ: { en: 'Springvale University', ja: '春川大学提供' },
  file: { en: 'File photo / The Springvale Herald', ja: '資料写真' },
};

// Articles. Dates are JST. `image` is a file in assets/img (without .jpg).
export const articles = [
  { id: 'festival-road-closures', section: 'local', tags: ['lantern-festival', 'transport', 'kagami-river'], date: '2026-10-02T18:05', updated: '2026-10-03T09:40', author: 'fujisawa', image: 'lanterns-street', credit: 'kanda', comments: true, related: ['lantern-workshop', 'crowd-sensors', 'typhoon-live', 'railway-timetable'] },
  { id: 'lantern-workshop', section: 'culture', tags: ['lantern-festival'], date: '2026-09-30T07:00', author: 'ueno', image: 'lantern-workshop', credit: 'morishita', related: ['festival-road-closures', 'crowd-sensors', 'museum-review'] },
  { id: 'crowd-sensors', section: 'science', tags: ['lantern-festival', 'harukawa-university'], date: '2026-10-03T11:30', author: 'mizuno', image: 'lamp-sensor', credit: 'morishita', related: ['festival-road-closures', 'city-budget', 'seagrass-research'] },
  { id: 'embankment-works', section: 'local', tags: ['kagami-river', 'disaster-prevention'], date: '2026-09-24T17:20', author: 'fujisawa', image: 'river-works', credit: 'kanda', related: ['editorial-embankment', 'typhoon-live', 'castle-marathon', 'city-budget'] },
  { id: 'railway-timetable', section: 'local', tags: ['harutetsu', 'transport'], date: '2026-09-29T15:00', author: 'hamada', image: 'train-bridge', credit: 'morishita', comments: true, related: ['column-timetable', 'festival-road-closures', 'mayoral-election-poll'] },
  { id: 'central-library', section: 'local', tags: ['library'], date: '2026-09-26T12:00', updated: '2026-09-28T10:30', author: 'fujisawa', image: 'library-interior', credit: 'city', comments: true, related: ['column-library', 'city-budget', 'correction-library-date'] },
  { id: 'city-budget', section: 'politics', tags: ['city-budget', 'city-council', 'library'], date: '2026-10-01T06:30', author: 'ogawa', image: 'council-chamber', credit: 'kanda', comments: true, related: ['water-rates', 'central-library', 'embankment-works', 'mayoral-election-poll'] },
  { id: 'mayoral-election-poll', section: 'politics', tags: ['election-2026'], date: '2026-09-30T06:00', updated: '2026-09-30T19:20', author: 'ogawa', image: 'city-hall', credit: 'morishita', comments: true, related: ['city-budget', 'column-timetable', 'editorial-embankment'] },
  { id: 'water-rates', section: 'politics', tags: ['city-council', 'cost-of-living'], date: '2026-09-22T16:45', author: 'ogawa', image: 'water-main', credit: 'kanda', comments: true, related: ['city-budget', 'kumo-mobile-prices'] },
  { id: 'kumo-mobile-prices', section: 'business', tags: ['kumo-mobile', 'cost-of-living'], date: '2026-10-02T16:30', author: 'hamada', image: 'smartphones', credit: 'morishita', comments: true, related: ['water-rates', 'port-cargo'] },
  { id: 'harukawa-ware-exports', section: 'business', tags: ['harukawa-ware'], date: '2026-09-28T06:00', author: 'hamada', image: 'pottery', credit: 'kanda', paywall: true, related: ['museum-review', 'port-cargo'] },
  { id: 'port-cargo', section: 'business', tags: ['minori-port'], date: '2026-10-01T16:30', author: 'hamada', image: 'port-cranes', credit: 'kanda', paywall: true, related: ['harukawa-ware-exports', 'kumo-mobile-prices'] },
  { id: 'seagrass-research', section: 'science', tags: ['harukawa-university', 'minori-bay'], date: '2026-09-23T10:00', author: 'mizuno', image: 'seagrass', credit: 'univ', related: ['crowd-sensors', 'port-cargo'] },
  { id: 'flu-vaccination', section: 'health', tags: ['vaccination', 'children'], date: '2026-09-25T11:00', updated: '2026-09-26T09:00', author: 'mizuno', image: 'vaccine', credit: 'morishita', related: ['pediatric-night-clinic'] },
  { id: 'pediatric-night-clinic', section: 'health', tags: ['children'], date: '2026-09-21T09:30', author: 'mizuno', image: 'clinic-night', credit: 'kanda', related: ['flu-vaccination'] },
  { id: 'seagulls-clinch', section: 'sports', tags: ['seagulls'], date: '2026-10-04T00:40', updated: '2026-10-04T11:20', author: 'kondo', image: 'baseball-night', credit: 'kanda', comments: true, related: ['castle-marathon', 'typhoon-live'] },
  { id: 'castle-marathon', section: 'sports', tags: ['kagami-river'], date: '2026-09-22T13:00', author: 'kondo', image: 'runners', credit: 'file', related: ['embankment-works', 'seagulls-clinch'] },
  { id: 'museum-review', section: 'culture', tags: ['harukawa-ware', 'museums'], date: '2026-09-27T08:00', author: 'ueno', image: 'museum', credit: 'morishita', related: ['harukawa-ware-exports', 'lantern-workshop'] },
  { id: 'typhoon-forecast', section: 'weather', tags: ['typhoon-21', 'disaster-prevention'], date: '2026-10-03T16:20', author: 'arima', image: 'bay-storm', credit: 'kanda', related: ['typhoon-live', 'embankment-works', 'festival-road-closures'] },
  { id: 'editorial-embankment', section: 'opinion', tags: ['kagami-river', 'disaster-prevention', 'election-2026'], date: '2026-10-03T06:00', author: 'editorial', image: 'riverside-path', credit: 'morishita', kind: 'editorial', related: ['embankment-works', 'typhoon-forecast', 'city-budget'] },
  { id: 'column-timetable', section: 'opinion', tags: ['harutetsu', 'transport'], date: '2026-09-30T06:00', author: 'murata', image: 'train-bridge', credit: 'file', paywall: true, kind: 'column', related: ['railway-timetable', 'mayoral-election-poll'] },
  { id: 'column-library', section: 'opinion', tags: ['library'], date: '2026-09-27T06:00', author: 'hayakawa', image: 'library-interior', credit: 'city', kind: 'column', related: ['central-library', 'city-budget'] },
  { id: 'correction-library-date', section: 'local', tags: ['corrections', 'library'], date: '2026-09-28T10:30', author: 'desk', kind: 'correction', related: ['central-library'] },
];

// The live blog (content/live.<lang>.md). Listed with the articles under Weather and Local.
export const live = { id: 'typhoon-live', section: 'weather', tags: ['typhoon-21', 'disaster-prevention', 'harutetsu', 'transport'], date: '2026-10-03T21:00', updated: '2026-10-04T17:45', author: 'arima', image: 'sandbags', credit: 'kanda', url: 'live/typhoon-21.html' };

export const mostRead = ['typhoon-live', 'festival-road-closures', 'typhoon-forecast', 'kumo-mobile-prices', 'railway-timetable', 'city-budget', 'central-library', 'mayoral-election-poll', 'seagulls-clinch', 'water-rates'];
export const mostCommented = ['railway-timetable', 'city-budget', 'kumo-mobile-prices', 'festival-road-closures', 'water-rates', 'mayoral-election-poll'];

// Corrections log (newest first). The same notes appear at the foot of each corrected article.
export const corrections = [
  { date: '2026-10-03T09:40', article: 'festival-road-closures',
    en: 'An earlier version of this article said Nishiki Bridge would be closed to vehicles from 17:00 to 22:00 on both festival days. The closure runs from 16:00 to 22:00.',
    ja: '当初の記事で、錦橋の車両通行止めを両日とも「午後5時〜10時」としていましたが、正しくは「午後4時〜10時」です。' },
  { date: '2026-09-30T19:20', article: 'mayoral-election-poll',
    en: 'An earlier version of this article gave the number of respondents to the Herald poll as 1,102. The correct figure is 1,012.',
    ja: '当初の記事で、本紙世論調査の回答者数を「1,102人」としていましたが、正しくは「1,012人」です。' },
  { date: '2026-09-28T10:30', article: 'central-library',
    en: 'An earlier version of this article said the new Central Library would open on 3 November. It opens on Saturday 7 November 2026.',
    ja: '当初の記事で、新しい中央図書館の開館日を「11月3日」としていましたが、正しくは「11月7日（土）」です。' },
  { date: '2026-09-26T09:00', article: 'flu-vaccination',
    en: 'An earlier version of this article said residents aged 65 and over would pay ¥1,200 for a flu vaccination. The charge is ¥1,500.',
    ja: '当初の記事で、65歳以上の方のインフルエンザ予防接種の自己負担額を「1,200円」としていましたが、正しくは「1,500円」です。' },
];

// ---------------------------------------------------------------------------------------------
// Tables. Each has an English and a Japanese version with the same numbers.
export const tables = {
  closures: {
    en: { caption: 'Road closures for the 68th Springvale Lantern Festival, Saturday 10 and Sunday 11 October (numbers match the map)', head: ['No.', 'Road', 'Section', 'Saturday 10 October', 'Sunday 11 October', 'Notes'], rows: [
      ['1', 'Riverside Avenue', 'Nishiki Bridge – Asahi Bridge (1.3 km)', '14:00–23:00', '14:00–23:00', 'All vehicles, including bicycles; stalls open from 16:00'],
      ['2', 'Nishiki Bridge', 'Whole bridge', '16:00–22:00', '16:00–22:00', 'Pedestrians only; one-way walking (north to south) from 19:00 to 21:00 during the lantern floating'],
      ['3', 'Komachi-dori', 'Castle Park east gate – Springvale Central North Exit (650 m)', '12:00–22:00', '12:00–22:00', 'Pedestrians only; deliveries before 11:30'],
      ['4', 'Asahi Bridge', 'Whole bridge', '15:00–23:00', '15:00–23:00', 'One lane, northbound only'],
      ['5', 'Otemachi-dori', 'Castle Park south gate – Nishiki Bridge', '17:30–21:00', '17:30–21:00', 'Lantern procession, 18:00–20:30'],
      ['6', 'Castle Town Station front', 'Station square (River Exit) – Riverside Avenue', '17:00–22:00', '17:00–22:00', 'Station entry may be restricted 18:00–21:30 (Vale Rail)'],
    ], note: 'City buses on routes 3, 5 and 12 are diverted from 14:00 to 23:00 on both days. Source: Springvale Lantern Festival Executive Committee, Springvale Central Police Station.' },
    ja: { caption: '第68回春川灯籠まつり（10月10日・11日）の交通規制（番号は地図と対応）', head: ['番号', '道路', '区間', '10月10日（土）', '10月11日（日）', '備考'], rows: [
      ['1', '川端通り', '錦橋〜朝日橋（1.3キロ）', '14:00〜23:00', '14:00〜23:00', '自転車を含む全車両通行止め。露店は16時から'],
      ['2', '錦橋', '全線', '16:00〜22:00', '16:00〜22:00', '歩行者専用。灯籠流しの19:00〜21:00は北→南の一方通行'],
      ['3', '小町通り', '城址公園東門〜春川中央駅北口（650メートル）', '12:00〜22:00', '12:00〜22:00', '歩行者天国。荷さばきは11:30まで'],
      ['4', '朝日橋', '全線', '15:00〜23:00', '15:00〜23:00', '北行き1車線のみ通行可'],
      ['5', '大手町通り', '城址公園南門〜錦橋', '17:30〜21:00', '17:30〜21:00', '灯籠行列（18:00〜20:30）'],
      ['6', '城町駅前', '駅前広場（川口）〜川端通り', '17:00〜22:00', '17:00〜22:00', '18:00〜21:30は駅の入場規制の可能性（春川鉄道）'],
    ], note: '市営バス3・5・12系統は両日とも14:00〜23:00に迂回運行。出典：春川灯籠まつり実行委員会、春川中央警察署' },
  },
  'railway-changes': {
    en: { caption: 'Vale Rail timetable revision on Saturday 14 November 2026: what changes', head: ['Item', 'Until Fri 13 November', 'From Sat 14 November'], rows: [
      ['Comet stops', 'Castle Town, Clayfield, Red Canyon', 'Also Trailhead (all trains). Springvale Central – Moonview Spa 41 min'],
      ['Comet 1 (weekdays)', 'Springvale Central 7:30 → Moonview Spa 8:09', '7:25 → 8:06'],
      ['Last train from Moonview Spa, Sat/Sun/holidays', '21:05 (Springvale Central 22:08)', '21:40 (Springvale Central 22:43)'],
      ['Last train from Moonview Spa, weekdays', '21:40 (Springvale Central 22:43)', 'No change'],
      ['Last northbound train from Springvale Central, weekdays', '23:20 for Clayfield', '23:20 for Red Canyon (arr. 23:59)'],
      ['Rapid stops', 'Does not stop at Riverside', 'Stops at Riverside (1 min longer)'],
      ['Bayside Line, weekdays 10:00–16:40', 'Every 20 min', 'Every 15 min'],
      ['Bayside Line last eastbound, Sat/Sun/holidays', '23:00 for Ferry Port; 23:35 for Rose Garden', '23:35 runs through to Ferry Port (arr. 0:03)'],
    ], note: 'Fares, Comet surcharges and pass prices do not change. Source: Springvale Railway (Vale Rail), announcement of 29 September 2026.' },
    ja: { caption: '春川鉄道ダイヤ改正（2026年11月14日〈土〉）の主な変更点', head: ['項目', '11月13日（金）まで', '11月14日（土）から'], rows: [
      ['「月影」の停車駅', '城町・釜野・鏡峡', '月見口にも全列車停車。春川中央〜月見温泉 41分'],
      ['「月影」1号（平日）', '春川中央7:30発 → 月見温泉8:09着', '7:25発 → 8:06着'],
      ['月見温泉発の最終列車（土曜・休日）', '21:05発（春川中央22:08着）', '21:40発（春川中央22:43着）'],
      ['月見温泉発の最終列車（平日）', '21:40発（春川中央22:43着）', '変更なし'],
      ['春川中央発 下り最終列車（平日）', '23:20発 釜野行', '23:20発 鏡峡行（23:59着）'],
      ['快速の停車駅', '川端は通過', '川端に停車（所要1分増）'],
      ['湾岸線 平日10:00〜16:40', '20分間隔', '15分間隔'],
      ['湾岸線 下り最終（土曜・休日）', '23:00発 みのり港行、23:35発 みのり公園行', '23:35発をみのり港まで延長（0:03着）'],
    ], note: '運賃、「月影」の特急料金、各種きっぷの価格は変わらない。出典：春川鉄道（2026年9月29日発表）' },
  },
  'library-hours': {
    en: { caption: 'Springvale Central Library: opening hours from 7 November 2026', head: ['Day', 'Hours'], rows: [
      ['Tuesday – Friday', '9:00–21:00'],
      ['Saturday, Sunday and national holidays', '9:00–19:00'],
      ['Monday', 'Closed (open when Monday is a national holiday; closed the next weekday instead)'],
      ['Last Thursday of the month', 'Closed for stock-taking (from December 2026)'],
      ['29 December – 3 January', 'Closed'],
      ['Book return box (east entrance)', '24 hours'],
    ], note: 'Café on the ground floor: 8:30–20:00. Source: Springvale City Board of Education.' },
    ja: { caption: '春川市立中央図書館の開館時間（2026年11月7日から）', head: ['曜日', '開館時間'], rows: [
      ['火〜金曜日', '9:00〜21:00'],
      ['土・日曜日、祝日', '9:00〜19:00'],
      ['月曜日', '休館（祝日の場合は開館し、翌平日に休館）'],
      ['毎月最終木曜日', '館内整理日のため休館（2026年12月から）'],
      ['12月29日〜1月3日', '休館'],
      ['返却ポスト（東口）', '24時間'],
    ], note: '1階カフェは8:30〜20:00。出典：春川市教育委員会' },
  },
  'budget-supplementary': {
    en: { caption: 'September supplementary budget, approved 30 September 2026', head: ['Item', 'Amount', 'Notes'], rows: [
      ['Shimo-Kawabata drainage pump station (design and first works)', '¥1.1 billion', 'Pumps of 12 m³ per second; completion in fiscal 2028'],
      ['Air conditioning for 21 school gymnasiums used as shelters', '¥0.9 billion', 'Installed by July 2027'],
      ['Opening of the new Central Library (books, IT, moving)', '¥0.6 billion', 'Library opens 7 November'],
      ['Energy price support for small businesses', '¥0.5 billion', 'Up to ¥200,000 per business'],
      ['Lantern Festival safety (crowd sensors, stewards, first aid)', '¥0.3 billion', 'Includes the ¥38 million crowd-sensor trial'],
      ['Total', '¥3.4 billion', 'General account after revision: ¥199.6 billion'],
    ], note: 'Source: Springvale City Finance Division.' },
    ja: { caption: '9月補正予算（2026年9月30日可決）', head: ['事業', '金額', '備考'], rows: [
      ['下川端排水ポンプ場（設計・初年度工事）', '11億円', '排水能力毎秒12立方メートル、2028年度完成'],
      ['避難所となる学校体育館21校の空調整備', '9億円', '2027年7月までに設置'],
      ['新中央図書館の開館準備（図書・情報システム・移転）', '6億円', '11月7日開館'],
      ['中小事業者向けエネルギー価格支援', '5億円', '1事業者あたり最大20万円'],
      ['灯籠まつりの安全対策（人流センサー・警備・救護）', '3億円', '人流センサー実証3,800万円を含む'],
      ['合計', '34億円', '補正後の一般会計は1,996億円'],
    ], note: '出典：春川市財政課' },
  },
  candidates: {
    en: { caption: 'Candidates in the Springvale mayoral election, 8 November 2026 (in order of announcement)', head: ['Candidate', 'Age', 'Background', 'Support', 'Main pledges'], rows: [
      ['Takuya Hirose', '63', 'Mayor since 2018 (two terms); city official for 28 years before that', 'Independent; backed by the Civic Club and Mirai Springvale council groups', 'Finish the embankment and the Shimo-Kawabata pump station; open the new library; bring investment to Ferry Port'],
      ['Michiko Sawada', '55', 'Member of the Harvest Prefectural Assembly 2011–2023 (three terms)', 'Independent; backed by the Mirror Citizens\' Network', 'Half-price RideCard fares for residents aged 70 and over, paid by the city; free school lunches; review the water rate rise'],
      ['Ryo Onodera', '42', 'Former manager at a software company; first-time candidate', 'Independent; no organised backing', 'All city procedures online by 2028; cut the mayor\'s pay by 30%; revive the old town'],
    ], note: 'Official campaign: 1–7 November. Early voting: 2–7 November at City Hall and five branch offices.' },
    ja: { caption: '春川市長選（2026年11月8日投開票）の立候補予定者（表明順）', head: ['氏名', '年齢', '経歴', '支援', '主な公約'], rows: [
      ['広瀬拓也', '63', '2018年から市長（2期）。それ以前は市職員を28年', '無所属。市議会会派「市政クラブ」「みらい春川」が支援', '堤防強化と下川端ポンプ場の完成、新図書館の開館、みのり港への投資誘致'],
      ['沢田美智子', '55', 'みのり県議を2011〜2023年に3期', '無所属。「鏡市民ネット」が支援', '70歳以上の市民のハルカ運賃を市の負担で半額に、学校給食の無償化、水道料金値上げの見直し'],
      ['小野寺亮', '42', 'ソフトウェア会社の元管理職。初挑戦', '無所属。組織的な支援なし', '2028年までに市の手続きをすべてオンライン化、市長給与3割削減、旧市街の再生'],
    ], note: '告示は11月1日、期日前投票は11月2〜7日（市役所と5支所）' },
  },
  'water-bills': {
    en: { caption: 'Water and sewerage bill for two months, before and after the rise (tax included)', head: ['Household (use per two months)', 'Now', 'From April 2027', 'Change'], rows: [
      ['Single person (10 m³)', '¥3,410', '¥3,630', '+¥220 (+6.5%)'],
      ['Two people (20 m³)', '¥5,830', '¥6,325', '+¥495 (+8.5%)'],
      ['Four people (40 m³)', '¥10,450', '¥11,380', '+¥930 (+8.9%)'],
      ['Small shop (100 m³)', '¥27,940', '¥30,690', '+¥2,750 (+9.8%)'],
    ], note: 'Average rise across all users: 8.5%. Households receiving public assistance remain exempt from the basic charge. Source: Springvale City Waterworks Bureau.' },
    ja: { caption: '上下水道料金（2カ月分・税込み）の改定前後の比較', head: ['世帯（2カ月の使用量）', '現行', '2027年4月から', '増額'], rows: [
      ['単身（10立方メートル）', '3,410円', '3,630円', '+220円（+6.5%）'],
      ['2人（20立方メートル）', '5,830円', '6,325円', '+495円（+8.5%）'],
      ['4人（40立方メートル）', '10,450円', '11,380円', '+930円（+8.9%）'],
      ['小規模店舗（100立方メートル）', '27,940円', '30,690円', '+2,750円（+9.8%）'],
    ], note: '全体の平均改定率は8.5%。生活保護世帯の基本料金免除は継続。出典：春川市水道局' },
  },
  'kumo-plans': {
    en: { caption: 'Kumo Mobile monthly prices, now and from 1 December 2026 (tax included)', head: ['Plan or option', 'Data', 'Now', 'From 1 December', 'Change'], rows: [
      ['Kumo Unlimited', 'Unlimited', '¥7,238', '¥7,458', '+¥220'],
      ['Kumo Unlimited in a month of 3 GB or less', '—', '¥5,588', '¥5,808', '+¥220'],
      ['Kumo World day pass: Asia', '24 hours', '¥980', '¥1,080', '+¥100'],
      ['Kumo Mini', '3 GB', '¥2,178', '¥2,178', 'No change'],
      ['Kumo Basic', '20 GB', '¥4,378', '¥4,378', 'No change'],
      ['Kumo 65+', '5 GB', '¥2,728', '¥2,728', 'No change'],
    ], note: 'New prices apply from December 2026 usage (the bill paid in January 2027), including existing contracts. All discounts are unchanged: the family discount per line is ¥550 (2 lines), ¥1,100 (3 lines) or ¥1,210 (4–10 lines) on Basic and Unlimited, ¥550 on 65+, none on Mini. Plan changes are free; a change made by 30 November applies from 1 December. Source: Kumo Mobile notice of 2 October 2026.' },
    ja: { caption: 'クモモバイルの月額料金（税込み）、現在と12月1日以降', head: ['プラン・オプション', 'データ量', '現在', '12月1日から', '差額'], rows: [
      ['クモ アンリミテッド', '無制限', '7,238円', '7,458円', '+220円'],
      ['クモ アンリミテッド（月3GB以下）', '—', '5,588円', '5,808円', '+220円'],
      ['クモワールド 24時間パス：アジア', '24時間', '980円', '1,080円', '+100円'],
      ['クモ ミニ', '3GB', '2,178円', '2,178円', '変更なし'],
      ['クモ ベーシック', '20GB', '4,378円', '4,378円', '変更なし'],
      ['クモ 65+', '5GB', '2,728円', '2,728円', '変更なし'],
    ], note: '既存の契約を含め、2026年12月利用分（2027年1月支払い分）から新料金。各種割引は変わらない（家族割は1回線あたり、ベーシックとアンリミテッドで2回線550円・3回線1,100円・4〜10回線1,210円、65+は550円、ミニは対象外）。プラン変更は無料で、11月30日までの手続きで12月1日から適用。出典：クモモバイル（2026年10月2日発表）' },
  },
  'flu-schedule': {
    en: { caption: 'Flu vaccination in Springvale, 2026–27 season', head: ['Who', 'Doses', 'Period', 'You pay', 'Notes'], rows: [
      ['Residents aged 65 and over', '1', '1 Oct 2026 – 31 Jan 2027', '¥1,500', 'Free for households on public assistance or exempt from resident tax (bring the certificate)'],
      ['Aged 60–64 with a grade 1 heart, kidney, respiratory or immune disability', '1', '1 Oct 2026 – 31 Jan 2027', '¥1,500', 'Bring the disability certificate'],
      ['Children aged 6 months to 12 years', '2 (2–4 weeks apart)', '1 Oct 2026 – 31 Jan 2027', 'Clinic price minus ¥2,000 per dose', 'Subsidy raised from ¥1,000 per dose'],
      ['Aged 13 to 18', '1', '1 Oct 2026 – 31 Jan 2027', 'Clinic price minus ¥2,000', 'New subsidy this season'],
      ['Nasal spray vaccine, aged 2 to 18', '1', '1 Oct 2026 – 31 Jan 2027', 'Clinic price minus ¥2,000', 'At 34 clinics only'],
      ['Everyone else', '1', 'Any time', 'Full price (usually ¥3,500–¥4,500)', 'No subsidy'],
    ], note: '212 clinics in the city take part; most require a booking. Bring your insurance card or My Number card. Source: Springvale City Public Health Centre.' },
    ja: { caption: '春川市のインフルエンザ予防接種（2026〜27年シーズン）', head: ['対象', '回数', '期間', '自己負担', '備考'], rows: [
      ['65歳以上の市民', '1回', '2026年10月1日〜2027年1月31日', '1,500円', '生活保護世帯・住民税非課税世帯は無料（証明書を持参）'],
      ['60〜64歳で心臓・腎臓・呼吸器・免疫の機能に1級相当の障害がある方', '1回', '同上', '1,500円', '障害者手帳を持参'],
      ['生後6カ月〜12歳', '2回（2〜4週間あける）', '同上', '医療機関の料金から1回2,000円を助成', '助成額を1,000円から引き上げ'],
      ['13〜18歳', '1回', '同上', '医療機関の料金から2,000円を助成', '今季から新たに助成'],
      ['経鼻ワクチン（2〜18歳）', '1回', '同上', '医療機関の料金から2,000円を助成', '実施は34医療機関のみ'],
      ['上記以外の方', '1回', '随時', '全額自己負担（目安3,500〜4,500円）', '助成なし'],
    ], note: '市内212の医療機関で実施。多くは予約制。保険証またはマイナンバーカードを持参。出典：春川市保健所' },
  },
  'night-clinic': {
    en: { caption: 'Springvale City Emergency Clinic: children\'s hours', head: ['Day', 'Until 30 September', 'From 1 October'], rows: [
      ['Weekdays', '19:00–22:00', '19:00–23:00'],
      ['Saturdays', '18:00–22:00', '18:00–23:00'],
      ['Sundays and national holidays', '9:00–12:00 and 13:00–22:00', '9:00–23:00 (no lunch break)'],
      ['Reception closes', '30 minutes before closing', '30 minutes before closing'],
    ], note: 'After 23:00, call the children\'s medical helpline #8000 first. The duty hospital overnight is Harvest Prefectural Central Hospital. Bring the child\'s insurance card and medical subsidy card.' },
    ja: { caption: '春川市急患診療所・小児科の診療時間', head: ['曜日', '9月30日まで', '10月1日から'], rows: [
      ['平日', '19:00〜22:00', '19:00〜23:00'],
      ['土曜日', '18:00〜22:00', '18:00〜23:00'],
      ['日曜・祝日', '9:00〜12:00、13:00〜22:00', '9:00〜23:00（昼休みなし）'],
      ['受付終了', '終了30分前', '終了30分前'],
    ], note: '23時以降はまず小児救急電話相談（#8000）へ。夜間の当番病院はみのり県立中央病院。保険証と子ども医療費受給者証を持参。' },
  },
  standings: {
    en: { caption: 'Shiokaze League standings after Saturday 3 October', head: ['#', 'Team', 'G', 'W', 'L', 'D', 'Pct', 'GB', 'Last 10'], rows: [
      ['1', 'Springvale Seagulls', '69', '41', '25', '3', '.621', '—', '7-2-1'],
      ['2', 'Aogiri Comets', '69', '39', '27', '3', '.591', '2.0', '6-4-0'],
      ['3', 'Moonview Wild Boars', '69', '34', '33', '2', '.507', '7.5', '4-6-0'],
      ['4', 'Shiomi Red Crabs', '69', '33', '34', '2', '.493', '8.5', '5-5-0'],
      ['5', 'Nishiura Tritons', '69', '29', '38', '2', '.433', '12.5', '3-6-1'],
      ['6', 'Kamisato Fireflies', '71', '26', '45', '0', '.366', '17.5', '3-7-0'],
    ], note: '72 games per team. The top two meet in the best-of-five final from 17 October.' },
    ja: { caption: '潮風リーグ順位表（10月3日〈土〉終了時点）', head: ['順位', 'チーム', '試合', '勝', '敗', '分', '勝率', '差', '直近10試合'], rows: [
      ['1', '春川シーガルズ', '69', '41', '25', '3', '.621', '—', '7勝2敗1分'],
      ['2', '青桐コメッツ', '69', '39', '27', '3', '.591', '2.0', '6勝4敗'],
      ['3', '月見ワイルドボアーズ', '69', '34', '33', '2', '.507', '7.5', '4勝6敗'],
      ['4', '汐見レッドクラブス', '69', '33', '34', '2', '.493', '8.5', '5勝5敗'],
      ['5', '西浦トリトンズ', '69', '29', '38', '2', '.433', '12.5', '3勝6敗1分'],
      ['6', '上里ファイアフライズ', '71', '26', '45', '0', '.366', '17.5', '3勝7敗'],
    ], note: '各チーム72試合。上位2チームが10月17日からの決勝シリーズ（3戦先勝）に進出。' },
  },
  linescore: {
    en: { caption: 'Springvale Seagulls 5, Moonview Wild Boars 3 (Springvale Bayside Stadium, 3 October)', head: ['Team', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'R', 'H', 'E'], rows: [
      ['Moonview Wild Boars', '0', '1', '0', '0', '2', '0', '0', '0', '0', '3', '8', '1'],
      ['Springvale Seagulls', '2', '0', '0', '0', '0', '1', '2', '0', 'x', '5', '9', '0'],
    ], note: 'Attendance: 3,412. Time: 2 h 58 min. HR: Kuroda (24th, 1st inning, 1 on).' },
    ja: { caption: '春川シーガルズ 5－3 月見ワイルドボアーズ（10月3日、春川ベイサイド球場）', head: ['チーム', '1', '2', '3', '4', '5', '6', '7', '8', '9', '計', '安', '失'], rows: [
      ['月見ワイルドボアーズ', '0', '1', '0', '0', '2', '0', '0', '0', '0', '3', '8', '1'],
      ['春川シーガルズ', '2', '0', '0', '0', '0', '1', '2', '0', 'x', '5', '9', '0'],
    ], note: '観衆3,412人、試合時間2時間58分。本塁打：黒田24号（1回2ラン）' },
  },
  batting: {
    en: { caption: 'Seagulls batting', head: ['Player', 'Pos', 'AB', 'R', 'H', 'RBI'], rows: [
      ['Sota Imai', 'CF', '4', '1', '2', '0'],
      ['Kaito Mori', 'SS', '4', '1', '1', '1'],
      ['Daichi Kuroda', '1B', '3', '1', '1', '2'],
      ['Ren Matsuoka', 'DH', '4', '0', '1', '1'],
      ['Haruto Endo', '3B', '4', '0', '0', '0'],
      ['Yuto Sakai', 'RF', '3', '1', '2', '0'],
      ['Shun Takagi', 'C', '3', '0', '1', '1'],
      ['Kenji Arai', 'LF', '3', '1', '0', '0'],
      ['Taiga Okubo', '2B', '3', '0', '1', '0'],
      ['Totals', '', '31', '5', '9', '5'],
    ] },
    ja: { caption: 'シーガルズ打撃成績', head: ['選手', '守備', '打数', '得点', '安打', '打点'], rows: [
      ['今井颯太', '中', '4', '1', '2', '0'],
      ['森海斗', '遊', '4', '1', '1', '1'],
      ['黒田大地', '一', '3', '1', '1', '2'],
      ['松岡蓮', '指', '4', '0', '1', '1'],
      ['遠藤陽翔', '三', '4', '0', '0', '0'],
      ['酒井悠斗', '右', '3', '1', '2', '0'],
      ['高木駿', '捕', '3', '0', '1', '1'],
      ['新井健二', '左', '3', '1', '0', '0'],
      ['大久保大河', '二', '3', '0', '1', '0'],
      ['計', '', '31', '5', '9', '5'],
    ] },
  },
  pitching: {
    en: { caption: 'Pitching', head: ['Pitcher', 'IP', 'H', 'R', 'ER', 'BB', 'SO', 'Decision'], rows: [
      ['Wild Boars: Kosuke Ishiyama', '6⅓', '8', '5', '5', '2', '4', 'L (7–9)'],
      ['Wild Boars: Taro Nishi', '1⅔', '1', '0', '0', '1', '2', ''],
      ['Seagulls: Takumi Hoshino', '6', '6', '3', '3', '2', '7', 'W (11–4)'],
      ['Seagulls: Yamato Fujii', '2', '1', '0', '0', '0', '2', ''],
      ['Seagulls: Nao Kawabata', '1', '1', '0', '0', '0', '1', 'S (19)'],
    ] },
    ja: { caption: '投手成績', head: ['投手', '回', '安', '失', '自責', '四球', '三振', '勝敗'], rows: [
      ['ボアーズ：石山浩介', '6 1/3', '8', '5', '5', '2', '4', '負（7勝9敗）'],
      ['ボアーズ：西太郎', '1 2/3', '1', '0', '0', '1', '2', ''],
      ['シーガルズ：星野拓海', '6', '6', '3', '3', '2', '7', '勝（11勝4敗）'],
      ['シーガルズ：藤井大和', '2', '1', '0', '0', '0', '2', ''],
      ['シーガルズ：川端直', '1', '1', '0', '0', '0', '1', 'S（19S）'],
    ] },
  },
  'marathon-categories': {
    en: { caption: '11th Springvale Castle Marathon, Sunday 21 February 2027: categories', head: ['Category', 'Places', 'Entry fee', 'Time limit', 'Who can enter'], rows: [
      ['Full marathon', '7,000', '¥13,000', '6 hours', 'Aged 19 and over on race day (no high-school students)'],
      ['10 km', '3,000', '¥6,500', '1 h 30 min', 'Junior-high-school age and over'],
      ['Wheelchair 10 km', '60', '¥3,000', '1 h 10 min', 'Aged 16 and over, racing wheelchair'],
      ['Family 2 km', '500 pairs', '¥3,000 per pair', '30 min', 'One adult with one child aged 6–12'],
    ], note: 'Entries: 1 October (10:00) – 10 November 2026. If the full marathon is oversubscribed there is a lottery; results by 20 November. 2,000 full-marathon places are reserved for city residents.' },
    ja: { caption: '第11回春川城マラソン（2027年2月21日〈日〉）の種目', head: ['種目', '定員', '参加料', '制限時間', '参加資格'], rows: [
      ['フルマラソン', '7,000人', '13,000円', '6時間', '大会当日19歳以上（高校生を除く）'],
      ['10キロ', '3,000人', '6,500円', '1時間30分', '中学生以上'],
      ['車いす10キロ', '60人', '3,000円', '1時間10分', '16歳以上、競技用車いす'],
      ['ファミリー2キロ', '500組', '1組3,000円', '30分', '大人1人と6〜12歳の子ども1人'],
    ], note: '申し込みは10月1日（10:00）〜11月10日。フルマラソンは定員超過の場合抽選、結果は11月20日までに通知。うち2,000人分は市民枠。' },
  },
  'embankment-phases': {
    en: { caption: 'Mirror River left-bank embankment works (Harvest Prefecture)', head: ['Phase', 'Section', 'Length', 'Period', 'Cost', 'Status'], rows: [
      ['1', 'Asahi Bridge – Minato Bridge', '1.1 km', 'April 2024 – March 2026', '¥2.9 billion', 'Completed'],
      ['2', 'Minato Bridge – river mouth', '1.2 km', 'October 2026 – March 2028', '¥3.5 billion', 'Starts 1 October'],
      ['3', 'Nishiki Bridge – Asahi Bridge', '0.9 km', 'April 2028 – March 2029', '¥2.2 billion', 'Planned'],
      ['Total', '', '3.2 km', '', '¥8.6 billion', ''],
    ], note: 'Crest raised by 1.0 m to 7.4 m, with steel sheet-pile walls and a 12 m berm. Source: Harvest Prefecture Mirror River Office.' },
    ja: { caption: '鏡川左岸の堤防強化工事（みのり県）', head: ['工区', '区間', '延長', '工期', '事業費', '状況'], rows: [
      ['1', '朝日橋〜港橋', '1.1キロ', '2024年4月〜2026年3月', '29億円', '完了'],
      ['2', '港橋〜河口', '1.2キロ', '2026年10月〜2028年3月', '35億円', '10月1日着工'],
      ['3', '錦橋〜朝日橋', '0.9キロ', '2028年4月〜2029年3月', '22億円', '計画'],
      ['計', '', '3.2キロ', '', '86億円', ''],
    ], note: '堤防の高さを1.0メートルかさ上げして7.4メートルとし、鋼矢板と幅12メートルの小段を整備。出典：みのり県鏡川事務所' },
  },
  shelters: {
    en: { caption: 'Largest open shelters, as of 17:30 on Sunday', head: ['Shelter', 'District', 'Capacity', 'Pets', 'People'], rows: [
      ['Springvale Civic Gymnasium', 'Otemachi', '800', 'Yes (in cages)', '312'],
      ['Minatomachi Junior High School', 'Minatomachi', '450', 'No', '268'],
      ['Riverside Elementary School', 'Shimo-Kawabata', '380', 'No', '241'],
      ['Wangancho Community Centre', 'Wangancho', '300', 'Yes (in cages)', '187'],
      ['Tidewater Elementary School', 'Tidewater', '350', 'No', '143'],
      ['Springvale University Kita Campus Hall', 'Kitamachi', '600', 'Yes (in cages)', '58'],
      ['18 other shelters', 'Citywide', '4,900', 'At 3 of them', '75'],
      ['Total (24 shelters)', '', '7,780', '', '1,284'],
    ], note: 'Bring medicine, water, food for one day, a phone charger and a blanket. Source: Springvale City Disaster Management Office.' },
    ja: { caption: '主な開設避難所（日曜17時30分現在）', head: ['避難所', '地区', '収容人数', 'ペット', '避難者'], rows: [
      ['春川市総合体育館', '大手町', '800', '可（ケージ）', '312'],
      ['港町中学校', '港町', '450', '不可', '268'],
      ['川端小学校', '下川端', '380', '不可', '241'],
      ['湾岸町コミュニティセンター', '湾岸町', '300', '可（ケージ）', '187'],
      ['汐浜小学校', '汐浜', '350', '不可', '143'],
      ['春川大学北キャンパスホール', '北町', '600', '可（ケージ）', '58'],
      ['その他18カ所', '市内全域', '4,900', '3カ所で可', '75'],
      ['計（24カ所）', '', '7,780', '', '1,284'],
    ], note: '常備薬、水、1日分の食料、充電器、毛布を持参してください。出典：春川市危機管理課' },
  },
  plans: {
    en: { caption: 'Subscription plans (prices include tax)', head: ['Plan', 'Monthly', 'What you get', 'Notes'], rows: [
      ['Free registration', '¥0', '3 subscriber articles a month, morning newsletter', 'Email address only'],
      ['Digital Basic', '¥980', 'All articles on the web and app, comments', 'First month free until 31 October 2026'],
      ['Digital Basic (annual)', '¥9,800 a year', 'As Digital Basic', 'Two months free compared with monthly'],
      ['Digital Premium', '¥1,800', 'Digital Basic + e-paper (from 4:00), archive since 1985, crossword', 'Up to 3 devices'],
      ['Print + Digital', '¥4,400', 'Morning paper delivered + Digital Premium', 'Delivery in Harvest Prefecture only'],
      ['Student', '¥500', 'As Digital Basic', 'Student ID checked once a year'],
    ], note: 'Cancel online at any time; you keep access until the end of the paid month. Print + Digital prices for delivery outside the city may differ.' },
    ja: { caption: '購読プラン（税込み）', head: ['プラン', '月額', '内容', '備考'], rows: [
      ['無料会員', '0円', '有料記事を月3本まで、朝のニュースレター', 'メールアドレスのみで登録'],
      ['デジタルベーシック', '980円', 'ウェブ・アプリの全記事、コメント機能', '10月31日まで初月無料'],
      ['デジタルベーシック（年払い）', '年9,800円', 'デジタルベーシックと同じ', '月払いより2カ月分お得'],
      ['デジタルプレミアム', '1,800円', 'ベーシック＋紙面ビューアー（4時から）、1985年以降の記事検索、クロスワード', '3台まで'],
      ['宅配＋デジタル', '4,400円', '朝刊の宅配＋デジタルプレミアム', '配達はみのり県内のみ'],
      ['学割', '500円', 'デジタルベーシックと同じ', '年1回学生証を確認'],
    ], note: '解約はいつでもオンラインで可能。支払い済みの月末まで閲覧できます。市外への宅配料金は異なる場合があります。' },
  },
};

// ---------------------------------------------------------------------------------------------
// Charts, drawn as SVG by build.mjs into assets/charts/<id>.<lang>.svg.
// display 'inline' puts the SVG in the page; 'img' uses <img> with the (unhelpful) alt given.
export const charts = {
  'budget-categories': { type: 'hbars', display: 'inline', unit: '¥bn', values: [
      [79.4, 22.6, 21.8, 19.7, 17.1, 8.9, 7.2, 6.3, 7.3],
      [82.1, 23.0, 22.9, 19.2, 17.4, 9.3, 6.9, 8.4, 7.0]],
    en: { title: 'Where the money goes: general account by purpose', subtitle: 'Initial budgets, ¥ billion', series: ['FY2025', 'FY2026'], labels: ['Welfare and health', 'Education', 'Civil engineering (roads, rivers, parks)', 'Debt repayment', 'General administration', 'Disaster prevention and fire', 'Commerce, tourism and labour', 'Culture, sport and libraries', 'Other'], source: 'Source: Springvale City Finance Division' },
    ja: { title: '目的別に見た一般会計の歳出', subtitle: '当初予算、単位：億円', series: ['2025年度', '2026年度'], labels: ['民生・衛生', '教育', '土木（道路・河川・公園）', '公債費', '総務', '消防・防災', '商工・観光・労働', '文化・スポーツ・図書館', 'その他'], source: '出典：春川市財政課', scale: 10 } },
  'budget-revenue': { type: 'hbars', display: 'img', alt: { en: '', ja: '' }, unit: '¥bn', values: [[68.4, 40.1, 31.2, 24.6, 17.3, 14.6]],
    en: { title: 'Where the money comes from (FY2026, ¥196.2 billion)', subtitle: '¥ billion', series: ['FY2026'], labels: ['City taxes', 'National subsidies', 'Local allocation tax', 'Other', 'Municipal bonds', 'Prefectural subsidies'], source: 'Source: Springvale City Finance Division' },
    ja: { title: '歳入の内訳（2026年度、1,962億円）', subtitle: '単位：億円', series: ['2026年度'], labels: ['市税', '国庫支出金', '地方交付税', 'その他', '市債', '県支出金'], source: '出典：春川市財政課', scale: 10 } },
  'election-poll': { type: 'bars', display: 'img', alt: { en: 'chart', ja: 'グラフ' }, unit: '%', values: [[36, 31, 12, 21], [22, 30, 27, 21]],
    en: { title: 'Who would you vote for if the election were held today?', subtitle: 'Herald poll, 26–27 September 2026, %', series: ['All respondents (1,012)', 'Aged 18–39'], labels: ['Hirose', 'Sawada', 'Onodera', 'Undecided'], source: 'Margin of error ±3.1 points (all respondents)' },
    ja: { title: '今日投票するなら誰に？', subtitle: '本紙世論調査（2026年9月26〜27日）、％', series: ['全体（1,012人）', '18〜39歳'], labels: ['広瀬', '沢田', '小野寺', '未定'], source: '誤差は全体で±3.1ポイント' } },
  'election-issues': { type: 'hbars', display: 'img', alt: { en: 'graph', ja: '図' }, unit: '%', values: [[34, 27, 15, 11, 4, 9]],
    en: { title: 'Most important issue for your vote', subtitle: '% of respondents', series: ['%'], labels: ['Disaster prevention, flood control', 'Cost of living', 'Public transport', 'Childcare and education', 'Library and culture', 'Other'], source: 'Herald poll, 26–27 September 2026' },
    ja: { title: '投票で最も重視する争点', subtitle: '回答者の％', series: ['％'], labels: ['防災・治水', '物価・暮らし', '公共交通', '子育て・教育', '図書館・文化', 'その他'], source: '本紙世論調査（2026年9月26〜27日）' } },
  'kumo-prices': { type: 'bars', display: 'img', alt: { en: '', ja: '' }, unit: '¥', values: [[2178, 4378, 2728, 7238], [2178, 4378, 2728, 7458]],
    en: { title: 'Kumo Mobile monthly prices', subtitle: 'Yen per month, tax included', series: ['Now', 'From 1 Dec 2026'], labels: ['Mini (3 GB)', 'Basic (20 GB)', '65+ (5 GB)', 'Unlimited'], source: 'Source: Kumo Mobile' },
    ja: { title: 'クモモバイルの月額料金', subtitle: '円（税込み）', series: ['現在', '12月1日から'], labels: ['ミニ（3GB）', 'ベーシック（20GB）', '65+（5GB）', 'アンリミテッド'], source: '出典：クモモバイル' } },
  'ware-exports': { type: 'bars', display: 'img', alt: { en: 'Springvale ware', ja: '春川焼' }, unit: '¥bn', values: [[0.92, 1.01, 1.12, 1.25, 0.97, 1.31, 1.74, 2.05, 2.33, 2.84]],
    en: { title: 'Springvale ware exports', subtitle: '¥ billion per calendar year', series: ['Exports'], labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'], source: 'Source: Springvale Ware Cooperative' },
    ja: { title: '春川焼の輸出額', subtitle: '億円（暦年）', series: ['輸出額'], labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'], source: '出典：春川焼協同組合', scale: 10 } },
  'port-monthly': { type: 'line', display: 'img', alt: { en: 'image', ja: '画像' }, unit: 'k TEU', values: [[14.8, 13.9, 16.2, 15.5, 15.1, 16.0, 16.6, 16.2], [15.2, 14.6, 17.1, 16.4, 16.0, 17.3, 17.9, 17.4]],
    en: { title: 'Ferry Port container handling, January–August', subtitle: 'Thousand TEU per month', series: ['2025', '2026'], labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], source: 'Source: Harvest Prefecture Port Authority' },
    ja: { title: 'みのり港のコンテナ取扱量（1〜8月）', subtitle: '千TEU（月間）', series: ['2025年', '2026年'], labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'], source: '出典：みのり県港湾局' } },
  'seagrass-area': { type: 'line', display: 'inline', unit: 'ha', x: [1978, 1990, 2000, 2005, 2010, 2015, 2020, 2025], values: [[1240, 860, 470, 380, 395, 412, 488, 569]],
    en: { title: 'Eelgrass meadows in Harvest Bay', subtitle: 'Area in hectares', series: ['Area'], labels: ['1978', '1990', '2000', '2005', '2010', '2015', '2020', '2025'], source: 'Source: Springvale University' },
    ja: { title: 'みのり湾のアマモ場面積', subtitle: 'ヘクタール', series: ['面積'], labels: ['1978', '1990', '2000', '2005', '2010', '2015', '2020', '2025'], source: '出典：春川大学' } },
  'flu-weekly': { type: 'line', display: 'img', alt: { en: '', ja: '' }, unit: '', threshold: 1.0, values: [[0.0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.2, 0.3, 0.3], [0.1, 0.1, 0.2, 0.2, 0.3, 0.4, 0.6, 0.8, 1.2, 1.8]],
    en: { title: 'Flu patients per sentinel clinic, Harvest Prefecture', subtitle: 'Weeks 30–39; the dashed line is the season threshold (1.0)', series: ['2025', '2026'], labels: ['30', '31', '32', '33', '34', '35', '36', '37', '38', '39'], source: 'Source: Harvest Prefecture Infectious Disease Surveillance Centre' },
    ja: { title: 'みのり県のインフルエンザ定点当たり患者数', subtitle: '第30〜39週。破線は流行開始の目安（1.0）', series: ['2025年', '2026年'], labels: ['30', '31', '32', '33', '34', '35', '36', '37', '38', '39'], source: '出典：みのり県感染症情報センター' } },
};

// ---------------------------------------------------------------------------------------------
// Weather (Springvale, Sunday 4 October 2026, issued 17:00).
export const weather = {
  issued: '2026-10-04T17:00',
  today: { high: 24, low: 20, humidity: 92, pressure: 1002, windDir: { en: 'NE', ja: '北東' }, wind: 12, gust: 24, rainSoFar: 26, rain24: 170, rainMountains: 250, sunrise: '5:49', sunset: '17:36', uv: { en: 'Low', ja: '弱い' } },
  // Next 24 hours from 18:00 Sunday.
  hourly: {
    hours: ['18', '19', '20', '21', '22', '23', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17'],
    temp: [22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 25, 25, 26, 27, 27, 28, 28, 27, 26, 25],
    rain: [2, 3, 5, 6, 8, 9, 12, 15, 18, 30, 25, 15, 11, 7, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0],
    wind: [12, 13, 15, 17, 19, 21, 23, 25, 27, 28, 29, 27, 24, 21, 18, 15, 13, 11, 10, 9, 9, 8, 7, 6],
  },
  // 7-day forecast, Monday 5 – Sunday 11 October.
  week: [
    { date: '2026-10-05', icon: 'storm', en: 'Storm, clearing in the afternoon', ja: '暴風雨のち晴れ', high: 28, low: 21, pop: 90, wind: { en: 'S 15 m/s', ja: '南 15m/s' }, conf: 'A' },
    { date: '2026-10-06', icon: 'sun', en: 'Sunny and hot', ja: '晴れ、暑い', high: 29, low: 20, pop: 0, wind: { en: 'W 6 m/s', ja: '西 6m/s' }, conf: 'A' },
    { date: '2026-10-07', icon: 'suncloud', en: 'Sunny, cloudy later', ja: '晴れのち曇り', high: 26, low: 18, pop: 20, wind: { en: 'NW 4 m/s', ja: '北西 4m/s' }, conf: 'B' },
    { date: '2026-10-08', icon: 'rain', en: 'Cloudy, rain at times', ja: '曇り時々雨', high: 23, low: 17, pop: 60, wind: { en: 'NE 5 m/s', ja: '北東 5m/s' }, conf: 'C' },
    { date: '2026-10-09', icon: 'cloudsun', en: 'Cloudy, then sunny', ja: '曇りのち晴れ', high: 22, low: 15, pop: 30, wind: { en: 'N 4 m/s', ja: '北 4m/s' }, conf: 'B' },
    { date: '2026-10-10', icon: 'sun', en: 'Sunny', ja: '晴れ', high: 23, low: 14, pop: 10, wind: { en: 'N 3 m/s', ja: '北 3m/s' }, conf: 'B' },
    { date: '2026-10-11', icon: 'suncloud', en: 'Sunny, cloudy later', ja: '晴れのち曇り', high: 22, low: 15, pop: 20, wind: { en: 'NE 3 m/s', ja: '北東 3m/s' }, conf: 'C' },
  ],
  warnings: [
    { level: 'warning', issued: '16:42', en: ['Storm warning', 'Mean winds up to 30 m/s and gusts to 45 m/s from late Sunday evening to Monday morning, strongest around 04:00.'], ja: ['暴風警報', '日曜夜遅くから月曜朝にかけて最大風速30メートル、最大瞬間風速45メートル。最も強まるのは4時ごろ。'] },
    { level: 'warning', issued: '17:20', en: ['Storm surge warning', 'Tide up to 2.4 m above standard level along Harvest Bay around 04:00–06:00 on Monday (high tide 05:12).'], ja: ['高潮警報', 'みのり湾沿岸で月曜4〜6時ごろ、潮位が標準より最大2.4メートル上昇（満潮5時12分）。'] },
    { level: 'warning', issued: '15:10', en: ['Heavy rain warning (landslides, inundation)', 'Up to 40 mm an hour; 170 mm in the city and 250 mm in the mountains in the 24 hours to 18:00 Monday.'], ja: ['大雨警報（土砂災害、浸水害）', '1時間に最大40ミリ。月曜18時までの24時間に市街地170ミリ、山地250ミリ。'] },
    { level: 'warning', issued: '11:05', en: ['High wave warning', 'Waves of 6 m in Harvest Bay and 8 m offshore.'], ja: ['波浪警報', 'みのり湾で6メートル、沖合で8メートル。'] },
    { level: 'advisory', issued: '14:30', en: ['Flood advisory (Mirror River)', 'The Nishiki Bridge gauge may reach the evacuation decision level (4.1 m) early on Monday.'], ja: ['洪水注意報（鏡川）', '錦橋観測所の水位が月曜未明に避難判断水位（4.1メートル）に達するおそれ。'] },
    { level: 'advisory', issued: '09:30', en: ['Thunderstorm advisory', 'Lightning and sudden gusts possible until Monday afternoon.'], ja: ['雷注意報', '月曜午後まで落雷や突風のおそれ。'] },
  ],
  // Typhoon No. 21 positions (map units: x, y on a 600×420 canvas; Springvale is at 330, 120).
  track: [
    { t: { en: 'Fri 2 Oct 09:00', ja: '2日（金）9時' }, x: 150, y: 410, hpa: 975, past: true },
    { t: { en: 'Sat 3 Oct 15:00', ja: '3日（土）15時' }, x: 215, y: 330, hpa: 960, past: true },
    { t: { en: 'Sun 4 Oct 15:00', ja: '4日（日）15時' }, x: 255, y: 250, hpa: 955, past: true, now: true },
    { t: { en: 'Mon 5 Oct 03:00', ja: '5日（月）3時' }, x: 305, y: 140, hpa: 960, r: 28 },
    { t: { en: 'Mon 5 Oct 09:00', ja: '5日（月）9時' }, x: 360, y: 70, hpa: 975, r: 42 },
    { t: { en: 'Mon 5 Oct 21:00', ja: '5日（月）21時' }, x: 455, y: 24, hpa: 990, r: 65 },
  ],
};
