// Springvale Railway: the railway's facts. Everything on the site (timetables,
// planner, fares, station pages) is generated from this file, so they agree.

export const TODAY = { iso: '2026-10-04', en: 'Sun 4 Oct 2026', ja: '2026年10月4日（日）', time: '14:20' };

export const lines = {
  K: { en: 'Mirror Line', ja: '鏡線', color: '#12925c', km: 38.6,
    dirs: { d: { en: 'Northbound (for Moonview Spa)', ja: '下り（月見温泉方面）', short: { en: 'for Moonview Spa', ja: '月見温泉方面' }, slug: 'north' },
            u: { en: 'Southbound (for Springvale Central)', ja: '上り（春川中央方面）', short: { en: 'for Springvale Central', ja: '春川中央方面' }, slug: 'south' } } },
  B: { en: 'Bayside Line', ja: '湾岸線', color: '#1874c4', km: 16.2,
    dirs: { d: { en: 'Eastbound (for Ferry Port)', ja: '下り（みのり港方面）', short: { en: 'for Ferry Port', ja: 'みのり港方面' }, slug: 'east' },
            u: { en: 'Westbound (for Springvale Central)', ja: '上り（春川中央方面）', short: { en: 'for Springvale Central', ja: '春川中央方面' }, slug: 'west' } } },
};

