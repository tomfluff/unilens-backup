// Plans section (English)
import { PLAN, DISC, CALL, DATA, OPT, CARE, CARE_HIGH, ROAM, ROAM_PASS, COLORS, yen, table, note, figure, lineChart, pricePoints } from '../shared.mjs';

const P = PLAN, NAME = { mini: 'Kumo Mini', basic: 'Kumo Basic', unlimited: 'Kumo Unlimited', senior: 'Kumo 65+' };
const fam = (k, i) => (DISC.family[k][i] == null ? '—' : yen(-DISC.family[k][i]));
const after = (k, n) => P[k].price - (DISC.family[k][n] || 0);

const priceChart = lineChart({
  title: 'Monthly price by data used (one line, no discounts)',
  series: ['mini', 'senior', 'basic', 'unlimited'].map((k) => ({ name: NAME[k], color: COLORS[k], pts: pricePoints(k) })),
  xMax: 30, xTicks: [0, 5, 10, 15, 20, 25, 30], xFmt: (v) => `${v} GB`, yMax: 16000, yStep: 2000, yFmt: (v) => yen(v), xTitle: 'Data used in the month',
});

const kome = (items) => `<ul class="kome">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const commonFine = kome([
  'Prices include consumption tax. The universal service fee (¥3/month) and telephone relay service fee (¥1/month) are charged separately.',
  'In the month you sign up, the plan fee is charged by the day. In the month you cancel, it is charged in full.',
  'Plan changes take effect from the 1st of the next month. See <a href="@/procedures/change-plan.html">Change your plan</a>.',
  'Calls to numbers starting with 0570 (Navi Dial), 188 and other special numbers are charged and are not included in free call allowances.',
]);

export const pages = {
  'plans/index.html': {
    title: 'Compare plans', short: 'Plans',
    lead: 'Four plans, no minimum contract period and no cancellation fee. All prices include tax. Combine them with discounts for families, home internet and customers under 22.',
    body: `
<div class="plan-cards">
${['mini', 'basic', 'unlimited', 'senior'].map((k) => `<div class="plan-card" style="--c:${COLORS[k]}"><h3>${NAME[k]}</h3><div class="price">${yen(P[k].price)}<small>/month</small></div><ul>${{
    mini: '<li>3 GB of data</li><li>For light users: messages, maps, a little browsing</li>',
    basic: '<li>20 GB of data</li><li>Unused data carries over one month</li>',
    unlimited: `<li>Unlimited data</li><li>${yen(P.unlimited.price - P.unlimited.lowOff)} in months you use 3 GB or less</li>`,
    senior: '<li>5 GB of data + free calls up to 10 minutes</li><li>For users aged 65 and over</li>',
  }[k]}</ul><a class="btn" href="@/plans/${k}.html">Plan details</a></div>`).join('')}
</div>
<h2 id="compare">Plan comparison</h2>
${table(['', '<span>Kumo Mini</span>', 'Kumo Basic', 'Kumo Unlimited', 'Kumo 65+'], [
    ['Monthly price', yen(P.mini.price), yen(P.basic.price), `${yen(P.unlimited.price)}<br><span class="small">${yen(P.unlimited.price - P.unlimited.lowOff)} if you use 3 GB or less</span>`, yen(P.senior.price)],
    ['Data per month', '3 GB', '20 GB', 'Unlimited', '5 GB'],
    ['After the data allowance', `Up to ${P.mini.slow}`, `Up to ${P.basic.slow}`, '—', `Up to ${P.senior.slow}`],
    ['Extra data', `1 GB ${yen(DATA.gb1)} / 5 GB ${yen(DATA.gb5)}`, `1 GB ${yen(DATA.gb1)} / 5 GB ${yen(DATA.gb5)}`, 'Not needed', `1 GB ${yen(DATA.gb1)} / 5 GB ${yen(DATA.gb5)}`],
    ['Unused data', 'Expires at month end', 'Carries over to the next month', '—', 'Expires at month end'],
    ['Domestic calls', `${yen(CALL.per30s)} per 30 seconds`, `${yen(CALL.per30s)} per 30 seconds`, `${yen(CALL.per30s)} per 30 seconds`, 'Free up to 10 minutes per call, then ¥22 per 30 seconds'],
    ['Call options', 'Talk 5 / Talk Unlimited', 'Talk 5 / Talk Unlimited', 'Talk 5 / Talk Unlimited', `Talk Unlimited ${yen(CALL.seniorUpgrade)}`],
    ['Family discount (per line)', 'Not discounted (counts as a line)', `${yen(DISC.family.basic[0])}–${yen(DISC.family.basic[2])}`, `${yen(DISC.family.unlimited[0])}–${yen(DISC.family.unlimited[2])}`, `${yen(DISC.family.senior[0])} (2 lines or more)`],
    ['Home internet bundle', yen(DISC.home.mini), yen(DISC.home.basic), yen(DISC.home.unlimited), yen(DISC.home.senior)],
    ['Under-22 discount', '—', yen(DISC.u22.basic), yen(DISC.u22.unlimited), '—'],
    ['Tethering', 'Included in 3 GB', 'Included in 20 GB', `Up to ${P.unlimited.tether} GB per month`, 'Included in 5 GB'],
    ['Free roaming (Kumo World)', '—', '—', `${P.unlimited.worldFree} GB/month in Asia and North America`, '—'],
    ['Who can apply', 'Anyone', 'Anyone', 'Anyone', 'Users aged 65 and over'],
  ], { cls: 'compare' })}
