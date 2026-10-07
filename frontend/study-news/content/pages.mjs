// Interface strings and the text of the fixed pages, per language.

export const ui = {
  en: {
    siteName: 'The Springvale Herald', siteSub: 'Springvale Herald · English edition', tagline: 'News from Springvale and Harvest Prefecture since 1898',
    today: 'Sunday 4 October 2026', home: 'Home', search: 'Search', searchPlaceholder: 'Search the Herald', subscribe: 'Subscribe', login: 'Log in',
    newsletters: 'Newsletters', epaper: "Today's paper", more: 'More', live: 'LIVE', liveNav: 'Typhoon live', archive: 'Archive', corrections: 'Corrections',
    about: 'About us', weather: 'Weather', otherLang: '日本語', otherLangLabel: 'Japanese edition',
    published: 'Published', updated: 'Updated', by: 'By', related: 'Related stories', tagsLabel: 'Topics', comments: 'Comments', share: 'Share this article',
    mostRead: 'Most read', mostCommented: 'Most commented', advert: 'Advertisement', readMore: 'Read more', latest: 'Latest', minRead: 'min read',
    commentsClosed: 'Comments on this article are open to subscribers.', addComment: 'Join the conversation', postComment: 'Post', likes: 'likes', reply: 'Reply', report: 'Report',
    commentPlaceholder: 'Subscribers can comment. Log in to add yours.', sortBy: 'Sort by', newest: 'Newest', oldest: 'Oldest', best: 'Most liked',
    correction: 'Correction', breadcrumbHome: 'Home', photo: 'Photo', subscriberOnly: 'Subscribers only',
    paywallTitle: 'Subscribe to continue reading', paywallText: 'This article is for subscribers. Get unlimited access to The Springvale Herald from ¥980 a month, first month free until 31 October.',
    paywallBtn: 'See subscription plans', paywallLogin: 'Already a subscriber? Log in', paywallFree: 'Free members can read 3 subscriber articles a month.',
    breaking: 'Typhoon No. 21: evacuation instruction for four districts; Bayside Line suspended, last Mirror Line train from Springvale Central at 19:15',
    tickerLabel: 'Breaking',
    cookie: { text: 'We and our 214 partners use cookies and similar technologies to personalise content and ads, measure audiences and improve our services. You can change your choice at any time under "Cookie settings" at the bottom of every page.', accept: 'Accept all', reject: 'Reject non-essential', settings: 'Cookie settings' },
    newsletter: { title: 'The Morning Briefing', text: 'The five stories Springvale is talking about, in your inbox at 6:30 every weekday. Free.', placeholder: 'Your email address', btn: 'Sign me up', no: 'No thanks', fine: 'By signing up you agree to our privacy policy. Unsubscribe at any time.', close: 'Close' },
    nlBox: { title: 'Get the Morning Briefing', text: 'Free every weekday at 6:30.', btn: 'Sign up' },
    weatherWidget: 'Springvale weather', weatherNow: 'Rain, storm tonight', weatherLink: 'Full forecast',
    footerAbout: 'The Springvale Herald is the English edition of Springvale Herald, the daily newspaper of Springvale and Harvest Prefecture.',
    footerCols: [
      ['Sections', null],
      ['Services', [['epaper', "Today's paper (e-paper)"], ['newsletters', 'Newsletters'], ['subscribe', 'Subscribe'], ['subscribe', 'Gift a subscription'], ['about', 'Apps']]],
      ['The Herald', [['about', 'About us'], ['corrections', 'Corrections'], ['about', 'Contact the newsroom'], ['about', 'Advertise with us'], ['about', 'Careers'], ['archive', 'Archive']]],
      ['Legal', [['about', 'Privacy policy'], ['about', 'Cookie settings'], ['about', 'Terms of use'], ['about', 'Copyright and syndication']]],
    ],
    copyright: '© 2026 Springvale Herald Co., Ltd. All rights reserved. Reproduction without permission is prohibited.',
    fictional: 'Fictional website made for research (UniLens user study).',
    sectionLatest: 'Latest in', allSection: 'More from', liveNow: 'Live now', inPictures: 'In pictures', opinionTitle: 'Opinion', topStories: 'Top stories',
    prev: 'Previous', next: 'Next', page: 'Page',
    tagPage: 'Topic', articlesCount: n => `${n} articles`, noResults: 'No articles match your search.', resultsFor: (n, q) => `${n} results for “${q}”`,
    searchTitle: 'Search', searchHint: 'Search all articles from the last two weeks by keyword, place or name.', searchBtn: 'Search',
    filterAll: 'All sections', sortNewest: 'Newest first', sortRelevance: 'Best match',
    archiveTitle: 'Archive', archiveIntro: 'Every article published on the Herald website, by date. Articles older than two weeks are in the subscriber archive (Digital Premium).',
    liveUpdates: 'updates', liveLatest: 'Latest update', liveKey: 'Key points', livePinned: 'Pinned', liveFilter: 'Show', liveCats: { all: 'All updates', warnings: 'Warnings', evacuation: 'Evacuation', transport: 'Transport', city: 'City and services' },
    liveAuto: 'This page updates automatically. Times are JST.', liveStarted: 'Live coverage started', newUpdates: 'Show new updates',
    jst: 'JST', editorial: 'Editorial', column: 'Column', correctionKind: 'Correction',
    weatherDetails: { title: 'Today in Springvale', high: 'High', low: 'Low', humidity: 'Humidity', pressure: 'Pressure', wind: 'Wind', gust: 'gusts', rainSoFar: 'Rain so far today', rain24: 'Expected rain, next 24 h', sunrise: 'Sunrise', sunset: 'Sunset', uv: 'UV index' },
  },
  ja: {
    siteName: '春川日報', siteSub: 'THE HARUKAWA HERALD', tagline: '1898年創刊　春川とみのり県のニュース',
    today: '2026年10月4日（日）', home: 'ホーム', search: '検索', searchPlaceholder: '記事を検索', subscribe: '購読する', login: 'ログイン',
    newsletters: 'ニュースレター', epaper: '紙面ビューアー', more: 'その他', live: 'ライブ', liveNav: '台風ライブ', archive: '過去の記事', corrections: '訂正・おわび',
    about: '春川日報について', weather: '天気', otherLang: 'English', otherLangLabel: 'English edition',
    published: '公開', updated: '更新', by: '', related: '関連記事', tagsLabel: 'トピック', comments: 'コメント', share: 'この記事をシェア',
    mostRead: 'よく読まれている記事', mostCommented: 'コメントの多い記事', advert: '広告', readMore: '続きを読む', latest: '新着', minRead: '分で読めます',
    commentsClosed: 'コメントは有料会員の方のみ投稿できます。', addComment: 'コメントする', postComment: '投稿', likes: 'いいね', reply: '返信', report: '通報',
    commentPlaceholder: 'コメントの投稿にはログインが必要です（有料会員）。', sortBy: '並び替え', newest: '新しい順', oldest: '古い順', best: 'いいね順',
    correction: '訂正', breadcrumbHome: 'ホーム', photo: '写真', subscriberOnly: '有料会員限定',
    paywallTitle: 'この記事の続きは有料会員限定です', paywallText: '有料会員になると、春川日報のすべての記事が読めます。月額980円から、10月31日まで初月無料。',
    paywallBtn: '購読プランを見る', paywallLogin: '会員の方はログイン', paywallFree: '無料会員は有料記事を月3本までお読みいただけます。',
    breaking: '台風21号　4地区に避難指示、湾岸線は運転見合わせ、鏡線は春川中央19時15分発が最終',
    tickerLabel: '速報',
    cookie: { text: '当サイトでは、コンテンツや広告の最適化、利用状況の分析のため、当社と提携先214社がCookieなどの技術を使用しています。設定は各ページ下部の「Cookie設定」からいつでも変更できます。', accept: 'すべて許可', reject: '必須以外を拒否', settings: 'Cookie設定' },
    newsletter: { title: 'モーニング・ブリーフィング', text: '春川でいま話題のニュース5本を、平日毎朝6時30分にお届けします。無料です。', placeholder: 'メールアドレス', btn: '登録する', no: '今はしない', fine: '登録によりプライバシーポリシーに同意したものとみなします。配信はいつでも停止できます。', close: '閉じる' },
    nlBox: { title: 'モーニング・ブリーフィング', text: '平日毎朝6時30分に無料配信', btn: '登録' },
    weatherWidget: '春川の天気', weatherNow: '雨、夜は暴風雨', weatherLink: '詳しい予報',
    footerAbout: '春川日報は、春川市とみのり県の地域日刊紙です。英語版 The Harukawa Herald も配信しています。',
    footerCols: [
      ['ジャンル', null],
      ['サービス', [['epaper', '紙面ビューアー'], ['newsletters', 'ニュースレター'], ['subscribe', '購読のお申し込み'], ['subscribe', 'ギフト購読'], ['about', 'アプリ']]],
      ['春川日報', [['about', '会社案内'], ['corrections', '訂正・おわび'], ['about', '編集局へのお問い合わせ'], ['about', '広告掲載'], ['about', '採用情報'], ['archive', '過去の記事']]],
      ['規約', [['about', 'プライバシーポリシー'], ['about', 'Cookie設定'], ['about', '利用規約'], ['about', '著作権・記事利用']]],
    ],
    copyright: '© 2026 春川日報社　無断転載を禁じます。',
    fictional: '研究用に作成した架空のウェブサイトです（UniLens ユーザー調査）。',
    sectionLatest: '新着：', allSection: 'もっと見る：', liveNow: 'ライブ中', inPictures: '写真で見る', opinionTitle: 'オピニオン', topStories: '主なニュース',
    prev: '前へ', next: '次へ', page: 'ページ',
    tagPage: 'トピック', articlesCount: n => `${n}件の記事`, noResults: '該当する記事はありません。', resultsFor: (n, q) => `「${q}」の検索結果：${n}件`,
    searchTitle: '記事検索', searchHint: '直近2週間の記事を、キーワード・地名・人名で検索できます。', searchBtn: '検索',
    filterAll: 'すべてのジャンル', sortNewest: '新しい順', sortRelevance: '関連度順',
    archiveTitle: '過去の記事', archiveIntro: 'ウェブサイトに掲載した記事を日付順に掲載しています。2週間より前の記事は会員向けアーカイブ（デジタルプレミアム）でご覧いただけます。',
    liveUpdates: '件の更新', liveLatest: '最終更新', liveKey: 'ポイント', livePinned: '固定', liveFilter: '表示', liveCats: { all: 'すべて', warnings: '警報', evacuation: '避難', transport: '交通', city: '市の対応・生活' },
    liveAuto: 'このページは自動で更新されます。', liveStarted: 'ライブ開始', newUpdates: '新しい更新を表示',
    jst: '', editorial: '社説', column: 'コラム', correctionKind: '訂正',
    weatherDetails: { title: '今日の春川', high: '最高', low: '最低', humidity: '湿度', pressure: '気圧', wind: '風', gust: '最大瞬間', rainSoFar: '今日の降水量（これまで）', rain24: '今後24時間の予想雨量', sunrise: '日の出', sunset: '日の入り', uv: '紫外線' },
  },
};

