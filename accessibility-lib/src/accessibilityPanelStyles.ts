/**
 * Display adjustment panel — design tokens and widget CSS.
 *
 * The panel follows the UniLens chat's default "Assistant" style (DESIGN.md,
 * unilens-lib/src/chatStyles.ts): a white card with one float, one blue accent,
 * mist fills instead of lifted cards, pills for what the user presses, and a
 * pressed state that fills with the accent. Its high-contrast rendition rebinds
 * the same tokens to black, white and #ffd400 (prefers-contrast: more).
 *
 * Unlike the chat, every control keeps a 44px minimum target (--tap).
 *
 * Tokens define only the per-theme values; the CSS itself is generated on the
 * TypeScript side. Everything is scoped under #unilens-a11y-root, and every
 * element under it except SVG is first reverted to the browser defaults so the
 * embedding site's CSS never shapes the panel.
 */
import { ROOT_ID } from "./accessibilityPanelUI";

type Tokens = Record<string, string>;

/** Assistant: paper, mist, ink, slate, hairline, control edge, blue */
const LIGHT: Tokens = {
    bg: "#ffffff",
    soft: "#f1f3f5",
    text: "#1f2937",
    muted: "#4b5563",
    line: "#d1d5db",
    edge: "#6b7280",
    frame: "#e5e7eb",
    accent: "#2563eb",
    "on-accent": "#ffffff",
    ok: "#166534",
    danger: "#b91c1c",
    "danger-bg": "#fef2f2",
    scroll: "#9ca3af",
    bw: "1px",
    "bw-strong": "1.5px",
    "panel-border": "1px solid #e5e7eb",
    "toggle-border": "0px solid transparent",
    "key-border": "0px solid transparent",
    "shadow-panel":
        "0 16px 40px rgba(17, 24, 39, 0.18), 0 2px 6px rgba(17, 24, 39, 0.08)",
    "shadow-toggle":
        "0 8px 20px rgba(17, 24, 39, 0.2), 0 1px 3px rgba(17, 24, 39, 0.1)",
};

/** The Real High Contrast Rule: the same tokens on black, white and signal yellow */
const HIGH_CONTRAST: Tokens = {
    bg: "#000000",
    soft: "#000000",
    text: "#ffffff",
    muted: "#ffffff",
    line: "#ffffff",
    edge: "#ffffff",
    frame: "#ffffff",
    accent: "#ffd400",
    "on-accent": "#000000",
    ok: "#ffffff",
    danger: "#ffd400",
    "danger-bg": "#000000",
    scroll: "#ffffff",
    bw: "2px",
    "bw-strong": "3px",
    "panel-border": "3px solid #ffffff",
    "toggle-border": "3px solid #ffffff",
    "key-border": "2px solid #ffffff",
};

function tokenBlock(selector: string, tokens: Tokens): string {
    const body = Object.entries(tokens)
        .map(([key, value]) => `  --unilens-a11y-panel-${key}: ${value};`)
        .join("\n");
    return `${selector} {\n${body}\n}`;
}

/**
 * The panel lives in a shadow root (accessibilityPanel.tsx), so no host page
 * rule reaches it — not even an `!important` one, or a `svg { width: 100% }`,
 * both of which used to break it. The shadow host is the `#unilens-a11y-root`
 * element under <html>; inside the shadow root a wrapper with the same id and
 * `display: contents` carries the tokens, so every `#unilens-a11y-root …`
 * selector below works in either place.
 *
 * Where shadow DOM is missing the panel falls back to the light DOM, styled
 * by the same rules plus a revert of everything the host page may set.
 *
 * Positioning stays outside the shadow root (HOST_CSS, in the document): an
 * outer rule beats a `:host` rule, so a host `div { … }` would otherwise move
 * the panel; an id selector in the document does not lose to it.
 */
const R = `#${ROOT_ID}`;
/** focus must outrank the page's focus-enhance rule, which reverts focus styles inside the widget */
const F = `${R}${R}`;
const SYS = `system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif`;

/** shorthand for a token */
const v = (name: string) => `var(--unilens-a11y-panel-${name})`;

type WidgetMode = "light" | "shadow";

/**
 * Where the panel sits on screen. In the document, on the root (the shadow
 * host): see the note above R.
 */
