// Procedures section (English)
import { PLAN, DISC, FEE, CALL, CARE, TEL, USAGE, MONTHS, COLORS, SHOPS, yen, table, steps, note, tabs, cards, figure, flow, simDiagram, lineChart } from '../shared.mjs';

const kome = (items) => `<ul class="kome">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const NAME = { mini: 'Kumo Mini', basic: 'Kumo Basic', unlimited: 'Kumo Unlimited', senior: 'Kumo 65+' };

const usageChart = lineChart({
  title: 'Average data use per line (GB per month)',
  series: ['unlimited', 'basic', 'senior', 'mini'].map((k) => ({ name: NAME[k], color: COLORS[k], pts: USAGE[k].map((v, i) => [i, v]) })),
  xMax: 11, xTicks: [...Array(12).keys()], xFmt: (i) => MONTHS.en[i], yMax: 50, yStep: 10, yFmt: (v) => `${v} GB`,
  xTitle: 'October 2025 – September 2026',
});

export const pages = {
  'procedures/index.html': {
    title: 'Procedures', short: 'Procedures',
    lead: 'Step-by-step guides for joining Kumo, managing your line and solving problems. Many procedures can be done online in My Kumo, with no admin fee.',
    body: `
<h2>Joining Kumo</h2>
${cards([['@/procedures/switch-to-kumo.html', 'Switch to Kumo and keep your number', 'Number portability: steps, what to bring, timing and fees', 'switch'], ['@/procedures/new-contract.html', 'New contract', 'Accepted ID documents, who can sign up, minors', 'user'], ['@/procedures/esim.html', 'Set up eSIM', 'iPhone and Android', 'esim'], ['@/procedures/sim-card.html', 'Insert a SIM card', 'With a diagram', 'sim']])}
<h2>Using your line</h2>
${cards([['@/procedures/change-plan.html', 'Change your plan', 'When the new plan starts, mid-month rules', 'plan'], ['@/procedures/data-usage.html', 'Check your data usage', 'My Kumo, SMS and notifications', 'data'], ['@/procedures/change-details.html', 'Change name or address', 'After moving or marriage', 'doc']])}
<h2>Trouble</h2>
${cards([['@/procedures/lost-phone.html', 'Lost or stolen phone', 'Suspend your line now (24 hours)', 'lost'], ['@/procedures/repair.html', 'Repair and replacement', 'Device Care claims, repairs at shops', 'repair']])}
<h2>Changing or ending your contract</h2>
${cards([['@/procedures/transfer.html', 'Transfer a contract to a family member', 'Change of contract holder, inheritance', 'family'], ['@/procedures/cancel.html', 'Cancel your contract', 'Fees, timing and refunds', 'cancel']])}
${note('info', `<p>Before visiting a shop, check the <a href="@/forms/checklist.html">What to bring checklist</a> and <a href="@/shops/appointments.html">book an appointment</a> to avoid waiting. Procedures at a shop have a ${yen(FEE.adminShop)} admin fee where the same procedure online is free.</p>`, 'Visiting a shop?')}
<p>Which procedures can be done online? See <a href="@/my-kumo.html">About My Kumo</a>.</p>`,
    related: ['my-kumo.html', 'forms/index.html', 'faq.html'],
  },

  'procedures/switch-to-kumo.html': {
    title: 'Switch to Kumo and keep your number', short: 'Switch to Kumo',
    lead: 'Bring your phone number from another carrier (mobile number portability, MNP). Apply online for free, or at a shop.',
    body: `
