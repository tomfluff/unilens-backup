/**
 * UniLens zoom — pinch-style page zoom on ctrl+mousewheel (trackpad pinch
 * gestures also arrive as ctrl+wheel). Applies scale() to document.body,
 * anchored at the cursor via scroll compensation. Content coordinates
 * (layout space, zoom-independent) are what capture/trace/click record,
 * so annotations align with the unzoomed screenshot at any zoom level.
 */

import { getSettings, onSettingsChange } from "./settings";

const MIN_ZOOM = 1; // 100% is the floor: zooming out returns to the page, never shrinks it
const MAX_ZOOM = 5;
const ZOOM_TRACE_WINDOW_MS = 30_000;
const ZOOM_TRACE_MAX = 50;

export interface ZoomEvent {
    t: number;
    /** zoom level after this event */
    scale: number;
    /** content coords of the zoom anchor (cursor) */
    x: number;
    y: number;
}

let zoomTrace: ZoomEvent[] = [];

/** zoom events within the last 30s — the user's recent attention signal */
export function getZoomTrace(atTime: number): ZoomEvent[] {
    return zoomTrace.filter((e) => e.t >= atTime - ZOOM_TRACE_WINDOW_MS);
}

let scale = 1;
let layoutW = 0;
let layoutH = 0;
let badge: HTMLDivElement | null = null;
let badgeTimer: number | undefined;

export interface ZoomState {
    scale: number;
    /** unzoomed page layout size */
    layoutW: number;
    layoutH: number;
}

export function getZoom(): ZoomState {
    if (layoutW === 0) measureLayout();
    return { scale, layoutW, layoutH };
}

/** where zoom is heading (equals current scale unless a smooth zoom is in flight) */
export function getTargetZoom(): number {
    return targetScale;
}

/** page (scroll-space) coords -> content (layout-space) coords */
export function toContent(
    pageX: number,
    pageY: number,
): { x: number; y: number } {
    return { x: pageX / scale, y: pageY / scale };
}

function measureLayout() {
    // init() from <head> runs before <body> exists — leave layoutW at 0 so the
    // next getZoom() call re-measures once the document has a body
    if (!document.body) return;
    // measure with transform off so scrollWidth/Height are true layout size
    const prev = document.body.style.transform;
    const prevH = document.documentElement.style.height;
    // dropping the transform shrinks the document, which clamps scroll — restore it
    // afterwards or the user's view jumps every time we re-measure
    const sx = window.scrollX;
    const sy = window.scrollY;
    document.body.style.transform = "";
    document.documentElement.style.height = "";
    layoutW = document.documentElement.scrollWidth;
    layoutH = document.documentElement.scrollHeight;
    document.body.style.transform = prev;
    document.documentElement.style.height = prevH;
    if (window.scrollX !== sx || window.scrollY !== sy) window.scrollTo(sx, sy);
}

/** re-measure after the page changes size — reactive content, images loading, etc. */
export function refreshLayout() {
    measureLayout();
}

function showBadge() {
    if (!badge) {
        badge = document.createElement("div");
        Object.assign(badge.style, {
            position: "fixed",
            bottom: "16px",
            right: "16px",
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: "16px",
            font: "13px sans-serif",
            pointerEvents: "none",
            zIndex: "2147483647",
            transition: "opacity 0.3s",
        });
        // documentElement, not body: body is the transformed element
        document.documentElement.appendChild(badge);
    }
    badge.textContent = `${Math.round(scale * 100)}%`;
    badge.style.opacity = "1";
    clearTimeout(badgeTimer);
    badgeTimer = window.setTimeout(() => {
        if (badge) badge.style.opacity = "0";
    }, 1200);
}

const changeListeners: ((scale: number) => void)[] = [];

/** settings panel and minimap subscribe to follow the live zoom level (returns unsubscribe) */
export function onZoomChange(cb: (scale: number) => void): () => void {
    changeListeners.push(cb);
    return () => {
        const i = changeListeners.indexOf(cb);
        if (i >= 0) changeListeners.splice(i, 1);
    };
}

// ── Fixed-element seating ──────────────────────────────────────────────────
// Magnifier semantics: the page is one magnified surface and scrolling moves the
// lens over it. Nothing is glued to the window — a fixed header keeps the place it
// occupies on the unzoomed page (top of the document, whatever the scroll position
// was when you zoomed), grows with everything else, and pans out of view as you move
// away from it, exactly like magnifying a printed poster.
//
// body's transform makes body the containing block for its position:fixed
// descendants, so without help they collapse to the document origin instead. Each one
// gets seated with the `translate` property, which is independent of `transform`, so a
// site's own transform on the same element survives untouched.
// Known gaps: percentage anchors (top:50%) resolve against the document, and an
// element the site already animates via `translate` gets clobbered.

