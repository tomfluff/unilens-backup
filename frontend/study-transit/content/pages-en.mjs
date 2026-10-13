// English prose pages. h = helpers from build.mjs (tables and numbers come from data.mjs).
export default (h) => {
  const Y = h.yen; const f = h.fare;
  const ct = f('central', 'tsukimionsen'), cm = f('central', 'minoriport'), mt = f('minoriport', 'tsukimionsen'), cd = f('central', 'daigakumae'), ck = f('central', 'kamano');
  const xCT = h.xFee(ct.km), xMT = h.xFee(f('central', 'tsukimionsen').km);
  const cdPass = h.commuter(cd.ticket);
  return {
  fares: { title: 'Fares', body: `
<p class="lead">Fares on Springvale Railway depend on the distance you travel. Adult fares start at ${Y(170)}. Fares paid with the RideCard IC card are slightly cheaper than paper tickets.</p>
<h2 class="h2">How fares are calculated</h2>
<ol><li>Take the operating distance between the two stations (shown on the <a href="/en/lines/kagami.html">line pages</a>). For journeys between the Mirror Line and the Bayside Line, add the two distances from Springvale Central.</li>
<li>Round the distance <b>up</b> to the next whole kilometre (for example, 13.5 km becomes 14 km).</li>
<li>Find the fare for that distance in the table below.</li></ol>
<p>Example: Springvale Central to Moonview Spa is ${ct.km} km, charged as ${ct.charged} km: ${Y(ct.ticket)} with a paper ticket or ${Y(ct.ic)} with RideCard. Ferry Port to Moonview Spa is ${mt.km} km (16.2 + 38.6), charged as ${mt.charged} km: ${Y(mt.ticket)}, the highest fare on the network.</p>
<h2 class="h2">Fare table</h2>${h.fareTable()}
<p class="small muted">Child fares: children aged 6 to 11 (and pupils at elementary school) pay half the adult fare. Paper tickets are rounded down to the nearest 10 yen and RideCard fares to the nearest yen. Up to two children under 6 travel free with each paying passenger; further children under 6 pay the child fare.</p>
<h2 class="h2">Fares by distance</h2>${h.chartImg('fares')}
<h2 class="h2">Limited express Comet</h2>
<p>On Ltd. Exp. Comet you pay the fare plus a limited express surcharge of ${Y(520)} (up to 25 km) or ${Y(760)} (26 km or more). See <a href="/en/tsukikage/index.html#fees">Comet surcharges</a>.</p>
<h2 class="h2">More</h2><ul class="links"><li><a href="/en/fares/matrix.html">Station-to-station fare matrix</a></li><li><a href="/en/fares/calculator.html">Fare calculator</a></li><li><a href="/en/tickets/commuter.html">Commuter passes</a></li><li><a href="/en/tickets/passes.html">Passes and package tickets</a></li><li><a href="/en/tickets/discounts.html">Discounts</a></li></ul>` },

  tickets: { title: 'Tickets and passes', body: `
<p class="lead">Choose the ticket that suits your trip. Most regular riders use the RideCard IC card; visitors often save money with a pass.</p>
${h.img('ticket-machines.jpg', 'Ticket machines at Springvale Central')}
<table class="data"><thead><tr><th>Ticket</th><th>Best for</th><th>Price</th><th>Where to buy</th></tr></thead><tbody>
<tr><td><a href="/en/tickets/haruca.html">RideCard IC card</a></td><td>Everyday travel; tap in and out</td><td>Fare minus up to ${Y(18)}</td><td>Ticket machines at staffed stations</td></tr>
<tr><td>Single ticket (paper)</td><td>Occasional journeys</td><td>${Y(170)}–${Y(970)}</td><td>Ticket machines; platform machine at unstaffed stations</td></tr>
<tr><td><a href="/en/tickets/passes.html#oneday">1-Day Free Pass</a></td><td>Several journeys in one day</td><td>${Y(h.pass.weekday)} weekdays / ${Y(h.pass.weekend)} Sat, Sun, holidays</td><td>Ticket machines, ticket offices</td></tr>
<tr><td><a href="/en/tickets/passes.html#railbus">Rail &amp; Bus 1-Day Pass</a></td><td>Trains plus Springvale City Bus</td><td>${Y(1700)}</td><td>Ticket offices, City Bus centre</td></tr>
<tr><td><a href="/en/tickets/passes.html#yukemuri">Moonview Spa Day Ticket</a></td><td>A day or overnight trip to Moonview Spa</td><td>${Y(h.pass.yukemuri)}</td><td>Ticket offices at 4 stations, by the day before</td></tr>
<tr><td><a href="/en/tickets/commuter.html">Commuter pass</a></td><td>Daily commuting on one route</td><td>From ${Y(h.commuter(170)[0])} a month</td><td>Ticket offices; renewals at machines</td></tr>
<tr><td><a href="/en/tsukikage/index.html">Comet reserved seat</a></td><td>Faster trips on the Mirror Line</td><td>Fare + ${Y(520)} or ${Y(760)}</td><td><a href="/en/reserve/index.html">Online</a>, reserved-seat machines, ticket offices</td></tr>
</tbody></table>
<h2 class="h2">Buying tickets</h2>
<p>Ticket machines accept cash (1,000-yen notes and coins; 5,000 and 10,000-yen notes at Springvale Central and Ferry Port only) and RideCard. Credit cards are accepted only at the reserved-seat ticket machines (purple machines) and ticket offices. Single tickets are valid on the day of purchase only (or, when bought in advance with a Comet ticket, on the travel date), and you cannot break your journey on a single ticket.</p>
<p>At unstaffed stations (Hilltop, Mill Creek, Firefly Valley, Tidewater, Lighthouse) there is no ticket machine. Take a boarding certificate from the small machine on the platform, or touch RideCard on the platform reader, and pay the fare at your destination.</p>
<p>See also <a href="/en/fares/index.html">fares</a>, <a href="/en/tickets/discounts.html">discounts</a> and the <a href="/en/rules.html">rules on refunds</a>.</p>` },

  haruca: { title: 'RideCard IC card', body: `
<p class="lead">RideCard (ハルカ) is Springvale Railway's rechargeable IC card. Touch it on the reader at the ticket gate when you enter and when you leave; the fare is deducted automatically and is up to ${Y(18)} cheaper than a paper ticket.</p>
<h2 class="h2">Types of RideCard</h2>
<table class="data"><thead><tr><th>Card</th><th>Features</th><th>Where to get it</th></tr></thead><tbody>
<tr><td>RideCard</td><td>Anyone can use it. Not replaced if lost.</td><td>Ticket machines at staffed stations</td></tr>
<tr><td>Personalized RideCard</td><td>Registered in your name. Reissued if lost. Needed for RideCard Points and ticketless Comet.</td><td>Ticket machines (Springvale Central, Castle Town, Clayfield, Ferry Port) and ticket offices</td></tr>
<tr><td>Child RideCard</td><td>Charges child fares until 31 March after the child's 12th birthday.</td><td>Ticket offices only; bring proof of age</td></tr>
<tr><td>RideCard Commuter</td><td>A commuter pass on a Personalized RideCard.</td><td>Ticket offices; renew at machines</td></tr>
<tr><td>RideCard Assist</td><td>For holders of a disability certificate; charges discounted fares.</td><td>Ticket offices at Springvale Central and Ferry Port</td></tr>
<tr><td>Silver RideCard</td><td>Aged 65 or over: 10% off off-peak fares (annual fee ${Y(1000)}).</td><td>Ticket offices; bring ID</td></tr></tbody></table>
<h2 class="h2" id="buy">Buying a RideCard</h2>
<p>Cards are sold for ${Y(2000)}, ${Y(3000)}, ${Y(5000)} or ${Y(10000)}. Each price includes a refundable deposit of ${Y(500)}; the rest is stored value (for example, a ${Y(2000)} card has ${Y(1500)} to spend).</p>
<h2 class="h2" id="charge">Charging (topping up)</h2>
<ul><li>Charge ${Y(1000)}, ${Y(2000)}, ${Y(3000)}, ${Y(5000)} or ${Y(10000)} at ticket machines and charge machines. Cash only.</li>
<li>The maximum balance is ${Y(20000)}.</li>
<li>Charging is not possible at unstaffed stations (Hilltop, Mill Creek, Firefly Valley, Tidewater, Lighthouse) or on trains.</li>
<li>With RideCard Web you can charge a Personalized RideCard online by credit card (from ${Y(1000)}); the charge is added the next time you touch a ticket gate, at least 30 minutes later.</li></ul>
<h2 class="h2">Using RideCard</h2>
<ul><li>You need a balance of at least ${Y(170)} to enter. If your balance does not cover the fare when you leave, pay the difference at the fare adjustment machine inside the gate.</li>
<li>Exit within 3 hours of entering. Otherwise the gate stops you and staff will charge the fare from your entry station.</li>
<li>RideCard can be used on Springvale City Bus and Moonview Bus, and in shops inside our stations. It cannot be used on the airport limousine bus.</li>
<li>IC cards issued by other railways in Japan cannot be used on Springvale Railway, and RideCard cannot be used outside Harvest Prefecture.</li>
<li>The Comet surcharge can be paid from your RideCard balance at reserved-seat ticket machines. If you register a Personalized RideCard when you <a href="/en/reserve/index.html">reserve online</a>, you can board without a paper ticket.</li></ul>
<h2 class="h2" id="points">RideCard Points</h2>
<p>With a Personalized RideCard registered on RideCard Web, you earn points when you ride the same section (the same two stations, in either direction) many times in a calendar month:</p>
<table class="data"><thead><tr><th>Rides on the same section in the month</th><th>Points</th></tr></thead><tbody><tr><td>1st to 10th</td><td>None</td></tr><tr><td>11th to 20th</td><td>10% of the fare</td></tr><tr><td>21st and later</td><td>15% of the fare</td></tr></tbody></table>
<p class="small">1 point = ${Y(1)}. Points are added in the middle of the following month and are turned into balance when you touch "Points" on a ticket machine. Sections covered by a commuter pass, 1-Day passes and Comet surcharges do not earn points. Points expire after 12 months.</p>
<h2 class="h2" id="refund">Refunds</h2>
<p>Return your RideCard at a ticket office: Springvale Central, Castle Town, University Gate (weekdays only), Clayfield, Red Canyon, Moonview Spa, Ferry Port or Rose Garden (Saturdays, Sundays and holidays only). We refund the balance minus a fee of ${Y(220)}, plus the ${Y(500)} deposit. If the balance is ${Y(220)} or less, the balance is not refunded but the deposit is. A card with a commuter pass on it is refunded under the commuter pass rules.</p>
<h2 class="h2" id="lost">If you lose a RideCard</h2>
<p>A Personalized RideCard, Child RideCard, RideCard Commuter or RideCard Assist can be stopped and reissued. Report the loss at a ticket office with ID; the balance is protected from that moment. The new card is ready from 10:00 the next day at the same office, for a reissue fee of ${Y(520)} and a new ${Y(500)} deposit. An unregistered RideCard cannot be reissued.</p>
<p class="small muted">A RideCard that has not been used for 10 years becomes invalid.</p>` },

  passes: { title: 'Passes and package tickets', body: `
<h2 class="h2" id="oneday">1-Day Free Pass</h2>
<table class="data kv"><tr><th>Price</th><td>Weekdays: adult ${Y(h.pass.weekday)}, child ${Y(h.pass.weekday / 2)}<br>Saturdays, Sundays and holidays: adult ${Y(h.pass.weekend)}, child ${Y(h.pass.weekend / 2)}</td></tr>
<tr><th>Valid</th><td>Unlimited travel on Local and Rapid trains on both lines on one day. On Comet, also buy a limited express surcharge ticket.</td></tr>
<tr><th>Where</th><td>Ticket machines at staffed stations (valid on the day of purchase), or ticket offices up to one month ahead (choose the date). Can also be loaded onto RideCard at a ticket machine ("RideCard 1-Day"); the pass then runs until the last train that day.</td></tr>
<tr><th>Extras</th><td>${Y(100)} off at Moonview Main Bath public bath; 10% off pottery workshops at Springvale Ware Hall (Clayfield).</td></tr>
<tr><th>Refund</th><td>Unused passes only, before the day of validity, with a ${Y(220)} fee.</td></tr></table>
<p class="small">Is it worth it? A return trip from Springvale Central to Moonview Spa costs ${Y(ct.ticket * 2)} with paper tickets or ${Y(ct.ic * 2)} with RideCard, so the pass pays for itself on that trip on any day. For shorter trips, such as Springvale Central to Clayfield (${Y(ck.ic)} each way with RideCard), it pays only if you make several journeys.</p>
<h2 class="h2" id="railbus">Rail &amp; Bus 1-Day Pass</h2>
<p>${Y(1700)} (child ${Y(850)}). Everything in the 1-Day Free Pass, plus Springvale City Bus routes on the same day (not Moonview Bus or the airport limousine). Sold at ticket offices and at the City Bus centre at Springvale Central North Exit. Paper ticket only.</p>
<h2 class="h2" id="yukemuri">Moonview Spa Day Ticket</h2>
${h.img('onsen-station.jpg', 'Moonview Spa station')}
<table class="data kv"><tr><th>Price</th><td>Adult ${Y(h.pass.yukemuri)}, child ${Y(h.pass.yukemuri / 2)} (from any Springvale Railway station)</td></tr>
<tr><th>Includes</th><td>A return journey between your station and Moonview Spa (Local and Rapid); a Comet standard reserved seat for one journey each way (reserve your seats when you buy the ticket, or later at a ticket office or reserved-seat machine, free); one entry to Moonview Main Bath or Golden Bath public bath; a ${Y(500)} voucher for shops and restaurants in Moonview Spa.</td></tr>
<tr><th>Valid</th><td>2 consecutive days. You may break your journey at Clayfield and Red Canyon only.</td></tr>
<tr><th>Not valid</th><td>10–12 October 2026 (Lantern Festival) and 28 December 2026 – 6 January 2027.</td></tr>
<tr><th>Where</th><td>Ticket offices at Springvale Central, Castle Town, Clayfield and Ferry Port, by 21:00 the day before you travel. Not sold at Moonview Spa, at ticket machines or online.</td></tr>
<tr><th>Premium seats</th><td>Upgrade for ${Y(h.fee.premium)} per journey.</td></tr>
<tr><th>Refund</th><td>Before the first day of validity, with a ${Y(220)} fee. Not refundable once used.</td></tr>
<tr><th>Sales period</th><td>Until 31 March 2027 (extended).</td></tr></table>
<h3 class="h3">How much do you save?</h3>
<table class="data"><thead><tr><th>From</th><th>Fares (return)</th><th>Comet (both ways)</th><th>Bath</th><th>Bought separately</th><th>Spa Day Ticket</th></tr></thead><tbody>
<tr><td>Springvale Central</td><td class="num">${Y(ct.ticket * 2)}</td><td class="num">${Y(xCT * 2)}</td><td class="num">${Y(600)}</td><td class="num">${Y(ct.ticket * 2 + xCT * 2 + 600)}</td><td class="num"><b>${Y(h.pass.yukemuri)}</b></td></tr>
<tr><td>Ferry Port</td><td class="num">${Y(mt.ticket * 2)}</td><td class="num">${Y(xMT * 2)}</td><td class="num">${Y(600)}</td><td class="num">${Y(mt.ticket * 2 + xMT * 2 + 600)}</td><td class="num"><b>${Y(h.pass.yukemuri)}</b></td></tr></tbody></table>
<p class="small muted">Plus the ${Y(500)} voucher. From Ferry Port you change at Springvale Central to Comet, which is the Comet journey included.</p>
<p>See also <a href="/en/trips/tsukimi-onsen.html">A day at Moonview Spa</a>.</p>` },

  commuter: { title: 'Commuter passes', body: `
<p class="lead">A commuter pass gives unlimited travel between two stations (and the stations in between) for 1, 3 or 6 months. Passes are loaded on a RideCard Commuter card.</p>
<h2 class="h2">Prices</h2>${h.commuterTable()}
<p class="small">The price depends on the distance between the two stations on your pass (rounded up to whole kilometres, as for <a href="/en/fares/index.html">fares</a>). A pass that crosses between the Mirror Line and the Bayside Line is valid via Springvale Central.</p>
<p>Example: Springvale Central to University Gate (${cd.km} km) costs ${Y(cdPass[0])} for one month. A RideCard return trip on that route costs ${Y(cd.ic * 2)}, so the pass pays off from about ${Math.ceil(cdPass[0] / (cd.ic * 2))} round trips a month. Student pass: ${Y(cdPass[3])} a month.</p>
<h2 class="h2">Buying and renewing</h2>
<ul><li>New passes: ticket offices only. For a student pass, bring a commuting certificate stamped by your school the first time and every April.</li>
<li>Renewals: ticket machines at staffed stations or ticket offices, from 14 days before the new start date.</li>
<li>The pass starts on the date you choose (up to 14 days after purchase).</li></ul>
<h2 class="h2">Using the pass outside the section</h2>
<p>If you travel beyond your section, touch out as usual; the fare from the end of your section is deducted from your RideCard balance.</p>
<h2 class="h2">Refunds</h2>
<p>A pass with at least one month left can be refunded at a ticket office: we refund the price paid minus the 1-month price for each month (or part of a month) used, minus a ${Y(220)} fee. A 1-month pass is refunded only within 7 days of its start date: the price minus the fare for a return trip for each day since it started, minus ${Y(220)}.</p>
<p>See also <a href="/en/tickets/discounts.html">discounts</a> (people with disabilities and carers pay half price on commuter passes).</p>` },

  discounts: { title: 'Discounts', body: `
<h2 class="h2">Children</h2>
<table class="data"><thead><tr><th>Age</th><th>Fare</th></tr></thead><tbody><tr><td>12 and over (from April of junior high school)</td><td>Adult</td></tr><tr><td>6–11 (elementary school pupils)</td><td>Child fare: half the adult fare</td></tr><tr><td>1–5</td><td>Free, up to two with each paying adult or child; the third and further pay the child fare</td></tr><tr><td>Under 1</td><td>Free</td></tr></tbody></table>
<h2 class="h2" id="disability">People with disabilities and carers</h2>
<p>Show your Physical Disability Certificate, Intellectual Disability Certificate (Ryōiku Techō) or Mental Disability Certificate when buying tickets. Discounts are recorded on a RideCard Assist card or applied to paper tickets.</p>
<table class="data"><thead><tr><th>Certificate shows</th><th>Who travels</th><th>Fare</th><th>Comet surcharge</th><th>Commuter pass</th></tr></thead><tbody>
<tr><td>Type 1 (第1種)</td><td>With a carer</td><td>50% off for both</td><td>50% off for both</td><td>50% off for both</td></tr>
<tr><td>Type 1</td><td>Alone</td><td>50% off</td><td>Full price</td><td>—</td></tr>
<tr><td>Type 2 (第2種)</td><td>Alone</td><td>50% off (any distance)</td><td>Full price</td><td>—</td></tr>
<tr><td>Type 2, under 12</td><td>With a carer</td><td>Carer: 50% off</td><td>Full price</td><td>Carer: 50% off</td></tr></tbody></table>
<p class="small">Paper tickets with the discount are sold at ticket offices and at ticket machines with a "Discount" button (staffed stations). Child fares are halved again (rounded down to 10 yen). RideCard Assist cards are issued at the Springvale Central and Ferry Port ticket offices; a carer's RideCard Assist is linked to the holder's card and gives the discount only when both touch through the gate together.</p>
<p>For help at stations and on trains, see <a href="/en/accessibility.html">Accessibility and assistance</a>.</p>
<h2 class="h2" id="students">Students</h2>
<p>Students at high schools, vocational schools and universities (including Springvale University) can buy <a href="/en/tickets/commuter.html">student commuter passes</a> at about 45% off the adult commuter price. There is no student discount on single fares or on Comet.</p>
<h2 class="h2" id="silver">Silver RideCard (65 and over)</h2>
<p>10% off RideCard fares for journeys starting from 10:00 to 16:00 on weekdays, or at any time on Saturdays, Sundays and holidays. Annual fee ${Y(1000)}; apply at a ticket office with ID. Not valid with Comet surcharges, 1-Day passes or commuter passes.</p>
<h2 class="h2" id="groups">Groups</h2>
<p>Groups of 8 or more travelling together get 10% off paper ticket fares (school groups: 30% off). Apply at a ticket office at least 3 days before travel.</p>` },

  tsukikage: { title: 'Limited Express Comet', body: `
${h.img('tsukikage-bridge.jpg', 'Comet crossing the Mirror River in the gorge')}
<p class="lead">The Comet is our limited express between Springvale Central and Moonview Spa. It stops at Castle Town, Clayfield and Red Canyon, and takes 39 minutes for the 38.6 km. All seats are reserved.</p>
<nav class="pagenav"><a href="#seats">Seats</a><a href="#times">Times</a><a href="#fees">Surcharges</a><a href="#rules">Reservations</a><a href="#refunds">Changes and refunds</a></nav>
<h2 class="h2" id="seats">Cars and seats</h2>
<table class="data"><thead><tr><th>Car</th><th>Class</th><th>Seats</th><th>Facilities</th></tr></thead><tbody>
<tr><td>1</td><td>Premium</td><td>24 (rows 1–8, seats A, C, D; 2+1 layout, 1,160 mm pitch)</td><td>Wider seats with footrests and reading lights, power outlet, complimentary bottle of Moonview spring water</td></tr>
<tr><td>2</td><td>Standard</td><td>38 (rows 1–10, A–D; row 1 A and B are wheelchair spaces)</td><td>2 wheelchair spaces, multipurpose toilet, multipurpose room (nursing)</td></tr>
<tr><td>3</td><td>Standard</td><td>56 (rows 1–14, A–D)</td><td>Toilet, luggage area for 6 large items at the rear</td></tr></tbody></table>
<p class="small">All seats face the direction of travel and have a power outlet. Free Wi-Fi throughout. A and D are window seats. Between Clayfield and Red Canyon the Mirror River is on the D side on northbound trains and on the A side on southbound trains. No smoking anywhere on board.</p>
${h.img('tsukikage-interior.jpg', 'Premium seats in Car 1', 'left')}
<h2 class="h2" id="times">Times</h2>
<p>The current timetable is valid until 13 November 2026. From 14 November Comet also stops at Trailhead (<a href="/en/notices/timetable-revision-2026-11.html">details</a>).</p>
${h.xTimetable()}
<h2 class="h2" id="fees">Surcharges</h2>
<p>On Comet you need a ticket for the fare <b>and</b> a limited express ticket. The surcharge depends on the distance you travel on Comet (rounded up to whole kilometres).</p>${h.feeTable()}
<ul class="small"><li>Peak dates (+${Y(h.fee.peak)}): ${h.peakDates}.</li><li>Bought on board: +${Y(h.fee.onboard)}, and only if seats are free. Standing is not allowed on Comet.</li><li>Children pay half the standard surcharge (rounded down to 10 yen) but the full Premium fee of ${Y(h.fee.premium)}.</li><li>Type 1 disability certificate holders travelling with a carer: 50% off for both (<a href="/en/tickets/discounts.html#disability">details</a>).</li><li>Clayfield to Moonview Spa is 25.1 km, which is charged as 26 km: ${Y(760)}.</li></ul>
<h3 class="h3">Examples (adult, one way)</h3>${h.xExamples()}
<h2 class="h2" id="rules">Reservation rules</h2>
<ul><li>Reservations open at 10:00 one month before the travel date (for 10 November, from 10:00 on 10 October). If there is no such date in the previous month, they open on the first day of the travel month.</li>
<li><a href="/en/reserve/index.html">Online</a>: until 4 minutes before departure; up to 6 adults and 4 children per booking. Reserved-seat ticket machines and ticket offices: until departure.</li>
<li>Collect online bookings at a reserved-seat ticket machine at least 5 minutes before departure, or register a Personalized RideCard to travel ticketless.</li>
<li>Wheelchair spaces are booked by phone only: Customer Centre 050-3000-8341 (8:00–20:00).</li>
<li>Large luggage (over 160 cm in total dimensions) goes in the luggage area of Car 3, first come first served.</li></ul>
<h2 class="h2" id="refunds">Changes and refunds</h2>
<table class="data"><thead><tr><th>When</th><th>Change to another Comet</th><th>Refund of the limited express ticket</th></tr></thead><tbody>
<tr><td>Up to 2 days before the travel date</td><td>Free, once</td><td>Fee ${Y(340)}</td></tr>
<tr><td>From the day before the travel date until departure</td><td>Free, once (before departure)</td><td>Fee 30% of the surcharge including any Premium fee (minimum ${Y(340)})</td></tr>
<tr><td>After departure</td><td>Not possible</td><td>No refund</td></tr></tbody></table>
<ul class="small"><li>A second change is treated as a refund and a new purchase.</li><li>The ticket for the fare is refunded separately (fee ${Y(220)} if unused).</li><li>If your Comet reaches your destination 30 minutes or more late, the whole surcharge is refunded (not the fare). If it is cancelled, the surcharge and the unused part of the fare are refunded without a fee.</li><li>If you miss your train, your limited express ticket is not valid on a later Comet.</li>
<li>Example: a standard ticket for Springvale Central to Moonview Spa (${Y(760)}) cancelled the day before: fee 30% = ${Y(228)}, which is below the minimum, so the fee is ${Y(340)} and you get ${Y(420)} back.</li></ul>
<h2 class="h2">How busy is Comet?</h2>${h.occupancyChart()}
<p class="small muted">Weekend morning northbound trains and afternoon southbound trains are often full; reserve early.</p>` },

  accessibility: { title: 'Accessibility and assistance', body: `
<p class="lead">Our staff will help you buy tickets, get to the platform, board and leave the train. Tell us where you are going, and we will contact your destination station so staff meet you there.</p>
<nav class="pagenav"><a href="#help">Asking for help</a><a href="#stepfree">Step-free routes</a><a href="#trains">On trains</a><a href="#other">Other support</a></nav>
<h2 class="h2" id="help">How to ask for help</h2>
<ul><li><b>At a staffed station:</b> ask any member of staff at the ticket gate. You do not need to book.</li>
<li><b>From or to an unstaffed station</b> (Hilltop, Mill Creek, Firefly Valley, Tidewater, Lighthouse, and West Meadow and Citrus Grove outside their staffed hours): please call the Customer Centre on 050-3000-8341 (8:00–20:00) by 20:00 the day before. Staff travel from a nearby station to help you. Same-day requests are met when staff are available.</li>
<li><b>Comet wheelchair spaces</b> are booked by phone only (same number).</li>
<li>Staff carry a portable ramp for boarding. Please allow 10 extra minutes.</li></ul>
<h2 class="h2" id="stepfree">Lifts and step-free routes</h2>
<p>Platforms marked "Stairs only" have no step-free route. Highlighted rows are stations where at least one platform is stairs only.</p>
${h.stepFreeTable()}
<h3 class="h3">If your platform has no step-free route</h3>
<ul><li><b>West Meadow, Citrus Grove and Mill Creek:</b> the northbound platform (platform 1, for Moonview Spa) is reached by footbridge stairs. Board a southbound train to the previous station with lifts or level access, and change there to a northbound train; or ask staff for help. To get off at these stations when travelling north, ride on to the next station (Clayfield, Red Canyon or Firefly Valley respectively) and come back on a southbound train, which uses the level-access platform 2. We do not charge for the extra distance; tell the staff at your destination.</li>
<li><b>Tidewater:</b> the eastbound platform (for Ferry Port) is stairs only. Use Rose Garden (lifts) or Lighthouse (level access).</li>
<li><b>Castle Town:</b> the platform 1 lift is out of service until 23 October 2026 (<a href="/en/notices/shiromachi-lift.html">details and alternatives</a>).</li>
<li><b>Trailhead</b> is reached by an underpass with a long ramp (gradient 1 in 12).</li></ul>
<h2 class="h2" id="trains">On trains</h2>
<ul><li>Every local and rapid train has a wheelchair space in each car and priority seats at both ends of each car.</li>
<li>Mirror Line trains have an accessible toilet in Car 1. Bayside Line trains have no toilets.</li>
<li>Next-station displays and announcements in Japanese and English on all trains.</li>
<li>Comet: two wheelchair spaces and a multipurpose toilet in Car 2.</li></ul>
<h2 class="h2" id="other">Other support</h2>
<ul><li>Tactile paving on every platform; platform edge warning lines on all platforms. There are no platform screen doors.</li>
<li>Braille fare tables at all staffed stations; written communication boards at ticket offices.</li>
<li>Assistance dogs are welcome on all trains and in all stations.</li>
<li>Multipurpose toilets: see the table above. Firefly Valley and Lighthouse have no toilets.</li>
<li>Fare discounts: see <a href="/en/tickets/discounts.html#disability">discounts for people with disabilities</a>.</li></ul>
${h.img('platform.jpg', 'Tactile paving on a Bayside Line platform', 'center')}` },

  lostfound: { title: 'Lost and found', body: `
<h2 class="h2">If you left something on a train or at a station</h2>
<ol><li><b>On the same day:</b> contact the station where you got off (staffed stations), or the Customer Centre on 050-3000-8341 (8:00–20:00). Tell us the time and destination of the train, the car (or Comet seat number), and a description of the item.</li>
<li><b>From the next day:</b> items found are sent to the Lost Property Centre at Springvale Central. Use the <a href="#form">online inquiry form</a> or call the centre.</li></ol>
<h2 class="h2">Lost Property Centre</h2>
<table class="data kv"><tr><th>Place</th><td>Springvale Central Station, South Exit, next to the ticket office</td></tr><tr><th>Hours</th><td>9:00–18:00 (closed 31 December – 3 January)</td></tr><tr><th>Phone</th><td>050-3000-8355</td></tr></table>
<h2 class="h2">How long we keep items</h2>
<table class="data"><thead><tr><th>Item</th><th>Kept by Springvale Railway</th><th>Then</th></tr></thead><tbody>
<tr><td>Most items</td><td>7 days including the day found</td><td>Handed to Springvale Police Station, which keeps them for 3 months</td></tr>
<tr><td>Wallets, phones, keys, cards, ID</td><td>2 days</td><td>Handed to the police</td></tr>
<tr><td>Umbrellas</td><td>14 days</td><td>Disposed of</td></tr>
<tr><td>Food and drink, perishables</td><td>Not kept</td><td>Disposed of on the day</td></tr></tbody></table>
<h2 class="h2">Collecting an item</h2>
<p>Bring photo ID. Someone collecting for you needs a letter of authority and their own ID. We can also send the item to you cash on delivery (the delivery charge is paid by you). There is no fee for lost property.</p>
<h2 class="h2" id="form">Online inquiry form</h2>
<p>Since 20 August 2026 you can send an inquiry online. We reply within two working days. If the item is with the police, we will tell you the reference number.</p>
<form class="box res-form" onsubmit="event.preventDefault();this.querySelector('.ok').hidden=false"><div class="pf-row"><label>Date lost<input type="date" value="2026-10-04"></label><label>Line<select><option>Mirror Line</option><option>Bayside Line</option><option>Ltd. Exp. Comet</option></select></label></div><div class="pf-row"><label>Item<input placeholder="e.g. navy umbrella"></label><label>Email<input type="email"></label></div><button class="btn-primary">Send</button><p class="ok" hidden>Thank you. Your inquiry number is LF-2610-0417.</p></form>
<p class="small">Lost RideCard: see <a href="/en/tickets/haruca.html#lost">If you lose a RideCard</a>.</p>` },

  rules: { title: 'Rules and conditions of carriage (summary)', body: `
<p class="lead">This page summarises the main points of Springvale Railway's Passenger Tariff. The full text is available at ticket offices.</p>
<nav class="pagenav"><a href="#tickets">Tickets</a><a href="#refunds">Refunds</a><a href="#disruption">Delays and cancellations</a><a href="#certificates">Delay certificates</a><a href="#luggage">Luggage</a><a href="#bicycles">Bicycles</a><a href="#pets">Animals</a><a href="#other">Other rules</a></nav>
<h2 class="h2" id="tickets">1. Tickets</h2>
<ul><li>Single tickets are valid only on the day shown on them (the day of purchase, or the travel date when bought in advance with a Comet ticket) and do not allow breaks of journey.</li>
<li>With RideCard you must leave the paid area within 3 hours of entering.</li>
<li>From 30 December to 3 January all trains run to the Saturday/holiday timetable.</li>
<li>Passengers without a valid ticket pay the fare for the journey plus a penalty of twice that fare.</li></ul>
<h2 class="h2" id="refunds">2. Refunds</h2>
<table class="data"><thead><tr><th>Ticket</th><th>Refund</th><th>Fee</th></tr></thead><tbody>
<tr><td>Single ticket, unused</td><td>Full fare, until the end of its day of validity</td><td>${Y(220)}</td></tr>
<tr><td>Single ticket, partly used</td><td>Not refundable (except disruption, see 3)</td><td>—</td></tr>
<tr><td>1-Day Free Pass, Rail &amp; Bus Pass</td><td>Unused, before the day of validity</td><td>${Y(220)}</td></tr>
<tr><td>Spa Day Ticket</td><td>Before the first day of validity</td><td>${Y(220)}</td></tr>
<tr><td>Commuter pass</td><td>See <a href="/en/tickets/commuter.html">commuter passes</a></td><td>${Y(220)}</td></tr>
<tr><td>Comet limited express ticket</td><td>See <a href="/en/tsukikage/index.html#refunds">Comet</a></td><td>${Y(340)} or 30%</td></tr>
<tr><td>RideCard</td><td>Balance + deposit</td><td>${Y(220)}</td></tr></tbody></table>
<h2 class="h2" id="disruption">3. Delays and cancellations</h2>
<ul><li>If your train is cancelled or seriously delayed and you abandon your journey, the fare for the unused part is refunded without a fee. If you have already travelled, you may return to your starting station free of charge on the same day and receive a full refund.</li>
<li>If Comet arrives 30 minutes or more late, the limited express surcharge is refunded in full.</li>
<li>We do not pay for taxis, hotels or other costs caused by delays.</li>
<li>When a section is closed, your ticket is valid on replacement buses and, where we announce it, on Springvale City Bus routes between the stations concerned.</li></ul>
<h2 class="h2" id="certificates">4. Delay certificates</h2>
<p>When a train is 5 minutes or more late, we issue a delay certificate. On the day, ask at the ticket gate of any staffed station. For the past seven days, print one from the <a href="/en/status.html#certificates">service status page</a>. Certificates older than seven days are not issued.</p>
<h2 class="h2" id="luggage">5. Luggage</h2>
<ul><li>You may bring up to 2 items free of charge, each no more than 250 cm in total dimensions (length + width + height), 2 m long and 30 kg.</li>
<li>On Comet, items over 160 cm in total go in the luggage area of Car 3.</li>
<li>Prohibited: dangerous goods such as petrol, gas cylinders (except small cassette gas canisters, up to 5), fireworks and anything that could harm other passengers.</li></ul>
<h2 class="h2" id="bicycles">6. Bicycles</h2>
<ul><li>Folding bicycles folded in a bag, and bicycles with the wheels removed and packed in a bag (bike bag), can be taken on any train free of charge, as luggage.</li>
<li><b>Cycle Train:</b> on the Mirror Line between Clayfield and Moonview Spa, unfolded bicycles may be taken on Local trains on Saturdays, Sundays and holidays, on trains leaving between 10:00 and 16:00. Bicycle ticket ${Y(300)} per bicycle; up to 4 bicycles per train, in the front car. Not allowed on Rapid or Comet, on the Bayside Line, or on 10–12 October 2026.</li>
<li>Electric-assisted bicycles: only folding ones in a bag.</li></ul>
<h2 class="h2" id="pets">7. Animals</h2>
<p>Small dogs, cats and other small animals may travel in a closed carrier no more than 90 cm in total dimensions and 10 kg including the animal. Buy a hand luggage ticket (${Y(290)} per carrier) at a ticket office or ticket machine. Assistance dogs travel free and do not need a carrier.</p>
<h2 class="h2" id="other">8. Other rules</h2>
<ul><li>Smoking (including e-cigarettes) is not allowed in stations or on trains.</li>
<li>Please offer priority seats to people who need them, and switch your phone to silent mode near priority seats.</li>
<li>Eating on Local and Rapid trains: please avoid it when trains are crowded. Eating is fine on Comet.</li></ul>` },

  faq: { title: 'Frequently asked questions', body: `
<div class="faq-cats"><a href="#q-tickets">Tickets and fares</a><a href="#q-tsukikage">Comet</a><a href="#q-travel">Travelling</a><a href="#q-stations">Stations and assistance</a></div>
<h2 class="h2" id="q-tickets">Tickets and fares</h2>
<details><summary>Q. What is the cheapest fare?</summary><p>${Y(170)} with a paper ticket or ${Y(168)} with RideCard, for up to 3 km. See the <a href="/en/fares/index.html">fare table</a>.</p></details>
<details><summary>Q. Can I use my IC card from Tokyo or Osaka?</summary><p>No. Only RideCard can be used on Springvale Railway. Please buy a paper ticket or a RideCard.</p></details>
<details><summary>Q. Can I pay by credit card?</summary><p>Only at reserved-seat ticket machines (purple) and ticket offices. Regular ticket machines take cash and RideCard only. RideCard itself can be charged by credit card on RideCard Web.</p></details>
<details><summary>Q. How do I get my RideCard deposit back?</summary><p>Return the card at a ticket office. You get the balance minus ${Y(220)} plus the ${Y(500)} deposit. <a href="/en/tickets/haruca.html#refund">Details</a>.</p></details>
<details><summary>Q. My RideCard balance was not enough when I arrived. What do I do?</summary><p>Use the fare adjustment machine inside the ticket gate, or ask staff. At unstaffed stations, pay on the platform reader or report it at the next staffed station.</p></details>
<details><summary>Q. Is there a pass for one day?</summary><p>Yes: the 1-Day Free Pass, ${Y(h.pass.weekday)} on weekdays and ${Y(h.pass.weekend)} on Saturdays, Sundays and holidays. <a href="/en/tickets/passes.html#oneday">Details</a>.</p></details>
<details><summary>Q. I travel the same route a few times a week. What is cheapest?</summary><p>Compare: RideCard fares (cheapest per ride, and RideCard Points from the 11th ride on the same section in a month), the 1-Day Free Pass on days with long return trips, and a commuter pass if you travel most days. A commuter pass usually pays off at around 14 or more round trips a month.</p></details>
<details><summary>Q. Do children need a ticket?</summary><p>Children aged 6–11 pay half fare. Up to two children aged 1–5 travel free with each paying passenger. <a href="/en/tickets/discounts.html">Details</a>.</p></details>
<details><summary>Q. Can I get a receipt?</summary><p>Ticket machines print a receipt on request (press "Receipt" before paying). For RideCard journeys, print your use history at a ticket machine (last 20 journeys) or on RideCard Web.</p></details>
<details><summary>Q. Is there a student discount?</summary><p>Only on commuter passes. <a href="/en/tickets/discounts.html#students">Details</a>.</p></details>
<h2 class="h2" id="q-tsukikage">Comet</h2>
<details><summary>Q. Can I board Comet without a reservation?</summary><p>Yes, if seats are free: buy the surcharge on board for ${Y(h.fee.onboard)} extra. Standing is not allowed, so if the train is full you must wait for the next one.</p></details>
<details><summary>Q. When can I reserve?</summary><p>From 10:00 one month before your travel date. <a href="/en/tsukikage/index.html#rules">Rules</a>.</p></details>
<details><summary>Q. How much does it cost to cancel?</summary><p>${Y(340)} up to two days before; from the day before, 30% of the surcharge (minimum ${Y(340)}). No refund after departure. <a href="/en/tsukikage/index.html#refunds">Details</a>.</p></details>
<details><summary>Q. Which side has the river view?</summary><p>Seat D going north (to Moonview Spa), seat A going south, between Clayfield and Red Canyon.</p></details>
<details><summary>Q. Can I use a 1-Day Free Pass on Comet?</summary><p>Yes, if you also buy the limited express surcharge.</p></details>
<details><summary>Q. Is there a toilet on Comet?</summary><p>Yes, in Cars 2 (multipurpose) and 3.</p></details>
<h2 class="h2" id="q-travel">Travelling</h2>
<details><summary>Q. What time is the last train?</summary><p>See the first and last trains on each <a href="/en/timetable/index.html">timetable page</a>. For example, the last train from Moonview Spa to Springvale Central leaves at 21:40 on weekdays and 21:05 on Saturdays, Sundays and holidays (21:40 every day from 14 November).</p></details>
<details><summary>Q. Why did my train stop at Clayfield?</summary><p>Many Mirror Line locals go only as far as Clayfield. Check the destination: trains for Clayfield are marked "Ka" in the timetables.</p></details>
<details><summary>Q. Can I take my bicycle on the train?</summary><p>Folded or bagged bicycles, yes. Unfolded bicycles only on the Cycle Train (Clayfield–Moonview Spa, weekends and holidays, 10:00–16:00, ${Y(300)}). <a href="/en/rules.html#bicycles">Details</a>.</p></details>
<details><summary>Q. Can I bring my dog?</summary><p>In a carrier (up to 90 cm, 10 kg) with a ${Y(290)} hand luggage ticket. Assistance dogs travel free.</p></details>
<details><summary>Q. Is there Wi-Fi?</summary><p>Free Wi-Fi (ValeRail_Free_WiFi) on Comet and at the stations listed on each station page. Local trains have no Wi-Fi.</p></details>
<details><summary>Q. Do trains have toilets?</summary><p>Mirror Line trains have one in Car 1. Bayside Line trains have none.</p></details>
<details><summary>Q. My train was late. Can I get a delay certificate?</summary><p>Yes, for delays of 5 minutes or more: at the station on the day, or online for the past seven days. <a href="/en/status.html#certificates">Delay certificates</a>.</p></details>
<details><summary>Q. Will the timetable change?</summary><p>Yes, on Saturday 14 November 2026. <a href="/en/notices/timetable-revision-2026-11.html">What changes</a>.</p></details>
<h2 class="h2" id="q-stations">Stations and assistance</h2>
<details><summary>Q. Which stations have coin lockers?</summary><p>Springvale Central, Castle Town, University Gate, Clayfield, Red Canyon, Moonview Spa, Market Square, Rose Garden and Ferry Port. See each <a href="/en/stations/index.html">station page</a>.</p></details>
<details><summary>Q. I use a wheelchair. Can I travel from an unstaffed station?</summary><p>Yes. Please call 050-3000-8341 by 20:00 the day before so staff can meet you. <a href="/en/accessibility.html">Accessibility</a>.</p></details>
<details><summary>Q. Which platforms have no lift?</summary><p>See the <a href="/en/accessibility.html#stepfree">step-free access table</a>.</p></details>
<details><summary>Q. I left something on the train.</summary><p>See <a href="/en/lost-found.html">Lost and found</a>.</p></details>
<details><summary>Q. Where can I send my luggage to my inn at Moonview Spa?</summary><p>Use the hands-free service at the Springvale Central Travel Centre. <a href="/en/trips/tsukimi-onsen.html#luggage">Details</a>.</p></details>
<details><summary>Q. Is Castle Town crowded during the Lantern Festival?</summary><p>Very. Entry may be restricted from 18:00 to 21:30 on 10 and 11 October. <a href="/en/notices/lantern-festival-trains.html">Details</a>.</p></details>` },

  'trip-onsen': { title: 'A day at Moonview Spa', body: `
${h.img('onsen-station.jpg', 'Moonview Spa station at dusk')}
<p class="lead">Hot springs, a foot bath right outside the station and the ropeway up Mount Moonview (1,214 m): Moonview Spa is 39 minutes from Springvale Central by Ltd. Exp. Comet.</p>
<h2 class="h2">Getting there</h2>
<table class="data"><thead><tr><th>Train</th><th>Springvale Central → Moonview Spa</th><th>Fare + surcharge</th></tr></thead><tbody>
<tr><td>Ltd. Exp. Comet</td><td>39 min</td><td>${Y(ct.ticket)} + ${Y(xCT)} = ${Y(ct.ticket + xCT)}</td></tr><tr><td>Rapid</td><td>55 min</td><td>${Y(ct.ticket)}</td></tr><tr><td>Local</td><td>63 min</td><td>${Y(ct.ticket)}</td></tr></tbody></table>
<h3 class="h3">Comet from Springvale Central (departure → arrival)</h3>
<p><b>Weekdays:</b> ${h.depsArr('central', 'K', 'd', 'wd', 'X', 'tsukimionsen')}<br><b>Saturdays, Sundays and holidays:</b> ${h.depsArr('central', 'K', 'd', 'we', 'X', 'tsukimionsen')}</p>
<h3 class="h3">Comet back to Springvale Central</h3>
<p><b>Weekdays:</b> ${h.depsArr('tsukimionsen', 'K', 'u', 'wd', 'X', 'central')}<br><b>Saturdays, Sundays and holidays:</b> ${h.depsArr('tsukimionsen', 'K', 'u', 'we', 'X', 'central')}</p>
<h3 class="h3">Last trains from Moonview Spa</h3>${h.firstLast('tsukimionsen', 'K', 'u')}
<p class="small">Rapid trains back leave Moonview Spa at 10 minutes past the hour (weekdays 7:10–19:10, weekends 8:10–18:10).</p>
<h2 class="h2">Save with the Spa Day Ticket</h2>
<p>Comet both ways, a public bath and a ${Y(500)} voucher for ${Y(h.pass.yukemuri)}. <a href="/en/tickets/passes.html#yukemuri">Details and conditions</a>.</p>
<h2 class="h2">Things to do</h2>
<ul><li><b>Station foot bath:</b> free, 9:00–18:00. Bring a small towel.</li>
<li><b>Moonview Main Bath</b> public bath: ${Y(600)}, 7:00–22:00, closed Wednesdays. 6 min walk.</li>
<li><b>Golden Bath</b> public bath: ${Y(450)}, 10:00–21:00. 10 min walk.</li>
<li><b>Mount Moonview Ropeway:</b> Moonview Bus 5 from stop 1 (25 min, ${Y(480)}), every 40 min; the last bus leaves the station at 16:20.</li>
<li><b>Starfield Highland:</b> Moonview Bus 7 from stop 3 (40 min, ${Y(720)}), 5 buses a day.</li></ul>
<h2 class="h2" id="luggage">Hands-free travel</h2>
<p>Leave your bags at the Vale Rail Travel Centre (Springvale Central, North concourse, 10:00–18:00) by 11:00 and they will be delivered to your inn in Moonview Spa by 16:00. ${Y(800)} per bag. For the return, hand your bags to your inn's front desk by 10:00 and collect them at the Travel Centre from 15:00.</p>
<h2 class="h2">A sample day</h2>
<ol class="timeline"><li><b>9:30</b> Comet 5 from Springvale Central (weekends; arrive 10:09)</li><li><b>10:20</b> Foot bath, then Moonview Bus 5 to the ropeway</li><li><b>13:00</b> Lunch in the onsen town (use your ${Y(500)} voucher)</li><li><b>15:00</b> Moonview Main Bath</li><li><b>16:50</b> Comet 22 back (arrive Springvale Central 17:29)</li></ol>
<p class="small muted">Times are for Saturdays, Sundays and holidays until 13 November 2026.</p>` },

  'trip-festival': { title: 'Springvale Lantern Festival 2026', body: `
${h.img('lantern-festival.jpg', 'Lanterns on the Mirror River below Springvale Castle')}
<p class="lead">On the second weekend of October, thousands of paper lanterns float down the Mirror River below Springvale Castle. In 2026 the festival is on <b>Saturday 10 and Sunday 11 October</b>.</p>
<h2 class="h2">Programme (both days)</h2>
<table class="data"><tbody><tr><th>16:00</th><td>Stalls open along the Mirror River promenade</td></tr><tr><th>18:00–20:30</th><td>Lantern procession from Springvale Castle to the river</td></tr><tr><th>19:30–21:00</th><td>Lantern floating on the Mirror River (main stage near Castle Town)</td></tr><tr><th>21:00</th><td>Closing</td></tr></tbody></table>
<h2 class="h2">Getting there</h2>
<ul><li><b>Castle Town</b> (K02): River Exit, 4 minutes to the main stage. Very crowded.</li>
<li><b>Springvale Central</b> (K01/B01): North Exit, 5 minutes to the south end of the promenade. Wheelchair viewing area near the North Exit (Springvale City, booking required).</li>
<li>Walking between the two stations along the river takes about 20 minutes.</li></ul>
<h2 class="h2">Station and train arrangements</h2>
<ul><li>Castle Town: entry to the station may be restricted from 18:00 to 21:30; you may be asked to wait outside. The coin lockers at Castle Town are closed from 15:00.</li>
<li>Comet 21, 24, 25 and 28 do not stop at Castle Town on 10 and 11 October.</li>
<li>Extra late trains run on both lines; see the <a href="/en/notices/lantern-festival-trains.html">extra train timetable</a>. They are not shown in the timetables or the journey planner.</li>
<li>Comet peak surcharge (+${Y(h.fee.peak)}) applies from 10 to 12 October. The Spa Day Ticket is not valid on these days.</li>
<li>Buy your return ticket or charge your RideCard before you go: queues at the ticket machines are long after the festival.</li></ul>
<h2 class="h2">Last regular trains from Springvale Central (Saturday and Sunday)</h2>
<p><b>Mirror Line</b></p>${h.firstLast('central', 'K', 'd')}<p><b>Bayside Line</b></p>${h.firstLast('central', 'B', 'd')}` },

  about: { title: 'About Springvale Railway', body: `
<p class="lead">Springvale Railway Co., Ltd. (春川鉄道, "Vale Rail") runs the Mirror Line and the Bayside Line in Springvale City, Harvest Prefecture.</p>
<table class="data kv"><tr><th>Head office</th><td>1-1 Station Square, Springvale, Harvest Prefecture 780-0001</td></tr><tr><th>Founded</th><td>1923 (as Mirror Valley Railway)</td></tr><tr><th>Lines</th><td>Mirror Line 38.6 km (14 stations), Bayside Line 16.2 km (9 stations); 22 stations in all</td></tr><tr><th>Rolling stock</th><td>46 cars, including three 3-car Comet trains</td></tr><tr><th>Employees</th><td>684 (April 2026)</td></tr><tr><th>Passengers</th><td>About 41 million a year (FY2025); 112,430 boardings a day</td></tr></table>
<h2 class="h2">History</h2>
<table class="data"><tbody><tr><th>1926</th><td>Mirror Valley Railway opens Springvale – Clayfield</td></tr><tr><th>1931</th><td>Extended to Moonview Spa</td></tr><tr><th>1951</th><td>Renamed Springvale Railway</td></tr><tr><th>1962</th><td>Bayside Line opens to Ferry Port</td></tr><tr><th>1987</th><td>Limited express Comet starts</td></tr><tr><th>1998</th><td>Bayside Line elevated between Springvale Central and Pier Road</td></tr><tr><th>2012</th><td>RideCard IC card introduced</td></tr><tr><th>2019</th><td>New Comet trains with Premium seats</td></tr></tbody></table>
<h2 class="h2">Ridership</h2><img class="chart" src="/assets/charts/ridership-en.svg" alt="graph" width="640">
<h2 class="h2" id="recruit">Careers</h2><p>We recruit station staff, drivers and engineers every spring. Applications for April 2027 close on 30 November 2026.</p>
<h2 class="h2" id="privacy">Privacy</h2><p>We use personal information given to us (for reservations, lost property and RideCard registration) only for those purposes and do not pass it to third parties except as required by law. This site uses cookies for analytics.</p>
<h2 class="h2" id="site">About this site</h2><p>This is a fictional website made for research (a user study of the UniLens assistant). Springvale City, Springvale Railway and everything on this site are invented.</p>` },

  'notice:timetable-revision-2026-11': { title: 'Timetable revision on Saturday 14 November 2026', body: `
<p>We will revise the timetables of both lines on <b>Saturday 14 November 2026</b>. The main changes are below. The new station timetables will be published on this site on 1 November, and the journey planner will accept searches from 14 November from that day.</p>
<h2 class="h2">What changes</h2>
<div class="scroll"><table class="data"><thead><tr><th>Item</th><th>Until Fri 13 Nov</th><th>From Sat 14 Nov</th></tr></thead><tbody>
<tr><td>Comet stops</td><td>Castle Town, Clayfield, Red Canyon</td><td>Also <b>Trailhead</b> (all trains). Springvale Central – Moonview Spa 41 min</td></tr>
<tr><td>Comet 1 (weekdays)</td><td>Springvale Central 7:30 → Moonview Spa 8:09</td><td>7:25 → 8:06</td></tr>
<tr><td>Last train from Moonview Spa, Sat/Sun/holidays</td><td>21:05 (Springvale Central 22:08)</td><td><b>21:40</b> (Springvale Central 22:43)</td></tr>
<tr><td>Last train from Moonview Spa, weekdays</td><td>21:40 (Springvale Central 22:43)</td><td>No change</td></tr>
<tr><td>Last northbound train from Springvale Central, weekdays</td><td>23:20 for Clayfield</td><td>23:20 for <b>Red Canyon</b> (arr. 23:59)</td></tr>
<tr><td>Rapid stops</td><td>Does not stop at Riverside</td><td>Stops at <b>Riverside</b> (1 min longer)</td></tr>
<tr><td>Bayside Line, weekdays 10:00–16:40</td><td>Every 20 min</td><td>Every <b>15</b> min</td></tr>
<tr><td>Bayside Line last eastbound, Sat/Sun/holidays</td><td>23:00 for Ferry Port; 23:35 for Rose Garden</td><td>23:35 runs through to <b>Ferry Port</b> (arr. 0:03)</td></tr>
</tbody></table></div>
<h2 class="h2">What does not change</h2>
<ul><li>Fares, Comet surcharges and pass prices.</li><li>Comet reservations for trains from 14 November open as usual at 10:00 one month before (from 14 October). Please check the new times before reserving.</li></ul>
<p>See also: <a href="/en/timetable/index.html">current timetables</a>, <a href="/en/tsukikage/index.html">Comet</a>.</p>` },

  'notice:lantern-festival-trains': { title: 'Extra trains for the Springvale Lantern Festival (10–11 October)', body: `
<p>For the Springvale Lantern Festival on Saturday 10 and Sunday 11 October 2026, we will run the extra trains below on both days, in addition to the Saturday/holiday timetable.</p>
<h2 class="h2">Extra trains</h2>
<table class="data"><thead><tr><th>Line</th><th>Departs</th><th>Arrives</th><th>Type</th></tr></thead><tbody>
<tr><td>Mirror Line</td><td>Clayfield 17:20</td><td>Springvale Central 17:43</td><td>Local</td></tr>
<tr><td>Mirror Line</td><td>Clayfield 18:20</td><td>Springvale Central 18:43</td><td>Local</td></tr>
<tr><td>Mirror Line</td><td>Springvale Central 21:40</td><td>Clayfield 22:03</td><td>Local</td></tr>
<tr><td>Mirror Line</td><td>Springvale Central 22:30</td><td>Red Canyon 23:09</td><td>Local</td></tr>
<tr><td>Mirror Line</td><td>Springvale Central 23:25</td><td>Clayfield 23:48</td><td>Local</td></tr>
<tr><td>Bayside Line</td><td>Springvale Central 21:15</td><td>Ferry Port 21:43</td><td>Local</td></tr>
<tr><td>Bayside Line</td><td>Springvale Central 21:45</td><td>Ferry Port 22:13</td><td>Local</td></tr>
<tr><td>Bayside Line</td><td>Springvale Central 22:15</td><td>Ferry Port 22:43</td><td>Local</td></tr>
<tr><td>Bayside Line</td><td>Springvale Central 22:45</td><td>Ferry Port 23:13</td><td>Local</td></tr>
<tr><td>Bayside Line</td><td>Springvale Central 23:30</td><td>Ferry Port 23:58</td><td>Local</td></tr></tbody></table>
<p class="small">Extra trains stop at all stations. Mirror Line extra trains leave Castle Town 3 minutes after Springvale Central. They are not shown in the station timetables or the journey planner.</p>
<h2 class="h2">Other arrangements</h2>
<ul><li>Castle Town Station: entry may be restricted from 18:00 to 21:30. Coin lockers closed from 15:00.</li><li>Comet 21, 24, 25 and 28 do not stop at Castle Town on both days.</li><li>Comet peak surcharge (+${Y(h.fee.peak)}) from 10 to 12 October.</li><li>The Spa Day Ticket and the Cycle Train are not available from 10 to 12 October.</li></ul>
<p><a href="/en/trips/lantern-festival.html">Festival guide</a></p>` },

  'notice:shiromachi-lift': { title: 'Castle Town Station: platform 1 lift out of service (5–23 October)', body: `
<p>The lift between the concourse and platform 1 (northbound, for Moonview Spa) at Castle Town Station will be out of service from <b>Monday 5 October to Friday 23 October 2026</b> while we replace its control equipment. The platform 2 lift (southbound, for Springvale Central) is not affected.</p>
<h2 class="h2">If you cannot use the stairs</h2>
<ul><li><b>To board a northbound train at Castle Town:</b> between 7:00 and 20:00, ask staff at the ticket gate; they will take you to platform 1 by the staff route at the north end of the station. Outside these hours, take a southbound train from platform 2 to Springvale Central (lifts on all platforms) and board your northbound train there.</li>
<li><b>To get off a northbound train at Castle Town:</b> stay on to University Gate (lifts on both platforms), change to a southbound train and come back to Castle Town platform 2. Comet does not stop at University Gate, so if you are coming north from Springvale Central, take a Local or Rapid instead; or, between 7:00 and 20:00, ask staff at your departure station to arrange help at Castle Town.</li>
<li>There is no extra fare for these detours. Tell the staff at the ticket gate.</li></ul>
<p>We apologise for the inconvenience.</p>` },

  'notice:bayside-night-works': { title: 'Bayside Line: replacement buses after 21:30 on 24 and 25 October', body: `
<p>Because of track renewal between Seafront and Ferry Port, on the evenings of <b>Saturday 24 and Sunday 25 October 2026</b>, trains after 21:30 will run only between Springvale Central and Seafront. Buses will replace trains between Seafront and Ferry Port.</p>
<table class="data kv"><tr><th>Affected trains</th><td>Eastbound trains leaving Springvale Central at 21:30 or later; westbound trains from Ferry Port at 21:40 or later</td></tr>
<tr><th>Buses</th><td>Seafront station front ↔ Rose Garden ↔ Tidewater ↔ Lighthouse ↔ Ferry Port (Town Exit). About 25 minutes from Seafront to Ferry Port (15 min by train).</td></tr>
<tr><th>Bus stops</th><td>Rose Garden: station rotary. Tidewater: "Tidewater Station" stop on the coast road, 200 m from the station. Lighthouse: in front of the station.</td></tr>
<tr><th>Westbound</th><td>Buses leave Ferry Port 15 minutes earlier than the train times in the timetable, to connect with trains at Seafront.</td></tr>
<tr><th>Accessibility</th><td>One wheelchair-accessible bus an hour. Please tell the Customer Centre (050-3000-8341) by 20:00 on the day before.</td></tr></table>
<p>Tickets, RideCard and passes are valid on the buses. Bicycles cannot be carried on the buses.</p>` },

  'notice:haruca-maintenance': { title: 'RideCard Web unavailable on the night of 20 October', body: `
<p>Because of system maintenance, <b>RideCard Web</b> (online charging, journey history, points) will be unavailable from <b>23:30 on Tuesday 20 October to 5:00 on Wednesday 21 October 2026</b>.</p>
<ul><li>RideCard can be used at ticket gates and charged at ticket machines as usual.</li><li>Online charges made before 23:30 will be added at the ticket gate from 5:00 on 21 October.</li><li>Applications to reissue a lost RideCard will not be accepted until 10:00 on 21 October.</li></ul>` },

  'notice:tsukikage-peak-dates': { title: 'Comet peak dates for 2026–27', body: `
<p>On the following peak dates, the Comet limited express surcharge is ${Y(h.fee.peak)} higher than usual (for both standard and Premium seats; children ${Y(h.fee.peak / 2)}):</p>
<p><b>${h.peakDates}</b></p>
<p>The Moonview Spa Day Ticket cannot be used from 10 to 12 October 2026 or from 28 December 2026 to 6 January 2027.</p>
<p><a href="/en/tsukikage/index.html#fees">Comet surcharges</a></p>` },

  'notice:lost-property-form': { title: 'Lost property: new online inquiry form', body: `
<p>From <b>20 August 2026</b> you can ask about lost property online, 24 hours a day. We reply by email within two working days. Telephone inquiries (050-3000-8355, 9:00–18:00) continue as before.</p><p><a href="/en/lost-found.html#form">Online inquiry form</a></p>` },

  'notice:yukemuri-extended': { title: 'Moonview Spa Day Ticket: sales extended to March 2027', body: `
<p>The Moonview Spa Day Ticket will remain on sale until <b>31 March 2027</b>. The price stays at ${Y(h.pass.yukemuri)} (child ${Y(h.pass.yukemuri / 2)}). From 1 July 2026 you can also use the bath ticket at <b>Golden Bath</b> as well as Moonview Main Bath.</p><p><a href="/en/tickets/passes.html#yukemuri">Ticket details</a></p>` },
  };
};
