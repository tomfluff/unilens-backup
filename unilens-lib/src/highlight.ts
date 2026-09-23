/**
 * Highlight layer — draws the outline(s) the model asked for around live page
 * elements, in a fixed layer under documentElement (outside the body zoom
 * transform, so screen pixels are screen pixels) and re-lays them as the page
 * scrolls, pans, zooms or mutates.
 *
 * The look comes from the layered settings (highlightStyles.ts: one backdrop, one
 * outline, stacking fill/glow/badges, one colour). This file owns geometry, the
 * off-screen cues, lifetime, the current-capture guard, the single Escape listener,
 * and the ARIA live region. Nothing here touches the host page's DOM.
 */

import {
    BACKDROP_ALPHA,
    colorWithAlpha,
    drawnOutline,
    EDGE,
    FILL_ALPHA,
    type HighlightLook,
    lookFrom,
    OUTLINE_OFFSET,
    RING,
    SPOTLIGHT_FEATHER,
} from "./highlightStyles";
import { setTargets } from "./minimap";
import { getSettings, onSettingsChange } from "./settings";
import {
    boxOf,
    type ClientRect,
    getZoom,
    isEmptyBox,
    isOwnMutation,
    onViewChange,
    onZoomChange,
    revealElement,
} from "./zoom";

export type HighlightRole = "target" | "anchor" | "source";
export interface Highlight {
    id: string;
    role: HighlightRole;
    /** number drawn on the outline; matches the chip in the chat bubble */
    badge?: string;
}
export type Rect = { left: number; top: number; width: number; height: number };
/** injectable so jsdom tests (where every rect is zeros) can supply geometry */
export type Measure = (el: Element) => Rect;
const defaultMeasure: Measure = (el) => el.getBoundingClientRect();

const LAYER_Z = "2147483645"; // under the minimap (…646) and the popover (…647)
const CLASS = "unilens-hl";

let layer: HTMLDivElement | null = null;
let styleEl: HTMLStyleElement | null = null;
let liveRegion: HTMLDivElement | null = null;
interface Drawn {
    el: Element;
    box: HTMLDivElement;
    role: HighlightRole;
    badge?: string;
    /** the look the box's decorations were built for; rebuilt when it changes */
    decoKey?: string;
}
let boxes: Drawn[] = [];
let cueHost: HTMLDivElement | null = null;
/** one cue element per outlined element, kept across frames so a focused edge
 *  button keeps focus while the page scrolls */
const cueEls = new Map<Drawn, { el: HTMLElement; sig: string }>();
/** each outlined element's box as of the last full render; pointer moves reuse it */
let lastRects = new Map<Drawn, ClientRect>();
/** last pointer position, for the pointer cue; null until the mouse moves */
let pointer: { x: number; y: number } | null = null;
let dimBox: HTMLDivElement | null = null;
let measure: Measure = defaultMeasure;

const clearedListeners = new Set<() => void>();
/** the popover's pressed buttons follow the outline: Escape, a new capture, or the
 *  last outlined element leaving the page clears it */
export function onHighlightsCleared(cb: () => void): () => void {
    clearedListeners.add(cb);
    return () => clearedListeners.delete(cb);
}

// ── current-capture guard ────────────────────────────────────────────────────
// The outline always belongs to the latest question on the current capture: a
// locate answer that lands after a newer capture, or after a newer question, is
// dropped here, the one place every highlight is drawn.
let currentCapture: string | null = null;
let issued = 0;

/** main.tsx calls this right after uploadCapture returns (the id exists only then) */
export function setCurrentCapture(id: string | null) {
    currentCapture = id;
}

/** locate.ts mints one per request; only the latest may draw */
export function nextToken(): number {
    return ++issued;
}

export const hasHighlight = () => boxes.length > 0;

// ── announcements: this module is the live region's only writer ──────────────
let flip = false;
export function announce(text: string) {
    if (getSettings().autoRead) return; // TTS is speaking; one audio channel
    if (!liveRegion) {
        liveRegion = document.createElement("div");
        liveRegion.setAttribute("role", "status");
        liveRegion.setAttribute("aria-live", "polite");
        Object.assign(liveRegion.style, {
            position: "fixed",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            clipPath: "inset(50%)",
            whiteSpace: "nowrap",
        });
        document.documentElement.appendChild(liveRegion);
    }
    // identical text twice is not re-announced; a toggled zero-width space makes it new
    flip = !flip;
    liveRegion.textContent = text + (flip ? String.fromCharCode(0x200b) : "");
}

