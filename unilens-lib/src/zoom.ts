/**
 * UniLens zoom — pinch-style page zoom on ctrl+mousewheel (trackpad pinch
 * gestures also arrive as ctrl+wheel). Applies scale() to document.body,
 * anchored at the cursor via scroll compensation. Content coordinates
 * (layout space, zoom-independent) are what capture/trace/click record,
 * so annotations align with the unzoomed screenshot at any zoom level.
 */

import { getSettings, motionMs, onSettingsChange } from "./settings";

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

const zoomTrace: ZoomEvent[] = [];

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
            transition: reducedMotion() ? "none" : "opacity 0.3s",
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

/**
 * Where the view is heading: an eased move's destination while one is running, else
 * where it is. Decisions (is it on screen? where was the user reading?) are made
 * against this, as if the move had already happened.
 */
export function getTargetView(): { x: number; y: number } {
    return tween ? { ...tween.to } : getView();
}

/** the system asks for reduced motion: no eased moves, zooms or fades */
export function reducedMotion(): boolean {
    return (
        typeof matchMedia === "function" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

export type ClientRect = {
    left: number;
    top: number;
    width: number;
    height: number;
};

/**
 * An element's client box. A box-less element (display:contents) reports 0x0 at the
 * viewport origin; its content is the union of its children's boxes. Still 0x0 when
 * nothing inside renders: callers treat that as "not on screen", never as (0, 0).
 */
export function boxOf(
    el: Element,
    measure: (el: Element) => ClientRect = (e) => e.getBoundingClientRect(),
): ClientRect {
    const r = measure(el);
    if (r.width || r.height) return r;
    const parts = Array.from(el.children, (c) => boxOf(c, measure)).filter(
        (b) => b.width || b.height,
    );
    if (!parts.length) return { left: 0, top: 0, width: 0, height: 0 };
    const left = Math.min(...parts.map((b) => b.left));
    const top = Math.min(...parts.map((b) => b.top));
    const right = Math.max(...parts.map((b) => b.left + b.width));
    const bottom = Math.max(...parts.map((b) => b.top + b.height));
    return { left, top, width: right - left, height: bottom - top };
}

export const isEmptyBox = (b: ClientRect) => !b.width && !b.height;

/**
 * An event from UniLens' own chrome (popover, settings, debug panel, minimap, badge,
 * hint chip): all of it lives on documentElement outside <body>, so the zoom transform
 * leaves it at 1x. Page gestures (double-click fit, alt+click capture, lens keys) must
 * ignore it: fast clicks on a settings spinner are a double-click too.
 */
export function isOwnUI(target: EventTarget | null): boolean {
    return (
        target instanceof Node &&
        target !== document.documentElement &&
        document.documentElement.contains(target) &&
        !document.body.contains(target)
    );
}

// ── Back is a bookmark ─────────────────────────────────────────────────────
// A run of moves to evidence (next, next, the third one) remembers only where the
// user was reading before its first move, and Back returns there. Moving the page
// yourself (scroll, pan, zoom, minimap) ends the run: the next move to evidence
// bookmarks the place you moved to, since that is where you are reading now.

/** where the user was reading before the current run, in content space */
let bookmark: { cx: number; cy: number } | null = null;
/** where the run's latest move put the view: still there means the run goes on */
let runEnd: { x: number; y: number; scale: number } | null = null;
/** px of drift from runEnd still counted as not having moved (scroll rounding) */
const RUN_SLOP = 4;

/** an element's client box as it will be once a running move lands */
function atDestination(r: ClientRect): ClientRect {
    if (!tween) return r;
    const v = getView();
    // field by field: a DOMRect's fields are prototype getters, which a spread drops,
    // and a box with no size sends the move to NaN (the top of the page)
    return {
        left: r.left + v.x - tween.to.x,
        top: r.top + v.y - tween.to.y,
        width: r.width,
        height: r.height,
    };
}

/**
 * Bring an element to the middle of the screen under either pan engine. Leaves the
 * view alone when the element is already fully on screen, so the page never moves
 * without need, unless `always`. The first of a run of moves is bookmarked so the
 * user can return to where they were reading ("back" / "戻る"). Returns what happened.
 */
export function revealElement(
    el: Element,
    measure?: (el: Element) => ClientRect,
    opts: {
        always?: boolean;
        /** client rect to keep the element out from under (the chat popover) */
        avoid?: { left: number; top: number; right: number; bottom: number };
    } = {},
): "moved" | "in-view" | "none" {
    const now = boxOf(el, measure);
    if (isEmptyBox(now)) return "none";
    // mid-move, judge from where the page is going, not where it is this frame
    const r = atDestination(now);
    // under browser pinch zoom the user sees the visual viewport, a window inside the
    // layout viewport that client rects are measured in
    const vv = window.visualViewport;
    const L = vv?.offsetLeft ?? 0;
    const T = vv?.offsetTop ?? 0;
    const W = vv?.width ?? window.innerWidth;
    const H = vv?.height ?? window.innerHeight;
    const a = opts.avoid;
    const covered =
        !!a &&
        r.left < a.right &&
        r.left + r.width > a.left &&
        r.top < a.bottom &&
        r.top + r.height > a.top;
    if (
        !opts.always &&
        !covered &&
        r.left >= L &&
        r.top >= T &&
        r.left + r.width <= L + W &&
        r.top + r.height <= T + H
    )
        return "in-view";
    // aim for the middle of the screen, or with a popover in the way, the middle of
    // the largest free band beside it (one the element fits in, when there is one)
    let cx = L + W / 2;
    let cy = T + H / 2;
    if (a) {
        // bands beside the popover only help when the page can pan sideways: at 100%
        // most pages cannot, so the element goes above or below the popover instead
        const canPanX = frozen
            ? layoutW * scale > W
            : document.documentElement.scrollWidth > window.innerWidth;
        const bands = [
            ...(canPanX
                ? [
                      { x: L, y: T, w: a.left - L, h: H },
                      { x: a.right, y: T, w: L + W - a.right, h: H },
                  ]
                : []),
            { x: L, y: T, w: W, h: a.top - T },
            { x: L, y: a.bottom, w: W, h: T + H - a.bottom },
        ].filter((b) => b.w > 0 && b.h > 0);
        const fits = bands.filter((b) => b.w >= r.width && b.h >= r.height);
        const pick = (fits.length ? fits : bands).sort(
            (p, q) => q.w * q.h - p.w * p.h,
        )[0];
        if (pick) {
            // a full-width band keeps the element's own x: no sideways move is possible
            cx = canPanX ? pick.x + pick.w / 2 : r.left + r.width / 2;
            cy = pick.y + pick.h / 2;
        }
    }
    const v = getTargetView();
    rememberView(W, H);
    setView(v.x + r.left + r.width / 2 - cx, v.y + r.top + r.height / 2 - cy);
    endOfRun();
    return "moved";
}

/**
 * Before a move to evidence: bookmark where the user is reading, unless this move
 * continues a run (the view is still where the last one put it, or heading there).
 * Remembered in content space, so a zoom change in between still returns right.
 */
function rememberView(W: number, H: number) {
    const v = getTargetView();
    const continues =
        bookmark &&
        runEnd &&
        runEnd.scale === scale &&
        Math.abs(v.x - runEnd.x) <= RUN_SLOP &&
        Math.abs(v.y - runEnd.y) <= RUN_SLOP;
    if (!continues)
        bookmark = { cx: (v.x + W / 2) / scale, cy: (v.y + H / 2) / scale };
}

/** after a move to evidence: the view it lands on is where the run now stands */
function endOfRun() {
    runEnd = { ...getTargetView(), scale };
}

/**
 * Centre a content-space point (where the user clicked, when the element it was
 * on is gone). Part of a run like any move, so "back" returns.
 */
export function revealPoint(x: number, y: number) {
    const W = window.visualViewport?.width ?? window.innerWidth;
    const H = window.visualViewport?.height ?? window.innerHeight;
    rememberView(W, H);
    setView(x * scale - W / 2, y * scale - H / 2);
    endOfRun();
}

export const canReturn = () => bookmark !== null;

/** go back to where the user was reading before the run of moves; false when there is none */
export function returnToPreviousView(): boolean {
    const b = bookmark;
    if (!b) return false;
    bookmark = null;
    runEnd = null;
    const vv = window.visualViewport;
    const W = vv?.width ?? window.innerWidth;
    const H = vv?.height ?? window.innerHeight;
    setView(b.cx * scale - W / 2, b.cy * scale - H / 2);
    return true;
}

/** where an element is relative to the screen, for spoken status */
export function directionOf(
    el: Element,
    measure?: (el: Element) => ClientRect,
): "on screen" | "above" | "below" | "to the left" | "to the right" | "" {
    const now = boxOf(el, measure);
    if (isEmptyBox(now)) return "";
    const r = atDestination(now);
    const W = window.visualViewport?.width ?? window.innerWidth;
    const H = window.visualViewport?.height ?? window.innerHeight;
    if (r.top + r.height < 0) return "above";
    if (r.top > H) return "below";
    if (r.left + r.width < 0) return "to the left";
    if (r.left > W) return "to the right";
    return "on screen";
}

/** client coords -> content (layout) coords, correct under either engine */
export function clientToContent(
    clientX: number,
    clientY: number,
): { x: number; y: number } {
    const v = getView();
    return { x: (clientX + v.x) / scale, y: (clientY + v.y) / scale };
}

/** minimap and highlight follow the lens; there are no scroll events to listen to when frozen (returns unsubscribe) */
export function onViewChange(cb: (x: number, y: number) => void): () => void {
    viewListeners.push(cb);
    return () => {
        const i = viewListeners.indexOf(cb);
        if (i >= 0) viewListeners.splice(i, 1);
    };
}

// ── Eased moves ────────────────────────────────────────────────────────────
// Every programmatic move (to evidence, back, a minimap click) glides with an
// ease-in-out over motionMs(); 0 (the instant setting, or reduced motion) jumps in the
// same call, as before. A glide is a string of jumps, one per frame, so both engines
// and every view listener follow it frame by frame. Anything the user does to move
// the page cancels it on the spot, so it never fights them.

interface Tween {
    from: { x: number; y: number };
    /** the destination, clamped to where the view can actually go */
    to: { x: number; y: number };
    /** the first frame's timestamp: NaN until that frame runs */
    start: number;
    ms: number;
    raf: number;
}

let tween: Tween | null = null;
/** a pointer is dragging (the minimap lens): follow it directly, no glide */
let dragging = false;
let inputWatched = false;

function cancelTween() {
    if (!tween) return;
    cancelAnimationFrame(tween.raf);
    tween = null;
}

/** keys the page scrolls with, pressed where they would scroll it */
const SCROLL_KEYS = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "PageUp",
    "PageDown",
    "Home",
    "End",
    " ",
]);