${figure(flow(['Check One-Stop\nor get an MNP\nreservation number', 'Apply online\nor at a shop', 'Receive SIM card\nor download eSIM', 'Switch your line\n(about 15 minutes)', 'Old contract ends\nautomatically'], { bw: 132 }), 'How switching works')}
${note('alert', '<p>Do not cancel your current contract before you switch. If you cancel first, your phone number is lost and cannot be brought to Kumo.</p>', 'Important')}
<h2>Two ways to switch</h2>
<div class="two"><div class="box"><h3>MNP One-Stop</h3><p>If your current carrier takes part in MNP One-Stop (most major carriers and their sub-brands do), you do not need a reservation number. You log in to your current carrier during the Kumo application to confirm the switch.</p><p class="small">Cannot be used when the contract holder changes at the same time, or for corporate contracts.</p></div>
<div class="box"><h3>MNP reservation number</h3><p>Get a 10-digit MNP reservation number from your current carrier (online or by phone). It is valid for <b>15 days</b> including the day it is issued.</p><p class="small">To apply online, at least 10 days must remain. At a shop, at least 5 days must remain.</p></div></div>
<h2>Steps</h2>
${steps([
    ['Check your phone works with Kumo', 'Most phones sold in Japan since 2021 are SIM-unlocked and work on Kumo. Check the model in the device list in My Kumo. If your phone is locked, ask your current carrier to unlock it (usually free online).'],
    ['Check One-Stop, or get an MNP reservation number', 'If you are using a reservation number, note the number and its expiry date.'],
    ['Apply', `<b>Online:</b> apply in My Kumo between 9:00 and 21:00. Admin fee ${yen(FEE.adminOnline)}. You need an ID document that can be read online (My Number card or driver's licence).<br><b>At a shop:</b> admin fee ${yen(FEE.adminShop)}. Allow about 90 minutes. <a href="@/shops/appointments.html">Book an appointment</a>.`],
    ['Receive your SIM card or eSIM', 'SIM cards are delivered in 2 to 4 days (Tsukimi Town and Shiose Village: add 1 day). For eSIM, the setup screen appears in My Kumo when your application is approved, usually within 1 hour.'],
    ['Switch your line', 'In My Kumo, press "Switch my line". Between 9:00 and 20:00 the switch finishes in about 15 minutes. If you press it after 20:00, it is completed after 9:00 the next morning. During the switch you cannot make calls with either carrier. At a shop, staff switch the line for you.'],
    ['Set up your phone and make a test call', 'Insert the SIM card (<a href="@/procedures/sim-card.html">how to</a>) or set up the eSIM (<a href="@/procedures/esim.html">how to</a>). Call 111 (free test number) to check.'],
  ])}
<h2 id="bring">What to bring to a shop</h2>
<ul class="checklist">
<li>An ID document of the new contract holder (<a href="@/procedures/new-contract.html#id">accepted documents</a>)</li>
<li>Your MNP reservation number (unless you use One-Stop)</li>
<li>A bank cash card or credit card in the contract holder's name for monthly payment</li>
<li>Your phone, if you keep using it, with its passcode</li>
<li>Under 18: parental consent form (K-05) and the parent's ID. See <a href="@/procedures/new-contract.html#minors">contracts for minors</a></li>
</ul>
<h2 id="other-name">If the current contract is in someone else's name</h2>
<p>For example, your phone is in a parent's name and you want the Kumo contract in your own name. The name at Kumo must normally match the name of the current contract. You can choose:</p>
<ol>
<li><b>Change the contract holder at your current carrier first,</b> then switch to Kumo in your own name.</li>
<li><b>Switch in your parent's name,</b> then transfer the contract to yourself at Kumo (${yen(FEE.transfer)}). See <a href="@/procedures/transfer.html">Transfer a contract</a>.</li>
<li><b>Switch with a change of holder</b> (shop only, family members only). Bring all of the following:
<ul>
<li>Your ID document (you become the new contract holder)</li>
<li>The current contract holder's ID document. If they cannot come with you, a copy of it and form K-12 signed by them</li>
<li>Form K-12 "Consent to switch with change of contract holder"</li>
<li>If your surname or address is different from theirs, a family register or certificate of residence issued within the last 3 months</li>
<li>The MNP reservation number, obtained by the current contract holder (One-Stop cannot be used)</li>
</ul></li>
</ol>
<p class="small">Option 3 is not available online. The admin fee is ${yen(FEE.adminShop)}; there is no separate transfer fee. Forms: <a href="@/forms/index.html">Forms and downloads</a>.</p>
<h2 id="fees">Fees and timing</h2>
${table(['Item', 'Online', 'At a shop'], [
    ['Kumo admin fee', yen(FEE.adminOnline), yen(FEE.adminShop)],
    ['Port-out fee at your current carrier', 'Usually ¥0 (check with your carrier)', 'Usually ¥0'],
    ['Kumo plan fee in your first month', 'Charged by the day from the switch date', 'Charged by the day from the switch date'],
    ['Time needed', 'Delivery 2–4 days + 15-minute switch', 'About 90 minutes'],
  ])}
${kome(['Your current carrier may charge its last month in full. Remaining device instalments at your current carrier continue to be billed by them.', 'Email addresses and points from your current carrier usually end when you switch.', 'If your reservation number expires before you switch, get a new one; your application will be cancelled.'])}`,
    related: ['procedures/new-contract.html', 'procedures/esim.html', 'forms/checklist.html', 'shops/appointments.html'],
  },

  'procedures/new-contract.html': {
    title: 'New contract', short: 'New contract',
    lead: 'Get a new Kumo phone number. What you need, who can sign up and how minors can get a contract.',
    body: `