// ── Escape: single owner ─────────────────────────────────────────────────────
// One window listener decides once per keypress and performs the whole result,
// so the outcome never depends on which listener happened to register first.
// Bubble phase, no propagation control: the host sees every Escape it always saw.
let popoverClose: (() => void) | null = null;

/** ChatPopover registers its close on mount and unregisters on unmount */
export function registerPopoverClose(fn: () => void): () => void {
    popoverClose = fn;
    return () => {
        if (popoverClose === fn) popoverClose = null;
    };
}

export function escapeAction(): "clear" | "close" | "both" | "none" {
    const hl = hasHighlight();
    const pop = popoverClose !== null;
    switch (getSettings().escapeOrder) {
        case "both":
            return hl || pop ? "both" : "none";
        case "popover":
            return pop ? "close" : hl ? "clear" : "none";
        default:
            return hl ? "clear" : pop ? "close" : "none";
    }
}

function onKey(e: KeyboardEvent) {
    if (e.key !== "Escape") return;
    const a = escapeAction();
    if (a === "clear" || a === "both") clearHighlights();
    if (a === "close" || a === "both") popoverClose?.();
}

let installed = false;
export function init() {
    if (installed) return;
    installed = true;
    window.addEventListener("keydown", onKey);
    // the pointer cue needs to know where the mouse is before the first highlight
    window.addEventListener(
        "mousemove",
        (e) => {
            pointer = { x: e.clientX, y: e.clientY };
        },
        { passive: true, capture: true },
    );
}

// ── rendering ────────────────────────────────────────────────────────────────
function ensureLayer() {
    if (layer) return layer;
    layer = document.createElement("div");
    layer.id = "unilens-highlight-layer";
    Object.assign(layer.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: "0",
        height: "0",
        pointerEvents: "none",
        zIndex: LAYER_Z,
    });
    layer.setAttribute("data-unilens-layer", "");
    document.documentElement.appendChild(layer);
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.textContent = `
@media (forced-colors: active) {
  [data-unilens-layer] .${CLASS}-deco { forced-color-adjust: none; background: CanvasText !important; stroke: CanvasText !important }
  [data-unilens-layer] .${CLASS}-deco path { stroke: CanvasText !important }
  [data-unilens-layer] .${CLASS}-cue { forced-color-adjust: none }
  [data-unilens-layer] .${CLASS}[data-outline="none"] { outline: 3px solid CanvasText !important }
  [data-unilens-layer] .${CLASS} { forced-color-adjust: none; border-color: Canvas !important; outline-color: CanvasText !important; background: transparent !important; box-shadow: none !important }
  [data-unilens-layer] .${CLASS}-dim { display: none !important }
  [data-unilens-layer] .${CLASS}-badge { forced-color-adjust: none; background: CanvasText !important; color: Canvas !important; border-color: Canvas !important }
}`;
        document.head.appendChild(styleEl);
    }
    return layer;
}

/** ring width per band in screen px: constant, or clamped to the zoom (research probe 2) */
function bandWidth(): number {
    const s = getSettings();
    if (!s.ringScale) return s.ringWidth;
    return Math.min(8, Math.max(3, s.ringWidth * getZoom().scale));
}

const currentLook = (): HighlightLook => lookFrom(getSettings());

const SVG_NS = "http://www.w3.org/2000/svg";

/** px from the element's edge to the box's edge, for the outline drawn */
function padFor(outline: string, w: number): number {
    if (outline === "ring") return OUTLINE_OFFSET + w;
    if (outline === "band") return OUTLINE_OFFSET + 3 * w;
    if (outline === "brackets") return OUTLINE_OFFSET + 2 * w;
    return OUTLINE_OFFSET;
}

/** bracket corners as one path, inset by half the stroke so it stays inside the box */
function bracketPath(W: number, H: number, t: number): string {
    const L = Math.min(28, Math.max(12, 0.28 * Math.min(W, H)));
    const a = t / 2;
    return (
        `M${a} ${L + a}V${a}H${L + a}` +
        `M${W - L - a} ${a}H${W - a}V${L + a}` +
        `M${W - a} ${H - L - a}V${H - a}H${W - L - a}` +
        `M${L + a} ${H - a}H${a}V${H - L - a}`
    );
}

/** page badges wear the chat style, so the number on the page matches its chip */
const BADGE_LOOK: Record<string, Partial<CSSStyleDeclaration>> = {
    assistant: {
        background: "#2563eb",
        color: "#fff",
        border: "2px solid #fff",
        borderRadius: "12px",
    },
    audioGuide: {
        background: "#111",
        color: "#fff",
        border: "2px solid #fff",
        borderRadius: "12px",
    },
    station: {
        background: "#fff",
        color: "#111",
        border: "3px solid #0079c2",
        borderRadius: "4px",
    },
};

