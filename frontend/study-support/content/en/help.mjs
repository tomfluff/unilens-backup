// FAQ, My Kumo, forms, search (English)
import { PLAN, DISC, FEE, CARE, DATA, TEL, yen, table, note, faq } from '../shared.mjs';

const P = PLAN;
const CATS = [
  ['plans', 'Plans and prices', [
    ['What is the cheapest plan?', `<p>Kumo Mini at ${yen(P.mini.price)} a month (3 GB). For users aged 65 and over, Kumo 65+ (${yen(P.senior.price)}) includes 5 GB and free calls up to 10 minutes. Which plan is cheapest depends on how much data you use: see the <a href="@/plans/index.html#chart">price chart</a>.</p>`],
    ['Can I keep data I did not use?', '<p>On Kumo Basic, unused data (up to 20 GB) carries over to the next month only. On other plans it expires at the end of the month. <a href="@/plans/basic.html">Kumo Basic</a></p>'],
    ['What happens when I run out of data?', `<p>Your speed is limited (300 kbps on Kumo Mini and Kumo 65+, 1 Mbps on Kumo Basic) until the 1st of the next month. You can buy extra data: 1 GB ${yen(DATA.gb1)}, 5 GB ${yen(DATA.gb5)}. <a href="@/plans/options.html#data">Extra data</a></p>`],
    ['How does the Kumo Unlimited low-use discount work?', `<p>If you use 3 GB or less in a month, ${yen(P.unlimited.lowOff)} is taken off automatically. Tethering and roaming data count towards the 3 GB. <a href="@/plans/unlimited.html">Kumo Unlimited</a></p>`],
    ['Is there a minimum contract period or a cancellation fee?', '<p>No. All plans can be cancelled at any time with no cancellation fee, but the plan fee for the month you cancel is charged in full. <a href="@/procedures/cancel.html">Cancel your contract</a></p>'],
    ['Do prices include tax?', '<p>Yes. All prices include consumption tax (10%). The universal service fee (¥3) and telephone relay service fee (¥1) are added to each line every month.</p>'],
    ['Is Kumo Unlimited going up in price?', `<p>Yes. From 1 December 2026 it will be ${yen(P.unlimited.newPrice)} a month. <a href="@/news/price-revision-2026.html">Read the notice</a></p>`],
    ['Can someone under 65 use Kumo 65+?', '<p>The registered user must be 65 or over. The contract holder (who pays) can be younger, for example a son or daughter. <a href="@/plans/senior.html">Kumo 65+</a></p>'],
  ]],
  ['discounts', 'Discounts', [
    ['Who counts as family for the family discount?', `<p>Relatives within the third degree of kinship (including spouses and registered partners) and people living at the same address. Up to ${DISC.maxLines} lines. <a href="@/plans/index.html#family">Family discount</a></p>`],
    ['Does a Kumo Mini line get the family discount?', '<p>No, but it counts towards the number of lines in your group, so it can increase the discount on the other lines.</p>'],
    ['When does the family discount start?', '<p>With the bill for the month after the group is registered or a line joins. It is not applied to the month of registration.</p>'],
    ['Can I combine the family discount, the home internet bundle and the under-22 discount?', '<p>Yes. The under-22 discount is available only on Kumo Basic and Kumo Unlimited. <a href="@/plans/index.html">Compare plans</a></p>'],
    ['My child is turning 22. When does the under-22 discount end?', '<p>It applies up to and including the bill for the month in which the user turns 22. <a href="@/plans/index.html#u22">Under-22 discount</a></p>'],
    ['What happens to my family\'s discount if I cancel my line?', '<p>The other lines\' discount is recalculated from the next month. For example, if a group of 3 becomes 2, Kumo Basic lines go from ¥1,100 off to ¥550 off. <a href="@/procedures/cancel.html">Cancel your contract</a></p>'],
  ]],
  ['joining', 'Switching and new contracts', [
    ['How long does switching to Kumo take?', '<p>Online: the SIM arrives in 2–4 days and the switch itself takes about 15 minutes (9:00–20:00). eSIM can be the same day. At a shop: about 90 minutes. <a href="@/procedures/switch-to-kumo.html">Switch to Kumo</a></p>'],
    ['My MNP reservation number expires in 6 days. Can I still apply?', '<p>Not online (at least 10 days must remain), but you can at a shop (at least 5 days must remain). Or get a new number from your current carrier.</p>'],
    ['My phone contract is in my parent\'s name. Can I switch to Kumo in my own name?', '<p>Yes, in three ways: change the holder at your current carrier first, switch in your parent\'s name and transfer at Kumo, or switch with a change of holder at a shop (with form K-12). <a href="@/procedures/switch-to-kumo.html#other-name">Details and what to bring</a></p>'],
    ['Can a 15-year-old have a contract in their own name?', '<p>Yes, at a shop, with parental consent form K-05; the parent must come with their ID. Under 12, the contract must be in the parent\'s name. <a href="@/procedures/new-contract.html#minors">Contracts for minors</a></p>'],
    ['Which ID documents are accepted?', '<p>My Number card, driver\'s licence, residence card, disability certificates and more. A passport needs a supplementary document. <a href="@/procedures/new-contract.html#id">Accepted ID documents</a></p>'],
    ['Can I use my health insurance card as ID?', '<p>No. Old-style health insurance cards are no longer accepted since 1 July 2026. A health insurance eligibility certificate is accepted with a supplementary document.</p>'],
    ['Can I apply online at any time?', '<p>Applications in My Kumo are accepted from 9:00 to 21:00 every day.</p>'],
  ]],
  ['sim', 'eSIM and SIM cards', [
    ['How do I move my eSIM to a new phone?', '<p>Use eSIM Quick Transfer (iPhone) or quick transfer (Android 14 or later on selected models). Otherwise reissue your eSIM in My Kumo for free. <a href="@/procedures/esim.html">eSIM setup</a></p>'],
    ['I deleted my eSIM by mistake.', `<p>Reissue it in My Kumo (free, 9:00–21:00) or at a shop (${yen(FEE.esimReissueShop)}).</p>`],
    ['What size is the Kumo SIM card?', '<p>Nano SIM. Do not use adapters or cut cards. <a href="@/procedures/sim-card.html">Insert a SIM card</a></p>'],
    ['I have no signal after inserting the SIM.', '<p>Restart the phone, check airplane mode and the APN (kumo.jp). If you switched from another carrier, check that you pressed "Switch my line" in My Kumo. <a href="@/procedures/sim-card.html">Troubleshooting</a></p>'],
    ['The eSIM QR code does not work.', '<p>The code is valid for 30 days and can be used once. Connect to Wi-Fi first. If it has expired or was used, reissue the eSIM in My Kumo.</p>'],
  ]],
  ['billing', 'Bills and payment', [
    ['When is my bill paid?', '<p>On the 26th of the month after the usage month (next business day if the 26th is a weekend or bank holiday). Card payments follow your card company\'s schedule. <a href="@/billing/index.html">Billing dates</a></p>'],
    ['Why is my first bill different from the plan price?', `<p>In the first month, the plan fee is charged by the day, and a shop admin fee (${yen(FEE.adminShop)}) may be included.</p>`],
    ['How do I stop paying the paper bill fee?', `<p>Switch to the web bill in My Kumo. The ${yen(FEE.paperBill)} fee is not charged for Kumo 65+ or for disability certificate holders.</p>`],
    ['I changed my payment method. When does it apply?', '<p>Changes made by the 20th apply to that month\'s charge; changes after the 20th apply from the next month.</p>'],
    ['What happens if I pay late?', `<p>A late payment charge of ${FEE.lateRate} a year is added, and if the bill is unpaid ${FEE.lateSuspendDays} days after the payment slip's due date the line is suspended. <a href="@/billing/index.html#late">Late payments</a></p>`],
    ['What are the universal service fee and telephone relay service fee?', '<p>Fees charged by all carriers in Japan (¥3 and ¥1 a month per line) to fund basic telephone services. <a href="@/billing/read-your-bill.html">How to read your bill</a></p>'],
    ['Can I pay at a convenience store?', `<p>Yes, with a payment slip (${yen(FEE.slip)} per slip).</p>`],
  ]],
  ['trouble', 'Lost phones and repairs', [
    ['My phone was stolen. What should I do first?', `<p>Suspend your line: in My Kumo from another device, or call ${TEL.lost.free} (24 hours). Then report to the police. <a href="@/procedures/lost-phone.html">Lost or stolen phone</a></p>`],
    ['Do I still pay my plan while my line is suspended?', '<p>Yes. The plan fee and options continue; no call or data charges are made.</p>'],
    ['I found my phone. How do I resume my line?', '<p>If you suspended it in My Kumo, resume it there. If you suspended it by phone, you cannot resume online: call the Lost and Stolen line again or visit a shop with your ID.</p>'],
    ['How much does a screen repair cost?', `<p>With Device Care: ${yen(CARE[0].repair)} (Light), ${yen(CARE[1].repair)} (Standard), ${yen(0)} for the first claim on Premium. Without Device Care: ${yen(FEE.screenFrom)}–${yen(FEE.screenTo)}. <a href="@/procedures/repair.html">Repair and replacement</a></p>`],
    ['Can I join Device Care for a phone I bought elsewhere?', '<p>Yes, Light or Standard, within 14 days of activation after a free inspection at a Kumo shop. <a href="@/plans/options.html#care">Device Care</a></p>'],
  ]],
  ['changes', 'Changes and cancellation', [
    ['If I cancel on the 10th, am I charged for the whole month?', '<p>Yes. The plan fee and options for the month of cancellation are charged in full. <a href="@/procedures/cancel.html">Cancel your contract</a></p>'],
    ['Do I get a refund for unused data when I cancel?', '<p>No. Unused data, extra data and roaming passes are not refunded.</p>'],
    ['How do I transfer my contract to my child?', `<p>At a shop, with form K-15 and both IDs. The fee is ${yen(FEE.transfer)}, paid by the new holder. <a href="@/procedures/transfer.html">Transfer a contract</a></p>`],
    ['When does a plan change take effect?', '<p>From the 1st of the next month. When moving to a larger plan you can choose "Start today" until the 25th. <a href="@/procedures/change-plan.html">Change your plan</a></p>'],
    ['Can I change my plan more than once a month?', '<p>Only one change applies per month: the last request made before the deadline.</p>'],
  ]],
  ['network', 'Network and travel', [
    ['Is there 5G in Tsukimi Onsen?', '<p>Mostly 4G at present (5G population coverage in Tsukimi Town is 61.2%). 5G along the Kagami Line towards Tsukimi Onsen is planned by March 2027. <a href="@/network.html">Coverage and 5G</a></p>'],
    ['Will my old phone work after 3G ends?', '<p>3G-only phones and 4G phones without VoLTE will not be able to make calls after 31 March 2027. <a href="@/news/3g-service-end.html">3G service end</a></p>'],
    ['How much does data cost abroad?', '<p>A 24-hour Kumo World pass costs from ¥980 (Asia). Kumo Unlimited includes 2 GB a month free in Asia and North America. <a href="@/plans/roaming.html">International roaming</a></p>'],
    ['Is there a limit on roaming charges on a cruise ship?', '<p>No. On ships and aircraft there is no daily cap on pay-as-you-go data. Turn off data roaming on board.</p>'],
    ['5G is slow near Harukawa Central Station today. Is there a problem?', '<p>Yes, an incident affecting 5G data around Harukawa Central Station is being investigated. <a href="@/status.html">Service status</a></p>'],
  ]],
  ['account', 'My Kumo and shops', [
    ['I forgot my My Kumo password.', '<p>Press "Forgot password" on the login screen and enter the code sent by SMS to your Kumo phone. If your phone is lost, visit a shop with your ID. <a href="@/my-kumo.html">About My Kumo</a></p>'],
    ['Do I need an appointment at a shop?', '<p>No, but without one you may wait 60–90 minutes on weekend afternoons. <a href="@/shops/appointments.html">Book an appointment</a></p>'],
    ['Is the Harukawa Central shop open during the Lantern Festival?', '<p>Yes, until 21:00 on 10 and 11 October 2026. <a href="@/shops/harukawa-central.html">Kumo Shop Harukawa Central</a></p>'],
  ]],
];
export const FAQ_COUNT = CATS.reduce((n, c) => n + c[2].length, 0);