// Sidebar and in-feed adverts (fictional businesses from the shared world).
export const ads = {
  en: [
    { cls: 'ad-onsen', kicker: 'Moonview Spa Ryokan Association', title: 'Autumn leaves and hot springs', text: 'Two days, one night with dinner from ¥14,800 per person. Limited express Comet 39 minutes from Springvale Central.', cta: 'Find a ryokan' },
    { cls: 'ad-kumo', kicker: 'Kumo Mobile', title: 'Switch today, keep your number', text: 'Kumo Basic 20 GB for ¥4,378 a month. Visit our shop at Springvale Central or switch online.', cta: 'See plans' },
    { cls: 'ad-marketa', kicker: 'Marketa', title: 'Autumn Super Sale', text: 'Up to 40% off kitchenware, heaters and Springvale ware. Free delivery over ¥3,000.', cta: 'Shop now' },
    { cls: 'ad-table', kicker: 'Daily Table', title: 'Yuzu season is here', text: '42 recipes with fresh Springvale yuzu: ponzu, yuzu kosho, yuzu cake.', cta: 'Get cooking' },
    { cls: 'ad-haruca', kicker: 'Springvale Railway', title: '1-Day Free Pass', text: 'Unlimited rides on the Mirror and Bayside Lines all day: ¥1,100 on Saturdays, Sundays and holidays, ¥1,300 on weekdays.', cta: 'Details' },
  ],
  ja: [
    { cls: 'ad-onsen', kicker: '月見温泉旅館協同組合', title: '紅葉と湯けむりの秋', text: '1泊2食付き、お一人様14,800円から。春川中央から特急「月影」で39分。', cta: '宿を探す' },
    { cls: 'ad-kumo', kicker: 'クモモバイル', title: '番号そのまま、今日から乗り換え', text: 'クモ ベーシック20GBが月額4,378円。春川中央店またはオンラインで。', cta: 'プランを見る' },
    { cls: 'ad-marketa', kicker: 'マルケタ', title: '秋のスーパーセール', text: 'キッチン用品・暖房器具・春川焼が最大40％オフ。3,000円以上で送料無料。', cta: '今すぐチェック' },
    { cls: 'ad-table', kicker: 'デイリーテーブル', title: 'ゆずの季節がやってきた', text: '春川産の生ゆずを使ったレシピ42品。ポン酢、ゆずこしょう、ゆずケーキ。', cta: 'レシピを見る' },
    { cls: 'ad-haruca', kicker: '春川鉄道', title: '1日フリーきっぷ', text: '鏡線・湾岸線が1日乗り放題。土休日1,100円、平日1,300円。', cta: '詳しくはこちら' },
  ],
};

