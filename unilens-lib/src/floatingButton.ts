/**
 * The floating button (#29; P04 asked for one, P03 forgot the assistant and searched
 * by hand for minutes): a way in that stays on screen. Two styles (Yotam, 2026-10-12,
 * from the options page):
 *
 *   round  a round button with the chat mark, directly above the settings gear at the
 *          bottom left (in the gear's place when there is none), the gear's size
 *          (Yotam: the two share a size), so it grows with the page's zoom as the
 *          gear does. It can remind: "Ask me about this page"
 *          beside it, after a while without a question, never while the chat is open
 *   bar    "Ask about this page" and a microphone, at the bottom centre, as tall as
 *          the gear at 100%. It keeps that size on screen at any zoom, so it never
 *          takes more of the window
 *
 * Pressing it opens the chat about what is on screen, as an Alt+click in the middle
 * of the window would (UnilensRoot); the microphone opens it listening. An open chat
 * is brought to the question instead. Both sizes follow the interface size.
 *
 * Neither covers what the page fixes at the bottom (a back-to-top button, a cookie
 * banner): it steps up above it, checked again as the page scrolls or changes.
 * Like the rest of UniLens's chrome it sits on <html>, outside <body>, so captures
 * and the page's zoom leave it alone.
 */
import { chatText } from "./chatI18n";
import { getSettings, onSettingsChange } from "./settings";
import { logEvent } from "./studyLog";
import { isOwnUI } from "./zoom";

export interface FabHooks {
    /** open the chat about the page (by voice when asked), near `from` */
    ask(voice: boolean, from: DOMRect): void;
    /** the chat is open and shown */
    chatOpen(): boolean;
}

/** with the minimap and the click feedback: under the chat */
const Z = "2147483646";
const CLASS = "ul-fab";
/** the gap to the gear, the window's edges and what it steps over, px */
const GAP = 10;
const EDGE = 14;
/** the settings gear's size in its font size (settingsPanelStyles.ts): the round
 *  button takes the gear's size, and the bar its height at 100% */
const GEAR_EM = 2.75;
/** how long the reminder shows, ms */
const TIP_MS = 8000;

const ICON = {
    chat: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H11l-5 4v-4H4z"/><path d="M12 7.6l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z" fill="currentColor" stroke-width="1"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
};