function makeBadge(text: string): HTMLDivElement {
    const style = getSettings().chatStyle;
    const badge = document.createElement("div");
    badge.className = `${CLASS}-badge`;
    // station codes read "U1", like the chips
    badge.textContent = style === "station" ? `U${text}` : text;
    Object.assign(
        badge.style,
        {
            position: "absolute",
            left: "-14px",
            top: "-14px",
            minWidth: "24px",
            height: "24px",
            padding: "0 5px",
            boxSizing: "border-box",
            font: "700 14px/20px system-ui, sans-serif",
            textAlign: "center",
        },
        BADGE_LOOK[style] ?? BADGE_LOOK.assistant,
    );
    return badge;
}

/** (re)build a box's children for the current look: badge, brackets, underline bar */
function decorate(
    entry: Drawn,
    look: HighlightLook,
    outline: string,
    w: number,
) {
    const key = `${outline}|${look.badges}|${look.color}|${w}|${getSettings().chatStyle}`;
    if (entry.decoKey === key) return;
    entry.decoKey = key;
    entry.box.replaceChildren();
    if (look.badges && entry.badge)
        entry.box.appendChild(makeBadge(entry.badge));
    if (outline === "brackets") {
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("class", `${CLASS}-brackets`);
        Object.assign(svg.style, {
            position: "absolute",
            left: "0",
            top: "0",
            width: "100%",
            height: "100%",
            overflow: "visible",
        });
        for (const [stroke, width] of [
            [EDGE, 2 * w + 2],
            [look.color, 2 * w],
        ] as const) {
            const path = document.createElementNS(SVG_NS, "path");
            path.setAttribute("class", `${CLASS}-deco`);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", stroke);
            path.setAttribute("stroke-width", String(width));
            path.setAttribute("stroke-linecap", "square");
            svg.appendChild(path);
        }
        entry.box.appendChild(svg);
    }
    if (outline === "underline") {
        const bar = document.createElement("div");
        bar.className = `${CLASS}-deco`;
        Object.assign(bar.style, {
            position: "absolute",
            left: "0",
            right: "0",
            top: "100%",
            height: `${2 * w + 2}px`,
            background: look.color,
            outline: `1px solid ${EDGE}`,
        });
        entry.box.appendChild(bar);
    }
}

function render() {
    const look = currentLook();
    const outline = drawnOutline(look);
    const w = bandWidth();
    const pad = padFor(outline, w);
    const gone: typeof boxes = [];
    for (const entry of boxes) {
        const { el, box } = entry;
        if (!el.isConnected) {
            gone.push(entry);
            continue;
        }
        const r = boxOf(el, measure);
        lastRects.set(entry, r);
        // collapsed since it was drawn (an accordion closed): hide, never park at (0, 0)
        box.style.display = isEmptyBox(r) ? "none" : "";
        // forced colours drop fill, glow and backdrop: an outline-less look needs a ring there
        box.dataset.outline = outline;
        decorate(entry, look, outline, w);
        const band = outline === "band" ? 3 * w : outline === "ring" ? w : 0;
        const shadows = [
            outline === "band" ? `inset 0 0 0 2px ${EDGE}` : "",
            look.glow ? `0 0 18px 6px ${look.color}` : "",
        ].filter(Boolean);
        Object.assign(box.style, {
            left: `${r.left - pad}px`,
            top: `${r.top - pad}px`,
            width: `${r.width + 2 * pad}px`,
            height: `${r.height + 2 * pad}px`,
            // real strokes, not shadows, so forced colours keep them
            border: band
                ? `${band}px solid ${outline === "ring" ? RING.inner : look.color}`
                : "0",
            outline:
                outline === "ring"
                    ? `${w}px solid ${RING.outer}`
                    : outline === "band"
                      ? `2px solid ${EDGE}`
                      : "none",
            outlineOffset: "0",
            background: look.fill
                ? colorWithAlpha(look.color, FILL_ALPHA)
                : "transparent",
            boxShadow: shadows.length ? shadows.join(", ") : "none",
        });
        const paths = box.querySelectorAll("path");
        if (paths.length)
            for (const path of paths)
                path.setAttribute(
                    "d",
                    bracketPath(r.width + 2 * pad, r.height + 2 * pad, 2 * w),
                );
    }
    for (const g of gone) {
        g.box.remove();
        boxes.splice(boxes.indexOf(g), 1);
        lastRects.delete(g);
    }
    if (gone.length) {
        announce("That element is no longer on the page.");
        syncMinimap(); // the minimap must not keep a detached target
        if (!boxes.length) for (const cb of clearedListeners) cb();
    }
    renderBackdrop(look);
    renderCues(look);
    if (!boxes.length) teardownSubscriptions();
}

