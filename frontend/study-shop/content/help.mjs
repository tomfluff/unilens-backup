// Marketa Help & Customer Service pages (English and Japanese).
// Shape: { id, title, intro, sections: [{ id, h, en, ja } | { id, h, faq: [{ q, a }] }] }.
// Every fee, time and limit here follows the Marketa content brief; keep them in step with the product pages.

const index = {
  id: 'index',
  title: { en: 'Help & Customer Service', ja: 'ヘルプ＆カスタマーサービス' },
  intro: {
    en: 'Answers about delivery, returns, Marketa Fast, payment and sellers, and every way to reach us. Most questions are answered on these pages; our chat team is here from 9:00 to 21:00 every day.',
    ja: 'お届け・返品・マルケタFast・お支払い・出品者についてのご案内と、お問い合わせ窓口のご案内です。多くのご質問はこちらのページで解決できます。チャットサポートは毎日9時～21時に対応しています。',
  },
  sections: [
    {
      id: 'notices',
      h: { en: 'Important notices (updated Mon 5 Oct 2026)', ja: '重要なお知らせ（2026年10月5日（月）更新）' },
      en: `<ul>
<li><strong>Lantern Festival Sale</strong> runs until <strong>Sun 11 Oct, 23:59</strong>. Lightning Deals change every day, and Marketa Fast members can buy each deal 30 minutes before everyone else. <a href="/en/deals.html">See today's deals</a>.</li>
<li><strong>Road closures in central Harukawa on Sat 10 and Sun 11 Oct</strong> for the Harukawa Lantern Festival. Afternoon and evening deliveries inside the closure area move to the next morning, and same-day delivery is not available there on those two days. <a href="/en/help/shipping.html#delays">Affected streets and times</a>.</li>
<li><strong>Typhoon season.</strong> When a storm warning is in force for your area, deliveries are paused until it is lifted. The latest date for each parcel is on <a href="/en/track.html">Track your package</a>.</li>
<li><strong>Sports Day, Mon 12 Oct (public holiday):</strong> Marketa delivers as usual, chat is open 9:00–21:00 and phone 9:00–18:00. Sellers who work on business days only, such as BrightDeal Trading, will reply from Tue 13 Oct.</li>
</ul>`,
      ja: `<ul>
<li><strong>灯籠まつりセール</strong>は<strong>10月11日（日）23:59まで</strong>。タイムセールの対象商品は毎日入れ替わります。マルケタFast会員は各タイムセールに30分早く参加できます。<a href="/ja/deals.html">本日のセール会場へ</a></li>
<li><strong>10月10日（土）・11日（日）は春川市中心部で交通規制があります</strong>（春川灯籠まつり）。規制区域内への午後・夜間のお届けは翌朝に変更となり、両日とも区域内への当日お届けはご利用いただけません。<a href="/ja/help/shipping.html#delays">規制区域と時間はこちら</a></li>
<li><strong>台風シーズンについて。</strong>お届け先に暴風警報が発表されている間は配達を見合わせ、解除後に順次再開します。最新のお届け予定日は<a href="/ja/track.html">配送状況の確認</a>でご確認いただけます。</li>
<li><strong>10月12日（月・スポーツの日）</strong>も通常どおりお届けします。チャットは9時～21時、お電話は9時～18時に受け付けます。ブライトディール商事など営業日のみ対応の出品者からの返信は、10月13日（火）以降となります。</li>
</ul>`,
    },
    {
      id: 'topics',
      h: { en: 'Browse help topics', ja: 'ヘルプトピック一覧' },
      en: `<ul>
<li><a href="/en/help/shipping.html"><strong>Shipping rates and delivery times</strong></a>: fees by region for members and non-members, order cut-off times, same-day and scheduled delivery, Marketa Lockers, large items, cool delivery, gift wrap, sellers that ship themselves, delays and redelivery.</li>
<li><a href="/en/help/returns.html"><strong>Returns and refunds</strong></a>: the 30-day rule, the 15% restocking fee for opened electronics, items that cannot be returned, who pays return shipping, how to send an item back and when your money arrives.</li>
<li><a href="/en/help/fast.html"><strong>Marketa Fast membership</strong></a>: ¥600 a month or ¥5,900 a year (students half price), what is free and what is not, the free trial and how to cancel.</li>
<li><a href="/en/help/payment.html"><strong>Payment methods</strong></a>: cards and instalments, Marketa Points, gift cards, convenience-store payment and its 3-day deadline, cash on delivery, Kumo Mobile carrier billing, failed payments.</li>
<li><a href="/en/help/faq.html"><strong>Frequently asked questions</strong></a>: 30 short answers to the questions we hear most.</li>
</ul>`,
      ja: `<ul>
<li><a href="/ja/help/shipping.html"><strong>配送料とお届け日数</strong></a>：地域別の配送料（会員・非会員）、ご注文の締め切り時刻、当日お届け・日時指定、マルケタロッカー、大型商品、クール便、ギフトラッピング、出品者発送の商品、遅延と再配達について。</li>
<li><a href="/ja/help/returns.html"><strong>返品・返金について</strong></a>：30日以内の返品条件、開封済み家電の返品手数料（15%）、返品できない商品、返送料のご負担、返品の手順、返金までの日数。</li>
<li><a href="/ja/help/fast.html"><strong>マルケタFast会員</strong></a>：月額600円／年額5,900円（学生は半額）、特典と対象外のもの、無料体験、解約について。</li>
<li><a href="/ja/help/payment.html"><strong>お支払い方法</strong></a>：クレジットカード・分割払い、マルケタポイント、ギフトカード、コンビニ払い（3日以内）、代金引換、クモモバイル キャリア決済、決済エラーについて。</li>
<li><a href="/ja/help/faq.html"><strong>よくあるご質問</strong></a>：お問い合わせの多い30のご質問にお答えします。</li>
</ul>`,
    },
    {
      id: 'popular',
      h: { en: 'Popular topics this week', ja: '今週よく見られているご質問' },
      en: `<ul>
<li><strong>Where is my order?</strong> Open <a href="/en/orders.html">Your Orders</a> and choose "Track package", or enter your tracking number on <a href="/en/track.html">Track your package</a>. Parcels from sellers that ship themselves have the seller's own tracking number.</li>
<li><strong>Will it arrive tomorrow?</strong> For items in stock at our Harukawa centre, order by <strong>14:00</strong> for next-day delivery in Harukawa city and the rest of Minori Prefecture (¥600, free for Fast members). Order by <strong>11:00</strong> for same-day delivery in Harukawa city, 18:00–22:00. <a href="/en/help/shipping.html#next-day">All cut-off times</a>.</li>
<li><strong>How much is delivery?</strong> Standard delivery in Harukawa city is ¥450, free on orders of ¥3,500 or more and always free for Fast members. Example: a ¥2,980 power bank costs ¥450 to ship; add a ¥980 refill and the order is free. <a href="/en/help/shipping.html#rates">Rates by region</a>.</li>
<li><strong>Can I return headphones I have opened?</strong> Over-ear and open-ear headphones: yes, within 30 days in like-new condition, minus a 15% restocking fee. In-ear earbuds: no, once the hygiene seal is broken (unless they are faulty). <a href="/en/help/returns.html#exceptions">Items that cannot be returned</a>.</li>
<li><strong>When will I get my refund?</strong> We inspect returns in 1–2 business days; cards are refunded 3–5 business days after that, Marketa Points immediately (with a 5% bonus). <a href="/en/help/returns.html#refund-timing">Refund times by payment method</a>.</li>
<li><strong>I chose convenience-store payment.</strong> Pay within 3 days or the order is cancelled. We ship only after your payment is confirmed. <a href="/en/help/payment.html#konbini">How it works</a>.</li>
<li><strong>How does the Fast free trial work?</strong> 30 days free (6 months for students with a university email address), once per account, and it becomes the ¥600 monthly plan unless you cancel. <a href="/en/help/fast.html#trial">Trial conditions</a>.</li>
<li><strong>A seller hasn't replied.</strong> If a seller that ships its own items does not answer within 2 business days, Marketa Purchase Protection can step in. <a href="/en/help/returns.html#protection">File a claim</a>.</li>
</ul>`,
      ja: `<ul>
<li><strong>注文した商品はどこ？</strong>　<a href="/ja/orders.html">注文履歴</a>から「配送状況を確認」を選ぶか、<a href="/ja/track.html">配送状況の確認</a>ページで追跡番号を入力してください。出品者から発送される商品は、出品者が手配した配送業者の追跡番号となります。</li>
<li><strong>明日届きますか？</strong>　マルケタ春川センターに在庫がある商品は、<strong>14時まで</strong>のご注文で春川市内・みのり県内に翌日お届けします（600円、Fast会員は無料）。春川市内は<strong>11時まで</strong>のご注文で当日18時～22時のお届けも可能です。<a href="/ja/help/shipping.html#next-day">締め切り時刻一覧</a></li>
<li><strong>配送料はいくら？</strong>　春川市内への通常配送は450円。3,500円以上のご注文で無料、Fast会員はいつでも無料です。例：2,980円のモバイルバッテリーだけなら配送料450円、980円の詰め替え用を一緒に買うと合計3,960円で無料になります。<a href="/ja/help/shipping.html#rates">地域別の配送料</a></li>
<li><strong>開封したヘッドホンは返品できますか？</strong>　オーバーイヤー型・オープンイヤー型は、30日以内・新品同様・付属品がすべてそろっている場合に限り、商品代金の15%の返品手数料を差し引いて返品を承ります。カナル型（インイヤー）イヤホンは、衛生シールをはがした時点で返品できません（初期不良を除く）。<a href="/ja/help/returns.html#exceptions">返品できない商品</a></li>
<li><strong>返金はいつ？</strong>　返品商品の到着後1～2営業日で検品し、クレジットカードはその後3～5営業日で返金します。マルケタポイントでの返金なら即時、しかも5%ボーナス付きです。<a href="/ja/help/returns.html#refund-timing">お支払い方法別の返金時期</a></li>
<li><strong>コンビニ払いを選びました。</strong>　ご注文から3日以内にお支払いください。期限を過ぎるとご注文は自動でキャンセルされます。発送はご入金確認後です。<a href="/ja/help/payment.html#konbini">詳しくはこちら</a></li>
<li><strong>Fastの無料体験の条件は？</strong>　30日間無料（大学のメールアドレスをお持ちの学生は6か月）、1アカウントにつき1回まで。解約しない場合は月額600円のプランに自動で移行します。<a href="/ja/help/fast.html#trial">無料体験の条件</a></li>
<li><strong>出品者から返事が来ません。</strong>　出品者発送の商品で、2営業日以内に出品者から返信がない場合は「マルケタ購入者保護」をご利用いただけます。<a href="/ja/help/returns.html#protection">申請方法</a></li>
</ul>`,
    },
    {
      id: 'orders',
      h: { en: 'Manage an order yourself', ja: 'ご自身でできる注文の手続き' },
      en: `<p>Most changes can be made in <a href="/en/orders.html">Your Orders</a> without contacting us. What you can still change depends on the order's status.</p>
<table>
<thead><tr><th>What you want to do</th><th>Before dispatch ("Preparing")</th><th>After dispatch ("Shipped")</th></tr></thead>
<tbody>
<tr><td>Cancel the order or one item</td><td>Yes, free, in Your Orders</td><td>No: refuse the delivery or return it within 30 days</td></tr>
<tr><td>Change the delivery address</td><td>Yes, to any address (the delivery date may change)</td><td>Only redirect to a Marketa Locker or another address in the same city, on <a href="/en/track.html">Track your package</a></td></tr>
<tr><td>Change the delivery date or time slot</td><td>Yes (scheduled-delivery fee ¥350, free for Fast members)</td><td>Yes, on Track your package, free</td></tr>
<tr><td>Change the payment method</td><td>Yes, except orders paid at a convenience store after you have paid</td><td>No</td></tr>
<tr><td>Add gift wrap or a noshi</td><td>Yes, until 1 hour after ordering</td><td>No</td></tr>
<tr><td>Get a receipt (領収書) or invoice</td><td colspan="2">Any time after dispatch: Your Orders &gt; "Receipt". You can enter the name to address it to.</td></tr>
</tbody>
</table>
<p><small>Items from sellers that ship themselves (for example Kagami Kiln or BrightDeal Trading) can be cancelled only until the seller marks them as shipped; after that, contact the seller from Your Orders.</small></p>`,
      ja: `<p>多くの手続きは、お問い合わせいただかなくても<a href="/ja/orders.html">注文履歴</a>から行えます。変更できる内容は、ご注文のステータスによって異なります。</p>
<table>
<thead><tr><th>お手続き</th><th>発送前（「発送準備中」）</th><th>発送後（「発送済み」）</th></tr></thead>
<tbody>
<tr><td>注文全体・一部商品のキャンセル</td><td>可能（無料）。注文履歴から手続きできます</td><td>不可。受け取りを辞退するか、30日以内に返品してください</td></tr>
<tr><td>お届け先の変更</td><td>可能（お届け日が変わる場合があります）</td><td><a href="/ja/track.html">配送状況の確認</a>から、マルケタロッカーまたは同じ市区町村内の別住所への転送のみ可能</td></tr>
<tr><td>お届け日・時間帯の変更</td><td>可能（日時指定料350円、Fast会員は無料）</td><td>配送状況の確認ページから無料で変更できます</td></tr>
<tr><td>お支払い方法の変更</td><td>可能（コンビニ払いでお支払い済みの場合を除く）</td><td>不可</td></tr>
<tr><td>ギフトラッピング・のしの追加</td><td>ご注文後1時間以内なら可能</td><td>不可</td></tr>
<tr><td>領収書・請求書の発行</td><td colspan="2">発送後いつでも、注文履歴の「領収書」から発行できます。宛名もご指定いただけます。</td></tr>
</tbody>
</table>
<p><small>出品者が発送する商品（鏡窯、ブライトディール商事など）は、出品者が「発送済み」にするまでキャンセルできます。発送後は、注文履歴から出品者へお問い合わせください。</small></p>`,
    },
    {
      id: 'contact',
      h: { en: 'Contact us', ja: 'お問い合わせ窓口' },
      en: `<table>
<thead><tr><th>Channel</th><th>Hours</th><th>Best for</th><th>Notes</th></tr></thead>
<tbody>
<tr><td><strong>Chat</strong> (Help &gt; "Chat with us", or from an order)</td><td>9:00–21:00 every day, including weekends and public holidays</td><td>Delivery problems, returns, refunds, changing an order</td><td>Usual wait about 2 minutes; up to 10 minutes during the Lantern Festival Sale and after 19:00. English and Japanese.</td></tr>
<tr><td><strong>Phone</strong> 0120-555-818 (free from mobiles and landlines)</td><td>9:00–18:00 every day (closed 1–3 Jan)</td><td>Marketa Fast membership, payment problems, anything urgent</td><td>English: press 2, weekdays 10:00–17:00. Calls are recorded for quality.</td></tr>
<tr><td><strong>Message form</strong></td><td>24 hours</td><td>Non-urgent questions, sending photos of damage</td><td>We reply within 24 hours (48 hours at weekends).</td></tr>
<tr><td><strong>Seller messages</strong> (Your Orders &gt; "Contact seller")</td><td>The seller's own hours</td><td>Items from sellers that ship themselves</td><td>Kagami Kiln: Mon–Sat 9:00–17:00. Minori Yuzu Farm: Mon–Sat 8:00–17:00. BrightDeal Trading: weekdays 10:00–17:00, messages only.</td></tr>
</tbody>
</table>
<p>Please have your <strong>order number</strong> ready (12 digits, for example 261005-4821-0937). It is in your confirmation email and in <a href="/en/orders.html">Your Orders</a>.</p>
<p><small>We will never ask for your card number, PIN or password by phone, chat or email. Marketa's phone number is 0120-555-818 only; if someone calls you from another number about "a problem with your Marketa order", hang up and contact us here.</small></p>`,
      ja: `<table>
<thead><tr><th>窓口</th><th>受付時間</th><th>こんなときに</th><th>備考</th></tr></thead>
<tbody>
<tr><td><strong>チャット</strong>（ヘルプ＞「チャットで問い合わせる」、または注文履歴から）</td><td>毎日9:00～21:00（土日祝も対応）</td><td>配送のトラブル、返品・返金、ご注文の変更</td><td>通常の待ち時間は約2分。灯籠まつりセール期間中や19時以降は最大10分ほどお待たせする場合があります。日本語・英語に対応。</td></tr>
<tr><td><strong>お電話</strong> 0120-555-818（通話料無料・携帯電話からもOK）</td><td>毎日9:00～18:00（1月1日～3日を除く）</td><td>マルケタFast会員について、お支払いのトラブル、お急ぎのご用件</td><td>英語対応は平日10:00～17:00（ガイダンスで2番）。品質向上のため通話を録音しています。</td></tr>
<tr><td><strong>お問い合わせフォーム</strong></td><td>24時間受付</td><td>お急ぎでないご質問、破損の写真の送付</td><td>24時間以内（土日は48時間以内）にご返信します。</td></tr>
<tr><td><strong>出品者へのメッセージ</strong>（注文履歴＞「出品者に問い合わせる」）</td><td>各出品者の営業時間</td><td>出品者が発送する商品について</td><td>鏡窯：月～土 9:00～17:00／みのり柚子園：月～土 8:00～17:00／ブライトディール商事：平日10:00～17:00（メッセージのみ）</td></tr>
</tbody>
</table>
<p>お問い合わせの際は<strong>注文番号</strong>（12桁。例：261005-4821-0937）をお手元にご用意ください。注文確認メールと<a href="/ja/orders.html">注文履歴</a>に記載されています。</p>
<p><small>マルケタがお電話・チャット・メールでカード番号、暗証番号、パスワードをおたずねすることはありません。マルケタの電話番号は0120-555-818のみです。それ以外の番号から「ご注文に問題がある」といった電話があった場合は、すぐに切って、こちらの窓口までご連絡ください。</small></p>`,
    },
  ],
};

