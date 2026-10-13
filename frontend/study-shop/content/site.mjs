// Site-wide content: categories, home page, deals, the mock account, orders and tracking.
// Today on the site is Monday 5 October 2026, about 10:40 (see build.mjs, DATES).

export const account = {
  name: { en: 'Aki', ja: 'アキ' },
  full: { en: 'Aki Mori', ja: '森 亜希' },
  points: 1240,
  addresses: [
    { id: 'home', region: 'harukawa',
      en: { name: 'Aki Mori', lines: ['2-14-6 Kagamigawa-dori, Apt. 305', 'Springvale, Harvest Prefecture 795-0021'], label: 'Home' },
      ja: { name: '森 亜希', lines: ['〒795-0021 みのり県春川市', '鏡川通2-14-6 305号室'], label: '自宅' } },
    { id: 'parents', region: 'minori',
      en: { name: 'Hisako Mori', lines: ['418 Bath Street', 'Moonview Spa, Springvale District, Harvest Prefecture 795-3102'], label: 'Parents (Moonview Spa)' },
      ja: { name: '森 久子', lines: ['〒795-3102 みのり県春川郡月見温泉', '温泉町418'], label: '実家（月見温泉）' } },
  ],
};

export const cats = [
  { id: 'kitchen', clusters: ['kettles', 'ricecookers'], img: 'hearth-kettle', en: 'Kitchen', ja: 'キッチン用品',
    blurb: { en: 'Kettles, rice cookers and Springvale ware donabe', ja: '電気ケトル、炊飯器、春川焼の土鍋' } },
  { id: 'home', clusters: ['tableware'], img: 'kagami-plate-set', en: 'Home & Tableware', ja: 'ホーム・食器',
    blurb: { en: 'Springvale ware mugs, tea sets and plates', ja: '春川焼のマグ、茶器、取り皿' } },
  { id: 'electronics', clusters: ['audio', 'power'], img: 'nami-buds', en: 'Electronics', ja: '家電・オーディオ',
    blurb: { en: 'Headphones, earbuds and power banks', ja: 'ヘッドホン、イヤホン、モバイルバッテリー' } },
  { id: 'outdoor', clusters: ['jackets'], img: 'northpine-packable', en: 'Sports & Outdoors', ja: 'スポーツ・アウトドア',
    blurb: { en: 'Rain jackets for Mount Moonview trails', ja: '月見山の山歩きに、レインジャケット' } },
  { id: 'beauty', clusters: ['bath'], img: 'minori-bath-salts', en: 'Health & Beauty', ja: 'ビューティー・ヘルスケア',
    blurb: { en: 'Yuzu bath salts, hand cream and bath powder', ja: '柚子のバスソルト、ハンドクリーム、入浴剤' } },
  { id: 'gifts', clusters: ['gifts'], img: 'minori-ponzu-set', en: 'Food & Gifts', ja: '食品・ギフト',
    blurb: { en: 'Yuzu ponzu, senbei and gift sets from Springvale', ja: '柚子ぽん酢、春川のせんべい、贈り物' } },
];

export const clusterNames = {
  kettles: { en: 'Electric kettles', ja: '電気ケトル' },
  ricecookers: { en: 'Rice cookers & donabe', ja: '炊飯器・土鍋' },
  tableware: { en: 'Springvale ware & tableware', ja: '春川焼・和食器' },
  audio: { en: 'Headphones & earbuds', ja: 'ヘッドホン・イヤホン' },
  power: { en: 'Power banks', ja: 'モバイルバッテリー' },
  jackets: { en: 'Rain jackets', ja: 'レインジャケット' },
  bath: { en: 'Bath & body', ja: '入浴剤・ボディケア' },
  gifts: { en: 'Local food & gifts', ja: 'ご当地グルメ・ギフト' },
};

// BrightDeal pays to promote these: they show as "Sponsored" in search results and on the home page.
export const sponsored = ['vetrina-kettle', 'voltx-pods', 'drizzle-pro', 'tokiya-mug-pair', 'titancell-40k'];