// access: per platform, step-free route: lift | ramp | level | stairs
// staff: staffed hours text; office: ticket office hours (null = none)
export const stations = [
  { id: 'central', codes: ['K01', 'B01'], en: 'Springvale Central', romaji: 'Harukawa Central', ja: '春川中央', kana: 'はるかわちゅうおう', km: { K: 0, B: 0 }, major: true,
    staff: { en: 'Staffed from first to last train', ja: '始発から終電まで駅係員がいます' },
    office: { en: '6:00–22:00 (Comet reservations 5:30–23:00)', ja: '6:00〜22:00（特急「月影」の予約は5:30〜23:00）' },
    access: { 1: 'lift', 2: 'lift', 3: 'lift', 5: 'lift', 6: 'lift' },
    toilets: 'multi', lockers: 180, charge: true, wifi: true, waiting: true, aed: true, shops: true, ridership: 38420,
    address: { en: '1-1 Station Square, Springvale', ja: '春川市駅前町1-1' } },
  { id: 'shiromachi', codes: ['K02'], en: 'Castle Town', romaji: 'Shiromachi', ja: '城町', kana: 'しろまち', km: { K: 1.8 }, major: true,
    staff: { en: 'Staffed 6:00–22:00', ja: '6:00〜22:00 係員在駅' },
    office: { en: '7:00–20:00', ja: '7:00〜20:00' },
    access: { 1: 'lift', 2: 'lift' }, liftOut: { platform: 1, until: { en: '23 Oct 2026', ja: '2026年10月23日' } },
    toilets: 'multi', lockers: 40, charge: true, wifi: true, waiting: false, aed: true, shops: true, ridership: 9860,
    address: { en: '3-2 Castle Gate, Springvale', ja: '春川市大手町3-2' } },
  { id: 'daigakumae', codes: ['K03'], en: 'University Gate', romaji: 'Harukawa Daigaku-mae', ja: '春川大学前', kana: 'はるかわだいがくまえ', km: { K: 3.6 }, major: true,
    staff: { en: 'Staffed 6:30–21:30', ja: '6:30〜21:30 係員在駅' },
    office: { en: 'Weekdays 7:30–19:00 (closed Sat, Sun, holidays)', ja: '平日7:30〜19:00（土休日は休業）' },
    access: { 1: 'lift', 2: 'lift' },
    toilets: 'multi', lockers: 20, charge: true, wifi: true, waiting: false, aed: true, shops: true, ridership: 12310,
    address: { en: '2-10 College Road, Springvale', ja: '春川市学園通2-10' } },
  { id: 'kawabata', codes: ['K04'], en: 'Riverside', romaji: 'Kawabata', ja: '川端', kana: 'かわばた', km: { K: 5.9 },
    staff: { en: 'Staffed 6:30–20:00', ja: '6:30〜20:00 係員在駅' }, office: null,
    access: { 1: 'lift', 2: 'lift' }, island: true,
    toilets: 'multi', lockers: 0, charge: true, wifi: false, waiting: false, aed: true, shops: false, ridership: 4120 },
  { id: 'yanagihara', codes: ['K05'], en: 'Elmwood', romaji: 'Yanagihara', ja: '柳原', kana: 'やなぎはら', km: { K: 8.2 },
    staff: { en: 'Staffed 7:00–19:00', ja: '7:00〜19:00 係員在駅' }, office: null,
    access: { 1: 'lift', 2: 'lift' },
    toilets: 'multi', lockers: 0, charge: true, wifi: false, waiting: true, aed: true, shops: true, ridership: 3540 },
  { id: 'nishiharuno', codes: ['K06'], en: 'West Meadow', romaji: 'Nishi-Haruno', ja: '西春野', kana: 'にしはるの', km: { K: 10.7 },
    staff: { en: 'Staffed weekdays 7:00–10:00 only', ja: '平日7:00〜10:00のみ係員在駅' }, office: null,
    access: { 1: 'stairs', 2: 'level' },
    toilets: 'basic', lockers: 0, charge: true, wifi: false, waiting: false, aed: true, shops: false, ridership: 2180 },
  { id: 'kamano', codes: ['K07'], en: 'Clayfield', romaji: 'Kamano', ja: '釜野', kana: 'かまの', km: { K: 13.5 }, major: true,
    staff: { en: 'Staffed 6:00–22:00', ja: '6:00〜22:00 係員在駅' },
    office: { en: '7:00–19:00', ja: '7:00〜19:00' },
    access: { 1: 'lift', 2: 'lift', 3: 'lift' },
    toilets: 'multi', lockers: 24, charge: true, wifi: true, waiting: true, aed: true, shops: true, ridership: 3960,
    address: { en: '588 Clayfield, Springvale', ja: '春川市釜野588' } },
  { id: 'otsuka', codes: ['K08'], en: 'Hilltop', romaji: 'Ōtsuka', ja: '大塚', kana: 'おおつか', km: { K: 16.4 },
    staff: { en: 'Unstaffed', ja: '無人駅' }, office: null,
    access: { 1: 'ramp', 2: 'ramp' },
    toilets: 'basic', lockers: 0, charge: false, wifi: false, waiting: true, aed: false, shops: false, ridership: 1240 },
  { id: 'yuzuhara', codes: ['K09'], en: 'Citrus Grove', romaji: 'Yuzuhara', ja: '柚子原', kana: 'ゆずはら', km: { K: 19.8 },
    staff: { en: 'Staffed weekdays 7:00–18:00', ja: '平日7:00〜18:00 係員在駅' }, office: null,
    access: { 1: 'stairs', 2: 'level' },
    toilets: 'basic', lockers: 0, charge: true, wifi: false, waiting: true, aed: true, shops: false, ridership: 980 },
  { id: 'kagamikyo', codes: ['K10'], en: 'Red Canyon', romaji: 'Kagami-kyō', ja: '鏡峡', kana: 'かがみきょう', km: { K: 23.6 },
    staff: { en: 'Staffed 7:00–19:00', ja: '7:00〜19:00 係員在駅' },
    office: { en: '8:00–17:00', ja: '8:00〜17:00' },
    access: { 1: 'lift', 2: 'lift' },
    toilets: 'multi', lockers: 12, charge: true, wifi: true, waiting: true, aed: true, shops: true, ridership: 1610 },
  { id: 'nakazawa', codes: ['K11'], en: 'Mill Creek', romaji: 'Nakazawa', ja: '中沢', kana: 'なかざわ', km: { K: 27.1 },
    staff: { en: 'Unstaffed', ja: '無人駅' }, office: null,
    access: { 1: 'stairs', 2: 'level' },
    toilets: 'basic', lockers: 0, charge: false, wifi: false, waiting: true, aed: false, shops: false, ridership: 310 },
  { id: 'hotarudani', codes: ['K12'], en: 'Firefly Valley', romaji: 'Hotarudani', ja: '蛍谷', kana: 'ほたるだに', km: { K: 30.4 },
    staff: { en: 'Unstaffed', ja: '無人駅' }, office: null,
    access: { 1: 'level' }, single: true,
    toilets: 'none', lockers: 0, charge: false, wifi: false, waiting: true, aed: false, shops: false, ridership: 190 },
  { id: 'tsukimiguchi', codes: ['K13'], en: 'Trailhead', romaji: 'Tsukimi-guchi', ja: '月見口', kana: 'つきみぐち', km: { K: 34.9 },
    staff: { en: 'Staffed 7:00–17:00', ja: '7:00〜17:00 係員在駅' }, office: null,
    access: { 1: 'ramp', 2: 'ramp' }, island: true,
    toilets: 'multi', lockers: 0, charge: true, wifi: false, waiting: true, aed: true, shops: false, ridership: 420 },
  { id: 'tsukimionsen', codes: ['K14'], en: 'Moonview Spa', romaji: 'Tsukimi Onsen', ja: '月見温泉', kana: 'つきみおんせん', km: { K: 38.6 }, major: true,
    staff: { en: 'Staffed 5:00–22:30', ja: '5:00〜22:30 係員在駅' },
    office: { en: '6:30–20:30', ja: '6:30〜20:30' },
    access: { 1: 'level', 2: 'level' },
    toilets: 'multi', lockers: 60, charge: true, wifi: true, waiting: true, aed: true, shops: true, ridership: 2870,
    address: { en: '1 Spa Road, Moonview, Springvale', ja: '春川市月見湯元1' } },
  { id: 'honmachi', codes: ['B02'], en: 'Bridge Street', romaji: 'Honmachi', ja: '本町', kana: 'ほんまち', km: { B: 1.5 },
    staff: { en: 'Staffed from first to last train', ja: '始発から終電まで係員在駅' }, office: null,
    access: { 1: 'lift', 2: 'lift' },
    toilets: 'multi', lockers: 0, charge: true, wifi: true, waiting: false, aed: true, shops: true, ridership: 7640 },
  { id: 'ichiba', codes: ['B03'], en: 'Market Square', romaji: 'Ichiba', ja: '市場', kana: 'いちば', km: { B: 3.2 },
    staff: { en: 'Staffed 5:30–23:30', ja: '5:30〜23:30 係員在駅' }, office: null,
    access: { 1: 'lift', 2: 'lift' },
    toilets: 'multi', lockers: 16, charge: true, wifi: false, waiting: false, aed: true, shops: true, ridership: 5920 },
  { id: 'shinkodori', codes: ['B04'], en: 'Pier Road', romaji: 'Shinkō-dōri', ja: '新港通', kana: 'しんこうどおり', km: { B: 5.0 },
    staff: { en: 'Staffed 6:00–22:00', ja: '6:00〜22:00 係員在駅' }, office: null,
    access: { 1: 'lift', 2: 'lift' }, island: true,
    toilets: 'multi', lockers: 0, charge: true, wifi: false, waiting: false, aed: true, shops: true, ridership: 4380 },
  { id: 'kaigan', codes: ['B05'], en: 'Seafront', romaji: 'Kaigan', ja: '海岸', kana: 'かいがん', km: { B: 7.1 },
    staff: { en: 'Staffed 7:00–20:00', ja: '7:00〜20:00 係員在駅' }, office: null,
    access: { 1: 'level', 2: 'lift' },
    toilets: 'multi', lockers: 0, charge: true, wifi: false, waiting: true, aed: true, shops: false, ridership: 2960 },
  { id: 'minorikoen', codes: ['B06'], en: 'Rose Garden', romaji: 'Minori-kōen', ja: 'みのり公園', kana: 'みのりこうえん', km: { B: 9.0 },
    staff: { en: 'Staffed 6:00–22:00', ja: '6:00〜22:00 係員在駅' },
    office: { en: 'Sat, Sun and holidays 9:00–17:00', ja: '土休日9:00〜17:00' },
    access: { 1: 'lift', 2: 'lift', 3: 'lift' },
    toilets: 'multi', lockers: 24, charge: true, wifi: true, waiting: true, aed: true, shops: true, ridership: 3310 },
  { id: 'shiohama', codes: ['B07'], en: 'Tidewater', romaji: 'Shiohama', ja: '汐浜', kana: 'しおはま', km: { B: 11.3 },
    staff: { en: 'Unstaffed', ja: '無人駅' }, office: null,
    access: { 1: 'stairs', 2: 'level' },
    toilets: 'basic', lockers: 0, charge: false, wifi: false, waiting: true, aed: true, shops: false, ridership: 1470 },
  { id: 'hamanaka', codes: ['B08'], en: 'Lighthouse', romaji: 'Hamanaka', ja: '浜中', kana: 'はまなか', km: { B: 13.6 },
    staff: { en: 'Unstaffed', ja: '無人駅' }, office: null,
    access: { 1: 'level' }, single: true,
    toilets: 'none', lockers: 0, charge: false, wifi: false, waiting: true, aed: false, shops: false, ridership: 690 },
  { id: 'minoriport', codes: ['B09'], en: 'Ferry Port', romaji: 'Minori Port', ja: 'みのり港', kana: 'みのりこう', km: { B: 16.2 }, major: true,
    staff: { en: 'Staffed 5:20–23:40', ja: '5:20〜23:40 係員在駅' },
    office: { en: '6:30–20:00', ja: '6:30〜20:00' },
    access: { 1: 'level', 2: 'level' },
    toilets: 'multi', lockers: 30, charge: true, wifi: true, waiting: true, aed: true, shops: true, ridership: 4050,
    address: { en: '4-1 Harbor Street, Springvale', ja: '春川市港町4-1' } },
];
export const byId = Object.fromEntries(stations.map(s => [s.id, s]));
export const lineStations = {
  K: stations.filter(s => s.km.K !== undefined).map(s => s.id),
  B: stations.filter(s => s.km.B !== undefined).map(s => s.id),
};