function isTypingTarget(t: EventTarget | null): boolean {
    return (
        t instanceof HTMLElement &&
        (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
    );
}

/**
 * The user taking over (a wheel, touch or press on the page, a scroll key) stops a
 * glide where it is. Window capture phase, so it runs before the lens engine's own
 * wheel and key panning. UniLens' own chrome is not the page: scrolling the chat or
 * clicking an edge cue leaves a glide alone.
 */
function watchInput() {
    if (inputWatched) return;
    inputWatched = true;
    const opts = { capture: true, passive: true };
    const onPage = (e: Event) => {
        if (!isOwnUI(e.target)) cancelTween();
    };
    window.addEventListener("wheel", onPage, opts);
    window.addEventListener("touchstart", onPage, opts);
    window.addEventListener(
        "pointerdown",
        (e) => {
            dragging = false;
            onPage(e);
        },
        opts,
    );
    window.addEventListener(
        "pointermove",
        (e) => {
            dragging = e.buttons !== 0;
        },
        opts,
    );
    const endDrag = () => {
        dragging = false;
    };
    window.addEventListener("pointerup", endDrag, opts);
    window.addEventListener("pointercancel", endDrag, opts);
    window.addEventListener(
        "keydown",
        (e) => {
            if (
                SCROLL_KEYS.has(e.key) &&
                !isTypingTarget(e.target) &&
                !isOwnUI(e.target)
            )
                cancelTween();
        },
        opts,
    );
}

/** clamp a view offset to where the active engine can actually put the window */
function clampView(x: number, y: number): { x: number; y: number } {
    const se = document.scrollingElement ?? document.documentElement;
    const maxX = frozen
        ? layoutW * scale - window.innerWidth
        : se.scrollWidth - se.clientWidth;
    const maxY = frozen
        ? layoutH * scale - window.innerHeight
        : se.scrollHeight - se.clientHeight;
    return {
        x: Math.max(0, Math.min(x, Math.max(0, maxX))),
        y: Math.max(0, Math.min(y, Math.max(0, maxY))),
    };
}

/**
 * Move the view, gliding when motion allows. A new move cancels a running glide and
 * starts from wherever it had got to; a drag follows the pointer directly.
 */
export function setView(x: number, y: number) {
    watchInput();
    cancelTween();
    const ms = dragging ? 0 : motionMs();
    const from = getView();
    const to = clampView(x, y);
    if (!ms || (to.x === from.x && to.y === from.y)) {
        jumpView(x, y);
        return;
    }
    // the clock starts on the first frame, read from the frame's own timestamp. Never
    // performance.now(): host pages replace it (SoftBank's vendor bundle swaps in a
    // Date-based polyfill running ~600ms behind the frame clock), and a start taken
    // before this click's own work is done makes the first frame land partway there
    tween = { from, to, start: Number.NaN, ms, raf: 0 };
    tween.raf = requestAnimationFrame(glide);
}

function glide(now: number) {
    const tw = tween;
    if (!tw) return;
    if (Number.isNaN(tw.start)) tw.start = now;
    const t = Math.min(1, Math.max(0, (now - tw.start) / tw.ms));
    if (t >= 1) {
        tween = null;
        jumpView(tw.to.x, tw.to.y, true);
        return;
    }
    // ask for the next frame before moving: listeners that redraw on a frame of their
    // own (outline, cues, minimap) then queue behind it, and every frame they draw
    // after this step has moved the page, never one step behind it
    tw.raf = requestAnimationFrame(glide);
    // cubic ease-in-out: leaves from where the reader is without a lurch (an ease-out
    // moved 14% on its first frame, felt as a jump) and lands gently
    const e = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    jumpView(
        tw.from.x + (tw.to.x - tw.from.x) * e,
        tw.from.y + (tw.to.y - tw.from.y) * e,
        true,
    );
}

/**
 * Put the view there now, under either engine, and tell the view listeners
 * (outline, cues, minimap). `frame`: one step of a glide, which must not be turned
 * into a smooth scroll of its own by the page's CSS scroll-behavior.
 */
function jumpView(x: number, y: number, frame = false) {
    if (frozen) {
        pan = clampView(x, y);
        paint();
        applyPins();
    } else if (frame) {
        window.scrollTo({ left: x, top: y, behavior: "instant" });
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
    jumpView(anchor.cx * s - anchor.ax, anchor.cy * s - anchor.ay);
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
    cancelTween(); // the zoom anchors the view now; a glide would drag it off
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

    if (!getSettings().smoothZoom || reducedMotion()) {
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
    if (isOwnUI(e.target)) return;
    let el: HTMLElement | null = e.target;
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
    jumpView(v.x + e.deltaX * k, v.y + e.deltaY * k);
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
            isOwnUI(t))
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
            return jumpView(0, 0);
        case "End":
            e.preventDefault();
            return jumpView(v.x, layoutH * scale);
        default:
            return;
    }
    e.preventDefault();
    jumpView(v.x + dx, v.y + dy);
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
