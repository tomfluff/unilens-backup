// Network and service status (English)
import { PREF, NATIONAL_5G, MUNI, SPEED, MONTHS, COLORS, TEL, table, note, figure, coverageMap, lineChart } from '../shared.mjs';

const speeds = lineChart({
  title: 'Average download speed (Mbps)', standalone: true,
  series: [{ name: '5G', color: COLORS.g5, pts: SPEED.g5.map((v, i) => [i, v]) }, { name: '4G', color: COLORS.g4, pts: SPEED.g4.map((v, i) => [i, v]) }],
  xMax: 11, xTicks: [...Array(12).keys()], xFmt: (i) => MONTHS.en[i], yMax: 400, yStep: 100, yFmt: (v) => v,
  xTitle: 'Oct 2025 – Sep 2026', note: 'Kumo measurements, all areas, median of daily tests',
});
export const files = { 'assets/charts/speeds-en.svg': speeds };

const MMW = { yes: 'Yes (city centres)', sapporo: 'Sapporo only', sendai: 'Sendai only', nagoya: 'Nagoya only', harukawa: 'Around Springvale Central Station', kyoto: 'Kyoto city centre', hiroshima: 'Hiroshima city centre', fukuoka: 'Fukuoka and Kitakyushu', naha: 'Naha only' };