// Platforms used by departures (line, direction, type) at each station. Default: d=1, u=2.
export function platformOf(st, line, dir, type, origin) {
  if (st === 'central') return line === 'B' ? (dir === 'd' ? 5 : 6) : (type === 'X' ? 3 : (dir === 'd' ? 1 : 2)); // arrivals: 2 and 6
  if (st === 'tsukimionsen') return type === 'X' ? 1 : 2;
  if (st === 'minoriport') return dir === 'd' ? 2 : 1; // arrive on 2, depart from 1
  if (st === 'kamano' && dir === 'u') return origin === 'kamano' ? 3 : 2; // trains starting at Clayfield use platform 3
  if (st === 'minorikoen' && dir === 'u') return origin === 'minorikoen' ? 3 : 2;
  if (byId[st].single) return 1;
  return dir === 'd' ? 1 : 2;
}

// Running patterns: stops and cumulative minutes from the southern/western terminus.
export const patterns = {
  K: {
    L: { stops: lineStations.K, cum: [0, 3, 6, 10, 14, 18, 23, 28, 33, 39, 45, 50, 57, 63] },
    R: { stops: ['central', 'shiromachi', 'daigakumae', 'yanagihara', 'kamano', 'yuzuhara', 'kagamikyo', 'nakazawa', 'hotarudani', 'tsukimiguchi', 'tsukimionsen'], cum: [0, 3, 6, 12, 19, 26, 31, 37, 42, 49, 55] },
    X: { stops: ['central', 'shiromachi', 'kamano', 'kagamikyo', 'tsukimionsen'], cum: [0, 3, 15, 25, 39] },
  },
  B: { L: { stops: lineStations.B, cum: [0, 3, 6, 9, 13, 16, 20, 24, 28] } },
};