<h2>Who can sign up</h2>
${table(['Age of the contract holder', 'Online', 'At a shop', 'Conditions'], [
    ['18 or over', 'Yes', 'Yes', 'ID document and payment method in their own name'],
    ['12 to 17', 'No', 'Yes', 'Parental consent form K-05 and the parent or guardian must come to the shop with their ID'],
    ['Under 12', 'No', 'In a parent\'s name only', 'The parent is the contract holder and the child is registered as the user'],
  ])}
<ul class="fine"><li>One contract holder can have up to 5 voice lines.</li><li>Foreign residents can sign up with a residence card. To buy a device in instalments, the remaining period of stay must be at least 90 days.</li><li>Device instalment purchases require a credit check.</li></ul>
<h2 id="id">Accepted ID documents</h2>
${table(['Document', 'Accepted on its own', 'Online application', 'Notes'], [
    ['My Number card (with photo)', 'Yes', 'Yes (scan the IC chip)', 'The paper notification card is not accepted.'],
    ['Driver\'s licence', 'Yes', 'Yes', 'If you have moved, the new address must be written on the back.'],
    ['Residence card / special permanent resident certificate', 'Yes', 'No', 'Must be valid on the day of application.'],
    ['Disability certificate (physical, intellectual or mental)', 'Yes', 'No', 'Must show your current address.'],
    ['Basic Resident Register card (with photo)', 'Yes', 'No', 'Accepted until its expiry date.'],
    ['Japanese passport', 'No: with a supplementary document', 'No', 'Passports issued since February 2020 have no address field.'],
    ['Health insurance eligibility certificate', 'No: with a supplementary document', 'No', 'Old-style health insurance cards are no longer accepted (since 1 July 2026).'],
  ])}
<p><b>Supplementary documents</b> (must show the same name and current address, issued within the last 3 months): utility bill receipt (electricity, gas or water), certificate of residence.</p>
<h2>What else to bring</h2>
<ul><li>A bank cash card or a credit card in the contract holder's name (a parent's card is accepted for contracts of minors)</li><li>The <a href="@/forms/checklist.html">What to bring checklist</a> lists everything for each procedure.</li></ul>
<h2 id="minors">Contracts for minors</h2>
<p>For a contract in the name of a 12 to 17 year-old, the parent or guardian must come to the shop with:</p>
<ul class="checklist"><li>The child's ID document (My Number card, passport with supplementary document, or student ID with a certificate of residence)</li><li>The parent's ID document</li><li>Parental consent form K-05, signed by the parent</li><li>A document showing the relationship if the surnames differ (family register or certificate of residence)</li></ul>
<p>Filtering for minors (web and app filtering) is set by default for users under 18. Removing it requires the parent's consent at a shop.</p>
<h2>Steps</h2>
${steps([
    ['Choose a plan', 'Compare the four plans on <a href="@/plans/index.html">Compare plans</a>. You can change plan later.'],
    ['Apply online or at a shop', `Online admin fee ${yen(FEE.adminOnline)}, shop ${yen(FEE.adminShop)}. Online applications are reviewed between 9:00 and 21:00.`],
    ['Receive your SIM or eSIM', 'SIM cards arrive in 2 to 4 days; eSIM can be set up the same day.'],
    ['Activate', 'Insert the SIM and restart your phone, or set up the eSIM. Your line is active within about 15 minutes.'],
  ])}
${kome(['In the first month, the plan fee is charged by the day.', 'If you cancel within 8 days of receiving the SIM (contract cancellation period under the Telecommunications Business Act), the admin fee is not charged, but call and data charges are.'])}`,
    related: ['procedures/switch-to-kumo.html', 'forms/checklist.html', 'plans/index.html'],
  },

  'procedures/change-plan.html': {
    title: 'Change your plan', short: 'Change your plan',
    lead: 'Plan changes are free and take effect from the 1st of the next month. When you move to a larger plan, you can start it today.',
    body: `
<h2>When the new plan starts</h2>
${table(['Change', 'Starts', 'Monthly fee this month', 'Deadline'], [
    ['Any plan → a smaller plan', '1st of next month', 'Current plan', 'Last day of the month, 21:00 (My Kumo) or shop closing time'],
    ['Any plan → a larger plan (normal)', '1st of next month', 'Current plan', 'Last day of the month, 21:00'],
    ['Any plan → a larger plan ("start today")', 'Today', 'New plan in full; the current plan is not charged', '25th of the month'],
  ])}
