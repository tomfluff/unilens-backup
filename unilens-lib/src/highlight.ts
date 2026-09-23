/**
 * Highlight layer — draws the outline(s) the model asked for around live page
 * elements, in a fixed layer under documentElement (outside the body zoom
 * transform, so screen pixels are screen pixels) and re-lays them as the page
 * scrolls, pans, zooms or mutates.
 *
 * Rendering comes from the selected HIGHLIGHT_PRESETS entry (see highlightStyles.ts);
 * this file owns geometry, lifetime, the current-capture guard, the single Escape
 * listener, and the ARIA live region. Nothing here touches the host page's DOM.
 */

import { HIGHLIGHT_PRESETS, type HighlightStyle } from "./highlightStyles";
import { setTargets } from "./minimap";
import { getSettings } from "./settings";
import {
    boxOf,
    getZoom,
    isEmptyBox,
    isOwnMutation,
    onViewChange,
    onZoomChange,
} from "./zoom";

export type HighlightRole = "target" | "anchor" | "source";
export interface Highlight {
    id: string;
    role: HighlightRole;
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
let boxes: { el: Element; box: HTMLDivElement; role: HighlightRole }[] = [];
let dimBox: HTMLDivElement | null = null;
let measure: Measure = defaultMeasure;

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
@keyframes ${CLASS}-pulse { 0%,100% { opacity: 1 } 50% { opacity: var(--${CLASS}-min, .35) } }
[data-unilens-layer] .${CLASS}[data-pulse] { animation: ${CLASS}-pulse var(--${CLASS}-ms, 600ms) ease-in-out var(--${CLASS}-cycles, 2); }
@media (prefers-reduced-motion: reduce) { [data-unilens-layer] .${CLASS} { animation: none !important } }
@media (forced-colors: active) {
  [data-unilens-layer] .${CLASS} { forced-color-adjust: none; border-color: Canvas !important; outline-color: CanvasText !important; background: transparent !important; box-shadow: none !important }
  [data-unilens-layer] .${CLASS}-dim { display: none !important }
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

// hydration sanitises highlightStyle; the fallback is defence in depth against a hot store edit
const currentPreset = (): HighlightStyle =>
    HIGHLIGHT_PRESETS[getSettings().highlightStyle] ??
    HIGHLIGHT_PRESETS["wcag-ring"];

function render() {
    const preset = currentPreset();
    const w = bandWidth();
    const offset = preset.ring?.offset ?? 0;
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
        // the box sits `offset` outside the element; the inner band is its border,
        // the outer band its outline, both real strokes so forced colours keep them
        Object.assign(box.style, {
            left: `${r.left - offset - w}px`,
            top: `${r.top - offset - w}px`,
            width: `${r.width + 2 * (offset + w)}px`,
            height: `${r.height + 2 * (offset + w)}px`,
            border: preset.ring ? `${w}px solid ${preset.ring.inner}` : "0",
            outline: preset.ring ? `${w}px solid ${preset.ring.outer}` : "none",
            outlineOffset: "0",
            background: preset.fill
                ? colorWithAlpha(preset.fill.color, preset.fill.alpha)
                : "transparent",
            boxShadow: preset.glow
                ? `0 0 ${preset.glow.blur}px ${preset.glow.spread}px ${preset.glow.color}`
                : "none",
        });
    }
    for (const g of gone) {
        g.box.remove();
        boxes.splice(boxes.indexOf(g), 1);
    }
    if (gone.length) {
        announce("That element is no longer on the page.");
        setTargets(boxes.map((b) => b.el)); // the minimap must not keep a detached target
    }
    if (dimBox) {
        // ponytail: dims around one element only; phase 1 sends one highlight. It must
        // be the target, not whichever entry came first, once anchors/sources arrive
        const first = boxes.find((b) => b.role === "target") ?? boxes[0];
        if (!first) {
            dimBox.remove();
            dimBox = null;
        } else {
            const r = boxOf(first.el, measure);
            Object.assign(dimBox.style, {
                left: `${r.left}px`,
                top: `${r.top}px`,
                width: `${r.width}px`,
                height: `${r.height}px`,
            });
        }
    }
    if (!boxes.length) teardownSubscriptions();
}

function colorWithAlpha(hex: string, alpha: number): string {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    const n = Number.parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
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
    unsubs = [
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
}

/**
 * Draw the set. Returns false (and draws nothing) when the answer is for another
 * capture or an older question than the latest issued.
 */
export function showHighlights(
    set: Highlight[],
    registry: Map<string, Element>,
    captureId: string,
    token: number,
    opts: ShowOptions = {},
): boolean {
    if (captureId !== currentCapture || token !== issued) {
        console.debug("[UniLens] dropped stale highlight", {
            captureId,
            token,
        });
        return false;
    }
    clearHighlights();
    measure = opts.measure ?? defaultMeasure;
    const preset = currentPreset();
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
        if (preset.pulse && getSettings().pulse) {
            box.dataset.pulse = "";
            box.style.setProperty(`--${CLASS}-ms`, `${preset.pulse.ms}ms`);
            box.style.setProperty(
                `--${CLASS}-cycles`,
                `${preset.pulse.cycles}`,
            );
            box.style.setProperty(
                `--${CLASS}-min`,
                `${preset.pulse.minOpacity}`,
            );
        }
        host.appendChild(box);
        boxes.push({ el, box, role: h.role });
    }
    if (!boxes.length) {
        if (unplaceable)
            announce("Found it, but it is not showing on the page right now.");
        return true;
    }
    if (preset.dimOthers) {
        dimBox = document.createElement("div");
        dimBox.className = `${CLASS}-dim`;
        Object.assign(dimBox.style, {
            position: "fixed",
            pointerEvents: "none",
            boxShadow: `0 0 0 200vmax rgba(0,0,0,${preset.dimOthers.alpha})`,
        });
        host.insertBefore(dimBox, host.firstChild); // under the ring boxes
    }
    render();
    setupSubscriptions();
    setTargets(boxes.map((b) => b.el));
    if (opts.label) announce(`Found: ${opts.label}`);
    return true;
}

export function clearHighlights() {
    for (const b of boxes) b.box.remove();
    boxes = [];
    dimBox?.remove();
    dimBox = null;
    teardownSubscriptions();
    setTargets([]);
}

/** synchronous re-lay, for tests and for callers that just moved the view themselves */
export function relayNow() {
    if (boxes.length) render();
}