export const types = {
  L: { en: 'Local', ja: '普通', mark: { en: '', ja: '' } },
  R: { en: 'Rapid', ja: '快速', mark: { en: 'R', ja: '快' } },
  X: { en: 'Ltd. Exp. Comet', ja: '特急「月影」', mark: { en: '◆', ja: '◆' } },
};

const t = s => s.split(/\s+/).filter(Boolean);
const every = (from, to, step) => { const out = []; const m = x => { const [h, mm] = x.split(':').map(Number); return h * 60 + mm; };
  for (let v = m(from); v <= m(to); v += step) out.push(`${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`); return out; };

// Service plan: [line, dir, type, origin, destination, departure times at origin]
export const services = {
  wd: [
    ['K', 'd', 'L', 'central', 'tsukimionsen', t('5:32 6:05 6:38 7:15 7:45 8:15 8:45 9:15 10:15 11:15 12:15 13:15 14:15 15:15 16:15 16:45 17:15 17:45 18:15 18:45 19:15 20:15 21:15 22:15')],
    ['K', 'd', 'L', 'central', 'kamano', t('6:52 7:52 8:52 9:45 10:45 11:45 12:45 13:45 14:45 15:45 19:45 20:45 21:45 23:20')],
    ['K', 'd', 'L', 'central', 'kagamikyo', t('22:45')],
    ['K', 'd', 'R', 'central', 'tsukimionsen', every('7:00', '20:00', 60)],
    ['K', 'd', 'X', 'central', 'tsukimionsen', t('7:30 9:30 11:30 13:30 15:30 17:30 19:30')],
    ['K', 'u', 'L', 'tsukimionsen', 'central', t('5:10 5:48 6:20 6:50 7:22 7:55 8:40 9:40 10:40 11:40 12:40 13:40 14:40 15:40 16:40 17:20 17:55 18:40 19:30 20:35 21:40')],
    ['K', 'u', 'L', 'kamano', 'central', t('6:35 7:05 7:35 8:05 8:35 9:10 10:10 11:10 12:10 13:10 14:10 15:10 16:10 17:10 18:10 19:10 20:10 21:15 22:20')],
    ['K', 'u', 'L', 'kagamikyo', 'central', t('5:50 22:30')],
    ['K', 'u', 'R', 'tsukimionsen', 'central', every('7:10', '19:10', 60)],
    ['K', 'u', 'X', 'tsukimionsen', 'central', t('6:55 8:50 10:50 12:50 14:50 16:50 18:50 20:50')],
    ['B', 'd', 'L', 'central', 'minoriport', [...t('5:40 6:10 6:30'), ...every('6:45', '9:00', 15), '9:20', '9:40', ...every('10:00', '16:40', 20), ...every('17:00', '19:45', 15), ...t('20:00 20:20 20:40 21:00 21:30 22:00 22:30 23:00')]],
    ['B', 'd', 'L', 'central', 'minorikoen', t('23:35')],
    ['B', 'u', 'L', 'minoriport', 'central', [...t('5:25 5:55 6:15'), ...every('6:30', '8:45', 15), ...every('9:05', '16:45', 20), ...every('17:00', '19:45', 15), ...t('20:05 20:25 20:50 21:20 21:50 22:20 22:50 23:15')]],
    ['B', 'u', 'L', 'minorikoen', 'central', t('7:08 7:38 8:08')],
  ],
  we: [
    ['K', 'd', 'L', 'central', 'tsukimionsen', ['5:32', ...every('6:15', '22:15', 60)]],
    ['K', 'd', 'L', 'central', 'kamano', [...every('9:45', '18:45', 60), '22:50']],
    ['K', 'd', 'R', 'central', 'tsukimionsen', every('8:00', '18:00', 60)],
    ['K', 'd', 'X', 'central', 'tsukimionsen', t('7:30 8:30 9:30 10:30 11:30 13:30 15:30 17:30 19:30')],
    ['K', 'u', 'L', 'tsukimionsen', 'central', [...t('5:20 6:10 6:55'), ...every('7:40', '19:40', 60), '20:15', '21:05']],
    ['K', 'u', 'L', 'kamano', 'central', [...every('9:10', '19:10', 60), '20:40', '21:50']],
    ['K', 'u', 'R', 'tsukimionsen', 'central', every('8:10', '18:10', 60)],
    ['K', 'u', 'X', 'tsukimionsen', 'central', t('9:50 10:50 11:50 12:50 13:50 14:50 15:50 16:50 17:50 19:50')],
    ['B', 'd', 'L', 'central', 'minoriport', ['5:40', ...every('6:00', '21:00', 20), ...t('21:30 22:00 22:30 23:00')]],
    ['B', 'd', 'L', 'central', 'minorikoen', t('23:35')],
    ['B', 'u', 'L', 'minoriport', 'central', ['5:25', ...every('5:50', '21:10', 20), ...t('21:40 22:10 22:40 23:10')]],
  ],
};