${note('info', `<p>Kumo Unlimited will cost <b>${yen(P.unlimited.newPrice)}</b> per month from 1 December 2026. <a href="@/news/price-revision-2026.html">Read the notice</a>.</p>`, 'Price revision')}

<h2 id="chart">Which plan costs least for your data use?</h2>
${figure(priceChart, 'Kumo Mini, Kumo 65+ and Kumo Basic with extra data bought in 1 GB units at ¥550 when the allowance runs out. Kumo Unlimited includes the ¥1,650 discount in months of 3 GB or less. Discounts and call options are not included. Kumo 65+ is only available to users aged 65 and over.')}
<p>Without discounts, Kumo Mini is cheapest up to 3 GB. Above about 7 GB a month, Kumo Basic costs less than Kumo Mini with extra data, and above about 25 GB, Kumo Unlimited costs less than Kumo Basic with extra data (when extra data is bought 1 GB at a time). The 5 GB pack costs less per GB, so the exact point depends on how you buy extra data. Your <a href="@/procedures/data-usage.html">data usage for the past six months</a> is shown in My Kumo.</p>

<h2 id="family">Family discount</h2>
<p>Lines in the same family group get a discount every month. The more voice lines in the group, the bigger the discount on each eligible line.</p>
${table(['Lines in the family group', 'Kumo Basic', 'Kumo Unlimited', 'Kumo 65+', 'Kumo Mini'], [
    ['2 lines', fam('basic', 0), fam('unlimited', 0), fam('senior', 0), '—'],
    ['3 lines', fam('basic', 1), fam('unlimited', 1), fam('senior', 1), '—'],
    ['4 to 10 lines', fam('basic', 2), fam('unlimited', 2), fam('senior', 2), '—'],
  ], { caption: 'Family discount per line, per month' })}
<h3>Conditions</h3>
<ul class="fine">
<li>A family group can have up to ${DISC.maxLines} voice lines. Members must be related within the third degree of kinship (including spouses and partners registered under a municipal partnership system), or live at the same address.</li>
<li>All voice lines count towards the number of lines, including <b>Kumo Mini lines, which count but are not discounted</b>. Data-only lines and lines suspended for non-payment do not count.</li>
<li>Kumo 65+ lines receive ${yen(DISC.family.senior[0])} however many lines the group has.</li>
<li>The discount starts with the bill for the month after the group is registered or a line joins. When a line leaves the group (for example, on cancellation), the other lines' discount is recalculated from the following month.</li>
<li>If surnames or addresses differ, a document proving the family relationship is needed (family register or certificate of residence issued within the last 3 months). Registration is done by the group's representative in <a href="@/my-kumo.html">My Kumo</a> or at a shop.</li>
</ul>
<h3>Example</h3>
<p>Two parents on Kumo Basic and a grandparent on Kumo 65+ form a group of 3 lines: ${yen(after('basic', 1))} + ${yen(after('basic', 1))} + ${yen(after('senior', 1))} = <b>${yen(after('basic', 1) * 2 + after('senior', 1))}</b> per month for the three plans.</p>

