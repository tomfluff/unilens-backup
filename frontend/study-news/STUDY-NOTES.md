# Study notes: The Harukawa Herald / 春川日報

Candidate tasks for a UniLens session on the news site. Railway facts agree with the Harukawa Railway site and Kumo Mobile facts with the Kumo Mobile Support site (checked 4 October). Paths are under `en/` and `ja/` (same path in both). The site's "now" is Sunday 4 October 2026, about 18:00.

## 1. Festival road closure

- **EN:** "I want to drive to a friend's flat on Riverside Avenue at 3 pm next Saturday. Can I, and if not, where do I park?"
- **JA:** 「来週土曜の午後3時に、川端通りの友人宅まで車で行けますか？ 行けないならどこに止めればいい？」
- **Where:** `articles/festival-road-closures.html`, in the closures table, the map (`<img alt="Map">`) and the "No parking" section.
- **Why it's interesting:** a wide table plus a map image with no useful alt text; the answer combines the table with a later section.
- **Answer:** No. Riverside Avenue (Nishiki Bridge – Asahi Bridge) is closed to all vehicles, bicycles included, from 14:00 to 23:00 on Saturday 10 and Sunday 11 October (stalls open at 16:00). There's no festival parking; use the park-and-ride at Harukawa University Kita Campus (1,200 spaces) or Minori Port Car Park No. 2 (800). Both cost ¥500 per car, including the shuttle, which runs every 10 minutes from 15:00 to 22:30 to the Castle Park east gate.

## 2. A corrected time

- **EN:** "What time does Nishiki Bridge close to cars, and can I walk across it during the lantern floating?"
- **JA:** 「錦橋は何時から通行止め？ 灯籠流しの間は歩いて渡れる？」
- **Where:** the same article: the table, the text, and the correction note at the foot.
- **Why it's interesting:** the correction notice says an earlier version gave the wrong time, so the assistant must not report 17:00.
- **Answer:** Closed to vehicles from 16:00 to 22:00 on both days (not 17:00, as first reported). Pedestrians can cross, but only one way, north to south, from 19:00 to 21:00 on both evenings. The lantern floating runs from 19:30 to 21:00 each evening at the main stage by Nishiki Bridge, 4 minutes from Shiromachi Station's River Exit.

## 3. Library spending

- **EN:** "How has the city's spending on libraries changed this year?"
- **JA:** 「市の図書館関係の予算は今年どう変わった？」
- **Where:** `articles/city-budget.html`: the text, the inline chart "Where the money goes" and the supplementary-budget table.
- **Why it's interesting:** the figures are spread over the text, a chart and a table.
- **Answer:** Library services rise from ¥1.42 bn (FY2025) to ¥2.05 bn (FY2026), about +44%. Construction payments rise from ¥1.9 bn to ¥3.6 bn (the final year). The September supplementary budget adds ¥0.6 bn for the opening. The chart category "Culture, sport and libraries" goes from ¥6.3 bn to ¥8.4 bn.

## 4. Trains tonight (live blog)

- **EN:** "Can I still get a train from Harukawa Central to Tsukimi Onsen tonight? What about the limited express?"
- **JA:** 「今夜、春川中央から月見温泉まで電車で帰れますか？ 特急は？」
- **Where:** `live/typhoon-21.html`: the 17:45 and 15:05 updates and the pinned key points. Consistent with the railway site's timetable and its 14:20 status (the deer collision, in the 14:05 update).
- **Why it's interesting:** a long live page, newest first, with the information repeated and updated over time.
- **Answer:** Yes, until 19:15: the last Kagami Line train from Harukawa Central to Tsukimi Onsen leaves at 19:15 (arriving 20:18), and no Kagami Line trains run after about 20:20. The Tsukikage has already stopped for the day: the last left Harukawa Central at 15:30, and it is cancelled until at least noon Monday (HaruTetsu decides at 10:00 Monday). The Bayside Line has been suspended since 18:00. City buses stop at 19:00.

## 5. Evacuating with a dog