interface FixedPin {
    el: HTMLElement;
    /** where it sits on the unzoomed page, in layout px from the document origin */
    homeTop: number;
    homeLeft: number;
    homeW: number;
    homeH: number;
    /** translate currently applied, in body-local px */
    tx: number;
    ty: number;
}

const MAX_PINS = 30;
const RESCAN_DEBOUNCE_MS = 400;

let pins: FixedPin[] = [];
let rescanTimer: number | undefined;
let watcher: MutationObserver | null = null;

/**
 * position:sticky is computed against the real scrollport in unscaled px while the
 * element itself is scaled, so a stuck element drifts down at (scale-1)x the scroll
 * rate — it runs off the surface instead of holding still. On a magnified poster it
 * should simply sit in its normal flow position, which is what static gives us
 * (stickiness is a paint-time offset, so this is layout-neutral).
 */
let stickies: { el: HTMLElement; prev: string }[] = [];

function neutralizeSticky(el: HTMLElement) {
    if (el.dataset.unilensSticky !== undefined) return;
    stickies.push({ el, prev: el.style.position });
    el.style.position = "static";
    el.dataset.unilensSticky = "";
}

function restoreSticky() {
    for (const s of stickies) {
        s.el.style.position = s.prev;
        delete s.el.dataset.unilensSticky;
    }
    stickies = [];
}

/**
 * True for an attribute mutation we caused ourselves rather than the page changing:
 * our seating and sticky fixups, and the transform/overflow/height we write on body
 * and html. Without this the observers see their own effects and loop forever.
 */
export function isOwnMutation(rec: MutationRecord) {
    if (rec.type !== "attributes") return false;
    const t = rec.target as HTMLElement;
    return (
        t === document.body ||
        t === document.documentElement ||
        t.dataset?.unilensPin !== undefined ||
        t.dataset?.unilensSticky !== undefined ||
        t.dataset?.unilensImg !== undefined
    );
}

/**
 * Where an element would sit on one axis if it were genuinely fixed, derived from
 * its layout position — no reflow, no touching the transform.
 *
 * While body is transformed a fixed element resolves its offsets against the whole
 * document, so one sitting past the first viewport must be hanging off the far edge.
 * getComputedStyle can't tell us this: for a positioned element it resolves top and
 * bottom to used px, never 'auto'.
 */
function homeOnAxis(
    pos: number,
    size: number,
    layoutExtent: number,
    viewportExtent: number,
    docResolved: boolean,
) {
    const offDocumentEdge =
        docResolved &&
        layoutExtent > viewportExtent &&
        pos > viewportExtent - size;
    return offDocumentEdge ? pos - layoutExtent + viewportExtent : pos;
}

// Deliberately a full-tree getComputedStyle sweep: only runs while zoomed, debounced to the
// end of a gesture, and additive. MutationObserver if it ever profiles hot.
function scanFixed() {
    if (layoutW === 0) measureLayout();
    prunePins();
    const known = new Set(pins.map((p) => p.el));
    const s = scale;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
        if (pins.length >= MAX_PINS) break;
        const position = getComputedStyle(el).position;
        if (position === "sticky") {
            neutralizeSticky(el);
            continue;
        }
        if (known.has(el)) continue;
        if (position !== "fixed") continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue; // display:none — e.g. closed modals
        const w = r.width / s;
        const h = r.height / s;
        if (w >= vw * 0.99 && h >= vh * 0.99) continue; // full-screen overlay: nothing to pin
        // at scale 1 the element is genuinely fixed, so its rect already is the home rect
        const docResolved = s !== 1;
        const top = docResolved ? (r.top + window.scrollY) / s : r.top;
        const left = docResolved ? (r.left + window.scrollX) / s : r.left;
        pins.push({
            el,
            homeTop: homeOnAxis(top, h, layoutH, vh, docResolved),
            homeLeft: homeOnAxis(left, w, layoutW, vw, docResolved),
            homeW: w,
            homeH: h,
            tx: 0,
            ty: 0,
        });
    }
}

/**
 * While zoomed, watch for fixed elements the page adds or reveals — a nav menu opened
 * at 3x would otherwise land at the document origin, off screen. Attribute changes on
 * elements we already pin are our own translate writes, so they don't count as news.
 */
