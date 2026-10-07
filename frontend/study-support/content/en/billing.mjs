// Billing section (English)
import { FEE, BILL_GROUPS, BILL_TOTAL, BILL_DEVICE, COLORS, TEL, yen, table, steps, note, figure, sampleBill, barChart } from '../shared.mjs';

const kome = (items) => `<ul class="kome">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const GROUP = { plan: 'Plan after discounts', options: 'Options (Talk 5, Device Care)', usage: 'Calls, SMS and extra data', fees: 'Paper bill and other fees', device: 'Device instalment' };
const GCOL = { plan: COLORS.basic, options: COLORS.senior, usage: COLORS.unlimited, fees: '#8a96a3', device: COLORS.mini };

export const pages = {
  'billing/index.html': {
    title: 'Payment methods and billing dates', short: 'Billing',
    lead: 'How to pay your Kumo bill, when you are charged, and what happens if a payment is late.',
    body: `
<h2>Payment methods</h2>
${table(['Method', 'How to register', 'When you are charged', 'Notes'], [
    ['Credit card', 'My Kumo or shop', 'Kumo sends the charge on about the 26th of the following month; your card company bills you on its own schedule', 'Visa, Mastercard, JCB, American Express, Diners Club. Most debit cards are accepted; prepaid cards are not.'],
    ['Bank account transfer', 'My Kumo (major banks, instant) or paper form K-40 at a shop', '26th of the following month (next business day if a bank holiday)', 'Paper registration takes 1–2 months; until then you pay by payment slip.'],
    ['Payment slip', 'Ask at a shop or call Billing', 'Pay by the due date on the slip (26th of the following month)', `${yen(FEE.slip)} per slip. Pay at convenience stores, post offices, banks or with smartphone payment apps. Not available for online contracts.`],
  ])}
<p>Changes to your payment method made <b>by the 20th</b> apply to that month's charge. Changes after the 20th apply from the following month.</p>
<h2>Billing dates</h2>
${table(['', 'Example: October 2026 usage'], [
    ['Usage period', '1–31 October 2026 (always the 1st to the last day of the month)'],
    ['Bill amount confirmed and shown in My Kumo', 'Around 10 November 2026'],
    ['Paper bill posted (if requested)', 'Around 15 November 2026'],
    ['Bank account transfer / payment slip due', '26 November 2026 (Thursday)'],
    ['Credit card', 'Charged by Kumo around 26 November; billed with your card statement'],
  ])}
<p class="small">Bills are available in My Kumo for 24 months. Older bills: ask at a shop (free) or Billing support.</p>
<h2>Web bill and paper bill</h2>
<p>Your bill is shown in My Kumo free of charge (web bill). A paper bill costs <b>${yen(FEE.paperBill)} per month</b>, and an itemised call record on paper ${yen(FEE.callRecord)} per month.</p>
<ul class="fine"><li>No paper bill fee for Kumo 65+ lines.</li><li>No paper bill fee for holders of a disability certificate (apply once at a shop with the certificate).</li></ul>
<h2 id="late">If a payment is late</h2>
${steps([
    ['Transfer or card payment fails', 'We send an SMS and post a payment slip (no slip fee in this case). Pay by the date on the slip.'],
    ['Late payment charge', `From the day after the original due date, a late payment charge of ${FEE.lateRate} a year is added on the unpaid amount.`],
    ['Line suspended', `If the bill is still unpaid ${FEE.lateSuspendDays} days after the slip's due date, calls (except emergency numbers 110, 118, 119), SMS and data are suspended. The plan fee continues.`],
    ['Contract cancelled', 'If the bill remains unpaid two months after suspension, the contract is cancelled. Unpaid device instalments may be reported to credit agencies.'],
  ])}
<p>When you pay, the line is resumed free of charge. Payments at a convenience store can take up to 3 business days to reach us; to resume sooner, pay in My Kumo by card.</p>
${note('info', `<p>Billing support: <b>${TEL.billing.navi}</b> (Navi Dial, charged), weekdays ${TEL.billing.hours[0]}:00–${TEL.billing.hours[1]}:00.</p>`)}`,
    related: ['billing/read-your-bill.html', 'billing/fees.html', 'procedures/change-details.html'],
  },

  'billing/read-your-bill.html': {
    title: 'How to read your bill', short: 'How to read your bill',
    lead: 'A sample bill with an explanation of each item. Your own bill is in My Kumo from around the 10th of each month.',
    body: `
${figure(sampleBill({
    heading: 'Kumo Mobile — Monthly statement', period: 'August 2026 usage',
    meta: ['Account no. 4120-5568-07   Kumo Taro (sample)', 'Line: 090-XXXX-1234   Usage period: 1–31 August 2026', 'Payment date: 28 September 2026 (bank transfer)'],
    totalLabel: 'Amount due', commLabel: 'Communication charges', otherHead: 'Other charges',
    items: { plan: 'Kumo Basic', family: 'Family discount (3 lines)', home: 'Home internet bundle', talk5: 'Kumo Talk 5', calls: 'Calls (over 5 min, 12 × 30 s)', sms: 'SMS (10 messages)', data: 'Extra data 1 GB', care: 'Device Care Standard', paper: 'Paper bill fee', universal: 'Universal service fee', relay: 'Telephone relay service fee', device: 'Device instalment (13 of 24)' },
    foot: 'All amounts include consumption tax (10%). This is a sample.',
  }), 'Sample bill. The numbers refer to the explanations below.')}