- **EN:** "I live in Shiohama with my dog. Do I have to evacuate, and which shelter will take the dog?"
- **JA:** 「汐浜に犬と住んでいます。避難が必要？ 犬を連れて行ける避難所は？」
- **Where:** the live blog: the 17:30 update, the 17:40 update and its shelters table.
- **Why it's interesting:** the answer combines an update with a table; the nearest shelter doesn't take pets.
- **Answer:** Yes. A Level 4 evacuation instruction has been in force since 17:30 for Shimo-Kawabata, Minatomachi, Wangancho and Shiohama. Shiohama Elementary School doesn't take pets. Pets in cages are accepted at the Harukawa Civic Gymnasium (Otemachi), the Wangancho Community Centre, Harukawa University Kita Campus Hall and three smaller shelters.

## 6. Festival weather

- **EN:** "Will the weather be OK for the Lantern Festival, and when will they decide if it goes ahead?"
- **JA:** 「灯籠まつりの日の天気は？ 開催するかどうかはいつ決まる？」
- **Where:** `weather.html` (7-day table and the note under it); `articles/festival-road-closures.html` (last section).
- **Why it's interesting:** it combines two pages and a table.
- **Answer:** Saturday 10: sunny, 23 °C / 14 °C, 10% chance of rain. Sunday 11: sunny then cloudy, 22 °C / 15 °C, 20% (forecast reliability C). Evenings are around 16 °C. The committee announces on Thursday 8 October at 15:00.

## 7. A chart with no alt text

- **EN:** "When will the rain be heaviest tonight, and how windy will it be then?"
- **JA:** 「今夜、雨が一番強くなるのは何時？ そのときの風は？」
- **Where:** `weather.html`, in the "Next 24 hours" chart (`<img alt="">`).
- **Why it's interesting:** the answer exists only in the chart image.
- **Answer:** At 03:00 on Monday: 30 mm an hour, with wind of 28 m/s. The wind peaks at 29 m/s around 04:00, and the rain stops by about 11:00.

## 8. Poll among young voters

- **EN:** "Who's ahead in the mayoral election among people under 40?"
- **JA:** 「市長選、40歳未満では誰がリードしている？」
- **Where:** `articles/mayoral-election-poll.html`, in the chart (`<img alt="chart">`) and the text.
- **Why it's interesting:** a grouped bar chart image, and a corrected sample size.
- **Answer:** Among 18–39-year-olds, Sawada has 30%, Onodera 27%, Hirose 22% and 21% are undecided. Among all respondents, Hirose has 36%, Sawada 31% and Onodera 12%, with 21% undecided. The poll ran on 26–27 September with 1,012 respondents (first misreported as 1,102), ±3.1 points. The election is on 8 November.

## 9. Unlimited plan price rise

- **EN:** "I'm on Kumo Unlimited and use about 18 GB a month. What will I pay from December, and would another plan be cheaper?"
- **JA:** 「クモ アンリミテッドで月18GBくらい使っています。12月からいくらになる？ 他のプランのほうが安い？」
- **Where:** `articles/kumo-mobile-prices.html`: the table and its note, the chart (`<img alt="">`) and the text. It agrees with the Kumo Mobile Support site's notice of 2 October.
- **Why it's interesting:** it needs a comparison and the fine print (which prices change and which don't).
- **Answer:** Kumo Unlimited goes from ¥7,238 to ¥7,458 (+¥220) from December usage (billed in January 2027). Kumo Basic (20 GB, ¥4,378, unchanged) would cost ¥3,080 a month less at 18 GB. Plan changes are free, with no cancellation fee; a change made by 30 November applies from 1 December. Discounts don't change.

## 10. Timetable change

- **EN:** "What changes for the Tsukikage in November, and can I get back from Tsukimi Onsen later on a Saturday?"
- **JA:** 「11月から特急「月影」は何が変わる？ 土曜に月見温泉からもっと遅く帰れる？」
- **Where:** `articles/railway-timetable.html`: the changes table and the text. It agrees with the Harukawa Railway site's notice.
- **Answer:** From Saturday 14 November 2026, every Tsukikage also stops at Tsukimi-guchi, so Harukawa Central – Tsukimi Onsen takes 41 minutes (now 39). Weekday Tsukikage 1 runs 7:25 → 8:06 (was 7:30 → 8:09). Yes: on Saturdays, Sundays and holidays the last train from Tsukimi Onsen moves from 21:05 to 21:40 (Harukawa Central 22:43). Fares and surcharges don't change.

## 11. Behind the paywall