export const home = {
  hero: [
    { tone: 'festival', img: 'kagami-plate-set', href: 'deals.html',
      en: { kicker: 'Springvale Lantern Festival Sale', h: 'Up to 40% off, until Sun 11 Oct', p: 'New Lightning Deals every day. Fast members get 30 minutes early access.', cta: 'Shop the sale' },
      ja: { kicker: '春川灯籠まつりセール', h: '最大40%OFF　10月11日(日)まで', p: 'タイムセールは毎日更新。Fast会員は30分早く参加できます。', cta: 'セール会場へ' } },
    { tone: 'local', img: 'kagami-donabe', href: 'seller/kagami.html',
      en: { kicker: 'Springvale Local', h: 'Handmade in Kamagaoka since 1891', p: 'Springvale ware donabe, mugs and tea sets from Kagami Kiln.', cta: 'Visit Kagami Kiln' },
      ja: { kicker: '春川ローカル', h: '窯ヶ丘で1891年から、手仕事の器', p: '鏡窯の春川焼。土鍋、マグカップ、茶器。', cta: '鏡窯のストアへ' } },
    { tone: 'fast', img: 'hearth-kettle', href: 'help/fast.html',
      en: { kicker: 'Marketa Fast', h: 'Free next-day delivery to Springvale', p: 'Order by 14:00, get it tomorrow. Try it free for 30 days.', cta: 'Start your free trial' },
      ja: { kicker: 'マルケタFast', h: '春川市内へ、翌日お届け無料', p: '14時までのご注文で明日届く。30日間の無料体験実施中。', cta: '無料体験をはじめる' } },
    { tone: 'outdoor', img: 'northpine-packable', href: 'c/outdoor.html',
      en: { kicker: 'Autumn on Mount Moonview', h: 'Rain jackets from ¥3,480', p: 'Packable, 3-layer and women’s fits. Check the size charts.', cta: 'Shop rain jackets' },
      ja: { kicker: '秋の月見山へ', h: 'レインジャケット 3,480円から', p: 'パッカブル、3レイヤー、レディースも。サイズ表をご確認ください。', cta: 'レインジャケットを見る' } },
  ],
  recommended: ['hearth-kettle', 'kagami-mug-pair', 'nami-buds', 'minori-bath-salts', 'ampora-go-20k', 'tsukimi-trail-women', 'minori-marmalade-set', 'aoba-mini', 'kagami-tea-set', 'kaze-openear'],
  recentSeed: ['corvo-kettle', 'tetsuyu-gooseneck', 'seiran-headphones', 'minori-ponzu-set'],
};

// Lightning deals: the deal price is the price on the product page today.
export const deals = {
  lightning: [
    { id: 'northpine-packable', claimed: 87, ends: '12:00' },
    { id: 'seiran-headphones', claimed: 71, ends: '14:00' },
    { id: 'ampora-go-20k', claimed: 38, ends: '17:30' },
    { id: 'komekko-ih', claimed: 54, ends: '20:00' },
    { id: 'titancell-40k', claimed: 45, ends: '23:59' },
    { id: 'tetsuyu-gooseneck', claimed: 22, ends: '23:59' },
  ],
  dealOfDay: 'inaho-pressure',
  upcoming: [
    { id: 'nami-buds', price: 9980, starts: '18:00', member: '17:30' },
    { id: 'kestrel-27k', price: 8480, starts: '21:00', member: '20:30' },
  ],
};

