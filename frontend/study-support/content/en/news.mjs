// Notices (English)
import { PLAN, ROAM, FEE, TEL, yen, table, note, smsMock } from '../shared.mjs';

const U = PLAN.unlimited, ASIA = ROAM[0];
export const NEWS = [
  ['2026-10-02', '2 Oct 2026', 'Prices', 'tag-org', 'Revision of prices for Kumo Unlimited and Kumo World (from 1 December 2026)', 'news/price-revision-2026.html'],
  ['2026-09-29', '29 Sep 2026', 'Maintenance', 'tag-gry', 'Network and My Kumo maintenance in October 2026', 'news/maintenance-october-2026.html'],
  ['2026-09-24', '24 Sep 2026', 'Important', 'tag-red', 'Beware of scam text messages pretending to be Kumo Mobile', 'news/scam-sms-warning.html'],
  ['2026-09-15', '15 Sep 2026', 'Important', 'tag-red', 'Kumo 3G service will end on 31 March 2027', 'news/3g-service-end.html'],
  ['2026-09-10', '10 Sep 2026', 'Shops', '', 'Kumo Shop Springvale Central open until 21:00 during the Springvale Lantern Festival (10–11 October)', 'shops/harukawa-central.html'],
  ['2026-09-01', '1 Sep 2026', 'Services', 'tag-grn', 'Watch Service now included free with Kumo 65+', 'plans/senior.html'],
  ['2026-08-20', '20 Aug 2026', 'Services', 'tag-grn', 'eSIM quick transfer now available between Android phones', 'procedures/esim.html'],
  ['2026-07-30', '30 Jul 2026', 'Network', '', '5G now available in Mikage City and along part of the Mirror Line', 'network.html'],
  ['2026-07-01', '1 Jul 2026', 'Prices', 'tag-org', 'Under-22 discount: application period extended to 31 March 2027', 'plans/index.html#u22'],
  ['2026-06-10', '10 Jun 2026', 'Procedures', '', 'Old-style health insurance cards no longer accepted as ID from 1 July 2026', 'procedures/new-contract.html#id'],
  ['2026-05-20', '20 May 2026', 'Shops', '', 'Kumo Shop Moonview Spa: new closing days (Tuesdays and Wednesdays) from 1 June 2026', 'shops/index.html#tsukimi'],
];
export const newsList = (items) => `<ul class="news-list">${items.map(([iso, d, cat, cls, t, href]) => `<li><time datetime="${iso}">${d}</time><span class="tag ${cls}">${cat}</span><a href="@/${href}">${t}</a></li>`).join('')}</ul>`;
const back = '<p style="margin-top:24px"><a href="@/news/index.html">‹ Back to all notices</a></p>';