<h2 id="home-bundle">Home internet bundle (Kumo Hikari)</h2>
<img class="photo" src="/assets/img/home-router.jpg" alt="A home fibre router on a shelf">
<p>If someone in your family group has Kumo Hikari fibre internet (${yen(OPT.hikari)}/month for houses, ${yen(OPT.hikariMansion)}/month for apartments), every line in the group gets a further discount.</p>
${table(['Plan', 'Discount per line, per month'], [['Kumo Basic', yen(-DISC.home.basic)], ['Kumo Unlimited', yen(-DISC.home.unlimited)], ['Kumo Mini', yen(-DISC.home.mini)], ['Kumo 65+', yen(-DISC.home.senior)]])}
<ul class="fine">
<li>Up to ${DISC.maxLines} lines in the family group of the Kumo Hikari contract holder. It can be combined with the family discount and the under-22 discount.</li>
<li>The discount starts with the bill for the month after Kumo Hikari service starts. If Kumo Hikari is cancelled, the discount ends with that month's bill.</li>
<li>Kumo Hikari is a separate contract with its own terms. Installation fee ¥26,400 (waived when you keep the service for 24 months; the remaining amount is charged if you cancel earlier).</li>
</ul>

<h2 id="u22">Under-22 discount</h2>
<p>For users under 22: ${yen(DISC.u22.basic)} off Kumo Basic and ${yen(DISC.u22.unlimited)} off Kumo Unlimited every month.</p>
<ul class="fine">
<li>The <b>registered user</b> of the line must be under 22 on the day of application, even when the contract is in a parent's name. Proof of the user's age is needed.</li>
<li>The discount continues up to and including the bill for the month in which the user turns 22.</li>
<li>Not available on Kumo Mini or Kumo 65+. If you change to one of these plans, the discount ends and does not restart if you change back.</li>
<li>Can be combined with the family discount and the home internet bundle.</li>
<li>New applications are accepted until 31 March 2027.</li>
</ul>
<h2>Fine print</h2>
${commonFine}`,
    related: ['plans/options.html', 'procedures/change-plan.html', 'procedures/data-usage.html', 'billing/fees.html'],
  },

  'plans/mini.html': {
    title: 'Kumo Mini (3 GB)', short: 'Kumo Mini',
    lead: 'Our lowest-priced plan, for people who mostly use Wi-Fi at home and need a little mobile data when out.',
    body: `
<dl class="spec"><div><dt>Monthly price</dt><dd>${yen(P.mini.price)}</dd></div><div><dt>Data</dt><dd>3 GB / month</dd></div><div><dt>Calls</dt><dd>${yen(CALL.per30s)} / 30 s</dd></div></dl>
<h2>What happens after 3 GB</h2>
<p>When you have used 3 GB in a month, your speed is limited to <b>${P.mini.slow}</b> until the 1st of the next month. That is enough for text messages, but web pages and maps load slowly and video does not play smoothly. You can buy extra data at any time in My Kumo:</p>
${table(['Extra data', 'Price', 'Valid for'], [['1 GB', yen(DATA.gb1), `${DATA.validDays} days from purchase`], ['5 GB', yen(DATA.gb5), `${DATA.validDays} days from purchase`]])}
<p>Extra data is used after your monthly 3 GB. We send an SMS when you reach 80% and 100% of your allowance.</p>
<h2>Monthly cost examples</h2>
${table(['Data used in the month', 'Extra data bought', 'Monthly total (plan + extra data)'], [
    ['2 GB', 'None', yen(P.mini.price)], ['3 GB', 'None', yen(P.mini.price)], ['4 GB', '1 GB', yen(P.mini.price + DATA.gb1)], ['5 GB', '2 × 1 GB', yen(P.mini.price + 2 * DATA.gb1)], ['7 GB', '4 × 1 GB', yen(P.mini.price + 4 * DATA.gb1)], ['8 GB', '5 GB pack', yen(P.mini.price + DATA.gb5)],
  ])}