// the page's own styles never reach it: everything reverted, then set here
const CSS = `
.${CLASS} :where(button, span, div) { all: revert; box-sizing: border-box; }
.${CLASS} { position: fixed; left: 0; top: 0; width: 0; height: 0; z-index: ${Z}; pointer-events: none; }
.${CLASS} .${CLASS}-a, .${CLASS} .${CLASS}-c, .${CLASS} .${CLASS}-tip { position: fixed; pointer-events: auto; font-family: system-ui, "Segoe UI", sans-serif; box-shadow: 0 6px 18px rgba(17, 24, 39, .28); }
.${CLASS} svg { display: block; width: 100%; height: 100%; }
.${CLASS} .${CLASS}-a { width: var(--s); height: var(--s); padding: calc(var(--s) * .25); margin: 0; border-radius: 50%; border: 2px solid #fff; background: #2563eb; color: #fff; cursor: pointer; translate: -50% 0; }
.${CLASS} .${CLASS}-c { --u: calc(var(--h) * var(--k)); display: flex; align-items: center; gap: calc(var(--u) * .25); height: var(--u); padding: 0 calc(var(--u) * .1) 0 calc(var(--u) * .45); border-radius: calc(var(--u) / 2); border: max(1px, calc(var(--u) * .05)) solid #2563eb; background: #fff; translate: -50% 0; white-space: nowrap; }
.${CLASS} .${CLASS}-c.no-mic { padding-right: calc(var(--u) * .45); }
.${CLASS} .${CLASS}-c .t { margin: 0; padding: 0; border: 0; background: none; color: #1d4ed8; font: 600 calc(var(--u) * .4) / 1.2 system-ui, "Segoe UI", sans-serif; cursor: pointer; }
.${CLASS} .${CLASS}-c .m { width: calc(var(--u) * .8); height: calc(var(--u) * .8); margin: 0; padding: calc(var(--u) * .18); border: 0; border-radius: 50%; background: #2563eb; color: #fff; cursor: pointer; }
.${CLASS} .${CLASS}-tip { max-width: min(260px, 60vw); margin: 0; padding: calc(8px * var(--f)) calc(12px * var(--f)); border-radius: 10px; background: #111827; color: #fff; font: 600 calc(15px * var(--f)) / 1.35 system-ui, "Segoe UI", sans-serif; translate: 0 50%; cursor: pointer; }
.${CLASS} .${CLASS}-tip::after { content: ""; position: absolute; left: -6px; top: 50%; translate: 0 -50%; border: 6px solid transparent; border-left: 0; border-right-color: #111827; }
.${CLASS} :focus-visible { outline: 3px solid #111827; outline-offset: 3px; }
/* high contrast, as the chat and the gear */
.${CLASS}[data-hc="true"] .${CLASS}-a { background: #000; color: #ffd400; border: 3px solid #ffd400; }
.${CLASS}[data-hc="true"] .${CLASS}-c { background: #000; border-color: #ffd400; }
.${CLASS}[data-hc="true"] .${CLASS}-c .t { color: #ffd400; }
.${CLASS}[data-hc="true"] .${CLASS}-c .m { background: #ffd400; color: #000; }
.${CLASS}[data-hc="true"] .${CLASS}-tip { background: #000; border: 2px solid #ffd400; color: #ffd400; }
.${CLASS}[data-hc="true"] :focus-visible { outline-color: #fff; }
@media (forced-colors: active) {
  .${CLASS} .${CLASS}-a, .${CLASS} .${CLASS}-c, .${CLASS} .${CLASS}-c .m, .${CLASS} .${CLASS}-tip { border: 2px solid ButtonText; }
}`;

let hooks: FabHooks | null = null;
let root: HTMLDivElement | null = null;
let styleEl: HTMLStyleElement | null = null;
/** what is drawn now: the style, the microphone, the language */
let built = "";
let raf = 0;
let unsubs: (() => void)[] = [];
let watcher: MutationObserver | null = null;
/** when the user last asked anything (a click, a box, this button) */
let lastAsked = Date.now();
let tipTimer = 0;
let tipHide = 0;

/** the browser's zoom: window px over page px (a window's frame adds a little) */
export function browserZoom(): number {
    const outer = window.outerWidth;
    const inner = window.innerWidth;
    if (!outer || !inner) return 1;
    const z = outer / inner;
    // near 1 is the window's frame, not a zoom; zoomed out, the bar grows back
    return Math.abs(z - 1) < 0.05 ? 1 : z;
}

/** a question was asked: the reminder waits again from now */
export function noteAsked() {
    lastAsked = Date.now();
    hideTip();
}

function ensureStyle() {
    if (styleEl?.isConnected) return;
    styleEl = document.createElement("style");
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
}

function press(voice: boolean, el: Element) {
    noteAsked();
    hooks?.ask(voice, el.getBoundingClientRect());
}