// The mock order history ("Your orders") and tracking. Order numbers are fictional.
export const orders = [
  { no: '503-6630917-2241508', placed: '2026-10-03', total: 7900, shipTo: 'home', payment: 'card',
    items: [{ id: 'kagami-mug-pair', v: 'engraved', qty: 1, price: 7900 }],
    status: { en: 'Being made by the seller', ja: '出品者が制作中' },
    note: { en: 'Made to order. Kagami Kiln estimates dispatch between 26 and 30 October. Engraved items cannot be returned or cancelled after 4 October.', ja: '受注制作品です。鏡窯からの発送予定は10月26日〜30日です。名入れ商品は10月4日以降、キャンセル・返品ができません。' },
    actions: ['seller'] },
  { no: '503-2958114-7730126', placed: '2026-10-01', total: 6480, shipTo: 'home', payment: 'card', track: 'ship',
    items: [{ id: 'titancell-40k', v: null, qty: 1, price: 6480 }],
    status: { en: 'Delayed – now arriving Thursday 8 October', ja: '遅延 – 10月8日(木)にお届け予定' },
    note: { en: 'Originally expected Tuesday 6 October. Shipped by BrightDeal Trading with Seiun Express.', ja: '当初のお届け予定は10月6日(火)でした。ブライトディール商事より星雲急便で発送。' },
    actions: ['track', 'seller'] },
  { no: '503-8801245-0094471', placed: '2026-09-28', total: 3480, shipTo: 'home', payment: 'card', track: 'return',
    items: [{ id: 'drizzle-pro', v: 'grey-l', qty: 1, price: 3480 }],
    status: { en: 'Return in progress', ja: '返品手続き中' },
    note: { en: 'Return started 30 September (reason: item defective – seams leak). BrightDeal approved the return on 2 October and sent a prepaid label. Drop the parcel at a convenience store by 9 October. Refund of ¥3,480 to your card within 5 business days after the parcel reaches BrightDeal’s warehouse in Kobe.', ja: '9月30日に返品を受け付けました（理由：不良品 – 縫い目から浸水）。10月2日にブライトディール商事が返品を承認し、着払い伝票を発行しました。10月9日までにコンビニから発送してください。神戸の倉庫に到着後5営業日以内に、3,480円がカードに返金されます。' },
    actions: ['track', 'seller'] },
  { no: '503-1137760-5582093', placed: '2026-09-21', total: 4980, shipTo: 'home', payment: 'card', delivered: '2026-09-22',
    items: [{ id: 'hearth-kettle', v: '1-2l', qty: 1, price: 4980 }],
    status: { en: 'Delivered 22 September', ja: '9月22日にお届け済み' },
    note: { en: 'Return window open until 22 October 2026. Opened small appliances are refunded minus a 15% restocking fee unless faulty.', ja: '2026年10月22日まで返品可能です。開封済みの小型家電は、不良品を除き15%の返品手数料を差し引いて返金します。' },
    actions: ['return', 'review', 'again'] },
  { no: '503-4471902-3361128', placed: '2026-09-12', total: 4320, shipTo: 'parents', payment: 'card', delivered: '2026-09-15',
    items: [{ id: 'minori-ponzu-set', v: 'gift-box', qty: 1, price: 4320 }],
    status: { en: 'Delivered 15 September', ja: '9月15日にお届け済み' },
    note: { en: 'Gift order with noshi (御礼). Food items are not returnable unless they arrive damaged.', ja: 'のし（御礼）付きのギフト注文。食品は破損があった場合を除き返品できません。' },
    actions: ['review', 'again'] },
  { no: '503-9026671-1408755', placed: '2026-08-30', total: 24800, shipTo: 'home', payment: 'card', delivered: '2026-08-31',
    items: [{ id: 'seiran-headphones', v: 'grey', qty: 1, price: 24800 }],
    status: { en: 'Delivered 31 August', ja: '8月31日にお届け済み' },
    note: { en: 'Return window closed on 30 September. The 2-year Seiran warranty runs until 31 August 2028.', ja: '返品期間は9月30日に終了しました。セイランのメーカー保証（2年）は2028年8月31日まで有効です。' },
    actions: ['review', 'again', 'warranty'] },
  { no: '503-5512038-6670294', placed: '2026-08-25', total: 14800, shipTo: 'home', payment: 'konbini', cancelled: true,
    items: [{ id: 'komekko-ih', v: 'white', qty: 1, price: 14800 }],
    status: { en: 'Cancelled', ja: 'キャンセル済み' },
    note: { en: 'Cancelled automatically on 28 August: convenience-store payment was not received within 3 days. You were not charged.', ja: 'コンビニ払いの期限（3日）までにお支払いが確認できなかったため、8月28日に自動キャンセルされました。料金は発生していません。' },
    actions: ['again'] },
];