${note('info', `<p>If you regularly use more than 5 GB, <a href="@/plans/basic.html">Kumo Basic</a> (${yen(P.basic.price)}) is likely to be cheaper. You can change plan once a month; the change applies from the 1st of the next month, or from the same day when you move up to a larger plan.</p>`, 'Using more data?')}
<h2>Discounts</h2>
<ul>
<li><b>Family discount:</b> a Kumo Mini line is not discounted, but it counts towards the number of lines in your family group, so it can raise the discount for other members. <a href="@/plans/index.html#family">Details</a></li>
<li><b>Home internet bundle:</b> ${yen(DISC.home.mini)} off per month with Kumo Hikari. <a href="@/plans/index.html#home-bundle">Details</a></li>
<li><b>Under-22 discount:</b> not available.</li>
</ul>
<h2>Fine print</h2>
${kome(['Unused data does not carry over.', 'Tethering is allowed and counts towards your 3 GB.', 'Kumo World roaming passes are available. See <a href="@/plans/roaming.html">International roaming</a>.'])}${commonFine}`,
    related: ['plans/index.html', 'plans/basic.html', 'procedures/data-usage.html'],
  },

  'plans/basic.html': {
    title: 'Kumo Basic (20 GB)', short: 'Kumo Basic',
    lead: 'Our most popular plan: 20 GB a month, and the data you do not use carries over to the next month.',
    body: `
<img class="photo" src="/assets/img/hero-phones.jpg" alt="Three people holding smartphones around a cafe table">
<dl class="spec"><div><dt>Monthly price</dt><dd>${yen(P.basic.price)}</dd></div><div><dt>Data</dt><dd>20 GB / month</dd></div><div><dt>After 20 GB</dt><dd>${P.basic.slow}</dd></div></dl>
<h2>Data carry-over</h2>
<p>Data you do not use in a month is added to the next month, up to 20 GB. Carried-over data is used first and expires at the end of the month it was carried into, so it can only be carried once.</p>
${table(['Month', 'Allowance', 'Carried over', 'Used', 'Left over'], [['August', '20 GB', '0 GB', '12 GB', '8 GB → carried to September'], ['September', '20 GB', '8 GB', '25 GB', '3 GB → carried to October'], ['October', '20 GB', '3 GB', '—', '—']], { caption: 'Example' })}
<p class="small">No carry-over is given for the month you sign up. Carry-over is lost if you change to another plan.</p>
<h2>After 20 GB</h2>
<p>Speeds are limited to <b>${P.basic.slow}</b>, which is enough for music streaming, maps and video calls at low quality. Extra data: 1 GB ${yen(DATA.gb1)}, 5 GB ${yen(DATA.gb5)} (valid ${DATA.validDays} days).</p>
<h2>Price with discounts</h2>
${table(['Lines in family group', 'Basic only', 'With home internet bundle', 'With home bundle + under-22'], [1, 2, 3, 4].map((n) => {
    const f = n === 1 ? 0 : DISC.family.basic[Math.min(n, 4) - 2];
    return [n === 4 ? '4 lines or more' : `${n} line${n > 1 ? 's' : ''}`, yen(P.basic.price - f), yen(P.basic.price - f - DISC.home.basic), yen(P.basic.price - f - DISC.home.basic - DISC.u22.basic)];
  }), { caption: 'Monthly price per Kumo Basic line' })}
<p class="small">The under-22 discount applies only to lines whose registered user is under 22. <a href="@/plans/index.html#u22">Conditions</a></p>
<h2>Fine print</h2>
${kome(['Tethering is allowed and counts towards your allowance.', 'During network congestion, video may be streamed at reduced quality.'])}${commonFine}`,
    related: ['plans/index.html', 'plans/unlimited.html', 'plans/options.html', 'procedures/change-plan.html'],
  },

  'plans/unlimited.html': {
    title: 'Kumo Unlimited', short: 'Kumo Unlimited',
    lead: 'Unlimited data on 5G and 4G, with an automatic discount in months you hardly use it.',
    body: `
