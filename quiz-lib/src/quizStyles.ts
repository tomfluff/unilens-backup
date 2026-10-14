/**
 * Quiz panel — design tokens and widget CSS.
 *
 * Follows the display panel (accessibility-lib/src/accessibilityPanelStyles.ts)
 * so the two read as one UniLens: a white card, one accent, mist fills,
 * pills for what the visitor presses, 44px minimum targets, and a high-contrast
 * rendition on black, white and #ffd400 — used under `prefers-contrast: more`
 * and while the display panel's high-contrast theme is on.
 *
 * Right and wrong are never told by colour alone: each carries an icon and a
 * word ("正解" / "不正解").
 *
 * Legibility for everyone (PRODUCT.md: legible at 400%): 18px text at a 1.7
 * line height, a Universal Design typeface first (BIZ UDPGothic ships with
 * Windows 10+, Hiragino on macOS), outlines on everything you press at 3:1 or
 * more against the card (WCAG 1.4.11), and larger text again — 24px / 30px —
 * while the display panel's text size is set to large / extra large.
 *
 * Everything is scoped under #unilens-quiz-root, and every element under it
 * except SVG is first reverted to the browser defaults so the host's CSS
 * (`button {…}`, `label {…}`) never shapes the panel.
 */

import {
    CONTRAST_ATTR,
    MODE_ATTR,
    POSITION_ATTR,
    QUIZ_ROOT_ID,
    TEXT_SIZE_ATTR,
} from "./domIds";

type Tokens = Record<string, string>;

const LIGHT: Tokens = {
    bg: "#ffffff",
    soft: "#f1f3f5",
    text: "#1f2937",
    muted: "#4b5563",
    line: "#d1d5db",
    edge: "#6b7280",
    /* green, apart from the blue of the display panel: white on it is 5.0:1
       (WCAG AA for text) and it is 5.0:1 against the white card as a focus ring */
    accent: "#15803d",
    "accent-soft": "#f0fdf4",
    "on-accent": "#ffffff",
    ok: "#166534",
    "ok-soft": "#f0fdf4",
    danger: "#b91c1c",
    "danger-soft": "#fef2f2",
    bw: "1px",
    "bw-strong": "2px",
    "panel-border": "1px solid #e5e7eb",
    "toggle-border": "0px solid transparent",
    toggle: "#15803d",
    "on-toggle": "#ffffff",
    "shadow-panel":
        "0 16px 40px rgba(17, 24, 39, 0.18), 0 2px 6px rgba(17, 24, 39, 0.08)",
    "shadow-toggle":
        "0 8px 20px rgba(17, 24, 39, 0.2), 0 1px 3px rgba(17, 24, 39, 0.1)",
};

/** The same tokens on black, white and signal yellow (as the display panel). */
const HIGH_CONTRAST: Tokens = {
    bg: "#000000",
    soft: "#000000",
    text: "#ffffff",
    muted: "#ffffff",
    line: "#ffffff",
    edge: "#ffffff",
    accent: "#ffd400",
    "accent-soft": "#000000",
    "on-accent": "#000000",
    ok: "#ffffff",
    "ok-soft": "#000000",
    danger: "#ffd400",
    "danger-soft": "#000000",
    bw: "2px",
    "bw-strong": "3px",
    "panel-border": "3px solid #ffffff",
    "toggle-border": "3px solid #ffffff",
    toggle: "#ffd400",
    "on-toggle": "#000000",
    "shadow-panel": "none",
    "shadow-toggle": "none",
};

const PREFIX = "--unilens-quiz";

function tokenBlock(selector: string, tokens: Tokens): string {
    const body = Object.entries(tokens)
        .map(([key, value]) => `  ${PREFIX}-${key}: ${value};`)
        .join("\n");
    return `${selector} {\n${body}\n}`;
}

const R = `#${QUIZ_ROOT_ID}`;
/** element rules that must outrank the revert below: `html #root x` is (1,0,2) */
const B = `html ${R}`;
/** UD (Universal Design) faces first; installed fonts only — study pages load nothing from other origins */
const SYS = `"BIZ UDPGothic", "BIZ UDPゴシック", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", Meiryo, system-ui, -apple-system, "Segoe UI", sans-serif`;
const v = (name: string) => `var(${PREFIX}-${name})`;