function startWatching() {
    if (watcher) return;
    watcher = new MutationObserver((records) => {
        if (!records.some((r) => !isOwnMutation(r))) return;
        clearTimeout(rescanTimer);
        rescanTimer = window.setTimeout(() => {
            scanFixed();
            applyPins();
        }, RESCAN_DEBOUNCE_MS);
    });
    watcher.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["style", "class", "hidden"],
    });
}

function stopWatching() {
    clearTimeout(rescanTimer);
    watcher?.disconnect();
    watcher = null;
}

/** drop pins whose element went away, stopped being fixed, or got hidden */
function prunePins() {
    pins = pins.filter((p) => {
        const live =
            p.el.isConnected &&
            getComputedStyle(p.el).position === "fixed" &&
            (p.el.offsetWidth || p.el.offsetHeight);
        if (!live) {
            p.el.style.translate = "";
            delete p.el.dataset.unilensPin;
        }
        return live;
    });
}

/**
 * Seat each element into the magnified surface at the place it holds on the unzoomed
 * page, measured from the document origin. That's a fixed content coordinate, so the
 * element stays put no matter where the user zoomed in from or scrolls to — it pans
 * out of view rather than following the lens.
 * Corrects by the exact measured delta, so it can't accumulate drift.
 */
function applyPins() {
    const s = scale;
    for (const p of pins) {
        const r = p.el.getBoundingClientRect();
        const dy = p.homeTop * s - window.scrollY - r.top;
        const dx = p.homeLeft * s - window.scrollX - r.left;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
        p.tx += dx / s;
        p.ty += dy / s;
        p.el.style.translate = `${p.tx}px ${p.ty}px`;
        p.el.dataset.unilensPin = "";
    }
}

function clearPins() {
    for (const p of pins) {
        p.el.style.translate = "";
        delete p.el.dataset.unilensPin;
    }
    pins = [];
    restoreSticky();
}

/** html2canvas onclone hook — undo our zoom fixups in the clone, which renders unzoomed */
export function stripFixedPins(doc: Document) {
    for (const el of doc.querySelectorAll<HTMLElement>("[data-unilens-pin]")) {
        el.style.translate = "";
        el.removeAttribute("data-unilens-pin");
    }
    for (const el of doc.querySelectorAll<HTMLElement>(
        "[data-unilens-sticky]",
    )) {
        el.style.position = "";
        el.removeAttribute("data-unilens-sticky");
    }
}

// ── The view offset ────────────────────────────────────────────────────────
// Where the window sits over the magnified surface, in client px. Two engines can
// provide it and everything downstream is written against this, not against scroll:
//
//   scroll-pan (default) — the document really scrolls. Simple, but the page sees
//     every lens move as a scroll event, at magnified magnitudes, so anything
//     scroll-driven on the page misbehaves (sticky, JS handlers, scroll animations).
//   lens-pan (settings.lensPan) — the document is frozen at scroll 0 and we pan by
//     translating the transform. The page believes nothing is happening, so its
//     scroll-driven behaviour is simply never triggered. This is the magnifier model.
//
// At scale 1 neither applies: no transform, no freeze, the page scrolls natively.

let pan = { x: 0, y: 0 };
let frozen = false;
let prevOverflow = "";
const viewListeners: ((x: number, y: number) => void)[] = [];

function lensMode() {
    return getSettings().lensPan;
}

/** window's offset over the magnified surface, in client px */
export function getView(): { x: number; y: number } {
    return frozen
        ? { x: pan.x, y: pan.y }
        : { x: window.scrollX, y: window.scrollY };
}

/** client coords -> content (layout) coords, correct under either engine */
export function clientToContent(
    clientX: number,
    clientY: number,
): { x: number; y: number } {
    const v = getView();
    return { x: (clientX + v.x) / scale, y: (clientY + v.y) / scale };
}

/** minimap follows the lens; there are no scroll events to listen to when frozen */
export function onViewChange(cb: (x: number, y: number) => void) {
    viewListeners.push(cb);
}

export function setView(x: number, y: number) {
    if (frozen) {
        pan.x = Math.max(
            0,
            Math.min(x, Math.max(0, layoutW * scale - window.innerWidth)),
        );
        pan.y = Math.max(
            0,
            Math.min(y, Math.max(0, layoutH * scale - window.innerHeight)),
        );
        paint();
        applyPins();
    } else {
        window.scrollTo(x, y);
    }
    const v = getView();
    for (const cb of viewListeners) cb(v.x, v.y);
}

