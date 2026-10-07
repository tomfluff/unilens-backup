/**
 * The settings panel's look: the chat's Assistant world (white card, mist keys, one
 * blue accent) with its real high-contrast rendition, in em of the chat scale so the
 * panel grows with it. Like the chat it lives in the host page's light DOM, so host
 * rules are reverted first and every element is styled here.
 */

const P = ".ul-set";
const D = ".ul-set-dlg";
const L = ".ul-set-launch";
const HC = '[data-hc="true"]';
const SYS = `system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif`;

export const PANEL_CSS = `
${D}, ${P}, ${L} { all: revert; }
/* the chat specimen is left to the chat's own stylesheet, which reverts its own, and
   what the page's own painters draw in a preview (.s-paint) to their own styles */
/* (:where keeps the exemption out of the specificity: the panel's own rules must win) */
${P} *:not(svg):not(svg *):not(:where(.ul-chat, .ul-chat *, .s-paint, .s-paint *)), ${L} *:not(svg):not(svg *) { all: revert; }
${P}${P}, ${P}${P} *, ${L}${L} { box-sizing: border-box; }
${P}, ${L} {
  --paper: #fff; --mist: #f1f3f5; --ink: #1f2937; --slate: #4b5563; --hair: #d1d5db;
  --edge: #6b7280; --acc: #2563eb; --acc-fg: #fff; --acc-wash: #e8effd; --line: 1px; --sel: 2px;
  --page: #e7eaee;
  font-family: ${SYS}; font-size: var(--ul-fs, 14px); line-height: 1.5; color: var(--ink);
  -webkit-font-smoothing: antialiased; text-align: left;
}
/* high contrast is the chat's (its preview shows it) and the gear's, not the panel's */
${L}${HC} {
  --paper: #000; --mist: #111; --ink: #fff; --slate: #fff; --hair: #fff; --edge: #fff;
  --acc: #ffd400; --acc-fg: #000; --acc-wash: #2a2a00; --line: 2px; --sel: 3px; --page: #222;
}
${P} ::selection { background: var(--acc); color: var(--acc-fg); }
${P}${P} input { caret-color: var(--acc); }
${P}${P} button, ${L}${L} { font: inherit; color: inherit; cursor: pointer; margin: 0; }
/* the panel's icons; the page's painters and the chat size their own */
${P}${P} svg:not(:where(.s-paint svg, .ul-chat svg)), ${L}${L} svg { display: block; flex: none; width: 1.25em; height: 1.25em; }
${P} svg[fill="none"], ${L} svg[fill="none"] { fill: none; }
${P}${P} :focus-visible, ${L}${L}:focus-visible { outline: 3px solid var(--acc); outline-offset: 2px; }
${P}${P} p, ${P}${P} h2, ${P}${P} h3 { margin: 0; }
/* the reset above undoes the hidden attribute's own display */
${P}${P} [hidden] { display: none !important; }

/* the launcher: bottom left, where it has always been */
${L}${L} {
  position: fixed; left: 14px; bottom: 14px; z-index: 2147483647;
  display: grid; place-items: center; width: 2.75em; height: 2.75em; padding: 0;
  border-radius: 999px; border: var(--line) solid var(--edge); background: var(--paper); color: var(--ink);
  box-shadow: 0 6px 18px rgba(17, 24, 39, .18);
}
${L}${L} svg { width: 1.4em; height: 1.4em; }
${L}${L}:hover { background: var(--mist); }
${L}${L}[aria-expanded="true"] { background: var(--acc); color: var(--acc-fg); border-color: var(--acc); }

/* the dialog: the whole window, centring the panel over a light scrim; the page and
   the chat wait behind it. It is the container the two-column layout asks about. */
${D}${D} {
  position: fixed; inset: 0; z-index: 2147483647; box-sizing: border-box;
  width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 16px;
  border: 0; background: transparent; overflow: hidden;
  font-size: var(--ul-fs, 14px); container: ul-set / size;
}
${D}${D}[open] { display: grid; place-items: center; }
${D}::backdrop { background: rgba(17, 24, 39, .32); }
@media (max-width: 520px), (max-height: 560px) { ${D}${D} { padding: 8px; } }

${P}${P} {
  position: relative; display: flex; flex-direction: column;
  width: min(30em, 100%); height: min(40em, 100%);
  background: var(--paper); border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;
  box-shadow: 0 16px 40px rgba(17, 24, 39, .18), 0 2px 6px rgba(17, 24, 39, .08);
}

${P} .s-hd { display: flex; align-items: center; gap: .55em; padding: .75em .75em .5em 1em; flex: none; }
${P} .s-hd h2 { flex: 1; font-size: 1.05em; font-weight: 700; line-height: 1.2; }
${P} .s-preset { margin: 0 1em .6em; padding: .45em .7em; border-radius: 8px; background: var(--acc-wash); color: var(--ink); font-size: .9em; flex: none; }
${P} .s-pvt { color: var(--slate); font-weight: 600; cursor: pointer; }
${P}${P} .s-key { display: grid; place-items: center; width: 2.4em; height: 2.4em; padding: 0; border: 0; border-radius: 10px; background: var(--mist); }

/* one row: in one column (a phone, a high zoom) it scrolls sideways rather than
   stack four rows of tabs over the settings */
${P} .s-tabs { display: flex; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: thin; gap: .25em; margin: 0 .85em .65em; padding: .25em; border-radius: 12px; background: var(--mist); flex: none; }
${P}${P} .s-tab { flex: 1 1 auto; min-height: 2.3em; padding: .35em .6em; border: 0; border-radius: 9px; background: transparent; color: var(--slate); font-weight: 600; white-space: nowrap; }
${P}${P} .s-tab[aria-selected="true"] { background: var(--paper); color: var(--ink); box-shadow: 0 1px 2px rgba(17, 24, 39, .14); }

/* one column (a phone, a high zoom): the settings on top, scrolling; the preview of
   what this tab changes (drawn by the real code where it is cheap) under them and in
   view while choosing; the switch hides it */
${P} .s-main { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; border-top: var(--line) solid var(--hair); }
${P} .s-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; padding: .9em 1em 1em; display: flex; flex-direction: column; gap: 1.25em; }
/* in a column of fixed height its parts keep their size and the column scrolls */
${P} .s-preview > * { flex-shrink: 0; }
${P} .s-preview { flex: none; max-height: 50%; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; padding: .8em 1em; background: var(--page); border-top: var(--line) solid var(--hair); display: flex; flex-direction: column; gap: .6em; }
/* the newest turn is what text size and contrast change most: the specimen shows the
   answer and lets the question go first */
${P} .ul-chat.s-chat .ulc-log { max-height: 9em; overflow: hidden; justify-content: flex-end; }
/* short windows (a laptop at 300–400%), one column: the whole panel scrolls, header
   and tabs too, the preview at its end */
@media (max-height: 560px) {
  ${P}${P} { overflow-y: auto; overscroll-behavior: contain; }
  ${P} .s-main, ${P} .s-body, ${P} .s-preview { flex: none; max-height: none; overflow: visible; }
  ${P} .ul-chat.s-chat .ulc-log { max-height: 4.5em; }
}
/* two columns whenever the window holds 40em of the chat scale: the settings on the
   left, the preview beside them and always in view, each scrolling on its own (also
   on a short window: only the one column lets the whole panel scroll) */
@container ul-set (min-width: 40em) {
  ${P}${P}[data-wide="true"] { width: min(56em, 100%); overflow: hidden; }
  ${P}[data-wide="true"] .s-tabs { flex-wrap: wrap; overflow-x: visible; }
  /* a tab with nothing to preview keeps the width, its settings in a centred column */
  ${P}[data-wide="true"]:not([data-preview="true"]) .s-body > * { width: 100%; max-width: 40em; margin-inline: auto; }
  ${P}[data-preview="true"] .s-main { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) clamp(18em, 45%, 26em); grid-template-rows: minmax(0, 1fr); overflow: hidden; }
  ${P}[data-preview="true"] .s-main > .s-body { grid-area: 1 / 1; min-height: 0; overflow-y: auto; }
  ${P}[data-preview="true"] .s-main > .s-preview { grid-area: 1 / 2; min-height: 0; max-height: none; overflow-y: auto; padding: 1em; border-top: 0; border-left: var(--line) solid var(--hair); }
  ${P} .ul-chat.s-chat .ulc-log { max-height: none; }
}
${P} .ul-chat.s-chat { position: relative; inset: auto; width: 100%; height: auto; max-height: none; z-index: auto; pointer-events: none; }
${P} .ul-chat.s-chat .ulc-log { flex: none; }
${P} .s-page { position: relative; overflow: hidden; min-height: 10em; border-radius: 10px; background: #fff; color: #333; padding: 1.1em 1em 1.2em; font-size: .95em; line-height: 1.6; }
${P} .s-page.with-map { min-height: 12em; padding-right: calc(140px * .55 + 24px); }
${P} .s-page .s-line { display: block; height: .55em; margin: .5em 0; border-radius: 3px; background: #d6dae0; }
${P} .s-page .s-line.short { width: 62%; }
${P} .s-page .s-src { position: relative; z-index: 1; display: inline-block; padding: .1em .2em; font-weight: 600; color: #111; }
/* what the page's own painters draw: outline, backdrop, arrows, click feedback, map */
${P} .s-paint { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
${P} .s-paint .s-dim { position: absolute; inset: 0; }
${P} .s-paint .s-box, ${P} .s-paint .s-cue, ${P} .s-paint .s-cursor { position: absolute; }
${P} .s-paint .s-cursor svg { display: block; }
${P} .s-paint .s-map { display: block; }
/* the minimap in the page preview: its own box and lens, at a little over half size */
${P} .s-minimap { position: absolute !important; top: 8px !important; right: 8px !important; z-index: 3 !important; scale: .55; transform-origin: 100% 0; }
${P} .s-try { align-self: flex-start; }

${P} .s-group { display: flex; flex-direction: column; gap: .55em; }
${P} .s-group h3 { font-size: 1em; font-weight: 700; line-height: 1.3; }
${P} .s-rows { display: flex; flex-direction: column; gap: .7em; }

/* one setting: label (and hint) beside a switch or select, or above a wider control */
${P} .s-row { display: grid; grid-template-columns: minmax(min(9em, 100%), 1fr) minmax(0, max-content); align-items: center; gap: .3em .75em; min-height: 2.3em; }
${P} .s-row.block { grid-template-columns: 1fr; }
${P} .s-label { display: flex; flex-direction: column; gap: .05em; font-weight: 500; line-height: 1.35; cursor: pointer; }
${P} .s-label small { font-size: .9em; font-weight: 400; color: var(--slate); }
${P} .s-name { display: inline-flex; align-items: center; gap: .4em; }
/* changed from the default: a bar in the gutter beside the row, which moves nothing
   (a border, so forced colours keep it); its word is for screen readers and the tooltip */
${P} .s-row[data-changed] { position: relative; }
${P} .s-row[data-changed]::before { content: ""; position: absolute; left: -.6em; top: .2em; bottom: .2em; border-left: 3px solid var(--acc); border-radius: 2px; }
${P} .s-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
${P} .s-note { font-size: .9em; color: var(--slate); }

/* switch */
${P}${P} .s-switch { position: relative; width: 2.9em; height: 1.7em; padding: 0; border: var(--line) solid var(--edge); border-radius: 999px; background: var(--edge); flex: none; }
${P}${P} .s-switch::after { content: ""; position: absolute; top: 50%; left: .2em; width: 1.2em; height: 1.2em; margin-top: -.6em; border-radius: 999px; background: #fff; transition: left .15s ease-out; }
${P}${P} .s-switch[aria-checked="true"] { background: var(--acc); border-color: var(--acc); }
${P}${P} .s-switch[aria-checked="true"]::after { left: calc(100% - 1.4em); }

/* picker: thumbnail radio cards; the chosen one is outlined in the accent and ticked */
${P} .s-pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(6.4em, 1fr)); gap: .45em; }
/* chat looks: bigger cards, so each style shows */
${P} .s-pick.big { grid-template-columns: repeat(auto-fill, minmax(8.5em, 1fr)); }
${P}${P} .s-opt { position: relative; display: flex; flex-direction: column; gap: .35em; padding: .4em .4em .45em; border: var(--line) solid var(--hair); border-radius: 12px; background: var(--paper); color: var(--slate); font-size: .92em; font-weight: 600; line-height: 1.25; text-align: center; }
${P}${P} .s-opt:hover { border-color: var(--edge); }
${P}${P} .s-opt[aria-checked="true"] { border-color: var(--acc); box-shadow: inset 0 0 0 calc(var(--sel) - 1px) var(--acc); color: var(--ink); }
${P} .s-tick { position: absolute; top: -.45em; right: -.45em; display: grid; place-items: center; width: 1.45em; height: 1.45em; border-radius: 999px; background: var(--acc); color: var(--acc-fg); }
${P}${P} .s-tick svg { width: .95em; height: .95em; stroke-width: 3; }
${P} .s-th { position: relative; display: block; border-radius: 8px; background: #fff; overflow: hidden; box-shadow: inset 0 0 0 1px var(--hair); }
/* a stage of real px, scaled by the thumbnail to its width */
${P} .s-stage { position: absolute; left: 0; top: 0; overflow: hidden; transform-origin: 0 0; background: #fff; font: 600 14px/1.2 ${SYS}; color: #111; text-align: left; }
${P} .s-stage .s-line { position: absolute; left: 12px; height: 6px; border-radius: 3px; background: #d6dae0; }
${P} .s-stage .s-word { position: absolute; display: grid; place-items: center; white-space: nowrap; }

/* segments: a row of choices, the chosen one filled and ticked */
${P} .s-seg { display: flex; flex-wrap: wrap; gap: .25em; padding: .2em; border: var(--line) solid var(--edge); border-radius: 12px; }
${P}${P} .s-seg button { flex: 1 1 auto; display: inline-flex; align-items: center; justify-content: center; gap: .3em; min-height: 2.2em; padding: .25em .8em; border: 0; border-radius: 9px; background: transparent; color: var(--ink); font-weight: 600; }
${P}${P} .s-seg button[aria-checked="true"] { background: var(--acc); color: var(--acc-fg); }
${P}${P} .s-seg svg { width: 1em; height: 1em; stroke-width: 3; }

/* slider with its value, editable */
${P} .s-slide { display: flex; align-items: center; gap: .6em; }
${P}${P} .s-slide input[type="range"] { flex: 1; min-width: 0; height: 2em; accent-color: var(--acc); }
${P}${P} .s-num { width: 4.6em; min-height: 2.2em; padding: .2em .45em; border: var(--line) solid var(--edge); border-radius: 8px; background: var(--paper); color: var(--ink); font: inherit; font-variant-numeric: tabular-nums; text-align: right; }
${P} .s-unit { color: var(--slate); font-size: .9em; min-width: 1.6em; }
${P}${P} select { min-height: 2.3em; min-width: 0; max-width: 100%; padding: .25em .5em; border: var(--line) solid var(--edge); border-radius: 8px; background: var(--paper); color: var(--ink); font: inherit; }

/* colour swatches, ticked when chosen */
${P} .s-sw { display: flex; flex-wrap: wrap; align-items: center; gap: .55em; }
${P}${P} .s-chip { position: relative; display: grid; place-items: center; width: 2.4em; height: 2.4em; padding: 0; border: 2px solid var(--paper); border-radius: 999px; box-shadow: 0 0 0 var(--line) var(--edge); }
${P}${P} .s-chip[aria-checked="true"], ${P}${P} .s-chip[data-on="true"] { box-shadow: 0 0 0 var(--sel) var(--acc), 0 0 0 calc(var(--sel) + 2px) var(--paper); }
${P}${P} .s-chip svg { width: 1.1em; height: 1.1em; stroke-width: 3; color: #111; }
${P}${P} .s-chip.dark svg { color: #fff; }
${P} .s-custom { display: inline-flex; align-items: center; gap: .4em; font-weight: 600; color: var(--slate); cursor: pointer; }
${P} .s-custom .s-chip { background: conic-gradient(#ff4d4d, #ffd400, #36f26b, #00c8ff, #6c5cff, #ff4fd8, #ff4d4d); }
${P}${P} .s-custom input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
${P} .s-custom:has(input:focus-visible) .s-chip { outline: 3px solid var(--acc); outline-offset: 2px; }

/* more options, and groups that are all "more" */
${P}${P} summary { display: flex; align-items: center; gap: .4em; min-height: 2.3em; list-style: none; cursor: pointer; font-weight: 600; color: var(--acc); }
${P}${P} summary::-webkit-details-marker { display: none; }
${P} summary svg { transition: transform .15s ease-out; }
${P} details[open] > summary svg { transform: rotate(90deg); }
${P} details > .s-rows { padding-top: .5em; }
${P} .s-group > details.s-fold > summary { color: var(--ink); font-weight: 700; }

${P} .s-search { position: relative; }
${P} .s-search svg { position: absolute; left: .7em; top: 50%; margin-top: -.6em; width: 1.2em; height: 1.2em; color: var(--slate); }
${P}${P} .s-search input { width: 100%; min-height: 2.6em; padding: .4em .75em .4em 2.4em; border: var(--line) solid var(--edge); border-radius: 12px; background: var(--paper); color: var(--ink); font: inherit; }
${P}${P} .s-search input::placeholder { color: var(--slate); opacity: 1; }

${P} .s-zoom { display: flex; align-items: center; gap: .45em; }
${P}${P} .s-zoom button { min-height: 2.3em; min-width: 2.6em; padding: .2em .7em; border: var(--line) solid var(--edge); border-radius: 999px; background: var(--paper); font-weight: 700; font-variant-numeric: tabular-nums; }
${P}${P} .s-zoom .s-pct { flex: 1; }

${P} .s-foot { display: grid; grid-template-columns: repeat(auto-fit, minmax(12em, 1fr)); gap: .45em; padding-top: .9em; border-top: var(--line) solid var(--hair); }
${P}${P} .s-foot .s-btn { justify-content: center; }
${P}${P} .s-btn:disabled { opacity: .55; cursor: default; }
${P}${P} .s-btn { display: inline-flex; align-items: center; gap: .4em; min-height: 2.4em; padding: .35em .9em; border: var(--line) solid var(--edge); border-radius: 999px; background: var(--paper); font-weight: 600; }
${P}${P} .s-btn:hover, ${P}${P} .s-zoom button:hover, ${P}${P} .s-key:hover { background: var(--mist); }
${P} .s-status { flex-basis: 100%; font-size: .92em; color: var(--slate); }
${P} .s-status:empty { display: none; }

@media (forced-colors: active) {
  ${P}${P} { border: 2px solid CanvasText; }
  ${D}::backdrop { background: Canvas; opacity: .6; }
  ${P}${P} button, ${P}${P} .s-opt, ${P}${P} .s-switch, ${L}${L} { border: 1px solid ButtonText; }
  ${P}${P} [aria-checked="true"], ${P}${P} [aria-selected="true"] { outline: 2px solid Highlight; outline-offset: 1px; }
  /* a swatch keeps its colour: it is the choice itself */
  ${P}${P} .s-chip { forced-color-adjust: none; border-color: Canvas; box-shadow: 0 0 0 1px ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  ${P} *, ${L} { transition: none !important; }
}
`;

let injected: HTMLStyleElement | null = null;
export function ensurePanelStyles() {
    if (injected?.isConnected) return;
    injected = document.createElement("style");
    injected.dataset.unilens = "settings";
    injected.textContent = PANEL_CSS;
    document.head.appendChild(injected);
}
