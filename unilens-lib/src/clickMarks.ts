/**
 * Lasting click marks (P02 and P03, session 1; the setting `clickMarks`): a mark
 * stays where each Alt+click landed, numbered P1, P2, … as the chat's place entries
 * are, until the conversation starts over. The chat's entries take the user back
 * to each place; the marks show where those places are on the page.
 *
 * A mark is the spot clicked, what was clicked, or both (`clickMarkTarget`). The
 * spot is marked in one of five ways (`clickMarkStyle`, Yotam 2026-10-12, from the
 * options page): a map pin with the number in it; a dot with a line to its number
 * (the dot solid, or see-through so the text under it shows); a soft halo with a
 * line from the number stopping short of the spot; or that line alone. Every line
 * is a dark core with a white edge, so it shows on any background. What was
 * clicked is outlined in the highlight's look, as pressing its P entry in the chat
 * outlines it, but lasting; a thing too big to outline (a whole section) or gone
 * from the page is marked by its spot. The number wears the source numbers' look
 * and size, with the P that tells it from them. The spot follows what was clicked while it is on the page (a reflow or a
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
import { getSettings, onSettingsChange, type Settings } from "./settings";
import {
    clientToContent,
    getView,
    getZoom,
    onViewChange,
    onZoomChange,
} from "./zoom";

/**
 * Inside the highlights' layer (Yotam, 2026-10-12), from the top: the sources'
 * numbers (z-index 3 there) and the P numbers, the spot's mark, the lasting
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
/* the spot (clickMarkStyle, Yotam 2026-10-12). A dot in the highlight colour with a
   dark edge; see-through, the text under it shows */