export const pages = {
  'news/index.html': {
    title: 'Notices', short: 'Notices',
    lead: 'Announcements about prices, services, maintenance and safety.',
    body: newsList(NEWS) + `<p class="small" style="margin-top:12px">For current network problems, see <a href="@/status.html">Service status</a>.</p>`,
    related: ['status.html', 'faq.html'],
  },

  'news/price-revision-2026.html': {
    title: 'Revision of prices for Kumo Unlimited and Kumo World (from 1 December 2026)', short: 'Price revision (December 2026)',
    updated: 'Published 2 October 2026',
    body: `
<p>Thank you for using Kumo Mobile. To continue investing in our 5G network as costs rise, we will revise the prices of Kumo Unlimited and the Kumo World Asia day pass from 1 December 2026.</p>
<h2>What changes</h2>
${table(['Item', 'Now', 'From 1 December 2026', 'Change'], [
    ['Kumo Unlimited (monthly)', yen(U.price), yen(U.newPrice), `+${yen(U.newPrice - U.price)}`],
    ['Kumo Unlimited in a month of 3 GB or less', yen(U.price - U.lowOff), yen(U.newPrice - U.lowOff), `+${yen(U.newPrice - U.price)}`],
    ['Kumo World day pass: Asia', yen(ASIA.pass), yen(ASIA.newPass), `+${yen(ASIA.newPass - ASIA.pass)}`],
  ])}
<p><b>No change:</b> Kumo Mini, Kumo Basic, Kumo 65+, day passes for other zones, call options, Device Care and all discounts (the low-use discount on Kumo Unlimited stays at ${yen(U.lowOff)}).</p>
<h2>Who is affected</h2>
<ul><li>All Kumo Unlimited customers, including existing contracts, from <b>December 2026 usage</b> (the bill paid in January 2027).</li><li>Asia day passes bought until 30 November 2026 at ${yen(ASIA.pass)} can be used until 31 January 2027.</li><li>We will tell affected customers by SMS and email during October 2026.</li></ul>
<h2>If you want to change plan</h2>
<p>Plan changes are free, and there is no cancellation fee. If you use less than about 25 GB a month, <a href="@/plans/basic.html">Kumo Basic</a> may cost less: compare in the <a href="@/plans/index.html#chart">price chart</a>. A change made by 30 November applies from 1 December. See <a href="@/procedures/change-plan.html">Change your plan</a>.</p>
${back}`,
    related: ['plans/unlimited.html', 'plans/roaming.html', 'procedures/change-plan.html'],
  },

  'news/maintenance-october-2026.html': {
    title: 'Network and My Kumo maintenance in October 2026', short: 'Maintenance (October 2026)',
    updated: 'Published 29 September 2026',
    body: `
<p>We will carry out the following maintenance. We apologise for any inconvenience.</p>
${table(['Date and time', 'Area', 'Services affected'], [
    ['Thu 8 Oct 2026, 01:00–06:00', 'All areas', 'My Kumo (web and app): all online procedures'],
    ['Wed 14 Oct 2026, 01:00–05:00', 'Moonview Town and Shiose Village (Harvest Prefecture)', 'Calls, SMS and data; breaks of up to 10 minutes'],
    ['Wed 21 Oct 2026, 02:00–04:00', 'All areas', 'SMS may be delayed'],
    ['Tue 27 Oct 2026, 00:30–05:30', 'Along the Mirror Line, Springvale City to Moonview Town', '5G data may switch to 4G'],
  ])}
<h2>During My Kumo maintenance (8 October)</h2>
<ul><li>You cannot suspend a lost phone online: call the Lost and Stolen line, ${TEL.lost.free} (24 hours).</li><li>Data purchases, plan changes and bill viewing are unavailable. Plan change requests are not affected otherwise: the deadline is still the last day of the month.</li><li>Calls and data on your phone work normally.</li></ul>
<h2>During network work in Moonview Town and Shiose Village (14 October)</h2>
${note('alert', '<p>During each break of up to 10 minutes, <b>emergency calls (110, 118, 119) may also be unavailable</b>. If you need to call in an emergency, try again after a few minutes or use a landline.</p>')}
<p>Guests staying in Moonview Spa may also be affected. Wi-Fi calling works if your phone is connected to Wi-Fi.</p>
<p>The latest information is on <a href="@/status.html#maintenance">Service status</a>.</p>
${back}`,
    related: ['status.html', 'procedures/lost-phone.html', 'network.html'],
  },

  'news/scam-sms-warning.html': {
    title: 'Beware of scam text messages pretending to be Kumo Mobile', short: 'Scam SMS warning',
    updated: 'Published 24 September 2026',
    body: `
<p>Fake text messages (SMS) that pretend to come from Kumo Mobile are increasing. In September 2026 we received 3,412 reports from customers, 40% more than in August. The messages lead to fake websites that steal your Kumo ID, password and card details.</p>
<h2>Examples of scam messages</h2>
<div class="sms-row">
${smsMock('Kumo Mobile', 'Today 9:41', '[Kumo Mobile] Your payment could not be confirmed. Your line will be suspended today. Pay now: https://kumo-mobl-pay.com/u8x')}
${smsMock('+81 80-XXXX-2231', 'Yesterday 18:02', 'Your Kumo account has been locked because of unusual activity. Verify your password within 24 hours: https://my-kumo-secure.net')}
${smsMock('KUMO', 'Mon 12:15', 'We tried to deliver your new SIM card but nobody was home. Arrange redelivery: https://kumo-sim-delivery.info')}
</div>
<p class="small">These are real examples reported to us, with links altered. Do not visit these addresses.</p>
<h2>Kumo will never</h2>
<ul><li>ask for your password, PIN or card number by SMS or email</li><li>suspend your line by SMS on the same day without first sending a payment slip (see <a href="@/billing/index.html#late">late payments</a>)</li><li>ask you to install an app from a link in a message</li></ul>
<p>Fake messages can appear in the same conversation as real messages from Kumo, because senders can fake the sender name. Always open My Kumo from a bookmark or the official app, not from a link.</p>
<h2>If you entered your details</h2>
<ol><li>Change your Kumo ID password in My Kumo straight away.</li><li>If you entered card details, call your card company to stop the card.</li><li>Call Technical Support (${TEL.tech.free}) to check for unknown purchases or SIM reissues on your line.</li><li>For advice, contact the police consultation line (#9110).</li></ol>
${note('ok', '<p><a href="@/plans/options.html#other">Security Pack</a> (¥440/month, first 31 days free) filters most known scam messages and warns you about scam calls. Learn more at our free smartphone class on 13 October at <a href="@/shops/harukawa-central.html">Kumo Shop Springvale Central</a>.</p>', 'Protect yourself')}
${back}`,
    related: ['plans/options.html', 'faq.html', 'contact.html'],
  },

  'news/3g-service-end.html': {
    title: 'Kumo 3G service will end on 31 March 2027', short: '3G service ends',
    updated: 'Published 15 September 2026',
    body: `
<p>Kumo's 3G network will close at the end of <b>31 March 2027</b>, so that we can use the radio frequencies for 4G and 5G. About 41,000 customers still use phones that need 3G (September 2026).</p>
<h2>Who is affected</h2>
${table(['Device', 'After 31 March 2027'], [
    ['3G-only phones (mainly feature phones sold until 2016)', 'Cannot make calls, send SMS or use data'],
    ['4G phones without VoLTE (4G voice)', 'Data works, but voice calls cannot be made or received'],
    ['Other devices using 3G (some alarm and watch devices, older tablets)', 'Stop working'],
    ['4G phones with VoLTE and all 5G phones', 'Not affected'],
  ])}
<p>Check your phone in My Kumo (Contract → Device → 3G check) or call the Information Center (${TEL.info.free}). Customers with an affected device receive a letter in October 2026 and a reminder in January 2027.</p>
<h2>Free replacement offer</h2>
<ul><li>Customers using an affected device can change to a designated 4G phone (Kumo Simple Phone K2) or a designated smartphone for ${yen(0)}.</li><li>The shop admin fee (${yen(FEE.adminShop)}) is waived for the device change until 31 March 2027.</li><li>You can keep your phone number and email address.</li></ul>
<h2>Timeline</h2>
${table(['Date', 'What happens'], [['October 2026', 'Letters to affected customers'], ['January 2027', 'Reminder letters and SMS'], ['31 March 2027', '3G service ends at midnight; replacement offer ends'], ['1 April 2027', 'Lines still on 3G-era plans are changed to Kumo Mini (or Kumo 65+ if the registered user is 65 or over)']])}
${note('warn', '<p>If you take no action, your contract will continue and the plan fee will be charged from April 2027, even though a 3G-only phone will no longer work.</p>')}
<p>Help with changing phones is available at all Kumo shops. <a href="@/shops/appointments.html">Book an appointment</a>.</p>
${back}`,
    related: ['network.html', 'plans/senior.html', 'shops/index.html'],
  },
};