/** (re)build the button for the current settings; none when off */
function build() {
    const s = getSettings();
    const T = chatText();
    const mic = s.floatingButton === "bar" && s.voiceInput;
    const key =
        s.floatingButton === "off"
            ? ""
            : `${s.floatingButton}|${mic}|${T.fabAsk}`;
    if (key === built && (root?.isConnected || !key)) return;
    built = key;
    root?.remove();
    root = null;
    if (!key) return;
    ensureStyle();
    root = document.createElement("div");
    root.className = CLASS;
    if (s.floatingButton === "round") {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `${CLASS}-a`;
        b.setAttribute("aria-label", T.fabAsk);
        b.title = T.fabAsk;
        b.innerHTML = ICON.chat;
        b.addEventListener("click", () => press(false, b));
        root.append(b);
    } else {
        const bar = document.createElement("div");
        bar.className = `${CLASS}-c${mic ? "" : " no-mic"}`;
        bar.setAttribute("role", "group");
        bar.setAttribute("aria-label", "UniLens");
        const t = document.createElement("button");
        t.type = "button";
        t.className = "t";
        t.textContent = T.fabBar;
        t.addEventListener("click", () => press(false, bar));
        bar.append(t);
        if (mic) {
            const m = document.createElement("button");
            m.type = "button";
            m.className = "m";
            m.setAttribute("aria-label", T.fabVoice);
            m.title = T.fabVoice;
            m.innerHTML = ICON.mic;
            m.addEventListener("click", () => press(true, bar));
            bar.append(m);
        }
        root.append(bar);
    }
    document.documentElement.appendChild(root);
}

/**
 * How far up a thing of this size must go, from `bottom` px above the window's
 * bottom edge, so that it covers nothing the page fixes there: each fixed or sticky
 * thing in the lower half of the window under it moves it up above that thing.
 */
export function stepUp(
    left: number,
    width: number,
    height: number,
    bottom: number,
): number {
    const H = window.innerHeight;
    for (let round = 0; round < 4; round++) {
        const top = H - bottom - height;
        let highest = Number.POSITIVE_INFINITY;
        // across its width every 16 px or so (at most 24 columns), so a small fixed
        // control under any part of it is found
        const cols = Math.min(24, Math.max(3, Math.ceil(width / 16) + 1));
        const xs = Array.from(
            { length: cols },
            (_, k) => left + 2 + ((width - 4) * k) / (cols - 1),
        );
        for (const x of xs)
            for (const y of [top + 2, top + height / 2, top + height - 2]) {
                if (x < 0 || y < 0 || x > window.innerWidth || y > H) continue;
                for (const hit of document.elementsFromPoint?.(x, y) ?? []) {
                    if (isOwnUI(hit)) continue;
                    const r = pinned(hit)?.getBoundingClientRect();
                    // only what sits in the lower half: a fixed header or a full-height
                    // side panel is not stepped over
                    if (r && r.top > H / 2) highest = Math.min(highest, r.top);
                }
            }
        if (!Number.isFinite(highest)) return bottom;
        const next = H - highest + GAP;
        if (next <= bottom) return bottom;
        // never above the middle of the window
        bottom = Math.min(next, H / 2);
    }
    return bottom;
}

/** the fixed or sticky element `el` is in, if any */
function pinned(el: Element): Element | null {
    for (
        let n: Element | null = el;
        n && n !== document.body;
        n = n.parentElement
    ) {
        const p = getComputedStyle(n).position;
        if (p === "fixed" || p === "sticky") return n;
    }
    return null;
}