.${CLASS}-dot { width: 14px; height: 14px; translate: -50% -50%; border-radius: 50%; background: var(--ul-mark); box-shadow: 0 0 0 2.5px #000; }
.${CLASS}-dot[data-clear] { background: color-mix(in srgb, var(--ul-mark) 50%, transparent); box-shadow: 0 0 0 2.5px rgba(0, 0, 0, .45); }
/* a soft halo in the highlight colour, no hard edge */
.${CLASS}-halo { width: 60px; height: 60px; translate: -50% -50%; border-radius: 50%; background: radial-gradient(closest-side, color-mix(in srgb, var(--ul-mark) 75%, transparent), color-mix(in srgb, var(--ul-mark) 35%, transparent) 60%, transparent); }
/* the line from the number toward the spot: a dark core with a white edge, so it
   shows on white, black or a busy picture */
.${CLASS}-line { left: 0; top: 0; overflow: visible; }
.${CLASS}-line .u { stroke: #fff; stroke-width: 5.5px; stroke-linecap: round; }
.${CLASS}-line .c { stroke: #000; stroke-width: 2.5px; stroke-linecap: round; }
/* a map pin, its tip on the spot, the number in it */
.${CLASS}-pin { translate: -50% -100%; overflow: visible; }
.${CLASS}-num { white-space: nowrap; z-index: 1; }
@media (forced-colors: active) {
  .${CLASS} > * { forced-color-adjust: none; box-shadow: none !important; }
  .${CLASS}-halo { background: none; border: 2px solid CanvasText; }
  .${CLASS}-line .u { stroke: Canvas; }
  .${CLASS}-line .c { stroke: CanvasText; }
  .${CLASS}-pin path { fill: CanvasText; stroke: Canvas; }
  .${CLASS}-pin text { fill: Canvas; }
  .${CLASS}-box { background: transparent !important; outline: 3px solid CanvasText !important; }
  .${CLASS}-box .unilens-hl-deco { background: CanvasText !important; stroke: CanvasText !important; }
  .${CLASS}-box .unilens-hl-deco path { stroke: CanvasText !important; }
  .${CLASS}-dot, .${CLASS}-dot[data-clear] { background: CanvasText; }
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

type BadgeSize = "small" | "medium" | "large";
type MarkStyle = Settings["clickMarkStyle"];
/** the pin's size by the number size, as the badges grow (24, 32, 42 px tall) */
const PIN_SCALE: Record<BadgeSize, number> = {
    small: 1,
    medium: 4 / 3,
    large: 1.75,
};
/** with a line: how far out the number's corner sits from the spot, on the
 *  diagonal, and how near the spot the line stops (outside the dot; inside the
 *  halo, short of the spot) */
const LEAD: Record<MarkStyle, number> = {
    pin: 0,
    tag: 20,
    tagClear: 20,
    halo: 34,
    line: 34,
};
const STOP: Record<MarkStyle, number> = {
    pin: 0,
    tag: 7,
    tagClear: 7,
    halo: 20,
    line: 20,
};
const SVG = "http://www.w3.org/2000/svg";
/** the pin, its tip down on the spot; and turned over, its tip up, where the
 *  window's top edge would cut it (the number stays upright) */
const PIN_DOWN =
    "M20 50 C 20 50 3 31 3 19 A 17 17 0 0 1 37 19 C 37 31 20 50 20 50 Z";
const PIN_UP = "M20 2 C 20 2 3 21 3 33 A 17 17 0 0 0 37 33 C 37 21 20 2 20 2 Z";

/** one mark's parts, made again when the look or the number changes */
function build(
    el: HTMLDivElement,
    key: string,
    n: string,
    size: BadgeSize,
    style: MarkStyle,
) {
    if (el.dataset.key === key) return;
    el.dataset.key = key;
    el.textContent = "";
    // the outline is drawn as a highlight's box is, so it is a div
    const box = document.createElement("div");
    box.className = `${CLASS}-box`;
    const halo = document.createElement("span");
    halo.className = `${CLASS}-halo`;
    const dot = document.createElement("span");
    dot.className = `${CLASS}-dot`;
    if (style === "tagClear") dot.dataset.clear = "";
    const line = document.createElementNS(SVG, "svg");
    line.setAttribute("class", `${CLASS}-line`);
    line.setAttribute("width", "1");
    line.setAttribute("height", "1");
    line.setAttribute("aria-hidden", "true");
    for (const c of ["u", "c"]) {
        const l = document.createElementNS(SVG, "line");
        l.setAttribute("class", c);
        line.append(l);
    }
    const num = numberLike(n, size);
    num.classList.add(`${CLASS}-num`);
    // placed by render
    Object.assign(num.style, { position: "fixed", left: "0", top: "0" });
    // the pin wears the number's colours
    const k = PIN_SCALE[size];
    const pin = document.createElementNS(SVG, "svg");
    pin.setAttribute("class", `${CLASS}-pin`);
    pin.setAttribute("viewBox", "0 0 40 52");
    pin.setAttribute("width", String(40 * k));
    pin.setAttribute("height", String(52 * k));
    pin.setAttribute("aria-hidden", "true");
    pin.innerHTML = `<path d="${PIN_DOWN}" stroke-width="2.5"/><text x="20" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="${n.length > 2 ? 12 : 14}"></text>`;
    const path = pin.querySelector("path");
    const text = pin.querySelector("text");
    path?.setAttribute("fill", num.style.backgroundColor || "#2563eb");
    path?.setAttribute("stroke", num.style.borderTopColor || "#fff");
    text?.setAttribute("fill", num.style.color || "#fff");
    if (text) text.textContent = n;
    el.append(box, halo, dot, line, pin, num);
}

function render() {
    const s = getSettings();
    // the floating button asks about the window, not a spot: nothing to mark
    const list = s.clickMarks
        ? allPlaces().order.filter((p) => !p.byButton)
        : [];
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
        build(
            el,
            `${n}|${size}|${s.chatStyle}|${s.clickMarkStyle}`,
            n,
            size,
            s.clickMarkStyle,
        );
        el.style.setProperty("--ul-mark", s.hlColor);
        draw(el, p, s.clickMarkTarget, s.clickMarkStyle);
    }
    start();
}

/** lay one mark's parts where its place is now */
function draw(
    el: HTMLDivElement,
    p: Place,
    target: "spot" | "element" | "both",
    style: MarkStyle,
) {
    const part = (c: string) =>
        el.querySelector<HTMLElement | SVGElement>(`.${CLASS}-${c}`);
    const [box, halo, dot, line, pin, num] = [
        "box",
        "halo",
        "dot",
        "line",
        "pin",
        "num",
    ].map(part) as HTMLElement[];
    if (!box || !halo || !dot || !line || !pin || !num) return;
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
    // the spot's mark, by its style
    const show = (e: HTMLElement | SVGElement, on: boolean) => {
        e.style.display = on ? "" : "none";
    };
    show(halo, Boolean(at) && style === "halo");
    show(dot, Boolean(at) && (style === "tag" || style === "tagClear"));
    show(pin, Boolean(at) && style === "pin");
    show(line, Boolean(at) && style !== "pin");
    // the number: in the pin; else at the end of the spot's line; else above the
    // outline's right end (a source's number takes the left). Turned below or to
    // the left where the screen's edge would cut it
    show(num, !(at && style === "pin"));
    for (const e of [halo, dot, pin])
        if (at) {
            e.style.left = `${at.x}px`;
            e.style.top = `${at.y}px`;
        }
    if (at && style === "pin") {
        const up = at.y - Number(pin.getAttribute("height")) < 0;
        pin.querySelector("path")?.setAttribute("d", up ? PIN_UP : PIN_DOWN);
        pin.querySelector("text")?.setAttribute("y", up ? "38" : "24");
        pin.style.translate = up ? "-50% 0" : "-50% -100%";
    }
    // shown before it is measured: a hidden number measures nothing
    const w = num.offsetWidth;
    const h = num.offsetHeight;
    if (at && style !== "pin") {
        const d = LEAD[style];
        const sx = at.x + d + w > window.innerWidth ? -1 : 1;
        const sy = at.y - d - h < 0 ? 1 : -1;
        const end = { x: at.x + sx * d, y: at.y + sy * d };
        const o = STOP[style] / Math.SQRT2;
        // from under the pill, past its rounded corner, so the line meets it
        const tuck = h * 0.3;
        for (const l of line.querySelectorAll("line")) {
            l.setAttribute("x1", String(end.x + sx * tuck));
            l.setAttribute("y1", String(end.y + sy * tuck));
            l.setAttribute("x2", String(at.x + sx * o));
            l.setAttribute("y2", String(at.y + sy * o));
        }
        Object.assign(num.style, {
            left: `${end.x}px`,
            top: `${end.y}px`,
            translate: `${sx > 0 ? "0" : "-100%"} ${sy < 0 ? "-100%" : "0"}`,
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
            // by its place, never held at the screen's edge (Yotam, 2026-10-12)
            left: `${right}px`,
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
