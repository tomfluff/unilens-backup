/**
 * Lasting click marks (P02 and P03, session 1; the setting `clickMarks`): a mark
 * stays where each Alt+click landed, numbered P1, P2, … as the chat's place entries
 * are, until the conversation starts over. The chat's entries take the user back
 * to each place; the marks show where those places are on the page.
 *
 * A mark is the spot clicked (a ring and dot on it), what was clicked, or both
 * (`clickMarkTarget`). What was clicked is outlined in the highlight's look, as
 * pressing its P entry in the chat outlines it, but lasting (Yotam, 2026-10-12);
 * a thing too big to outline (a whole section) or gone from the page is marked by
 * its spot. Its number wears the
 * source numbers' look and size (Yotam, 2026-10-12), with the P that tells it from
 * them. The spot follows what was clicked while it is on the page (a reflow or a
 * zoom that re-wraps the text moves it with the element), and the content point
 * otherwise (a place brought back after a reload has no element).
 *
 * The marks are drawn in the highlights' layer, over their outlines and under the
 * sources' numbers, so neither hides the other's number. Like the highlights,
 * they sit on <html>, outside <body>: no capture or inventory sees them, they
 * never take a click, and the zoom transform leaves them at their size on screen.
 */
import { highlightLayer, numberLike, paintOutline } from "./highlight";
import { lookFrom } from "./highlightStyles";
import { allPlaces, onPlacesChange, type Place, placeNumber } from "./places";
import { getSettings, onSettingsChange } from "./settings";
import {
    clientToContent,
    getView,
    getZoom,
    onViewChange,
    onZoomChange,
} from "./zoom";

/**
 * Inside the highlights' layer (Yotam, 2026-10-12), from the top: the sources'
 * numbers (z-index 3 there) and the P numbers, the ring and dot, the lasting
 * outline, then the highlights' outlines and glow (no z-index). The marks keep
 * that order among themselves by their order in the mark.
 */
const LAYER_Z = "2";
const CLASS = "unilens-mark";
/** how far the number sits up and to the right of the spot, px */
const NUM_GAP = 14;

const CSS = `
.${CLASS}-layer { position: fixed; left: 0; top: 0; width: 0; height: 0; pointer-events: none; z-index: ${LAYER_Z}; }
.${CLASS} { position: absolute; left: 0; top: 0; pointer-events: none; }
/* the page's own styles never reach them: prefixed names, and nothing inherited */
.${CLASS} > * { position: fixed; box-sizing: border-box; margin: 0; }
/* a ring and a dot in the highlight colour between black rims: it reads on any page */
.${CLASS}-ring { background: none; width: 34px; height: 34px; translate: -50% -50%; border-radius: 50%; border: 4px solid var(--ul-mark); box-shadow: 0 0 0 2px #000, inset 0 0 0 2px #000; }
.${CLASS}-dot { width: 10px; height: 10px; translate: -50% -50%; border-radius: 50%; background: var(--ul-mark); box-shadow: 0 0 0 2px #000; }
.${CLASS}-num { white-space: nowrap; z-index: 1; }
@media (forced-colors: active) {
  .${CLASS} > * { forced-color-adjust: none; box-shadow: none !important; }
  .${CLASS}-ring { border-color: CanvasText; }
  .${CLASS}-box { background: transparent !important; outline: 3px solid CanvasText !important; }
  .${CLASS}-box .unilens-hl-deco { background: CanvasText !important; stroke: CanvasText !important; }
  .${CLASS}-box .unilens-hl-deco path { stroke: CanvasText !important; }
  .${CLASS}-dot { background: CanvasText; }
  .${CLASS}-num { background: CanvasText !important; color: Canvas !important; border-color: Canvas !important; }
}`;

let layer: HTMLDivElement | null = null;
let styleEl: HTMLStyleElement | null = null;
const marks = new Map<Place, HTMLDivElement>();
/** where the click was within what was clicked, in content px from its top-left,
 *  measured at the click (Place.offset), or else when the place was made */
const anchors = new WeakMap<Place, { x: number; y: number }>();
/** each outline as last drawn: its size and look, and where it sits from the
 *  element's corner */
const painted = new WeakMap<
    HTMLElement,
    { key: string; dx: number; dy: number }
>();
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
    highlightLayer().appendChild(layer);
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

/** what was clicked, if it can be outlined: on the page, and a thing, not a whole
 *  section (as the chat's place entries decide) */
export function markBox(p: Place): DOMRect | null {
    if (!p.el?.isConnected) return null;
    const r = p.el.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    if (r.width > window.innerWidth || r.height > window.innerHeight / 2)
        return null;
    return r;
}

