// Shared interface text (English)
import { TEL } from '../shared.mjs';

export const ui = {
  siteName: 'Kumo Mobile Support',
  logoSub: 'Support',
  home: 'Home',
  skip: 'Skip to content',
  crumbLabel: 'Breadcrumb',
  navLabel: 'Main menu',
  otherLang: '日本語',
  search: 'Search',
  searchPh: 'Search support',
  myKumo: 'My Kumo login',
  related: 'Related pages',
  utilLeft: 'Personal',
  util: [['Service status', '@/status.html'], ['Find a shop', '@/shops/index.html'], ['Contact us', '@/contact.html']],
  nav: [
    ['Plans', '@/plans/index.html', [['Compare plans', '@/plans/index.html'], ['Kumo Mini (3 GB)', '@/plans/mini.html'], ['Kumo Basic (20 GB)', '@/plans/basic.html'], ['Kumo Unlimited', '@/plans/unlimited.html'], ['Kumo 65+', '@/plans/senior.html'], ['Options and Device Care', '@/plans/options.html'], ['International roaming', '@/plans/roaming.html']]],
    ['Procedures', '@/procedures/index.html', [['All procedures', '@/procedures/index.html'], ['Switch to Kumo (keep your number)', '@/procedures/switch-to-kumo.html'], ['New contract', '@/procedures/new-contract.html'], ['Change your plan', '@/procedures/change-plan.html'], ['Set up eSIM', '@/procedures/esim.html'], ['Insert a SIM card', '@/procedures/sim-card.html'], ['Check your data usage', '@/procedures/data-usage.html'], ['Lost or stolen phone', '@/procedures/lost-phone.html'], ['Repair and replacement', '@/procedures/repair.html'], ['Cancel your contract', '@/procedures/cancel.html'], ['Change name or address', '@/procedures/change-details.html'], ['Transfer a contract', '@/procedures/transfer.html']]],
    ['Billing', '@/billing/index.html', [['Payment methods and dates', '@/billing/index.html'], ['How to read your bill', '@/billing/read-your-bill.html'], ['Fees and charges', '@/billing/fees.html']]],
    ['Network', '@/network.html', [['Coverage and 5G', '@/network.html'], ['Service status', '@/status.html']]],
    ['Shops', '@/shops/index.html', [['Find a shop', '@/shops/index.html'], ['Kumo Shop Harukawa Central', '@/shops/harukawa-central.html'], ['Book an appointment', '@/shops/appointments.html']]],
    ['Help', '@/faq.html', [['Frequently asked questions', '@/faq.html'], ['Contact us', '@/contact.html'], ['Forms and downloads', '@/forms/index.html'], ['Notices', '@/news/index.html'], ['About My Kumo', '@/my-kumo.html']]],
  ],
  side: `<a class="promo promo-a" href="@/plans/index.html#home-bundle"><span class="ad">PR</span><b>Phone + home internet</b>Bundle Kumo Hikari and save up to ¥1,100 a month on every phone line in your family.</a>
<a class="promo promo-b" href="@/plans/options.html#care"><span class="ad">PR</span><b>Cracked screen?</b>Kumo Device Care from ¥550/month. Repairs from ¥0 with Premium.</a>
<a class="promo promo-c" href="@/plans/senior.html"><span class="ad">PR</span><b>Kumo 65+</b>5 GB and free 10-minute calls for ¥2,728. Watch Service now included.</a>
<div class="side-box"><h3>Need help?</h3><p>Information Center<br><b>${TEL.info.free}</b> (free)<br>From a Kumo phone: <b>${TEL.info.short}</b><br><span class="small">${TEL.info.hours[0]}:00–${TEL.info.hours[1]}:00 every day</span></p><p>Lost or stolen phone (24 hours)<br><b>${TEL.lost.free}</b></p><p><a href="@/contact.html">All contact numbers ›</a></p></div>`,
  helpful: `<div class="helpful">Was this page helpful? <button type="button">Yes</button><button type="button">No</button></div>`,
  footer: `<div class="ftr-cols">
<div><h3>Plans and services</h3><ul><li><a href="@/plans/index.html">Compare plans</a></li><li><a href="@/plans/mini.html">Kumo Mini</a></li><li><a href="@/plans/basic.html">Kumo Basic</a></li><li><a href="@/plans/unlimited.html">Kumo Unlimited</a></li><li><a href="@/plans/senior.html">Kumo 65+</a></li><li><a href="@/plans/options.html">Options and Device Care</a></li><li><a href="@/plans/roaming.html">International roaming</a></li></ul></div>
<div><h3>Procedures</h3><ul><li><a href="@/procedures/switch-to-kumo.html">Switch to Kumo</a></li><li><a href="@/procedures/new-contract.html">New contract</a></li><li><a href="@/procedures/change-plan.html">Change your plan</a></li><li><a href="@/procedures/esim.html">eSIM setup</a></li><li><a href="@/procedures/lost-phone.html">Lost or stolen phone</a></li><li><a href="@/procedures/cancel.html">Cancel your contract</a></li><li><a href="@/procedures/index.html">All procedures</a></li></ul></div>
<div><h3>Billing</h3><ul><li><a href="@/billing/index.html">Payment methods</a></li><li><a href="@/billing/read-your-bill.html">How to read your bill</a></li><li><a href="@/billing/fees.html">Fees and charges</a></li></ul><h3 style="margin-top:14px">Network</h3><ul><li><a href="@/network.html">Coverage and 5G</a></li><li><a href="@/status.html">Service status</a></li></ul></div>
<div><h3>Shops</h3><ul><li><a href="@/shops/index.html">Find a shop</a></li><li><a href="@/shops/harukawa-central.html">Harukawa Central</a></li><li><a href="@/shops/appointments.html">Book an appointment</a></li></ul></div>
<div><h3>Help</h3><ul><li><a href="@/faq.html">FAQ</a></li><li><a href="@/contact.html">Contact us</a></li><li><a href="@/forms/index.html">Forms and downloads</a></li><li><a href="@/forms/checklist.html">What to bring checklist</a></li><li><a href="@/news/index.html">Notices</a></li><li><a href="@/my-kumo.html">About My Kumo</a></li><li><a href="@/search.html">Search</a></li></ul></div>
</div>
<div class="ftr-bottom"><span>© 2026 Kumo Mobile Corporation. All prices include consumption tax (10%) unless stated otherwise.</span><span>Telecommunications carrier registration No. 412</span></div>`,
  fictional: 'Fictional website made for research (UniLens user study).',
  cookie: 'We use cookies to improve your experience and to measure how our support pages are used. By continuing to browse, you agree to our use of cookies.',
  cookieOk: 'Accept',
  chat: {
    label: 'Open chat support',
    btn: 'Chat',
    panel: `<div class="chat-h">Kumo Support Chat <button type="button" class="chat-close" aria-label="Close">×</button></div>
<div class="chat-b"><div class="chat-msg">Hello! I'm the Kumo support assistant. Choose a topic or type your question. Chat with a person is available 9:00–21:00 every day.</div>
<ul><li><a href="@/procedures/switch-to-kumo.html">Switching to Kumo</a></li><li><a href="@/billing/read-your-bill.html">My bill</a></li><li><a href="@/procedures/lost-phone.html">Lost phone</a></li><li><a href="@/procedures/esim.html">eSIM</a></li><li><a href="@/faq.html">FAQ</a></li></ul></div>
<form class="chat-f"><input type="text" placeholder="Type a message" aria-label="Message"><button type="submit" class="btn" style="padding:6px 12px">Send</button></form>`,
  },
};