<p>"Larger" means Kumo Mini → Kumo Basic, Kumo Mini → Kumo Unlimited, Kumo Basic → Kumo Unlimited, or Kumo 65+ → Kumo Unlimited.</p>
<h3>Example: changing on 18 October</h3>
<ul>
<li><b>Kumo Mini → Kumo Basic, start today:</b> October is charged ${yen(PLAN.basic.price)} (Basic in full). You get 20 GB for October; data already used in October counts towards it.</li>
<li><b>Kumo Mini → Kumo Basic, from next month:</b> October is charged ${yen(PLAN.mini.price)}; Basic starts on 1 November.</li>
<li><b>Kumo Unlimited → Kumo Basic:</b> always from 1 November. October is charged as Kumo Unlimited.</li>
</ul>
<h2>Rules</h2>
<ul class="fine">
<li>One change per month. If you make several requests, the last one made before the deadline applies. You can cancel a pending change in My Kumo until 21:00 on the last day of the month.</li>
<li>Data carried over on Kumo Basic is lost when you change to another plan.</li>
<li>Changing to Kumo 65+ requires the registered user to be 65 or over; the user's age is checked (bring ID to a shop, or use My Number card online).</li>
<li>The under-22 discount ends if you change to Kumo Mini or Kumo 65+, and does not restart if you change back.</li>
<li>Changing to Kumo Mini removes the family discount from that line (it still counts as a line in the group).</li>
<li>Call options stay as they are, except that Talk Unlimited for Kumo 65+ ends when you leave Kumo 65+.</li>
</ul>
<h2>Steps in My Kumo</h2>
${steps([
    ['Log in to My Kumo', 'Use your Kumo ID and password, or the My Kumo app.'],
    ['Open "Contract" → "Change plan"', 'Your current plan and any pending change are shown.'],
    ['Choose the new plan', 'The monthly price with your current discounts is shown for each plan.'],
    ['Choose when it starts', '"From next month" or, for a larger plan before the 25th, "Start today".'],
    ['Confirm', 'You receive an SMS and email. Fee: ¥0.'],
  ])}
${note('info', '<p>At a shop the change is also free, but please <a href="@/shops/appointments.html">book</a> (about 30 minutes).</p>')}`,
    related: ['plans/index.html', 'procedures/data-usage.html', 'my-kumo.html'],
  },

  'procedures/esim.html': {
    title: 'Set up eSIM', short: 'Set up eSIM',
    lead: 'An eSIM is a SIM built into your phone. You download your Kumo profile instead of inserting a card.',
    body: `
<img class="photo" src="/assets/img/esim-setup.jpg" alt="Hands setting up a new smartphone at a desk">
<h2>Before you start</h2>
<ul>
<li>Connect the phone to Wi-Fi. The eSIM cannot be downloaded over the mobile network you are replacing.</li>
<li>Check that your phone supports eSIM and is SIM-unlocked.</li>
<li>Have the eSIM setup screen open in My Kumo on another device (a computer or tablet), or use the My Kumo app on the phone itself.</li>
<li>The QR code in My Kumo is valid for <b>30 days</b> and can be used only once.</li>
</ul>
${tabs([
    ['iPhone', steps([
      ['Open Settings', 'Go to <b>Settings → Mobile Service → Add eSIM</b>.'],
      ['Choose "Use QR code"', 'Scan the QR code shown in My Kumo. If you are using the My Kumo app on the iPhone, tap "Install eSIM on this iPhone" instead.'],
      ['Wait for activation', 'This takes 1 to 5 minutes. Do not close Settings.'],
      ['Label your line', 'If you have two lines, choose which line is used for calls and mobile data.'],
      ['Check the connection', 'Turn on <b>5G Auto</b> in Mobile Data Options. Call 111 (free test number).'],
    ]) + '<p class="small">Moving to a new iPhone? Use eSIM Quick Transfer during setup of the new iPhone. No reissue is needed.</p>'],
    ['Android', steps([
      ['Open Settings', 'Go to <b>Settings → Network &amp; internet → SIMs → Add SIM</b> (on some models: Connections → SIM manager → Add eSIM).'],
      ['Choose "Download a SIM instead?"', 'Scan the QR code shown in My Kumo.'],
      ['Turn on the eSIM', 'Turn on "Use SIM" and allow mobile data.'],
      ['Check the access point (APN)', 'It is set automatically. If you have no data, add APN <b>kumo.jp</b> (user name and password blank) in Access Point Names.'],
      ['Check the connection', 'Restart the phone and call 111 (free test number).'],
    ]) + '<p class="small">Android 14 or later on selected models: eSIM quick transfer between Android phones is available since 20 August 2026.</p>'],
  ])}