const LAYOUT_CSS = `
${R} *:not(svg):not(svg *) { all: revert; }
${B} *:not(svg):not(svg *), ${B} *::before, ${B} *::after { box-sizing: border-box; }
${B} button, ${B} input { font: inherit; color: inherit; margin: 0; }
${B} button { cursor: pointer; }
${R} svg[fill="none"] { fill: none; }
${R} {
  ${PREFIX}-tap: max(44px, 2.75em);
  position: fixed; z-index: 2147483646;
  display: flex; flex-direction: column; gap: 10px;
  max-width: calc(100vw - 16px);
  font-family: ${SYS};
  font-size: 18px; line-height: 1.7;
  /* Japanese line breaking: no small kana or closing brackets at a line start */
  line-break: strict; overflow-wrap: break-word;
  text-align: left; color: ${v("text")};
  -webkit-font-smoothing: antialiased;
}
${R}[${TEXT_SIZE_ATTR}="large"] { font-size: 24px; }
${R}[${TEXT_SIZE_ATTR}="xlarge"] { font-size: 30px; }
${R}[${POSITION_ATTR}="top-right"] { top: 16px; right: 16px; align-items: flex-end; }
${R}[${POSITION_ATTR}="top-left"] { top: 16px; left: 16px; align-items: flex-start; }
${R}[${POSITION_ATTR}="bottom-right"] { bottom: 16px; right: 16px; align-items: flex-end; flex-direction: column-reverse; }
${R}[${POSITION_ATTR}="bottom-left"] { bottom: 16px; left: 16px; align-items: flex-start; flex-direction: column-reverse; }
${R} [hidden] { display: none !important; }
${R} ::selection { background: ${v("accent")}; color: ${v("on-accent")}; }

${R} .unilens-quiz-sr-only {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0;
  overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap;
}

/* ── Focus: one 3px ring for everything focusable ───────────────────────── */
${R} :focus { outline: none; }
${R} :focus-visible,
${R} .unilens-quiz-choice:has(input:focus-visible) {
  outline: 3px solid ${v("accent")}; outline-offset: 2px;
}
/* headings and the feedback box take focus to be read; a ring there is noise */
${R} [tabindex="-1"]:focus-visible { outline: none; }

/* ── Toggle ─────────────────────────────────────────────────────────────── */
${R} .unilens-quiz-toggle {
  display: inline-flex; align-items: center; gap: 0.5em;
  min-height: ${v("tap")}; padding: 0 1.05em;
  border: ${v("toggle-border")}; border-radius: 999px;
  background: ${v("toggle")}; color: ${v("on-toggle")};
  font-weight: 700; box-shadow: ${v("shadow-toggle")};
}
/* link mode: the pill is a link to the survey page */
${R} a.unilens-quiz-toggle { text-decoration: none; cursor: pointer; }
${R} .unilens-quiz-toggle[aria-expanded="true"] {
  box-shadow: 0 0 0 2px ${v("bg")}, 0 0 0 4px ${v("toggle")}, ${v("shadow-toggle")};
}
${R} .unilens-quiz-toggle:focus-visible { outline-color: ${v("toggle")}; }
${R} .unilens-quiz-badge {
  min-width: 1.6em; height: 1.6em; padding: 0 0.45em; border-radius: 999px;
  background: ${v("on-toggle")}; color: ${v("toggle")};
  font-size: 0.9em; font-weight: 700; font-variant-numeric: tabular-nums;
  display: inline-flex; align-items: center; justify-content: center;
}

/* ── Panel ──────────────────────────────────────────────────────────────── */
${R} .unilens-quiz-panel {
  /* 65% of the window wide; never narrower than 26em, never past the window */
  width: min(max(65vw, 26em), calc(100vw - 16px));
  /* three quarters of the window tall, whatever the content: longer content
     scrolls inside. Never past UniLens' settings gear (bottom left, 14px + 44px). */
  height: 75vh;
  max-height: calc(100vh - 150px);
  display: flex; flex-direction: column; overflow: hidden;
  border-radius: 16px; background: ${v("bg")}; color: ${v("text")};
  border: ${v("panel-border")}; box-shadow: ${v("shadow-panel")};
}
/* title | language switch | close on one row; the title wraps rather than pushing
   the close button onto a row of its own */
${R} .unilens-quiz-header {
  display: grid; grid-template-columns: minmax(0, 1fr) auto;
  align-items: center; gap: 0.6em; flex: none;
  padding: 0.6em 0.75em 0.6em 1.1em;
  border-bottom: ${v("bw")} solid ${v("line")};
}
${R} .unilens-quiz-title { min-width: 0; margin: 0; font-size: 1.1em; font-weight: 700; line-height: 1.3; }
${R} .unilens-quiz-icon-btn {
  display: grid; place-items: center; flex: none;
  width: ${v("tap")}; height: ${v("tap")}; padding: 0;
  border: ${v("bw")} solid transparent; border-radius: 10px;
  background: ${v("soft")}; color: ${v("text")};
}
${R} .unilens-quiz-body {
  flex: 1; min-height: 0; overflow-y: auto; padding: 1em 1.1em 1.2em;
  display: flex; flex-direction: column; gap: 0.9em;
}

${R} .unilens-quiz-muted { margin: 0; color: ${v("muted")}; }
${R} .unilens-quiz-heading { margin: 0; font-size: 1.25em; font-weight: 700; line-height: 1.5; }
${R} .unilens-quiz-text { margin: 0; white-space: pre-wrap; }

/* progress: the words say it; the bar only echoes them */
${R} .unilens-quiz-progress { display: flex; flex-direction: column; gap: 0.35em; }
${R} .unilens-quiz-progress-label { margin: 0; font-weight: 700; color: ${v("muted")}; font-variant-numeric: tabular-nums; }
${R} .unilens-quiz-bar {
  height: 8px; border-radius: 999px; overflow: hidden;
  background: ${v("soft")}; border: ${v("bw")} solid ${v("edge")};
}
${R} .unilens-quiz-bar > span { display: block; height: 100%; background: ${v("accent")}; }

/* ── Choices ────────────────────────────────────────────────────────────── */
${R} .unilens-quiz-fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
${R} .unilens-quiz-legend { padding: 0; margin: 0 0 0.6em; font-weight: 400; color: ${v("muted")}; }
${R} .unilens-quiz-choices { display: flex; flex-direction: column; gap: 0.5em; margin: 0; padding: 0; list-style: none; }
${R} .unilens-quiz-choice {
  display: flex; align-items: flex-start; gap: 0.7em;
  min-height: ${v("tap")}; padding: 0.6em 0.85em;
  border: ${v("bw-strong")} solid ${v("edge")}; border-radius: 12px;
  background: ${v("bg")}; color: ${v("text")}; cursor: pointer;
}
${R} .unilens-quiz-choice input {
  flex: none; width: 1.4em; height: 1.4em; margin: 0.15em 0 0;
  accent-color: ${v("accent")}; cursor: pointer;
}
${R} .unilens-quiz-choice-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.3em; }
${R} .unilens-quiz-choice:has(input:checked) { border-color: ${v("accent")}; background: ${v("accent-soft")}; font-weight: 700; }
${R} .unilens-quiz-choice[aria-disabled="true"] { cursor: default; }
${R} .unilens-quiz-choice[aria-disabled="true"] input { cursor: default; }
/* after an answer the verdict wins over the "picked" look (:has() outranks a plain attribute) */
${R} .unilens-quiz-choice[data-state="correct"],
${R} .unilens-quiz-choice[data-state="correct"]:has(input:checked) { border-color: ${v("ok")}; background: ${v("ok-soft")}; }
${R} .unilens-quiz-choice[data-state="wrong"],
${R} .unilens-quiz-choice[data-state="wrong"]:has(input:checked) { border-color: ${v("danger")}; background: ${v("danger-soft")}; border-style: dashed; }
${R} .unilens-quiz-marks { display: flex; flex-wrap: wrap; gap: 0.35em; }
${R} .unilens-quiz-mark {
  display: inline-flex; align-items: center; gap: 0.3em;
  padding: 0.05em 0.55em; border-radius: 999px;
  font-size: 0.95em; font-weight: 700; border: ${v("bw")} solid currentColor;
}
${R} .unilens-quiz-mark[data-kind="correct"] { color: ${v("ok")}; }
${R} .unilens-quiz-mark[data-kind="wrong"] { color: ${v("danger")}; }
${R} .unilens-quiz-mark[data-kind="picked"] { color: ${v("muted")}; }

/* ── Text answer ────────────────────────────────────────────────────────── */
${R} .unilens-quiz-input {
  display: block; width: 100%; min-height: ${v("tap")};
  padding: 0.5em 0.75em; border-radius: 10px;
  border: ${v("bw-strong")} solid ${v("edge")};
  background: ${v("bg")}; color: ${v("text")};
}
${R} .unilens-quiz-input[readonly] { background: ${v("soft")}; }
/* the IDs typed before the first question */
${R} .unilens-quiz-field { display: flex; flex-direction: column; gap: 0.3em; margin: 0 0 0.9em; max-width: 24em; }
${R} .unilens-quiz-field-label { font-weight: 700; }
${R} .unilens-quiz-input[aria-invalid="true"] { border-color: ${v("danger")}; }
${R} .unilens-quiz-ids { margin: 0 0 0.6em; color: ${v("muted")}; font-size: 0.9em; }

/* ── Actions ────────────────────────────────────────────────────────────── */
${R} .unilens-quiz-actions { display: flex; flex-wrap: wrap; gap: 0.5em; }
${R} .unilens-quiz-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.45em;
  min-height: ${v("tap")}; padding: 0 1.2em; border-radius: 999px;
  border: ${v("bw-strong")} solid ${v("accent")};
  background: ${v("accent")}; color: ${v("on-accent")}; font-weight: 700;
}
${R} a.unilens-quiz-btn { text-decoration: none; }
${R} .unilens-quiz-btn[data-variant="secondary"] { background: ${v("bg")}; color: ${v("text")}; border-color: ${v("edge")}; }
${R} .unilens-quiz-error { margin: 0; color: ${v("danger")}; font-weight: 700; display: flex; align-items: center; gap: 0.35em; }

/* ── Feedback ───────────────────────────────────────────────────────────── */
${R} .unilens-quiz-feedback {
  display: flex; flex-direction: column; gap: 0.4em;
  padding: 0.8em 0.95em; border-radius: 12px;
  border: ${v("bw-strong")} solid ${v("ok")}; background: ${v("ok-soft")};
}
${R} .unilens-quiz-feedback[data-correct="false"] { border-color: ${v("danger")}; background: ${v("danger-soft")}; }
${R} .unilens-quiz-verdict { display: flex; align-items: center; gap: 0.4em; margin: 0; font-size: 1.1em; font-weight: 700; }
${R} .unilens-quiz-feedback[data-correct="true"] .unilens-quiz-verdict { color: ${v("ok")}; }
${R} .unilens-quiz-feedback[data-correct="false"] .unilens-quiz-verdict { color: ${v("danger")}; }
${R} .unilens-quiz-label { font-weight: 700; }

/* ── Result ─────────────────────────────────────────────────────────────── */
${R} .unilens-quiz-score { margin: 0; font-size: 1.6em; font-weight: 700; line-height: 1.3; font-variant-numeric: tabular-nums; }
${R} .unilens-quiz-review { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.6em; }
${R} .unilens-quiz-review > li {
  padding: 0.7em 0.85em; border-radius: 12px;
  border: ${v("bw")} solid ${v("edge")}; background: ${v("bg")};
  display: flex; flex-direction: column; gap: 0.25em;
}
${R} .unilens-quiz-review-head { display: flex; align-items: center; gap: 0.5em; flex-wrap: wrap; margin: 0; font-weight: 700; }
${R} .unilens-quiz-review dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 0.15em 0.6em; }
${R} .unilens-quiz-review dt { font-weight: 700; color: ${v("muted")}; }
${R} .unilens-quiz-review dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }

/* ── Small screens: the panel becomes a sheet across the width ──────────── */
/* ── Survey page (mode "page"): the survey is the page, not a panel over one.
   A centred card at a comfortable reading width; the page scrolls, not the card. */
${R}[${MODE_ATTR}="page"] {
  position: static; z-index: auto; display: block; max-width: none;
}
${R}[${MODE_ATTR}="page"] .unilens-quiz-panel {
  width: min(48rem, 100%); height: auto; max-height: none; margin: 0 auto;
  overflow: visible;
}
${R}[${MODE_ATTR}="page"] .unilens-quiz-body { overflow: visible; }
${R}[${MODE_ATTR}="page"] .unilens-quiz-title { font-size: 1.35em; }

@media (max-width: 560px) {
  ${R} .unilens-quiz-panel { width: calc(100vw - 16px); }
  ${R}[${POSITION_ATTR}$="-right"] { right: 8px; }
  ${R}[${POSITION_ATTR}$="-left"] { left: 8px; }
}

@media (prefers-reduced-motion: reduce) {
  ${R} *, ${R} *::before, ${R} *::after { transition: none !important; animation: none !important; }
}

/* Windows High Contrast / forced colors: let the system palette through, keep the cues */
@media (forced-colors: active) {
  ${R} .unilens-quiz-panel { border: 2px solid CanvasText; }
  ${R} .unilens-quiz-choice, ${R} .unilens-quiz-feedback { border: 2px solid CanvasText; }
  ${R} .unilens-quiz-choice:has(input:checked) { outline: 2px solid Highlight; }
  ${R} .unilens-quiz-bar > span { background: Highlight; forced-color-adjust: none; }
}
`;

export const QUIZ_CSS = [
    tokenBlock(R, LIGHT),
    `@media (prefers-contrast: more) {\n${tokenBlock(R, HIGH_CONTRAST)}\n}`,
    tokenBlock(`${R}[${CONTRAST_ATTR}="high"]`, HIGH_CONTRAST),
    LAYOUT_CSS,
].join("\n");