/** one mark's parts, made again when the look or the number changes */
function build(el: HTMLDivElement, key: string, n: string, size: BadgeSize) {
    if (el.dataset.key === key) return;
    el.dataset.key = key;
    el.textContent = "";
    for (const part of ["box", "ring", "dot"]) {
        // the outline is drawn as a highlight's box is, so it is a div
        const e = document.createElement(part === "box" ? "div" : "span");
        e.className = `${CLASS}-${part}`;
        el.append(e);
    }
    const num = numberLike(n, size);
    num.classList.add(`${CLASS}-num`);
    // placed by render
    Object.assign(num.style, { position: "fixed", left: "0", top: "0" });
    el.append(num);
}

type BadgeSize = "small" | "medium" | "large";

function render() {
    const s = getSettings();
    const list = s.clickMarks ? allPlaces().order : [];
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
    // the source numbers' size; with them hidden, the smallest (the P still shows)
    const size: BadgeSize = s.hlBadges === "none" ? "small" : s.hlBadges;
    for (const p of list) {
        let el = marks.get(p);
        if (!el) {
            el = document.createElement("div");
            el.className = CLASS;
            host.appendChild(el);
            marks.set(p, el);
        }
        const n = `P${placeNumber(p)}`;
        build(el, `${n}|${size}|${s.chatStyle}`, n, size);
        el.style.setProperty("--ul-mark", s.hlColor);
        draw(el, p, s.clickMarkTarget);
    }
    start();
}

/** lay one mark's parts where its place is now */
function draw(
    el: HTMLDivElement,
    p: Place,
    target: "spot" | "element" | "both",
) {
    const part = (c: string) => el.querySelector<HTMLElement>(`.${CLASS}-${c}`);
    const [box, ring, dot, num] = ["box", "ring", "dot", "num"].map(part);
    if (!box || !ring || !dot || !num) return;
    const r = target === "spot" ? null : markBox(p);
    // the spot, unless only what was clicked is asked for and it can be outlined
    const at = target === "element" && r ? null : markPoint(p);
    el.style.display = r || at ? "" : "none";
    box.style.display = r ? "" : "none";
    // the highlight's look in its chosen colour: a colour that adapts would sample
    // the page under it on every scroll frame
    if (r) {
        const look = {
            ...lookFrom(getSettings()),
            colorMode: "fixed" as const,
        };
        // and what sets the stroke's width apart from the look (paintOutline reads it)
        const s = getSettings();
        const key = `${r.width}|${r.height}|${JSON.stringify(look)}|${s.ringWidth}|${s.ringScale}|${getZoom().scale}`;
        const was = painted.get(box);
        if (was?.key === key) {
            // only moved (a scroll): move it, without drawing it again
            box.style.left = `${r.left + was.dx}px`;
            box.style.top = `${r.top + was.dy}px`;
        } else {
            paintOutline(box as HTMLDivElement, r, { look });
            painted.set(box, {
                key,
                dx: Number.parseFloat(box.style.left) - r.left,
                dy: Number.parseFloat(box.style.top) - r.top,
            });
        }
    }
    for (const e of [ring, dot]) {
        e.style.display = at ? "" : "none";
        if (at) {
            e.style.left = `${at.x}px`;
            e.style.top = `${at.y}px`;
        }
    }
    // the number: up and to the right of the spot, or above the outline's right end
    // (a source's number takes the left); turned below or to the left where the
    // screen's edge would cut it
    // shown before it is measured: a hidden number measures nothing
    num.style.display = "";
    const w = num.offsetWidth;
    const h = num.offsetHeight;
    if (at) {
        const left = at.x + NUM_GAP + w > window.innerWidth;
        const below = at.y - NUM_GAP - h < 0;
        Object.assign(num.style, {
            left: `${left ? at.x - NUM_GAP : at.x + NUM_GAP}px`,
            top: `${below ? at.y + NUM_GAP : at.y - NUM_GAP}px`,
            translate: `${left ? "-100%" : "0"} ${below ? "0" : "-100%"}`,
        });
    } else if (r) {
        // what was clicked is off the screen: its number too, not held at the edge
        if (
            r.right < 0 ||
            r.bottom < 0 ||
            r.left > window.innerWidth ||
            r.top > window.innerHeight
        ) {
            num.style.display = "none";
            return;
        }
        // clear of the outline as drawn: its box, and the ring's outer band
        const ow =
            Number.parseFloat(box.style.outlineWidth || box.style.outline) || 0;
        const top = Number.parseFloat(box.style.top) - ow;
        const bottom = top + Number.parseFloat(box.style.height) + 2 * ow;
        const right =
            Number.parseFloat(box.style.left) +
            Number.parseFloat(box.style.width) +
            ow;
        const gap = NUM_GAP / 2;
        const below = top - gap - h < 0;
        Object.assign(num.style, {
            left: `${Math.min(right, window.innerWidth)}px`,
            top: `${below ? bottom + gap : top - gap}px`,
            translate: `-100% ${below ? "0" : "-100%"}`,
        });
    }
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