export const tracking = {
  ship: {
    order: '503-2958114-7730126', carrier: { en: 'Seiun Express', ja: '星雲急便' }, number: '4417-2290-8836',
    eta: { en: 'Thursday 8 October, 14:00–16:00', ja: '10月8日(木) 14:00〜16:00' },
    was: { en: 'Tuesday 6 October', ja: '10月6日(火)' },
    alert: { en: 'Your parcel is delayed. It is being held at the Harvest regional hub because of high parcel volume in Lantern Festival week. We now expect to deliver it on Thursday 8 October. If it has not arrived by Tuesday 13 October, you can claim a refund under Marketa Purchase Protection.', ja: '荷物が遅れています。灯籠まつり週間の荷物増加により、みのり地域ハブで保管されています。10月8日(木)にお届けする見込みです。10月13日(火)までに届かない場合は、マルケタ購入者保護で返金を申請できます。' },
    steps: [
      { t: '2026-10-01 21:14', done: true, en: ['Order placed', 'Payment confirmed (JCB •••• 4821)'], ja: ['ご注文受付', 'お支払い確認済み（JCB •••• 4821）'] },
      { t: '2026-10-02 11:02', done: true, en: ['Seller preparing your order', 'BrightDeal Trading, Kobe'], ja: ['出品者が発送準備中', 'ブライトディール商事（神戸）'] },
      { t: '2026-10-03 16:40', done: true, en: ['Shipped', 'Handed to Seiun Express, Kobe Port branch'], ja: ['発送済み', '星雲急便 神戸港営業所に引き渡し'] },
      { t: '2026-10-04 06:12', done: true, en: ['Arrived at regional hub', 'Harvest regional hub'], ja: ['地域ハブに到着', 'みのり地域ハブ'] },
      { t: '2026-10-05 08:30', done: true, warn: true, en: ['Delayed: held at hub', 'High parcel volume. New estimate: Thu 8 Oct'], ja: ['遅延：ハブで保管中', '荷物増加のため。新しいお届け予定：10月8日(木)'] },
      { t: '', done: false, en: ['Out for delivery', 'Seiun Express Springvale East depot'], ja: ['配達中', '星雲急便 春川東営業所'] },
      { t: '', done: false, en: ['Delivered', ''], ja: ['お届け完了', ''] },
    ],
    options: {
      en: ['Change to a Marketa Locker (Springvale Central Station, ground floor, east exit): parcel held 3 days', 'Leave at the door (置き配): choose a place such as the meter box', 'Change the time slot for 8 October (8–12, 14–16, 16–18, 18–20, 19–21)'],
      ja: ['マルケタロッカー（春川中央駅 1階 東口）での受け取りに変更：3日間保管', '置き配を指定：メーターボックスなど置き場所を選択', '10月8日の時間帯を変更（8–12、14–16、16–18、18–20、19–21時）'],
    },
  },
  return: {
    order: '503-8801245-0094471', carrier: { en: 'Seiun Express (prepaid return)', ja: '星雲急便（着払い返品）' }, number: 'RTN-7702-1185',
    eta: { en: 'Drop off by Friday 9 October', ja: '10月9日(金)までに発送' },
    steps: [
      { t: '2026-09-30 19:22', done: true, en: ['Return requested', 'Reason: item defective – seams leak at the shoulders'], ja: ['返品リクエスト', '理由：不良品 – 肩の縫い目から浸水'] },
      { t: '2026-10-02 15:47', done: true, en: ['Seller approved the return', 'Prepaid label sent by message (free return: defective item)'], ja: ['出品者が返品を承認', '着払い伝票をメッセージで送付（不良品のため送料無料）'] },
      { t: '', done: false, en: ['Drop off the parcel', 'Any convenience store with Seiun Express service, by 9 Oct'], ja: ['荷物を発送', '星雲急便取扱いのコンビニから、10月9日まで'] },
      { t: '', done: false, en: ['Received by the seller', 'BrightDeal warehouse, Kobe'], ja: ['出品者が受領', 'ブライトディール商事 神戸倉庫'] },
      { t: '', done: false, en: ['Refund issued: ¥3,480', 'To JCB •••• 4821, within 5 business days of receipt'], ja: ['返金：3,480円', 'JCB •••• 4821へ、受領後5営業日以内'] },
    ],
  },
};
