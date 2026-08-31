/**
 * Display adjustment panel — design tokens and widget CSS.
 *
 * Tokens define only the per-theme diffs; the CSS itself is generated on the
 * TypeScript side. Everything is scoped under #unilens-a11y-root so
 * it never collides with the embedding site's CSS.
 */
import { ROOT_ID } from "./accessibilityPanelUI";

type Tokens = Record<string, string>;

const LIGHT: Tokens = {
    accent: "#1257a0",
    "accent-dim": "rgba(18, 87, 160, 0.1)",
    "accent-ring": "rgba(18, 87, 160, 0.35)",
    "on-accent": "#ffffff",
    bg: "#f4f6fa",
    surface: "#ffffff",
    "surface-2": "#eef1f7",
    "surface-3": "#e2e7f0",
    border: "rgba(16, 24, 40, 0.14)",
    "border-strong": "rgba(16, 24, 40, 0.3)",
    text: "#16203a",
    muted: "#55607a",
    faint: "#788398",
    ok: "#0f6b3c",
    "ok-bg": "rgba(15, 107, 60, 0.1)",
    danger: "#a92a2a",
    "danger-bg": "rgba(169, 42, 42, 0.08)",
    "danger-border": "rgba(169, 42, 42, 0.4)",
    track: "rgba(16, 24, 40, 0.22)",
    knob: "#ffffff",
    "knob-on": "#ffffff",
    focus: "#0b57d0",
    "toggle-bg": "linear-gradient(135deg, #10456f 0%, #1a6aa8 100%)",
    "toggle-border": "rgba(10, 40, 70, 0.5)",
    "toggle-text": "#ffffff",
    "badge-bg": "#ffd23f",
    "badge-text": "#3a2c00",
    "shadow-panel": "0 18px 50px rgba(16, 24, 40, 0.18)",
    "shadow-toggle": "0 6px 18px rgba(16, 24, 40, 0.2)",
    "shadow-raise": "0 1px 3px rgba(16, 24, 40, 0.2)",
};

function tokenBlock(selector: string, tokens: Tokens): string {
    const body = Object.entries(tokens)
        .map(([key, value]) => `  --unilens-a11y-panel-${key}: ${value};`)
        .join("\n");
    return `${selector} {\n${body}\n}`;
}

const R = `#${ROOT_ID}`;

/**
 * Overlay uses a stable light theme. Page display filters never restyle the panel.
 */