const shipping = {
  id: 'shipping',
  title: { en: 'Shipping rates and delivery times', ja: '配送料とお届け日数' },
  intro: {
    en: 'Fees and delivery times for items shipped by Marketa from our Harukawa fulfilment centre (HRK1, Minori Port), by region and delivery speed, for Marketa Fast members and non-members. Items that sellers ship themselves follow the seller’s own fees and times.',
    ja: 'マルケタ春川フルフィルメントセンター（HRK1・みのり港）から発送する商品の配送料とお届け日数を、地域・配送方法・Fast会員/非会員別にご案内します。出品者が発送する商品は、各出品者の配送料・お届け日数となります。',
  },
  sections: [
    {
      id: 'overview',
      h: { en: 'Delivery at a glance', ja: 'お届けの基本' },
      en: `<p>Almost everything on Marketa is stored at <strong>HRK1</strong>, our fulfilment centre at Minori Port in Harukawa, and some items at Marketa warehouses outside Minori Prefecture. The delivery date shown on the product page and at checkout already takes your address, the time you order and the item's warehouse into account: it is the date we commit to.</p>
<ul>
<li><strong>Ships from Marketa</strong> (sold by Marketa, or "Sold by <em>seller</em>, ships from Marketa"): the fees and times on this page apply and the items are Fast-eligible.</li>
<li><strong>Ships from the seller</strong> (Kagami Kiln, BrightDeal Trading, most Minori Yuzu Farm items and others): the seller's own fees and times apply. <a href="#sellers">See below</a>.</li>
<li>We deliver every day, including Sundays and public holidays (Sports Day, Mon 12 Oct, too).</li>
<li>Times in the tables are counted from dispatch. Standard orders usually leave HRK1 the next day; next-day and same-day orders leave the same day.</li>
</ul>
<p>What that means for an order placed <strong>today, Mon 5 Oct, to an address in Harukawa city</strong>:</p>
<table>
<thead><tr><th>Where the item ships from</th><th>Marketa Fast member</th><th>Not a member</th></tr></thead>
<tbody>
<tr><td>In stock at HRK1 (e.g. <a href="/en/p/corvo-kettle.html">Corvo Kettle</a>, Silver, ¥3,980)</td><td><strong>Tue 6 Oct</strong>, free (order by 14:00)</td><td>Thu 8 Oct, free on orders of ¥3,500 or more (otherwise ¥450), or Tue 6 Oct for ¥600</td></tr>
<tr><td>Marketa warehouse outside Minori Prefecture (e.g. Corvo Kettle, Matte Black)</td><td>Thu 8 Oct, free</td><td>Sat 10 Oct, standard rates</td></tr>
<tr><td>Kagami Kiln</td><td colspan="2">Thu 8 – Fri 9 Oct, ¥700 (free on Kagami Kiln orders of ¥5,000 or more)</td></tr>
<tr><td>Kagami Kiln, made to order</td><td colspan="2">Dispatched in 3–4 weeks, arrives about 2–9 Nov</td></tr>
<tr><td>Minori Yuzu Farm</td><td colspan="2">Wed 7 – Thu 8 Oct, ¥600 (free on farm orders of ¥4,000 or more)</td></tr>
<tr><td>BrightDeal Trading (Kobe)</td><td colspan="2">Fri 9 – Tue 13 Oct, free</td></tr>
</tbody>
</table>
<p><small>Fees include consumption tax. Delivery fees are charged once per delivery address per order, not per item.</small></p>`,
      ja: `<p>マルケタの商品の大半は、春川市みのり港にある<strong>HRK1（マルケタ春川フルフィルメントセンター）</strong>に、一部はみのり県外のマルケタ倉庫に在庫しています。商品ページとご注文手続き画面に表示されるお届け予定日は、お届け先・ご注文時刻・在庫倉庫をもとに計算したもので、マルケタがお約束するお届け日です。</p>
<ul>
<li><strong>マルケタ発送の商品</strong>（販売：マルケタ、または「販売：○○／発送：マルケタ」）：このページの配送料・お届け日数が適用され、Fast対象商品となります。</li>
<li><strong>出品者発送の商品</strong>（鏡窯、ブライトディール商事、みのり柚子園の大半の商品など）：各出品者の配送料・お届け日数が適用されます。<a href="#sellers">詳しくは下記</a>をご覧ください。</li>
<li>日曜・祝日も毎日配達しています（10月12日（月・スポーツの日）も通常どおり）。</li>
<li>表のお届け日数は発送日からの日数です。通常配送は原則ご注文の翌日、翌日配送・当日配送はご注文当日にHRK1から発送します。</li>
</ul>
<p><strong>本日10月5日（月）に春川市内のお届け先でご注文の場合</strong>のお届け予定は次のとおりです。</p>
<table>
<thead><tr><th>発送元</th><th>マルケタFast会員</th><th>非会員</th></tr></thead>
<tbody>
<tr><td>HRK1に在庫あり（例：<a href="/ja/p/corvo-kettle.html">コルヴォ 電気ケトル</a> シルバー 3,980円）</td><td><strong>10月6日（火）</strong>無料（14時までのご注文）</td><td>10月8日（木）。3,500円以上のご注文で無料（未満は450円）。600円で10月6日（火）お届けも可</td></tr>
<tr><td>みのり県外のマルケタ倉庫（例：コルヴォ 電気ケトル マットブラック）</td><td>10月8日（木）無料</td><td>10月10日（土）、通常の配送料</td></tr>
<tr><td>鏡窯</td><td colspan="2">10月8日（木）～9日（金）、700円（鏡窯の商品5,000円以上で無料）</td></tr>
<tr><td>鏡窯（受注制作品）</td><td colspan="2">3～4週間後に発送、11月2日～9日ごろお届け</td></tr>
<tr><td>みのり柚子園</td><td colspan="2">10月7日（水）～8日（木）、600円（同園の商品4,000円以上で無料）</td></tr>
<tr><td>ブライトディール商事（神戸）</td><td colspan="2">10月9日（金）～13日（火）、送料無料</td></tr>
</tbody>
</table>
<p><small>表示の料金はすべて税込です。配送料は商品ごとではなく、1回のご注文・1つのお届け先ごとにかかります。</small></p>`,
    },
    {
      id: 'rates',
      h: { en: 'Standard delivery: fees and times by region', ja: '通常配送：地域別の配送料とお届け日数' },
      en: `<table>
<thead><tr><th>Delivery region</th><th>Delivery time (after dispatch)</th><th>Fee, non-members</th><th>Free for non-members</th><th>Marketa Fast members</th></tr></thead>
<tbody>
<tr><td>Harukawa city</td><td>1–2 days</td><td>¥450</td><td>Orders of ¥3,500 or more</td><td>Always free</td></tr>
<tr><td>Rest of Minori Prefecture</td><td>2–3 days</td><td>¥450</td><td>Orders of ¥3,500 or more</td><td>Always free</td></tr>
<tr><td>Neighbouring prefectures</td><td>2–3 days</td><td>¥550</td><td>Orders of ¥3,500 or more</td><td>Always free</td></tr>
<tr><td>Rest of Honshu, Shikoku and Kyushu</td><td>3–4 days</td><td>¥550</td><td>Orders of ¥3,500 or more</td><td>Always free</td></tr>
<tr><td>Hokkaido and Okinawa</td><td>4–7 days</td><td>¥990</td><td>Orders of ¥3,500 or more</td><td>Always free</td></tr>
<tr><td>Remote islands</td><td>4–7 days</td><td>¥990 + ¥550 remote-island surcharge</td><td>Orders of ¥3,500 or more, but the ¥550 surcharge still applies</td><td>Free, but the ¥550 surcharge still applies</td></tr>
</tbody>
</table>
<p><strong>Examples</strong></p>
<ul>
<li>A ¥2,980 order (an <a href="/en/p/ampora-slim-10k.html">Ampora Slim 10K</a> power bank) to Harukawa city: <strong>¥450</strong> standard. Add anything that brings the order to ¥3,500 and standard delivery is free.</li>
<li>The same ¥2,980 order to Kyushu: ¥550. To Hokkaido: ¥990. To a remote island: ¥990 + ¥550 = <strong>¥1,540</strong>.</li>
<li>A ¥4,980 <a href="/en/p/hearth-kettle.html">Hearth kettle</a> to a remote island: the delivery is free (over ¥3,500) but the <strong>¥550</strong> surcharge is charged, for Fast members too.</li>
</ul>
<p><small>The ¥3,500 threshold counts the items shipped by Marketa in one order to one address, after coupons and before Marketa Points; gift wrap and other fees do not count, and neither do items that sellers ship themselves. "Remote islands" are islands without a road bridge to Honshu, Hokkaido, Shikoku, Kyushu or Okinawa Island; checkout tells you from your postcode. If you cancel part of an order and it drops below ¥3,500, the free delivery stays.</small></p>`,
      ja: `<table>
<thead><tr><th>お届け地域</th><th>お届け日数（発送後）</th><th>配送料（非会員）</th><th>非会員の送料無料条件</th><th>マルケタFast会員</th></tr></thead>
<tbody>
<tr><td>春川市内</td><td>1～2日</td><td>450円</td><td>3,500円以上のご注文</td><td>いつでも無料</td></tr>
<tr><td>みのり県内（春川市を除く）</td><td>2～3日</td><td>450円</td><td>3,500円以上のご注文</td><td>いつでも無料</td></tr>
<tr><td>隣接県</td><td>2～3日</td><td>550円</td><td>3,500円以上のご注文</td><td>いつでも無料</td></tr>
<tr><td>その他の本州・四国・九州</td><td>3～4日</td><td>550円</td><td>3,500円以上のご注文</td><td>いつでも無料</td></tr>
<tr><td>北海道・沖縄</td><td>4～7日</td><td>990円</td><td>3,500円以上のご注文</td><td>いつでも無料</td></tr>
<tr><td>離島</td><td>4～7日</td><td>990円＋離島手数料550円</td><td>3,500円以上で無料。ただし離島手数料550円はかかります</td><td>無料。ただし離島手数料550円はかかります</td></tr>
</tbody>
</table>
<p><strong>計算例</strong></p>
<ul>
<li>2,980円のご注文（<a href="/ja/p/ampora-slim-10k.html">アンポラ スリム10K</a> モバイルバッテリー）を春川市内へ：通常配送料<strong>450円</strong>。合計3,500円以上になるよう商品を追加すると無料になります。</li>
<li>同じ2,980円のご注文を九州へ：550円。北海道へ：990円。離島へ：990円＋550円＝<strong>1,540円</strong>。</li>
<li>4,980円の<a href="/ja/p/hearth-kettle.html">ハース 電気ケトル</a>を離島へ：配送料は無料（3,500円以上）ですが、離島手数料<strong>550円</strong>がかかります（Fast会員も同様）。</li>
</ul>
<p><small>3,500円の判定は、1回のご注文で同じお届け先へマルケタが発送する商品の合計額（クーポン適用後・ポイント利用前）で行います。ギフトラッピング代などの手数料や、出品者が発送する商品は含みません。「離島」とは、本州・北海道・四国・九州・沖縄本島と道路でつながっていない島を指します。郵便番号から自動で判定し、ご注文手続き画面に表示します。一部キャンセルで合計が3,500円を下回っても、送料無料はそのまま適用されます。</small></p>`,
    },
    {
      id: 'next-day',
      h: { en: 'Next-day delivery and order cut-off times', ja: '翌日配送と注文締め切り時刻' },
      en: `<p>Next-day delivery is available for items <strong>in stock at HRK1</strong> (the product page says "Arrives tomorrow"). Order by the cut-off time for your region:</p>
<table>
<thead><tr><th>Delivery region</th><th>Order by</th><th>Fee, non-members</th><th>Marketa Fast members</th></tr></thead>
<tbody>
<tr><td>Harukawa city</td><td>14:00</td><td>¥600</td><td>Free on Fast-eligible items, no minimum order</td></tr>
<tr><td>Rest of Minori Prefecture</td><td>14:00</td><td>¥600</td><td>Free</td></tr>
<tr><td>Neighbouring prefectures</td><td>12:00</td><td>¥600</td><td>Free</td></tr>
<tr><td>Rest of Honshu, Shikoku and Kyushu</td><td>10:00 (some mountain areas excluded)</td><td>¥800</td><td>Free</td></tr>
<tr><td>Hokkaido, Okinawa and remote islands</td><td colspan="3">Not available: standard delivery only (4–7 days)</td></tr>
</tbody>
</table>
<ul>
<li>The next-day fee replaces the standard fee; it is charged even on orders of ¥3,500 or more, because only standard delivery becomes free.</li>
<li>Ordered after the cut-off? Next-day delivery becomes the day after tomorrow. Example: at 10:40 the 10:00 cut-off for the rest of Honshu has passed, so a next-day order to Tokyo placed now arrives Wed 7 Oct.</li>
<li>Items at Marketa warehouses outside Minori Prefecture cannot come next day to Harukawa. With Fast they arrive in about 3 days (order Mon, arrive Thu); by standard delivery in about 5 days (Sat).</li>
<li>If you pay at a convenience store or by Pay-easy, the cut-off applies to the time your payment is confirmed, not the time you ordered.</li>
</ul>
<p><small>"Some mountain areas" are postcodes our carrier serves only every other day; checkout shows whether yours is one. Next-day delivery to Marketa Lockers works the same way and costs the same.</small></p>`,
      ja: `<p>翌日配送は、<strong>HRK1に在庫がある商品</strong>（商品ページに「明日お届け」と表示）が対象です。お届け地域ごとの締め切り時刻までにご注文ください。</p>
<table>
<thead><tr><th>お届け地域</th><th>注文締め切り</th><th>配送料（非会員）</th><th>マルケタFast会員</th></tr></thead>
<tbody>
<tr><td>春川市内</td><td>14:00</td><td>600円</td><td>Fast対象商品は無料（最低注文金額なし）</td></tr>
<tr><td>みのり県内（春川市を除く）</td><td>14:00</td><td>600円</td><td>無料</td></tr>
<tr><td>隣接県</td><td>12:00</td><td>600円</td><td>無料</td></tr>
<tr><td>その他の本州・四国・九州</td><td>10:00（一部山間部を除く）</td><td>800円</td><td>無料</td></tr>
<tr><td>北海道・沖縄・離島</td><td colspan="3">翌日配送はご利用いただけません（通常配送のみ・4～7日）</td></tr>
</tbody>
</table>
<ul>
<li>翌日配送料は通常配送料の代わりにかかります。3,500円以上で無料になるのは通常配送のみのため、3,500円以上のご注文でも翌日配送料はかかります。</li>
<li>締め切り後のご注文は、翌々日のお届けとなります。例：10時40分の時点で「その他の本州」の締め切り（10時）を過ぎているため、今から東京へ翌日配送で注文すると10月7日（水）のお届けです。</li>
<li>みのり県外のマルケタ倉庫にある商品は、春川市内へ翌日にはお届けできません。Fast会員は約3日（月曜注文→木曜）、通常配送では約5日（土曜）でお届けします。</li>
<li>コンビニ払い・ペイジーの場合は、ご注文時刻ではなくご入金の確認時刻で締め切りを判定します。</li>
</ul>
<p><small>「一部山間部」とは、配送業者の配達が隔日となる地域です。該当するかどうかはご注文手続き画面に表示されます。マルケタロッカーへの翌日配送も、同じ条件・料金でご利用いただけます。</small></p>`,
    },
    {
      id: 'same-day',
      h: { en: 'Same-day delivery (Harukawa city only)', ja: '当日お届け（春川市内のみ）' },
      en: `<ul>
<li><strong>Where:</strong> addresses in Harukawa city only.</li>
<li><strong>Order by 11:00</strong>; delivered the same evening between <strong>18:00 and 22:00</strong>.</li>
<li><strong>Fee:</strong> ¥900 for non-members. Marketa Fast members: free on orders of ¥2,000 or more, ¥300 below that.</li>
<li><strong>Which items:</strong> items in stock at HRK1 marked "Today" at checkout. Not available for large items, cool delivery, Marketa Lockers, or items that sellers ship themselves.</li>
</ul>
<p><strong>Examples (today, Mon 5 Oct):</strong> order a <a href="/en/p/komekko-ih.html">Komekko IH Rice Cooker</a> (¥14,800) before 11:00 and it arrives tonight between 18:00 and 22:00: ¥900, or free for a Fast member. A Fast member ordering only a 12-packet box of <a href="/en/p/yumeguri-onsen-powder.html">Yumeguri bath powder</a> (¥1,100) pays ¥300.</p>
<p><small>On Sat 10 and Sun 11 Oct, same-day delivery is not available inside the Lantern Festival closure area (see <a href="#delays">Delivery delays</a>). If we miss the 18:00–22:00 window, the same-day fee is refunded automatically.</small></p>`,
      ja: `<ul>
<li><strong>対象地域：</strong>春川市内のお届け先のみ</li>
<li><strong>11時までのご注文</strong>で、当日<strong>18時～22時</strong>にお届けします。</li>
<li><strong>料金：</strong>非会員900円。マルケタFast会員は2,000円以上のご注文で無料、2,000円未満は300円。</li>
<li><strong>対象商品：</strong>HRK1に在庫があり、ご注文手続き画面で「今日」と表示される商品。大型商品、クール便、マルケタロッカー受取、出品者発送の商品は対象外です。</li>
</ul>
<p><strong>例（本日10月5日（月））：</strong><a href="/ja/p/komekko-ih.html">コメッコ IH炊飯器</a>（14,800円）を11時までにご注文いただくと、今夜18時～22時にお届けします。料金は900円、Fast会員は無料です。Fast会員が<a href="/ja/p/yumeguri-onsen-powder.html">湯めぐり 月見温泉 入浴剤</a> 12包（1,100円）だけをご注文の場合は300円となります。</p>
<p><small>10月10日（土）・11日（日）は、灯籠まつりの交通規制区域内への当日お届けはご利用いただけません（<a href="#delays">配送の遅延について</a>参照）。18時～22時にお届けできなかった場合は、当日お届け料を自動で返金します。</small></p>`,
    },
    {
      id: 'scheduled',
      h: { en: 'Scheduled delivery (choose a date and time)', ja: 'お届け日時指定' },
      en: `<p>Choose a delivery date up to <strong>7 days ahead</strong> (ordering today, Mon 5 Oct, you can choose any day up to Mon 12 Oct) and one of these time slots:</p>
<table>
<thead><tr><th>Time slot</th><th>Good to know</th></tr></thead>
<tbody>
<tr><td>8:00–12:00</td><td>Morning. The only slot available inside the Lantern Festival closure area on 10–11 Oct.</td></tr>
<tr><td>14:00–16:00</td><td></td></tr>
<tr><td>16:00–18:00</td><td></td></tr>
<tr><td>18:00–20:00</td><td>Overlaps the next slot; choose whichever suits you.</td></tr>
<tr><td>19:00–21:00</td><td>Latest slot. Change it on the day until 17:00.</td></tr>
</tbody>
</table>
<p><strong>Fee:</strong> ¥350 per order, <strong>free for Marketa Fast members</strong>. The earliest date you can pick is the normal delivery date for your speed and region. Scheduled delivery is for items shipped by Marketa to a home or office address (not lockers). You can change the date or slot free of charge on <a href="/en/track.html">Track your package</a> until 17:00 on the day.</p>`,
      ja: `<p>お届け日は<strong>7日先まで</strong>ご指定いただけます（本日10月5日（月）のご注文なら10月12日（月）まで）。時間帯は次からお選びください。</p>
<table>
<thead><tr><th>時間帯</th><th>補足</th></tr></thead>
<tbody>
<tr><td>8時～12時</td><td>午前中。10月10日・11日の灯籠まつり交通規制区域内は、この時間帯のみご指定いただけます。</td></tr>
<tr><td>14時～16時</td><td></td></tr>
<tr><td>16時～18時</td><td></td></tr>
<tr><td>18時～20時</td><td>次の時間帯と一部重なります。ご都合のよいほうをお選びください。</td></tr>
<tr><td>19時～21時</td><td>最終の時間帯です。当日17時まで変更できます。</td></tr>
</tbody>
</table>
<p><strong>料金：</strong>1回のご注文につき350円、<strong>マルケタFast会員は無料</strong>。ご指定いただける最短日は、配送方法・地域ごとの通常のお届け日です。日時指定は、マルケタが発送する商品をご自宅・勤務先などへお届けする場合にご利用いただけます（ロッカー受取は対象外）。お届け日・時間帯は、<a href="/ja/track.html">配送状況の確認</a>から当日17時まで無料で変更できます。</p>`,
    },
    {
      id: 'lockers',
      h: { en: 'Marketa Lockers and convenience-store pick-up', ja: 'マルケタロッカー・コンビニ受取' },
      en: `<p>Pick your parcel up when it suits you. <strong>Standard delivery to a locker or convenience store is always free</strong>, whatever the order total.</p>
<table>
<thead><tr><th>Pick-up point</th><th>Where exactly</th><th>Open</th></tr></thead>
<tbody>
<tr><td>Marketa Locker, Harukawa Central Station</td><td>Station concourse, beside the Kagami Line ticket gates (east exit side)</td><td>5:00–24:30 every day</td></tr>
<tr><td>Marketa Locker, Minori Port Station</td><td>Bayside Line station, ground floor next to the ticket gates</td><td>5:30–24:00 every day</td></tr>
<tr><td>Marketa Locker, Harukawa University co-op</td><td>Main campus, co-op building 1F (open to the public)</td><td>Weekdays 8:30–20:00, Sat 10:00–16:00, closed Sun and public holidays</td></tr>
<tr><td>38 convenience stores</td><td>29 in Harukawa city (e.g. near Harukawa Castle, in Kamagaoka and by Harukawa University) and 9 elsewhere in Minori Prefecture (incl. Tsukimi Onsen station)</td><td>Most open 24 hours; collect at the counter</td></tr>
</tbody>
</table>
<ul>
<li><strong>Held for 3 days</strong> from the "ready for pick-up" email. Days when the university co-op is closed do not count. Parcels not collected go back to HRK1 and are refunded in full; no delivery fee is charged.</li>
<li><strong>Size limit:</strong> 45 × 35 × 30 cm and 10 kg per parcel. If your order does not fit, the locker option does not appear at checkout.</li>
<li><strong>Not available</strong> for cool delivery, cash on delivery, large items, same-day or scheduled delivery, or items that sellers ship themselves.</li>
<li>Next-day delivery to a locker works with the usual next-day cut-offs and fees (free for Fast members on Fast-eligible items).</li>
<li>To collect, scan the QR code from your email at the locker, or enter the 6-digit PIN. At a convenience store, show the QR code at the counter; no ID is needed.</li>
</ul>`,
      ja: `<p>ご都合のよいときに受け取れます。<strong>ロッカー・コンビニ受取の通常配送は、ご注文金額にかかわらずいつでも無料</strong>です。</p>
<table>
<thead><tr><th>受取場所</th><th>設置場所</th><th>利用時間</th></tr></thead>
<tbody>
<tr><td>マルケタロッカー 春川中央駅</td><td>駅コンコース、鏡線改札横（東口側）</td><td>毎日5:00～24:30</td></tr>
<tr><td>マルケタロッカー みのり港駅</td><td>湾岸線みのり港駅1階、改札横</td><td>毎日5:30～24:00</td></tr>
<tr><td>マルケタロッカー 春川大学生協</td><td>本部キャンパス 生協会館1階（一般の方もご利用可）</td><td>平日8:30～20:00、土曜10:00～16:00、日曜・祝日休み</td></tr>
<tr><td>コンビニ38店舗</td><td>春川市内29店舗（春川城周辺、窯ヶ丘、春川大学近くなど）、みのり県内のその他地域9店舗（月見温泉駅前を含む）</td><td>ほとんどの店舗が24時間営業。レジでお受け取りください</td></tr>
</tbody>
</table>
<ul>
<li><strong>保管期間は3日間</strong>（「受取準備完了」メールの送信時から）。生協の休業日は日数に含みません。期間内に受け取られなかった荷物はHRK1へ返送し、全額返金します。配送料はかかりません。</li>
<li><strong>サイズ上限：</strong>1個口あたり45×35×30cm・10kgまで。収まらないご注文では、手続き画面に受取場所の選択肢が表示されません。</li>
<li>クール便、代金引換、大型商品、当日お届け、日時指定、出品者発送の商品は<strong>ご利用いただけません</strong>。</li>
<li>ロッカーへの翌日配送は、通常の締め切り時刻・料金でご利用いただけます（Fast会員はFast対象商品なら無料）。</li>
<li>ロッカーではメールのQRコードをかざすか、6桁の暗証番号を入力してください。コンビニではレジでQRコードをご提示ください。身分証は不要です。</li>
</ul>`,
    },
    {
      id: 'large-cool',
      h: { en: 'Large items, cool delivery and cash on delivery', ja: '大型商品・クール便・代金引換' },
      en: `<table>
<thead><tr><th>Service</th><th>Fee</th><th>Covered by Marketa Fast?</th><th>Conditions</th></tr></thead>
<tbody>
<tr><td>Large-item surcharge</td><td>¥1,100 per item</td><td>No, members pay it too</td><td>Packed size over 160 cm (length + width + height) or over 25 kg. Home delivery only.</td></tr>
<tr><td>Cool (chilled) delivery</td><td>+¥330 per box</td><td>No</td><td>Chilled items come in their own box at 0–10 °C. Not to lockers or convenience stores, not same-day, not with cash on delivery.</td></tr>
<tr><td>Cash on delivery</td><td>¥330 per order</td><td>No</td><td>Up to ¥300,000. Not for lockers, cool delivery or items that sellers ship themselves. See <a href="/en/help/payment.html#cod">Payment</a>.</td></tr>
</tbody>
</table>
<p><strong>Examples:</strong> a 30 kg bag of rice is a large item: ¥1,100 on top of the normal delivery fee (which is free over ¥3,500 or for Fast members). A box measuring 70 × 50 × 45 cm adds up to 165 cm and is also a large item. An order with two chilled gift boxes packed separately pays 2 × ¥330 = ¥660 cool-delivery fees.</p>
<p><small>The product page shows "Large item" or "Cool delivery" next to the delivery date when these apply. Returning a large item for change of mind costs ¥1,100 instead of ¥550.</small></p>`,
      ja: `<table>
<thead><tr><th>サービス</th><th>料金</th><th>マルケタFastの特典対象</th><th>条件</th></tr></thead>
<tbody>
<tr><td>大型商品手数料</td><td>1点につき1,100円</td><td>対象外（会員もかかります）</td><td>梱包サイズが3辺合計160cm超、または重さ25kg超の商品。ご自宅等へのお届けのみ。</td></tr>
<tr><td>クール便（冷蔵）</td><td>1箱につき＋330円</td><td>対象外</td><td>冷蔵品は0～10℃の専用箱でお届けします。ロッカー・コンビニ受取、当日お届け、代金引換はご利用いただけません。</td></tr>
<tr><td>代金引換</td><td>1回のご注文につき330円</td><td>対象外</td><td>30万円まで。ロッカー受取、クール便、出品者発送の商品はご利用いただけません。<a href="/ja/help/payment.html#cod">お支払い方法</a>参照。</td></tr>
</tbody>
</table>
<p><strong>例：</strong>30kgのお米は大型商品のため、通常の配送料（3,500円以上またはFast会員なら無料）に加えて1,100円がかかります。70×50×45cmの箱は3辺合計165cmとなり、こちらも大型商品です。冷蔵のギフトセット2箱を別梱包でお届けする場合、クール便料金は330円×2＝660円です。</p>
<p><small>該当する商品は、商品ページのお届け日の横に「大型商品」「クール便」と表示されます。大型商品をお客様都合で返品する場合の返送料は、550円ではなく1,100円です。</small></p>`,
    },
    {
      id: 'gift',
      h: { en: 'Gift wrap, noshi and gift messages', ja: 'ギフトラッピング・のし・メッセージ' },
      en: `<ul>
<li><strong>Gift wrap:</strong> ¥330 per item, for items shipped by Marketa. Choose "This is a gift" at checkout. Items over 60 cm or in their own shipping carton (e.g. rice cookers) are wrapped with a ribbon sticker on the box instead.</li>
<li><strong>Noshi (熨斗) paper: free.</strong> Choose the purpose (お祝, 内祝, 御礼, 御中元, 御歳暮, 寸志 and others) and the name to print. We use <em>uchi-noshi</em> (under the wrapping) for parcels so it is not damaged in transit; ask for <em>soto-noshi</em> in the gift note if you prefer.</li>
<li><strong>Gift message:</strong> free, up to 100 characters, printed on a card.</li>
<li><strong>Prices hidden:</strong> gift orders come with a packing slip without prices. The receipt goes to you by email.</li>
</ul>
<p><strong>Sellers' gift services:</strong> Kagami Kiln wraps for ¥330 per item and adds noshi free; Minori Yuzu Farm adds noshi and a gift message free. Ask other sellers before ordering. <small>Gift wrap is not covered by Marketa Fast. You can add wrap or noshi until 1 hour after ordering.</small></p>`,
      ja: `<ul>
<li><strong>ギフトラッピング：</strong>マルケタ発送の商品1点につき330円。ご注文手続きで「ギフトとして贈る」をお選びください。60cmを超える商品や外箱のまま発送する商品（炊飯器など）は、包装紙の代わりにリボンシールでのお届けとなります。</li>
<li><strong>のし紙：無料。</strong>表書き（お祝・内祝・御礼・御中元・御歳暮・寸志など）とお名入れをお選びいただけます。配送中に破れないよう、通常は包装紙の内側にかける「内のし」でお届けします。「外のし」をご希望の場合はギフトメッセージ欄にご記入ください。</li>
<li><strong>メッセージカード：</strong>無料。100文字までご入力いただけます。</li>
<li><strong>金額のわからない明細書：</strong>ギフト注文には金額の記載がない納品書を同梱します。領収書はご購入者様にメールでお送りします。</li>
</ul>
<p><strong>出品者のギフト対応：</strong>鏡窯はラッピング1点330円・のし無料、みのり柚子園はのし・メッセージカードともに無料です。その他の出品者は、ご注文前にお問い合わせください。<small>ギフトラッピングはマルケタFastの特典対象外です。ラッピング・のしはご注文後1時間以内なら追加できます。</small></p>`,
    },
    {
      id: 'sellers',
      h: { en: 'Items from sellers that ship themselves', ja: '出品者が発送する商品' },
      en: `<p>Items that a seller ships from its own premises arrive <strong>separately</strong> from Marketa parcels, with the <strong>seller's own fees, free-delivery threshold and times</strong>. They are not Fast-eligible, and Marketa Fast does not make their shipping free. Items marked "Sold by <em>seller</em>, ships from Marketa" are different: they follow this page and Marketa's return policy.</p>
<table>
<thead><tr><th>Seller</th><th>Ships from</th><th>Dispatch</th><th>Order today, arrives (Harukawa)</th><th>Fee</th><th>Free on seller orders of</th></tr></thead>
<tbody>
<tr><td><a href="/en/seller/kagami.html">Kagami Kiln</a></td><td>Kamagaoka, Harukawa</td><td>Within 2 business days; made to order 3–4 weeks</td><td>Thu 8 – Fri 9 Oct</td><td>¥700</td><td>¥5,000</td></tr>
<tr><td><a href="/en/seller/minori.html">Minori Yuzu Farm</a></td><td>Kagami River valley, Harukawa</td><td>Mon–Sat; arrives in 2–3 days</td><td>Wed 7 – Thu 8 Oct</td><td>¥600</td><td>¥4,000</td></tr>
<tr><td><a href="/en/seller/brightdeal.html">BrightDeal Trading</a></td><td>Kobe</td><td>1–3 days; delivery 4–8 days</td><td>Fri 9 – Tue 13 Oct</td><td>Free</td><td>Always free</td></tr>
</tbody>
</table>
<p><strong>Example:</strong> a basket with a <a href="/en/p/corvo-kettle.html">Corvo Kettle</a> (Silver, ¥3,980, Marketa), a <a href="/en/p/kagami-mug-pair.html">Kagami Kiln mug pair</a> (¥6,600) and a <a href="/en/p/minori-ponzu-set.html">Minori yuzu ponzu home pack</a> (¥3,780) arrives in three parcels. A non-member pays ¥0 for the kettle (over ¥3,500), ¥0 for the mugs (Kagami Kiln order over ¥5,000) and ¥600 for the ponzu (farm order under ¥4,000): <strong>¥600 in total</strong>. A Fast member pays the same ¥600, but gets the kettle on Tue 6 Oct.</p>
<p><small>Minori Yuzu Farm's bath salts, hand cream and marmalade set are stored at HRK1 and ship next day like Marketa items. Cash on delivery and lockers are not available for seller-shipped items. If a seller's parcel has not arrived by the latest estimated date, contact the seller from Your Orders; if they do not reply within 2 business days, see <a href="/en/help/returns.html#protection">Purchase Protection</a>.</small></p>`,
      ja: `<p>出品者が自社から発送する商品は、マルケタからの荷物とは<strong>別便</strong>で、<strong>出品者ごとの配送料・送料無料条件・お届け日数</strong>でお届けします。Fast対象外のため、マルケタFast会員でも配送料は無料になりません。なお「販売：○○／発送：マルケタ」と表示された商品は、このページの条件とマルケタの返品ポリシーが適用されます。</p>
<table>
<thead><tr><th>出品者</th><th>発送元</th><th>発送までの日数</th><th>本日注文のお届け（春川市内）</th><th>配送料</th><th>送料無料条件（同じ出品者の合計）</th></tr></thead>
<tbody>
<tr><td><a href="/ja/seller/kagami.html">鏡窯</a></td><td>春川市窯ヶ丘</td><td>2営業日以内（受注制作品は3～4週間）</td><td>10月8日（木）～9日（金）</td><td>700円</td><td>5,000円以上</td></tr>
<tr><td><a href="/ja/seller/minori.html">みのり柚子園</a></td><td>春川市 鏡川流域</td><td>月～土曜に発送、2～3日でお届け</td><td>10月7日（水）～8日（木）</td><td>600円</td><td>4,000円以上</td></tr>
<tr><td><a href="/ja/seller/brightdeal.html">ブライトディール商事</a></td><td>神戸</td><td>1～3日で発送、4～8日でお届け</td><td>10月9日（金）～13日（火）</td><td>無料</td><td>常に無料</td></tr>
</tbody>
</table>
<p><strong>例：</strong><a href="/ja/p/corvo-kettle.html">コルヴォ 電気ケトル</a>（シルバー 3,980円・マルケタ）、<a href="/ja/p/kagami-mug-pair.html">鏡窯 ペアマグ</a>（6,600円）、<a href="/ja/p/minori-ponzu-set.html">みのり柚子園 柚子ぽん酢 ご家庭用</a>（3,780円）を一緒にご注文の場合、3個口でのお届けです。非会員の配送料は、ケトル0円（3,500円以上）、マグ0円（鏡窯で5,000円以上）、ぽん酢600円（柚子園で4,000円未満）で<strong>合計600円</strong>。Fast会員も合計600円ですが、ケトルは10月6日（火）に届きます。</p>
<p><small>みのり柚子園の入浴剤（バスソルト）・ハンドクリーム・マーマレードセットはHRK1に在庫があり、マルケタの商品と同じく翌日お届けが可能です。出品者発送の商品は、代金引換・ロッカー受取をご利用いただけません。お届け予定日の最終日を過ぎても届かない場合は、注文履歴から出品者にお問い合わせください。2営業日以内に返信がない場合は<a href="/ja/help/returns.html#protection">マルケタ購入者保護</a>をご覧ください。</small></p>`,
    },
    {
      id: 'delays',
      h: { en: 'Delivery delays: Lantern Festival, typhoons and more', ja: '配送の遅延について（灯籠まつり・台風など）' },
      en: `<p><strong>Harukawa Lantern Festival road closures, Sat 10 – Sun 11 Oct 2026.</strong> Central Harukawa is closed to traffic for the lantern parade. The closure area is everything inside the inner moat road (Horibata-dōri) around Harukawa Castle, Ōtemachi 1–3 chōme, Honmachi, Kawabata 1–2 chōme, and the riverside road along the Kagami River between Tsukimi Bridge and Minato Bridge.</p>
<table>
<thead><tr><th>Day</th><th>Roads closed</th><th>Deliveries inside the closure area</th></tr></thead>
<tbody>
<tr><td>Sat 10 Oct</td><td>14:00–22:30</td><td>Morning deliveries (8:00–12:00) as normal. Afternoon and evening deliveries move to Sun 11 Oct, 8:00–12:00. No same-day delivery.</td></tr>
<tr><td>Sun 11 Oct</td><td>12:00–21:30</td><td>Morning deliveries as normal. Afternoon and evening deliveries move to Mon 12 Oct (Sports Day), 8:00–12:00. No same-day delivery.</td></tr>
</tbody>
</table>
<p>Elsewhere in Harukawa city, evening deliveries may run up to 2 hours late on both days. Tip: choose a Marketa Locker at Minori Port Station; the Harukawa Central Station lockers stay open but the station will be very crowded. If we move your delivery because of the closures, scheduled-delivery and next-day fees are refunded automatically.</p>
<p><strong>Typhoons and storms.</strong> When a storm warning (暴風警報) is in force for the delivery area, or our carrier suspends service, deliveries pause and restart when it is lifted, usually 1–3 days later. We email you the new date. Fees for faster delivery (next-day, same-day, scheduled) are refunded if we miss the promised date, whatever the reason. Typhoon season runs from August to October.</p>
<p><strong>Other times to expect delays:</strong> heavy snow on the mountain roads to Tsukimi Onsen and the upper Kagami River valley (January–February), and the New Year holidays (31 Dec – 3 Jan), when same-day delivery is suspended.</p>
<p><small>Sellers that ship themselves use their own carriers and may be affected differently. Check the seller's tracking number in Your Orders.</small></p>`,
      ja: `<p><strong>春川灯籠まつりに伴う交通規制（2026年10月10日（土）・11日（日））</strong>　灯籠行列のため、春川市中心部で車両通行止めとなります。規制区域は、春川城を囲む内堀通り（堀端通り）の内側全域、大手町1～3丁目、本町、川端1～2丁目、および鏡川沿いの月見橋～湊橋間の河川沿い道路です。</p>
<table>
<thead><tr><th>日付</th><th>通行止め</th><th>規制区域内へのお届け</th></tr></thead>
<tbody>
<tr><td>10月10日（土）</td><td>14:00～22:30</td><td>午前中（8時～12時）のお届けは通常どおり。午後・夜間のお届けは11日（日）8時～12時に変更します。当日お届けは利用不可。</td></tr>
<tr><td>10月11日（日）</td><td>12:00～21:30</td><td>午前中のお届けは通常どおり。午後・夜間のお届けは12日（月・スポーツの日）8時～12時に変更します。当日お届けは利用不可。</td></tr>
</tbody>
</table>
<p>規制区域外の春川市内でも、両日とも夜間のお届けが最大2時間程度遅れる場合があります。おすすめは、みのり港駅のマルケタロッカーでの受け取りです（春川中央駅のロッカーもご利用いただけますが、駅が大変混雑します）。交通規制によりお届け日時を変更した場合、日時指定料・翌日配送料は自動で返金します。</p>
<p><strong>台風・荒天時</strong>　お届け先に暴風警報が発表されている間や、配送業者が集配を停止している間は配達を見合わせ、解除後に再開します（通常1～3日の遅れ）。新しいお届け予定日はメールでお知らせします。翌日配送・当日お届け・日時指定の料金は、理由を問わずお約束の日にお届けできなかった場合に返金します。台風シーズンは8月～10月です。</p>
<p><strong>そのほか遅れが出やすい時期：</strong>月見温泉・鏡川上流方面の山間部の積雪（1～2月）、年末年始（12月31日～1月3日。この期間は当日お届けを休止します）。</p>
<p><small>出品者が発送する商品は、出品者が手配する配送業者によって影響が異なります。注文履歴で出品者の追跡番号をご確認ください。</small></p>`,
    },
    {
      id: 'redelivery',
      h: { en: 'Missed delivery and redelivery', ja: 'ご不在時・再配達について' },
      en: `<ol>
<li>If nobody is home, the driver leaves a missed-delivery notice (不在票) in your mailbox and we email you.</li>
<li>Request redelivery on <a href="/en/track.html">Track your package</a> or from the link in the email. <strong>Redelivery is free.</strong> Request by 17:00 for delivery the same evening (18:00–20:00 or 19:00–21:00).</li>
<li>Or redirect the parcel to a Marketa Locker (if it fits), at no charge.</li>
</ol>
<ul>
<li>Parcels are held at the delivery depot for <strong>7 days</strong> (cool-delivery parcels 3 days). After that they go back to HRK1 and we refund the item price to your original payment method; delivery fees are not refunded. Cash on delivery orders are simply cancelled.</li>
<li><strong>Leave at the door (置き配):</strong> choose it at checkout or on Track your package to avoid missed deliveries. Not available for cash on delivery, cool delivery, large items or orders of ¥30,000 or more. We photograph the parcel at your door; once it is delivered this way, Marketa replaces it if it goes missing, as long as you report it within 7 days.</li>
</ul>`,
      ja: `<ol>
<li>ご不在の場合、ドライバーが不在票を郵便受けに投函し、メールでもお知らせします。</li>
<li><a href="/ja/track.html">配送状況の確認</a>またはメールのリンクから再配達をご依頼ください。<strong>再配達は無料</strong>です。17時までのご依頼で、当日夜（18時～20時／19時～21時）の再配達が可能です。</li>
<li>サイズが収まる場合は、マルケタロッカーへの転送も無料で承ります。</li>
</ol>
<ul>
<li>営業所での保管期間は<strong>7日間</strong>（クール便は3日間）です。期間を過ぎた荷物はHRK1へ返送され、商品代金を元のお支払い方法に返金します（配送料は返金されません）。代金引換のご注文はキャンセル扱いとなります。</li>
<li><strong>置き配：</strong>ご注文手続きまたは配送状況の確認ページで指定すると、不在でも玄関前にお届けします。代金引換、クール便、大型商品、3万円以上のご注文はご利用いただけません。配達完了時に写真を撮影します。置き配後に荷物が見当たらない場合は、7日以内にご連絡いただければマルケタが再送いたします。</li>
</ul>`,
    },
  ],
};