/**
 * Dim or spotlight: one darkened layer over the viewport with a hole per outlined
 * element (an even-odd path), so several targets all stay bright. The spotlight
 * blurs the layer's wrapper, which feathers the holes; the path overshoots the
 * viewport so the blur never lightens the screen's own edges.
 */
function renderBackdrop(look: HighlightLook) {
    const rects = boxes
        .map((b) => lastRects.get(b) ?? boxOf(b.el, measure))
        .filter((r) => !isEmptyBox(r));
    if (look.backdrop === "none" || !rects.length) {
        dimBox?.remove();
        dimBox = null;
        return;
    }
    if (!dimBox) {
        dimBox = document.createElement("div");
        dimBox.className = `${CLASS}-dim`;
        Object.assign(dimBox.style, {
            position: "fixed",
            left: "0",
            top: "0",
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
        });
        const shade = document.createElement("div");
        Object.assign(shade.style, { position: "absolute", inset: "0" });
        dimBox.appendChild(shade);
        ensureLayer().insertBefore(dimBox, layer?.firstChild ?? null); // under the boxes
    }
    const spot = look.backdrop === "spotlight";
    const o = spot ? 3 * SPOTLIGHT_FEATHER : 0;
    const W = window.innerWidth;
    const H = window.innerHeight;
    dimBox.style.filter = spot ? `blur(${SPOTLIGHT_FEATHER}px)` : "";
    const shade = dimBox.firstElementChild as HTMLDivElement;
    Object.assign(shade.style, {
        left: `${-o}px`,
        top: `${-o}px`,
        width: `${W + 2 * o}px`,
        height: `${H + 2 * o}px`,
        background: `rgba(0,0,0,${BACKDROP_ALPHA[look.backdrop]})`,
    });
    const holes = rects
        .map(
            (r) =>
                `M${r.left + o} ${r.top + o}h${r.width}v${r.height}h${-r.width}Z`,
        )
        .join("");
    shade.style.clipPath = `path(evenodd, "M0 0H${W + 2 * o}V${H + 2 * o}H0Z${holes}")`;
}

type Pt = { x: number; y: number };
type View = { w: number; h: number };
type Avoid = { left: number; top: number; right: number; bottom: number };
/** a cue: its centre, the bearing it points along (radians, true from the centre to
 *  the target), and the target's centre, so it can be re-aimed wherever it moves */
export type Cue = {
    x: number;
    y: number;
    angle: number;
    tx: number;
    ty: number;
};

/** px a cue keeps clear of the viewport edge and of the chat popover */
const CUE_MARGIN = 8;
/** where a cue centre may sit: half a cue plus the margin in from each edge */
const cueInset = (size: number) => size / 2 + CUE_MARGIN;
/** least centre-to-centre distance between two cues */
const cueGap = (size: number) => (size * 13) / 12;

const bearing = (p: Pt, tx: number, ty: number) =>
    Math.atan2(ty - p.y, tx - p.x);

/** the rectangle a cue centre may occupy (a point when the view is smaller than a cue) */
function insetBox(view: View, m: number) {
    return {
        x0: Math.min(m, view.w / 2),
        x1: Math.max(view.w - m, view.w / 2),
        y0: Math.min(m, view.h / 2),
        y1: Math.max(view.h - m, view.h / 2),
    };
}

function clampTo(view: View, m: number, p: Pt): Pt {
    const b = insetBox(view, m);
    return {
        x: Math.min(b.x1, Math.max(b.x0, p.x)),
        y: Math.min(b.y1, Math.max(b.y0, p.y)),
    };
}

/** where the ray from the view's centre toward (tx, ty) meets the inset edge */
function edgePoint(view: View, m: number, tx: number, ty: number): Pt {
    const c = { x: view.w / 2, y: view.h / 2 };
    const dx = tx - c.x;
    const dy = ty - c.y;
    const sx =
        dx > 0 ? (view.w - m - c.x) / dx : dx < 0 ? (m - c.x) / dx : Infinity;
    const sy =
        dy > 0 ? (view.h - m - c.y) / dy : dy < 0 ? (m - c.y) / dy : Infinity;
    const k = Math.max(0, Math.min(sx, sy));
    if (!Number.isFinite(k)) return c; // the target sits at the centre
    return clampTo(view, m, { x: c.x + dx * k, y: c.y + dy * k });
}