${note('warn', '<p>Do not delete the Kumo eSIM from your phone, even when you sell or reset it, before you have moved the line to another phone. A deleted eSIM cannot be restored; it must be reissued.</p>', 'Do not delete your eSIM')}
<h2>Reissue and change between SIM card and eSIM</h2>
${table(['Procedure', 'My Kumo', 'At a shop'], [['eSIM reissue (new phone, deleted eSIM)', yen(0), yen(FEE.esimReissueShop)], ['SIM card → eSIM', yen(0), yen(FEE.adminShop)], ['eSIM → SIM card', yen(FEE.simReissueOnline), yen(FEE.simReissueShop)]])}
<p class="small">Reissues in My Kumo are accepted 9:00–21:00. The old SIM or eSIM stops working as soon as the new one is issued.</p>`,
    related: ['procedures/sim-card.html', 'procedures/switch-to-kumo.html'],
  },

  'procedures/sim-card.html': {
    title: 'Insert a SIM card', short: 'Insert a SIM card',
    lead: 'Kumo SIM cards are nano-SIM size. It takes a minute; switch the phone off first.',
    body: `
${figure(simDiagram({ title: 'Parts of the SIM tray', hole: 'Pin hole', pin: 'SIM ejector pin', notch: 'Cut corner of the SIM', contacts: 'Gold contacts face down', tray: 'SIM tray', caption: 'Side of the phone (top) and the SIM tray pulled out (bottom). The position of the tray differs by model.' }), 'The SIM tray and ejector pin')}
<img class="photo" src="/assets/img/sim-tray.jpg" alt="SIM tray with a nano SIM card and an ejector pin">
<h2>Steps</h2>
${steps([
    ['Switch off the phone', 'Inserting or removing a SIM with the power on can damage the SIM or the data on it.'],
    ['Push the pin into the hole', 'Insert the SIM ejector pin (1, 2) straight into the small hole next to the tray and press gently until the tray pops out.'],
    ['Place the SIM in the tray', 'Line up the cut corner (3) with the cut corner of the tray. The gold contacts (4) face down, towards the phone.'],
    ['Push the tray back in', 'Hold the phone flat and push the tray (5) in, the same way round as it came out, until it is flush.'],
    ['Switch on and check', 'The status bar shows "Kumo" within a minute. Call 111 to test.'],
  ])}
${note('warn', '<ul><li>Do not use a needle, paper clip or earring: it can damage the mechanism. A pin is included with your phone, and shops give one free.</li><li>Do not cut a SIM card or use an adapter in the tray; cards can get stuck.</li><li>Do not touch the gold contacts.</li></ul>', 'Take care')}
<h2>No signal after inserting the SIM?</h2>
<ol><li>Restart the phone.</li><li>Check that airplane mode is off.</li><li>Check the APN (Android): <b>kumo.jp</b>. See <a href="@/procedures/esim.html">eSIM setup</a>.</li><li>Check <a href="@/status.html">Service status</a> for problems in your area.</li><li>If you switched from another carrier, check in My Kumo that you pressed "Switch my line".</li></ol>
<p>Lost or damaged SIM: reissue ${yen(FEE.simReissueOnline)} in My Kumo (delivered in 2–4 days) or ${yen(FEE.simReissueShop)} at a shop (same day).</p>`,
    related: ['procedures/esim.html', 'procedures/switch-to-kumo.html', 'status.html'],
  },

  'procedures/data-usage.html': {
    title: 'Check your data usage', short: 'Check your data usage',
    lead: 'See how much data you have used this month and in past months, and get alerts before you reach your limit.',
    body: `
<h2>Ways to check</h2>
${table(['Method', 'Shows', 'Notes'], [
    ['My Kumo app', 'This month, by day; past 6 months', 'Updated about every 3 hours'],
    ['My Kumo (web)', 'This month; past 6 months; carried-over and extra data', 'Log in with your Kumo ID'],
    ['SMS "DATA" to 1580', 'This month\'s total and remaining data', 'Free; reply within a few minutes'],
    ['Call 1580 from your Kumo phone', 'This month\'s total (automated)', 'Free; 24 hours'],
  ])}
<p>The figures shown can be up to 3 hours behind. The amount on your phone's own data counter may differ, because the phone counts from a different date and includes Wi-Fi on some models.</p>
<h2>Alerts</h2>
<p>We send a free SMS when you have used 80% and 100% of your monthly data (Kumo Mini, Kumo Basic and Kumo 65+). Kumo Unlimited customers get an SMS when they pass 3 GB (the end of the low-use discount) and when tethering reaches 25 GB and 30 GB. You can turn alerts off in My Kumo.</p>
<h2>How much do Kumo customers use?</h2>
${figure(usageChart, 'Average monthly data use per line on each plan, all Kumo customers, October 2025 to September 2026.')}
<p>Use rises in summer holidays: in August 2026 Kumo Basic lines used an average of 14.6 GB. If you often go over your allowance, <a href="@/procedures/change-plan.html">changing your plan</a> may be cheaper than buying extra data. Compare in the <a href="@/plans/index.html#chart">price chart</a>.</p>
<h2>Tips to use less data</h2>
<ul><li>Use Wi-Fi at home and at work.</li><li>Set video apps to "data saver" quality on mobile data.</li><li>Turn off automatic app updates and photo backup over mobile data.</li></ul>`,
    related: ['plans/index.html', 'procedures/change-plan.html', 'plans/options.html'],
  },

  'procedures/lost-phone.html': {
    title: 'Lost or stolen phone', short: 'Lost or stolen phone',
    lead: 'Suspend your line straight away to stop anyone else using it. Suspension is free and available 24 hours a day.',
    body: `