const returns = {
  id: 'returns',
  title: { en: 'Returns and refunds', ja: '返品・返金について' },
  intro: {
    en: 'For items sold by Marketa or shipped from Marketa: you have 30 days from delivery. What you get back depends on whether the item is unused, opened or faulty, and on how you paid. Sellers that ship their own items have their own policies, backed by Marketa Purchase Protection.',
    ja: 'マルケタが販売または発送する商品は、お届けから30日以内であれば返品を承ります。返金額は、未使用・開封済み・不良品のいずれかと、お支払い方法によって異なります。出品者が発送する商品は各出品者の返品ポリシーが適用され、マルケタ購入者保護がお客様をお守りします。',
  },
  sections: [
    {
      id: 'summary',
      h: { en: 'Returns at a glance', ja: '返品条件の早見表' },
      en: `<table>
<thead><tr><th>Situation</th><th>Time limit</th><th>What you get back</th><th>Return shipping</th></tr></thead>
<tbody>
<tr><td>Unused, in its original packaging (change of mind)</td><td>30 days from delivery</td><td>Full item price</td><td>¥550 deducted (¥1,100 for large items). Free for paid Fast members on items sold by Marketa.</td></tr>
<tr><td>Opened electronics or small appliance, not faulty, like new with all accessories</td><td>30 days from delivery</td><td>Item price minus a 15% restocking fee</td><td>As above</td></tr>
<tr><td>Faulty, damaged in delivery, or wrong item</td><td>30 days from delivery (report delivery damage within 7 days)</td><td>Full refund including delivery fees, or a replacement</td><td>Free, pick-up included</td></tr>
<tr><td>Faulty after 30 days</td><td>The warranty period</td><td>Repair or replacement under the manufacturer's warranty</td><td>Per the warranty</td></tr>
<tr><td>Non-returnable items (earbuds with a broken seal, opened cosmetics, food, made-to-order, gift cards)</td><td>—</td><td>Only if faulty, damaged or wrong</td><td>Free in those cases</td></tr>
<tr><td>Items that sellers ship themselves</td><td colspan="3">The seller's own policy (Kagami Kiln 14 days, BrightDeal Trading 30 days, Minori Yuzu Farm food not returnable). <a href="#third-party">See below</a>.</td></tr>
</tbody>
</table>`,
      ja: `<table>
<thead><tr><th>状況</th><th>返品期限</th><th>返金・対応</th><th>返送料</th></tr></thead>
<tbody>
<tr><td>未使用・元の箱や包装がある（お客様都合）</td><td>お届けから30日以内</td><td>商品代金を全額返金</td><td>返金額から550円を差し引きます（大型商品は1,100円）。有料のFast会員はマルケタ販売の商品なら無料</td></tr>
<tr><td>開封済みの家電・小型家電（不良なし・新品同様・付属品完備）</td><td>お届けから30日以内</td><td>商品代金から返品手数料15%を差し引いて返金</td><td>同上</td></tr>
<tr><td>不良品・配送中の破損・誤配送</td><td>お届けから30日以内（配送中の破損は7日以内にご連絡）</td><td>配送料を含む全額返金、または交換</td><td>無料（集荷も無料）</td></tr>
<tr><td>30日を過ぎてからの故障</td><td>保証期間内</td><td>メーカー保証による修理・交換</td><td>保証規定によります</td></tr>
<tr><td>返品不可の商品（衛生シール開封済みのイヤホン、開封済みの化粧品類、食品、受注制作品、ギフトカード）</td><td>―</td><td>不良品・破損・誤配送の場合のみ対応</td><td>その場合は無料</td></tr>
<tr><td>出品者が発送する商品</td><td colspan="3">各出品者の返品ポリシーによります（鏡窯14日、ブライトディール商事30日、みのり柚子園の食品は返品不可）。<a href="#third-party">詳しくは下記</a>。</td></tr>
</tbody>
</table>`,
    },
    {
      id: 'conditions',
      h: { en: 'Conditions for a full refund', ja: '全額返金の条件' },
      en: `<ul>
<li>The 30 days start on the delivery date shown in <a href="/en/orders.html">Your Orders</a> (for locker pick-up, the day the parcel reached the locker). Start the return within 30 days and send the item within 7 days of starting it.</li>
<li><strong>Unused</strong> means no signs of use: no limescale in a kettle, no rice starch in a cooker, no wear on clothing. You may try clothes on indoors with the tags attached; a rain jacket tried on at home is still "unused".</li>
<li>Return the item in its <strong>original box</strong> with manuals, accessories, cables and any free gift that came with it. The outer shipping box can be any box.</li>
<li>Remove your data from devices and unpair earphones from your phone.</li>
<li>If something is missing or the item has been used, we contact you and either send it back to you or, with your agreement, refund a reduced amount.</li>
</ul>
<p><small>The original delivery fee is refunded only when the return is our mistake (faulty, damaged or wrong item). For a change-of-mind return of an unused <a href="/en/p/corvo-kettle.html">Corvo Kettle</a> (¥3,980): ¥3,980 − ¥550 return shipping = <strong>¥3,430</strong> refunded.</small></p>`,
      ja: `<ul>
<li>30日の期限は、<a href="/ja/orders.html">注文履歴</a>に表示されるお届け日から数えます（ロッカー受取の場合はロッカーに到着した日）。30日以内に返品手続きを開始し、手続き開始から7日以内に商品を発送してください。</li>
<li><strong>未使用</strong>とは、使用の形跡がない状態です（ケトル内の水あか、炊飯器のでんぷん汚れ、衣類の着用じわ等がないこと）。衣類はタグを付けたまま室内で試着していただくぶんには問題ありません。ご自宅で試着しただけのレインジャケットは「未使用」として扱います。</li>
<li>取扱説明書・付属品・ケーブル・ノベルティなどをすべてそろえ、<strong>元の箱</strong>に入れてご返送ください。外側の梱包箱は問いません。</li>
<li>電子機器のデータは消去し、イヤホンはスマートフォンとのペアリングを解除してください。</li>
<li>付属品の不足や使用の形跡がある場合はご連絡のうえ、商品をご返送するか、ご了承いただいたうえで減額して返金します。</li>
</ul>
<p><small>最初の配送料は、当社の責任による返品（不良品・破損・誤配送）の場合のみ返金します。未使用の<a href="/ja/p/corvo-kettle.html">コルヴォ 電気ケトル</a>（3,980円）をお客様都合で返品する場合：3,980円－返送料550円＝<strong>3,430円</strong>を返金します。</small></p>`,
    },
    {
      id: 'restocking',
      h: { en: 'Opened electronics and small appliances: 15% restocking fee', ja: '開封済みの家電・小型家電：返品手数料15%' },
      en: `<p>Opened electronics and small appliances that are <strong>not faulty</strong> (kettles, rice cookers, over-ear and open-ear headphones, power banks and similar) can be returned within 30 days if they are in like-new condition with every accessory. We deduct a <strong>15% restocking fee</strong> from the item price, plus return shipping for a change of mind.</p>
<table>
<thead><tr><th>Example</th><th>Price</th><th>Restocking fee (15%)</th><th>Return shipping</th><th>Refund</th></tr></thead>
<tbody>
<tr><td><a href="/en/p/seiran-headphones.html">Seiran Studio NC headphones</a>, opened, worn for a week</td><td>¥24,800</td><td>−¥3,720</td><td>−¥550</td><td><strong>¥20,530</strong> (¥21,080 for a paid Fast member)</td></tr>
<tr><td><a href="/en/p/hearth-kettle.html">Hearth kettle 1.2 L</a>, used once, cleaned and dry</td><td>¥4,980</td><td>−¥747</td><td>−¥550</td><td><strong>¥3,683</strong></td></tr>
<tr><td><a href="/en/p/kestrel-27k.html">Kestrel 27K power bank</a>, opened, charged twice</td><td>¥9,980</td><td>−¥1,497</td><td>−¥550</td><td><strong>¥7,933</strong></td></tr>
<tr><td>Corvo Kettle, still sealed in its box</td><td>¥3,980</td><td>none (unopened)</td><td>−¥550</td><td><strong>¥3,430</strong></td></tr>
</tbody>
</table>
<p><small>The restocking fee is not charged if the item turns out to be faulty. Free returns for paid Fast members cover the return shipping only; the 15% fee still applies. Kettles and rice cookers must be descaled, clean and completely dry.</small></p>`,
      ja: `<p><strong>不良のない</strong>開封済みの家電・小型家電（電気ケトル、炊飯器、オーバーイヤー型・オープンイヤー型ヘッドホン、モバイルバッテリーなど）は、新品同様の状態で付属品がすべてそろっていれば、30日以内に返品できます。商品代金から<strong>返品手数料15%</strong>と、お客様都合の場合は返送料を差し引いて返金します。</p>
<table>
<thead><tr><th>例</th><th>商品代金</th><th>返品手数料（15%）</th><th>返送料</th><th>返金額</th></tr></thead>
<tbody>
<tr><td><a href="/ja/p/seiran-headphones.html">セイラン スタジオNC ヘッドホン</a>（開封・1週間使用）</td><td>24,800円</td><td>－3,720円</td><td>－550円</td><td><strong>20,530円</strong>（有料のFast会員は21,080円）</td></tr>
<tr><td><a href="/ja/p/hearth-kettle.html">ハース 電気ケトル 1.2L</a>（1回使用・洗浄乾燥済み）</td><td>4,980円</td><td>－747円</td><td>－550円</td><td><strong>3,683円</strong></td></tr>
<tr><td><a href="/ja/p/kestrel-27k.html">ケストレル 27K モバイルバッテリー</a>（開封・2回充電）</td><td>9,980円</td><td>－1,497円</td><td>－550円</td><td><strong>7,933円</strong></td></tr>
<tr><td>コルヴォ 電気ケトル（未開封）</td><td>3,980円</td><td>なし（未開封）</td><td>－550円</td><td><strong>3,430円</strong></td></tr>
</tbody>
</table>
<p><small>不良品と判明した場合、返品手数料はかかりません。有料のFast会員の返品無料特典は返送料のみが対象で、15%の返品手数料はかかります。電気ケトル・炊飯器は、水あかを落とし、洗浄・乾燥させてからご返送ください。</small></p>`,
    },
    {
      id: 'exceptions',
      h: { en: 'Items that cannot be returned', ja: '返品できない商品' },
      en: `<p>These items can be returned <strong>only if they are faulty, damaged in delivery or not what you ordered</strong>:</p>
<ul>
<li><strong>In-ear headphones and earbuds once the hygiene seal is broken</strong>, e.g. <a href="/en/p/nami-buds.html">Nami Buds 2</a>. With the seal intact they are returnable within 30 days like any unused item. Over-ear headphones (Seiran) and open-ear bone-conduction headphones (<a href="/en/p/kaze-openear.html">Kaze</a>) are not in-ear: they follow the 15% restocking rule.</li>
<li><strong>Opened cosmetics, toiletries and bath products</strong>, e.g. <a href="/en/p/yumeguri-onsen-powder.html">Yumeguri bath powder</a>, <a href="/en/p/citrine-body-wash.html">Citrine Lab body wash</a>, <a href="/en/p/minori-bath-salts.html">Minori yuzu bath salts</a> and <a href="/en/p/minori-hand-cream.html">hand cream</a>. Unopened, they are returnable within 30 days.</li>
<li><strong>Food and drink</strong>, opened or not, e.g. <a href="/en/p/shiroshita-senbei.html">Shiroshita senbei</a> and the <a href="/en/p/minori-marmalade-set.html">Minori marmalade set</a>.</li>
<li><strong>Made-to-order and personalised items</strong>, e.g. the engraved Kagami Kiln mug pair and made-to-order glazes.</li>
<li><strong>Marketa Gift Cards</strong>.</li>
</ul>
<p><small>The product page says "Non-returnable" or "Returnable until the seal is broken" next to the return rule when an exception applies.</small></p>`,
      ja: `<p>次の商品は、<strong>不良品・配送中の破損・ご注文と異なる商品の場合のみ</strong>返品を承ります。</p>
<ul>
<li><strong>衛生シールを開封したカナル型（インイヤー）イヤホン</strong>（例：<a href="/ja/p/nami-buds.html">ナミ バッズ2</a>）。シール未開封なら、ほかの未使用品と同じく30日以内に返品できます。オーバーイヤー型（セイラン）や骨伝導のオープンイヤー型（<a href="/ja/p/kaze-openear.html">カゼ</a>）はインイヤー型ではないため、返品手数料15%の対象です。</li>
<li><strong>開封済みの化粧品・日用品・入浴剤</strong>（例：<a href="/ja/p/yumeguri-onsen-powder.html">湯めぐり 入浴剤</a>、<a href="/ja/p/citrine-body-wash.html">シトリンラボ ボディウォッシュ</a>、<a href="/ja/p/minori-bath-salts.html">みのり柚子園 柚子バスソルト</a>、<a href="/ja/p/minori-hand-cream.html">ハンドクリーム</a>）。未開封なら30日以内に返品できます。</li>
<li><strong>食品・飲料</strong>（開封・未開封を問いません。例：<a href="/ja/p/shiroshita-senbei.html">城下製菓 煎餅詰め合わせ</a>、<a href="/ja/p/minori-marmalade-set.html">みのり柚子園 マーマレードセット</a>）</li>
<li><strong>受注制作品・名入れ商品</strong>（例：鏡窯の名入れペアマグ、受注制作の釉薬違い商品）</li>
<li><strong>マルケタギフトカード</strong></li>
</ul>
<p><small>該当する商品は、商品ページの返品条件の欄に「返品不可」「シール開封後は返品不可」と表示されます。</small></p>`,
    },
    {
      id: 'damaged',
      h: { en: 'Faulty, damaged or wrong items', ja: '不良品・破損・誤配送の場合' },
      en: `<ul>
<li><strong>Damaged in delivery:</strong> tell us <strong>within 7 days</strong> of delivery, with photos of the item, the box and the shipping label. Keep the packaging until we have sorted it out.</li>
<li><strong>Faulty or wrong item:</strong> within 30 days of delivery, choose a <strong>full refund</strong> (including the original delivery fee) or a <strong>replacement</strong>. Replacements in stock at HRK1 are sent next day, free.</li>
<li>Return shipping and home pick-up are free. For broken glass or ceramics we usually need photos only, and you do not have to send the pieces back.</li>
<li>After 30 days, the manufacturer's warranty applies (see <a href="#warranty">Warranty</a>).</li>
</ul>`,
      ja: `<ul>
<li><strong>配送中の破損：</strong>お届けから<strong>7日以内</strong>に、商品・外箱・送り状の写真を添えてご連絡ください。解決するまで梱包材は保管してください。</li>
<li><strong>不良品・誤配送：</strong>お届けから30日以内なら、<strong>全額返金</strong>（最初の配送料を含む）または<strong>交換</strong>をお選びいただけます。HRK1に在庫がある交換品は翌日に無料でお届けします。</li>
<li>返送料・集荷料は無料です。ガラス製品や陶磁器の破損は、原則として写真のみで対応し、破片のご返送は不要です。</li>
<li>30日を過ぎた場合はメーカー保証の対象となります（<a href="#warranty">保証について</a>参照）。</li>
</ul>`,
    },
    {
      id: 'shipping-cost',
      h: { en: 'Who pays return shipping', ja: '返送料のご負担' },
      en: `<table>
<thead><tr><th>Reason</th><th>Not a member</th><th>Fast free trial</th><th>Paid Fast member, item sold by Marketa</th><th>Paid Fast member, item sold by another seller but shipped from Marketa</th></tr></thead>
<tbody>
<tr><td>Change of mind (including opened electronics)</td><td>¥550 (¥1,100 large items)</td><td>¥550 (¥1,100)</td><td><strong>Free</strong></td><td>¥550 (¥1,100)</td></tr>
<tr><td>Faulty, damaged or wrong item</td><td>Free</td><td>Free</td><td>Free</td><td>Free</td></tr>
<tr><td>Home pick-up instead of drop-off</td><td>+¥330 (free if faulty)</td><td>+¥330 (free if faulty)</td><td>+¥330 (free if faulty)</td><td>+¥330 (free if faulty)</td></tr>
</tbody>
</table>
<p><small>Return shipping is deducted from your refund; you never pay at the counter. Example: a Fast member in the free trial returns unused <a href="/en/p/aoba-mini.html">Aoba Mini rice cooker</a> (¥5,980): refund ¥5,430. The same return after the trial has become a paid membership: ¥5,980. Minori Yuzu Farm's bath salts ship from Marketa but are sold by the farm, so the ¥550 applies even to paid members.</small></p>`,
      ja: `<table>
<thead><tr><th>返品理由</th><th>非会員</th><th>Fast無料体験中</th><th>有料のFast会員（販売：マルケタ）</th><th>有料のFast会員（販売：他の出品者／発送：マルケタ）</th></tr></thead>
<tbody>
<tr><td>お客様都合（開封済み家電を含む）</td><td>550円（大型商品1,100円）</td><td>550円（1,100円）</td><td><strong>無料</strong></td><td>550円（1,100円）</td></tr>
<tr><td>不良品・破損・誤配送</td><td>無料</td><td>無料</td><td>無料</td><td>無料</td></tr>
<tr><td>持ち込みではなく集荷を希望</td><td>＋330円（不良品は無料）</td><td>＋330円（不良品は無料）</td><td>＋330円（不良品は無料）</td><td>＋330円（不良品は無料）</td></tr>
</tbody>
</table>
<p><small>返送料は返金額から差し引くため、窓口でのお支払いは不要です。例：Fast無料体験中に未使用の<a href="/ja/p/aoba-mini.html">あおば ミニ炊飯器</a>（5,980円）を返品すると返金額は5,430円、有料会員に移行した後なら5,980円です。みのり柚子園のバスソルトは発送はマルケタですが販売は柚子園のため、有料会員でも550円がかかります。</small></p>`,
    },
    {
      id: 'how',
      h: { en: 'How to return an item', ja: '返品の手順' },
      en: `<ol>
<li>Go to <a href="/en/orders.html">Your Orders</a>, find the item and choose <strong>Return or replace items</strong>.</li>
<li>Choose a reason. For faulty or damaged items, add photos.</li>
<li>Check the refund estimate: any restocking fee and return shipping are shown before you confirm.</li>
<li>Choose how to send it:
<ul>
<li><strong>Convenience store</strong>: free. Show the QR code at the counter; no label to print.</li>
<li><strong>Marketa Locker</strong>: free. Scan the QR code at the locker (parcels up to 45 × 35 × 30 cm and 10 kg).</li>
<li><strong>Post office</strong>: free. The counter prints a prepaid label from your QR code.</li>
<li><strong>Pick-up from your home</strong>: ¥330 (free if the item is faulty). Slots 9:00–12:00, 14:00–17:00 or 17:00–20:00, from the next day.</li>
</ul></li>
<li>Pack the item in its original box with all accessories and send it within 7 days. Track the return in Your Orders.</li>
</ol>
<p><small>Large items (over 160 cm or 25 kg) are collected from your home; the ¥330 pick-up fee does not apply to them, but the ¥1,100 return shipping does for a change of mind.</small></p>`,
      ja: `<ol>
<li><a href="/ja/orders.html">注文履歴</a>で商品を選び、<strong>「返品・交換の手続き」</strong>を押します。</li>
<li>返品理由を選びます。不良・破損の場合は写真を添付してください。</li>
<li>返金見込み額を確認します。返品手数料・返送料は確定前に表示されます。</li>
<li>返送方法を選びます。
<ul>
<li><strong>コンビニ持ち込み</strong>：無料。レジでQRコードを提示するだけで、伝票の印刷は不要です。</li>
<li><strong>マルケタロッカー</strong>：無料。ロッカーでQRコードを読み取ってください（45×35×30cm・10kgまで）。</li>
<li><strong>郵便局</strong>：無料。窓口でQRコードから着払い伝票を発行します。</li>
<li><strong>ご自宅への集荷</strong>：330円（不良品は無料）。翌日以降、9時～12時／14時～17時／17時～20時からお選びいただけます。</li>
</ul></li>
<li>元の箱に付属品とともに梱包し、7日以内に発送してください。返品の状況は注文履歴で確認できます。</li>
</ol>
<p><small>大型商品（160cm超または25kg超）はご自宅への集荷となります。集荷料330円はかかりませんが、お客様都合の場合は返送料1,100円がかかります。</small></p>`,
    },
    {
      id: 'refund-timing',
      h: { en: 'When you get your money back', ja: '返金の時期' },
      en: `<p>We inspect returns within <strong>1–2 business days</strong> of their arrival at HRK1, then refund as follows:</p>
<table>
<thead><tr><th>You paid with</th><th>Refunded to</th><th>When (after inspection)</th></tr></thead>
<tbody>
<tr><td>Credit or debit card</td><td>The same card</td><td>3–5 business days. It may appear on your next card statement.</td></tr>
<tr><td>Any method, if you choose "Refund as Marketa Points"</td><td>Marketa Points <strong>+ 5% bonus</strong></td><td>Immediately</td></tr>
<tr><td>Marketa Points (used for the order)</td><td>Marketa Points</td><td>Immediately</td></tr>
<tr><td>Marketa Gift Card</td><td>Your gift card balance</td><td>Immediately</td></tr>
<tr><td>Convenience-store payment or Pay-easy</td><td>Bank transfer (enter your account in Your Orders)</td><td>Within 5–7 business days</td></tr>
<tr><td>Cash on delivery</td><td>Bank transfer</td><td>Within 5–7 business days. The ¥330 fee is refunded only if the return is our mistake.</td></tr>
<tr><td>Kumo Mobile carrier billing</td><td>Your phone bill</td><td>Credited on the next or the following bill</td></tr>
</tbody>
</table>
<p><strong>Example:</strong> an unused Aoba Mini rice cooker (¥5,980) paid by card, returned for change of mind: ¥5,430 back on the card 4–7 business days after it reaches us, or <strong>5,701 points</strong> immediately if you take points (¥5,430 + 5%, rounded down).</p>
<p><small>Business days are Monday to Friday, excluding public holidays (Mon 12 Oct is a holiday). Points you earned on a returned item are removed. Bank transfers have no fee.</small></p>`,
      ja: `<p>返品商品がHRK1に到着してから<strong>1～2営業日</strong>で検品し、次のとおり返金します。</p>
<table>
<thead><tr><th>お支払い方法</th><th>返金先</th><th>返金時期（検品後）</th></tr></thead>
<tbody>
<tr><td>クレジットカード・デビットカード</td><td>同じカード</td><td>3～5営業日。カード会社の締め日により、翌月以降のご利用明細に反映される場合があります</td></tr>
<tr><td>お支払い方法を問わず「マルケタポイントで返金」を選択</td><td>マルケタポイント<strong>＋5%ボーナス</strong></td><td>即時</td></tr>
<tr><td>マルケタポイント（ご注文時に利用した分）</td><td>マルケタポイント</td><td>即時</td></tr>
<tr><td>マルケタギフトカード</td><td>ギフトカード残高</td><td>即時</td></tr>
<tr><td>コンビニ払い・ペイジー</td><td>銀行振込（注文履歴で口座をご登録ください）</td><td>5～7営業日以内</td></tr>
<tr><td>代金引換</td><td>銀行振込</td><td>5～7営業日以内。代引手数料330円は当社の責任による返品の場合のみ返金</td></tr>
<tr><td>クモモバイル キャリア決済</td><td>携帯電話のご利用料金</td><td>翌月または翌々月のご請求で相殺</td></tr>
</tbody>
</table>
<p><strong>例：</strong>カードで購入した未使用のあおば ミニ炊飯器（5,980円）をお客様都合で返品した場合、当社到着から4～7営業日ほどでカードに5,430円を返金します。ポイントでの返金を選ぶと、即時に<strong>5,701ポイント</strong>（5,430円＋5%、小数点以下切り捨て）となります。</p>
<p><small>営業日は月～金曜日（祝日を除く）です。10月12日（月）は祝日のため営業日に含みません。返品した商品で獲得したポイントは取り消されます。銀行振込の手数料はかかりません。</small></p>`,
    },
    {
      id: 'third-party',
      h: { en: 'Items that sellers ship themselves', ja: '出品者が発送する商品の返品' },
      en: `<p>When an item is sold <strong>and</strong> shipped by another seller, that seller's return policy applies. Start the return from Your Orders ("Contact seller"). Items "sold by a seller, shipped from Marketa" follow Marketa's policy above instead.</p>
<table>
<thead><tr><th>Seller</th><th>Return window</th><th>Change of mind</th><th>Faulty or damaged</th><th>Cannot be returned</th></tr></thead>
<tbody>
<tr><td><a href="/en/seller/kagami.html">Kagami Kiln</a></td><td>14 days from delivery</td><td>Unused only; you pay return shipping</td><td>Breakage in delivery: report within 48 hours with photos; replacement or refund without sending it back</td><td>Engraved and made-to-order items. Variation in glaze, colour, size and small pinholes is the nature of handmade ware, not a defect.</td></tr>
<tr><td><a href="/en/seller/minori.html">Minori Yuzu Farm</a></td><td>Unopened cosmetics: 14 days</td><td>Unopened cosmetics only</td><td>Damaged or faulty food: report within 7 days with photos</td><td>Food, unless damaged or faulty</td></tr>
<tr><td><a href="/en/seller/brightdeal.html">BrightDeal Trading</a></td><td>30 days</td><td>Unopened only; you pay ¥880 return shipping</td><td>Contact the seller first and wait up to 2 business days for a prepaid label; refund within 5 business days after the item reaches the Kobe warehouse; 6-month seller warranty on electronics</td><td>Opened items returned for change of mind</td></tr>
</tbody>
</table>
<p><small>Marketa Fast's free returns do not apply to items from other sellers.</small></p>`,
      ja: `<p>他の出品者が<strong>販売・発送</strong>する商品には、その出品者の返品ポリシーが適用されます。注文履歴の「出品者に問い合わせる」から返品をお申し込みください。「販売：出品者／発送：マルケタ」の商品は、上記のマルケタの返品ポリシーが適用されます。</p>
<table>
<thead><tr><th>出品者</th><th>返品期限</th><th>お客様都合の返品</th><th>不良品・破損</th><th>返品できないもの</th></tr></thead>
<tbody>
<tr><td><a href="/ja/seller/kagami.html">鏡窯</a></td><td>お届けから14日以内</td><td>未使用品のみ。返送料はお客様負担</td><td>配送中の破損は48時間以内に写真を添えて連絡。返送不要で交換または返金</td><td>名入れ品・受注制作品。釉薬・色・大きさのばらつきや小さなピンホールは手作りの特性であり、不良ではありません</td></tr>
<tr><td><a href="/ja/seller/minori.html">みのり柚子園</a></td><td>未開封の化粧品：14日以内</td><td>未開封の化粧品のみ</td><td>食品の破損・品質不良は7日以内に写真を添えて連絡</td><td>食品（破損・品質不良を除く）</td></tr>
<tr><td><a href="/ja/seller/brightdeal.html">ブライトディール商事</a></td><td>30日以内</td><td>未開封品のみ。返送料880円はお客様負担</td><td>まず出品者に連絡し、着払い伝票の発行を最大2営業日お待ちください。神戸倉庫到着後5営業日以内に返金。電化製品は出品者保証6か月</td><td>お客様都合での開封済み商品</td></tr>
</tbody>
</table>
<p><small>マルケタFastの返品無料特典は、他の出品者の商品には適用されません。</small></p>`,
    },
    {
      id: 'protection',
      h: { en: 'Marketa Purchase Protection', ja: 'マルケタ購入者保護' },
      en: `<p>Purchase Protection covers every item bought on Marketa, including items that sellers ship themselves. Marketa steps in and refunds you when:</p>
<ul>
<li>the seller does not reply to your message within <strong>2 business days</strong>;</li>
<li>the seller refuses a <strong>valid return</strong>: one their own policy allows, or an item that is faulty, damaged or not as described;</li>
<li>the item has not arrived and the seller cannot resolve it.</li>
</ul>
<p><strong>File a claim within 90 days of the latest estimated delivery date</strong>, from Your Orders &gt; "Problem with this order" &gt; "Ask Marketa to step in". We decide within 5 business days and refund the item price and delivery fee, up to ¥300,000 per order.</p>
<p><strong>Example:</strong> a <a href="/en/p/vetrina-kettle.html">Vetrina kettle</a> from BrightDeal Trading ordered today, Mon 5 Oct, has an estimated delivery of Fri 9 – Tue 13 Oct, so you can claim until <strong>Mon 11 Jan 2027</strong>.</p>
<p><small>Purchase Protection does not override a seller's policy for change-of-mind returns: an opened BrightDeal item, unopened food from Minori Yuzu Farm or a Kagami Kiln glaze variation are not covered.</small></p>`,
      ja: `<p>マルケタ購入者保護は、出品者が発送する商品を含め、マルケタでご購入いただいたすべての商品が対象です。次の場合はマルケタが代わりに対応し、返金します。</p>
<ul>
<li>出品者が<strong>2営業日以内</strong>にメッセージに返信しない場合</li>
<li>出品者が<strong>正当な返品</strong>（出品者自身のポリシーで認められる返品、または不良品・破損・説明と著しく異なる商品）を拒否した場合</li>
<li>商品が届かず、出品者が解決できない場合</li>
</ul>
<p><strong>お届け予定日の最終日から90日以内</strong>に、注文履歴＞「注文に関する問題」＞「マルケタに対応を依頼する」から申請してください。5営業日以内に判断し、商品代金と配送料を返金します（1回のご注文につき30万円まで）。</p>
<p><strong>例：</strong>本日10月5日（月）にブライトディール商事の<a href="/ja/p/vetrina-kettle.html">ヴェトリーナ ガラス電気ケトル</a>をご注文の場合、お届け予定は10月9日（金）～13日（火）のため、<strong>2027年1月11日（月）</strong>まで申請できます。</p>
<p><small>購入者保護は、お客様都合の返品について出品者のポリシーを上書きするものではありません。ブライトディール商事の開封済み商品、みのり柚子園の未開封の食品、鏡窯の釉薬の個体差などは対象外です。</small></p>`,
    },
    {
      id: 'warranty',
      h: { en: 'After 30 days: warranty', ja: '30日経過後：メーカー保証' },
      en: `<p>After the 30-day return period, a fault is covered by the <strong>manufacturer's warranty</strong>, counted from the delivery date. Your Marketa order confirmation is your proof of purchase; download it from Your Orders. Contact the manufacturer (details in the manual), or chat with us and we will pass your case on.</p>
<table>
<thead><tr><th>Product</th><th>Warranty</th><th>Given by</th></tr></thead>
<tbody>
<tr><td>Corvo, Hearth kettles; Komekko, Aoba rice cookers; Nami Buds 2; Kaze Open-Ear</td><td>1 year</td><td>Manufacturer</td></tr>
<tr><td>Ampora Slim 10K and Go 20K power banks</td><td>18 months</td><td>Manufacturer</td></tr>
<tr><td>Tetsuyu Gooseneck Kettle, Seiran Studio NC, Kestrel 27K</td><td>2 years</td><td>Manufacturer</td></tr>
<tr><td>Inaho Pressure IH Rice Cooker</td><td>3 years, inner pot included</td><td>Manufacturer</td></tr>
<tr><td>Vetrina kettle, VoltX Pods, TitanCell 40000</td><td>6 months</td><td>BrightDeal Trading (seller warranty)</td></tr>
</tbody>
</table>
<p><small>Warranties cover manufacturing faults, not drops, water damage beyond the stated rating, or wear such as battery capacity loss within normal limits.</small></p>`,
      ja: `<p>30日の返品期間を過ぎた故障は、お届け日から起算する<strong>メーカー保証</strong>の対象です。マルケタの注文確認書が購入証明となります（注文履歴からダウンロードできます）。取扱説明書記載のメーカー窓口にお問い合わせいただくか、マルケタのチャットにご連絡いただければメーカーへおつなぎします。</p>
<table>
<thead><tr><th>商品</th><th>保証期間</th><th>保証元</th></tr></thead>
<tbody>
<tr><td>コルヴォ・ハース 電気ケトル、コメッコ・あおば 炊飯器、ナミ バッズ2、カゼ オープンイヤー</td><td>1年</td><td>メーカー</td></tr>
<tr><td>アンポラ スリム10K・Go 20K モバイルバッテリー</td><td>18か月</td><td>メーカー</td></tr>
<tr><td>テツユ グースネックケトル、セイラン スタジオNC、ケストレル 27K</td><td>2年</td><td>メーカー</td></tr>
<tr><td>イナホ 圧力IH炊飯器</td><td>3年（内釜を含む）</td><td>メーカー</td></tr>
<tr><td>ヴェトリーナ ケトル、ボルトX ポッズ、タイタンセル 40000</td><td>6か月</td><td>ブライトディール商事（出品者保証）</td></tr>
</tbody>
</table>
<p><small>保証の対象は製造上の不具合です。落下、表示の防水性能を超える浸水、通常の範囲内のバッテリー容量の低下などは対象外です。</small></p>`,
    },
  ],
};

