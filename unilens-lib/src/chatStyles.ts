/**
 * The chat popover's look: one scoped stylesheet, three styles (surface brief:
 * .impeccable/surfaces/unilens-lib-src-chatpopover-tsx.md). "assistant" is the
 * default (the assistant-widget convention, bar: ChatGPT/Claude, LINE); "audioGuide"
 * and "station" are the study alternates. Each has a real high-contrast rendition.
 *
 * The popover lives in the host page's light DOM, so host rules (`button {…}`,
 * `img { height: 260px }`) reach it: every element but SVG is reverted to the
 * browser defaults first, then styled here. Sizes are in em so the text-size
 * setting scales the whole popover.
 */

const R = ".ul-chat";
/** base element rules must outrank the revert below (0,1,2): a doubled class does it */
const B = `${R}${R}`;
const A = `${R}[data-style="assistant"]`;
const G = `${R}[data-style="audioGuide"]`;
const S = `${R}[data-style="station"]`;
const HC = '[data-hc="true"]';
const UD = `"BIZ UDPGothic", "BIZ UDGothic", system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif`;
const SYS = `system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif`;

export const CHAT_CSS = `
${R} { all: revert; }
${R} *:not(svg):not(svg *) { all: revert; }
${B}, ${B} * { box-sizing: border-box; }
${R} {
  position: fixed; z-index: 2147483647; display: flex; flex-direction: column;
  width: min(24.3em, calc(100vw - 16px)); height: min(30em, calc(100vh - 16px)); overflow: hidden;
  font-size: var(--ul-fs, 14px); line-height: 1.5; text-align: left;
  -webkit-font-smoothing: antialiased;
}
${B} button { font: inherit; color: inherit; cursor: pointer; margin: 0; }
${B} button:disabled { cursor: default; opacity: .55; }
${B} button[aria-disabled="true"] { cursor: not-allowed; opacity: .55; }
${B} input { font: inherit; margin: 0; min-width: 0; flex: 1; }
${B} p { margin: 0; }
${B} svg { display: block; flex: none; width: 1.25em; height: 1.25em; }
${R} .ulc-hd { display: flex; align-items: center; gap: .55em; flex: none; user-select: none; touch-action: none; }
${R} .ulc-title { flex: 1; min-width: 0; line-height: 1.2; }
${R} .ulc-title b { display: block; font-weight: 700; }
${R} .ulc-title small { display: block; font-size: 1em; }
${R} .ulc-ib { display: grid; place-items: center; flex: none; padding: 0; }
${R} .ulc-log { flex: 1; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: .7em; scrollbar-width: thin; }
${R} .ulc-turn { display: flex; flex-direction: column; align-items: flex-start; gap: .1em; }
${R} .ulc-msg { max-width: 92%; white-space: pre-wrap; overflow-wrap: anywhere; }
/* the text-size knob scales the words of a message only; its buttons, the place
   entries and the input follow the chat scale, so rows of controls never overflow */
${R} .ulc-me, ${R} .ulc-text { font-size: calc(var(--ul-text, 1) * 1em); }
${R} .ulc-me { align-self: flex-end; max-width: 85%; }
${R} .ulc-bot { align-self: flex-start; }
${R} .ulc-speak { display: inline-grid; place-items: center; width: 2em; height: 2em; margin-left: .35em; padding: 0; vertical-align: middle; border-radius: 999px; background: transparent; border: 1px solid currentColor; }
${R} .ulc-speak svg { width: 1.1em; height: 1.1em; }
${R} .ulc-read { display: inline-flex; gap: .3em; margin-left: .35em; vertical-align: middle; }
${R} .ulc-read .ulc-speak { margin-left: 0; }
${R} .ulc-voice[aria-pressed="true"] { animation: ulc-rec 1.2s ease-in-out infinite; }
@keyframes ulc-rec { 50% { box-shadow: 0 0 0 .3em rgba(220, 38, 38, .35); } }
${R} .ulc-where { display: inline-flex; align-items: center; gap: .4em; flex: none; max-width: 100%; min-height: 2.3em; padding: .15em .75em .15em .5em; font-size: .95em; line-height: 1.3; }
${R} .ulc-where.is-pending { border-style: dashed; cursor: default; }
/* where a hidden chat was shown again: a rule across the log, the time in its middle */
${R} .ulc-divider { display: flex; align-items: center; gap: .6em; flex: none; color: var(--muted); font-size: .95em; line-height: 1.3; font-variant-numeric: tabular-nums; }
${R} .ulc-divider::before, ${R} .ulc-divider::after { content: ""; flex: 1; border-top: 1.5px solid currentColor; }
${R}${HC} .ulc-divider::before, ${R}${HC} .ulc-divider::after { border-top-width: 2px; }
${R} .ulc-where b { flex: none; font-variant-numeric: tabular-nums; }
${R} .ulc-where span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${R} .ulc-ctl { display: flex; align-items: center; gap: .35em; min-width: 0; }
${R} .ulc-c { display: inline-flex; align-items: center; justify-content: center; gap: .35em; flex: none; padding: 0; font-size: 1em; white-space: nowrap; }
${R} .ulc-c span { overflow: hidden; text-overflow: ellipsis; }
${R} .ulc-quick { display: grid; grid-template-columns: repeat(3, 1fr); gap: .35em; flex: none; }
${R} .ulc-quick button { min-width: 0; line-height: 1.2; padding-left: .3em; padding-right: .3em; }
${R} .ulc-in { display: flex; gap: .45em; flex: none; align-items: center; }
${R} .ulc-in input::placeholder { opacity: 1; }
${R} .ulc-status { flex: none; min-height: 1.6em; font-size: 1em; display: flex; align-items: center; gap: .45em; overflow: hidden; line-height: 1.35; }
${R} .ulc-status span { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
${R}[data-short="true"] .ulc-status span { -webkit-line-clamp: 1; }
${R} .ulc-empty { opacity: .9; }
${R} .ulc-caret { display: inline-block; width: .5em; height: 1.05em; vertical-align: -.15em; margin-left: .1em; background: currentColor; animation: ulc-blink 1s steps(2) infinite; }
${R} .ulc-lvl { display: inline-flex; gap: 3px; align-items: center; height: 1.2em; }
${R} .ulc-lvl i { display: block; width: 4px; height: 40%; border-radius: 2px; background: currentColor; animation: ulc-lvl .9s ease-in-out infinite; }
${R} .ulc-lvl i:nth-child(2) { animation-delay: .15s } ${R} .ulc-lvl i:nth-child(3) { animation-delay: .3s }
@keyframes ulc-blink { 50% { opacity: 0 } }
${R} .ulc-typing { display: inline-flex; align-items: center; gap: .35em; min-height: 1.6em; }
${R} .ulc-typing i { display: block; width: .55em; height: .55em; border-radius: 50%; background: currentColor; opacity: .35; animation: ulc-dot 1.2s ease-in-out infinite; }
${R} .ulc-typing i:nth-child(2) { animation-delay: .15s } ${R} .ulc-typing i:nth-child(3) { animation-delay: .3s }
@keyframes ulc-dot { 30% { opacity: 1; transform: translateY(-.25em); } }
@keyframes ulc-lvl { 0%, 100% { height: 30% } 50% { height: 100% } }
@media (prefers-reduced-motion: reduce) {
  ${R} { transition: none !important; }
  ${R} .ulc-caret, ${R} .ulc-lvl i, ${R} .ulc-voice, ${R} .ulc-typing i { animation: none !important; }
  ${R} .ulc-typing i { opacity: .7; }
}
${R} .unilens-cite { display: inline-grid; place-items: center; min-width: 1.75em; height: 1.75em; padding: 0 .3em; margin: 0 .12em; border: 0; border-radius: 999px; font-weight: 700; font-size: 1em; line-height: 1; vertical-align: .08em; font-variant-numeric: tabular-nums; cursor: pointer; }
${B} code { font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace; font-size: .92em; }
${B} b { font-weight: 700; }
@media (forced-colors: active) {
  ${R} { border: 2px solid CanvasText !important; }
  ${R} .unilens-cite, ${R} button { border: 1px solid ButtonText !important; }
}

/* ── Assistant (default): the assistant-widget convention, done carefully ── */
${A} { --bg: #fff; --soft: #f1f3f5; --fg: #1f2937; --muted: #4b5563; --line: #d1d5db; --acc: #2563eb; --acc-fg: #fff; --err-bg: #fef2f2; --err: #b91c1c;
  background: var(--bg); color: var(--fg); border: 1px solid #e5e7eb; border-radius: 16px; font-family: ${SYS};
  box-shadow: 0 16px 40px rgba(17, 24, 39, .18), 0 2px 6px rgba(17, 24, 39, .08); }
${A}${HC} { --bg: #000; --soft: #000; --fg: #fff; --muted: #fff; --line: #fff; --acc: #ffd400; --acc-fg: #000; --err-bg: #000; --err: #ffd400; border: 3px solid #fff; }
${A} ::selection { background: var(--acc); color: var(--acc-fg); }
${A} .ulc-hd { padding: .75em .75em .75em 1em; border-bottom: 1px solid var(--line); cursor: grab; }
${A} .ulc-title small { color: var(--muted); }
${A} .ulc-ib { width: 2.4em; height: 2.4em; border: 0; border-radius: 10px; background: var(--soft); color: var(--fg); }
${A}${HC} .ulc-ib { border: 2px solid #fff; }
${A} .ulc-ib[aria-pressed="true"] { background: var(--acc); color: var(--acc-fg); }
${A} .ulc-log { padding: .9em 1em .4em; }
${A} .ulc-me { background: var(--acc); color: var(--acc-fg); padding: .6em .85em; border-radius: 14px 14px 4px 14px; }
${A} .ulc-bot { background: var(--soft); padding: .75em .9em; border-radius: 14px 14px 14px 4px; line-height: 1.65; }
${A}${HC} .ulc-bot { border: 2px solid #fff; }
${A} .ulc-bot.is-err { background: var(--err-bg); color: var(--err); border: 1.5px solid var(--err); }
${A}${HC} .ulc-bot.is-err { border-width: 3px; }
${A} .ulc-bot.is-quiet { background: transparent; border: 1.5px dashed #6b7280; }
${A} .unilens-cite { background: var(--acc); color: var(--acc-fg); margin: 0 .25em; }
${A} .unilens-cite[aria-current="true"] { box-shadow: 0 0 0 2px var(--soft), 0 0 0 4px var(--acc); }
${A} .ulc-where { align-self: flex-end; border: 1.5px solid var(--acc); border-radius: 999px; background: var(--bg); color: var(--acc); font-weight: 600; }
${A} .ulc-where b { padding: 0 .45em; border-radius: 999px; background: var(--acc); color: var(--acc-fg); }
${A}${HC} .ulc-where { border-width: 2px; }
${A} .ulc-where[aria-pressed="true"] { background: var(--acc); color: var(--acc-fg); }
${A} .ulc-where[aria-pressed="true"] b { background: var(--acc-fg); color: var(--acc); }
${A} .ulc-ctl { margin-top: .6em; }
${A} .ulc-c { height: 2.3em; min-width: 2.3em; border: 1px solid #6b7280; border-radius: 999px; background: var(--bg); color: var(--fg); }
${A}${HC} .ulc-c { border: 2px solid #fff; }
${A} .ulc-all.has-label { padding: 0 .8em; color: var(--acc); border: 1.5px solid var(--acc); font-weight: 600; }
${A} .ulc-all[aria-pressed="true"] { background: var(--acc); color: var(--acc-fg); border-color: var(--acc); font-weight: 700; }
${A} .ulc-of { min-width: 2.6em; text-align: center; font-weight: 600; font-variant-numeric: tabular-nums; }
${A} .ulc-back { margin-left: auto; }
${A} .ulc-speak { color: var(--muted); border-color: #9ca3af; }
${A}${HC} .ulc-speak { color: #fff; border-color: #fff; }
${A} .ulc-quick { padding: .55em 1em 0; border-top: 1px solid var(--line); }
${A} .ulc-quick button { min-height: 2.3em; border: 1px solid #6b7280; border-radius: 999px; background: var(--soft); color: var(--fg); font-size: 1em; }
${A}${HC} .ulc-quick button { border: 2px solid #fff; }
${A} .ulc-in { padding: .6em .8em .35em; }
${A} .ulc-in input { height: 2.8em; padding: 0 .85em; border: 1px solid #6b7280; border-radius: 12px; background: var(--bg); color: var(--fg); caret-color: var(--acc); }
${A}${HC} .ulc-in input { border: 2px solid #fff; }
${A} .ulc-in input::placeholder { color: var(--muted); }
${A} .ulc-in .ulc-ib { width: 2.8em; height: 2.8em; border-radius: 12px; }
${A} .ulc-in .ulc-go { background: var(--acc); color: var(--acc-fg); }
${A} .ulc-log { scrollbar-color: #9ca3af transparent; }
${A}${HC} .ulc-log { scrollbar-color: #fff #000; }
${A} .ulc-in .ulc-ib[aria-pressed="true"] { background: #dc2626; color: #fff; }
${A}${HC} .ulc-in .ulc-ib[aria-pressed="true"] { background: #ffd400; color: #000; }
${A} .ulc-status { padding: 0 1em .65em; color: var(--muted); }
${A} :focus-visible { outline: 3px solid var(--acc); outline-offset: 2px; }

/* ── Audio guide: graphite handset, amber display, white label, number keys ── */
${G} { --body: #1c1f24; --body2: #262a31; --key: #2e333b; --key-fg: #fff; --lcd: #ffb000; --lcd-fg: #1c1f24; --label: #fff; --label-fg: #111; --muted: #c9ced6; --disc: #111; --disc-fg: #fff; --err: #ff6b57;
  background: var(--body); color: #fff; border-radius: 22px; padding: 12px; font-family: ${UD}; box-shadow: 0 14px 34px rgba(0, 0, 0, .35); }
${G}${HC} { --body: #000; --body2: #000; --key: #000; --key-fg: #ffd400; --lcd: #ffd400; --lcd-fg: #000; --label: #000; --label-fg: #fff; --muted: #fff; --disc: #ffd400; --disc-fg: #000; --err: #ffd400; border: 3px solid #ffd400; }
${G} ::selection { background: var(--lcd); color: var(--lcd-fg); }
${G} .ulc-hd { padding: 0 2px 10px; cursor: grab; }
${G} .ulc-title b { letter-spacing: .08em; color: var(--muted); }
${G} .ulc-title small { color: var(--muted); }
${G} .ulc-ib { width: 2.6em; height: 2.6em; border: 0; border-radius: 12px; background: var(--key); color: var(--key-fg); }
${G}${HC} .ulc-ib { border: 2px solid #ffd400; }
${G} .ulc-ib[aria-pressed="true"] { background: var(--lcd); color: var(--lcd-fg); }
${G} .ulc-log { padding: 12px 2px 4px; }
${G} .ulc-me { align-self: stretch; max-width: none; color: var(--muted); }
${G} .ulc-bot { align-self: stretch; max-width: none; background: var(--label); color: var(--label-fg); border-radius: 6px; padding: 1em 1.05em; line-height: 1.75; font-size: 1.05em; }
${G}${HC} .ulc-bot { border: 2px solid #fff; }
${G} .ulc-bot.is-err { background: var(--body2); color: #fff; border: 3px solid var(--err); }
${G} .ulc-bot.is-quiet { background: var(--body2); color: #fff; border: 2px dashed var(--muted); }
${G} .unilens-cite { background: var(--disc); color: var(--disc-fg); }
${G} .unilens-cite[aria-current="true"] { background: var(--lcd); color: var(--lcd-fg); box-shadow: 0 0 0 3px var(--label-fg); }
${G} .ulc-where { align-self: flex-start; border: 1.5px solid #8a929e; border-radius: 10px; background: transparent; color: var(--muted); }
${G} .ulc-where b { padding: 0 .4em; border-radius: 6px; background: var(--lcd); color: var(--lcd-fg); }
${G}${HC} .ulc-where { border: 2px solid #ffd400; color: #fff; }
${G} .ulc-where[aria-pressed="true"] { background: var(--lcd); border-color: var(--lcd); color: var(--lcd-fg); }
${G} .ulc-where[aria-pressed="true"] b { background: var(--lcd-fg); color: var(--lcd); }
${G} .ulc-ctl { align-self: stretch; margin-top: 8px; gap: 6px; }
${G} .ulc-c { flex: 1 1 0; min-width: 0; height: 2.8em; border: 0; border-radius: 10px; background: var(--key); color: var(--key-fg); font-weight: 700; font-size: 1.05em; font-variant-numeric: tabular-nums; }
${G}${HC} .ulc-c { border: 2px solid #ffd400; }
${G} .ulc-c[aria-current="true"], ${G} .ulc-c[aria-pressed="true"] { background: var(--lcd); color: var(--lcd-fg); }
${G} .ulc-all.has-label { flex: 3 1 0; padding: 0 .6em; font-size: 1em; }
${G} .ulc-speak { color: var(--label-fg); border-color: currentColor; }
${G} .ulc-quick { margin-top: 10px; }
${G} .ulc-quick button { min-height: 2.6em; border: 1.5px solid #8a929e; border-radius: 10px; background: transparent; color: #fff; font-size: 1em; }
${G} .ulc-log { scrollbar-color: #6b7280 transparent; }
${G}${HC} .ulc-quick button { border: 2px solid #ffd400; color: #ffd400; }
${G} .ulc-in { margin-top: 8px; }
${G} .ulc-in input { height: 3em; padding: 0 .8em; border: 2px solid #8a929e; border-radius: 10px; background: #0f1114; color: #fff; caret-color: var(--lcd); }
${G}${HC} .ulc-in input { background: #000; border-color: #fff; }
${G} .ulc-in input::placeholder { color: #aeb5bf; }
${G} .ulc-in .ulc-ib { width: 3em; height: 3em; }
${G} .ulc-in .ulc-go { background: var(--lcd); color: var(--lcd-fg); }
${G} .ulc-in .ulc-ib[aria-pressed="true"] { background: var(--err); color: #111; }
${G} .ulc-status { margin-top: 8px; min-height: 2.6em; padding: .45em .8em; border-radius: 10px; background: var(--lcd); color: var(--lcd-fg); font-weight: 700; }
${G} :focus-visible { outline: 3px solid #fff; outline-offset: 2px; box-shadow: 0 0 0 6px var(--lcd); }

/* ── Station signs: sign band, blue status strip, station codes, exit-yellow signs ── */
${S} { --panel: #fff; --fg: #222; --band: #2b2b2b; --band-fg: #fff; --line: #0079c2; --exit: #ffd400; --exit-fg: #111; --muted: #4d5156; --strip: #eef4f9; --strip-fg: #0b3d63; --err: #d0021b;
  background: var(--panel); color: var(--fg); border: 1px solid #c9ccd0; border-radius: 6px; font-family: ${UD}; box-shadow: 0 12px 30px rgba(0, 0, 0, .28); }
${S}${HC} { --panel: #000; --fg: #fff; --band: #000; --band-fg: #fff; --line: #ffd400; --muted: #fff; --strip: #000; --strip-fg: #ffd400; --err: #ffd400; border: 3px solid #fff; }
${S} ::selection { background: var(--line); color: #fff; }
${S} .ulc-hd { padding: .6em .65em .6em .75em; background: var(--band); color: var(--band-fg); border-bottom: .35em solid var(--line); cursor: grab; }
${S} .ulc-roundel { display: grid; place-items: center; width: 2.3em; height: 2.3em; flex: none; border-radius: 50%; border: .3em solid var(--line); background: #fff; color: #111; font-weight: 700; }
${S} .ulc-title b { font-size: 1.12em; }
${S} .ulc-title small { opacity: .9; }
${S} .ulc-ib { width: 2.5em; height: 2.5em; border: 2px solid #8a8f95; border-radius: 4px; background: transparent; color: var(--band-fg); }
${S}${HC} .ulc-ib { border-color: #fff; }
${S} .ulc-ib[aria-pressed="true"] { background: var(--exit); color: var(--exit-fg); border-color: var(--exit); }
${S} .ulc-log { padding: .8em .8em .3em; }
${S} .ulc-me { position: relative; align-self: stretch; max-width: none; padding-left: 1em; color: var(--muted); }
${S} .ulc-me::before { content: ""; position: absolute; left: 0; top: .55em; width: .5em; height: .5em; background: var(--fg); }
${S} .ulc-bot { align-self: stretch; max-width: none; font-size: 1.05em; line-height: 1.75; }
${S} .ulc-bot.is-err { border: 3px solid var(--err); padding: .8em; border-radius: 4px; }
${S} .ulc-bot.is-quiet { border: 2px dashed #8a8f95; padding: .8em; border-radius: 4px; }
${S} .unilens-cite { display: inline-flex; align-items: center; justify-content: center; min-width: 2.5em; height: 1.75em; padding: 0 .35em; border: .22em solid var(--line); border-radius: .35em; background: #fff; color: #111; font-size: 1em; white-space: nowrap; }
${S} .unilens-cite[aria-current="true"] { background: var(--line); color: #fff; }
${S}${HC} .unilens-cite[aria-current="true"] { color: #000; }
${S} .ulc-where { align-self: flex-start; border: 2px solid var(--fg); border-radius: 4px; background: var(--panel); color: var(--fg); font-weight: 600; }
${S} .ulc-where b { padding: 0 .3em; border: .18em solid var(--line); border-radius: .3em; background: #fff; color: #111; }
${S} .ulc-ctl { align-self: stretch; margin-top: .7em; }
${S} .ulc-c { flex: 1 1 0; min-width: 0; height: 2.6em; border-radius: 4px; font-weight: 700; }
${S} .ulc-arrow { border: 2px solid #6d7278; background: #fff; color: #111; }
${S}${HC} .ulc-arrow { border-color: #fff; background: #000; color: #fff; }
${S} .ulc-num { border: .22em solid var(--line); background: #fff; color: #111; }
${S} .ulc-num[aria-pressed="true"] { background: var(--line); color: #fff; }
${S}${HC} .ulc-num[aria-pressed="true"] { color: #000; }
${S} .ulc-where[aria-pressed="true"] { background: var(--line); border-color: var(--line); color: #fff; }
${S}${HC} .ulc-where[aria-pressed="true"] { color: #000; }
${S} .ulc-all, ${S} .ulc-back { border: 0; background: var(--exit); color: var(--exit-fg); }
${S} .ulc-all.has-label { flex: 3 1 0; padding: 0 .5em; }
${S} .ulc-all[aria-pressed="true"] { background: var(--band); color: var(--exit); box-shadow: inset 0 0 0 3px var(--exit); }
${S} .ulc-speak { color: var(--muted); border-color: #8a8f95; }
${S}${HC} .ulc-speak { color: #fff; border-color: #fff; }
${S} .ulc-quick { padding: .6em .8em 0; }
${S} .ulc-quick button { min-height: 2.5em; border: 2px solid var(--fg); border-radius: 4px; background: transparent; color: var(--fg); font-weight: 600; font-size: .94em; }
${S} .ulc-log { scrollbar-color: #8a8f95 transparent; }
${S} .ulc-in { padding: .6em .8em .35em; }
${S} .ulc-in input { height: 2.9em; padding: 0 .7em; border: 2px solid var(--fg); border-radius: 4px; background: var(--panel); color: var(--fg); caret-color: var(--line); }
${S} .ulc-in input::placeholder { color: var(--muted); }
${S} .ulc-in .ulc-ib { width: 2.9em; height: 2.9em; color: var(--fg); border-color: var(--fg); }
${S} .ulc-in .ulc-go { background: var(--line); border-color: var(--line); color: #fff; }
${S}${HC} .ulc-in .ulc-go { color: #000; }
${S} .ulc-in .ulc-ib[aria-pressed="true"] { background: var(--err); border-color: var(--err); color: #fff; }
${S} .ulc-status { min-height: 2.5em; padding: .45em .8em; border-top: .25em solid var(--line); background: var(--strip); color: var(--strip-fg); font-weight: 700; }
${S} :focus-visible { outline: 3px solid #111; outline-offset: 2px; box-shadow: 0 0 0 6px var(--exit); }
${S}${HC} :focus-visible { outline-color: #fff; }
/* short screens (a laptop at 200-300% browser zoom): the chrome gives its height to
   the log, so an answer's lines still show; last, so it outranks each style's sizes */
${R}[data-short="true"] .ulc-hd { padding-top: .3em; padding-bottom: .3em; }
${R}[data-short="true"] .ulc-title small { display: none; }
${R}[data-short="true"] .ulc-roundel { width: 1.8em; height: 1.8em; border-width: .22em; }
${R}[data-short="true"] .ulc-ib { width: 2.1em; height: 2.1em; }
${R}[data-short="true"] .ulc-log { padding-top: .4em; padding-bottom: .2em; }
${R}[data-short="true"] .ulc-in { margin-top: 0; padding-top: .3em; padding-bottom: .2em; }
${R}[data-short="true"] .ulc-in input { height: 2.3em; }
${R}[data-short="true"] .ulc-in .ulc-ib { width: 2.3em; height: 2.3em; }
${R}[data-short="true"] .ulc-c { height: 2.2em; }
${R}[data-short="true"] .ulc-status { min-height: 0; margin-top: 4px; padding-top: .15em; padding-bottom: .25em; }
${R}[data-short="true"][data-style="audioGuide"] { padding: 6px 8px; }
${R}[data-short="true"][data-style="audioGuide"] .ulc-hd { padding: 0 2px 4px; }
/* send stays quiet until there is text; last, so no style or contrast rule overrides it,
   and the arrow keeps at least 3:1 against its own ground in every mode */
${A} .ulc-in .ulc-go:disabled { background: var(--soft); color: var(--muted); opacity: 1; }
${G} .ulc-in .ulc-go:disabled { background: var(--key); color: var(--muted); opacity: 1; }
${S} .ulc-in .ulc-go:disabled { background: transparent; color: var(--fg); border-color: var(--muted); opacity: 1; }
`;

let injected: HTMLStyleElement | null = null;

/** add the stylesheet once; later popovers reuse it */
export function ensureChatStyles() {
    if (injected?.isConnected) return;
    injected = document.createElement("style");
    injected.dataset.unilens = "chat";
    injected.textContent = CHAT_CSS;
    document.head.appendChild(injected);
}