${note('alert', `<p>Lost and Stolen line (24 hours, free): <b class="contact-num">${TEL.lost.free}</b><br>From another Kumo phone: <b>${TEL.lost.short}</b> · From abroad: <b>${TEL.lost.abroad}</b> (charged)</p>`, 'Suspend your line now')}
${figure(flow(['Suspend\nyour line', 'Lock or locate\nyour phone', 'Report to\nthe police', 'Replace the phone\nor SIM', 'Resume\nyour line'], { bw: 120 }), 'What to do')}
<h2>Steps</h2>
${steps([
    ['Suspend your line', `In My Kumo on another device (a computer or a family member's phone): <b>Support → Lost or stolen → Suspend</b>. Or call the Lost and Stolen line. Suspension stops calls, SMS and data immediately.`],
    ['Lock or locate your phone', 'Use Find My (iPhone) or Find My Device (Android) from another device. You can show a message with a contact number on the lock screen.'],
    ['Report to the police', 'Report the loss or theft at a police box (kōban) or police station. Note the <b>receipt number</b>: you need it for a Device Care claim.'],
    ['Replace your phone or SIM', `With <a href="@/plans/options.html#care">Device Care Standard or Premium</a>, claim a replacement (${yen(CARE[1].replace)} / ${yen(CARE[2].replace)}). Otherwise buy a new phone. Get a new SIM: ${yen(FEE.simReissueOnline)} in My Kumo or ${yen(FEE.simReissueShop)} at a shop; eSIM ${yen(0)} in My Kumo.`],
    ['Resume your line', 'When you have your phone or a new SIM, resume the line in My Kumo or at a shop.'],
  ])}
<img class="photo" src="/assets/img/lost-phone.jpg" alt="">
<h2>Fees while suspended</h2>
<ul>
<li>Suspension and resumption: free.</li>
<li>Your plan fee and options continue to be charged while the line is suspended. No call or data charges are made.</li>
<li>If you will not use the number for a long time, consider <a href="@/plans/options.html#other">Number Keep</a> (${yen(440)}/month).</li>
</ul>
<h2>If you find your phone</h2>
<p>If you suspended in My Kumo, you can resume in My Kumo. <b>If you suspended by phone, you cannot resume online:</b> call the Lost and Stolen line again from the phone's number, or visit a shop with your ID. If you reported the loss to the police, tell them it has been found.</p>
${note('warn', '<p>My Kumo is unavailable on 8 October 2026 from 01:00 to 06:00 for maintenance. During this time, suspend your line by phone. <a href="@/news/maintenance-october-2026.html">Details</a></p>', 'Planned maintenance')}`,
    related: ['procedures/repair.html', 'plans/options.html', 'contact.html', 'status.html'],
  },

  'procedures/repair.html': {
    title: 'Repair and replacement', short: 'Repair and replacement',
    lead: 'Broken screen, water damage or a phone that will not start: how to get it repaired or replaced, with or without Device Care.',
    body: `
<h2>Your options</h2>
${table(['', 'Device Care member', 'Not a member'], [
    ['Delivery replacement', `A refurbished phone of the same model is delivered. Light: not available; Standard ${yen(CARE[1].repair)}; Premium ${yen(0)} for the first claim`, 'Not available'],
    ['Repair through a shop', `${yen(CARE[0].repair)} (Light), ${yen(CARE[1].repair)} (Standard), ${yen(0)} first claim then ${yen(CARE[2].repairNext)} (Premium)`, `Estimate free. Screen repairs ${yen(FEE.screenFrom)}–${yen(FEE.screenTo)} depending on the model`],
    ['Loaner phone', 'Free', `${yen(FEE.loaner)} per repair`],
    ['Repair time', '7–10 days', '7–14 days'],
  ])}
<h2>Delivery replacement (Device Care Standard and Premium)</h2>
${steps([
    ['Apply', `Apply in My Kumo or call Device Care (${TEL.care.free}, ${TEL.care.hours[0]}:00–${TEL.care.hours[1]}:00). Applications by 15:00 are delivered the next day (Tsukimi Town and Shiose Village: 2 days).`],
    ['Prepare the old phone', 'Back up your data, turn off Find My / Find My Device, and remove the SIM and any memory card.'],
    ['Receive the replacement', 'The courier hands you the replacement. Move your SIM to it, or reissue your eSIM in My Kumo (free).'],
    ['Return the old phone', 'Put the old phone in the return pack and post it within 14 days. If it is not returned, a fee of ¥22,000 is charged.'],
  ])}