// Fares by distance (km rounded up). [max km, paper ticket, RideCard IC]
export const fareBands = [[3, 170, 168], [6, 210, 209], [10, 260, 255], [15, 330, 324], [20, 410, 402], [25, 490, 481], [30, 570, 560], [35, 650, 638], [40, 730, 715], [45, 810, 795], [50, 890, 874], [55, 970, 952]];
export const tsukikageFee = { bands: [[25, 520], [40, 760]], premium: 700, peak: 200, onboard: 260 };
export const peakDates = { en: '10–12 Oct 2026, 28 Dec 2026–6 Jan 2027, 27 Apr–6 May 2027, 8–17 Aug 2027', ja: '2026年10月10日〜12日、12月28日〜2027年1月6日、4月27日〜5月6日、8月8日〜17日' };
export const holidays = ['2026-10-12', '2026-11-03', '2026-11-23'];
export const pass = { weekday: 1300, weekend: 1100, yukemuri: 2800 };

export const ridershipYear = { en: 'FY2025', ja: '2025年度' };
export const punctuality = [['2025-10', 98.6], ['2025-11', 98.9], ['2025-12', 97.8], ['2026-01', 96.4], ['2026-02', 97.1], ['2026-03', 98.7], ['2026-04', 99.0], ['2026-05', 98.8], ['2026-06', 97.6], ['2026-07', 96.9], ['2026-08', 95.8], ['2026-09', 97.4]];

