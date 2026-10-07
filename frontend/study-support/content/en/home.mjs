// Home page (English)
import { PLAN, TEL, yen, cards } from '../shared.mjs';
import { NEWS, newsList } from './news.mjs';

const slide = (img, kicker, title, text, href, cta, on) => `<div class="slide${on ? ' on' : ''}"><img src="/assets/img/${img}.jpg" alt=""><div class="slide-txt"><span class="kicker">${kicker}</span><h2>${title}</h2><p>${text}</p><a class="btn" href="${href}">${cta}</a></div></div>`;

export const pages = {
  'index.html': {
    title: 'Kumo Mobile Support', wide: true, noH1: true,
    desc: 'Help with plans, procedures, bills, network and shops for Kumo Mobile customers.',
    hero: `<section class="hero"><div class="carousel">
${slide('travel-roaming', 'NOTICE', 'Kumo Unlimited prices from 1 December', `Kumo Unlimited becomes ${yen(PLAN.unlimited.newPrice)} a month, and the Asia day pass ¥1,080. See what changes for you.`, '@/news/price-revision-2026.html', 'Read the notice', true)}
${slide('hero-phones', 'SAFETY', 'Fake "Kumo" text messages are increasing', 'Kumo will never ask for your password or card number by SMS. Learn how to spot scam messages.', '@/news/scam-sms-warning.html', 'How to stay safe')}
${slide('station-shop', 'SPRINGVALE LANTERN FESTIVAL', 'Springvale Central shop open until 21:00', 'On Saturday 10 and Sunday 11 October. Book ahead to avoid waiting.', '@/shops/harukawa-central.html', 'Shop information')}
<button type="button" class="arrow prev" aria-label="Previous">‹</button><button type="button" class="arrow next" aria-label="Next">›</button>
<div class="dots"><button type="button" class="on" aria-label="Slide 1"></button><button type="button" aria-label="Slide 2"></button><button type="button" aria-label="Slide 3"></button></div>
</div></section>`,
    body: `
<h1 class="h1" style="border:0;margin:6px 0 0;padding:0;font-size:22px">Kumo Mobile Support</h1>
<div class="status-strip"><b>Service status</b><span><span class="dot dot-bad"></span>5G data slow around Springvale Central Station (investigating)</span><span><span class="dot dot-warn"></span>My Kumo app login errors on Android</span><span><span class="dot dot-ok"></span>Other services normal</span><a href="@/status.html">Details ›</a></div>
<div class="home-search"><b>How can we help?</b><form action="@/search.html"><input type="search" name="q" placeholder="e.g. eSIM, family discount, cancel" aria-label="Search support"><button class="btn" type="submit">Search</button></form>
<div class="kw">Popular: <a href="@/search.html?q=eSIM">eSIM</a><a href="@/search.html?q=family%20discount">family discount</a><a href="@/search.html?q=MNP">MNP</a><a href="@/search.html?q=paper%20bill">paper bill</a><a href="@/search.html?q=roaming">roaming</a></div></div>
<div class="home-grid"><div>
<div class="panel"><h2>Popular procedures</h2>
${cards([['@/procedures/switch-to-kumo.html', 'Switch to Kumo', 'Keep your number', 'switch'], ['@/procedures/esim.html', 'Set up eSIM', 'iPhone and Android', 'esim'], ['@/procedures/change-plan.html', 'Change your plan', 'Free, from next month', 'plan'], ['@/procedures/data-usage.html', 'Check data usage', 'My Kumo, SMS', 'data'], ['@/procedures/lost-phone.html', 'Lost or stolen phone', 'Suspend now, 24 hours', 'lost'], ['@/procedures/repair.html', 'Repair', 'Device Care claims', 'repair'], ['@/billing/read-your-bill.html', 'Read your bill', 'Item by item', 'bill'], ['@/procedures/cancel.html', 'Cancel', 'Fees and timing', 'cancel']])}
</div>
<div class="panel"><h2>Notices</h2>${newsList(NEWS.slice(0, 6))}<p style="margin:10px 0 0;font-size:12.5px"><a href="@/news/index.html">All notices ›</a></p></div>
</div><div>
<div class="panel"><h2>Plans</h2><ul style="padding-left:18px;font-size:13px;margin:0">
<li><a href="@/plans/mini.html">Kumo Mini</a> 3 GB · ${yen(PLAN.mini.price)}</li><li><a href="@/plans/basic.html">Kumo Basic</a> 20 GB · ${yen(PLAN.basic.price)}</li><li><a href="@/plans/unlimited.html">Kumo Unlimited</a> · ${yen(PLAN.unlimited.price)}</li><li><a href="@/plans/senior.html">Kumo 65+</a> 5 GB · ${yen(PLAN.senior.price)}</li></ul>
<p style="margin:10px 0 0;font-size:12.5px"><a href="@/plans/index.html">Compare plans and discounts ›</a></p></div>
<a class="promo promo-b" href="@/plans/index.html#family"><span class="ad">PR</span><b>Family discount</b>Up to ¥1,210 off every line, every month, for families of 4 or more.</a>
<a class="promo promo-c" href="@/plans/roaming.html"><span class="ad">PR</span><b>Travelling abroad?</b>Kumo World day passes from ¥980 in Asia.</a>
<div class="panel"><h2>Contact</h2><p style="font-size:12.5px;margin:0 0 6px">Information Center <b>${TEL.info.free}</b><br>${TEL.info.hours[0]}:00–${TEL.info.hours[1]}:00 every day</p><p style="font-size:12.5px;margin:0 0 6px">Lost or stolen (24 h) <b>${TEL.lost.free}</b></p><p style="font-size:12.5px;margin:0"><a href="@/contact.html">All numbers</a> · <a href="@/shops/index.html">Find a shop</a> · <a href="@/faq.html">FAQ</a></p></div>
</div></div>`,
  },
};