<h2>Repair through a shop</h2>
<p>These shops accept repairs: ${SHOPS.filter((s) => s.svc.includes('r')).map((s) => `<a href="@/shops/index.html#${s.id}">${s.en.name}</a>`).join(', ')}. Kumo Shop Hanaoka and the Harukawa University counter do not accept repairs. <a href="@/shops/appointments.html">Book an appointment</a> (about 30 minutes).</p>
<h3>Before you bring the phone</h3>
<ul class="checklist"><li>Back up your data (the repair may erase it)</li><li>Turn off Find My (iPhone) or remove your Google account (Android)</li><li>Remove the case, screen protector, SIM and memory card</li><li>Bring your ID and, for Device Care, nothing else: we check your membership</li></ul>
<h2>Battery replacement</h2>
<p>Device Care Premium: free once, 24 months or more after enrolment. Otherwise ¥9,900–¥14,300 depending on the model.</p>
${kome(['Water-damaged phones often cannot be repaired. With Device Care Standard or Premium you can choose a delivery replacement instead.', 'Phones repaired by an unauthorised repair shop may not be accepted.', 'Kumo cannot recover data from a broken phone.'])}`,
    related: ['plans/options.html', 'procedures/lost-phone.html', 'shops/index.html', 'contact.html'],
  },

  'procedures/cancel.html': {
    title: 'Cancel your contract', short: 'Cancel your contract',
    lead: 'There is no cancellation fee. The plan fee for the month you cancel is charged in full.',
    body: `
${note('alert', '<p>Moving to another carrier? <b>Do not cancel.</b> Apply to your new carrier with MNP One-Stop or an MNP reservation number (free, in My Kumo). Your Kumo contract ends automatically when your number moves.</p>', 'Keeping your number?')}
<h2>Where to cancel</h2>
${table(['Where', 'Hours', 'Takes effect', 'Need'], [
    ['My Kumo', '9:00–21:00', 'Immediately', 'Kumo ID and password'],
    ['Kumo shop', 'Shop hours', 'Immediately', 'Contract holder\'s ID document'],
    ['By phone', 'Not accepted', '—', '—'],
  ])}
<p class="small">Someone other than the contract holder can cancel at a shop with form K-33 (cancellation by proxy), the holder's ID and their own ID.</p>
<h2>What you pay when you cancel</h2>
${table(['Item', 'What happens'], [
    ['Cancellation fee', yen(0)],
    ['Plan fee for the month of cancellation', 'Charged in full (not by the day)'],
    ['Options (call options, Device Care, Security Pack)', 'Charged in full for the month'],
    ['Remaining device instalments', 'Continue every month as before, or pay the remaining balance at once'],
    ['Extra data and roaming passes', 'Not refunded'],
    ['MNP port-out fee', `${yen(0)}`],
  ])}
<h3>Example: Kumo Basic with Talk 5 and Device Care Standard, cancelled on 12 October</h3>
${table(['Item', 'October bill'], [['Kumo Basic', yen(PLAN.basic.price)], ['Kumo Talk 5', yen(CALL.talk5)], ['Device Care Standard', yen(CARE[1].fee)], ['Calls and SMS until 12 October', 'As used'], ['Remaining instalments (11 × ¥3,980)', '¥3,980 per month for 11 months, or ¥43,780 at once']], { caption: 'Discounts for October still apply.' })}
<h2>Timing and refunds</h2>
<ul>
<li>Your line stops as soon as cancellation is complete. Your final bill arrives the following month as usual.</li>
<li>Amounts paid twice (for example by payment slip and bank transfer) are refunded to your bank account within about 2 months.</li>
<li>There is no refund for unused days or unused data.</li>
</ul>
<h2>Effects on your family</h2>
<p>If the family group has fewer lines after you cancel, the family discount of the remaining lines is recalculated from the next month. For example, when a group of 3 becomes 2, each Kumo Basic line's discount falls from ${yen(DISC.family.basic[1])} to ${yen(DISC.family.basic[0])}. If you are the family group's representative, choose a new representative before cancelling.</p>
<h2>Before you cancel</h2>
<ul class="checklist"><li>Your @kumo.ne.jp email address is deleted. To keep it, apply for Email Keep (${yen(330)}/month) at the same time</li><li>Download any bills you need from My Kumo (you can no longer log in afterwards)</li><li>Return loaner phones and rental equipment</li><li>Remove the SIM card and cut it up; you do not need to return it</li></ul>`,
    related: ['procedures/switch-to-kumo.html', 'procedures/transfer.html', 'billing/index.html', 'plans/index.html'],
  },

  'procedures/change-details.html': {
    title: 'Change your name or address', short: 'Change name or address',
    lead: 'Keep your contract details up to date. Changes are free.',
    body: `