<dl class="spec"><div><dt>Monthly price</dt><dd>${yen(P.unlimited.price)}</dd></div><div><dt>3 GB or less in a month</dt><dd>${yen(P.unlimited.price - P.unlimited.lowOff)}</dd></div><div><dt>Data</dt><dd>Unlimited</dd></div></dl>
${note('warn', `<p>From 1 December 2026 the monthly price becomes <b>${yen(P.unlimited.newPrice)}</b> (${yen(P.unlimited.newPrice - P.unlimited.lowOff)} in months of 3 GB or less). This applies to existing customers from December 2026 usage (billed in January 2027). <a href="@/news/price-revision-2026.html">Read the notice</a></p>`, 'Price revision')}
<h2>Low-use discount</h2>
<p>If you use ${P.unlimited.lowGb} GB or less in a billing month (1st to last day), ${yen(P.unlimited.lowOff)} is automatically taken off that month's price. You do not need to apply. Data used for tethering and roaming counts towards the 3 GB.</p>
<h2>Tethering</h2>
<p>You can share your connection with other devices (tethering) up to <b>${P.unlimited.tether} GB a month</b>. After that, tethering speed is limited to 300 kbps until the end of the month; data used on the phone itself stays unlimited.</p>
<h2>Free roaming in Asia and North America</h2>
<p>Each month, the first <b>${P.unlimited.worldFree} GB</b> of data used in the Asia and North America zones is free, with no need to buy a pass. After ${P.unlimited.worldFree} GB, buy a Kumo World day pass. See <a href="@/plans/roaming.html">International roaming</a>.</p>
<h2>Price with discounts</h2>
${table(['Lines in family group', 'Normal month', 'Normal month + home bundle', 'Month of 3 GB or less + home bundle'], [1, 2, 3, 4].map((n) => {
    const f = n === 1 ? 0 : DISC.family.unlimited[Math.min(n, 4) - 2];
    return [n === 4 ? '4 lines or more' : `${n} line${n > 1 ? 's' : ''}`, yen(P.unlimited.price - f), yen(P.unlimited.price - f - DISC.home.unlimited), yen(P.unlimited.price - f - DISC.home.unlimited - P.unlimited.lowOff)];
  }), { caption: 'Monthly price per Kumo Unlimited line (current prices)' })}
<p>Users under 22 get a further ${yen(DISC.u22.unlimited)} off. <a href="@/plans/index.html#u22">Conditions</a></p>
<h2>Fine print</h2>
${kome(['To keep the network fair for everyone, speeds may be limited during congestion for customers who use very large amounts of data in a short time (for example, more than 150 GB in 3 days).', 'Video streaming may be optimised during congestion.', 'Extra data purchases are not available or needed on this plan.'])}${commonFine}`,
    related: ['plans/index.html', 'plans/roaming.html', 'news/price-revision-2026.html'],
  },

  'plans/senior.html': {
    title: 'Kumo 65+ (for users aged 65 and over)', short: 'Kumo 65+',
    lead: 'A simple plan with 5 GB of data, free calls up to 10 minutes and the Watch Service included.',
    body: `
<img class="photo" src="/assets/img/senior-hands.jpg" alt="An older person's hands holding a smartphone in a living room">
<dl class="spec"><div><dt>Monthly price</dt><dd>${yen(P.senior.price)}</dd></div><div><dt>Data</dt><dd>5 GB / month</dd></div><div><dt>Calls</dt><dd>Free up to 10 min</dd></div></dl>
<h2>Who can apply</h2>
<p>The <b>registered user</b> must be aged 65 or over on the day of application. The contract holder can be someone else, for example a son or daughter who pays the bill. Bring an ID document showing the user's date of birth. When you change to Kumo 65+ from another plan, the user's age is checked again.</p>
<h2>What is included</h2>
<ul>
<li><b>Free domestic calls up to 10 minutes each.</b> After 10 minutes, a call is charged at ${yen(CALL.per30s)} per 30 seconds. Upgrade to unlimited calls for ${yen(CALL.seniorUpgrade)} a month.</li>
<li><b>5 GB of data.</b> After 5 GB, speed is limited to ${P.senior.slow}. Extra data: 1 GB ${yen(DATA.gb1)}.</li>
<li><b>Watch Service</b> (normally ${yen(OPT.watch)}/month): sends a daily message to up to 3 family members when the phone has not been used for 24 hours. Included free since 1 September 2026.</li>
<li><b>No paper bill fee.</b> The ${yen(209)} paper bill fee is waived.</li>
<li><b>Free smartphone classes</b> at many shops (booking required). See <a href="@/shops/harukawa-central.html">Kumo Shop Springvale Central</a>.</li>
</ul>
<h2>Discounts</h2>
<ul>
<li>Family discount: ${yen(DISC.family.senior[0])} a month whenever the family group has 2 or more lines (the amount does not increase with more lines).</li>
<li>Home internet bundle: ${yen(DISC.home.senior)} a month.</li>
<li>Under-22 discount: not applicable.</li>
</ul>
<p>Example: a Kumo 65+ line in a group of 3 lines with Kumo Hikari costs ${yen(P.senior.price)} − ${yen(DISC.family.senior[1])} − ${yen(DISC.home.senior)} = <b>${yen(P.senior.price - DISC.family.senior[1] - DISC.home.senior)}</b> a month.</p>
<h2>Fine print</h2>
${kome(['Free call minutes do not apply to calls to 0570 numbers, international calls or calls made while abroad.', 'Each call is timed separately; a call that lasts 12 minutes is charged for 2 minutes (¥88).', 'If the registered user is changed to someone under 65, the plan is changed to Kumo Basic from the following month.'])}${commonFine}`,
    related: ['plans/index.html', 'plans/options.html', 'shops/harukawa-central.html', 'procedures/transfer.html'],
  },

  'plans/options.html': {
    title: 'Options and Device Care', short: 'Options and Device Care',
    lead: 'Call options, extra data, device insurance and other services you can add to any plan.',
    body: `