/** the inset edge as a loop, clockwise from the top-left corner: s → point, point → s */
function edgeLoop(view: View, m: number) {
    const { x0, x1, y0, y1 } = insetBox(view, m);
    const W = x1 - x0;
    const H = y1 - y0;
    const P = 2 * (W + H);
    const at = (s: number): Pt => {
        let t = P ? ((s % P) + P) % P : 0;
        if (t < W) return { x: x0 + t, y: y0 };
        t -= W;
        if (t < H) return { x: x1, y: y0 + t };
        t -= H;
        if (t < W) return { x: x1 - t, y: y1 };
        t -= W;
        return { x: x0, y: y1 - t };
    };
    const of = (p: Pt): number => {
        const x = Math.min(x1, Math.max(x0, p.x));
        const y = Math.min(y1, Math.max(y0, p.y));
        const d = [y - y0, x1 - x, y1 - y, x - x0]; // to the top, right, bottom, left edge
        const e = d.indexOf(Math.min(...d));
        if (e === 0) return x - x0;
        if (e === 1) return W + (y - y0);
        if (e === 2) return W + H + (x1 - x);
        return 2 * W + H + (y1 - y);
    };
    return { at, of, P };
}

/**
 * Where a cue sits: on the inset screen edge toward the target, or on a circle
 * round the pointer (kept inside the view). `angle` is the true bearing from
 * there to the target's centre.
 */
export function cuePosition(
    mode: "edge" | "pointer",
    target: ClientRect,
    view: View,
    from: Pt | null,
    radius: number,
    size: number,
): Cue {
    const tx = target.left + target.width / 2;
    const ty = target.top + target.height / 2;
    const m = cueInset(size);
    let p: Pt;
    if (mode === "pointer" && from) {
        const dx = tx - from.x;
        const dy = ty - from.y;
        const len = Math.hypot(dx, dy) || 1;
        p = clampTo(view, m, {
            x: from.x + (dx / len) * radius,
            y: from.y + (dy / len) * radius,
        });
    } else p = edgePoint(view, m, tx, ty);
    return { x: p.x, y: p.y, angle: bearing(p, tx, ty), tx, ty };
}

/**
 * Keep cues apart, inside the view and out from under the chat popover, then aim
 * each one at its target from wherever it ended up: a move never skews an arrow.
 * Pointer cues spread round their circle; one the popover covers moves outward
 * along its own ray from the pointer, and failing that to its edge spot. Edge cues
 * slide along the inset edge to the nearest free place. Positions are cue centres;
 * the result is in the input's order.
 */
