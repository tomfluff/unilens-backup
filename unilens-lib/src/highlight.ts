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
import { getSettings } from "./settings";
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

function makeBadge(text: string): HTMLDivElement {
    const badge = document.createElement("div");
    badge.className = `${CLASS}-badge`;
    badge.textContent = text;
    Object.assign(badge.style, {
        position: "absolute",
        left: "-14px",
        top: "-14px",
        minWidth: "24px",
        height: "24px",
        padding: "0 5px",
        boxSizing: "border-box",
        borderRadius: "12px",
        border: "2px solid #fff",
        background: "#000",
        color: "#fff",
        font: "700 14px/20px system-ui, sans-serif",
        textAlign: "center",
    });
    return badge;
}

/** (re)build a box's children for the current look: badge, brackets, underline bar */
function decorate(
    entry: Drawn,
    look: HighlightLook,
    outline: string,
    w: number,
) {
    const key = `${outline}|${look.badges}|${look.color}|${w}`;
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
        // collapsed since it was drawn (an accordion closed): hide, never park at (0, 0)
        box.style.display = isEmptyBox(r) ? "none" : "";
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
        .map((b) => boxOf(b.el, measure))
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

/** where a cue sits: on the inset screen edge toward the target, or on a circle round the pointer */
export function cuePosition(
    mode: "edge" | "pointer",
    target: ClientRect,
    view: { w: number; h: number },
    from: { x: number; y: number } | null,
    radius: number,
): { x: number; y: number; angle: number } {
    const tx = target.left + target.width / 2;
    const ty = target.top + target.height / 2;
    const c =
        mode === "pointer" && from ? from : { x: view.w / 2, y: view.h / 2 };
    const dx = tx - c.x;
    const dy = ty - c.y;
    const angle = Math.atan2(dy, dx);
    if (mode === "pointer" && from) {
        const len = Math.hypot(dx, dy) || 1;
        return {
            x: c.x + (dx / len) * radius,
            y: c.y + (dy / len) * radius,
            angle,
        };
    }
    const m = 32; // inset: the whole cue stays on screen
    const sx =
        dx > 0 ? (view.w - m - c.x) / dx : dx < 0 ? (m - c.x) / dx : Infinity;
    const sy =
        dy > 0 ? (view.h - m - c.y) / dy : dy < 0 ? (m - c.y) / dy : Infinity;
    const k = Math.min(sx, sy);
    return { x: c.x + dx * k, y: c.y + dy * k, angle };
}

const CUE = 48;

/**
 * Keep cues apart and out from under the chat popover. Edge cues slide along
 * their edge; pointer cues slide round their circle. Positions are cue centres.
 */
export function settleCues(
    cues: { x: number; y: number; angle: number }[],
    mode: "edge" | "pointer",
    view: { w: number; h: number },
    avoid: { left: number; top: number; right: number; bottom: number } | null,
    from: { x: number; y: number } | null,
    radius: number,
): { x: number; y: number; angle: number }[] {
    const gap = CUE + 4;
    if (mode === "pointer" && from) {
        const step = gap / radius;
        const sorted = [...cues].sort((a, b) => a.angle - b.angle);
        for (let i = 1; i < sorted.length; i++)
            if (sorted[i].angle - sorted[i - 1].angle < step)
                sorted[i] = { ...sorted[i], angle: sorted[i - 1].angle + step };
        return sorted.map((c) => ({
            ...c,
            x: from.x + Math.cos(c.angle) * radius,
            y: from.y + Math.sin(c.angle) * radius,
        }));
    }
    const m = 32;
    // which edge a cue sits on decides the axis it may slide along
    const horizontal = (c: { y: number }) =>
        Math.abs(c.y - m) < 1 || Math.abs(c.y - (view.h - m)) < 1;
    const out: { x: number; y: number; angle: number }[] = [];
    for (const edgeIsH of [true, false]) {
        const group = cues
            .filter((c) => horizontal(c) === edgeIsH)
            .map((c) => ({ ...c }));
        const along = (c: { x: number; y: number }) => (edgeIsH ? c.x : c.y);
        const set = (c: { x: number; y: number }, v: number) => {
            if (edgeIsH) c.x = v;
            else c.y = v;
        };
        const len = edgeIsH ? view.w : view.h;
        const lo = avoid
            ? (edgeIsH ? avoid.left : avoid.top) - CUE / 2 - 8
            : Number.NEGATIVE_INFINITY;
        const hi = avoid
            ? (edgeIsH ? avoid.right : avoid.bottom) + CUE / 2 + 8
            : Number.NEGATIVE_INFINITY;
        const blocked = (c: { x: number; y: number }) =>
            !!avoid &&
            c.x + CUE / 2 > avoid.left &&
            c.x - CUE / 2 < avoid.right &&
            c.y + CUE / 2 > avoid.top &&
            c.y - CUE / 2 < avoid.bottom;
        // cues the popover would cover move to its nearer side (or the side with room)
        for (const c of group) {
            if (!blocked(c)) continue;
            const v = along(c);
            set(c, (v - lo < hi - v && lo >= m) || hi > len - m ? lo : hi);
        }
        // then space them out away from the popover: cues before it stack backward,
        // cues after it forward, so spacing never pushes one back under it
        const mid = avoid ? (lo + hi) / 2 : Number.NEGATIVE_INFINITY;
        const before = group
            .filter((c) => along(c) < mid)
            .sort((a, b) => along(b) - along(a));
        const after = group
            .filter((c) => along(c) >= mid)
            .sort((a, b) => along(a) - along(b));
        for (let i = 1; i < before.length; i++)
            if (along(before[i - 1]) - along(before[i]) < gap)
                set(before[i], along(before[i - 1]) - gap);
        for (let i = 1; i < after.length; i++)
            if (along(after[i]) - along(after[i - 1]) < gap)
                set(after[i], along(after[i - 1]) + gap);
        for (const c of group) set(c, Math.min(len - m, Math.max(m, along(c))));
        out.push(...group);
    }
    return out;
}

/**
 * Off-screen cues: an arrow per outlined element that is entirely outside the
 * screen, at the screen edge (a button that brings it into view) or on a circle
 * round the pointer (points only, never catches clicks). Numbered like the chips.
 */
function renderCues(look: HighlightLook) {
    const mode = getSettings().offscreenCue;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const off =
        mode === "none"
            ? []
            : boxes
                  .map((b) => ({ b, r: boxOf(b.el, measure) }))
                  .filter(
                      ({ r }) =>
                          !isEmptyBox(r) &&
                          (r.left + r.width < 0 ||
                              r.top + r.height < 0 ||
                              r.left > W ||
                              r.top > H),
                  );
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
    cueHost.replaceChildren();
    const cueMode = mode as "edge" | "pointer";
    const radius = getSettings().cueRadius;
    const pop = document
        .getElementById("unilens-root")
        ?.firstElementChild?.getBoundingClientRect();
    const raw = off.map(({ r }) =>
        cuePosition(cueMode, r, { w: W, h: H }, pointer, radius),
    );
    const settled = settleCues(
        raw.map((p, i) => ({ ...p, i })),
        cueMode,
        { w: W, h: H },
        pop && pop.width ? pop : null,
        pointer,
        radius,
    ) as { x: number; y: number; angle: number; i: number }[];
    for (const p of settled) {
        const { b } = off[p.i];
        const cue = document.createElement(mode === "edge" ? "button" : "div");
        cue.className = `${CLASS}-cue`;
        const where =
            Math.abs(Math.cos(p.angle)) > Math.abs(Math.sin(p.angle))
                ? p.angle > -Math.PI / 2 && p.angle < Math.PI / 2
                    ? "to the right"
                    : "to the left"
                : p.angle > 0
                  ? "below"
                  : "above";
        const label = `${b.badge ? `Item ${b.badge}` : "The highlighted item"} is ${where}`;
        Object.assign(cue.style, {
            position: "fixed",
            left: `${p.x - 24}px`,
            top: `${p.y - 24}px`,
            width: "48px",
            height: "48px",
            padding: "0",
            margin: "0",
            border: "0",
            background: "none",
            cursor: mode === "edge" ? "pointer" : "default",
            pointerEvents: mode === "edge" ? "auto" : "none",
        });
        const deg = (p.angle * 180) / Math.PI;
        // digits only: the number is written into SVG markup
        const num =
            look.badges && /^\d{1,3}$/.test(b.badge ?? "") ? b.badge : "";
        cue.innerHTML = `<svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(${deg} 24 24)"><path d="M36 14 L47 24 L36 34 Z" fill="${look.color}" stroke="${EDGE}" stroke-width="2"/></g><circle cx="24" cy="24" r="15" fill="${EDGE}" stroke="${look.color}" stroke-width="3"/><text x="24" y="29" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="15" fill="#fff">${num}</text></svg>`;
        if (mode === "edge") {
            cue.setAttribute("type", "button");
            cue.setAttribute("aria-label", `${label}. Go there.`);
            cue.title = `${label}. Go there.`;
            cue.addEventListener("click", () => {
                revealElement(b.el, measure);
                announce(
                    `${b.badge ? `Item ${b.badge}` : "Highlighted item"} brought into view.`,
                );
            });
        } else cue.setAttribute("aria-hidden", "true");
        cueHost.appendChild(cue);
    }
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
        if (getSettings().offscreenCue === "pointer") scheduleRelay();
    };
    window.addEventListener("mousemove", onPointer, { passive: true });
    unsubs = [
        () => window.removeEventListener("mousemove", onPointer),
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
    teardownSubscriptions();
    setTargets([]);
    if (had) for (const cb of clearedListeners) cb();
}

/** synchronous re-lay, for tests and for callers that just moved the view themselves */
export function relayNow() {
    if (boxes.length) render();
}