<div class="toc"><p>On this page</p><ol><li><a href="#calls">Call options</a></li><li><a href="#data">Extra data</a></li><li><a href="#care">Kumo Device Care</a></li><li><a href="#other">Other options</a></li></ol></div>
<h2 id="calls">Call options</h2>
${table(['Option', 'Monthly fee', 'What it covers', 'Available on'], [
    ['Standard (no option)', '¥0', `Domestic calls ${yen(CALL.per30s)} per 30 seconds; SMS ${yen(CALL.sms)} per message`, 'All plans'],
    ['Kumo Talk 5', yen(CALL.talk5), 'Domestic calls free up to 5 minutes each; then ¥22 per 30 seconds', 'Mini, Basic, Unlimited'],
    ['Kumo Talk Unlimited', yen(CALL.talkAll), 'All domestic calls free', 'Mini, Basic, Unlimited'],
    ['Talk Unlimited for Kumo 65+', yen(CALL.seniorUpgrade), 'Replaces the 10-minute allowance with unlimited calls', 'Kumo 65+'],
  ])}
<p class="small">Call options are charged by the day in the month you add them and in full in the month you remove them. Changes take effect immediately.</p>
<h2 id="data">Extra data</h2>
${table(['Pack', 'Price', 'Valid for', 'Available on'], [['1 GB', yen(DATA.gb1), `${DATA.validDays} days`, 'Mini, Basic, 65+'], ['5 GB', yen(DATA.gb5), `${DATA.validDays} days`, 'Mini, Basic, 65+']])}
<p class="small">Buy in My Kumo (24 hours) or by calling ${'1580'} from your Kumo phone. Extra data is used after your plan's allowance and any carried-over data. Unused extra data is not refunded.</p>
<h2 id="care">Kumo Device Care</h2>
<img class="photo" src="/assets/img/cracked-screen.jpg" alt="A smartphone with a cracked screen on a repair mat">
<p>Insurance for accidental damage, water damage, breakdown and (Standard and Premium) loss and theft.</p>
${table(['', 'Light', 'Standard', 'Premium'], [
    ['Monthly fee', yen(CARE[0].fee), yen(CARE[1].fee), yen(CARE[2].fee)],
    ['Repair (per claim)', yen(CARE[0].repair), yen(CARE[1].repair), `${yen(0)} for the first claim, then ${yen(CARE[2].repairNext)}`],
    ['Replacement after loss or theft', 'Not covered', yen(CARE[1].replace), yen(CARE[2].replace)],
    ['Claims per 12 months', `${CARE[0].claims}`, `${CARE[1].claims}`, `${CARE[2].claims}`],
    ['Battery replacement', '—', '—', 'Free once, 24 months or more after enrolment'],
    ['Loaner phone during repair', 'Free', 'Free', 'Free'],
  ], { cls: 'compare' })}