export function settleCues<C extends Cue>(
    cues: C[],
    mode: "edge" | "pointer",
    view: View,
    avoid: Avoid | null,
    from: Pt | null,
    radius: number,
    size: number,
): C[] {
    const m = cueInset(size);
    const gap = cueGap(size);
    const half = size / 2 + CUE_MARGIN;
    const blocked = (p: Pt) =>
        !!avoid &&
        p.x + half > avoid.left &&
        p.x - half < avoid.right &&
        p.y + half > avoid.top &&
        p.y - half < avoid.bottom;
    const placed: Pt[] = [];
    const free = (p: Pt) =>
        !blocked(p) &&
        placed.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= gap - 1e-6);
    const loop = edgeLoop(view, m);
    /** the nearest place along the inset edge from `start` that passes `ok` */
    const slide = (start: Pt, ok: (p: Pt) => boolean): Pt | null => {
        const s0 = loop.of(start);
        const step = Math.max(2, size / 16);
        for (let d = 0; d <= loop.P / 2; d += step)
            for (const s of d ? [s0 + d, s0 - d] : [s0]) {
                const p = loop.at(s);
                if (ok(p)) return p;
            }
        return null;
    };
    // somewhere free on the edge; else clear of the chat at least; else where it was
    const onEdge = (start: Pt) =>
        slide(start, free) ?? slide(start, (p) => !blocked(p)) ?? start;
    const out: C[] = [...cues];
    const place = (i: number, p: Pt) => {
        placed.push(p);
        const c = cues[i];
        out[i] = { ...c, x: p.x, y: p.y, angle: bearing(p, c.tx, c.ty) };
    };

    if (mode === "pointer" && from) {
        const TAU = 2 * Math.PI;
        // least angle between neighbours on the circle so their centres are a gap apart
        const step = 2 * Math.asin(Math.min(1, gap / (2 * radius)));
        const sorted = cues
            .map((c, i) => ({ i, a: Math.atan2(c.ty - from.y, c.tx - from.x) }))
            .sort((p, q) => p.a - q.a);
        // start after the widest gap, so the pair that wraps round past ±π is spaced too
        let start = 0;
        let widest = -1;
        sorted.forEach((c, k) => {
            const next = sorted[(k + 1) % sorted.length];
            const g =
                (next.a - c.a + TAU) % TAU || (sorted.length > 1 ? 0 : TAU);
            if (g > widest) {
                widest = g;
                start = (k + 1) % sorted.length;
            }
        });
        const seq = sorted.map((_, k) => {
            const j = (start + k) % sorted.length;
            return {
                i: sorted[j].i,
                a: sorted[j].a + (k > 0 && j < start ? TAU : 0),
            };
        });
        for (let k = 1; k < seq.length; k++)
            if (seq[k].a - seq[k - 1].a < step) seq[k].a = seq[k - 1].a + step;
        const { x0, x1, y0, y1 } = insetBox(view, m);
        const inView = (p: Pt) =>
            p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
        for (const { i, a } of seq) {
            const ray = (r: number) => ({
                x: from.x + Math.cos(a) * r,
                y: from.y + Math.sin(a) * r,
            });
            let p: Pt | null = clampTo(view, m, ray(radius));
            if (!free(p)) {
                // covered or crowded: step outward along the ray while it stays in view
                p = null;
                for (let r = radius + size / 2; ; r += size / 2) {
                    const q = ray(r);
                    if (!inView(q)) break;
                    if (free(q)) {
                        p = q;
                        break;
                    }
                }
            }
            const c = cues[i];
            place(i, p ?? onEdge(edgePoint(view, m, c.tx, c.ty)));
        }
        return out;
    }
    // edge: settle in order along the loop, so neighbours keep their order where they can
    const order = cues
        .map((c, i) => ({ i, s: loop.of(c) }))
        .sort((p, q) => p.s - q.s);
    for (const { i } of order) place(i, onEdge(cues[i]));
    return out;
}

/** the part of the page the user actually sees: the visual viewport under pinch zoom */
function visibleBounds() {
    const vv = window.visualViewport;
    return {
        x: vv?.offsetLeft ?? 0,
        y: vv?.offsetTop ?? 0,
        w: vv?.width ?? window.innerWidth,
        h: vv?.height ?? window.innerHeight,
    };
}

/**
 * A cue drawn in a 48-unit box scaled to the cue size, pointing right before it is
 * aimed: a bold arrowhead that fills most of the box, with the number disc at its
 * tail. The group turns round the box centre; the number is placed apart so it
 * stays upright. Every shape stays within 24 units of the centre at any turn.
 */
const CUE_BOX = 48;
const CUE_TAIL = 11; // the number disc's centre, units behind the box centre
function cueSvg(color: string, num: string): string {
    const c = CUE_BOX / 2;
    return (
        `<svg width="100%" height="100%" viewBox="0 0 ${CUE_BOX} ${CUE_BOX}" aria-hidden="true" style="display:block">` +
        `<g><path d="M46 24 L18 7 L18 41 Z" fill="${color}" stroke="${EDGE}" stroke-width="2.5" stroke-linejoin="round"/>` +
        `<circle cx="${c - CUE_TAIL}" cy="${c}" r="10" fill="${EDGE}" stroke="${color}" stroke-width="2.5"/></g>` +
        `<text text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#fff">${num}</text></svg>`
    );
}

/** turn a cue's arrow to `angle` (radians) and keep its number upright on the tail disc */
function aimCue(el: HTMLElement, angle: number) {
    const c = CUE_BOX / 2;
    el.querySelector("g")?.setAttribute(
        "transform",
        `rotate(${(angle * 180) / Math.PI} ${c} ${c})`,
    );
    const text = el.querySelector("text");
    text?.setAttribute("x", `${c - CUE_TAIL * Math.cos(angle)}`);
    text?.setAttribute("y", `${c - CUE_TAIL * Math.sin(angle)}`);
}

/**
 * Off-screen cues: an arrow per outlined element that is entirely outside the
 * visible area, at its edge (a button that brings the element in) or on a circle
 * round the pointer (points only, never catches clicks). Numbered like the chips.
 * Elements are kept per target and only repositioned, so focus survives scrolling.
 */
