/**
 * Lasting click marks (P02 and P03, session 1; the setting `clickMarks`): a mark
 * stays where each Alt+click landed, numbered P1, P2, … as the chat's place entries
 * are, until the conversation starts over. The chat's entries take the user back
 * to each place; the marks show where those places are on the page.
 *
 * A mark follows what was clicked while it is on the page (a reflow or a zoom that
 * re-wraps the text moves it with the element), and the content point otherwise
 * (a place brought back after a reload has no element). Like the highlights, the
 * marks sit on <html>, outside <body>: no capture or inventory sees them, they never
 * take a click, and the zoom transform leaves them at their size on screen.
 */
import { allPlaces, onPlacesChange, type Place, placeNumber } from "./places";
import { getSettings, onSettingsChange } from "./settings";
import {
    clientToContent,
    getView,
    getZoom,
    onViewChange,
    onZoomChange,
} from "./zoom";

/** under the highlights (…645): a source drawn over a click keeps its outline */
const LAYER_Z = "2147483644";
const CLASS = "unilens-mark";

const CSS = `
.${CLASS}-layer { position: fixed; left: 0; top: 0; width: 0; height: 0; pointer-events: none; z-index: ${LAYER_Z}; }
.${CLASS} { position: fixed; pointer-events: none; }
/* a ring and a dot in the highlight colour between black rims: it reads on any page */
.${CLASS} .ring { position: absolute; left: 0; top: 0; width: 34px; height: 34px; translate: -50% -50%; border-radius: 50%; border: 4px solid var(--ul-mark); box-shadow: 0 0 0 2px #000, inset 0 0 0 2px #000; }
.${CLASS} .dot { position: absolute; left: 0; top: 0; width: 10px; height: 10px; translate: -50% -50%; border-radius: 50%; background: var(--ul-mark); box-shadow: 0 0 0 2px #000; }
/* the number, as the chat's entry shows it, above and to the right of the ring */
.${CLASS} .num { position: absolute; left: 14px; bottom: 14px; padding: 1px 7px; border: 2px solid #000; border-radius: 6px; background: var(--ul-mark); color: #000; font: 800 18px/1.2 system-ui, sans-serif; white-space: nowrap; }
@media (forced-colors: active) {
  .${CLASS} .ring, .${CLASS} .dot, .${CLASS} .num { forced-color-adjust: none; box-shadow: none; }
  .${CLASS} .ring { border-color: CanvasText; }
  .${CLASS} .dot { background: CanvasText; }
  .${CLASS} .num { background: CanvasText; color: Canvas; border-color: Canvas; }
}`;

let layer: HTMLDivElement | null = null;
let styleEl: HTMLStyleElement | null = null;
const marks = new Map<Place, HTMLDivElement>();
/** where the click was within what was clicked, in content px from its top-left,
 *  measured at the click (Place.offset), or else when the place was made */
const anchors = new WeakMap<Place, { x: number; y: number }>();
let unsubs: (() => void)[] = [];
let raf = 0;
let watcher: MutationObserver | null = null;

function ensureLayer(): HTMLDivElement {
    if (layer?.isConnected) return layer;
    if (!styleEl?.isConnected) {
        styleEl = document.createElement("style");
        styleEl.textContent = CSS;
        document.head.appendChild(styleEl);
    }
    layer = document.createElement("div");
    layer.className = `${CLASS}-layer`;
    layer.id = "unilens-click-marks";
    // the chat's place entries say the same, to a screen reader
    layer.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(layer);
    return layer;
}

/** the click within its element, for a place made without one: measured now */
function anchorOf(p: Place) {
    if (p.offset || anchors.has(p) || !p.el?.isConnected) return;
    const r = p.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const { scale } = getZoom();
    const at = clientToContent(r.left, r.top);
    const x = p.x - at.x;
    const y = p.y - at.y;
    // outside it (a region's centre): the point alone
    if (x < 0 || y < 0 || x > r.width / scale || y > r.height / scale) return;
    anchors.set(p, { x, y });
}

/** where the mark goes on screen, client px; null when it cannot be placed */
export function markPoint(p: Place): { x: number; y: number } | null {
    const { scale } = getZoom();
    // measured at the click, even if the element was away when the place was made
    const a = p.offset ?? anchors.get(p);
    if (a && p.el?.isConnected) {
        const r = p.el.getBoundingClientRect();
        if (r.width || r.height)
            return {
                x: r.left + Math.min(a.x * scale, r.width),
                y: r.top + Math.min(a.y * scale, r.height),
            };
    }
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
    const v = getView();
    return { x: p.x * scale - v.x, y: p.y * scale - v.y };
}

function render() {
    const on = getSettings().clickMarks;
    const list = on ? allPlaces().order : [];
    for (const [p, el] of marks)
        if (!list.includes(p)) {
            el.remove();
            marks.delete(p);
        }
    if (!list.length) {
        stop();
        return;
    }
    const host = ensureLayer();
    const color = getSettings().hlColor;
    for (const p of list) {
        let el = marks.get(p);
        if (!el) {
            el = document.createElement("div");
            el.className = CLASS;
            el.innerHTML = `<span class="ring"></span><span class="dot"></span><span class="num"></span>`;
            host.appendChild(el);
            marks.set(p, el);
        }
        const num = el.querySelector(".num");
        const n = `P${placeNumber(p)}`;
        if (num && num.textContent !== n) num.textContent = n;
        el.style.setProperty("--ul-mark", color);
        const at = markPoint(p);
        el.style.display = at ? "" : "none";
        if (at) {
            el.style.left = `${at.x}px`;
            el.style.top = `${at.y}px`;
        }
    }
    start();
}

function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
        raf = 0;
        render();
    });
}

/** follow the page while there are marks to show */
function start() {
    if (unsubs.length) return;
    const vv = window.visualViewport;
    window.addEventListener("scroll", schedule, {
        passive: true,
        capture: true,
    });
    window.addEventListener("resize", schedule);
    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);
    // an image arriving re-flows what is around it
    document.addEventListener("load", schedule, true);
    unsubs = [
        () => document.removeEventListener("load", schedule, true),
        () => window.removeEventListener("scroll", schedule, { capture: true }),
        () => window.removeEventListener("resize", schedule),
        () => vv?.removeEventListener("resize", schedule),
        () => vv?.removeEventListener("scroll", schedule),
        onViewChange(schedule),
        onZoomChange(schedule),
    ];
    // the page changing under a mark (a section opening above it) moves what was
    // clicked; the marks live outside <body>, so their own moves are not seen
    watcher = new MutationObserver(schedule);
    watcher.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["style", "class", "hidden", "open"],
        // a text edit re-wraps what is around it
        characterData: true,
    });
}

function stop() {
    for (const off of unsubs) off();
    unsubs = [];
    watcher?.disconnect();
    watcher = null;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    layer?.remove();
    layer = null;
}

let installed = false;
/** watch the places and the setting; marks show only while it is on */
export function initClickMarks() {
    if (installed) return;
    installed = true;
    onPlacesChange(() => {
        // measured now, while what was clicked is where it was clicked
        for (const p of allPlaces().order) anchorOf(p);
        render();
    });
    onSettingsChange(schedule);
}

/** synchronous redraw, for tests */
export const relayMarks = () => render();