function paint() {
    document.body.style.transformOrigin = "0 0";
    if (scale === 1) document.body.style.transform = "";
    else if (frozen)
        document.body.style.transform = `translate(${-pan.x}px, ${-pan.y}px) scale(${scale})`;
    else document.body.style.transform = `scale(${scale})`;
}

/**
 * Stop the document scrolling and take over panning. The page is parked at scroll 0 —
 * its rest state — which is also the state the fixed-element seating assumes, so the
 * whole magnified surface is the page exactly as it renders unscrolled.
 */
function freeze() {
    if (frozen) return;
    pan = { x: window.scrollX, y: window.scrollY }; // both are the same client-px offset
    window.scrollTo(0, 0);
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    frozen = true;
    measureLayout(); // losing the scrollbar changes the available width
}

function unfreeze() {
    if (!frozen) return;
    const { x, y } = pan; // same client-px offset the scroll engine uses
    document.documentElement.style.overflow = prevOverflow;
    frozen = false;
    pan = { x: 0, y: 0 };
    window.scrollTo(x, y); // land where the lens was looking
}

// ── Animated zoom state ────────────────────────────────────────────────────
let targetScale = 1;
let anchor = { ax: 0, ay: 0, cx: 0, cy: 0 }; // client point + pinned content point
let rafId = 0;

function applyScale(s: number) {
    if (s !== 1 && lensMode()) freeze();
    scale = s;
    paint();
    // content point under the anchor stays under the anchor at every frame
    setView(anchor.cx * s - anchor.ax, anchor.cy * s - anchor.ay);
    if (s === 1) {
        stopWatching();
        clearPins();
        unfreeze();
    } else applyPins();
    showBadge();
    for (const cb of changeListeners) cb(s);
}

function animate() {
    const diff = targetScale - scale;
    if (Math.abs(diff) < 0.001) {
        applyScale(targetScale);
        rafId = 0;
        return;
    }
    applyScale(scale + diff * 0.25); // exponential ease-out
    rafId = requestAnimationFrame(animate);
}

/** Zoom to `target`, pinning content point (cx, cy) to client point (ax, ay). */
function setZoomPin(
    target: number,
    cx: number,
    cy: number,
    ax: number,
    ay: number,
) {
    if (layoutW === 0) measureLayout();
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, target));
    if (clamped === targetScale && clamped === scale) return;
    targetScale = clamped;
    anchor = { ax, ay, cx, cy };
    if (clamped !== 1 && !watcher) {
        scanFixed();
        startWatching();
    }

    if (getSettings().zoomTrace) {
        zoomTrace.push({
            t: Date.now(),
            scale: Math.round(targetScale * 100) / 100,
            x: Math.round(anchor.cx),
            y: Math.round(anchor.cy),
        });
        if (zoomTrace.length > ZOOM_TRACE_MAX)
            zoomTrace.splice(0, zoomTrace.length - ZOOM_TRACE_MAX);
    }

    if (!getSettings().smoothZoom) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        applyScale(targetScale);
        return;
    }
    if (!rafId) rafId = requestAnimationFrame(animate);
}

/** Zoom to `target`, keeping the content under (anchorX, anchorY) client coords fixed. Defaults to viewport center. */
export function setZoom(target: number, anchorX?: number, anchorY?: number) {
    const ax = anchorX ?? window.innerWidth / 2;
    const ay = anchorY ?? window.innerHeight / 2;
    // pin the content point currently under the anchor (at the current scale)
    const c = clientToContent(ax, ay);
    setZoomPin(target, c.x, c.y, ax, ay);
}

// ── Double-click smart zoom ────────────────────────────────────────────────
function onDblClick(e: MouseEvent) {
    if (!getSettings().smartZoom || !getSettings().zoom) return;
    if (!(e.target instanceof HTMLElement)) return;
    let el: HTMLElement | null = e.target;
    if (el.closest("#unilens-root")) return;
    // climb inline/tiny elements to a meaningful block
    while (
        el &&
        el !== document.body &&
        (getComputedStyle(el).display === "inline" ||
            el.getBoundingClientRect().width / scale < 80)
    ) {
        el = el.parentElement;
    }
    if (!el || el === document.body) return;

    const rect = el.getBoundingClientRect(); // zoomed client px
    const contentW = rect.width / scale;
    const { x: cx, y: cy } = clientToContent(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
    );

    let target = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, (window.innerWidth - 48) / contentW),
    );
    if (Math.abs(targetScale - target) < 0.05) target = 1; // second double-click: back out

    setZoomPin(target, cx, cy, window.innerWidth / 2, window.innerHeight / 2);
}

const SCROLLABLE = /(auto|scroll)/;