const LAYOUT_CSS = `
${R} {
  --unilens-a11y-panel-base: 15px;
  --unilens-a11y-panel-font-scale: 1;
  --unilens-a11y-panel-line-height: 1.5;
  --unilens-a11y-panel-font-family: "Segoe UI", system-ui, -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif;
  --unilens-a11y-panel-saturate: 1;
  --unilens-a11y-panel-contrast: 1;
  --unilens-a11y-panel-tap: 44px;
  position: fixed; bottom: 16px; right: 16px; top: auto; z-index: 2147483646;
  display: flex; flex-direction: column-reverse; align-items: flex-end;
  font-family: var(--unilens-a11y-panel-font-family);
  font-size: calc(var(--unilens-a11y-panel-base) * var(--unilens-a11y-panel-font-scale));
  line-height: var(--unilens-a11y-panel-line-height);
  letter-spacing: var(--unilens-a11y-panel-letter-spacing, 0);
  color: var(--unilens-a11y-panel-text);
  -webkit-font-smoothing: antialiased;
}
${R} *, ${R} *::before, ${R} *::after { box-sizing: border-box; }
${R} button { font: inherit; margin: 0; }

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

/* ── Toggle button ──────────────────────────────────────────────────────── */
${R} .unilens-a11y-toggle {
  display: inline-flex; align-items: center; gap: 0.5em;
  min-height: var(--unilens-a11y-panel-tap); padding: 0 1.05em;
  border: 2px solid var(--unilens-a11y-panel-toggle-border); border-radius: 999px;
  background: var(--unilens-a11y-panel-toggle-bg); color: var(--unilens-a11y-panel-toggle-text);
  font-size: 0.93em; font-weight: 700; cursor: pointer;
  box-shadow: var(--unilens-a11y-panel-shadow-toggle);
  transition: transform 0.12s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
${R} .unilens-a11y-toggle:hover { transform: translateY(-1px); border-color: var(--unilens-a11y-panel-accent); }
${R} .unilens-a11y-toggle:active { transform: translateY(0); }
${R} .unilens-a11y-toggle-active { border-color: var(--unilens-a11y-panel-accent); }
${R} .unilens-a11y-toggle-badge {
  min-width: 1.55em; height: 1.55em; padding: 0 0.35em; border-radius: 999px;
  background: var(--unilens-a11y-panel-badge-bg); color: var(--unilens-a11y-panel-badge-text);
  font-size: 0.76em; font-weight: 800; font-variant-numeric: tabular-nums;
  display: inline-flex; align-items: center; justify-content: center;
}

/* ── Panel ──────────────────────────────────────────────────────────────── */
${R} .unilens-a11y-panel {
  margin-bottom: 10px;
  margin-top: 0;
  width: min(calc(380px * var(--unilens-a11y-panel-font-scale)), calc(100vw - 24px));
  max-height: calc(100vh - 88px);
  display: flex; flex-direction: column; overflow: hidden;
  border-radius: 18px; background: var(--unilens-a11y-panel-bg);
  border: 1px solid var(--unilens-a11y-panel-border);
  box-shadow: var(--unilens-a11y-panel-shadow-panel);
  animation: unilens-a11y-panel-in 0.16s ease-out;
}
@keyframes unilens-a11y-panel-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}

${R} .unilens-a11y-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid var(--unilens-a11y-panel-border);
  background: linear-gradient(180deg, var(--unilens-a11y-panel-accent-dim) 0%, transparent 100%);
}
${R} .unilens-a11y-header-icon {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; flex-shrink: 0; border-radius: 11px;
  background: var(--unilens-a11y-panel-accent); color: var(--unilens-a11y-panel-on-accent);
}
${R} .unilens-a11y-header-text { flex: 1; min-width: 0; }
${R} .unilens-a11y-title { margin: 0; font-size: 1.06em; font-weight: 800; letter-spacing: 0.01em; }
${R} .unilens-a11y-subtitle { margin: 1px 0 0; font-size: 0.78em; font-weight: 400; color: var(--unilens-a11y-panel-muted); }
${R} .unilens-a11y-close {
  display: flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; flex-shrink: 0;
  border-radius: 11px; border: 2px solid var(--unilens-a11y-panel-border);
  background: var(--unilens-a11y-panel-surface); color: var(--unilens-a11y-panel-muted); cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
${R} .unilens-a11y-close:hover { color: var(--unilens-a11y-panel-text); border-color: var(--unilens-a11y-panel-border-strong); background: var(--unilens-a11y-panel-surface-2); }

/* ── Tabs ───────────────────────────────────────────────────────────────── */
${R} .unilens-a11y-tabs {
  display: flex; margin: 0; padding: 0 8px; list-style: none; gap: 2px;
  border-bottom: 1px solid var(--unilens-a11y-panel-border); background: var(--unilens-a11y-panel-surface);
}
${R} .unilens-a11y-tabs li { flex: 1; display: flex; }
${R} .unilens-a11y-tab {
  position: relative;
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  min-height: 54px; padding: 7px 4px; border: none; border-bottom: 3px solid transparent;
  background: transparent; color: var(--unilens-a11y-panel-muted);
  font-size: 0.8em; font-weight: 700; cursor: pointer;
  border-radius: 10px 10px 0 0;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
${R} .unilens-a11y-tab:hover { color: var(--unilens-a11y-panel-text); background: var(--unilens-a11y-panel-surface-2); }
${R} .unilens-a11y-tab[aria-selected="true"] {
  color: var(--unilens-a11y-panel-accent); border-bottom-color: var(--unilens-a11y-panel-accent); background: var(--unilens-a11y-panel-accent-dim);
}
${R} .unilens-a11y-tab-count {
  position: absolute; top: 6px; right: 8px;
  min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px;
  background: var(--unilens-a11y-panel-accent); color: var(--unilens-a11y-panel-on-accent);
  font-size: 0.68em; font-weight: 800; line-height: 17px; text-align: center;
}

/* ── Applied chips ──────────────────────────────────────────────────────── */
${R} .unilens-a11y-chips {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
  padding: 10px 12px; border-bottom: 1px solid var(--unilens-a11y-panel-border); background: var(--unilens-a11y-panel-surface);
}
${R} .unilens-a11y-chips-label { font-size: 0.76em; font-weight: 700; color: var(--unilens-a11y-panel-muted); }
${R} .unilens-a11y-chip {
  display: inline-flex; align-items: center; gap: 2px;
  padding: 3px 3px 3px 9px; border-radius: 999px;
  background: var(--unilens-a11y-panel-accent-dim); border: 1px solid var(--unilens-a11y-panel-accent-ring); color: var(--unilens-a11y-panel-accent);
  font-size: 0.76em; font-weight: 700;
}
${R} .unilens-a11y-chip-x {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border: none; border-radius: 50%;
  background: transparent; color: inherit; cursor: pointer;
}
${R} .unilens-a11y-chip-x:hover { background: var(--unilens-a11y-panel-accent); color: var(--unilens-a11y-panel-on-accent); }

/* ── Body (scroll area) ─────────────────────────────────────────────────── */
${R} .unilens-a11y-body { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 12px; scrollbar-width: thin; }
${R} .unilens-a11y-body::-webkit-scrollbar { width: 10px; }
${R} .unilens-a11y-body::-webkit-scrollbar-thumb { background: var(--unilens-a11y-panel-border-strong); border-radius: 999px; border: 3px solid transparent; background-clip: content-box; }
${R} .unilens-a11y-tabpanel { display: none; }
${R} .unilens-a11y-tabpanel-active { display: block; }

/* ── Card ───────────────────────────────────────────────────────────────── */
${R} .unilens-a11y-card {
  display: block; background: var(--unilens-a11y-panel-surface); border: 1px solid var(--unilens-a11y-panel-border);
  border-radius: 14px; padding: 13px 14px 14px; margin-bottom: 12px;
}
${R} .unilens-a11y-card:last-child { margin-bottom: 0; }
${R} .unilens-a11y-card-head { display: flex; align-items: center; gap: 8px; }
${R} .unilens-a11y-card-icon { display: flex; color: var(--unilens-a11y-panel-accent); flex-shrink: 0; }
${R} .unilens-a11y-card-title { margin: 0; font-size: 0.95em; font-weight: 800; }
${R} .unilens-a11y-card-badge {
  margin-left: auto; padding: 2px 9px; border-radius: 999px;
  background: var(--unilens-a11y-panel-accent); color: var(--unilens-a11y-panel-on-accent);
  font-size: 0.7em; font-weight: 800; white-space: nowrap;
}
${R} .unilens-a11y-card-desc { margin: 6px 0 13px; font-size: 0.78em; line-height: 1.55; color: var(--unilens-a11y-panel-muted); }
${R} .unilens-a11y-card-head + .unilens-a11y-group,
${R} .unilens-a11y-card-head + .unilens-a11y-switch-row { margin-top: 12px; }
${R} .unilens-a11y-switch-row + .unilens-a11y-switch-row { margin-top: 10px; }

/* ── Input group ────────────────────────────────────────────────────────── */
${R} .unilens-a11y-group { margin: 0 0 14px; padding: 0; border: none; }
${R} .unilens-a11y-group:last-child { margin-bottom: 0; }
${R} .unilens-a11y-group-label {
  display: block; padding: 0; margin-bottom: 7px;
  font-size: 0.79em; font-weight: 700; color: var(--unilens-a11y-panel-muted);
}

/* ── Choice card ────────────────────────────────────────────────────────── */
${R} .unilens-a11y-choices { display: grid; grid-template-columns: repeat(var(--unilens-a11y-panel-cols, 2), minmax(0, 1fr)); gap: 7px; }
${R} .unilens-a11y-choice {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
  min-height: var(--unilens-a11y-panel-tap); padding: 9px 6px;
  border: 2px solid var(--unilens-a11y-panel-border); border-radius: 12px;
  background: var(--unilens-a11y-panel-surface-2); color: var(--unilens-a11y-panel-text);
  font-size: 0.82em; font-weight: 600; line-height: 1.25; text-align: center; cursor: pointer;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
}
${R} .unilens-a11y-choice:hover:not(:disabled) { border-color: var(--unilens-a11y-panel-border-strong); background: var(--unilens-a11y-panel-surface-3); }
${R} .unilens-a11y-choice:active:not(:disabled) { transform: scale(0.97); }
${R} .unilens-a11y-choice:disabled { cursor: not-allowed; opacity: 0.5; }
${R} .unilens-a11y-choice[aria-checked="true"],
${R} .unilens-a11y-choice[aria-pressed="true"] {
  border-color: var(--unilens-a11y-panel-accent); background: var(--unilens-a11y-panel-accent-dim); color: var(--unilens-a11y-panel-accent); font-weight: 800;
}
${R} .unilens-a11y-choice-check {
  position: absolute; top: -8px; right: -8px;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--unilens-a11y-panel-accent); color: var(--unilens-a11y-panel-on-accent);
  border: 2px solid var(--unilens-a11y-panel-surface);
  display: none; align-items: center; justify-content: center;
}
${R} .unilens-a11y-choice[aria-checked="true"] .unilens-a11y-choice-check,
${R} .unilens-a11y-choice[aria-pressed="true"] .unilens-a11y-choice-check { display: flex; }
${R} .unilens-a11y-choice-label { display: block; }
${R} .unilens-a11y-choice-hint { display: block; font-size: 0.85em; font-weight: 600; opacity: 0.72; font-variant-numeric: tabular-nums; }

/* ── Preview components ─────────────────────────────────────────────────── */
${R} .unilens-a11y-swatch {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 26px; border-radius: 7px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  font-size: 0.95em; font-weight: 800;
}
${R} .unilens-a11y-strip {
  display: block; width: 100%; height: 18px; border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  background: linear-gradient(90deg, #d92b2b 0%, #dd8b00 25%, #1f9d3f 50%, #1f63d9 75%, #8b2bd9 100%);
}
${R} .unilens-a11y-sample { display: flex; align-items: center; justify-content: center; height: 26px; line-height: 1; }
${R} .unilens-a11y-lines { display: flex; flex-direction: column; justify-content: center; width: 70%; height: 26px; }
${R} .unilens-a11y-line { display: block; height: 2px; border-radius: 2px; background: currentColor; opacity: 0.6; }

/* ── Level choice ───────────────────────────────────────────────────────── */
${R} .unilens-a11y-level {
  display: flex; gap: 4px; padding: 4px;
  background: var(--unilens-a11y-panel-surface-2); border: 1px solid var(--unilens-a11y-panel-border); border-radius: 13px;
}
${R} .unilens-a11y-level-btn {
  flex: 1; min-width: 0; min-height: 52px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  border: none; border-radius: 10px; background: transparent; color: var(--unilens-a11y-panel-muted);
  font-size: 0.8em; font-weight: 700; cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
${R} .unilens-a11y-level-btn:hover { background: var(--unilens-a11y-panel-surface-3); color: var(--unilens-a11y-panel-text); }
${R} .unilens-a11y-level-btn[aria-checked="true"] {
  background: var(--unilens-a11y-panel-accent); color: var(--unilens-a11y-panel-on-accent); box-shadow: var(--unilens-a11y-panel-shadow-raise);
}
${R} .unilens-a11y-level-meter { display: flex; align-items: flex-end; justify-content: center; gap: 2px; height: 12px; }
${R} .unilens-a11y-level-bar { display: block; width: 3px; border-radius: 2px; background: currentColor; opacity: 0.3; }
${R} .unilens-a11y-level-bar--on { opacity: 1; }
${R} .unilens-a11y-level-off { display: block; width: 11px; height: 2px; border-radius: 2px; background: currentColor; opacity: 0.7; }
${R} .unilens-a11y-level-label { display: block; }
${R} .unilens-a11y-level-hint { display: block; font-size: 0.85em; font-weight: 600; opacity: 0.8; font-variant-numeric: tabular-nums; }

/* ── Switch ─────────────────────────────────────────────────────────────── */
${R} .unilens-a11y-switch-row { display: flex; align-items: center; gap: 12px; min-height: var(--unilens-a11y-panel-tap); }
${R} .unilens-a11y-switch-text { flex: 1; min-width: 0; }
${R} .unilens-a11y-switch-label { display: block; font-size: 0.9em; font-weight: 700; }
${R} .unilens-a11y-switch-hint { display: block; margin-top: 2px; font-size: 0.76em; color: var(--unilens-a11y-panel-muted); line-height: 1.45; }
${R} .unilens-a11y-switch {
  position: relative; flex-shrink: 0; width: 48px; height: 28px; padding: 0;
  border: 2px solid var(--unilens-a11y-panel-border); border-radius: 999px;
  background: var(--unilens-a11y-panel-track); cursor: pointer; transition: background 0.18s;
}
${R} .unilens-a11y-switch::after {
  content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
  border-radius: 50%; background: var(--unilens-a11y-panel-knob); box-shadow: var(--unilens-a11y-panel-shadow-raise);
  transition: transform 0.18s ease, background 0.18s;
}
${R} .unilens-a11y-switch[aria-checked="true"] { background: var(--unilens-a11y-panel-accent); border-color: var(--unilens-a11y-panel-accent); }
${R} .unilens-a11y-switch[aria-checked="true"]::after { background: var(--unilens-a11y-panel-knob-on); transform: translateX(20px); }

/* ── Button ─────────────────────────────────────────────────────────────── */
${R} .unilens-a11y-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: var(--unilens-a11y-panel-tap); padding: 0 14px;
  border: 2px solid transparent; border-radius: 11px;
  font-size: 0.84em; font-weight: 700; cursor: pointer; white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
}
${R} .unilens-a11y-btn:active { transform: scale(0.97); }
${R} .unilens-a11y-btn--primary { background: var(--unilens-a11y-panel-accent); color: var(--unilens-a11y-panel-on-accent); border-color: var(--unilens-a11y-panel-accent); }
${R} .unilens-a11y-btn--primary:hover { filter: brightness(1.08); }
${R} .unilens-a11y-btn--secondary { background: var(--unilens-a11y-panel-surface-2); color: var(--unilens-a11y-panel-text); border-color: var(--unilens-a11y-panel-border); }
${R} .unilens-a11y-btn--secondary:hover { background: var(--unilens-a11y-panel-surface-3); border-color: var(--unilens-a11y-panel-border-strong); }
${R} .unilens-a11y-btn--quiet { background: transparent; color: var(--unilens-a11y-panel-muted); border-color: var(--unilens-a11y-panel-border); }
${R} .unilens-a11y-btn--quiet:hover { background: var(--unilens-a11y-panel-surface-2); color: var(--unilens-a11y-panel-text); }
${R} .unilens-a11y-btn--danger { background: var(--unilens-a11y-panel-danger-bg); color: var(--unilens-a11y-panel-danger); border-color: var(--unilens-a11y-panel-danger-border); }
${R} .unilens-a11y-btn--danger:hover { background: var(--unilens-a11y-panel-danger); color: var(--unilens-a11y-panel-surface); }
${R} .unilens-a11y-btn--icon { min-width: var(--unilens-a11y-panel-tap); padding: 0; }
${R} .unilens-a11y-btn--full { width: 100%; }
${R} .unilens-a11y-btn:disabled { opacity: 0.45; cursor: default; }
${R} .unilens-a11y-btn:disabled:hover { filter: none; background: var(--unilens-a11y-panel-surface-2); }
${R} .unilens-a11y-btn--quiet:disabled:hover { background: transparent; color: var(--unilens-a11y-panel-muted); }
${R} .unilens-a11y-btn:disabled:active { transform: none; }
${R} .unilens-a11y-btn-row { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
${R} .unilens-a11y-btn-row .unilens-a11y-btn { flex: 1 1 auto; }
${R} .unilens-a11y-btn-row .unilens-a11y-btn--icon { flex: 0 0 auto; }

/* ── Stepper ────────────────────────────────────────────────────────────── */
${R} .unilens-a11y-stepper { display: flex; align-items: center; gap: 8px; }
${R} .unilens-a11y-stepper-value {
  flex: 1; display: flex; align-items: center; justify-content: center;
  min-height: var(--unilens-a11y-panel-tap); border-radius: 11px;
  background: var(--unilens-a11y-panel-surface-2); border: 1px solid var(--unilens-a11y-panel-border);
  font-size: 0.9em; font-weight: 800; font-variant-numeric: tabular-nums;
}

/* ── Hint display ───────────────────────────────────────────────────────── */
${R} .unilens-a11y-note {
  display: flex; align-items: center; gap: 8px; margin: 12px 0 0;
  padding: 9px 11px; border-radius: 10px;
  font-size: 0.79em; line-height: 1.5;
  background: var(--unilens-a11y-panel-surface-2); color: var(--unilens-a11y-panel-muted);
}
${R} .unilens-a11y-note svg { flex-shrink: 0; }
${R} .unilens-a11y-note--info { background: var(--unilens-a11y-panel-accent-dim); color: var(--unilens-a11y-panel-accent); }
${R} .unilens-a11y-note--ok { background: var(--unilens-a11y-panel-ok-bg); color: var(--unilens-a11y-panel-ok); }
${R} .unilens-a11y-note--error { background: var(--unilens-a11y-panel-danger-bg); color: var(--unilens-a11y-panel-danger); }

${R} .unilens-a11y-metrics {
  display: grid; grid-template-columns: auto 1fr; gap: 5px 12px;
  margin: 12px 0 0; padding: 11px 12px; border-radius: 11px;
  background: var(--unilens-a11y-panel-surface-2); border: 1px solid var(--unilens-a11y-panel-border);
  font-size: 0.79em;
}
${R} .unilens-a11y-metrics dt { color: var(--unilens-a11y-panel-muted); font-weight: 600; }
${R} .unilens-a11y-metrics dd { margin: 0; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }

/* ── Footer ─────────────────────────────────────────────────────────────── */
${R} .unilens-a11y-footer {
  display: flex; flex-direction: column; gap: 8px;
  padding: 11px 12px 12px; border-top: 1px solid var(--unilens-a11y-panel-border); background: var(--unilens-a11y-panel-surface);
}
${R} .unilens-a11y-hint { margin: 0; font-size: 0.75em; line-height: 1.6; color: var(--unilens-a11y-panel-faint); text-align: center; }
${R} .unilens-a11y-kbd {
  display: inline-block; padding: 0 5px; border-radius: 4px;
  border: 1px solid var(--unilens-a11y-panel-border); background: var(--unilens-a11y-panel-surface-2);
  font-size: 0.95em; font-weight: 700; color: var(--unilens-a11y-panel-muted);
}

/* ── Focus indicator ────────────────────────────────────────────────────── */
${R} button:focus-visible,
${R} [tabindex]:focus-visible {
  outline: 3px solid var(--unilens-a11y-panel-focus);
  outline-offset: 2px;
}

/* ── Small screens (smartphones) ───────────────────────────────────────────
   Move the toggle button to the bottom right, within thumb reach, and switch
   the panel to a sheet that slides up from the bottom. Keeping it pinned to
   the top would leave too little vertical room and force more scrolling. */
@media (max-width: 560px) {
  ${R} { bottom: 14px; right: 14px; }
  /* The sheet overlaps the toggle button, so hide it while open (× and Esc still close it). */
  ${R}.unilens-a11y-open .unilens-a11y-toggle { visibility: hidden; }
  ${R} .unilens-a11y-panel {
    position: fixed; left: 10px; right: 10px; bottom: 10px; top: auto;
    width: auto; margin-top: 0;
    max-height: min(80vh, calc(100vh - 20px));
    border-radius: 20px;
    animation: unilens-a11y-sheet-in 0.18s ease-out;
  }
  ${R} .unilens-a11y-body { padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0px)); }
}
@keyframes unilens-a11y-sheet-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  ${R} *, ${R} *::after { transition: none !important; animation: none !important; }
}
${R}[data-unilens-a11y-reduce-motion="true"] *,
${R}[data-unilens-a11y-reduce-motion="true"] *::before,
${R}[data-unilens-a11y-reduce-motion="true"] *::after {
  transition: none !important; animation: none !important;
}
`;

export const WIDGET_CSS = [tokenBlock(R, LIGHT), LAYOUT_CSS].join("\n");