// Exits, buses, taxis and nearby places for the major stations; plan = station plan drawing spec
export const majorInfo = {
  central: {
    intro: { en: 'The hub of the Vale Rail network, where the Mirror Line and the Bayside Line meet. All Comet limited expresses start and end here. The North Exit faces the bus terminal and the castle district; the South Exit faces the bay and the Bayside Line concourse.',
      ja: '鏡線と湾岸線が接続する当社のターミナル駅です。特急「月影」は全列車が当駅始発・終着です。北口はバスターミナルと城下町方面、南口は湾岸線コンコースとみのり湾方面に面しています。' },
    exits: [
      { en: 'North Exit', ja: '北口', note: { en: 'Bus terminal, taxis, Springvale Castle direction, Mirror River (Lantern Festival)', ja: 'バスターミナル・タクシー乗り場・春川城方面・鏡川（灯籠まつり会場）' } },
      { en: 'South Exit', ja: '南口', note: { en: 'Bayside Line, Kumo Mobile shop, Harvest Bay direction, coach stop', ja: '湾岸線・クモモバイル春川中央店・みのり湾方面・高速バス乗り場' } },
      { en: 'East Exit', ja: '東口', note: { en: 'Station Square shopping arcade, City Hall (8 min), open 6:00–23:00', ja: '駅前商店街・市役所（徒歩8分）、6:00〜23:00のみ通行可' } },
    ],
    buses: [
      ['N1', { en: 'City Bus 1 Castle Loop (clockwise)', ja: '市営バス1系統 城下町循環（右回り）' }, { en: 'every 12 min', ja: '12分間隔' }],
      ['N2', { en: 'City Bus 1 Castle Loop (anticlockwise)', ja: '市営バス1系統 城下町循環（左回り）' }, { en: 'every 12 min', ja: '12分間隔' }],
      ['N3', { en: 'City Bus 8 to Springvale University and General Hospital', ja: '市営バス8系統 春川大学・総合病院方面' }, { en: 'every 15 min', ja: '15分間隔' }],
      ['N4', { en: 'City Bus 21 to Clayfield Pottery Village', ja: '市営バス21系統 釜野焼物の里方面' }, { en: 'hourly', ja: '1時間毎' }],
      ['S1', { en: 'Airport limousine bus to Harvest Airport (55 min, ¥1,300)', ja: '空港リムジンバス みのり空港行（55分・1,300円）' }, { en: 'every 30 min', ja: '30分間隔' }],
      ['S2', { en: 'Highway coaches to Osaka and Tokyo', ja: '高速バス 大阪・東京方面' }, { en: 'see operator', ja: '各社にお問い合わせください' }],
    ],
    taxi: { en: 'Taxi ranks at the North Exit (accessible taxis available) and the South Exit.', ja: 'タクシー乗り場は北口（UDタクシーあり）と南口にあります。' },
    nearby: [
      [{ en: 'Springvale Castle', ja: '春川城' }, { en: '15 min walk or City Bus 1 (6 min)', ja: '徒歩15分または市営バス1系統（6分）' }],
      [{ en: 'Mirror River promenade (Lantern Festival)', ja: '鏡川河畔プロムナード（灯籠まつり会場）' }, { en: '5 min walk from the North Exit', ja: '北口から徒歩5分' }],
      [{ en: 'Kumo Mobile Springvale Central shop', ja: 'クモモバイル春川中央店' }, { en: 'South Exit, 1 min', ja: '南口すぐ' }],
      [{ en: 'Springvale City Hall', ja: '春川市役所' }, { en: '8 min walk from the East Exit', ja: '東口から徒歩8分' }],
      [{ en: 'Springvale Tourist Information Centre', ja: '春川観光案内所' }, { en: 'Inside the station, North concourse, 8:30–19:00', ja: '駅構内 北コンコース、8:30〜19:00' }],
    ],
    plan: { platforms: [[1, 2, { en: 'Mirror Line', ja: '鏡線' }], [3, null, { en: 'Comet', ja: '特急「月影」' }], [5, 6, { en: 'Bayside Line', ja: '湾岸線' }]],
      items: ['gate:0.30', 'gate:0.72', 'office:0.12', 'machines:0.20', 'wc:0.45', 'lift:0.52', 'locker:0.60', 'info:0.38', 'shop:0.85'], exits: [['left', 'North Exit', '北口'], ['right', 'South Exit', '南口'], ['top', 'East Exit', '東口']] },
  },
  shiromachi: {
    intro: { en: 'The station for Springvale Castle and the old castle town. On the Lantern Festival evenings it is the busiest station on the line and entry is restricted.',
      ja: '春川城と城下町の最寄り駅です。灯籠まつりの夜は当社で最も混雑する駅となり、入場規制を行います。' },
    exits: [
      { en: 'Castle Exit (West)', ja: 'お城口（西口）', note: { en: 'Springvale Castle, Main Gate, museum', ja: '春川城・大手門・市立博物館' } },
      { en: 'River Exit (East)', ja: '川口（東口）', note: { en: 'Mirror River, festival venue, Springvale ware shops', ja: '鏡川・まつり会場・春川焼の店' } },
    ],
    buses: [
      ['1', { en: 'City Bus 1 Castle Loop', ja: '市営バス1系統 城下町循環' }, { en: 'every 12 min', ja: '12分間隔' }],
      ['2', { en: 'City Bus 5 to Springvale Central (via Bridge Street)', ja: '市営バス5系統 本町経由春川中央行' }, { en: 'every 20 min', ja: '20分間隔' }],
    ],
    taxi: { en: 'Taxi rank at the Castle Exit. No taxi rank at the River Exit.', ja: 'タクシー乗り場はお城口にあります（川口にはありません）。' },
    nearby: [
      [{ en: 'Springvale Castle keep', ja: '春川城 天守' }, { en: '8 min walk (uphill)', ja: '徒歩8分（上り坂）' }],
      [{ en: 'Springvale City Museum', ja: '春川市立博物館' }, { en: '5 min walk', ja: '徒歩5分' }],
      [{ en: 'Lantern Festival main stage (Mirror River bank)', ja: '灯籠まつりメインステージ（鏡川河川敷）' }, { en: '4 min walk from the River Exit', ja: '川口から徒歩4分' }],
      [{ en: 'Springvale ware gallery street', ja: '春川焼ギャラリー通り' }, { en: '6 min walk', ja: '徒歩6分' }],
    ],
    plan: { platforms: [[1, null, { en: 'for Moonview Spa', ja: '月見温泉方面' }], [2, null, { en: 'for Springvale Central', ja: '春川中央方面' }]],
      items: ['gate:0.45', 'office:0.30', 'machines:0.37', 'wc:0.58', 'lift:0.20', 'lift:0.80', 'locker:0.66'], exits: [['left', 'Castle Exit', 'お城口'], ['right', 'River Exit', '川口']] },
  },
  daigakumae: {
    intro: { en: 'The station for Springvale University (founded 1949) and its hospital. Very crowded from 8:00 to 9:00 and from 16:30 to 18:00 on weekdays during term.',
      ja: '春川大学（1949年創立）と大学病院の最寄り駅です。授業期間中の平日は8時台と16時30分〜18時頃に大変混雑します。' },
    exits: [
      { en: 'University Exit (North)', ja: '大学口（北口）', note: { en: 'Springvale University main gate (3 min), University Hospital (7 min)', ja: '春川大学正門（徒歩3分）・大学病院（徒歩7分）' } },
      { en: 'South Exit', ja: '南口', note: { en: 'Residential area, supermarket', ja: '住宅街・スーパーマーケット' } },
    ],
    buses: [
      ['1', { en: 'City Bus 8 to University Hospital and Springvale Central', ja: '市営バス8系統 大学病院・春川中央方面' }, { en: 'every 15 min', ja: '15分間隔' }],
      ['2', { en: 'University shuttle to the Agriculture Campus (term time, free)', ja: '大学シャトルバス 農学部キャンパス行（授業期間・無料）' }, { en: 'every 20 min', ja: '20分間隔' }],
    ],
    taxi: { en: 'Taxi rank at the University Exit.', ja: 'タクシー乗り場は大学口にあります。' },
    nearby: [
      [{ en: 'Springvale University main gate', ja: '春川大学 正門' }, { en: '3 min walk', ja: '徒歩3分' }],
      [{ en: 'Springvale University Hospital', ja: '春川大学病院' }, { en: '7 min walk or City Bus 8', ja: '徒歩7分または市営バス8系統' }],
      [{ en: 'University Museum of Ceramics (Springvale ware collection)', ja: '大学陶磁資料館（春川焼コレクション）' }, { en: '10 min walk', ja: '徒歩10分' }],
    ],
    plan: { platforms: [[1, null, { en: 'for Moonview Spa', ja: '月見温泉方面' }], [2, null, { en: 'for Springvale Central', ja: '春川中央方面' }]],
      items: ['gate:0.50', 'office:0.34', 'machines:0.41', 'wc:0.62', 'lift:0.25', 'lift:0.75', 'locker:0.68', 'shop:0.15'], exits: [['top', 'University Exit', '大学口'], ['bottom', 'South Exit', '南口']] },
  },
  kamano: {
    intro: { en: 'The home of Springvale ware. Many Mirror Line local trains start or terminate here; trains for Moonview Spa continue north into the gorge. The Clayfield Pottery Fair is held in front of the station on the first weekend of May.',
      ja: '春川焼の里の玄関口です。鏡線の普通列車の多くが当駅で折り返します。月見温泉方面へはここから鏡峡の山あいに入ります。駅前では毎年5月第1週末に「釜野陶器市」が開かれます。' },
    exits: [
      { en: 'Main Exit', ja: '駅舎口', note: { en: 'Pottery village, bus stop, taxis', ja: '焼物の里・バス停・タクシー乗り場' } },
      { en: 'Riverside Exit (unstaffed, RideCard only)', ja: '川側口（無人改札・ハルカ専用）', note: { en: 'Mirror River cycling road, open 6:00–20:00', ja: '鏡川サイクリングロード、6:00〜20:00のみ' } },
    ],
    buses: [
      ['1', { en: 'City Bus 21 Pottery Village loop and Springvale Central', ja: '市営バス21系統 焼物の里循環・春川中央方面' }, { en: 'hourly', ja: '1時間毎' }],
    ],
    taxi: { en: 'One taxi company waits at the Main Exit 7:00–21:00; call 050-3000-1170 outside these hours.', ja: '駅舎口に7:00〜21:00タクシーが待機しています。時間外は050-3000-1170へお電話ください。' },
    nearby: [
      [{ en: 'Clayfield Pottery Village (kilns and shops)', ja: '釜野 焼物の里（窯元・販売店）' }, { en: '5–15 min walk', ja: '徒歩5〜15分' }],
      [{ en: 'Springvale Ware Hall (workshops, ¥1,800)', ja: '春川焼会館（陶芸体験 1,800円）' }, { en: '9 min walk', ja: '徒歩9分' }],
      [{ en: 'Mirror River cycling road', ja: '鏡川サイクリングロード' }, { en: '2 min from the Riverside Exit', ja: '川側口から徒歩2分' }],
    ],
    plan: { platforms: [[1, null, { en: 'for Moonview Spa', ja: '月見温泉方面' }], [2, 3, { en: 'for Springvale Central', ja: '春川中央方面' }]],
      items: ['gate:0.40', 'gate:0.88', 'office:0.25', 'machines:0.32', 'wc:0.52', 'lift:0.18', 'lift:0.70', 'locker:0.60'], exits: [['left', 'Main Exit', '駅舎口'], ['right', 'Riverside Exit', '川側口']] },
  },
  tsukimionsen: {
    intro: { en: 'The terminus of the Mirror Line at 38.6 km, in the hot-spring town of Moonview Spa at the foot of Mount Moonview (1,214 m). The free foot bath in front of the station is open 9:00–18:00. Buses connect to the Mount Moonview ropeway.',
      ja: '鏡線の終点（春川中央から38.6km）、月見山（標高1,214m）のふもとの温泉街にある駅です。駅前の無料足湯は9:00〜18:00。月見山ロープウェイへはバスが接続しています。' },
    exits: [
      { en: 'Spa Exit (single exit)', ja: '温泉口（出口は1か所）', note: { en: 'Hot-spring town, foot bath, bus terminal, taxis', ja: '温泉街・足湯・バスターミナル・タクシー乗り場' } },
    ],
    buses: [
      ['1', { en: 'Moonview Bus 5 to Mount Moonview Ropeway (25 min, ¥480)', ja: '月見バス5系統 月見山ロープウェイ行（25分・480円）' }, { en: 'every 40 min, last 16:20', ja: '40分間隔、最終16:20' }],
      ['2', { en: 'Spa town shuttle to inns (free for inn guests)', ja: '温泉街シャトル（旅館宿泊者は無料）' }, { en: 'every 15 min, 9:00–19:00', ja: '15分間隔、9:00〜19:00' }],
      ['3', { en: 'Moonview Bus 7 to Starfield Highland (40 min, ¥720)', ja: '月見バス7系統 星野高原行（40分・720円）' }, { en: '5 a day', ja: '1日5本' }],
    ],
    taxi: { en: 'Taxi rank in front of the station. Few taxis after 20:00: booking is recommended (050-3000-1414).', ja: '駅前にタクシー乗り場があります。20時以降は台数が少ないため、予約（050-3000-1414）をおすすめします。' },
    nearby: [
      [{ en: 'Station foot bath (free)', ja: '駅前足湯（無料）' }, { en: 'In front of the station, 9:00–18:00', ja: '駅前、9:00〜18:00' }],
      [{ en: 'Moonview Main Bath public bath (¥600)', ja: '共同浴場「月見総湯」（600円）' }, { en: '6 min walk, 7:00–22:00, closed Wednesdays', ja: '徒歩6分、7:00〜22:00、水曜定休' }],
      [{ en: 'Golden Bath public bath (¥450)', ja: '共同浴場「こがね湯」（450円）' }, { en: '10 min walk, 10:00–21:00', ja: '徒歩10分、10:00〜21:00' }],
      [{ en: 'Mount Moonview Ropeway', ja: '月見山ロープウェイ' }, { en: 'Moonview Bus 5, 25 min', ja: '月見バス5系統で25分' }],
    ],
    plan: { platforms: [[1, null, { en: 'Comet', ja: '特急「月影」' }], [2, null, { en: 'Local and Rapid', ja: '普通・快速' }]],
      items: ['gate:0.50', 'office:0.30', 'machines:0.38', 'wc:0.65', 'locker:0.75', 'info:0.20', 'shop:0.88'], exits: [['bottom', 'Spa Exit', '温泉口']] },
  },
  minoriport: {
    intro: { en: 'The terminus of the Bayside Line at 16.2 km, beside the ferry terminal for the islands of Harvest Bay and the Ferry Port fish market.',
      ja: '湾岸線の終点（春川中央から16.2km）です。みのり湾の島々へのフェリーターミナルと、みのり港魚市場に隣接しています。' },
    exits: [
      { en: 'Harbour Exit', ja: '港口', note: { en: 'Ferry terminal (3 min), fish market, Port Square', ja: 'フェリーターミナル（徒歩3分）・魚市場・みなと広場' } },
      { en: 'Town Exit', ja: '町口', note: { en: 'Bus stops, hotels, Ferry Port Town Office', ja: 'バス乗り場・ホテル・みのり港支所' } },
    ],
    buses: [
      ['1', { en: 'City Bus 30 to Harvest Cape lighthouse', ja: '市営バス30系統 みのり岬灯台行' }, { en: 'every 60 min', ja: '1時間毎' }],
      ['2', { en: 'City Bus 31 to Springvale Central (via the coast road)', ja: '市営バス31系統 春川中央行（海岸通経由）' }, { en: 'every 30 min', ja: '30分間隔' }],
    ],
    taxi: { en: 'Taxi rank at the Town Exit.', ja: 'タクシー乗り場は町口にあります。' },
    nearby: [
      [{ en: 'Ferry Port ferry terminal (to Little Island and White Rock Island)', ja: 'みのり港フェリーターミナル（小島・白石島行）' }, { en: '3 min walk', ja: '徒歩3分' }],
      [{ en: 'Ferry Port fish market (morning auction 5:30)', ja: 'みのり港魚市場（朝のせり5:30〜）' }, { en: '5 min walk', ja: '徒歩5分' }],
      [{ en: 'Harvest Bay Aquarium', ja: 'みのり湾水族館' }, { en: '12 min walk', ja: '徒歩12分' }],
    ],
    plan: { platforms: [[1, 2, { en: 'Bayside Line (island platform)', ja: '湾岸線（島式ホーム）' }]],
      items: ['gate:0.48', 'office:0.30', 'machines:0.38', 'wc:0.62', 'locker:0.70', 'shop:0.15'], exits: [['left', 'Town Exit', '町口'], ['right', 'Harbour Exit', '港口']] },
  },
};