function renderCues(look: HighlightLook) {
    const mode = getSettings().offscreenCue;
    const V = visibleBounds();
    const off =
        mode === "none"
            ? []
            : boxes
                  .map((b) => ({
                      b,
                      r: lastRects.get(b) ?? boxOf(b.el, measure),
                  }))
                  .filter(
                      ({ r }) =>
                          !isEmptyBox(r) &&
                          (r.left + r.width < V.x ||
                              r.top + r.height < V.y ||
                              r.left > V.x + V.w ||
                              r.top > V.y + V.h),
                  );
    for (const [b, c] of cueEls)
        if (!off.some((o) => o.b === b)) {
            c.el.remove();
            cueEls.delete(b);
        }
    if (!off.length) {
        cueHost?.remove();
        cueHost = null;
        return;
    }
    if (!cueHost) {
        cueHost = document.createElement("div");
        cueHost.className = `${CLASS}-cues`;
        ensureLayer().appendChild(cueHost);
    }
    const cueMode = mode as "edge" | "pointer";
    const { cueRadius: radius, cueSize: size } = getSettings();
    // work in visual-viewport coordinates, place in layout (fixed) coordinates
    // explicit fields: a DOMRect keeps them as prototype getters, so spreading one copies nothing
    const local = (r: ClientRect): ClientRect => ({
        left: r.left - V.x,
        top: r.top - V.y,
        width: r.width,
        height: r.height,
    });
    const from = pointer ? { x: pointer.x - V.x, y: pointer.y - V.y } : null;
    const popRect = document
        .getElementById("unilens-root")
        ?.firstElementChild?.getBoundingClientRect();
    const pop = popRect?.width
        ? {
              left: popRect.left - V.x,
              top: popRect.top - V.y,
              right: popRect.right - V.x,
              bottom: popRect.bottom - V.y,
          }
        : null;
    const view = { w: V.w, h: V.h };
    const settled = settleCues(
        off.map(({ r }, i) => ({
            ...cuePosition(cueMode, local(r), view, from, radius, size),
            i,
        })),
        cueMode,
        view,
        pop,
        from,
        radius,
        size,
    );
    for (const p of settled) {
        const { b } = off[p.i];
        // digits only: the number is written into SVG markup
        const num =
            look.badges && /^\d{1,3}$/.test(b.badge ?? "")
                ? (b.badge ?? "")
                : "";
        const sig = `${cueMode}|${look.color}|${num}`;
        let entry = cueEls.get(b);
        if (!entry || entry.sig !== sig) {
            entry?.el.remove();
            const el = document.createElement(
                cueMode === "edge" ? "button" : "div",
            );
            el.className = `${CLASS}-cue`;
            Object.assign(el.style, {
                position: "fixed",
                padding: "0",
                margin: "0",
                border: "0",
                background: "none",
                cursor: cueMode === "edge" ? "pointer" : "default",
                pointerEvents: cueMode === "edge" ? "auto" : "none",
            });
            el.innerHTML = cueSvg(look.color, num);
            if (cueMode === "edge") {
                el.setAttribute("type", "button");
                el.addEventListener("click", () => {
                    revealElement(b.el, measure);
                    announce(
                        `${b.badge ? `Item ${b.badge}` : "Highlighted item"} brought into view.`,
                    );
                });
            } else el.setAttribute("aria-hidden", "true");
            cueHost.appendChild(el);
            entry = { el, sig };
            cueEls.set(b, entry);
        }
        const where =
            Math.abs(Math.cos(p.angle)) > Math.abs(Math.sin(p.angle))
                ? p.angle > -Math.PI / 2 && p.angle < Math.PI / 2
                    ? "to the right"
                    : "to the left"
                : p.angle > 0
                  ? "below"
                  : "above";
        if (cueMode === "edge") {
            const label = `${b.badge ? `Item ${b.badge}` : "The highlighted item"} is ${where}. Go there.`;
            entry.el.setAttribute("aria-label", label);
            entry.el.title = label;
        }
        // sized every frame, not rebuilt: a size change keeps a focused edge button
        Object.assign(entry.el.style, {
            width: `${size}px`,
            height: `${size}px`,
            left: `${p.x + V.x - size / 2}px`,
            top: `${p.y + V.y - size / 2}px`,
        });
        aimCue(entry.el, p.angle);
    }
}

/** a pointer move only moves the pointer cues: nothing else on the layer changed */
let cueRaf = 0;
function scheduleCueRelay() {
    if (cueRaf || !boxes.length) return;
    cueRaf = requestAnimationFrame(() => {
        cueRaf = 0;
        renderCues(currentLook());
    });
}

