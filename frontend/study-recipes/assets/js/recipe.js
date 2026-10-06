// Recipe card: servings scaler, Metric/US switch, step timers, cook mode, rating and comment form.
import { amount, duration } from './units.js';

const lang = document.documentElement.lang;
const data = JSON.parse(document.getElementById('recipe-data').textContent);
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const input = $('.sc-input');
const base = data.servings;
let mode = window.DT?.store.get('dt-units', 'metric') ?? 'metric';

function render() {
  const servings = Math.max(1, Math.min(48, Number(input.value) || base));
  const factor = servings / base;
  $$('.ing-amt').forEach((el) => { el.textContent = amount(data.items[el.dataset.i], lang, mode, factor); });
  $('.scale-note').hidden = factor === 1;
  $$('[data-mult]').forEach((b) => b.classList.toggle('on', Number(b.dataset.mult) === factor));
  $$('[data-units]').forEach((b) => b.classList.toggle('on', b.dataset.units === mode));
}
input.addEventListener('input', render);
$('.sc-minus').onclick = () => { input.value = Math.max(1, Number(input.value) - 1); render(); };
$('.sc-plus').onclick = () => { input.value = Math.min(48, Number(input.value) + 1); render(); };
$$('[data-mult]').forEach((b) => { b.onclick = () => { input.value = base * Number(b.dataset.mult); render(); }; });
$$('[data-units]').forEach((b) => { b.onclick = () => { mode = b.dataset.units; window.DT?.store.set('dt-units', mode); render(); }; });
render();

// ----- timers -----
const box = $('.timers');
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.4, 0.8].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; g.gain.value = 0.15;
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.25);
    });
  } catch { /* no audio */ }
}
$$('.timer-btn').forEach((btn) => btn.addEventListener('click', () => {
  if (btn._pill) { btn._pill.remove(); clearInterval(btn._iv); btn._pill = null; btn.classList.remove('running'); return; }
  let left = Number(btn.dataset.min) * 60;
  const pill = document.createElement('div');
  pill.className = 'timer-pill';
  pill.innerHTML = `<span>${btn.dataset.label}</span><b>${fmt(left)}</b><button aria-label="×">✕</button>`;
  box.append(pill);
  btn._pill = pill;
  btn.classList.add('running');
  const stop = () => { clearInterval(btn._iv); pill.remove(); btn._pill = null; btn.classList.remove('running'); };
  pill.querySelector('button').onclick = stop;
  btn._iv = setInterval(() => {
    left -= 1;
    pill.querySelector('b').textContent = left > 0 ? fmt(left) : (lang === 'ja' ? '時間です！' : 'Time is up!');
    if (left <= 0) { clearInterval(btn._iv); pill.classList.add('done'); beep(); }
  }, 1000);
}));
$$('.timer-btn').forEach((b) => { b.title = lang === 'ja' ? `${duration(Number(b.dataset.min), lang)}のタイマーを開始` : `Start a ${duration(Number(b.dataset.min), lang)} timer`; });

// ----- cook mode (keeps the screen on where the browser allows it) -----
let lock = null;
$('[data-cookmode]').addEventListener('change', async (e) => {
  try {
    if (e.target.checked) lock = await navigator.wakeLock?.request('screen');
    else { await lock?.release(); lock = null; }
  } catch { /* not allowed here */ }
});

// ----- rating and comment form (nothing is sent anywhere) -----
$$('.rv-rate [data-rate]').forEach((b) => b.addEventListener('click', () => {
  $$('.rv-rate [data-rate]').forEach((x) => x.classList.toggle('on', x === b));
  $('.rate-thanks').hidden = false;
  window.DT?.store.set(`dt-rated-${data.slug}`, Number(b.dataset.rate));
}));
$$('.comment-form [data-rate]').forEach((b) => b.addEventListener('click', () => $$('.comment-form [data-rate]').forEach((x) => x.classList.toggle('on', x === b))));
$('.comment-form').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.reset();
  $('.c-thanks').hidden = false;
});