const fast = {
  id: 'fast',
  title: { en: 'Marketa Fast membership', ja: 'マルケタFast会員' },
  intro: {
    en: 'Marketa Fast gives you free next-day delivery on Fast-eligible items with no minimum order, free standard and scheduled delivery, cheaper same-day delivery in Harukawa, early access to Lightning Deals, member coupons, free returns and double points. ¥600 a month or ¥5,900 a year; students pay half.',
    ja: 'マルケタFastは、Fast対象商品の翌日配送が金額にかかわらず無料になるほか、通常配送・日時指定の無料、春川市内の当日お届けの割引、タイムセールの先行参加、会員限定クーポン、返品無料、ポイント2倍などの特典が受けられる有料会員プログラムです。月額600円または年額5,900円。学生は半額です。',
  },
  sections: [
    {
      id: 'plans',
      h: { en: 'Plans and fees', ja: 'プランと料金' },
      en: `<table>
<thead><tr><th>Plan</th><th>Monthly</th><th>Annual</th><th>Annual works out at</th><th>Free trial</th></tr></thead>
<tbody>
<tr><td><strong>Marketa Fast</strong></td><td>¥600</td><td>¥5,900</td><td>about ¥492 a month; saves ¥1,300 compared with 12 monthly payments (¥7,200)</td><td>30 days</td></tr>
<tr><td><strong>Fast Student</strong></td><td>¥300</td><td>¥2,950</td><td>about ¥246 a month; saves ¥650 compared with ¥3,600</td><td>6 months, with a university email address</td></tr>
</tbody>
</table>
<p><small>Prices include consumption tax. The fee is charged on the day your membership starts and then every month or year on the same date. You can switch between monthly and annual at your next renewal date. Fast Student and Fast have exactly the same benefits.</small></p>`,
      ja: `<table>
<thead><tr><th>プラン</th><th>月額</th><th>年額</th><th>年額の月あたり</th><th>無料体験</th></tr></thead>
<tbody>
<tr><td><strong>マルケタFast</strong></td><td>600円</td><td>5,900円</td><td>約492円。月額で12か月払う場合（7,200円）より1,300円お得</td><td>30日間</td></tr>
<tr><td><strong>Fast Student（学生プラン）</strong></td><td>300円</td><td>2,950円</td><td>約246円。3,600円より650円お得</td><td>6か月間（大学のメールアドレスが必要）</td></tr>
</tbody>
</table>
<p><small>料金は税込です。会費は会員登録日に、以降は毎月または毎年の同じ日にお支払いいただきます。月額・年額の切り替えは次回更新日から可能です。Fast StudentとFastの特典内容はまったく同じです。</small></p>`,
    },
    {
      id: 'benefits',
      h: { en: 'Benefits', ja: '会員特典' },
      en: `<table>
<thead><tr><th>Benefit</th><th>Marketa Fast member</th><th>Not a member</th></tr></thead>
<tbody>
<tr><td>Next-day delivery on Fast-eligible items</td><td><strong>Free, no minimum order</strong></td><td>¥600 (¥800 to the rest of Honshu, Shikoku and Kyushu)</td></tr>
<tr><td>Standard delivery on items shipped by Marketa</td><td><strong>Always free</strong></td><td>¥450–¥990; free on orders of ¥3,500 or more</td></tr>
<tr><td>Items at Marketa warehouses outside Minori Prefecture</td><td>Faster: about 3 days (e.g. Thu 8 Oct)</td><td>About 5 days (e.g. Sat 10 Oct)</td></tr>
<tr><td>Same-day delivery in Harukawa city</td><td><strong>Free on orders of ¥2,000+</strong>, ¥300 below that</td><td>¥900</td></tr>
<tr><td>Scheduled delivery (date and time slot)</td><td><strong>Free</strong></td><td>¥350</td></tr>
<tr><td>Lightning Deals</td><td><strong>30 minutes early access</strong></td><td>From the published start time</td></tr>
<tr><td>Member-only coupons</td><td>Yes (marked "Fast members" on the product page)</td><td>No</td></tr>
<tr><td>Change-of-mind returns on items sold by Marketa</td><td><strong>Free</strong> (paid members only, not during the free trial)</td><td>¥550 (¥1,100 for large items)</td></tr>
<tr><td>Marketa Points on Fast-eligible items</td><td><strong>2%</strong></td><td>1%</td></tr>
</tbody>
</table>
<p><strong>In practice:</strong> order the <a href="/en/p/hearth-kettle.html">Hearth kettle 1.2 L</a> (¥4,980) before 14:00 today and a member gets it free on Tue 6 Oct and earns 99 points; a non-member gets it free on Thu 8 Oct (or pays ¥600 for Tue 6 Oct) and earns 49 points. One paid next-day delivery a month already costs as much as the monthly fee.</p>`,
      ja: `<table>
<thead><tr><th>特典</th><th>マルケタFast会員</th><th>非会員</th></tr></thead>
<tbody>
<tr><td>Fast対象商品の翌日配送</td><td><strong>無料（最低注文金額なし）</strong></td><td>600円（その他の本州・四国・九州は800円）</td></tr>
<tr><td>マルケタ発送商品の通常配送</td><td><strong>いつでも無料</strong></td><td>450円～990円。3,500円以上のご注文で無料</td></tr>
<tr><td>みのり県外のマルケタ倉庫にある商品</td><td>約3日でお届け（例：10月8日（木））</td><td>約5日（例：10月10日（土））</td></tr>
<tr><td>春川市内の当日お届け</td><td><strong>2,000円以上で無料</strong>、2,000円未満は300円</td><td>900円</td></tr>
<tr><td>お届け日時指定</td><td><strong>無料</strong></td><td>350円</td></tr>
<tr><td>タイムセール</td><td><strong>30分前から先行参加</strong></td><td>開始時刻から</td></tr>
<tr><td>会員限定クーポン</td><td>あり（商品ページに「Fast会員限定」と表示）</td><td>なし</td></tr>
<tr><td>マルケタ販売商品のお客様都合返品</td><td><strong>返送料無料</strong>（有料会員のみ。無料体験中は対象外）</td><td>550円（大型商品1,100円）</td></tr>
<tr><td>Fast対象商品のマルケタポイント</td><td><strong>2%</strong></td><td>1%</td></tr>
</tbody>
</table>
<p><strong>たとえば：</strong>本日14時までに<a href="/ja/p/hearth-kettle.html">ハース 電気ケトル 1.2L</a>（4,980円）をご注文の場合、会員は10月6日（火）に無料で届き99ポイント獲得。非会員は10月8日（木）に無料でお届け（600円で6日（火）も可）、獲得は49ポイントです。翌日配送を月に1回使うだけで、月会費と同じ金額になります。</p>`,
    },
    {
      id: 'not-covered',
      h: { en: 'What Fast does not cover', ja: 'Fastの特典対象外' },
      en: `<ul>
<li><strong>Sellers' own shipping</strong>: items that Kagami Kiln (¥700, free on ¥5,000+), Minori Yuzu Farm (¥600, free on ¥4,000+) or other sellers ship themselves. BrightDeal Trading ships free for everyone.</li>
<li><strong>Large-item surcharge</strong>: ¥1,100 per item over 160 cm or 25 kg.</li>
<li><strong>Cool delivery</strong>: ¥330 per box.</li>
<li><strong>Cash on delivery fee</strong>: ¥330.</li>
<li><strong>Remote-island surcharge</strong>: ¥550.</li>
<li><strong>Next-day delivery to Hokkaido, Okinawa and remote islands</strong>: not available to anyone (standard delivery is still free for members).</li>
<li><strong>Gift wrap</strong>: ¥330 per item.</li>
<li><strong>The 15% restocking fee</strong> on opened electronics (free returns cover return shipping only), and return shipping on items sold by other sellers.</li>
</ul>`,
      ja: `<ul>
<li><strong>出品者発送の配送料</strong>：鏡窯（700円、5,000円以上で無料）、みのり柚子園（600円、4,000円以上で無料）など、出品者が自ら発送する商品。ブライトディール商事はどなたでも送料無料です。</li>
<li><strong>大型商品手数料</strong>：160cm超または25kg超の商品1点につき1,100円</li>
<li><strong>クール便</strong>：1箱330円</li>
<li><strong>代金引換手数料</strong>：330円</li>
<li><strong>離島手数料</strong>：550円</li>
<li><strong>北海道・沖縄・離島への翌日配送</strong>：どなたもご利用いただけません（会員の通常配送は無料です）</li>
<li><strong>ギフトラッピング</strong>：1点330円</li>
<li><strong>開封済み家電の返品手数料15%</strong>（返品無料特典は返送料のみが対象）、および他の出品者が販売する商品の返送料</li>
</ul>`,
    },
    {
      id: 'trial',
      h: { en: 'Free trial', ja: '無料体験' },
      en: `<ul>
<li><strong>30 days free</strong> (Fast Student: 6 months, see below).</li>
<li><strong>Once per account.</strong> Not available if you were a Fast member or had a free trial in the <strong>past 12 months</strong>.</li>
<li>You need a <strong>credit card</strong> or <strong>Kumo Mobile carrier billing</strong> to start a trial. Debit cards, prepaid cards, gift card balances and convenience-store payment cannot be used.</li>
<li>Unless you cancel before it ends, the trial <strong>turns into the monthly plan</strong> (¥600, or ¥300 for Fast Student). We email you 3 days before.</li>
<li>During the trial you get every benefit except free change-of-mind returns.</li>
<li>If you cancel during the trial, your benefits continue until the trial's last day and you are not charged.</li>
</ul>
<p><strong>Example:</strong> start a trial today, Mon 5 Oct. It ends on Tue 3 Nov at 23:59; if you have not cancelled, ¥600 is charged on Wed 4 Nov.</p>`,
      ja: `<ul>
<li><strong>30日間無料</strong>（Fast Studentは6か月。下記参照）</li>
<li><strong>1アカウントにつき1回まで。</strong>過去<strong>12か月以内</strong>にFast会員だった方、または無料体験をご利用になった方は対象外です。</li>
<li>無料体験のお申し込みには、<strong>クレジットカード</strong>または<strong>クモモバイル キャリア決済</strong>のご登録が必要です。デビットカード、プリペイドカード、ギフトカード残高、コンビニ払いはご利用いただけません。</li>
<li>期間終了までに解約しない場合、<strong>自動的に月額プランへ移行</strong>します（600円、Fast Studentは300円）。終了の3日前にメールでお知らせします。</li>
<li>無料体験中は、お客様都合の返品無料を除くすべての特典をご利用いただけます。</li>
<li>無料体験中に解約した場合も、体験期間の最終日まで特典をご利用いただけ、料金はかかりません。</li>
</ul>
<p><strong>例：</strong>本日10月5日（月）に無料体験を開始すると、11月3日（火・祝）23:59に終了します。解約しなかった場合は、11月4日（水）に600円をお支払いいただきます。</p>`,
    },
    {
      id: 'student',
      h: { en: 'Fast Student', ja: 'Fast Student（学生プラン）' },
      en: `<ul>
<li>For students at a university, graduate school, junior college or technical college with a university email address (usually ending in .ac.jp), for example at Harukawa University.</li>
<li><strong>6-month free trial</strong>, then ¥300 a month or ¥2,950 a year. The same once-per-account and 12-month rules apply.</li>
<li>We ask you to confirm your university email once a year. Fast Student lasts up to 4 years; after that, or if you can no longer confirm, it becomes the regular Fast plan (¥600 a month). We email you 30 days before.</li>
</ul>
<p><strong>Example:</strong> a Harukawa University student who starts today has free Fast until 4 Apr 2027, then pays ¥300 a month from 5 Apr 2027.</p>`,
      ja: `<ul>
<li>大学・大学院・短期大学・高等専門学校に在籍し、学校のメールアドレス（通常は .ac.jp で終わるもの）をお持ちの方が対象です（例：春川大学）。</li>
<li><strong>6か月間の無料体験</strong>のあと、月額300円または年額2,950円。1アカウント1回・過去12か月の条件は通常の無料体験と同じです。</li>
<li>年に1回、学校のメールアドレスの確認をお願いしています。Fast Studentは最長4年間で、その後または確認ができない場合は通常のFast（月額600円）へ移行します。30日前にメールでお知らせします。</li>
</ul>
<p><strong>例：</strong>春川大学の学生が本日登録すると、2027年4月4日まで無料、2027年4月5日から月額300円となります。</p>`,
    },
    {
      id: 'cancel',
      h: { en: 'Cancelling and refunds', ja: '解約と返金' },
      en: `<p>Cancel any time in Your Account &gt; Marketa Fast &gt; "End membership", or by phone (0120-555-818, 9:00–18:00).</p>
<table>
<thead><tr><th>Plan</th><th>When you cancel</th><th>What happens</th></tr></thead>
<tbody>
<tr><td>Free trial</td><td>Any time</td><td>No charge; benefits until the trial's last day.</td></tr>
<tr><td>Monthly</td><td>Any time</td><td>Benefits continue to the end of the month you have paid for. <strong>No refund.</strong></td></tr>
<tr><td>Annual</td><td>Within 14 days of paying, <strong>no benefit used</strong></td><td><strong>Full refund</strong>; membership ends at once.</td></tr>
<tr><td>Annual</td><td>Any other time</td><td>Refund for each <strong>unused full month</strong> (one-twelfth of the annual fee per month, rounded down); membership ends at once.</td></tr>
</tbody>
</table>
<p><strong>Examples</strong></p>
<ul>
<li>Monthly member since 18 Sep cancels today (5 Oct): benefits until 17 Oct, nothing refunded.</li>
<li>Paid ¥5,900 on 1 Oct, cancels on 10 Oct without using any benefit: <strong>¥5,900</strong> refunded.</li>
<li>Paid ¥5,900 on 1 Oct, had a free next-day delivery on 6 Oct, cancels on 10 Oct: 11 unused full months (Nov–Sep), <strong>¥5,408</strong> refunded.</li>
<li>Paid ¥5,900 on 1 Apr 2026, cancels on 20 Aug: 7 unused full months (Sep–Mar), <strong>¥3,441</strong> refunded.</li>
<li>Fast Student annual (¥2,950) with 5 unused full months: <strong>¥1,229</strong> refunded.</li>
</ul>
<p><small>"Using a benefit" means any free or discounted delivery, a Lightning Deal bought during early access, a member coupon, a free return or 2% points. Refunds go to the card or phone bill you paid with.</small></p>`,
      ja: `<p>アカウントサービス＞マルケタFast＞「会員登録を終了する」から、またはお電話（0120-555-818、9時～18時）でいつでも解約できます。</p>
<table>
<thead><tr><th>プラン</th><th>解約のタイミング</th><th>解約後の扱い</th></tr></thead>
<tbody>
<tr><td>無料体験</td><td>いつでも</td><td>料金はかかりません。体験期間の最終日まで特典をご利用いただけます。</td></tr>
<tr><td>月額</td><td>いつでも</td><td>お支払い済みの月の末日まで特典をご利用いただけます。<strong>返金はありません。</strong></td></tr>
<tr><td>年額</td><td>お支払いから14日以内で、<strong>特典を一度も利用していない</strong></td><td><strong>全額返金</strong>。会員資格はただちに終了します。</td></tr>
<tr><td>年額</td><td>上記以外</td><td><strong>未使用の満月数</strong>分を返金（年会費の12分の1×月数、1円未満切り捨て）。会員資格はただちに終了します。</td></tr>
</tbody>
</table>
<p><strong>例</strong></p>
<ul>
<li>9月18日から月額会員の方が本日（10月5日）解約：10月17日まで特典をご利用いただけます。返金はありません。</li>
<li>10月1日に5,900円を支払い、特典を使わずに10月10日に解約：<strong>5,900円</strong>を返金。</li>
<li>10月1日に5,900円を支払い、10月6日に無料の翌日配送を利用、10月10日に解約：未使用の満月数は11か月（11月～9月）で、<strong>5,408円</strong>を返金。</li>
<li>2026年4月1日に5,900円を支払い、8月20日に解約：未使用の満月数は7か月（9月～3月）で、<strong>3,441円</strong>を返金。</li>
<li>Fast Student年額（2,950円）で未使用の満月数が5か月：<strong>1,229円</strong>を返金。</li>
</ul>
<p><small>「特典の利用」とは、配送料の無料・割引、先行参加中のタイムセールでの購入、会員限定クーポン、返品無料、2%ポイントの獲得のいずれかを指します。返金は、会費をお支払いいただいたカードまたは携帯電話のご利用料金に行います。</small></p>`,
    },
  ],
};