export const pages = {
  'network.html': {
    title: 'Coverage and 5G', short: 'Coverage and 5G',
    lead: 'Kumo 5G covers 95.6% of the population of Japan. Check the coverage map for Harvest Prefecture and 5G coverage by prefecture.',
    updated: 'Coverage figures as of 30 September 2026',
    body: `
<h2>Coverage map: Harvest Prefecture</h2>
${figure(coverageMap({ title: 'Kumo coverage map of Harvest Prefecture', harukawa: 'Springvale', port: 'Ferry Port', onsen: 'Moonview Spa', mikage: 'Mikage', hanaoka: 'Hanaoka', shiose: 'Shiose', mountain: 'Mt Moonview (1,214 m)', bay: 'Harvest Bay', river: 'Mirror River', g5: '5G', planned: '5G planned by March 2027', g4: '4G', limited: 'Limited coverage (mountains)', kagami: 'Vale Rail Mirror Line', bayside: 'Vale Rail Bayside Line', neighbour: 'Neighbouring prefectures' }), 'Outdoor coverage. Indoors, underground and in valleys the signal may be weaker. The map is a guide and does not guarantee service.')}
<p>Along the Mirror Line, 5G is available from Springvale Central to the middle of the valley; the section towards Moonview Spa is 4G, with 5G work planned for completion by March 2027. Around the summit of Mount Moonview and in the north-east mountains, coverage is limited even on 4G.</p>
<h2>5G coverage in Harvest Prefecture</h2>
${table(['Municipality', '5G population coverage now', 'Target (March 2027)'], MUNI.map(([en, , now, target]) => [en, `${now.toFixed(1)}%`, `${target.toFixed(1)}%`]))}
<h2>5G coverage by prefecture</h2>
${table(['Prefecture', '5G population coverage', 'Change since Sep 2025', '5G base stations', 'Millimetre wave (n257)'], [...PREF.map(([en, , cov, ch, sites, mm]) => Object.assign([en, `${cov.toFixed(1)}%`, `+${ch.toFixed(1)} pts`, sites.toLocaleString('en-US'), mm ? MMW[mm] : '—'], en === 'Harvest' ? { cls: 'hl' } : {})), Object.assign(['All Japan (47 prefectures)', `${NATIONAL_5G}%`, '+2.4 pts', '118,560', '—'], { cls: 'hl' })], { caption: 'Selected prefectures. Population coverage = share of residents living in areas with 5G outdoors.' })}
<h2>Network speed</h2>
<figure class="fig"><img src="/assets/charts/speeds-en.svg" alt="graph" width="680" height="330"></figure>
<p>Speeds depend on the area, the time of day, your device and how many people are connected. They dipped in March 2026 during the spring moving season and in July 2026 during summer events.</p>
<h2>Frequencies</h2>
${table(['Network', 'Bands', 'Notes'], [['5G', 'n77, n78 (Sub-6), n257 (millimetre wave)', 'Millimetre wave works only near the antenna and in line of sight'], ['4G LTE', 'Bands 1, 3, 8, 28', 'Band 8 and 28 reach further and inside buildings'], ['3G', 'Band 1', '<b>Ends on 31 March 2027.</b> <a href="@/news/3g-service-end.html">Details</a>']])}
${note('info', `<p>Poor signal at home or work? Report it in My Kumo (Support → Signal problems) or call Technical Support on ${TEL.tech.free} (${TEL.tech.hours[0]}:00–${TEL.tech.hours[1]}:00). We may visit to measure the signal, free of charge.</p>`)}`,
    related: ['status.html', 'news/3g-service-end.html', 'plans/unlimited.html'],
  },

  'status.html': {
    title: 'Service status', short: 'Service status',
    lead: 'Current network problems and planned maintenance.',
    updated: 'Last updated: 4 October 2026, 10:15',
    body: `
<div class="status-strip"><span><span class="dot dot-bad"></span><b>1 incident</b> in Harvest Prefecture</span><span><span class="dot dot-warn"></span><b>1 issue</b> with My Kumo app</span><span><span class="dot dot-ok"></span>All other services normal</span></div>
<h2>Current incidents</h2>
${table(['Started', 'Area', 'Services affected', 'Details', 'Status'], [
    ['4 Oct 2026, 08:52', 'Harvest Prefecture: Springvale City (Ekimae-dōri, Kitamachi, around Springvale Central Station)', '5G data', 'Mobile data on 5G may be slow or fail to connect. 4G data, calls and SMS are not affected. Turning 5G off on your phone may help.', '<span class="st st-inv">Investigating</span>'],
    ['3 Oct 2026, 21:10', 'All areas', 'My Kumo app (Android)', 'Some Android users cannot log in to the My Kumo app (version 8.4.0). Please use My Kumo on the web.', '<span class="st st-fix">Fix in progress</span>'],
  ])}
<h2>Resolved in the last 7 days</h2>
${table(['Period', 'Area', 'Services affected', 'Cause'], [
    ['30 Sep 2026, 14:05–16:40', 'Harvest Prefecture: parts of Moonview Town', 'Calls, SMS and data', 'Power cut at a base station after heavy rain'],
    ['28 Sep 2026, 02:10–03:00', 'All areas', 'SMS delivery delays', 'Equipment fault'],
    ['27 Sep 2026, 11:30–12:15', 'Hokkaido: parts of Sapporo', '5G data', 'Equipment fault'],
  ])}
<h2 id="maintenance">Planned maintenance</h2>
${table(['Date and time', 'Area', 'Services affected', 'Details'], [
    ['Thu 8 Oct 2026, 01:00–06:00', 'All areas', 'My Kumo (web and app)', 'All online procedures unavailable, including line suspension, data purchases and bill viewing. To suspend a lost phone, call the Lost and Stolen line.'],
    ['Wed 14 Oct 2026, 01:00–05:00', 'Harvest Prefecture: Moonview Town, Shiose Village', 'Calls, SMS and data (5G and 4G)', 'Service may stop for up to 10 minutes at a time. <b>Emergency calls may also be unavailable during these breaks.</b>'],
    ['Wed 21 Oct 2026, 02:00–04:00', 'All areas', 'SMS', 'Messages may be delivered late.'],
    ['Tue 27 Oct 2026, 00:30–05:30', 'Harvest Prefecture: along the Mirror Line between Springvale City and Moonview Town', 'Data (5G)', 'Base station upgrade for 5G expansion. 5G may switch to 4G for several minutes at a time.'],
    ['Thu 5 Nov 2026, 00:00–03:00', 'All areas', 'Card payments in My Kumo', 'Bill payment by credit card in My Kumo is unavailable.'],
  ])}
<p>See also: <a href="@/news/maintenance-october-2026.html">Notice of maintenance in October 2026</a>.</p>
${note('info', `<p>No incident listed but no signal? Restart your phone and check the <a href="@/procedures/sim-card.html">troubleshooting steps</a>. Then call Technical Support (${TEL.tech.free}).</p>`)}`,
    related: ['network.html', 'news/maintenance-october-2026.html', 'contact.html'],
  },
};