- **EN:** "Who does Keiko Murata say the new timetable leaves out?"
- **JA:** 「村田恵子さんのコラムは、新ダイヤで取り残されるのは誰だと言っている？」
- **Where:** `articles/column-timetable.html`; the column stops at "Subscribe to continue reading".
- **Why it's interesting:** the answer isn't on the page, so the assistant should say so rather than guess.
- **Answer:** The visible part ends with "So it is worth asking who received no new promise." The answer is in the hidden, subscriber-only part. The visible part does argue that the two extra minutes for the Tsukimi-guchi stop are "the best thing in the revision". The same applies to the second halves of `harukawa-ware-exports` and `port-cargo`.

## 12. Library books during the move

- **EN:** "I borrowed books from the Shiroyama library on 10 September. When are they due, and can I borrow anything in late October?"
- **JA:** 「9月10日に城山の図書館で借りた本の返却期限は？ 10月下旬に本は借りられる？」
- **Where:** `articles/central-library.html`, in the text, the key dates list and the hours table. See also the correction notice.
- **Answer:** All books borrowed from 1 September onwards are due on 21 November. Shiroyama closes for good on 18 October; there's no lending from the central library from 19 October to 6 November, but the six branch libraries stay open. The new library opens on Saturday 7 November (not 3 November). Hours are Tue–Fri 9:00–21:00 and weekends 9:00–19:00, closed Mondays.

## 13. Flu jabs for a family

- **EN:** "My mother is 70 and my son is 8. How much will their flu vaccinations cost?"
- **JA:** 「70歳の母と8歳の息子のインフルエンザ予防接種、費用はいくら？」
- **Where:** `articles/flu-vaccination.html`, in the table and the correction note.
- **Answer:** Mother: ¥1,500 (free for households on public assistance or exempt from resident tax), from 1 October 2026 to 31 January 2027 (first misreported as ¥1,200). Son: two doses 2–4 weeks apart, each at the clinic's price minus ¥2,000. There are 212 clinics, and most need a booking.

## 14. Box score

- **EN:** "Who drove in the Seagulls' runs on Saturday, and when is their next home game?"
- **JA:** 「土曜の試合でシーガルズの打点を挙げたのは誰？ 次のホームゲームは？」
- **Where:** `articles/seagulls-clinch.html`, in the line score and batting tables and the update at the top.
- **Answer:** Kuroda drove in 2 (a two-run homer in the 1st), Takagi 1 (6th), and Mori and Matsuoka 1 each (7th): a 5–3 win. The next home game is Tuesday 6 October at 18:00 against the Wild Boars (Sunday's game was postponed because of the typhoon). Then Saturday 10 October at 13:00 against the Red Crabs.

## 15. Water bill

- **EN:** "We're a family of four. How much more will we pay for water, from when, and was it approved?"
- **JA:** 「4人家族です。水道料金はいつからいくら上がる？ もう決まった？」
- **Where:** `articles/water-rates.html` (table; published before the vote) and `articles/city-budget.html` (the vote).
- **Why it's interesting:** the answer is spread across two articles at different dates.
- **Answer:** A household using 40 m³ per two months goes from ¥10,450 to ¥11,380 per two months (+¥930, +8.9%) from 1 April 2027. The council approved it on 30 September by 29 votes to 11.

## 16. Getting home after the festival

- **EN:** "I'm going to the lantern floating on Saturday and live near Minori Port. What's the last train I can take, and which station should I avoid?"
- **JA:** 「土曜の灯籠流しを見に行きます。みのり港の近くに住んでいますが、最終は何時？ 避けたほうがいい駅は？」
- **Where:** `articles/festival-road-closures.html`, in the train section and the fact box. It agrees with the Harukawa Railway site's notice.
- **Why it's interesting:** extra trains aren't in the railway's journey planner; the answer is a list in prose.
- **Answer:** Extra Bayside Line trains leave Harukawa Central for Minori Port at 21:15, 21:45, 22:15, 22:45 and 23:30 (arriving 23:58). The last regular train to Minori Port is at 23:00; the 23:35 goes only to Minori-kōen. Shiromachi Station, 4 minutes from the main stage, may restrict entry from 18:00 to 21:30. Harukawa Central's North Exit is 5 minutes from the promenade. Charge your HaruCa beforehand.
