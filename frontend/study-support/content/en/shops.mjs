// Shops and contact (English)
import { SHOPS, TEL, FEE, yen, table, steps, note } from '../shared.mjs';

const SVC = { n: 'New contracts and switching', r: 'Repairs', e: 'eSIM', c: 'Smartphone classes', p: 'Parking' };
const tick = (s, k) => (s.svc.includes(k) ? '<span class="svc">✓</span>' : '<span class="svc no">–</span>');
const hrs = (h) => `${h[0]}:00–${h[1]}:00`;

export const pages = {
  'shops/index.html': {
    title: 'Find a shop', short: 'Shops',
    lead: 'Kumo shops in Minori Prefecture. Book an appointment to avoid waiting: on weekends, waits without a booking can be over an hour.',
    body: `
<img class="photo-wide" src="/assets/img/shop-interior.jpg" alt="">
<p>Kumo has 1,420 shops across Japan. This page lists the shops in Minori Prefecture. Plan changes, data purchases and many other procedures can also be done in <a href="@/my-kumo.html">My Kumo</a>, with no admin fee.</p>
${table(['Shop', 'Address', 'Hours', 'Closed', 'New / switch', 'Repairs', 'eSIM', 'Classes', 'Parking'], SHOPS.map((s) => [
    `<span id="${s.id}"></span>${s.page ? `<a href="@/shops/${s.id}.html">${s.en.name}</a>` : s.en.name}<br><span class="small">${s.tel}</span>`, s.en.addr, s.en.hours, s.en.closed, tick(s, 'n'), tick(s, 'r'), tick(s, 'e'), tick(s, 'c'), tick(s, 'p'),
  ]), { cls: 'shop-row' })}
<ul class="kome"><li>Kumo Shop Tsukimi Onsen does not sell devices on site; devices are ordered and delivered to the shop in 2–3 days. It is closed on Tuesdays and Wednesdays since 1 June 2026.</li><li>The Harukawa University counter serves students and staff, and the public. It does not accept repairs.</li><li>Shop phone numbers (0570, Navi Dial) are charged. For general questions, call the Information Center (free).</li></ul>
<h2>Services at shops</h2>
<p>Admin fees apply to some procedures done at a shop (${'¥3,850'}); the same procedures are free online. See <a href="@/billing/fees.html">Fees and charges</a>.</p>`,
    related: ['shops/harukawa-central.html', 'shops/appointments.html', 'forms/checklist.html'],
  },

  'shops/harukawa-central.html': {
    title: 'Kumo Shop Harukawa Central', short: 'Harukawa Central',
    lead: 'Our largest shop in Minori Prefecture, inside Harukawa Central Station building. All procedures, repairs and free smartphone classes.',
    body: `
<img class="photo-wide" src="/assets/img/station-shop.jpg" alt="The shopfront inside the station concourse">
${table(['', ''], [
    ['Address', SHOPS[0].en.addr],
    ['Access', '1 minute from the East Exit of Harukawa Central Station (HaruTetsu Kagami Line and Bayside Line). Take the lift or escalator from the concourse to the 2nd floor.'],
    ['Opening hours', 'Every day 10:00–20:00 (including weekends and holidays). Reception for new contracts and switching closes at 18:30.'],
    ['Closed', SHOPS[0].en.closed],
    ['Phone', `${SHOPS[0].tel} (Navi Dial, charged; 10:00–19:00)`],
    ['Parking', 'No shop car park. Station building car park: 1 hour free when you complete a procedure (show your receipt at the counter).'],
  ], { cls: 'plain' })}
${note('info', '<p>During the <b>Harukawa Lantern Festival</b> on Saturday 10 and Sunday 11 October 2026, the shop is open until <b>21:00</b> (reception for new contracts until 19:30). Expect long waits in the afternoon; appointments are recommended. Monday 12 October (Sports Day): normal hours.</p>', 'Extended hours during the Lantern Festival')}
<h2>Services</h2>
${table(['Service', 'Available', 'Notes'], [
    ['New contracts and switching to Kumo', 'Yes', 'About 90 minutes. Last reception 18:30'],
    ['Plan changes, options, eSIM', 'Yes', ''],
    ['Repairs and Device Care claims', 'Yes', 'Repairs are sent to the repair centre (7–10 days); loaner phones available'],
    ['Contract transfer, inheritance', 'Yes', 'About 60 minutes'],
    ['Kumo Hikari home internet', 'Yes', 'Consultation and application'],
    ['Smartphone classes', 'Yes', 'Free, booking required'],
    ['Device sales', 'Yes', 'Trade-in of your old phone accepted'],
  ])}
<h2>Waiting times without an appointment</h2>
${table(['', 'Weekdays', 'Saturdays, Sundays and holidays'], [['10:00–13:00', 'About 15 minutes', 'About 45 minutes'], ['13:00–17:00', 'About 30 minutes', '60–90 minutes'], ['17:00–20:00', 'About 40 minutes', 'About 50 minutes']], { caption: 'Typical waits in September 2026. The last day of each month is busy all day.' })}
<h2>Free smartphone classes (October 2026)</h2>
<p>Tuesdays and Thursdays, 14:00–15:00. 6 seats per class. Anyone can join (you do not need to be a Kumo customer). Book at the shop, by phone or on the <a href="@/shops/appointments.html">booking page</a>. Loan smartphones are available.</p>
${table(['Date', 'Topic'], [['Tue 6 October', 'Smartphone basics: calls, contacts and settings'], ['Thu 8 October', 'Video calls with your family'], ['Tue 13 October', 'Avoiding scam calls and messages'], ['Thu 15 October', 'Maps and train times'], ['Tue 20 October', 'Taking and sharing photos'], ['Thu 22 October', 'My Kumo: checking your bill and data'], ['Tue 27 October', 'Smartphone basics: calls, contacts and settings'], ['Thu 29 October', 'Paying with your phone']])}
<h2>Accessibility</h2>
<ul><li>Step-free access by lift from the station concourse; wheelchair-accessible counter (counter 1)</li><li>Hearing loop at counter 1; writing boards at every counter</li><li>Sign-language video interpreting on a tablet, weekdays 10:00–17:00</li><li>Magnifiers and reading glasses at every counter; assistance dogs welcome</li></ul>
<h2>Book an appointment</h2>
<p>Book up to 30 days ahead. See <a href="@/shops/appointments.html">how to book</a>.</p>`,
    related: ['shops/index.html', 'shops/appointments.html', 'forms/checklist.html'],
  },

  'shops/appointments.html': {
    title: 'Book an appointment', short: 'Book an appointment',
    lead: 'Book a time at a Kumo shop online or by phone. Booking is free.',
    body: `
<h2>How long each procedure takes</h2>
${table(['Procedure', 'Time to book', 'Note'], [
    ['New contract or switching to Kumo', '90 minutes', 'For 3 or more lines, book two slots in a row'],
    ['Device change (new phone)', '60 minutes', ''],
    ['Contract transfer or inheritance', '60 minutes', 'Both people should come'],
    ['eSIM setup or SIM reissue', '45 minutes', ''],
    ['Plan change, options, address change', '30 minutes', 'Free online in My Kumo'],
    ['Repair or Device Care claim', '30 minutes', 'Not at Hanaoka or the University counter'],
    ['Smartphone class', '60 minutes', 'Harukawa Central and Bayside Mall only'],
  ])}
<h2>Steps</h2>
${steps([
    ['Choose a shop', 'See <a href="@/shops/index.html">Find a shop</a>. Check that the shop offers the service you need.'],
    ['Choose the procedure', 'The booking time depends on the procedure (see the table above). One booking covers up to 2 lines of the same contract holder.'],
    ['Choose a date and time', 'You can book from 30 days ahead until 1 hour before the start time. Times are shown in 15-minute steps.'],
    ['Enter your details', 'Name, contact phone number and email. You do not need to be a Kumo customer.'],
    ['Receive your booking number', 'An SMS with your booking number arrives within a few minutes. Show it at the reception.'],
  ])}
<form class="book-form box" action="#" style="margin:0 0 18px">
<h3>Book online</h3>
<p><label>Shop<br><select name="shop">${SHOPS.map((s) => `<option>${s.en.name}</option>`).join('')}</select></label></p>
<p><label>Procedure<br><select name="proc"><option>New contract or switching to Kumo</option><option>Device change</option><option>Contract transfer or inheritance</option><option>eSIM setup or SIM reissue</option><option>Plan change, options, address change</option><option>Repair or Device Care claim</option><option>Smartphone class</option></select></label></p>
<p><label>Date<br><input type="date" name="date" min="2026-10-04" max="2026-11-03" value="2026-10-06"></label> <label>Time<br><select name="time"><option>10:00</option><option>10:15</option><option>10:30</option><option>11:00</option><option>13:00</option><option>14:30</option><option>16:00</option><option>17:30</option></select></label></p>
<p><button type="submit" class="btn">Check availability</button></p>
<p class="book-msg small" hidden>Online booking is temporarily unavailable. Please call ${TEL.shopBooking.free} (${hrs(TEL.shopBooking.hours)}).</p>
</form>
<h2>Changes and cancellations</h2>
<ul><li>Change or cancel using the link in your booking SMS, up to 1 hour before the start time.</li><li>If you are more than 15 minutes late, your booking may be cancelled and you may have to wait as a walk-in.</li><li>If you miss two bookings within 3 months without cancelling, online booking is unavailable for 30 days.</li></ul>
<h2>Book by phone</h2>
<p>Shop Booking Line: <b>${TEL.shopBooking.free}</b> (free), ${hrs(TEL.shopBooking.hours)} every day.</p>
${note('info', `<p>Bring everything you need: see the <a href="@/forms/checklist.html">What to bring checklist</a>. Shop procedures have a ${yen(FEE.adminShop)} admin fee where the online procedure is free.</p>`)}`,
    related: ['shops/index.html', 'shops/harukawa-central.html', 'forms/checklist.html'],
  },

  'contact.html': {
    title: 'Contact us', short: 'Contact us',
    lead: 'Phone numbers by purpose and their hours. Many questions are answered in our FAQ, and chat is available every day.',
    body: `
${table(['Purpose', 'Number', 'Hours', 'Notes'], [
    ['General questions, plans, procedures (Information Center)', `<span class="contact-num">${TEL.info.free}</span><br>From a Kumo phone: ${TEL.info.short}`, `Every day ${hrs(TEL.info.hours)}`, 'Free'],
    ['Lost or stolen phone', `<span class="contact-num">${TEL.lost.free}</span><br>From a Kumo phone: ${TEL.lost.short}`, '24 hours, every day', 'Free. From abroad: ' + TEL.lost.abroad + ' (charged)'],
    ['Technical support (settings, signal, eSIM)', `<span class="contact-num">${TEL.tech.free}</span>`, `Every day ${hrs(TEL.tech.hours)}`, 'Free'],
    ['Device Care claims and repairs', `<span class="contact-num">${TEL.care.free}</span>`, `Every day ${hrs(TEL.care.hours)}`, 'Free'],
    ['Bills and payments', `<span class="contact-num">${TEL.billing.navi}</span>`, `Weekdays ${hrs(TEL.billing.hours)}`, 'Navi Dial: charged at ¥11 per 20 seconds from mobiles; free call options do not apply'],
    ['English, Chinese, Korean, Vietnamese, Portuguese', `<span class="contact-num">${TEL.lang.free}</span>`, `Weekdays ${hrs(TEL.lang.hours)}`, 'Free'],
    ['Shop bookings', `<span class="contact-num">${TEL.shopBooking.free}</span>`, `Every day ${hrs(TEL.shopBooking.hours)}`, 'Free'],
  ])}
<ul class="kome"><li>Have your Kumo phone number and your 4-digit PIN ready. For your security, we cannot discuss a contract with anyone other than the contract holder without consent.</li><li>Lines are busiest on Mondays, from 12:00 to 14:00 and on the last day of the month.</li><li>Calls may be recorded to improve our service.</li></ul>
<h2>Chat</h2>
<div class="two"><div class="box"><h3>Chat with an assistant</h3><p>24 hours. Press the <b>Chat</b> button at the bottom right of any page.</p></div><div class="box"><h3>Chat with a person</h3><p>Every day 9:00–21:00. In the chat, type "agent". Available for contract holders logged in to My Kumo.</p></div></div>
<h2>Customers with hearing or speech disabilities</h2>
<p>Use chat, or call through the national telephone relay service. Sign-language video interpreting is available at <a href="@/shops/harukawa-central.html">Kumo Shop Harukawa Central</a> on weekdays.</p>
<h2>Visit a shop</h2>
<p><a href="@/shops/index.html">Find a shop</a> · <a href="@/shops/appointments.html">Book an appointment</a></p>`,
    related: ['faq.html', 'shops/index.html', 'status.html'],
  },
};