/**
 * Something nearer than the lens wants this wheel: UniLens' own chrome (the chat
 * popover, settings, minimap — all of which live outside <body>), or a scroller on
 * the page that still has room to move. Panning the lens would swallow their scroll.
 */
function wheelHandledElsewhere(e: WheelEvent): boolean {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return false;
    if (!document.body.contains(target)) return true;
    for (
        let el: Element | null = target;
        el && el !== document.body;
        el = el.parentElement
    ) {
        const style = getComputedStyle(el);
        if (
            SCROLLABLE.test(style.overflowY) &&
            el.scrollHeight > el.clientHeight
        ) {
            if (
                e.deltaY < 0
                    ? el.scrollTop > 0
                    : Math.ceil(el.scrollTop + el.clientHeight) <
                      el.scrollHeight
            )
                return true;
        }
        if (
            SCROLLABLE.test(style.overflowX) &&
            el.scrollWidth > el.clientWidth
        ) {
            if (
                e.deltaX < 0
                    ? el.scrollLeft > 0
                    : Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth
            )
                return true;
        }
    }
    return false;
}

function onWheel(e: WheelEvent) {
    if (e.ctrlKey) {
        if (!getSettings().zoom) return; // toggled off: let the browser zoom natively
        e.preventDefault(); // stop browser-native zoom
        setZoom(
            targetScale * Math.exp(-e.deltaY * 0.002),
            e.clientX,
            e.clientY,
        );
        return;
    }
    if (!frozen) return; // scroll engine: the page scrolls itself
    if (wheelHandledElsewhere(e)) return;
    e.preventDefault(); // frozen document can't scroll — we pan the lens instead
    const k = e.deltaMode === 1 ? 16 : 1; // deltaMode 1 is lines, not px
    const v = getView();
    setView(v.x + e.deltaX * k, v.y + e.deltaY * k);
}

const PAN_STEP = 80;

/** keyboard panning — the frozen document won't respond to arrows or page keys itself */
function onPanKey(e: KeyboardEvent) {
    if (!frozen || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (
        t &&
        (t.isContentEditable ||
            /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) ||
            t.closest?.("#unilens-root"))
    )
        return;
    const v = getView();
    const page = window.innerHeight * 0.9;
    let dx = 0;
    let dy = 0;
    switch (e.key) {
        case "ArrowDown":
            dy = PAN_STEP;
            break;
        case "ArrowUp":
            dy = -PAN_STEP;
            break;
        case "ArrowRight":
            dx = PAN_STEP;
            break;
        case "ArrowLeft":
            dx = -PAN_STEP;
            break;
        case "PageDown":
            dy = page;
            break;
        case "PageUp":
            dy = -page;
            break;
        case " ":
            dy = e.shiftKey ? -page : page;
            break;
        case "Home":
            e.preventDefault();
            return setView(0, 0);
        case "End":
            e.preventDefault();
            return setView(v.x, layoutH * scale);
        default:
            return;
    }
    e.preventDefault();
    setView(v.x + dx, v.y + dy);
}

function onKeyDown(e: KeyboardEvent) {
    if (!e.ctrlKey || !getSettings().zoomKeys) return;
    // '=' is unshifted '+' on most layouts; NumpadAdd/Subtract for numpad
    if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") {
        e.preventDefault();
        setZoom(targetScale * 1.25);
    } else if (e.key === "-" || e.code === "NumpadSubtract") {
        e.preventDefault();
        setZoom(targetScale / 1.25);
    } else if (e.key === "0" || e.code === "Numpad0") {
        e.preventDefault();
        setZoom(1);
    }
}

export function initZoom() {
    measureLayout();
    // init() from <head>: dimensions measured mid-parse (or not at all) are
    // wrong — re-measure once the document is fully parsed
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => measureLayout(), {
            once: true,
        });
    }
    window.addEventListener("resize", () => {
        measureLayout();
        if (scale === 1) return;
        // home positions were derived against the old window size — re-derive them
        clearPins();
        scanFixed();
        applyPins();
    });
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keydown", onPanKey);
    document.addEventListener("dblclick", onDblClick);
    // flipping engines mid-zoom: hand the current view across without changing what's on screen
    onSettingsChange(() => {
        if (scale === 1) return;
        if (lensMode() && !frozen) freeze();
        else if (!lensMode() && frozen) unfreeze();
        else return;
        paint();
        applyPins();
    });
    console.log(
        "[UniLens] zoom enabled — ctrl+wheel, ctrl +/− /0, double-click to fit",
    );
}