export const pages = {
  'faq.html': {
    title: 'Frequently asked questions', short: 'FAQ',
    lead: `${FAQ_COUNT} answers to the questions customers ask most often. Can't find your answer? <a href="@/contact.html">Contact us</a>.`,
    body: `<ul class="faq-cats">${CATS.map(([id, t, q]) => `<li><a href="#${id}">${t} (${q.length})</a></li>`).join('')}</ul>` + CATS.map(([id, t, qs]) => `<h2 id="${id}">${t}</h2>${faq(qs)}`).join(''),
    related: ['contact.html', 'procedures/index.html', 'my-kumo.html'],
  },

  'my-kumo.html': {
    title: 'About My Kumo', short: 'About My Kumo',
    lead: 'My Kumo is your online account, on the web and in the My Kumo app. Most procedures are free online and need no visit to a shop.',
    body: `
${note('info', '<p>Log in with your Kumo ID (your Kumo phone number or email address) and password. A one-time code is sent by SMS. After 5 wrong passwords, login is locked for 30 minutes.</p>', 'Logging in')}
<h2>What you can do online</h2>
${table(['Procedure', 'My Kumo', 'Hours online', 'At a shop'], [
    ['View bills and data usage', 'Yes', '24 hours', 'Yes'],
    ['Buy extra data or a roaming pass', 'Yes', '24 hours', 'Yes'],
    ['Suspend a lost or stolen phone', 'Yes', '24 hours', 'Yes'],
    ['Change address, email or password', 'Yes', '24 hours', 'Yes'],
    ['Change plan', 'Yes', '9:00–21:00', `Yes (${yen(0)})`],
    ['Add or remove options', 'Yes', '9:00–21:00', 'Yes'],
    ['Register a family group', 'Yes (representative only)', '9:00–21:00', 'Yes'],
    ['Change payment method', 'Yes', '9:00–21:00', 'Yes'],
    ['New contract / switch to Kumo', `Yes (${yen(FEE.adminOnline)})`, '9:00–21:00', `Yes (${yen(FEE.adminShop)})`],
    ['eSIM reissue', `Yes (${yen(0)})`, '9:00–21:00', `Yes (${yen(FEE.esimReissueShop)})`],
    ['Get an MNP reservation number (to leave Kumo)', 'Yes', '9:00–21:00', 'Yes'],
    ['Cancel your contract', 'Yes', '9:00–21:00', 'Yes'],
    ['Name change', 'With My Number card only', '9:00–21:00', 'Yes'],
    ['Contract transfer, inheritance, number change', 'No', '—', 'Yes'],
  ])}
<p class="small">My Kumo is unavailable during maintenance. Next: Thursday 8 October 2026, 01:00–06:00. <a href="@/status.html#maintenance">Service status</a></p>
<h2>The My Kumo app</h2>
<p>Available for iPhone and Android. Shows your remaining data on the home screen and sends usage alerts. Some Android users cannot log in to version 8.4.0 (since 3 October 2026); please use the web version until the fix is released.</p>
<h2>Who can use My Kumo</h2>
<ul><li>The contract holder has full access.</li><li>The registered user of a line (for example, a child) can view data usage and buy extra data, but cannot change the contract.</li><li>The representative of a family group can see all lines in the group.</li></ul>`,
    related: ['procedures/index.html', 'faq.html', 'status.html'],
  },

  'forms/index.html': {
    title: 'Forms and downloads', short: 'Forms and downloads',
    lead: 'Forms for procedures at shops and by post, checklists and contract documents.',
    body: `
<h2>Forms</h2>
${table(['Form', 'Name', 'When you need it', 'Where to get it'], [
    ['K-05', 'Parental consent form', 'Contract in the name of a 12 to 17 year-old', 'Shops; or ask the Information Center to post it'],
    ['K-07', 'Power of attorney', 'Someone else does a procedure for the contract holder', 'Shops; by post'],
    ['K-12', 'Consent to switch with change of contract holder', 'Switching to Kumo when the contract holder changes at the same time', 'Shops; by post'],
    ['K-15', 'Application for transfer of contract', 'Transferring a contract to a family member', 'Filled in at the shop'],
    ['K-18', 'Inheritance application', 'The contract holder has died', 'Filled in at the shop'],
    ['K-21', 'Paper bill fee exemption', 'Disability certificate holders who want a paper bill', 'Filled in at the shop'],
    ['K-30', 'Device Care claim form (by post)', 'Claiming by post instead of online', 'By post from Device Care'],
    ['K-33', 'Cancellation by proxy', 'Someone else cancels for the contract holder', 'Shops; by post'],
    ['K-40', 'Bank account transfer application', 'Paying by bank account when online registration is not possible', 'Shops; by post'],
  ])}
<p class="small">Forms are sent by post free of charge in 3 to 5 days: call the Information Center (${TEL.info.free}). Forms must be signed in ink; photocopies of signed forms are not accepted.</p>
<h2>Checklists</h2>
<ul><li><a href="@/forms/checklist.html">What to bring checklist</a>: everything to bring for each procedure at a shop (printable)</li></ul>
<h2>Contract documents</h2>
${table(['Document', 'Version', 'Format'], [
    ['Kumo Mobile Service Terms', '1 October 2026', 'PDF, 1.4 MB (available at shops)'],
    ['Important matters explanation (plans)', '1 October 2026', 'PDF, 620 KB (available at shops)'],
    ['Kumo Device Care Terms', '1 April 2026', 'PDF, 480 KB (available at shops)'],
    ['Kumo World (roaming) Terms', '1 December 2026 (new prices)', 'PDF, 350 KB (available at shops)'],
    ['Privacy Policy', '1 June 2026', 'PDF, 290 KB (available at shops)'],
  ])}`,
    related: ['forms/checklist.html', 'procedures/index.html', 'shops/appointments.html'],
  },

  'forms/checklist.html': {
    title: 'What to bring checklist', short: 'What to bring checklist',
    lead: 'Everything to bring to a Kumo shop, by procedure. Print this page and tick each item.',
    body: `
<p><button type="button" class="btn btn-o" onclick="window.print()">Print this page</button></p>
<h2>New contract</h2>
<ul class="checklist"><li>ID document (<a href="@/procedures/new-contract.html#id">accepted documents</a>); with a supplementary document if needed</li><li>Bank cash card or credit card in the contract holder's name</li><li>Your phone, if you will use your own</li></ul>
<h2>Switching to Kumo (keeping your number)</h2>
<ul class="checklist"><li>ID document</li><li>MNP reservation number with at least 5 days remaining (unless you use One-Stop)</li><li>Bank cash card or credit card</li><li>Your phone and its passcode</li></ul>
<h2>Switching with a change of contract holder (e.g. from a parent's name)</h2>
<ul class="checklist"><li>Your ID document</li><li>The current holder's ID document (original, or a copy with their signed form K-12)</li><li>Form K-12</li><li>Family register or certificate of residence issued within 3 months (if surname or address differs)</li><li>MNP reservation number obtained by the current holder</li><li>Your bank cash card or credit card</li></ul>
<h2>Contract for a child aged 12 to 17</h2>
<ul class="checklist"><li>The child's ID document</li><li>The parent's ID document (the parent comes too)</li><li>Signed parental consent form K-05</li><li>Document showing the relationship if surnames differ</li></ul>
<h2>Transfer to a family member</h2>
<ul class="checklist"><li>ID documents of both people</li><li>Form K-15 (or K-07 and the current holder's original ID if they cannot come)</li><li>Relationship document if surnames or addresses differ</li><li>The new holder's payment card</li><li>${yen(FEE.transfer)} admin fee (charged to the new holder's first bill)</li></ul>
<h2>Inheritance</h2>
<ul class="checklist"><li>The heir's ID document</li><li>Death certificate or family register showing the death</li><li>Form K-18 (filled in at the shop)</li></ul>
<h2>Repair or Device Care claim</h2>
<ul class="checklist"><li>The phone (backed up, Find My turned off, case and SIM removed)</li><li>ID document</li><li>Police receipt number (loss or theft claims)</li></ul>
<h2>Cancellation</h2>
<ul class="checklist"><li>Contract holder's ID document (or form K-33 and both IDs for a proxy)</li><li>Loaner phones or rental equipment to return</li></ul>`,
    related: ['forms/index.html', 'shops/appointments.html', 'procedures/switch-to-kumo.html'],
  },

  'search.html': {
    title: 'Search', short: 'Search', side: false,
    body: `<form action="@/search.html" class="home-search" style="background:#eef5fc;color:inherit"><label for="q2"><b>Search Kumo Support</b></label><div style="display:flex;gap:8px;margin-top:8px"><input id="q2" type="search" name="q" style="border:1px solid #c9d1d9"><button class="btn" type="submit">Search</button></div></form>
<p id="results-info" class="small"></p><ul id="results" class="results"></ul>`,
  },
};