const payment = {
  id: 'payment',
  title: { en: 'Payment methods', ja: 'お支払い方法' },
  intro: {
    en: 'How you can pay on Marketa, what each method costs, its limits, and when the money actually leaves your account. All prices on Marketa include consumption tax.',
    ja: 'マルケタでご利用いただけるお支払い方法と、それぞれの手数料・利用上限・ご請求のタイミングをご案内します。表示価格はすべて税込です。',
  },
  sections: [
    {
      id: 'methods',
      h: { en: 'Payment methods at a glance', ja: 'お支払い方法の一覧' },
      en: `<table>
<thead><tr><th>Method</th><th>Fee</th><th>Limit</th><th>When you are charged</th><th>Not available for</th></tr></thead>
<tbody>
<tr><td>Credit and debit cards: Visa, Mastercard, JCB, American Express, Diners Club</td><td>Free</td><td>Your card's limit</td><td><strong>At dispatch</strong> (an authorisation hold is placed when you order)</td><td>—</td></tr>
<tr><td>Card instalments: 3, 6, 10, 12 or 24 payments</td><td>Set by your card issuer; none from Marketa</td><td>Orders of <strong>¥10,000 or more</strong></td><td>At dispatch, then on your issuer's schedule</td><td>Orders under ¥10,000; debit and prepaid cards</td></tr>
<tr><td>Marketa Points (1 point = ¥1)</td><td>Free</td><td>Up to the order total</td><td>Deducted when you order</td><td>Buying gift cards</td></tr>
<tr><td>Marketa Gift Card balance</td><td>Free</td><td>Your balance</td><td>Deducted when you order</td><td>Buying other gift cards</td></tr>
<tr><td>Convenience-store payment and Pay-easy</td><td>Free</td><td>Up to ¥299,999 per order</td><td>You pay <strong>within 3 days</strong>; we ship after payment is confirmed</td><td>Orders over ¥299,999</td></tr>
<tr><td>Cash on delivery</td><td><strong>¥330</strong> per order</td><td>Up to ¥300,000</td><td>Paid in cash to the driver</td><td>Items that sellers ship themselves, Marketa Lockers, cool delivery</td></tr>
<tr><td>Kumo Mobile carrier billing</td><td>Free</td><td><strong>¥50,000 a month</strong> (¥10,000 if you are under 20)</td><td>Added to your phone bill for the month of dispatch</td><td>Gift cards</td></tr>
</tbody>
</table>
<p><small>You can combine Marketa Points or a gift card balance with any one other method. Orders containing items from several sellers are charged separately as each seller dispatches.</small></p>`,
      ja: `<table>
<thead><tr><th>お支払い方法</th><th>手数料</th><th>利用上限</th><th>ご請求のタイミング</th><th>ご利用いただけないもの</th></tr></thead>
<tbody>
<tr><td>クレジットカード・デビットカード（Visa、Mastercard、JCB、American Express、Diners Club）</td><td>無料</td><td>カードのご利用可能枠</td><td><strong>商品の発送時</strong>（ご注文時に与信枠を確保します）</td><td>―</td></tr>
<tr><td>クレジットカード分割払い（3・6・10・12・24回）</td><td>カード会社所定の手数料（マルケタの手数料はなし）</td><td><strong>1万円以上</strong>のご注文</td><td>発送時。以降はカード会社のスケジュールによります</td><td>1万円未満のご注文、デビット・プリペイドカード</td></tr>
<tr><td>マルケタポイント（1ポイント＝1円）</td><td>無料</td><td>ご注文金額まで</td><td>ご注文時に差し引き</td><td>ギフトカードの購入</td></tr>
<tr><td>マルケタギフトカード残高</td><td>無料</td><td>残高まで</td><td>ご注文時に差し引き</td><td>ほかのギフトカードの購入</td></tr>
<tr><td>コンビニ払い・ペイジー</td><td>無料</td><td>1回のご注文につき299,999円まで</td><td>ご注文から<strong>3日以内</strong>にお支払い。ご入金確認後に発送</td><td>299,999円を超えるご注文</td></tr>
<tr><td>代金引換</td><td>1回のご注文につき<strong>330円</strong></td><td>30万円まで</td><td>お届け時にドライバーへ現金でお支払い</td><td>出品者発送の商品、マルケタロッカー受取、クール便</td></tr>
<tr><td>クモモバイル キャリア決済</td><td>無料</td><td><strong>月5万円まで</strong>（20歳未満は月1万円）</td><td>発送月の携帯電話料金と合算</td><td>ギフトカード</td></tr>
</tbody>
</table>
<p><small>マルケタポイント・ギフトカード残高は、ほかのお支払い方法1つと併用できます。複数の出品者の商品を含むご注文は、出品者ごとの発送時にそれぞれご請求します。</small></p>`,
    },
    {
      id: 'cards',
      h: { en: 'Cards: why you are charged at dispatch', ja: 'クレジットカード：発送時のご請求について' },
      en: `<ul>
<li>When you order, we place an <strong>authorisation hold</strong> for the order total. The actual charge happens when each item is dispatched; the hold is then released. With a debit card, the hold and the charge may both appear for a few days.</li>
<li>Items dispatched on different days are charged separately. A made-to-order Kagami Kiln item, for example, is charged when it is dispatched 3–4 weeks later.</li>
<li>If you cancel before dispatch, nothing is charged and the hold drops off within a few days (depending on your bank).</li>
<li>3-D Secure may ask you to confirm the payment in your bank's app.</li>
</ul>`,
      ja: `<ul>
<li>ご注文時にご注文金額分の<strong>与信（オーソリ）</strong>を確保し、実際のご請求は商品の発送時に行います。その後、与信は解除されます。デビットカードの場合、与信と実際の引き落としが数日間重複して表示されることがあります。</li>
<li>発送日が異なる商品は、それぞれ別にご請求します。たとえば鏡窯の受注制作品は、3～4週間後の発送時にご請求となります。</li>
<li>発送前にキャンセルした場合はご請求されず、与信は数日以内に解除されます（金融機関により異なります）。</li>
<li>本人認証サービス（3Dセキュア）により、カード会社のアプリでの確認が必要な場合があります。</li>
</ul>`,
    },
    {
      id: 'instalments',
      h: { en: 'Instalments', ja: '分割払い' },
      en: `<p>Pay by credit card in <strong>3, 6, 10, 12 or 24 instalments</strong> on orders of <strong>¥10,000 or more</strong>. Choose the number of payments at checkout; it cannot be changed after ordering. Marketa charges no fee or interest; your card issuer sets its own instalment fees.</p>
<table>
<thead><tr><th>Example</th><th>Price</th><th>Payments</th><th>Per payment, before issuer fees</th></tr></thead>
<tbody>
<tr><td><a href="/en/p/komekko-ih.html">Komekko IH Rice Cooker</a></td><td>¥14,800</td><td>3</td><td>about ¥4,933</td></tr>
<tr><td><a href="/en/p/seiran-headphones.html">Seiran Studio NC headphones</a></td><td>¥24,800</td><td>6</td><td>about ¥4,133</td></tr>
<tr><td><a href="/en/p/inaho-pressure.html">Inaho Pressure IH Rice Cooker</a> 5.5-cup</td><td>¥39,800</td><td>12</td><td>about ¥3,317</td></tr>
<tr><td>Inaho Pressure IH Rice Cooker 10-cup</td><td>¥44,800</td><td>24</td><td>about ¥1,867</td></tr>
</tbody>
</table>
<p><small>The ¥10,000 minimum is for the whole order after coupons and points. Not every card supports every number of payments; checkout shows the options your card allows. A ¥5,980 item cannot be paid in instalments on its own.</small></p>`,
      ja: `<p><strong>1万円以上</strong>のご注文は、クレジットカードで<strong>3・6・10・12・24回</strong>の分割払いをご利用いただけます。回数はご注文手続き画面でお選びください（ご注文後の変更はできません）。マルケタの手数料・利息はかかりませんが、カード会社所定の分割手数料がかかります。</p>
<table>
<thead><tr><th>例</th><th>価格</th><th>回数</th><th>1回あたり（分割手数料別）</th></tr></thead>
<tbody>
<tr><td><a href="/ja/p/komekko-ih.html">コメッコ IH炊飯器</a></td><td>14,800円</td><td>3回</td><td>約4,933円</td></tr>
<tr><td><a href="/ja/p/seiran-headphones.html">セイラン スタジオNC ヘッドホン</a></td><td>24,800円</td><td>6回</td><td>約4,133円</td></tr>
<tr><td><a href="/ja/p/inaho-pressure.html">イナホ 圧力IH炊飯器</a> 5.5合</td><td>39,800円</td><td>12回</td><td>約3,317円</td></tr>
<tr><td>イナホ 圧力IH炊飯器 1升</td><td>44,800円</td><td>24回</td><td>約1,867円</td></tr>
</tbody>
</table>
<p><small>1万円の判定は、クーポン・ポイント適用後のご注文合計で行います。カードによってはご利用いただけない回数があり、ご注文手続き画面には利用可能な回数のみ表示されます。5,980円の商品のみのご注文は分割払いの対象外です。</small></p>`,
    },
    {
      id: 'points',
      h: { en: 'Marketa Points', ja: 'マルケタポイント' },
      en: `<table>
<thead><tr><th></th><th>Not a member</th><th>Marketa Fast member</th></tr></thead>
<tbody>
<tr><td>Fast-eligible items (shipped by Marketa)</td><td>1%</td><td><strong>2%</strong></td></tr>
<tr><td>Items that sellers ship themselves</td><td>1%</td><td>1%</td></tr>
<tr><td>Refund taken as points</td><td colspan="2">+5% bonus on the refunded amount</td></tr>
</tbody>
</table>
<ul>
<li><strong>1 point = ¥1.</strong> Use points from 1 point upwards at checkout, together with any other method.</li>
<li>Points are earned on the amount you pay for items after coupons and points, not on delivery fees, gift wrap or other fees, and are rounded down. They are added the day after delivery.</li>
<li><strong>Points expire 12 months after you last earned points.</strong> Every time you earn points, all your points are extended. Example: if you last earned points on 20 Sep 2026, all your points are valid until 20 Sep 2027 unless you earn more.</li>
<li>Points earned on an item you return are removed.</li>
</ul>
<p><strong>Examples:</strong> <a href="/en/p/ampora-go-20k.html">Ampora Go 20K</a> (¥5,980): 59 points, or 119 for a Fast member. <a href="/en/p/kagami-donabe.html">Kagami Kiln donabe</a> 2-go (¥12,100, shipped by the seller): 121 points for everyone. Seiran headphones (¥24,800) paid with 800 points and ¥24,000 by card: a Fast member earns 480 points.</p>`,
      ja: `<table>
<thead><tr><th></th><th>非会員</th><th>マルケタFast会員</th></tr></thead>
<tbody>
<tr><td>Fast対象商品（マルケタ発送）</td><td>1%</td><td><strong>2%</strong></td></tr>
<tr><td>出品者発送の商品</td><td>1%</td><td>1%</td></tr>
<tr><td>返金をポイントで受け取る場合</td><td colspan="2">返金額に＋5%のボーナス</td></tr>
</tbody>
</table>
<ul>
<li><strong>1ポイント＝1円</strong>。ご注文手続きで1ポイントから、ほかのお支払い方法と併用してご利用いただけます。</li>
<li>ポイントは、クーポン・ポイント利用後の商品代金に対して付与します（配送料・ギフトラッピング代などの手数料は対象外、1ポイント未満切り捨て）。お届けの翌日に付与します。</li>
<li><strong>有効期限は、最後にポイントを獲得した日から12か月</strong>です。ポイントを獲得するたびに、保有ポイント全体の有効期限が延長されます。例：最後の獲得が2026年9月20日なら、その後獲得がない場合は2027年9月20日まで有効です。</li>
<li>返品した商品で獲得したポイントは取り消されます。</li>
</ul>
<p><strong>例：</strong><a href="/ja/p/ampora-go-20k.html">アンポラ Go 20K</a>（5,980円）は59ポイント、Fast会員は119ポイント。<a href="/ja/p/kagami-donabe.html">鏡窯 土鍋</a> 2合（12,100円・出品者発送）はどなたも121ポイント。セイランのヘッドホン（24,800円）を800ポイント＋カード24,000円で購入した場合、Fast会員の獲得ポイントは480ポイントです。</p>`,
    },
    {
      id: 'gift-cards',
      h: { en: 'Marketa Gift Cards', ja: 'マルケタギフトカード' },
      en: `<ul>
<li>Add a gift card to your balance in Your Account &gt; Gift cards; the balance is used first at checkout unless you untick it.</li>
<li>Gift cards are available from ¥1,000 to ¥50,000 and the balance is valid for 10 years from when it was added.</li>
<li>Gift cards cannot be bought with points, another gift card or Kumo Mobile carrier billing, and they cannot be returned.</li>
</ul>`,
      ja: `<ul>
<li>アカウントサービス＞ギフトカードから残高に登録すると、ご注文時に優先して使用されます（チェックを外せば使用しません）。</li>
<li>ギフトカードは1,000円～50,000円。残高の有効期限は登録日から10年間です。</li>
<li>ギフトカードは、ポイント、ほかのギフトカード、クモモバイル キャリア決済ではご購入いただけません。また、返品はできません。</li>
</ul>`,
    },
    {
      id: 'konbini',
      h: { en: 'Convenience-store payment and Pay-easy', ja: 'コンビニ払い・ペイジー' },
      en: `<ol>
<li>Choose "Convenience store / Pay-easy" at checkout. We email you a payment number.</li>
<li>Pay at any convenience store counter or terminal, or by Pay-easy at an ATM or in online banking.</li>
<li><strong>Pay within 3 days</strong>: by 23:59 on the third day after you order. If you do not, the order is cancelled automatically and any coupon you used is returned to you if it is still valid.</li>
<li>We usually confirm your payment within 30 minutes and then ship. <strong>Delivery dates start from payment</strong>, not from your order.</li>
</ol>
<table>
<thead><tr><th>You order</th><th>Pay by</th><th>If you pay (Harukawa city, item in stock at HRK1)</th><th>Next-day delivery arrives</th></tr></thead>
<tbody>
<tr><td>Mon 5 Oct, 10:40</td><td>Thu 8 Oct, 23:59</td><td>Mon 5 Oct, 13:00</td><td>Tue 6 Oct</td></tr>
<tr><td>Mon 5 Oct, 10:40</td><td>Thu 8 Oct, 23:59</td><td>Tue 6 Oct, 15:00 (after the 14:00 cut-off)</td><td>Thu 8 Oct</td></tr>
<tr><td>Sat 10 Oct, 20:00</td><td>Tue 13 Oct, 23:59</td><td>Sun 11 Oct, 11:00</td><td>Mon 12 Oct</td></tr>
</tbody>
</table>
<p><small>Up to ¥299,999 per order. No payment fee. Stock and Lightning Deal prices are held for you until the deadline. Refunds on these orders are made by bank transfer within 5–7 business days.</small></p>`,
      ja: `<ol>
<li>ご注文手続きで「コンビニ・ペイジー」をお選びください。お支払い番号をメールでお送りします。</li>
<li>コンビニのレジ・店頭端末、またはATM・ネットバンキング（ペイジー）でお支払いください。</li>
<li><strong>お支払い期限はご注文から3日以内</strong>（ご注文日の3日後の23:59まで）です。期限を過ぎるとご注文は自動でキャンセルされます。ご利用のクーポンは、有効期限内であれば再度ご利用いただけます。</li>
<li>ご入金は通常30分以内に確認し、その後発送します。<strong>お届け日はご入金確認時点から計算</strong>します。</li>
</ol>
<table>
<thead><tr><th>ご注文日時</th><th>お支払い期限</th><th>お支払い日時（春川市内・HRK1在庫あり）</th><th>翌日配送のお届け日</th></tr></thead>
<tbody>
<tr><td>10月5日（月）10:40</td><td>10月8日（木）23:59</td><td>10月5日（月）13:00</td><td>10月6日（火）</td></tr>
<tr><td>10月5日（月）10:40</td><td>10月8日（木）23:59</td><td>10月6日（火）15:00（14時の締め切り後）</td><td>10月8日（木）</td></tr>
<tr><td>10月10日（土）20:00</td><td>10月13日（火）23:59</td><td>10月11日（日）11:00</td><td>10月12日（月・祝）</td></tr>
</tbody>
</table>
<p><small>1回のご注文につき299,999円まで。お支払い手数料は無料です。在庫とタイムセール価格はお支払い期限まで確保されます。これらのご注文の返金は、5～7営業日以内に銀行振込で行います。</small></p>`,
    },
    {
      id: 'cod',
      h: { en: 'Cash on delivery', ja: '代金引換' },
      en: `<ul>
<li>Fee <strong>¥330 per order</strong>, not covered by Marketa Fast. Orders up to <strong>¥300,000</strong>.</li>
<li>Pay the driver in cash (exact change appreciated); cards cannot be used at the door.</li>
<li>Not available for items that sellers ship themselves, for Marketa Locker or convenience-store pick-up, for cool delivery or for "leave at the door".</li>
<li>If you return the item, the refund is made by bank transfer within 5–7 business days; the ¥330 fee is refunded only if the return is our mistake.</li>
<li>If cash-on-delivery parcels are repeatedly not accepted, we may turn off cash on delivery for your account.</li>
</ul>`,
      ja: `<ul>
<li>手数料は<strong>1回のご注文につき330円</strong>（マルケタFastの特典対象外）。ご注文金額<strong>30万円まで</strong>。</li>
<li>お届け時にドライバーへ現金でお支払いください（お釣りのないようご用意いただけると助かります）。カードはご利用いただけません。</li>
<li>出品者発送の商品、マルケタロッカー・コンビニ受取、クール便、置き配ではご利用いただけません。</li>
<li>返品の場合は5～7営業日以内に銀行振込で返金します。代引手数料330円は、当社の責任による返品の場合のみ返金します。</li>
<li>代金引換のお荷物のお受け取りがないことが続いた場合、代金引換をご利用いただけなくなることがあります。</li>
</ul>`,
    },
    {
      id: 'carrier',
      h: { en: 'Kumo Mobile carrier billing', ja: 'クモモバイル キャリア決済' },
      en: `<ul>
<li>Add purchases to your Kumo Mobile phone bill. Sign in with your Kumo ID and confirm with your 4-digit PIN.</li>
<li>Limit: <strong>¥50,000 a month</strong>, or <strong>¥10,000 a month if you are under 20</strong>. The limit is per phone line and includes everything you buy with carrier billing that month, not only on Marketa.</li>
<li>Charged in the month the item is dispatched and shown on your next bill. Refunds are credited on the next or the following bill.</li>
<li>Cannot be used for Marketa Gift Cards. Can be used for the Marketa Fast fee and to start a free trial.</li>
<li>Other carriers' billing is not supported.</li>
</ul>`,
      ja: `<ul>
<li>お買い物の代金をクモモバイルの携帯電話料金とまとめてお支払いいただけます。クモIDでログインし、4桁の暗証番号で確認してください。</li>
<li>ご利用上限は<strong>月5万円</strong>（<strong>20歳未満の方は月1万円</strong>）。上限は回線ごとで、マルケタ以外でのキャリア決済のご利用分も含みます。</li>
<li>発送月のご利用分として、翌月の携帯電話料金と合わせてご請求します。返金は翌月または翌々月のご請求で相殺します。</li>
<li>マルケタギフトカードの購入にはご利用いただけません。マルケタFastの会費や無料体験のお申し込みにはご利用いただけます。</li>
<li>他社のキャリア決済には対応していません。</li>
</ul>`,
    },
    {
      id: 'coupons',
      h: { en: 'Coupons, Lightning Deals and the Lantern Festival Sale', ja: 'クーポン・タイムセール・灯籠まつりセール' },
      en: `<ul>
<li><strong>Coupons</strong> are clipped on the product page ("Clip coupon") and applied automatically at checkout. Each coupon can be used <strong>once per customer</strong>. Some are for Marketa Fast members only. A coupon can be combined with a sale price unless the coupon says otherwise.</li>
<li><strong>Lantern Festival Sale:</strong> Fri 2 Oct – <strong>Sun 11 Oct, 23:59</strong>. Many items are discounted for the whole sale.</li>
<li><strong>Lightning Deals</strong> change every day. Each deal runs until its time ends or the deal stock runs out; Marketa Fast members can buy 30 minutes before the published start time. <a href="/en/deals.html">Today's deals</a>.</li>
</ul>`,
      ja: `<ul>
<li><strong>クーポン</strong>は商品ページで「クーポンを獲得」を押すと、ご注文手続きで自動的に適用されます。各クーポンのご利用は<strong>お一人様1回まで</strong>です。マルケタFast会員限定のクーポンもあります。クーポンに記載がない限り、セール価格と併用できます。</li>
<li><strong>灯籠まつりセール：</strong>10月2日（金）～<strong>10月11日（日）23:59</strong>。期間中、多くの商品が割引価格になります。</li>
<li><strong>タイムセール</strong>の対象商品は毎日入れ替わります。各セールは終了時刻まで、またはセール在庫がなくなるまで。マルケタFast会員は開始時刻の30分前から購入できます。<a href="/ja/deals.html">本日のタイムセール</a></li>
</ul>`,
    },
    {
      id: 'failed',
      h: { en: 'If a payment fails', ja: '決済エラーになった場合' },
      en: `<ul>
<li><strong>Card declined at dispatch:</strong> we hold the item and email you. Update the card in Your Orders within <strong>3 days</strong>, or the order is cancelled. The delivery date moves to match the new payment.</li>
<li><strong>Convenience-store payment not made in 3 days:</strong> the order is cancelled automatically. No fee is charged.</li>
<li><strong>Kumo Mobile limit reached:</strong> checkout asks you to choose another method. The limit resets on the 1st of each month.</li>
<li><strong>Marketa Fast fee fails:</strong> we try again for 7 days. Benefits are paused until the fee is paid, and the membership ends if it is still unpaid after 14 days.</li>
</ul>
<p><small>Marketa will never ask you to pay by bank transfer to a personal account or to buy gift cards to "unlock" an order. If you receive such a request, contact us on 0120-555-818.</small></p>`,
      ja: `<ul>
<li><strong>発送時にカードが承認されなかった場合：</strong>商品の発送を保留し、メールでお知らせします。<strong>3日以内</strong>に注文履歴からカード情報を更新してください。期限を過ぎるとご注文はキャンセルされます。お届け日は、お支払い完了時点にあわせて変更となります。</li>
<li><strong>コンビニ払いが3日以内に完了しなかった場合：</strong>ご注文は自動でキャンセルされます。手数料はかかりません。</li>
<li><strong>クモモバイルのご利用上限に達した場合：</strong>ご注文手続き画面で別のお支払い方法をお選びください。上限は毎月1日にリセットされます。</li>
<li><strong>マルケタFastの会費のお支払いができなかった場合：</strong>7日間再請求を行います。お支払いが完了するまで特典は停止し、14日を過ぎてもお支払いがない場合は会員資格が終了します。</li>
</ul>
<p><small>マルケタが個人名義の口座への振込や、注文の「ロック解除」のためのギフトカード購入をお願いすることは一切ありません。このような連絡を受けた場合は、0120-555-818までご連絡ください。</small></p>`,
    },
  ],
};