<h2>Explanation</h2>
<ol>
<li><b>Account details.</b> Your account number, the usage period (always the 1st to the last day of the month) and the payment date: the 26th of the following month, or the next business day when the 26th is a weekend or bank holiday.</li>
<li><b>Amount due.</b> The total charged on the payment date.</li>
<li><b>Plan fee.</b> The full monthly fee of your plan, before discounts. In the month you joined, it is charged by the day.</li>
<li><b>Discounts.</b> Family discount and home internet bundle, shown as minus amounts. A discount starting next month is not shown yet.</li>
<li><b>Usage charges.</b> Calls longer than your free allowance (here: Talk 5 covers the first 5 minutes of each call), SMS at ${yen(3.3)} each, and extra data.</li>
<li><b>Paper bill fee.</b> ${yen(FEE.paperBill)} a month. Switch to the web bill in My Kumo to stop it.</li>
<li><b>Universal service fee and telephone relay service fee.</b> Charged by all carriers in Japan to fund basic telephone services and the telephone relay service for people with hearing or speech disabilities. The amount is reviewed twice a year.</li>
<li><b>Device instalment.</b> Paid over 24 months, interest-free. Discounts do not apply to it. If you cancel your line, the remaining instalments continue.</li>
<li><b>Total.</b> Communication charges plus other charges.</li>
</ol>
<h2>Where the money goes</h2>
${figure(barChart({ title: 'Sample bill by category', rows: BILL_GROUPS.map(([k, v]) => ({ label: GROUP[k], value: v, color: GCOL[k], valueLabel: yen(v) })), max: BILL_DEVICE * 1.05, total: `Total ${yen(BILL_TOTAL)}` }), 'The sample bill above, grouped by category.')}
<h2>Common questions about bills</h2>
<ul>
<li><b>Why is my first bill different?</b> The plan fee is charged by the day for the first month, and the admin fee (shop procedures, ${yen(FEE.adminShop)}) appears on it.</li>
<li><b>Why does the family discount not appear?</b> It starts with the bill for the month after the group is registered. See <a href="@/plans/index.html#family">Family discount</a>.</li>
<li><b>Why was I charged for a call when I have Talk 5?</b> Calls over 5 minutes, and calls to 0570 numbers, are charged.</li>
</ul>`,
    related: ['billing/index.html', 'billing/fees.html', 'plans/index.html', 'faq.html'],
  },

  'billing/fees.html': {
    title: 'Fees and charges', short: 'Fees and charges',
    lead: 'Administrative fees and other charges. All amounts include tax. Many procedures are free online.',
    body: `
<h2>Contract procedures</h2>
${table(['Procedure', 'At a shop', 'Online (My Kumo)', 'Notes'], [
    ['New contract', yen(FEE.adminShop), yen(FEE.adminOnline), ''],
    ['Switch to Kumo (MNP port-in)', yen(FEE.adminShop), yen(FEE.adminOnline), ''],
    ['Device change (buying a new phone)', yen(FEE.adminShop), yen(FEE.adminOnline), ''],
    ['Plan change', yen(0), yen(0), ''],
    ['Contract transfer to a family member', yen(FEE.transfer), 'Not available', 'Paid by the new holder'],
    ['Inheritance', yen(0), 'Not available', ''],
    ['Name or address change', yen(0), yen(0), ''],
    ['Phone number change', yen(FEE.numberChange), 'Not available', ''],
    ['Cancellation', yen(0), yen(0), 'Plan fee for the month charged in full'],
    ['MNP port-out', yen(0), yen(0), ''],
    ['SIM unlock', yen(0), yen(0), 'All Kumo phones sold since May 2021 are unlocked'],
  ])}
<h2>SIM card and eSIM</h2>
${table(['Procedure', 'At a shop', 'Online (My Kumo)'], [
    ['SIM card reissue (lost or damaged)', yen(FEE.simReissueShop), `${yen(FEE.simReissueOnline)} (delivered)`],
    ['eSIM reissue', yen(FEE.esimReissueShop), yen(0)],
    ['Change SIM card → eSIM', yen(FEE.adminShop), yen(0)],
    ['Change eSIM → SIM card', yen(FEE.simReissueShop), yen(FEE.simReissueOnline)],
  ])}
<h2>Billing</h2>
${table(['Item', 'Amount', 'Notes'], [
    ['Paper bill', `${yen(FEE.paperBill)} / month`, 'Not charged for Kumo 65+ or disability certificate holders'],
    ['Itemised call record (paper)', `${yen(FEE.callRecord)} / month`, 'Free in My Kumo'],
    ['Payment slip handling', `${yen(FEE.slip)} per slip`, 'Not charged for slips sent after a failed transfer'],
    ['Late payment charge', `${FEE.lateRate} a year`, 'From the day after the due date'],
    ['Resuming a line suspended for non-payment', yen(0), ''],
  ])}
<h2>Devices and repairs</h2>
${table(['Item', 'Amount', 'Notes'], [
    ['Repair estimate', yen(0), ''],
    ['Screen repair without Device Care', `${yen(FEE.screenFrom)}–${yen(FEE.screenTo)}`, 'Depends on the model'],
    ['Loaner phone without Device Care', `${yen(FEE.loaner)} per repair`, 'Free for Device Care members'],
    ['Old phone not returned after delivery replacement', '¥22,000', 'If not posted within 14 days'],
    ['Suspension after loss or theft', yen(0), 'Plan fee continues'],
  ])}
${kome(['Universal service fee ¥3 and telephone relay service fee ¥1 per month per line are charged in addition to plan fees.', 'Fees for Kumo Hikari are set out in its own terms.'])}`,
    related: ['billing/index.html', 'plans/options.html', 'procedures/index.html'],
  },
};