const HOST_CSS = `
${R} {
  position: fixed; bottom: 16px; right: 16px; top: auto; z-index: 2147483646;
  display: flex; flex-direction: column-reverse; align-items: flex-end;
  margin: 0; padding: 0; border: 0; background: none;
  width: auto; height: auto; min-width: 0; min-height: 0; max-width: none; max-height: none;
}
${R}[data-unilens-a11y-down] { flex-direction: column; }
${R}[data-unilens-a11y-start] { align-items: flex-start; }
@media (max-width: 560px) {
  ${R} { bottom: 14px; right: 14px; }
  ${R}.unilens-a11y-open {
    left: 8px !important; right: 8px !important;
    top: auto !important; bottom: 8px !important;
  }
}
@media (max-height: 560px) {
  ${R}.unilens-a11y-open { top: 8px !important; bottom: 8px !important; }
}
`;

/**
 * Overlay uses a stable theme. Page display filters never restyle the panel.
 */
function layoutCss(mode: WidgetMode): string {
    const shadow = mode === "shadow";
    /** a state class / attribute on the root, then the panel content: `${S(".x")} .y` */
    const S = (state: string) =>
        shadow ? `:host(${state}) ${R}` : `${R}${state}`;
    /** element rules that must outrank the light-DOM revert below (1,0,3) but no class rule (1,1,0) */
    const B = shadow ? R : `html ${R}`;
    return `
${
    shadow
        ? `/* the wrapper inside the shadow root: tokens only, no box of its own */
${R} { display: contents; }`
        : `/* Host pages reach the widget's light DOM (\`button {…}\`, \`h3 {…}\`): every element
   but SVG goes back to the browser defaults first, then is styled below. */
${R} *:not(svg):not(svg *) { all: revert; }`
}
${B} *:not(svg):not(svg *), ${B} *::before, ${B} *::after { box-sizing: border-box; }
${B} button { font: inherit; color: inherit; margin: 0; cursor: pointer; }
/* a host \`svg { fill: currentColor }\` (the recruit mirror) beats the icons' fill attribute */
${R} svg[fill="none"] { fill: none; }
/* the tinted backdrop shape of a few icons — a class, not a style attribute, which a strict CSP refuses */
${R} svg .unilens-a11y-icon-tint { fill: currentColor; stroke: none; }
${R} {
  --unilens-a11y-panel-base: 15px;
  --unilens-a11y-panel-font-scale: 1;
  --unilens-a11y-panel-line-height: 1.5;
  --unilens-a11y-panel-font-family: ${SYS};
  --unilens-a11y-panel-saturate: 1;
  --unilens-a11y-panel-contrast: 1;
  /* every target stays at least 44px, whatever the text size */
  --unilens-a11y-panel-tap: max(44px, 2.9em);
  font-family: ${v("font-family")};
  font-size: calc(${v("base")} * ${v("font-scale")});
  line-height: ${v("line-height")};
  letter-spacing: var(--unilens-a11y-panel-letter-spacing, 0);
  text-align: left;
  color: ${v("text")};
  -webkit-font-smoothing: antialiased;
}
${R} ::selection { background: ${v("accent")}; color: ${v("on-accent")}; }

/* Make the hidden attribute always win. The browser's default [hidden]{display:none}
   rule only has specificity (0,1,0), which loses to #id .unilens-a11y-panel{display:flex} (1,1,0)
   below, and the panel would stop closing. */
${R} [hidden] { display: none !important; }

/* An area that reaches screen readers only, never rendered visually. */
${R} .unilens-a11y-sr-only {
  position: absolute; width: 1px; height: 1px;
  margin: -1px; padding: 0; border: 0;
  overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap;
}

/* ── Toggle button: a flat accent pill, the one float besides the panel ────── */
${R} .unilens-a11y-toggle {
  display: inline-flex; align-items: center; gap: 0.5em;
  min-height: ${v("tap")}; padding: 0 1.05em;
  border: ${v("toggle-border")}; border-radius: 999px;
  background: ${v("accent")}; color: ${v("on-accent")};
  font-size: 1em; font-weight: 700; cursor: pointer;
  box-shadow: ${v("shadow-toggle")};
}
/* Draggable: hold and drag to move. The root is re-anchored to the nearest corner
   (inline left/right/top/bottom), and the panel opens toward the screen centre. */
${R} .unilens-a11y-toggle { touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; }
${R} .unilens-a11y-toggle[data-unilens-a11y-dragging] { cursor: grabbing; }
${S("[data-unilens-a11y-down]")} .unilens-a11y-panel { margin-bottom: 0; margin-top: 10px; }
${R} .unilens-a11y-toggle[aria-expanded="true"] {
  box-shadow: 0 0 0 2px ${v("bg")}, 0 0 0 4px ${v("accent")}, ${v("shadow-toggle")};
}
${R} .unilens-a11y-toggle-badge {
  min-width: 1.6em; height: 1.6em; padding: 0 0.4em; border-radius: 999px;
  background: ${v("on-accent")}; color: ${v("accent")};
  font-size: 0.92em; font-weight: 700; font-variant-numeric: tabular-nums;
  display: inline-flex; align-items: center; justify-content: center;
}

/* ── Panel ──────────────────────────────────────────────────────────────── */
${R} .unilens-a11y-panel {
  margin-bottom: 10px;
  margin-top: 0;
  width: min(25.4em, calc(100vw - 16px));
  max-height: min(calc(100vh - 88px), var(--unilens-a11y-avail, 100vh));
  display: flex; flex-direction: column; overflow: hidden;
  border-radius: 16px; background: ${v("bg")};
  border: ${v("panel-border")};
  box-shadow: ${v("shadow-panel")};
}

${R} .unilens-a11y-header {
  display: flex; align-items: center; gap: 0.55em; flex: none;
  padding: 0.6em 0.75em 0.6em 1em;
  border-bottom: ${v("bw")} solid ${v("line")};
}
${R} .unilens-a11y-header-text { flex: 1; min-width: 0; }
${R} .unilens-a11y-title { margin: 0; font-size: 1.07em; font-weight: 700; line-height: 1.2; }
${R} .unilens-a11y-subtitle { margin: 0.15em 0 0; font-size: 0.92em; font-weight: 400; color: ${v("muted")}; }
${R} .unilens-a11y-close {
  display: grid; place-items: center; flex: none;
  width: ${v("tap")}; height: ${v("tap")}; padding: 0;
  border-radius: 10px; border: ${v("key-border")};
  background: ${v("soft")}; color: ${v("text")}; cursor: pointer;
}

/* ── Tabs: a row of pills; the open one is filled ──────────────────────── */
${R} .unilens-a11y-tabs {
  display: flex; flex: none; margin: 0; padding: 0.6em 1em; list-style: none; gap: 0.35em;
  border-bottom: ${v("bw")} solid ${v("line")}; background: ${v("bg")};
}
${R} .unilens-a11y-tabs li { flex: 1; display: flex; min-width: 0; }
${R} .unilens-a11y-tab {
  position: relative;
  flex: 1; min-width: 0; display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 0.4em;
  min-height: ${v("tap")}; padding: 0 0.6em;
  border: ${v("bw")} solid ${v("edge")}; border-radius: 999px;
  background: ${v("bg")}; color: ${v("text")};
  font-size: 1em; font-weight: 600; line-height: 1.2; white-space: nowrap; cursor: pointer;
  appearance: none;
  text-decoration: none;
}
${R} .unilens-a11y-tab[aria-selected="true"] {
  background: ${v("accent")}; color: ${v("on-accent")}; border-color: ${v("accent")}; font-weight: 700;
}
/* Host pages (SoftBank l3-common) use button:focus { outline: thin dotted }.
   Drop that ring and any host decoration; keyboard focus gets the panel's own
   3px ring below (the focus-enhance revert-layer cannot remove it). */
${R} .unilens-a11y-tab:focus:not(:focus-visible),
${R} .unilens-a11y-tab:hover,
${R} .unilens-a11y-tab:active {
  outline: none;
  box-shadow: none;
  text-decoration: none;
}
${F} .unilens-a11y-tab:focus-visible,
html[data-unilens-a11y-focus-enhance] ${F} .unilens-a11y-tab:focus-visible {
  outline: 3px solid ${v("accent")};
  outline-offset: 2px;
  box-shadow: none;
  text-decoration: none;
}
${R} .unilens-a11y-tab::-moz-focus-inner { border: 0; padding: 0; }
${R} .unilens-a11y-tab-count {
  min-width: 1.5em; height: 1.5em; padding: 0 0.35em; border-radius: 999px;
  background: ${v("accent")}; color: ${v("on-accent")};
  font-size: 0.92em; font-weight: 700; line-height: 1.5em; text-align: center; font-variant-numeric: tabular-nums;
}
${R} .unilens-a11y-tab[aria-selected="true"] .unilens-a11y-tab-count { background: ${v("on-accent")}; color: ${v("accent")}; }

/* ── Applied chips ──────────────────────────────────────────────────────── */
${R} .unilens-a11y-chips {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.35em;
  padding: 0.6em 1em; border-bottom: ${v("bw")} solid ${v("line")}; background: ${v("bg")};
}
${R} .unilens-a11y-chips-label { font-size: 0.95em; font-weight: 600; color: ${v("muted")}; }
${R} .unilens-a11y-chip {
  display: inline-flex; align-items: center; gap: 0.2em;
  min-height: 2em; padding: 0 0.2em 0 0.75em; border-radius: 999px;
  background: ${v("soft")}; border: ${v("bw")} solid ${v("edge")}; color: ${v("text")};
  font-size: 0.92em; font-weight: 600;
}
${R} .unilens-a11y-chip-x {
  display: inline-grid; place-items: center;
  width: 1.75em; height: 1.75em; padding: 0; border: 0; border-radius: 50%;
  background: transparent; color: inherit; cursor: pointer;
}

/* ── Body (scroll area) ─────────────────────────────────────────────────── */
${R} .unilens-a11y-body {
  flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 0.25em 1em 0.9em;
  scrollbar-width: thin; scrollbar-color: ${v("scroll")} transparent;
}
${R} .unilens-a11y-tabpanel { display: none; }
${R} .unilens-a11y-tabpanel-active { display: block; }

/* ── Card: a flat section under a hairline; nothing inside the panel is lifted ── */
${R} .unilens-a11y-card {
  display: block; background: transparent; border: 0; border-top: ${v("bw")} solid ${v("line")};
  border-radius: 0; padding: 0.9em 0 1em; margin: 0;
}
${R} .unilens-a11y-card:first-child { border-top: 0; }
${R} .unilens-a11y-card-head { display: flex; align-items: center; gap: 0.5em; }
${R} .unilens-a11y-card-icon { display: flex; color: ${v("accent")}; flex-shrink: 0; }
${R} .unilens-a11y-card-title { margin: 0; font-size: 1.07em; font-weight: 700; line-height: 1.3; }
${R} .unilens-a11y-card-badge {
  margin-left: auto; padding: 0.1em 0.65em; border-radius: 999px;
  background: ${v("accent")}; color: ${v("on-accent")};
  font-size: 0.92em; font-weight: 600; white-space: nowrap;
}
${R} .unilens-a11y-card-desc { margin: 0.4em 0 0.8em; font-size: 0.95em; line-height: 1.6; color: ${v("muted")}; }
${R} .unilens-a11y-card-head + .unilens-a11y-group,
${R} .unilens-a11y-card-head + .unilens-a11y-switch-row { margin-top: 0.75em; }
${R} .unilens-a11y-switch-row + .unilens-a11y-switch-row { margin-top: 0.6em; }

/* ── Input group ────────────────────────────────────────────────────────── */
${R} .unilens-a11y-group { margin: 0 0 0.9em; padding: 0; border: none; min-inline-size: 0; }
${R} .unilens-a11y-group:last-child { margin-bottom: 0; }
${R} .unilens-a11y-group-label {
  display: block; padding: 0; margin-bottom: 0.45em;
  font-size: 0.95em; font-weight: 600; color: ${v("muted")};
}

/* ── Choice: mist key with a control-edge outline; pressed fills with the accent ── */
${R} .unilens-a11y-choices { display: grid; grid-template-columns: repeat(var(--unilens-a11y-panel-cols, 2), minmax(0, 1fr)); gap: 0.4em; }
${R} .unilens-a11y-choices--stack { gap: 0.45em; }
${R} .unilens-a11y-choices .unilens-a11y-group { margin: 0; }
${R} .unilens-a11y-pointer-halo-opts,
${R} .unilens-a11y-reading-guide-opts { display: grid; gap: 0.6em; }
${R} .unilens-a11y-choice {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3em;
  min-height: ${v("tap")}; padding: 0.55em 0.4em;
  border: ${v("bw")} solid ${v("edge")}; border-radius: 12px;
  background: ${v("soft")}; color: ${v("text")};
  font-size: 1em; font-weight: 600; line-height: 1.3; text-align: center; cursor: pointer;
  writing-mode: horizontal-tb; word-break: keep-all; overflow-wrap: normal; white-space: nowrap;
}
${R} .unilens-a11y-choice:disabled { cursor: not-allowed; opacity: 0.55; }
${R} .unilens-a11y-choice[aria-checked="true"],
${R} .unilens-a11y-choice[aria-pressed="true"] {
  border-color: ${v("accent")}; background: ${v("accent")}; color: ${v("on-accent")}; font-weight: 700;
}
/* a swatch shows a colour to judge: it keeps its ground and is ringed instead of filled */
${R} .unilens-a11y-choice--swatch { padding: 0.4em; gap: 0; background: ${v("bg")}; }
${R} .unilens-a11y-choice--swatch[aria-checked="true"],
${R} .unilens-a11y-choice--swatch[aria-pressed="true"] {
  background: ${v("bg")}; color: ${v("text")};
  box-shadow: 0 0 0 2px ${v("bg")}, 0 0 0 4px ${v("accent")};
}
/* the check sits on the corner, clear of the option's preview; with the fill and
   the weight it marks the choice by more than colour */
${R} .unilens-a11y-choice-check {
  position: absolute; top: -0.5em; right: -0.5em; z-index: 1;
  width: 1.4em; height: 1.4em; border-radius: 50%;
  background: ${v("accent")}; color: ${v("on-accent")};
  box-shadow: 0 0 0 2px ${v("bg")};
  display: none; align-items: center; justify-content: center;
}
${R} .unilens-a11y-choice[aria-checked="true"] .unilens-a11y-choice-check,
${R} .unilens-a11y-choice[aria-pressed="true"] .unilens-a11y-choice-check { display: flex; }
${R} .unilens-a11y-choice-label { display: block; font-size: 1.05em; white-space: nowrap; }
${R} .unilens-a11y-choice-icon { display: flex; flex-shrink: 0; overflow: visible; }
${R} .unilens-a11y-choice-icon svg { overflow: visible; }
${R} .unilens-a11y-choice-copy {
  display: flex; flex-direction: column; align-items: center; gap: 0.1em; min-width: 0;
}
${R} .unilens-a11y-choice-hint { display: block; font-size: 0.92em; font-weight: 600; opacity: 0.85; font-variant-numeric: tabular-nums; white-space: nowrap; }
/* Direct children only: nested ChoiceGroups under a stacked toggle (cursor
   color, reading guide, …) must keep the compact card layout, or labels
   wrap one character per line inside the 3- and 5-column grids. */
${R} .unilens-a11y-choices--stack > .unilens-a11y-choice {
  flex-direction: row; align-items: center; gap: 0.75em;
  min-height: 3.6em; padding: 0.55em 1em;
  font-size: 1.05em; text-align: left;
}
${R} .unilens-a11y-choices--stack > .unilens-a11y-choice .unilens-a11y-choice-copy { align-items: flex-start; flex: 1; }
${R} .unilens-a11y-choices--stack > .unilens-a11y-choice .unilens-a11y-choice-label { font-size: 1.15em; }
${R} .unilens-a11y-choices--stack > .unilens-a11y-choice .unilens-a11y-choice-hint { font-size: 0.92em; }
${R} .unilens-a11y-choices--stack > .unilens-a11y-choice .unilens-a11y-choice-check {
  top: 50%; right: 0.9em; transform: translateY(-50%);
  background: ${v("on-accent")}; color: ${v("accent")}; box-shadow: none;
}

/* ── Swatch previews ────────────────────────────────────────────────────── */
${R} .unilens-a11y-choice--swatch[aria-checked="true"] .unilens-a11y-text-stroke-name,
${R} .unilens-a11y-choice--swatch[aria-checked="true"] .unilens-a11y-text-plate-name {
  color: ${v("accent")};
}
${R} .unilens-a11y-pointer-halo-swatch {
  display: block; width: 100%; aspect-ratio: 1; max-height: 40px;
  border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.4);
}
${R} .unilens-a11y-reading-guide-swatch {
  display: block; width: 100%; height: 12px; margin: 8px 0;
  border-radius: 2px;
}
${R} .unilens-a11y-text-stroke-opts { display: grid; gap: 0.6em; }
${R} .unilens-a11y-text-stroke-option {
  display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%;
}
${R} .unilens-a11y-text-stroke-preview {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
  width: 100%; min-height: 60px; padding: 8px 4px; border-radius: 8px;
  background: linear-gradient(90deg, #f5f5f5 0 25%, #f5f2eb 25% 50%, #1a1a2e 50% 75%, #000 75% 100%);
  font-size: 1.4em; font-weight: 700; line-height: 1;
  -webkit-font-smoothing: antialiased;
}
${R} .unilens-a11y-text-stroke-chips { display: flex; gap: 5px; }
${R} .unilens-a11y-text-stroke-chip {
  display: block; width: 15px; height: 15px; border-radius: 3px;
  box-shadow: 0 0 0 1px #fff, 0 0 0 2px #111;
}
${R} .unilens-a11y-text-stroke-glyph { display: block; }
${R} .unilens-a11y-text-stroke-name {
  font-size: 0.85em; font-weight: 600; line-height: 1.25; text-align: center;
  color: ${v("muted")}; white-space: nowrap;
}
${R} .unilens-a11y-text-plate-opts { display: grid; gap: 0.6em; }
${R} .unilens-a11y-choice--swatch:has(.unilens-a11y-text-plate-option) {
  min-height: 0; padding: 6px 5px 7px;
}
${R} .unilens-a11y-text-plate-option {
  display: flex; flex-direction: column; align-items: center; gap: 5px; width: 100%; min-width: 0;
}
${R} .unilens-a11y-text-plate-preview {
  display: flex; align-items: center; justify-content: center;
  width: 100%; min-height: 44px; padding: 6px 4px; border-radius: 8px;
  font-size: 1.25em; font-weight: 700; line-height: 1;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.45);
  -webkit-font-smoothing: antialiased;
}
${R} .unilens-a11y-text-plate-name {
  font-size: 0.85em; font-weight: 600; line-height: 1.25; text-align: center;
  color: ${v("muted")}; white-space: nowrap;
}

/* ── Preview components ─────────────────────────────────────────────────── */
${R} .unilens-a11y-swatch {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 26px; border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  font-size: 0.95em; font-weight: 700;
}
${R} .unilens-a11y-strip {
  display: block; width: 100%; height: 18px; border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  background: linear-gradient(90deg, #d92b2b 0%, #dd8b00 25%, #1f9d3f 50%, #1f63d9 75%, #8b2bd9 100%);
}
${R} .unilens-a11y-sample { display: flex; align-items: center; justify-content: center; height: 26px; line-height: 1; }
${R} .unilens-a11y-lines { display: flex; flex-direction: column; justify-content: center; width: 70%; height: 26px; }
${R} .unilens-a11y-line { display: block; height: 2px; border-radius: 2px; background: currentColor; opacity: 0.7; }

/* ── Level choice: keys on a mist band; the chosen key is filled, never lifted ── */
${R} .unilens-a11y-level {
  display: flex; gap: 0.25em; padding: 0.25em;
  background: ${v("soft")}; border: ${v("bw")} solid ${v("edge")}; border-radius: 14px;
}
${R} .unilens-a11y-level-btn {
  flex: 1; min-width: 0; min-height: 3.4em;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2em;
  border: none; border-radius: 10px; background: transparent; color: ${v("text")};
  font-size: 0.95em; font-weight: 600; cursor: pointer;
}
${R} .unilens-a11y-level-btn[aria-checked="true"] {
  background: ${v("accent")}; color: ${v("on-accent")}; font-weight: 700;
}
${R} .unilens-a11y-level-meter { display: flex; align-items: flex-end; justify-content: center; gap: 2px; height: 12px; }
${R} .unilens-a11y-level-bar { display: block; width: 4px; border-radius: 2px; background: currentColor; opacity: 0.3; }
${R} .unilens-a11y-level-bar--on { opacity: 1; }
${R} .unilens-a11y-level-off { display: block; width: 11px; height: 2px; border-radius: 2px; background: currentColor; opacity: 0.7; }
${R} .unilens-a11y-level-label { display: block; }
${R} .unilens-a11y-level-hint { display: block; font-size: 0.92em; font-weight: 600; opacity: 0.85; font-variant-numeric: tabular-nums; }

/* ── Switch: flat, outlined; on fills the track with the accent ─────────── */
${R} .unilens-a11y-switch-row { display: flex; align-items: center; gap: 0.75em; min-height: ${v("tap")}; }
${R} .unilens-a11y-switch-text { flex: 1; min-width: 0; }
${R} .unilens-a11y-switch-label { display: block; font-size: 1.05em; font-weight: 600; }
${R} .unilens-a11y-switch-hint { display: block; margin-top: 0.1em; font-size: 0.92em; color: ${v("muted")}; line-height: 1.45; }
${R} .unilens-a11y-switch {
  position: relative; flex-shrink: 0; width: 52px; height: 30px; padding: 0;
  border: ${v("bw-strong")} solid ${v("edge")}; border-radius: 999px;
  background: ${v("soft")}; cursor: pointer;
}
/* the track is drawn 52×30; its target reaches 44px tall */
${R} .unilens-a11y-switch::before { content: ''; position: absolute; inset: -8px -4px; }
${R} .unilens-a11y-switch::after {
  content: ''; position: absolute; top: 50%; left: 3px; width: 20px; height: 20px;
  border-radius: 50%; background: ${v("bg")}; border: ${v("bw-strong")} solid ${v("edge")};
  transform: translateY(-50%);
}
${R} .unilens-a11y-switch[aria-checked="true"] { background: ${v("accent")}; border-color: ${v("accent")}; }
${R} .unilens-a11y-switch[aria-checked="true"]::after {
  background: ${v("on-accent")}; border-color: ${v("on-accent")}; transform: translate(21px, -50%);
}

/* ── Button: pills, as everything the user presses in the chat ──────────── */
${R} .unilens-a11y-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4em;
  min-height: ${v("tap")}; padding: 0 1em;
  border: ${v("bw")} solid ${v("edge")}; border-radius: 999px;
  background: ${v("bg")}; color: ${v("text")};
  font-size: 1em; font-weight: 600; cursor: pointer; white-space: nowrap;
}
${R} .unilens-a11y-btn--primary { background: ${v("accent")}; color: ${v("on-accent")}; border-color: ${v("accent")}; font-weight: 700; }
${R} .unilens-a11y-btn--secondary { background: ${v("soft")}; color: ${v("text")}; }
${R} .unilens-a11y-btn--quiet { background: ${v("bg")}; color: ${v("text")}; }
${R} .unilens-a11y-btn--danger {
  background: ${v("danger-bg")}; color: ${v("danger")}; border: ${v("bw-strong")} solid ${v("danger")}; font-weight: 700;
}
${R} .unilens-a11y-btn--icon { min-width: ${v("tap")}; padding: 0; }
${R} .unilens-a11y-btn--full { width: 100%; }
${R} .unilens-a11y-btn:disabled { opacity: 0.55; cursor: default; }
${R} .unilens-a11y-btn-row { display: flex; flex-wrap: wrap; gap: 0.35em; margin-top: 0.75em; }
${R} .unilens-a11y-btn-row .unilens-a11y-btn { flex: 1 1 auto; }
${R} .unilens-a11y-btn-row .unilens-a11y-btn--icon { flex: 0 0 auto; }

/* ── Stepper ────────────────────────────────────────────────────────────── */
${R} .unilens-a11y-stepper { display: flex; align-items: center; gap: 0.45em; }
${R} .unilens-a11y-stepper-value {
  flex: 1; display: flex; align-items: center; justify-content: center;
  min-height: ${v("tap")}; border-radius: 999px;
  background: ${v("soft")};
  font-size: 1.05em; font-weight: 700; font-variant-numeric: tabular-nums;
}

/* ── Hint display: mist; an error is the chat's alarm bubble ────────────── */
${R} .unilens-a11y-note {
  display: flex; align-items: center; gap: 0.5em; margin: 0.75em 0 0;
  padding: 0.6em 0.8em; border-radius: 12px;
  font-size: 0.95em; line-height: 1.5;
  background: ${v("soft")}; color: ${v("text")};
}
${R} .unilens-a11y-note svg { flex-shrink: 0; }
${R} .unilens-a11y-note + .unilens-a11y-group { margin-top: 0.75em; }
${R} .unilens-a11y-note--info { color: ${v("accent")}; }
${R} .unilens-a11y-note--ok { background: transparent; color: ${v("ok")}; border: ${v("bw-strong")} solid ${v("ok")}; }
${R} .unilens-a11y-note--error { background: ${v("danger-bg")}; color: ${v("danger")}; border: ${v("bw-strong")} solid ${v("danger")}; }

${R} .unilens-a11y-metrics {
  display: grid; grid-template-columns: auto 1fr; gap: 0.3em 0.75em;
  margin: 0.75em 0 0; padding: 0.7em 0.85em; border-radius: 12px;
  background: ${v("soft")};
  font-size: 0.95em;
}
${R} .unilens-a11y-metrics dt { color: ${v("muted")}; font-weight: 600; }
${R} .unilens-a11y-metrics dd { margin: 0; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }

/* ── Footer ─────────────────────────────────────────────────────────────── */
${R} .unilens-a11y-footer {
  display: flex; flex-direction: column; gap: 0.45em; flex: none;
  padding: 0.6em 1em 0.7em; border-top: ${v("bw")} solid ${v("line")}; background: ${v("bg")};
}
${R} .unilens-a11y-hint { margin: 0; font-size: 0.92em; line-height: 1.6; color: ${v("muted")}; text-align: center; }
${R} .unilens-a11y-kbd {
  display: inline-block; padding: 0 0.35em; border-radius: 6px;
  border: ${v("bw")} solid ${v("line")}; background: ${v("soft")};
  font-family: inherit; font-size: 0.95em; font-weight: 600; color: ${v("text")};
}

/* ── Focus indicator: 3px accent ring, offset 2px ───────────────────────── */
${F} button:focus-visible,
${F} [tabindex]:focus-visible {
  outline: 3px solid ${v("accent")};
  outline-offset: 2px;
}

/* ── Forced colors: the system palette draws the frame and the controls ── */
@media (forced-colors: active) {
  ${R} .unilens-a11y-panel { border: 2px solid CanvasText; }
  ${R} button { border: 1px solid ButtonText; }
  ${R} .unilens-a11y-choice[aria-checked="true"],
  ${R} .unilens-a11y-choice[aria-pressed="true"],
  ${R} .unilens-a11y-tab[aria-selected="true"],
  ${R} .unilens-a11y-level-btn[aria-checked="true"],
  ${R} .unilens-a11y-switch[aria-checked="true"] { forced-color-adjust: none; background: Highlight; color: HighlightText; border-color: Highlight; }
}

/* ── Small screens (smartphones) ───────────────────────────────────────────
   Move the toggle button to the bottom right, within thumb reach, and switch
   the panel to a sheet along the bottom. Keeping it pinned to the top would
   leave too little vertical room and force more scrolling.
   The sheet is the root itself stretched across the screen while open (not a
   position: fixed panel): under the invert theme the root carries a counter
   filter, which makes it the containing block of fixed descendants, and the
   fixed sheet was squeezed to the root's 100px. The root's inline position
   (set by toggleDrag) is overridden only while open. */
@media (max-width: 560px) {
  /* The root's own position: HOST_CSS. The sheet covers the toggle button, so
     it goes while open (× and Esc still close it). */
  ${S(".unilens-a11y-open")} .unilens-a11y-toggle { display: none; }
  ${R} .unilens-a11y-panel {
    width: 100%; margin: 0;
    max-height: min(80vh, calc(100vh - 16px));
  }
  ${R} .unilens-a11y-body { padding-bottom: calc(0.9em + env(safe-area-inset-bottom, 0px)); }
}

/* ── Short screens (phone in landscape, 200% zoom, a small window) ──────────
   With the header, tabs and footer fixed, the settings list got what was
   left: 80px on a phone in landscape, 50px at 200% zoom, 17px at 256px. So
   while open the root takes the full height (the toggle goes; × and Esc
   close), and the whole panel scrolls with only the header (and its ×) kept
   in view. */
@media (max-height: 560px) {
  ${S(".unilens-a11y-open")} .unilens-a11y-toggle { display: none; }
  ${R} .unilens-a11y-panel {
    max-height: 100%; margin: 0;
    overflow-y: auto; overscroll-behavior: contain;
    scrollbar-width: thin; scrollbar-color: ${v("scroll")} transparent;
  }
  ${R} .unilens-a11y-header { position: sticky; top: 0; z-index: 2; background: ${v("bg")}; }
  ${R} .unilens-a11y-body { flex: none; overflow: visible; }
  ${R} .unilens-a11y-hint { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  ${R} *, ${R} *::after { transition: none !important; animation: none !important; }
}
${S('[data-unilens-a11y-reduce-motion="true"]')} *,
${S('[data-unilens-a11y-reduce-motion="true"]')} *::before,
${S('[data-unilens-a11y-reduce-motion="true"]')} *::after {
  transition: none !important; animation: none !important;
}
`;
}

function widgetCss(mode: WidgetMode): string {
    return [
        tokenBlock(R, LIGHT),
        `@media (prefers-contrast: more) {\n${tokenBlock(R, HIGH_CONTRAST)}\n}`,
        layoutCss(mode),
    ].join("\n");
}

/** The whole panel stylesheet for the light-DOM fallback (no shadow DOM): in the document. */
export const WIDGET_CSS = [HOST_CSS, widgetCss("light")].join("\n");
/** With shadow DOM: the document gets the root's position only… */
export const WIDGET_HOST_CSS = HOST_CSS;
/** …and the shadow root gets the rest. */
export const WIDGET_SHADOW_CSS = widgetCss("shadow");