<h3>Conditions</h3>
<ul class="fine">
<li>Enrol when you buy a device from Kumo or within 14 days of buying it. You cannot join later, and if you leave Device Care you cannot rejoin for the same device.</li>
<li>Devices you bring from elsewhere can join Light or Standard within 14 days of activation after an inspection at a Kumo shop (free).</li>
<li>For devices with a sale price over ${yen(CARE_HIGH.over)}, ${yen(CARE_HIGH.add)} is added to each monthly fee.</li>
<li>Claims for loss or theft need the police report receipt number. Scratches and cosmetic damage that do not affect use are not covered.</li>
<li>The 12-month claim count starts from the date of your first claim.</li>
</ul>
<p>How to claim: see <a href="@/procedures/repair.html">Repair and replacement</a>.</p>
<h2 id="other">Other options</h2>
${table(['Option', 'Monthly fee', 'Notes'], [
    ['Watch Service', yen(OPT.watch), 'Notifies up to 3 family members when the phone is not used for 24 hours. Free with Kumo 65+.'],
    ['Security Pack', yen(OPT.security), 'Scam-call warnings, nuisance-SMS filter, virus scan. First 31 days free.'],
    ['Number Keep', yen(OPT.numberKeep), `Keeps your phone number without service for up to ${OPT.numberKeepMonths} months (for example, while living abroad).`],
    ['Email Keep', yen(OPT.mailKeep), 'Keeps your @kumo.ne.jp email address after you cancel.'],
    ['Kumo Hikari (home fibre)', `${yen(OPT.hikari)} (house) / ${yen(OPT.hikariMansion)} (apartment)`, 'Gives the <a href="@/plans/index.html#home-bundle">home internet bundle</a> to your family lines.'],
  ])}`,
    related: ['plans/index.html', 'procedures/repair.html', 'procedures/lost-phone.html', 'billing/fees.html'],
  },

  'plans/roaming.html': {
    title: 'International roaming (Kumo World)', short: 'International roaming',
    lead: 'Use your Kumo phone and number abroad. Buy a 24-hour data pass or pay as you go, in about 180 countries and regions.',
    body: `
<img class="photo-wide" src="/assets/img/travel-roaming.jpg" alt="">
<h2>Rates by region</h2>
${table(['Zone', 'Main countries and regions', '24-hour data pass', 'Calls within the country (per min)', 'Calls to Japan (per min)', 'Receiving calls (per min)', 'SMS sent'], ROAM.map((z) => [
    { asia: 'Asia', na: 'North America', eu: 'Europe', oc: 'Oceania', mea: 'Middle East and Africa', la: 'Latin America', sea: 'Ships and aircraft' }[z.id],
    { asia: 'South Korea, Taiwan, Hong Kong, Macau, China, Thailand, Vietnam, Singapore, the Philippines, Malaysia, Indonesia', na: 'United States (including Hawaii, Guam and Saipan), Canada', eu: 'United Kingdom, France, Germany, Italy, Spain and 32 other countries', oc: 'Australia, New Zealand, Fiji', mea: 'United Arab Emirates, Türkiye, Egypt, South Africa and 18 others', la: 'Mexico, Brazil, Peru, Chile and 11 others', sea: 'Selected cruise ships and flights' }[z.id],
    z.pass ? yen(z.pass) + (z.newPass ? `<br><span class="small">${yen(z.newPass)} from 1 Dec 2026</span>` : '') : 'Not available',
    yen(z.local), yen(z.toJp), yen(z.recv), yen(z.sms),
  ]))}
<p class="small">Receiving SMS is free. Calls are charged per minute. Rates are not subject to discounts.</p>
<h2>Kumo World day pass</h2>
<ul>
<li>24 hours from the moment you first use data after buying it (in Japan time).</li>
<li>Up to ${ROAM_PASS.gb} GB of high-speed data per pass; then ${ROAM_PASS.slow} until the pass ends.</li>
<li>Buy it in My Kumo or the My Kumo app before or after you arrive. A pass bought for one zone cannot be used in another.</li>
<li>Kumo Unlimited: the first ${PLAN.unlimited.worldFree} GB each month in Asia and North America is free without a pass.</li>
</ul>
<h2>Without a pass (pay as you go)</h2>
<p>If data roaming is on and you have no pass, data is charged at ${yen(ROAM_PASS.perKb)} per KB. The charge is capped per day (Japan time):</p>
${table(['Zone', 'Daily cap'], [['Asia, North America, Europe, Oceania', yen(2980)], ['Middle East and Africa, Latin America', yen(4980)], ['Ships and aircraft', 'No cap']])}
${note('alert', '<p>On ships and aircraft there is no daily cap: one hour of video can cost more than ¥100,000. Turn off data roaming or use airplane mode on board.</p>', 'No cap on ships and aircraft')}
<h2>Before you travel</h2>
<ol>
<li>Check that international roaming is on in My Kumo (it is on by default for contracts since April 2023).</li>
<li>On your phone, turn data roaming <b>off</b> until you have bought a pass or decided to pay as you go.</li>
<li>Save the lost-phone number for calls from abroad: <b>+81-3-6300-0110</b> (charged, 24 hours).</li>
<li>Calls from other people to you while abroad are charged to you at the "receiving calls" rate.</li>
</ol>`,
    related: ['plans/unlimited.html', 'news/price-revision-2026.html', 'procedures/lost-phone.html', 'contact.html'],
  },
};
