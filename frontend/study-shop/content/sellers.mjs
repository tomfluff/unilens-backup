// Marketa seller pages: Kagami Kiln, Harvest Yuzu Farm, BrightDeal Trading (English and Japanese).
// Shape: { id, name, rating, ratings, positive, since, location, tagline, about, shipping, returns, contact, legal, hist, feedback }.
// Policies follow the Marketa content brief; keep them in step with help.mjs and the product files.

export default [
  {
    id: 'kagami',
    name: { en: 'Kagami Kiln', ja: '鏡窯' },
    rating: 4.8,
    ratings: 612,
    positive: 98,
    since: 2020,
    location: { en: 'Kamagaoka pottery district, Springvale, Harvest Prefecture', ja: 'みのり県春川市 窯ヶ丘' },
    tagline: {
      en: 'Springvale ware from a family kiln in Kamagaoka, since 1891',
      ja: '明治二十四年創業。窯ヶ丘の家族窯がつくる春川焼',
    },
    about: {
      en: `<p>Kagami Kiln was founded in <strong>1891</strong> in Kamagaoka, the hillside pottery district above the Mirror River where Springvale ware has been made since the castle town was young. Today the kiln is run by the fourth-generation potter <strong>Kagami Sōichi</strong>, with his wife Yoshiko on glazes and their daughter Mio on the wheel.</p>
<p>Every piece is thrown on the wheel from clay dug in the Mirror River valley and fired in our gas kiln; twice a year we also fire the old climbing kiln with wood. Our best-known glazes are the <strong>yuzu-yellow ash glaze</strong>, made with ash from pruned yuzu branches from a farm up the valley, a deep <strong>indigo</strong>, <strong>celadon crackle</strong>, <strong>amber</strong>, <strong>iron brown</strong> and <strong>white ash with blue drips</strong>.</p>
<p>On Marketa: the <a href="/en/p/kagami-donabe.html">donabe rice pot</a>, the <a href="/en/p/kagami-mug-pair.html">mug pair</a>, the <a href="/en/p/kagami-tea-set.html">kyusu tea set</a>, the <a href="/en/p/kagami-plate-set.html">plate set of 5</a> and the <a href="/en/p/kagami-sake-set.html">sake set</a>.</p>
<p><strong>About handmade ware:</strong> no two pieces are the same. Glaze, colour and size vary from the photos, and small pinholes in the glaze are part of the nature of handmade pottery, not a defect. Our donabe is for gas flames only (not IH, microwave or dishwasher) and must be seasoned with rice porridge before first use; the iron-brown plate is not for the microwave.</p>`,
      ja: `<p>鏡窯は<strong>明治24年（1891年）</strong>、鏡川を見下ろす焼き物の里・窯ヶ丘で開窯しました。現在は四代目の<strong>鏡 宗一</strong>が窯を預かり、妻・佳子が釉薬を、娘・美緒がろくろを担当する家族窯です。</p>
<p>器はすべて鏡川流域で採れる土を使い、一点ずつろくろで挽いてガス窯で焼成しています。年に二度は、昔ながらの登り窯で薪焼成も行います。代表的な釉薬は、上流の柚子農園から譲り受けた剪定枝の灰でつくる<strong>柚子灰釉（黄）</strong>、深い<strong>藍</strong>、<strong>青磁貫入</strong>、<strong>飴釉</strong>、<strong>鉄釉</strong>、<strong>白灰釉の青流し</strong>です。</p>
<p>マルケタでの取り扱い：<a href="/ja/p/kagami-donabe.html">土鍋（ごはん鍋）</a>、<a href="/ja/p/kagami-mug-pair.html">ペアマグ</a>、<a href="/ja/p/kagami-tea-set.html">急須セット</a>、<a href="/ja/p/kagami-plate-set.html">銘々皿5枚セット</a>、<a href="/ja/p/kagami-sake-set.html">酒器セット</a>。</p>
<p><strong>手づくりの器について：</strong>ひとつとして同じものはありません。釉薬の流れ方・色味・大きさは写真と異なり、釉面の小さなピンホールも手づくりならではの風合いで、不良品ではありません。土鍋は直火（ガス）専用で、IH・電子レンジ・食洗機には対応していません。初めてお使いになる前に、おかゆで目止めをしてください。鉄釉の皿は電子レンジでのご使用はお控えください。</p>`,
    },
    shipping: {
      en: `<table>
<thead><tr><th></th><th>In stock</th><th>Made to order</th></tr></thead>
<tbody>
<tr><td>Dispatch</td><td>Within 2 business days</td><td>In 3–4 weeks</td></tr>
<tr><td>Order today (Mon 5 Oct), delivery in Springvale</td><td>Thu 8 – Fri 9 Oct</td><td>About 2–9 Nov</td></tr>
<tr><td>Shipping fee</td><td colspan="2">¥700 per order; <strong>free on Kagami Kiln orders of ¥5,000 or more</strong>. Hokkaido, Okinawa and remote islands ¥1,300 (also free on ¥5,000 or more).</td></tr>
</tbody>
</table>
<ul>
<li>Every piece is wrapped in <strong>recycled paper</strong> and packed in a double box with paper cushioning. No plastic.</li>
<li>Our items ship from the kiln, separately from Marketa parcels, and are <strong>not Fast-eligible</strong>: Marketa Fast does not make our shipping free.</li>
<li>Gift wrap ¥330 per item; <strong>noshi free</strong> (tell us the purpose and name in the gift message).</li>
<li>Business days are Monday to Saturday, excluding Sundays and public holidays. Cash on delivery and Marketa Lockers are not available.</li>
</ul>
<p><small>Example: a mug pair (¥6,600) ships free; a kyusu tea set (¥11,000) ships free; a single order under ¥5,000 pays ¥700.</small></p>`,
      ja: `<table>
<thead><tr><th></th><th>在庫品</th><th>受注制作品</th></tr></thead>
<tbody>
<tr><td>発送</td><td>2営業日以内</td><td>3～4週間後</td></tr>
<tr><td>本日（10月5日（月））ご注文の場合の春川市内へのお届け</td><td>10月8日（木）～9日（金）</td><td>11月2日～9日ごろ</td></tr>
<tr><td>送料</td><td colspan="2">1回のご注文につき700円。<strong>鏡窯の商品5,000円以上で無料</strong>。北海道・沖縄・離島は1,300円（5,000円以上で無料）。</td></tr>
</tbody>
</table>
<ul>
<li>器は一点ずつ<strong>再生紙</strong>で包み、紙緩衝材を詰めた二重箱でお送りします。プラスチック緩衝材は使っていません。</li>
<li>窯元からの発送のため、マルケタの荷物とは別便でのお届けとなり、<strong>Fast対象外</strong>です（マルケタFast会員でも送料はかかります）。</li>
<li>ギフトラッピング1点330円、<strong>のしは無料</strong>です（ギフトメッセージ欄に表書きとお名前をご記入ください）。</li>
<li>営業日は月～土曜日（日曜・祝日を除く）です。代金引換・マルケタロッカー受取はご利用いただけません。</li>
</ul>
<p><small>例：ペアマグ（6,600円）、急須セット（11,000円）はいずれも送料無料。5,000円未満のご注文は送料700円です。</small></p>`,
    },
    returns: {
      en: `<ul>
<li><strong>Within 14 days of delivery</strong>, unused items only. For a change of mind, you pay the return shipping.</li>
<li><strong>Broken in delivery:</strong> tell us <strong>within 48 hours</strong> of delivery with photos of the item and the box. We send a replacement or refund you, and you do not need to send the broken piece back.</li>
<li><strong>Not defects:</strong> variation in glaze, colour and size, and small pinholes. These are the nature of handmade ware.</li>
<li><strong>Cannot be returned:</strong> engraved items (such as the mug pair with names) and made-to-order items (such as the amber-glaze donabe).</li>
</ul>
<p><small>Our items ship from the kiln, so Marketa's 30-day return policy and Fast free returns do not apply. If we do not reply within 2 business days, or refuse a valid return, <a href="/en/help/returns.html#protection">Marketa Purchase Protection</a> covers you.</small></p>`,
      ja: `<ul>
<li><strong>お届けから14日以内</strong>の未使用品に限り返品を承ります。お客様都合の場合、返送料はお客様のご負担です。</li>
<li><strong>配送中の破損：</strong>お届けから<strong>48時間以内</strong>に、商品と箱の写真を添えてご連絡ください。破損品のご返送は不要で、代替品をお送りするか返金いたします。</li>
<li><strong>不良品ではないもの：</strong>釉薬・色・大きさのばらつき、小さなピンホール。いずれも手づくりの器の特性です。</li>
<li><strong>返品できないもの：</strong>名入れ品（名入れペアマグなど）、受注制作品（飴釉の土鍋など）。</li>
</ul>
<p><small>窯元からの発送のため、マルケタの30日間返品ポリシーおよびFastの返品無料特典は適用されません。2営業日以内に当窯から返信がない場合や、正当な返品をお断りした場合は、<a href="/ja/help/returns.html#protection">マルケタ購入者保護</a>の対象となります。</small></p>`,
    },
    contact: {
      en: `<p>Send us a message from <a href="/en/orders.html">Your Orders</a> &gt; "Contact seller", or from the "Ask the seller" button on any of our product pages. We reply within 1 business day, Monday to Saturday 9:00–17:00. On firing days (about twice a month) replies may come the next morning.</p>
<p>Our kiln shop in Kamagaoka is open Mon–Sat 9:00–17:00, and also on Sun 11 Oct (10:00–16:00) for the Lantern Festival. You are welcome to see the pieces before ordering.</p>`,
      ja: `<p><a href="/ja/orders.html">注文履歴</a>の「出品者に問い合わせる」、または各商品ページの「出品者に質問する」からメッセージをお送りください。月～土曜日9時～17時、1営業日以内にご返信します。窯焚きの日（月2回ほど）は、翌朝のご返信となる場合があります。</p>
<p>窯ヶ丘の窯元ショップは月～土曜日9時～17時に営業しています。灯籠まつりにあわせ、10月11日（日）も10時～16時に開けております。ご注文前に実物をご覧いただくこともできます。</p>`,
    },
    legal: {
      en: [
        ['Legal name', 'Kagami Kiln Co., Ltd. (有限会社鏡窯)'],
        ['Representative', 'Kagami Sōichi'],
        ['Address', '2-14-3 Kamagaoka, Springvale, Harvest Prefecture 781-0412'],
        ['Phone', '0897-55-2618 (Mon–Sat 9:00–17:00)'],
        ['Email', 'shop@kagami-kiln.example'],
        ['Business hours', 'Mon–Sat 9:00–17:00; closed Sundays and public holidays'],
        ['Prices', 'As shown on each product page (tax included)'],
        ['Other charges', 'Shipping ¥700 per order (free on ¥5,000 or more; Hokkaido, Okinawa and remote islands ¥1,300); gift wrap ¥330 per item'],
        ['Delivery', 'Dispatched within 2 business days of payment; made-to-order items in 3–4 weeks'],
        ['Payment', 'Payment methods offered by Marketa (cash on delivery not available)'],
        ['Returns', 'Unused items within 14 days of delivery, return shipping paid by the customer; breakage in delivery reported within 48 hours: replacement or refund; engraved and made-to-order items cannot be returned'],
      ],
      ja: [
        ['販売業者', '有限会社鏡窯'],
        ['運営責任者', '鏡 宗一'],
        ['所在地', '〒781-0412 みのり県春川市窯ヶ丘2丁目14-3'],
        ['電話番号', '0897-55-2618（月～土 9:00～17:00）'],
        ['メールアドレス', 'shop@kagami-kiln.example'],
        ['営業時間', '月～土 9:00～17:00（日曜・祝日休み）'],
        ['販売価格', '各商品ページに記載（税込）'],
        ['商品代金以外の必要料金', '送料700円（5,000円以上で無料、北海道・沖縄・離島は1,300円）、ギフトラッピング1点330円'],
        ['引渡し時期', 'ご入金確認後2営業日以内に発送（受注制作品は3～4週間）'],
        ['お支払い方法', 'マルケタが提供するお支払い方法（代金引換を除く）'],
        ['返品・交換について', 'お届けから14日以内の未使用品に限り承ります（返送料はお客様負担）。配送中の破損は48時間以内にご連絡いただければ交換または返金。名入れ品・受注制作品は返品不可'],
      ],
    },
    hist: [88, 10, 1, 0, 1],
    feedback: [
      {
        stars: 5, date: '2026-09-27',
        en: { name: 'Naomi K.', text: 'The 3-go donabe arrived two days after I ordered, wrapped in layer after layer of recycled paper. There was a handwritten card explaining how to season it with rice porridge. Beautiful packing.' },
        ja: { name: 'なおみ', text: '3合の土鍋が注文から2日で届きました。再生紙で何重にも包まれていて、おかゆでの目止めの方法を書いた手書きのカードが入っていました。梱包がとても丁寧です。' },
      },
      {
        stars: 5, date: '2026-09-14',
        en: { name: 'Takeshi', text: 'Ordered the engraved mug pair as a wedding present. Mr Kagami sent me a proof of the lettering before firing, and the mugs arrived three and a half weeks later, as promised.' },
        ja: { name: '田村', text: '結婚祝いに名入れのペアマグを注文。焼成前に文字の確認画像を送ってくださり、約束どおり3週間半で届きました。のしも無料で付けていただけました。' },
      },
      {
        stars: 4, date: '2026-09-02',
        en: { name: 'Mika', text: 'Lovely plates and quick dispatch. One star off because shipping is ¥700 on small orders; I added a second item to get over ¥5,000.' },
        ja: { name: 'みか', text: '素敵な器で発送も早かったです。少額だと送料700円かかるので星ひとつ減らしました。結局もう一品足して5,000円以上にしました。' },
      },
      {
        stars: 2, date: '2026-08-19',
        en: { name: 'Hiroko S.', text: 'One of the yunomi in the tea set has a small pinhole near the rim. The kiln replied politely within a day but said pinholes are the nature of handmade ware, not a defect, and would only take it back unused at my own shipping cost. Courteous, but disappointing for an ¥11,000 set.' },
        ja: { name: 'ひろこ', text: '急須セットの湯呑みのひとつに、口縁近くに小さなピンホールがありました。翌日には丁寧な返信がありましたが、ピンホールは手づくりの特性で不良ではないとのことで、返品は未使用・送料自己負担のみとのこと。対応は丁寧でしたが、11,000円のセットなので残念です。' },
      },
      {
        stars: 5, date: '2026-08-03',
        en: { name: 'Ken', text: 'One guinomi from the sake set arrived cracked. I sent photos the same evening; a replacement was on its way in three days and they did not ask for the broken cup back.' },
        ja: { name: 'けん', text: '酒器セットのぐい呑みがひとつ割れて届きました。その日の夜に写真を送ったところ、3日後には代わりの品を発送してくださり、割れた器の返送も不要でした。' },
      },
      {
        stars: 5, date: '2026-07-21',
        en: { name: 'Yuki', text: 'I asked whether the donabe works on my IH hob. They answered within the hour: gas only. Saved me a costly mistake, and they suggested the 2-go size for two people.' },
        ja: { name: 'ゆきんこ', text: '土鍋がIHで使えるか質問したら、1時間以内に「直火専用です」と回答がありました。危うく買い間違えるところでした。2人なら2合がちょうどよいとアドバイスもいただきました。' },
      },
      {
        stars: 3, date: '2026-07-05',
        en: { name: 'Daisuke M.', text: 'The made-to-order amber donabe is gorgeous, but it was dispatched at the very end of the 4 weeks and arrived four days later. Within what they promised, but close for a birthday.' },
        ja: { name: '松本', text: '受注制作の飴釉の土鍋は見事な仕上がりです。ただ、発送が4週間ぎりぎりで、届いたのはその4日後。約束の範囲内ではありますが、誕生日に間に合うかひやひやしました。' },
      },
    ],
  },
  {
    id: 'minori',
    name: { en: 'Harvest Yuzu Farm', ja: 'みのり柚子園' },
    rating: 4.6,
    ratings: 1940,
    positive: 95,
    since: 2018,
    location: { en: 'Mirror River valley near Moonview Spa, Springvale, Harvest Prefecture', ja: 'みのり県春川市 鏡川上流（月見温泉近く）' },
    tagline: {
      en: 'Yuzu from our hillside orchard, made into ponzu, marmalade and bath goods by the Hirose family since 1978',
      ja: '昭和53年から広瀬家が育てる山あいの柚子。ぽん酢・マーマレード・バス用品に',
    },
    about: {
      en: `<p>Harvest Yuzu Farm sits on the terraced hillsides of the Mirror River valley, twenty minutes downriver from Moonview Spa. The <strong>Hirose family</strong> planted its first yuzu trees here in <strong>1978</strong>; today Hirose Kenta, the second generation, looks after about 1,200 trees on 3.2 hectares with his parents and a small team.</p>
<p>We pick <strong>green yuzu</strong> in August and September for yuzu kosho, and <strong>ripe yellow yuzu</strong> from November to December for ponzu, marmalade and yuzu-cha, all made in our own workshop beside the orchard. Peel that is not used in the kitchen goes into our bath products, and pruned branches go to Kagami Kiln in Kamagaoka, which makes its yuzu ash glaze from them.</p>
<p>On Marketa: the <a href="/en/p/minori-ponzu-set.html">yuzu ponzu and green yuzu kosho gift box</a> (shipped from the farm), and the <a href="/en/p/minori-marmalade-set.html">marmalade and yuzu-cha set</a>, <a href="/en/p/minori-bath-salts.html">yuzu bath salts</a> and <a href="/en/p/minori-hand-cream.html">yuzu hand cream</a> (stored at and shipped from Marketa).</p>
<p><small>Allergens: our ponzu contains soy, wheat and bonito (fish). Products are made in a workshop that also handles these ingredients.</small></p>`,
      ja: `<p>みのり柚子園は、月見温泉から川沿いに20分ほど下った、鏡川流域の山あいの段々畑にあります。<strong>昭和53年（1978年）</strong>に<strong>広瀬家</strong>が最初の柚子の木を植え、現在は二代目の広瀬健太が両親や少人数のスタッフとともに、約3.2ヘクタール・約1,200本の木を育てています。</p>
<p>8～9月には柚子こしょう用の<strong>青柚子</strong>を、11～12月には<strong>黄柚子</strong>を収穫し、園の隣の加工場でぽん酢・マーマレード・柚子茶に仕立てています。料理に使わなかった皮はバス用品に、剪定した枝は窯ヶ丘の鏡窯さんへお譲りし、柚子灰釉の原料になっています。</p>
<p>マルケタでの取り扱い：<a href="/ja/p/minori-ponzu-set.html">柚子ぽん酢・青柚子こしょう ギフトセット</a>（当園から発送）、<a href="/ja/p/minori-marmalade-set.html">柚子マーマレード・柚子茶セット</a>、<a href="/ja/p/minori-bath-salts.html">柚子バスソルト</a>、<a href="/ja/p/minori-hand-cream.html">柚子ハンドクリーム</a>（マルケタの倉庫から発送）。</p>
<p><small>アレルギー表示：ぽん酢には大豆・小麦・かつお節（魚）を使用しています。いずれの商品も、これらの原料を扱う加工場で製造しています。</small></p>`,
    },
    shipping: {
      en: `<table>
<thead><tr><th></th><th>Shipped from the farm</th><th>Shipped from Marketa</th></tr></thead>
<tbody>
<tr><td>Products</td><td>Ponzu and yuzu kosho gift box / home pack</td><td>Bath salts, hand cream, marmalade and yuzu-cha set</td></tr>
<tr><td>Dispatch and delivery</td><td>We ship Monday to Saturday; arrives in 2–3 days</td><td>Marketa's speeds, including next day</td></tr>
<tr><td>Order today (Mon 5 Oct), delivery in Springvale</td><td>Wed 7 – Thu 8 Oct</td><td>Tue 6 Oct with next-day delivery</td></tr>
<tr><td>Fee</td><td>¥600; <strong>free on farm orders of ¥4,000 or more</strong>. Hokkaido, Okinawa and remote islands ¥1,200.</td><td>Marketa's rates (free for Fast members)</td></tr>
</tbody>
</table>
<ul>
<li>Orders placed after 12:00 on Saturday ship on Monday.</li>
<li>Items from the farm and from Marketa arrive in separate parcels.</li>
<li><strong>Noshi and gift message cards are free.</strong> Gift boxes come with a packing slip without prices.</li>
<li>Fresh yuzu (November–January, when in season) ships by cool delivery, +¥330.</li>
</ul>
<p><small>Example: the gift box (¥4,320) ships free; the home pack (¥3,780) costs ¥600 on its own.</small></p>`,
      ja: `<table>
<thead><tr><th></th><th>当園から発送</th><th>マルケタから発送</th></tr></thead>
<tbody>
<tr><td>対象商品</td><td>柚子ぽん酢・青柚子こしょう（ギフト箱／ご家庭用）</td><td>バスソルト、ハンドクリーム、マーマレード・柚子茶セット</td></tr>
<tr><td>発送・お届け</td><td>月～土曜日に発送、2～3日でお届け</td><td>マルケタの配送日数（翌日配送も可）</td></tr>
<tr><td>本日（10月5日（月））ご注文の場合の春川市内へのお届け</td><td>10月7日（水）～8日（木）</td><td>翌日配送なら10月6日（火）</td></tr>
<tr><td>送料</td><td>600円。<strong>当園の商品4,000円以上で無料</strong>。北海道・沖縄・離島は1,200円</td><td>マルケタの配送料（Fast会員は無料）</td></tr>
</tbody>
</table>
<ul>
<li>土曜12時以降のご注文は、月曜日の発送となります。</li>
<li>当園発送の商品とマルケタ発送の商品は別便でお届けします。</li>
<li><strong>のし・メッセージカードは無料</strong>です。ギフト箱には金額の入らない納品書を同梱します。</li>
<li>生柚子（11月～1月の旬の時期のみ）はクール便（＋330円）でお送りします。</li>
</ul>
<p><small>例：ギフト箱（4,320円）は送料無料、ご家庭用（3,780円）のみのご注文は送料600円です。</small></p>`,
    },
    returns: {
      en: `<ul>
<li><strong>Food</strong> (ponzu, yuzu kosho, marmalade, yuzu-cha) cannot be returned unless it arrives damaged or is faulty. Tell us <strong>within 7 days</strong> of delivery with photos, and we will send a replacement or refund you.</li>
<li><strong>Unopened cosmetics</strong> shipped from the farm can be returned within 14 days of delivery; for a change of mind, you pay the return shipping.</li>
<li><strong>Products shipped from Marketa</strong> (bath salts, hand cream, marmalade set) follow <a href="/en/help/returns.html">Marketa's return policy</a>: unopened bath salts and hand cream within 30 days; food not returnable. Fast free returns do not apply, because we, not Marketa, are the seller.</li>
</ul>
<p><small>Ponzu keeps 8 months unopened; once opened, keep yuzu kosho in the fridge and use it within 3 months.</small></p>`,
      ja: `<ul>
<li><strong>食品</strong>（ぽん酢、柚子こしょう、マーマレード、柚子茶）は、破損・品質不良の場合を除き返品をお受けできません。お届けから<strong>7日以内</strong>に写真を添えてご連絡いただければ、代替品をお送りするか返金いたします。</li>
<li>当園から発送した<strong>未開封の化粧品</strong>は、お届けから14日以内であれば返品を承ります（お客様都合の場合、返送料はお客様負担）。</li>
<li><strong>マルケタから発送する商品</strong>（バスソルト、ハンドクリーム、マーマレードセット）は<a href="/ja/help/returns.html">マルケタの返品ポリシー</a>が適用されます（未開封のバスソルト・ハンドクリームは30日以内、食品は返品不可）。販売者は当園のため、Fastの返品無料特典は対象外です。</li>
</ul>
<p><small>ぽん酢の賞味期限は未開封で8か月。柚子こしょうは開封後冷蔵で保存し、3か月以内にお使いください。</small></p>`,
    },
    contact: {
      en: `<p>Message us from <a href="/en/orders.html">Your Orders</a> &gt; "Contact seller" or from a product page. We answer Monday to Saturday, 8:00–17:00; messages received before 15:00 are usually answered the same day. We are closed on Sundays. During the yellow-yuzu harvest (November–December) replies can take up to 1 business day.</p>`,
      ja: `<p><a href="/ja/orders.html">注文履歴</a>の「出品者に問い合わせる」または商品ページからメッセージをお送りください。月～土曜日8時～17時に対応しており、15時までのお問い合わせは原則当日中にご返信します。日曜日は休業です。黄柚子の収穫期（11～12月）は、ご返信に最大1営業日いただく場合があります。</p>`,
    },
    legal: {
      en: [
        ['Legal name', 'Hirose Farm Co., Ltd. (有限会社広瀬農園), trading as Harvest Yuzu Farm'],
        ['Representative', 'Hirose Kenta'],
        ['Address', '1182 Okutani, Kagamigawa-chō, Springvale, Harvest Prefecture 781-1906'],
        ['Phone', '0897-58-3307 (Mon–Sat 8:00–17:00)'],
        ['Email', 'order@minori-yuzu.example'],
        ['Business hours', 'Mon–Sat 8:00–17:00; closed Sundays'],
        ['Prices', 'As shown on each product page (tax included)'],
        ['Other charges', 'Shipping ¥600 per order for farm-shipped items (free on ¥4,000 or more; Hokkaido, Okinawa and remote islands ¥1,200); cool delivery +¥330 for fresh yuzu'],
        ['Delivery', 'Shipped Monday to Saturday, arrives in 2–3 days; items stored at Marketa follow Marketa delivery'],
        ['Payment', 'Payment methods offered by Marketa (cash on delivery only for items shipped from Marketa)'],
        ['Returns', 'Food: only if damaged or faulty, reported within 7 days with photos. Unopened cosmetics: within 14 days of delivery'],
      ],
      ja: [
        ['販売業者', '有限会社広瀬農園（みのり柚子園）'],
        ['運営責任者', '広瀬 健太'],
        ['所在地', '〒781-1906 みのり県春川市鏡川町奥谷1182'],
        ['電話番号', '0897-58-3307（月～土 8:00～17:00）'],
        ['メールアドレス', 'order@minori-yuzu.example'],
        ['営業時間', '月～土 8:00～17:00（日曜休み）'],
        ['販売価格', '各商品ページに記載（税込）'],
        ['商品代金以外の必要料金', '当園発送商品の送料600円（4,000円以上で無料、北海道・沖縄・離島は1,200円）、生柚子のクール便料金330円'],
        ['引渡し時期', '月～土曜日に発送し、2～3日でお届け。マルケタ倉庫在庫の商品はマルケタの配送条件によります'],
        ['お支払い方法', 'マルケタが提供するお支払い方法（代金引換はマルケタ発送の商品のみ）'],
        ['返品・交換について', '食品：破損・品質不良の場合のみ、7日以内に写真を添えてご連絡ください。未開封の化粧品：お届けから14日以内'],
      ],
    },
    hist: [74, 21, 2, 1, 2],
    feedback: [
      {
        stars: 5, date: '2026-10-03',
        en: { name: 'Emi', text: 'Sent the ponzu gift box to my in-laws. It arrived in two days with a beautifully written noshi and my message card, both free. They loved it.' },
        ja: { name: 'えみ', text: '義実家にぽん酢のギフト箱を送りました。2日で届き、のしもメッセージカードも無料できれいに書いてくださいました。とても喜ばれました。' },
      },
      {
        stars: 5, date: '2026-09-25',
        en: { name: 'Ryo', text: 'One ponzu bottle leaked in transit. I sent photos the next morning and they shipped a new box the same day, with an extra jar of yuzu kosho as an apology.' },
        ja: { name: 'りょう', text: 'ぽん酢の瓶が1本、配送中に漏れていました。翌朝写真を送ったらその日のうちに新しいものを発送してくださり、お詫びにと柚子こしょうまで添えてありました。' },
      },
      {
        stars: 4, date: '2026-09-18',
        en: { name: 'Satoko', text: 'Excellent ponzu. The home pack is ¥3,780, just under the ¥4,000 free-shipping line, so I paid ¥600 shipping. Worth knowing before you order.' },
        ja: { name: 'さとこ', text: 'ぽん酢はとてもおいしいです。ご家庭用は3,780円で送料無料の4,000円にわずかに届かず、送料600円かかりました。注文前に知っておくとよいと思います。' },
      },
      {
        stars: 2, date: '2026-09-06',
        en: { name: 'Jun T.', text: 'Ordered on Saturday evening and it did not ship until Monday because the farm is closed on Sundays. It arrived on Wednesday, a day after the birthday it was meant for.' },
        ja: { name: 'じゅん', text: '土曜の夜に注文したら、日曜休業のため発送は月曜。届いたのは水曜で、贈りたかった誕生日の翌日になってしまいました。' },
      },
      {
        stars: 5, date: '2026-08-28',
        en: { name: 'Aki', text: 'The bath salts came next day from Marketa and the ponzu came from the farm two days later in a separate box. Both well packed. Lovely family business.' },
        ja: { name: 'あき', text: 'バスソルトはマルケタから翌日に、ぽん酢は2日後に柚子園から別便で届きました。どちらも梱包がしっかりしていました。温かみのあるお店です。' },
      },
      {
        stars: 1, date: '2026-08-11',
        en: { name: 'Masa', text: 'I ordered the same gift box twice by mistake and asked to return the unopened second one. Refused, because food cannot be returned. Polite reply, but strict.' },
        ja: { name: 'まさ', text: '同じギフト箱を誤って2回注文してしまい、未開封の1箱を返品したいと連絡しましたが、食品は返品不可とのことでお断りされました。返信は丁寧でしたが、融通はききませんでした。' },
      },
      {
        stars: 5, date: '2026-07-30',
        en: { name: 'Lena', text: 'My son has a fish allergy, so I asked about the ponzu. Mr Hirose replied within the hour: it contains bonito, as well as soy and wheat. Very clear and honest.' },
        ja: { name: '小林', text: '息子に魚のアレルギーがあるのでぽん酢について質問したところ、1時間以内に広瀬さんから「かつお節のほか大豆・小麦も含みます」と回答がありました。わかりやすく誠実な対応でした。' },
      },
    ],
  },
  {
    id: 'brightdeal',
    name: { en: 'BrightDeal Trading', ja: 'ブライトディール商事' },
    rating: 3.9,
    ratings: 8412,
    positive: 81,
    since: 2017,
    location: { en: 'Kobe, Hyōgo Prefecture', ja: '兵庫県神戸市' },
    tagline: {
      en: 'Imported kitchenware, audio, power banks and rainwear at low prices. Free shipping on everything',
      ja: '輸入キッチン用品・オーディオ・モバイルバッテリー・レインウェアをお手頃価格で。全品送料無料',
    },
    about: {
      en: `<p>BrightDeal Trading is a general-goods importer based in Kobe. Since 2012 we have sourced everyday products directly from overseas factories and sell them at low prices, shipping from our own warehouse on Rokko Island.</p>
<p>On Marketa: the <a href="/en/p/vetrina-kettle.html">Vetrina glass electric kettle</a>, <a href="/en/p/voltx-pods.html">VoltX Pods</a> earbuds, the <a href="/en/p/titancell-40k.html">TitanCell 40000</a> power bank, the <a href="/en/p/drizzle-pro.html">Drizzle Pro</a> rain jacket and the <a href="/en/p/tokiya-mug-pair.html">Tokiya "Springvale-style" mug pair</a>.</p>
<ul>
<li>Electrical products carry the PSE mark and come with a Japanese manual.</li>
<li>Electronics have a <strong>6-month BrightDeal warranty</strong>.</li>
<li>The Tokiya mugs are factory-made in China in a Springvale style; they are not hand-made Springvale ware.</li>
<li>The TitanCell 40000 is 148 Wh: it needs airline approval as carry-on and can never go in checked baggage.</li>
</ul>`,
      ja: `<p>ブライトディール商事は神戸の輸入雑貨商社です。2012年から海外の工場と直接取引し、日用品をお手頃価格でお届けしています。商品は六甲アイランドの自社倉庫から発送します。</p>
<p>マルケタでの取り扱い：<a href="/ja/p/vetrina-kettle.html">ヴェトリーナ ガラス電気ケトル</a>、<a href="/ja/p/voltx-pods.html">ボルトX ポッズ</a>（イヤホン）、<a href="/ja/p/titancell-40k.html">タイタンセル 40000</a>（モバイルバッテリー）、<a href="/ja/p/drizzle-pro.html">ドリズル プロ</a>（レインジャケット）、<a href="/ja/p/tokiya-mug-pair.html">トキヤ「春川風」ペアマグ</a>。</p>
<ul>
<li>電気製品はPSEマーク付きで、日本語の取扱説明書が付属します。</li>
<li>電化製品には<strong>当社保証6か月</strong>が付きます。</li>
<li>トキヤのペアマグは中国の工場で製造した春川焼風の商品で、手づくりの春川焼ではありません。</li>
<li>タイタンセル 40000は148Whのため、機内持ち込みには航空会社の承認が必要で、預け入れ荷物には入れられません。</li>
</ul>`,
    },
    shipping: {
      en: `<table>
<thead><tr><th>Dispatch</th><th>Delivery</th><th>Order today (Mon 5 Oct), delivery in Springvale</th><th>Fee</th></tr></thead>
<tbody>
<tr><td>1–3 business days from our Kobe warehouse</td><td>4–8 days from your order</td><td>Fri 9 – Tue 13 Oct</td><td><strong>Free</strong>, nationwide</td></tr>
</tbody>
</table>
<ul>
<li>Our items ship separately from Marketa parcels and are <strong>not Fast-eligible</strong>.</li>
<li>No delivery date or time slot, no cash on delivery, no Marketa Locker delivery and no gift wrap.</li>
<li>Hokkaido, Okinawa and remote islands: allow 2–3 extra days.</li>
<li>We email a tracking number when your parcel leaves Kobe. Tracking can take up to a day to update.</li>
</ul>
<p><small>Business days are Monday to Friday, excluding public holidays. Mon 12 Oct (Sports Day) is not a business day.</small></p>`,
      ja: `<table>
<thead><tr><th>発送</th><th>お届け</th><th>本日（10月5日（月））ご注文の場合の春川市内へのお届け</th><th>送料</th></tr></thead>
<tbody>
<tr><td>神戸倉庫から1～3営業日で発送</td><td>ご注文から4～8日</td><td>10月9日（金）～13日（火）</td><td>全国<strong>無料</strong></td></tr>
</tbody>
</table>
<ul>
<li>当社の商品はマルケタの荷物とは別便でのお届けとなり、<strong>Fast対象外</strong>です。</li>
<li>お届け日時の指定、代金引換、マルケタロッカー受取、ギフトラッピングには対応していません。</li>
<li>北海道・沖縄・離島へは、さらに2～3日かかります。</li>
<li>神戸から発送した時点で追跡番号をメールでお知らせします。追跡情報の反映に最大1日かかる場合があります。</li>
</ul>
<p><small>営業日は月～金曜日（祝日を除く）です。10月12日（月・スポーツの日）は営業日に含みません。</small></p>`,
    },
    returns: {
      en: `<ul>
<li>Returns accepted <strong>within 30 days</strong> of delivery.</li>
<li><strong>Change of mind:</strong> unopened items only. You pay <strong>¥880</strong> return shipping, deducted from your refund. Opened items, including earbuds and clothing taken out of the bag, cannot be returned for a change of mind.</li>
<li><strong>Faulty items:</strong> message us first. Wait up to <strong>2 business days</strong> for a prepaid return label; do not send the item without it.</li>
<li><strong>Refund</strong> within 5 business days after the item reaches our Kobe warehouse.</li>
<li><strong>6-month seller warranty</strong> on electronics (kettle, earbuds, power bank): repair or replacement, or a refund if the item is out of stock.</li>
</ul>
<p><small>Our items ship from Kobe, so Marketa's own return policy does not apply. If we do not reply within 2 business days, or refuse a valid return, you can file a claim under <a href="/en/help/returns.html#protection">Marketa Purchase Protection</a> within 90 days of the latest estimated delivery date.</small></p>`,
      ja: `<ul>
<li>お届けから<strong>30日以内</strong>の返品を承ります。</li>
<li><strong>お客様都合の返品：</strong>未開封品に限ります。返送料<strong>880円</strong>はお客様のご負担となり、返金額から差し引きます。イヤホンや袋から出した衣類など、開封済みの商品はお客様都合での返品をお受けできません。</li>
<li><strong>初期不良：</strong>まずメッセージでご連絡ください。着払い伝票を<strong>最大2営業日</strong>以内に発行しますので、伝票の到着前に商品を送らないでください。</li>
<li><strong>返金</strong>は、商品が神戸倉庫に到着してから5営業日以内に行います。</li>
<li>電化製品（ケトル・イヤホン・モバイルバッテリー）には<strong>当社保証6か月</strong>が付きます。修理または交換、在庫がない場合は返金で対応します。</li>
</ul>
<p><small>当社商品は神戸から発送するため、マルケタの返品ポリシーは適用されません。2営業日以内に当社から返信がない場合や、正当な返品をお断りした場合は、お届け予定日の最終日から90日以内に<a href="/ja/help/returns.html#protection">マルケタ購入者保護</a>を申請できます。</small></p>`,
    },
    contact: {
      en: `<p>Support is by <strong>message only</strong>: <a href="/en/orders.html">Your Orders</a> &gt; "Contact seller". We answer on <strong>weekdays, 10:00–17:00</strong>, within 2 business days. We do not take phone calls. Messages sent on Friday evening, at weekends or on public holidays are answered from the next business day (Tue 13 Oct after the Sports Day weekend).</p>
<p><small>Please include your order number and, for faults, a photo or short video of the problem.</small></p>`,
      ja: `<p>お問い合わせは<strong>メッセージのみ</strong>で承ります（<a href="/ja/orders.html">注文履歴</a>＞「出品者に問い合わせる」）。<strong>平日10時～17時</strong>、2営業日以内にご返信します。お電話でのお問い合わせは受け付けておりません。金曜夜・土日祝日にいただいたメッセージは、翌営業日以降のご返信となります（スポーツの日の連休明けは10月13日（火）から）。</p>
<p><small>注文番号と、不具合の場合は症状がわかる写真または短い動画を添えてお送りください。</small></p>`,
    },
    legal: {
      en: [
        ['Legal name', 'BrightDeal Trading Co., Ltd. (ブライトディール商事株式会社)'],
        ['Representative', 'Nishimura Takuya, President'],
        ['Address', 'Rokko Logistics Centre 4F, 5-8-1 Koyocho-nishi, Higashinada-ku, Kobe, Hyōgo 658-0033'],
        ['Phone', '078-555-0192 (we do not take enquiries by phone; please send a message)'],
        ['Email', 'support@brightdeal-trading.example'],
        ['Business hours', 'Weekdays 10:00–17:00; closed weekends, public holidays and 29 Dec – 4 Jan'],
        ['Prices', 'As shown on each product page (tax included)'],
        ['Other charges', 'None (shipping free nationwide)'],
        ['Delivery', 'Dispatched within 1–3 business days; delivered in 4–8 days'],
        ['Payment', 'Payment methods offered by Marketa (cash on delivery not available)'],
        ['Returns', 'Within 30 days of delivery. Change of mind: unopened items only, ¥880 return shipping paid by the customer. Faulty items: contact us first for a prepaid label. 6-month warranty on electronics'],
      ],
      ja: [
        ['販売業者', 'ブライトディール商事株式会社'],
        ['運営責任者', '代表取締役 西村 拓也'],
        ['所在地', '〒658-0033 兵庫県神戸市東灘区向洋町西5丁目8-1 六甲物流センター4F'],
        ['電話番号', '078-555-0192（お電話でのお問い合わせは受け付けておりません。メッセージにてご連絡ください）'],
        ['メールアドレス', 'support@brightdeal-trading.example'],
        ['営業時間', '平日10:00～17:00（土日祝・12月29日～1月4日休業）'],
        ['販売価格', '各商品ページに記載（税込）'],
        ['商品代金以外の必要料金', 'なし（全国送料無料）'],
        ['引渡し時期', 'ご注文から1～3営業日以内に発送、4～8日でお届け'],
        ['お支払い方法', 'マルケタが提供するお支払い方法（代金引換を除く）'],
        ['返品・交換について', 'お届けから30日以内。お客様都合は未開封品のみ、返送料880円はお客様負担。初期不良はまずご連絡ください（着払い伝票を発行します）。電化製品は当社保証6か月'],
      ],
    },
    hist: [42, 39, 3, 2, 14],
    feedback: [
      {
        stars: 1, date: '2026-10-01',
        en: { name: 'Sho', text: 'The blue LED on the Vetrina kettle died after three weeks. I messaged on a Monday and heard nothing for four business days. In the end I filed a Marketa Purchase Protection claim and Marketa refunded me. The seller still has not replied.' },
        ja: { name: 'しょう', text: 'ヴェトリーナのケトルの青いLEDが3週間で点かなくなりました。月曜に連絡したのに4営業日たっても返事なし。結局マルケタ購入者保護を申請して、マルケタから返金してもらいました。出品者からはいまだに返信がありません。' },
      },
      {
        stars: 2, date: '2026-09-22',
        en: { name: 'Kana', text: 'The Drizzle Pro jacket runs small, so I asked to return it. Refused, because I had opened the bag to try it on. "Change of mind: unopened items only." How are you supposed to check the size?' },
        ja: { name: 'かな', text: 'ドリズル プロのジャケットが小さめだったので返品を申し出たところ、試着のために袋を開けたという理由で断られました。「お客様都合は未開封品のみ」とのこと。サイズを確かめようがありません。' },
      },
      {
        stars: 4, date: '2026-09-15',
        en: { name: 'Tom', text: 'Cheap, free shipping and the power bank arrived in five days. The outer box was a bit crushed but the product was fine.' },
        ja: { name: 'トム', text: '安くて送料無料、モバイルバッテリーは5日で届きました。外箱が少しつぶれていましたが、中身は問題ありませんでした。' },
      },
      {
        stars: 5, date: '2026-09-08',
        en: { name: 'Mariko', text: 'One VoltX earbud would not charge. They sent a prepaid label within two business days and refunded me four days after it reached Kobe. No complaints.' },
        ja: { name: 'まりこ', text: 'ボルトXのイヤホンの片方が充電できませんでした。2営業日以内に着払い伝票が届き、神戸に着いてから4日で返金されました。問題なしです。' },
      },
      {
        stars: 3, date: '2026-08-30',
        en: { name: 'Haru', text: 'It took eight days to arrive and the tracking did not update for three of them. It did come in the end, within the 4–8 days they state.' },
        ja: { name: 'はる', text: '届くまで8日かかり、そのうち3日間は追跡情報が更新されませんでした。表示の4～8日の範囲内ではありますが、やきもきしました。' },
      },
      {
        stars: 2, date: '2026-08-17',
        en: { name: 'Kenji O.', text: 'Asked a question on Friday evening and got the answer on Tuesday afternoon, and it was a copy-and-paste reply that did not answer what I asked. Message-only support on weekdays is very slow.' },
        ja: { name: '大野', text: '金曜の夜に質問して、返事が来たのは火曜の午後。しかも質問に答えていない定型文でした。平日のみ・メッセージのみの対応はかなり遅いです。' },
      },
      {
        stars: 4, date: '2026-08-02',
        en: { name: 'Akane', text: 'My TitanCell stopped charging after four months. The 6-month warranty was honoured without fuss and a replacement arrived within a week of sending it back.' },
        ja: { name: 'あかね', text: 'タイタンセルが4か月で充電できなくなりましたが、6か月保証でスムーズに対応してもらえ、返送から1週間以内に交換品が届きました。' },
      },
      {
        stars: 1, date: '2026-07-19',
        en: { name: 'Fumi', text: 'I thought the Tokiya mugs were real Springvale ware. They are factory-made in China. The seller pointed out the description says "Springvale-style" and that returning them unopened would cost me ¥880. Read the small print.' },
        ja: { name: 'ふみ', text: 'トキヤのマグを本物の春川焼だと思って買いましたが、中国の工場製でした。出品者からは「説明に『春川風』と書いてある」「未開封での返品は返送料880円がかかる」との返答。説明はよく読むべきでした。' },
      },
    ],
  },
];