// Service status today and in the past week
export const status = {
  K: { state: 'delay', en: 'Delays', ja: '遅れ',
    detail: { en: 'At 13:52 a southbound train hit a deer between Mill Creek and Firefly Valley. Trains between Red Canyon and Moonview Spa are delayed by up to 25 minutes. Ltd. Exp. Comet 18 (Moonview Spa 14:50 → Springvale Central) is running about 20 minutes late. Normal service is expected from around 15:40.',
      ja: '13時52分ごろ、中沢〜蛍谷間で上り列車がシカと衝突しました。この影響で鏡峡〜月見温泉間の列車に最大25分の遅れが出ています。特急「月影」18号（月見温泉14:50発 春川中央行）は約20分遅れで運転しています。15時40分ごろ平常運転に戻る見込みです。' } },
  B: { state: 'ok', en: 'Normal service', ja: '平常運転', detail: { en: 'Trains are running normally.', ja: '現在、平常どおり運転しています。' } },
  X: { state: 'delay', en: 'Delays', ja: '遅れ', detail: { en: 'Comet 18 about 20 minutes late (see Mirror Line).', ja: '「月影」18号が約20分遅れ（鏡線をご覧ください）。' } },
  history: [
    ['2026-10-04', 'K', '13:52', { en: 'Collision with a deer (Mill Creek–Firefly Valley)', ja: 'シカとの衝突（中沢〜蛍谷間）' }, 25, 9, { en: 'Expected 15:40', ja: '15:40ごろ見込み' }],
    ['2026-10-03', 'B', '8:12', { en: 'Passenger taken ill (Market Square)', ja: '急病のお客さま救護（市場駅）' }, 8, 4, { en: '8:40', ja: '8:40' }],
    ['2026-10-02', 'K', '17:41', { en: 'Door check after crowding (University Gate)', ja: '混雑によるドア点検（春川大学前駅）' }, 5, 3, { en: '18:05', ja: '18:05' }],
    ['2026-10-01', 'K', '6:00', { en: 'Heavy rain: speed restriction Red Canyon–Moonview Spa; Comet 2 and 6 cancelled between Moonview Spa and Red Canyon', ja: '大雨による速度規制（鏡峡〜月見温泉間）。「月影」2号・6号は月見温泉〜鏡峡間運休' }, 18, 12, { en: '10:30', ja: '10:30' }],
    ['2026-09-30', '-', '', { en: 'No delays of 5 minutes or more', ja: '5分以上の遅れはありませんでした' }, 0, 0, { en: '', ja: '' }],
    ['2026-09-29', 'B', '21:05', { en: 'Signal fault (Pier Road)', ja: '信号設備の故障（新港通駅）' }, 15, 7, { en: '21:50', ja: '21:50' }],
    ['2026-09-28', 'K', '7:48', { en: 'Level crossing obstacle alarm (Elmwood)', ja: '踏切の障害物検知（柳原駅付近）' }, 12, 6, { en: '8:30', ja: '8:30' }],
  ],
};