function syncMinimap() {
    setTargets(
        boxes.map((b) => b.el),
        boxes.map((b) => b.badge ?? ""),
    );
}

// ── re-lay: one rAF per frame no matter how many triggers fire ───────────────
let raf = 0;
let unsubs: (() => void)[] = [];
let watcher: MutationObserver | null = null;

function scheduleRelay() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
        raf = 0;
        render();
    });
}

function setupSubscriptions() {
    if (unsubs.length) return;
    // capture phase: scroll events from overflow containers do not bubble to window
    window.addEventListener("scroll", scheduleRelay, {
        passive: true,
        capture: true,
    });
    window.addEventListener("resize", scheduleRelay);
    const onPointer = () => {
        if (getSettings().offscreenCue === "pointer") scheduleCueRelay();
    };
    const vv = window.visualViewport;
    vv?.addEventListener("resize", scheduleRelay);
    vv?.addEventListener("scroll", scheduleRelay);
    window.addEventListener("mousemove", onPointer, { passive: true });
    unsubs = [
        () => window.removeEventListener("mousemove", onPointer),
        () => vv?.removeEventListener("resize", scheduleRelay),
        () => vv?.removeEventListener("scroll", scheduleRelay),
        // a colour, layer or cue change applies to the outline already on screen
        onSettingsChange(scheduleRelay),
        () =>
            window.removeEventListener("scroll", scheduleRelay, {
                capture: true,
            }),
        () => window.removeEventListener("resize", scheduleRelay),
        onViewChange(scheduleRelay),
        onZoomChange(scheduleRelay),
    ];
    watcher = new MutationObserver((records) => {
        if (records.some((r) => !isOwnMutation(r))) scheduleRelay();
    });
    watcher.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["style", "class", "hidden"],
    });
}

function teardownSubscriptions() {
    for (const off of unsubs) off();
    unsubs = [];
    watcher?.disconnect();
    watcher = null;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (cueRaf) cancelAnimationFrame(cueRaf);
    cueRaf = 0;
}

// ── public lifecycle ─────────────────────────────────────────────────────────
export interface ShowOptions {
    /** announced as "Found: <label>"; the caller derives it from the inventory */
    label?: string;
    measure?: Measure;
    /** a click on a chip or button: draws whatever capture the message belongs to.
     * The guard is for answers that arrive late; a click is never late */
    userInitiated?: boolean;
}

/**
 * Draw the set. Returns false (and draws nothing) when the answer is for another
 * capture or an older question than the latest issued, unless the user asked for it.
 */
export function showHighlights(
    set: Highlight[],
    registry: Map<string, Element>,
    captureId: string,
    token: number,
    opts: ShowOptions = {},
): boolean {
    if (
        !opts.userInitiated &&
        (captureId !== currentCapture || token !== issued)
    ) {
        console.debug("[UniLens] dropped stale highlight", {
            captureId,
            token,
        });
        return false;
    }
    clearHighlights();
    measure = opts.measure ?? defaultMeasure;
    const host = ensureLayer();
    let unplaceable = 0;
    for (const h of set) {
        const el = registry.get(h.id);
        if (!el?.isConnected) continue;
        // nothing rendered to outline: drawing it would put the ring at the screen's
        // top-left corner (display:contents, collapsed, zero-size)
        if (isEmptyBox(boxOf(el, measure))) {
            unplaceable++;
            continue;
        }
        const box = document.createElement("div");
        box.className = CLASS;
        box.dataset.role = h.role; // TODO phase 2: style anchor/source distinctly
        Object.assign(box.style, {
            position: "fixed",
            boxSizing: "border-box",
            pointerEvents: "none",
            borderRadius: "4px",
        });
        host.appendChild(box);
        boxes.push({ el, box, role: h.role, badge: h.badge });
    }
    if (!boxes.length) {
        if (unplaceable)
            announce("Found it, but it is not showing on the page right now.");
        return true;
    }
    render();
    setupSubscriptions();
    syncMinimap();
    if (opts.label) announce(`Found: ${opts.label}`);
    return true;
}

export function clearHighlights() {
    const had = boxes.length > 0;
    for (const b of boxes) b.box.remove();
    boxes = [];
    dimBox?.remove();
    dimBox = null;
    cueHost?.remove();
    cueHost = null;
    cueEls.clear();
    lastRects = new Map();
    teardownSubscriptions();
    setTargets([]);
    if (had) for (const cb of clearedListeners) cb();
}

/** synchronous re-lay, for tests and for callers that just moved the view themselves */
export function relayNow() {
    if (boxes.length) render();
}