const faq = {
  id: 'faq',
  title: { en: 'Frequently asked questions', ja: 'よくあるご質問' },
  intro: {
    en: 'Short answers to the questions we hear most, with links to the full rules. Times and dates assume an address in Harukawa city and an order placed today, Monday 5 October.',
    ja: 'お問い合わせの多いご質問に簡潔にお答えします。詳しい条件は各リンク先をご覧ください。日時は、春川市内のお届け先で本日10月5日（月）にご注文の場合の例です。',
  },
  sections: [
    {
      id: 'faq-delivery',
      h: { en: 'Orders and delivery', ja: 'ご注文・お届け' },
      faq: [
        {
          q: { en: 'It is 10:40. Can my order still arrive today?', ja: '今10時40分です。今日中に届きますか？' },
          a: {
            en: 'Yes, if the address is in Harukawa city and the item is in stock at HRK1: order by <strong>11:00</strong> for same-day delivery between 18:00 and 22:00. It costs ¥900; Fast members pay nothing on orders of ¥2,000 or more and ¥300 below that. <a href="/en/help/shipping.html#same-day">Same-day delivery</a>.',
            ja: '春川市内のお届け先で、HRK1に在庫がある商品なら可能です。<strong>11時まで</strong>にご注文いただくと、当日18時～22時にお届けします。料金は900円、Fast会員は2,000円以上で無料、2,000円未満は300円です。<a href="/ja/help/shipping.html#same-day">当日お届けについて</a>',
          },
        },
        {
          q: { en: 'What is the latest time to order for next-day delivery?', ja: '翌日配送の注文締め切りは何時ですか？' },
          a: {
            en: '14:00 for Harukawa city and the rest of Minori Prefecture, 12:00 for neighbouring prefectures and 10:00 for the rest of Honshu, Shikoku and Kyushu. Next-day delivery is not available to Hokkaido, Okinawa or remote islands. It costs ¥600 (¥800 to the rest of Honshu etc.) and is free for Fast members on Fast-eligible items.',
            ja: '春川市内・みのり県内は14時、隣接県は12時、その他の本州・四国・九州は10時です。北海道・沖縄・離島は翌日配送の対象外です。料金は600円（その他の本州等は800円）、Fast会員はFast対象商品なら無料です。',
          },
        },
        {
          q: { en: 'Why does the Matte Black kettle arrive later than the Silver one?', ja: '同じケトルなのに、マットブラックだけお届けが遅いのはなぜですか？' },
          a: {
            en: 'Colours and sizes can be stocked in different warehouses. The Silver <a href="/en/p/corvo-kettle.html">Corvo Kettle</a> is at HRK1 in Harukawa (next day, Tue 6 Oct); the Matte Black is at a Marketa warehouse outside Minori Prefecture, so it arrives Thu 8 Oct for Fast members and Sat 10 Oct by standard delivery.',
            ja: '色やサイズによって在庫している倉庫が異なるためです。<a href="/ja/p/corvo-kettle.html">コルヴォ 電気ケトル</a>のシルバーは春川のHRK1に在庫があり翌日（10月6日（火））お届け、マットブラックはみのり県外のマルケタ倉庫にあるため、Fast会員は10月8日（木）、通常配送では10月10日（土）のお届けとなります。',
          },
        },
        {
          q: { en: 'I ordered from Marketa and Kagami Kiln together. Why are there two parcels and two delivery fees?', ja: 'マルケタと鏡窯の商品を一緒に注文したのに、荷物も配送料も別々なのはなぜですか？' },
          a: {
            en: 'Kagami Kiln packs and ships its pottery itself from Kamagaoka, so it arrives separately (Thu 8 – Fri 9 Oct) with the kiln’s own fee: ¥700, free on Kagami Kiln orders of ¥5,000 or more. Marketa Fast does not cover sellers’ shipping. <a href="/en/help/shipping.html#sellers">Sellers that ship themselves</a>.',
            ja: '鏡窯の商品は、窯ヶ丘の窯元から直接梱包・発送されるため、別便（10月8日（木）～9日（金））でのお届けとなり、鏡窯の配送料（700円、鏡窯の商品5,000円以上で無料）がかかります。出品者発送の配送料はマルケタFastの特典対象外です。<a href="/ja/help/shipping.html#sellers">出品者が発送する商品</a>',
          },
        },
        {
          q: { en: 'Will the Lantern Festival affect my delivery?', ja: '灯籠まつりの影響でお届けが遅れますか？' },
          a: {
            en: 'Only inside the closure area in central Harukawa (around the castle, Ōtemachi, Honmachi, Kawabata and the riverside road). On Sat 10 Oct (closed 14:00–22:30) and Sun 11 Oct (closed 12:00–21:30), morning deliveries go ahead; afternoon and evening deliveries move to the next morning, and same-day delivery is not available there. <a href="/en/help/shipping.html#delays">Details</a>.',
            ja: '影響があるのは春川市中心部の交通規制区域内（春川城周辺、大手町、本町、川端、河川沿い道路）のみです。10月10日（土）（14:00～22:30通行止め）と11日（日）（12:00～21:30通行止め）は、午前中のお届けは通常どおり、午後・夜間のお届けは翌朝に変更し、区域内への当日お届けは休止します。<a href="/ja/help/shipping.html#delays">詳しくはこちら</a>',
          },
        },
        {
          q: { en: 'Can I collect my parcel at Harukawa Central Station?', ja: '春川中央駅で荷物を受け取れますか？' },
          a: {
            en: 'Yes. Choose the Marketa Locker at Harukawa Central Station (by the Kagami Line ticket gates, 5:00–24:30). Standard delivery to a locker is always free. Parcels are held for 3 days and must fit 45 × 35 × 30 cm and 10 kg; no cool delivery or cash on delivery.',
            ja: 'はい。春川中央駅のマルケタロッカー（鏡線改札横、5:00～24:30）をお選びください。ロッカー受取の通常配送はいつでも無料です。保管期間は3日間で、45×35×30cm・10kgまでの荷物に限ります。クール便・代金引換はご利用いただけません。',
          },
        },
        {
          q: { en: 'I missed my delivery. What now?', ja: '不在で受け取れませんでした。どうすればいいですか？' },
          a: {
            en: 'Request a free redelivery on <a href="/en/track.html">Track your package</a> or from the email link; ask by 17:00 to get it the same evening. The depot keeps the parcel for 7 days (cool parcels 3 days).',
            ja: '<a href="/ja/track.html">配送状況の確認</a>またはメールのリンクから、無料で再配達をご依頼ください。17時までのご依頼で当日夜にお届けできます。営業所での保管期間は7日間（クール便は3日間）です。',
          },
        },
      ],
    },
    {
      id: 'faq-returns',
      h: { en: 'Returns and refunds', ja: '返品・返金' },
      faq: [
        {
          q: { en: 'Can I return earbuds I have tried?', ja: '試しに使ったイヤホンは返品できますか？' },
          a: {
            en: 'Not if they are in-ear earbuds and you broke the hygiene seal, unless they are faulty. With the seal intact, you can return them within 30 days. Over-ear and open-ear headphones can be returned opened, with a 15% restocking fee.',
            ja: 'カナル型（インイヤー）イヤホンで衛生シールを開封した場合は、不良品を除き返品できません。シール未開封なら30日以内に返品できます。オーバーイヤー型・オープンイヤー型のヘッドホンは、開封済みでも返品手数料15%で返品できます。',
          },
        },
        {
          q: { en: 'How much do I get back for opened headphones I don’t like?', ja: '開封したヘッドホンが気に入りません。いくら返金されますか？' },
          a: {
            en: 'Item price minus 15% minus ¥550 return shipping. For <a href="/en/p/seiran-headphones.html">Seiran Studio NC</a> (¥24,800): ¥24,800 − ¥3,720 − ¥550 = <strong>¥20,530</strong>. A paid Fast member does not pay the ¥550: ¥21,080.',
            ja: '商品代金から15%と返送料550円を差し引いた金額です。<a href="/ja/p/seiran-headphones.html">セイラン スタジオNC</a>（24,800円）なら、24,800円－3,720円－550円＝<strong>20,530円</strong>。有料のFast会員は返送料がかからないため21,080円です。',
          },
        },
        {
          q: { en: 'My kettle arrived dented. What do I do?', ja: '届いたケトルがへこんでいました。' },
          a: {
            en: 'Report it within 7 days of delivery in Your Orders with photos of the kettle, the box and the label. You get a free pick-up and a full refund including delivery fees, or a replacement sent next day if it is in stock at HRK1.',
            ja: 'お届けから7日以内に、注文履歴から商品・外箱・送り状の写真を添えてご連絡ください。無料で集荷し、配送料を含めて全額返金するか、HRK1に在庫があれば翌日に交換品をお届けします。',
          },
        },
        {
          q: { en: 'I am a Fast member. Are all my returns free?', ja: 'Fast会員なら返品はすべて無料ですか？' },
          a: {
            en: 'Change-of-mind returns are free only for <strong>paid</strong> members (not during the free trial) and only for items <strong>sold by Marketa</strong>. Items sold by other sellers, even if shipped from Marketa, cost ¥550 to return, and the 15% restocking fee on opened electronics still applies.',
            ja: 'お客様都合の返品が無料になるのは、<strong>有料会員</strong>（無料体験中は対象外）が<strong>マルケタ販売</strong>の商品を返品する場合のみです。他の出品者が販売する商品は、マルケタ発送であっても返送料550円がかかります。また、開封済み家電の返品手数料15%はかかります。',
          },
        },
        {
          q: { en: 'How long does a refund take?', ja: '返金までどのくらいかかりますか？' },
          a: {
            en: 'Inspection takes 1–2 business days after the return reaches us. Then: card 3–5 business days; Marketa Points immediately (+5% bonus); convenience-store payment or cash on delivery by bank transfer within 5–7 business days; Kumo Mobile carrier billing on the next or following bill.',
            ja: '返品商品の到着後1～2営業日で検品します。その後、クレジットカードは3～5営業日、マルケタポイントは即時（＋5%ボーナス）、コンビニ払い・代金引換は5～7営業日以内に銀行振込、クモモバイル キャリア決済は翌月または翌々月のご請求で相殺します。',
          },
        },
        {
          q: { en: 'Can I return a Kagami Kiln mug because the glaze looks different from the photo?', ja: '鏡窯のマグの釉薬が写真と違います。返品できますか？' },
          a: {
            en: 'Kagami Kiln does not treat variation in glaze, colour or size, or small pinholes, as a defect: it is the nature of handmade ware. You can still return an unused item within 14 days of delivery and pay the return shipping yourself. Engraved and made-to-order items cannot be returned. <a href="/en/seller/kagami.html">Kagami Kiln’s policy</a>.',
            ja: '鏡窯では、釉薬・色・大きさのばらつきや小さなピンホールは手作りの器の特性であり、不良とはしていません。未使用品であればお届けから14日以内に、返送料お客様負担で返品できます。名入れ品・受注制作品は返品できません。<a href="/ja/seller/kagami.html">鏡窯の返品について</a>',
          },
        },
        {
          q: { en: 'BrightDeal Trading has not answered my return request.', ja: 'ブライトディール商事から返品の返事が来ません。' },
          a: {
            en: 'BrightDeal replies on weekdays 10:00–17:00, by message only. If there is no reply within 2 business days, use Marketa Purchase Protection: Your Orders &gt; "Problem with this order" &gt; "Ask Marketa to step in". Claims are possible up to 90 days after the latest estimated delivery date. <a href="/en/help/returns.html#protection">Purchase Protection</a>.',
            ja: 'ブライトディール商事の対応は平日10時～17時、メッセージのみです。2営業日以内に返信がない場合は、注文履歴＞「注文に関する問題」＞「マルケタに対応を依頼する」からマルケタ購入者保護をご利用ください。お届け予定日の最終日から90日以内なら申請できます。<a href="/ja/help/returns.html#protection">マルケタ購入者保護</a>',
          },
        },
        {
          q: { en: 'My power bank stopped working after five months.', ja: 'モバイルバッテリーが5か月で使えなくなりました。' },
          a: {
            en: 'After 30 days, the warranty applies. Ampora power banks have an 18-month manufacturer’s warranty and the Kestrel 27K 2 years; contact the manufacturer with your order confirmation, or chat with us. The <a href="/en/p/titancell-40k.html">TitanCell 40000</a> from BrightDeal has a 6-month seller warranty, so contact BrightDeal now, before it runs out.',
            ja: '30日を過ぎた故障は保証の対象です。アンポラのモバイルバッテリーはメーカー保証18か月、ケストレル 27Kは2年です。注文確認書を添えてメーカーにお問い合わせいただくか、マルケタのチャットにご連絡ください。ブライトディール商事の<a href="/ja/p/titancell-40k.html">タイタンセル 40000</a>は出品者保証6か月のため、期限が切れる前にお早めに同社へご連絡ください。',
          },
        },
      ],
    },
    {
      id: 'faq-fast',
      h: { en: 'Marketa Fast', ja: 'マルケタFast' },
      faq: [
        {
          q: { en: 'How do I get the free trial?', ja: '無料体験はどうすれば始められますか？' },
          a: {
            en: 'Choose "Try Fast free for 30 days" at checkout or on the <a href="/en/help/fast.html">Fast page</a>. You need a credit card or Kumo Mobile carrier billing. Unless you cancel before the 30 days end, it becomes the ¥600 monthly plan.',
            ja: 'ご注文手続き画面または<a href="/ja/help/fast.html">Fastのページ</a>で「30日間無料で試す」をお選びください。クレジットカードまたはクモモバイル キャリア決済のご登録が必要です。30日以内に解約しない場合、月額600円のプランに移行します。',
          },
        },
        {
          q: { en: 'I had a trial last year. Can I have another one?', ja: '去年無料体験をしました。もう一度できますか？' },
          a: {
            en: 'Only if your last trial or membership ended more than 12 months ago. The trial is once per account; otherwise you can join the paid plan straight away.',
            ja: '前回の無料体験または会員資格の終了から12か月以上経っていればご利用いただけます。無料体験は1アカウント1回までのため、対象外の場合は有料プランにすぐご登録いただけます。',
          },
        },
        {
          q: { en: 'Is there a student discount?', ja: '学割はありますか？' },
          a: {
            en: 'Yes: Fast Student is ¥300 a month or ¥2,950 a year, with a 6-month free trial if you have a university email address (for example at Harukawa University). The benefits are the same as Fast.',
            ja: 'はい。Fast Studentは月額300円または年額2,950円で、大学のメールアドレス（春川大学など）をお持ちの方は6か月間無料でお試しいただけます。特典はFastと同じです。',
          },
        },
        {
          q: { en: 'If I cancel my annual membership, do I get money back?', ja: '年額会員を解約したら返金されますか？' },
          a: {
            en: 'Within 14 days of paying, and only if you have not used any benefit, you get the full ¥5,900 back. Otherwise you get one-twelfth of the fee for each unused full month: with 7 months left, ¥3,441. Monthly plans are not refunded; they run to the end of the paid month.',
            ja: 'お支払いから14日以内で特典を一度も利用していなければ、5,900円を全額返金します。それ以外の場合は、未使用の満月数×年会費の12分の1を返金します（7か月残っていれば3,441円）。月額プランは返金なしで、お支払い済みの月の末日まで特典をご利用いただけます。',
          },
        },
        {
          q: { en: 'Does Fast make shipping free for Kagami Kiln or Minori Yuzu Farm?', ja: 'Fast会員なら鏡窯やみのり柚子園の配送料も無料ですか？' },
          a: {
            en: 'No. Items that sellers ship themselves use the seller’s fees: Kagami Kiln ¥700 (free on ¥5,000+), Minori Yuzu Farm ¥600 (free on ¥4,000+). The farm’s bath salts, hand cream and marmalade set ship from Marketa, so those are free for members and arrive next day.',
            ja: 'いいえ。出品者が発送する商品は各出品者の配送料となります（鏡窯700円・5,000円以上で無料、みのり柚子園600円・4,000円以上で無料）。ただし、みのり柚子園のバスソルト・ハンドクリーム・マーマレードセットはマルケタから発送するため、会員は無料・翌日お届けとなります。',
          },
        },
      ],
    },
    {
      id: 'faq-payment',
      h: { en: 'Payment and points', ja: 'お支払い・ポイント' },
      faq: [
        {
          q: { en: 'Can I pay at a convenience store?', ja: 'コンビニで支払えますか？' },
          a: {
            en: 'Yes, up to ¥299,999 and with no fee. Pay within 3 days (by 23:59 on the third day) or the order is cancelled. We ship after the payment is confirmed, so next-day delivery counts from your payment, not your order.',
            ja: 'はい、299,999円まで手数料無料でご利用いただけます。ご注文から3日以内（3日後の23:59まで）にお支払いがない場合はキャンセルとなります。発送はご入金確認後のため、翌日配送もお支払い時点から計算します。',
          },
        },
        {
          q: { en: 'Why hasn’t my card been charged yet?', ja: 'まだカードに請求が来ていないのはなぜですか？' },
          a: {
            en: 'Cards are charged when the item is dispatched. At ordering we only place an authorisation hold. Made-to-order items, such as a Kagami Kiln amber donabe, are charged when they leave the kiln 3–4 weeks later.',
            ja: 'カードへのご請求は商品の発送時に行います。ご注文時は与信の確保のみです。鏡窯の飴釉土鍋などの受注制作品は、3～4週間後の発送時にご請求となります。',
          },
        },
        {
          q: { en: 'Can I pay for a ¥5,980 item in instalments?', ja: '5,980円の商品を分割払いにできますか？' },
          a: {
            en: 'No. Instalments (3, 6, 10, 12 or 24) are available on orders of ¥10,000 or more, by credit card. Instalment fees are set by your card issuer.',
            ja: 'できません。分割払い（3・6・10・12・24回）は、1万円以上のご注文でクレジットカードをご利用の場合に限ります。分割手数料はカード会社所定のものとなります。',
          },
        },
        {
          q: { en: 'When do my Marketa Points expire?', ja: 'マルケタポイントの有効期限はいつですか？' },
          a: {
            en: '12 months after the last time you earned points. Each time you earn points, all your points are extended. You can see the date in Your Account &gt; Marketa Points.',
            ja: '最後にポイントを獲得した日から12か月後です。ポイントを獲得するたびに、保有ポイント全体の有効期限が延長されます。有効期限はアカウントサービス＞マルケタポイントでご確認いただけます。',
          },
        },
        {
          q: { en: 'Can I buy a gift card with Kumo Mobile carrier billing?', ja: 'クモモバイルのキャリア決済でギフトカードを買えますか？' },
          a: {
            en: 'No. Carrier billing cannot be used for Marketa Gift Cards. For everything else the limit is ¥50,000 a month (¥10,000 if you are under 20).',
            ja: 'できません。マルケタギフトカードはキャリア決済の対象外です。その他の商品は月5万円（20歳未満は月1万円）までご利用いただけます。',
          },
        },
        {
          q: { en: 'Can I use cash on delivery with a locker?', ja: 'ロッカー受取で代金引換は使えますか？' },
          a: {
            en: 'No. Cash on delivery (¥330, up to ¥300,000) is for home delivery only, and not for cool delivery or items that sellers ship themselves. Pay by card, points or at a convenience store instead.',
            ja: 'ご利用いただけません。代金引換（手数料330円、30万円まで）はご自宅等へのお届けのみで、クール便や出品者発送の商品も対象外です。カード、ポイント、コンビニ払いなどをご利用ください。',
          },
        },
      ],
    },
    {
      id: 'faq-deals',
      h: { en: 'Deals, coupons and sellers', ja: 'セール・クーポン・出品者' },
      faq: [
        {
          q: { en: 'When does the Lantern Festival Sale end?', ja: '灯籠まつりセールはいつまでですか？' },
          a: {
            en: 'Sun 11 Oct at 23:59. It started on Fri 2 Oct. Lightning Deals change every day, and Fast members can buy each one 30 minutes early. <a href="/en/deals.html">Today’s deals</a>.',
            ja: '10月11日（日）23:59までです（10月2日（金）開始）。タイムセールの対象商品は毎日入れ替わり、Fast会員は各セールに30分早く参加できます。<a href="/ja/deals.html">本日のセール</a>',
          },
        },
        {
          q: { en: 'How do coupons work?', ja: 'クーポンの使い方を教えてください。' },
          a: {
            en: 'Clip the coupon on the product page; it is applied automatically at checkout. Each coupon can be used once per customer. Coupons marked "Fast members" work only with an active membership, including the free trial.',
            ja: '商品ページでクーポンを獲得すると、ご注文手続きで自動的に適用されます。各クーポンはお一人様1回までです。「Fast会員限定」のクーポンは、無料体験中を含む会員の方のみご利用いただけます。',
          },
        },
        {
          q: { en: 'What is the difference between "ships from Marketa" and "ships from the seller"?', ja: '「発送：マルケタ」と「発送：出品者」は何が違いますか？' },
          a: {
            en: '"Sold by <em>seller</em>, ships from Marketa" means the item is stored at our warehouse: Marketa’s delivery speeds, fees and 30-day return policy apply, and it is Fast-eligible. "Ships from the seller" means the seller packs and sends it: their own fees, times and return policy apply.',
            ja: '「販売：出品者／発送：マルケタ」は、商品をマルケタの倉庫で保管・発送するもので、マルケタの配送日数・配送料・30日間の返品ポリシーが適用され、Fast対象となります。「発送：出品者」は出品者が梱包・発送するもので、出品者の配送料・お届け日数・返品ポリシーが適用されます。',
          },
        },
        {
          q: { en: 'Is the Tokiya mug pair real Harukawa ware?', ja: 'トキヤのペアマグは本物の春川焼ですか？' },
          a: {
            en: 'No. The <a href="/en/p/tokiya-mug-pair.html">Tokiya "Harukawa-style" mug pair</a> sold by BrightDeal Trading is factory-made in China in a Harukawa style. Genuine Harukawa ware on Marketa comes from <a href="/en/seller/kagami.html">Kagami Kiln</a> in Kamagaoka, Harukawa.',
            ja: 'いいえ。ブライトディール商事が販売する<a href="/ja/p/tokiya-mug-pair.html">トキヤ「春川風」ペアマグ</a>は、春川焼風のデザインで中国の工場で製造された商品です。マルケタで扱う本物の春川焼は、春川市窯ヶ丘の<a href="/ja/seller/kagami.html">鏡窯</a>の商品です。',
          },
        },
      ],
    },
  ],
};

export default [index, shipping, returns, fast, payment, faq];