// Fixed pages. Blocks use the same markup as articles.
export const pages = {
  en: {
    about: { title: 'About The Springvale Herald', body: `
Springvale Herald (春川日報) has reported on Springvale and Harvest Prefecture since 15 April 1898, when it was founded as a four-page weekly by the printer and former samurai retainer Seijirō Kanzaki. It became a daily in 1911 and has printed a morning edition every day since, except for nine days after the air raid of July 1945.

The Springvale Herald, its English edition, started in 2019 for the city's growing number of international residents, students and visitors. It publishes the same news as the Japanese edition, written for English readers by the same newsroom.

## The newspaper today

- Print circulation: 82,400 (morning edition, September 2026)
- Digital subscribers: 46,100, of whom 3,900 read the English edition
- Newsroom: 96 journalists, including 11 photographers, in Springvale and bureaus in Moonview Spa and the prefectural capital
- Head office: 2-5-1 Otemachi, Springvale, Harvest Prefecture

## Our standards

We report facts we have checked, name our sources where we can, and correct our mistakes openly. Corrections are added to the foot of the article concerned, with the date and time, and listed on our [corrections page](page:corrections). Opinion pieces, editorials and columns are labelled as such and are kept separate from news reporting.

The Herald's editorial board writes the paper's editorials. Board members do not take part in reporting the stories they write about.

## Advertising

Advertisements are marked "Advertisement". Advertisers have no say over our journalism. Sponsored content is labelled "Sponsored" and written by our commercial team, not by the newsroom.

## Contact us

- Newsroom and story tips: news@harukawa-nippo.example
- Corrections: corrections@harukawa-nippo.example
- Subscriptions and delivery: 9:00–18:00 every day except 1–3 January, via the form on our [subscription page](page:subscribe)
- Advertising: ads@harukawa-nippo.example

## Privacy and cookies

We use cookies to keep you logged in, to count visits and, if you allow it, to show advertising that matches your interests. You can change your choice at any time with the "Cookie settings" link at the bottom of every page. We do not sell personal data.
` },
    subscribe: { title: 'Subscribe to The Springvale Herald', intro: 'Independent local journalism for Springvale and Harvest Prefecture. Choose the plan that suits you. All prices include consumption tax.', faqTitle: 'Frequently asked questions', faq: [
      ['Can I read the English and Japanese editions with one subscription?', 'Yes. Every digital plan includes both editions on the web and in the app.'],
      ['How many free articles can I read?', 'Most news is free to read. Articles marked "Subscribers only" can be read three times a month with a free registration.'],
      ['When does the first-month-free offer end?', 'The offer applies to new Digital Basic subscriptions started by 31 October 2026. You will be charged ¥980 from the second month unless you cancel.'],
      ['How do I cancel?', 'Online at any time from "My account". You keep access until the end of the month you have paid for. There is no cancellation fee.'],
      ['Is home delivery available outside Springvale?', 'Print + Digital is available anywhere in Harvest Prefecture. In some mountain areas the paper arrives by post a day later; the price is the same.'],
      ['Do you offer a student discount?', 'Yes, ¥500 a month for students at universities, colleges and vocational schools. We check your student ID once a year.'],
    ], perks: ['Every article, including subscriber-only reports and analysis', 'The e-paper: the printed edition as it appears, from 4:00 every morning (Premium)', 'Comment on articles', 'Archive back to 1985 (Premium)', 'Ad-light reading: no pop-ups or in-article ads'] },
    corrections: { title: 'Corrections and clarifications', intro: 'We correct significant errors as quickly as possible. Each correction is shown at the foot of the article concerned and listed here, newest first. To report an error, write to corrections@harukawa-nippo.example.' },
    weather: { title: 'Springvale weather', intro: 'Forecast for Springvale city, issued by the Herald weather desk using data from the Harvest Local Meteorological Office. Issued 17:00, Sunday 4 October 2026.', warningsTitle: 'Warnings and advisories in force', warnLevel: { warning: 'Warning', advisory: 'Advisory' }, issuedAt: 'issued', hourlyTitle: 'Next 24 hours', hourlyNote: 'Bars: rain (mm per hour). Line: temperature (°C).', weekTitle: '7-day forecast', weekHead: ['Day', 'Weather', 'High', 'Low', 'Chance of rain', 'Wind', 'Reliability'], confNote: 'Reliability of the forecast: A high, B fairly high, C fairly low.', trackTitle: 'Typhoon No. 21: track and forecast', trackNote: 'Circles show where the centre is expected to be with 70% probability. The red circle is the current storm-force wind area (25 m/s or more).', newsTitle: 'Weather news', tidesTitle: 'Tides, Harvest Bay (Monday 5 October)', tides: [['High tide', '05:12 (2.4 m above standard level forecast with storm surge)'], ['Low tide', '11:30'], ['High tide', '17:41'], ['Low tide', '23:58']], festivalNote: 'Lantern Festival weekend (10–11 October): sunny on Saturday, sunny then cloudy on Sunday. Evenings around 16 °C — bring a jacket for the lantern floating (19:30–21:00 both evenings).' },
    archive: {},
    search: {},
  },
  ja: {
    about: { title: '春川日報について', body: `
春川日報は1898年（明治31年）4月15日、印刷業を営んでいた旧藩士・神崎清次郎が4ページの週刊紙として創刊しました。1911年に日刊化し、1945年7月の空襲後の9日間を除き、毎日朝刊を発行しています。

英語版 The Harukawa Herald は、増え続ける外国人住民や留学生、観光客のために2019年に始まりました。日本語版と同じ編集局が、同じニュースを英語読者向けに書いています。

## 現在の春川日報

- 朝刊発行部数：82,400部（2026年9月）
- デジタル会員：46,100人（うち英語版の読者3,900人）
- 編集局：記者96人（写真記者11人を含む）。本社のほか月見温泉支局、県都支局
- 本社：みのり県春川市大手町2-5-1

## 編集の方針

確認した事実を報じ、可能な限り情報源を明らかにし、誤りは率直に訂正します。訂正は該当記事の末尾に日時とともに掲載し、[訂正・おわびのページ](page:corrections)にも一覧で掲載します。社説・コラムなどの意見記事は、その旨を明示してニュース記事と区別しています。

社説は論説委員会が執筆します。論説委員は、自らが論じるテーマの取材には加わりません。

## 広告について

広告には「広告」と表示しています。広告主が記事の内容に関与することはありません。記事体広告には「PR」と表示し、編集局ではなく広告局が制作しています。

## お問い合わせ

- 編集局・情報提供：news@harukawa-nippo.example
- 訂正のご連絡：corrections@harukawa-nippo.example
- 購読・配達：毎日9時〜18時（1月1〜3日を除く）。[購読のページ](page:subscribe)のフォームから
- 広告：ads@harukawa-nippo.example

## プライバシーとCookie

ログイン状態の保持、閲覧数の計測、また同意いただいた場合には関心に合わせた広告の表示のためにCookieを使用しています。各ページ下部の「Cookie設定」からいつでも変更できます。個人情報を販売することはありません。
` },
    subscribe: { title: '春川日報を購読する', intro: '春川とみのり県の地域ジャーナリズムを支えてください。ご希望に合わせてプランをお選びいただけます。価格はすべて税込みです。', faqTitle: 'よくある質問', faq: [
      ['1つの契約で日本語版と英語版の両方を読めますか？', 'はい。すべてのデジタルプランで、ウェブとアプリの日本語版・英語版をお読みいただけます。'],
      ['無料で何本まで読めますか？', 'ほとんどのニュースは無料でお読みいただけます。「有料会員限定」の記事は、無料会員登録で月3本までお読みいただけます。'],
      ['初月無料キャンペーンはいつまでですか？', '2026年10月31日までにデジタルベーシックをお申し込みの方が対象です。解約しない場合、2カ月目から月額980円がかかります。'],
      ['解約の方法は？', '「マイページ」からいつでもオンラインで解約できます。支払い済みの月末まで閲覧可能で、解約手数料はかかりません。'],
      ['春川市外でも宅配できますか？', '宅配＋デジタルはみのり県内全域でお申し込みいただけます。一部の山間地では郵送となり1日遅れでのお届けですが、料金は同じです。'],
      ['学割はありますか？', 'はい。大学・短大・専門学校の学生は月額500円です。年1回、学生証を確認します。'],
    ], perks: ['有料会員限定の記事・解説を含むすべての記事', '紙面ビューアー：毎朝4時から紙面そのままのイメージで（プレミアム）', '記事へのコメント', '1985年以降の記事検索（プレミアム）', 'ポップアップや記事内広告の少ない画面'] },
    corrections: { title: '訂正・おわび', intro: '重要な誤りは速やかに訂正します。訂正は該当記事の末尾に掲載し、このページにも新しい順に一覧で掲載しています。誤りのご指摘は corrections@harukawa-nippo.example へ。' },
    weather: { title: '春川の天気', intro: 'みのり地方気象台の資料をもとに本紙気象担当が作成した春川市の予報です。2026年10月4日（日）17時発表。', warningsTitle: '発表中の警報・注意報', warnLevel: { warning: '警報', advisory: '注意報' }, issuedAt: '発表', hourlyTitle: '24時間の予報', hourlyNote: '棒グラフ：1時間雨量（ミリ）、折れ線：気温（℃）', weekTitle: '週間予報', weekHead: ['日付', '天気', '最高', '最低', '降水確率', '風', '信頼度'], confNote: '予報の信頼度：A 高い、B やや高い、C やや低い', trackTitle: '台風21号の進路予想', trackNote: '円は台風の中心が70％の確率で入る範囲（予報円）。赤い円は現在の暴風域（風速25メートル以上）。', newsTitle: '天気のニュース', tidesTitle: 'みのり湾の潮汐（10月5日〈月〉）', tides: [['満潮', '5時12分（高潮により標準より最大2.4メートル高い見込み）'], ['干潮', '11時30分'], ['満潮', '17時41分'], ['干潮', '23時58分']], festivalNote: '灯籠まつりの週末（10、11日）は、土曜は晴れ、日曜は晴れのち曇りの予報。夜は16度前後まで下がるので、灯籠流し（両日19時30分〜21時）には上着を。' },
    archive: {},
    search: {},
  },
};