function layout() {
    build();
    if (!root) return;
    const s = getSettings();
    root.dataset.hc = s.highContrast ? "true" : "false";
    const f = s.chatFontSize / 14;
    root.style.setProperty("--f", String(f));
    const tip = root.querySelector<HTMLElement>(`.${CLASS}-tip`);
    const a = root.querySelector<HTMLElement>(`.${CLASS}-a`);
    // the gear's size, so the two read as a pair (Yotam, 2026-10-12); without a gear,
    // the size it would have
    const gearEl = document.querySelector(".ul-set-launch");
    const gearSize =
        gearEl?.getBoundingClientRect().height || GEAR_EM * s.chatFontSize;
    if (a) {
        const size = gearSize;
        a.style.setProperty("--s", `${size}px`);
        // directly above the gear, centred on it; in its place when there is none
        const gear = gearEl?.getBoundingClientRect();
        const shown = gear && gear.width > 0;
        // (never closer to the window's edge than the gear is)
        const cx = Math.max(
            EDGE + size / 2,
            shown ? gear.left + gear.width / 2 : 0,
        );
        let bottom = shown ? window.innerHeight - gear.top + GAP : EDGE;
        bottom = stepUp(cx - size / 2, size, size, bottom);
        a.style.left = `${cx}px`;
        a.style.top = "auto";
        a.style.bottom = `${bottom}px`;
        if (tip) {
            tip.style.left = `${cx + size / 2 + GAP + 6}px`;
            tip.style.bottom = `${bottom + size / 2}px`;
        }
    }
    const c = root.querySelector<HTMLElement>(`.${CLASS}-c`);
    if (c) {
        // the same size on screen at any zoom of the browser
        const k = 1 / browserZoom();
        c.style.setProperty("--k", String(k));
        // as tall as the gear at 100%; its words and microphone in proportion
        c.style.setProperty("--h", `${gearSize}px`);
        const w = c.offsetWidth;
        const h = c.offsetHeight || gearSize * k;
        const cx = window.innerWidth / 2;
        const bottom = stepUp(cx - w / 2, w, h, EDGE);
        c.style.left = `${cx}px`;
        c.style.bottom = `${bottom}px`;
    }
}

function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
        raf = 0;
        layout();
        syncWatch();
    });
}

/** follow the page while the button shows */
function syncWatch() {
    const on = Boolean(root);
    if (on === unsubs.length > 0) return;
    if (!on) {
        for (const off of unsubs) off();
        unsubs = [];
        watcher?.disconnect();
        watcher = null;
        return;
    }
    window.addEventListener("scroll", schedule, {
        passive: true,
        capture: true,
    });
    window.addEventListener("resize", schedule);
    unsubs = [
        () => window.removeEventListener("scroll", schedule, { capture: true }),
        () => window.removeEventListener("resize", schedule),
    ];
    // the page showing or hiding something it fixes (a cookie banner going)
    watcher = new MutationObserver(schedule);
    watcher.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["style", "class", "hidden"],
    });
}

function hideTip() {
    clearTimeout(tipHide);
    root?.querySelector(`.${CLASS}-tip`)?.remove();
}

/** "Ask me about this page", beside the round button, for a few seconds */
function showTip() {
    const a = root?.querySelector<HTMLElement>(`.${CLASS}-a`);
    if (!root || !a || root.querySelector(`.${CLASS}-tip`)) return;
    // said by a screen reader as it appears; pressing it is pressing the button
    const tip = document.createElement("div");
    tip.className = `${CLASS}-tip`;
    tip.setAttribute("role", "status");
    tip.textContent = chatText().fabRemind;
    tip.addEventListener("click", () => press(false, a));
    root.append(tip);
    layout();
    logEvent("fab_reminder", {});
    tipHide = window.setTimeout(() => {
        hideTip();
        // the next one a whole wait from now
        lastAsked = Date.now();
    }, TIP_MS);
}

/** once a second: time for the reminder? */
function tick() {
    const s = getSettings();
    if (s.floatingButton !== "round" || !s.fabReminder) return hideTip();
    if (hooks?.chatOpen()) {
        hideTip();
        lastAsked = Date.now();
        return;
    }
    if (Date.now() - lastAsked >= s.fabReminderSec * 1000) showTip();
}

/** show the button while the setting is on; `ask` opens the chat */
export function initFloatingButton(h: FabHooks): () => void {
    hooks = h;
    lastAsked = Date.now();
    layout();
    syncWatch();
    // the gear appears after the first paint: place the button again then
    const late = window.setTimeout(schedule, 300);
    const offSettings = onSettingsChange(schedule);
    tipTimer = window.setInterval(tick, 1000);
    return () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        clearTimeout(late);
        clearInterval(tipTimer);
        hideTip();
        offSettings();
        root?.remove();
        root = null;
        built = "";
        syncWatch();
        hooks = null;
    };
}

/** synchronous layout, for tests */
export const layoutNow = () => layout();