${table(['Change', 'My Kumo', 'At a shop', 'Documents', 'Fee'], [
    ['Address', 'Yes (24 hours)', 'Yes', 'None online. At a shop: ID showing the new address', yen(0)],
    ['Name (e.g. after marriage)', 'Yes, with a My Number card showing the new name', 'Yes', 'ID showing the new name, or ID + family register or certificate of residence showing the change', yen(0)],
    ['Phone number', 'No', 'Yes', 'ID document', yen(FEE.numberChange)],
    ['Email and contact phone', 'Yes', 'Yes', 'None', yen(0)],
    ['Payment method', 'Yes', 'Yes', 'New bank card or credit card', yen(0)],
  ])}
<h2>Changing your name</h2>
${steps([
    ['Update your ID first', 'Update your My Number card or driver\'s licence at your city office or police station.'],
    ['Change your name with Kumo', 'In My Kumo: <b>Contract → Contract holder details → Change name</b>, then scan your My Number card. At a shop, bring the documents above.'],
    ['Update your payment method if needed', 'If your bank account or credit card name changes, register it again in My Kumo. Payment method changes made by the 20th apply to that month\'s charge.'],
  ])}
<p class="small">Your new name appears on the next bill. The family discount and other discounts continue.</p>
<h2>Moving house</h2>
<ul><li>Change your address in My Kumo within 30 days of moving. Bills and important notices are sent to the registered address.</li><li>Kumo Hikari is a separate contract: moving it needs a separate application (moving fee ¥2,200).</li><li>If you move abroad, consider <a href="@/plans/options.html#other">Number Keep</a>.</li></ul>`,
    related: ['procedures/transfer.html', 'billing/index.html', 'my-kumo.html'],
  },

  'procedures/transfer.html': {
    title: 'Transfer a contract to a family member', short: 'Transfer a contract',
    lead: 'Change the contract holder of a line, for example from a parent to a child who has started work. The phone number stays the same.',
    body: `
${table(['', 'Transfer (change of holder)', 'Inheritance (holder deceased)', 'Change of registered user'], [
    ['Use when', 'The holder is alive and agrees', 'The contract holder has died', 'Someone else uses the phone; the holder stays the same'],
    ['Who can receive', 'Family members (within the third degree of kinship or at the same address)', 'The heir or a family member', 'Anyone named by the holder'],
    ['Where', 'Shop only', 'Shop only', 'My Kumo or shop'],
    ['Fee', yen(FEE.transfer) + ' (paid by the new holder)', yen(0), yen(0)],
  ])}
<h2>Transfer: what to bring</h2>
<ul class="checklist">
<li>ID documents of both the current and the new holder</li>
<li>Form K-15 "Application for transfer of contract", signed by both</li>
<li>If the current holder cannot come: form K-07 (power of attorney) signed by them, and their ID document (original)</li>
<li>If surnames or addresses differ: family register or certificate of residence issued within the last 3 months</li>
<li>The new holder's payment method (bank cash card or credit card)</li>
</ul>
<h2>Steps</h2>
${steps([
    ['Book an appointment', 'Allow about 60 minutes. <a href="@/shops/appointments.html">Book online</a>.'],
    ['Come to the shop', 'Both holders together, or the new holder with form K-07.'],
    ['Credit check for device instalments', 'If device instalments remain, the new holder takes them over after a credit check. If the check fails, the current holder must pay the remaining balance first.'],
    ['Transfer complete', 'The new holder\'s contract starts the same day. The plan fee for that month is charged to the new holder in full; calls and data before the transfer are billed to the previous holder.'],
  ])}
<h2>What carries over</h2>
<ul><li>Phone number, plan, call options, Device Care and the @kumo.ne.jp email address.</li><li>Family discount: the line stays in the family group if the new holder is in the same family.</li><li>Under-22 discount: continues if the registered user does not change.</li><li>Kumo 65+: the registered user must still be 65 or over.</li></ul>
<h2 id="inheritance">Inheritance (when the contract holder has died)</h2>
<p>The heir can take over the line, or cancel it, free of charge. Bring the heir's ID, form K-18 and a document showing the death (death certificate, or family register showing the death). We recommend doing this within 3 months. Cancellation for this reason has no fee, and the plan fee for that month is charged by the day.</p>`,
    related: ['procedures/change-details.html', 'procedures/cancel.html', 'forms/index.html', 'plans/index.html'],
  },
};
