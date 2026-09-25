/**
 * UniLens minimap — page overview with a lens rect, shown while magnified.
 *
 * Zoom is magnifier-style: the page becomes one big surface and scrolling moves a
 * lens over it. Two scrollbars are a poor control for that (at 4x the thumbs are
 * tiny and panning is two-dimensional), so this draws the whole page as a skeleton
 * with the visible region marked. Click or drag anywhere on it to move the lens.
 *
 * Lives on documentElement, outside the body transform, so it stays at 1x and stays
 * out of captures — same as the rest of the UniLens chrome.
 */

import { colorWithAlpha, EDGE, lookFrom } from "./highlightStyles";
import { getSettings, onSettingsChange } from "./settings";
import {
    boxOf,
    getView,
    getZoom,
    isEmptyBox,
    isOwnMutation,
    onViewChange,
    onZoomChange,
    refreshLayout,
    setView,
    toContent,
} from "./zoom";

const MAP_W = 140;
/** room left for the map after its inset, padding and border */
const heightBudget = () => window.innerHeight - 48;
// Deliberately skeleton rects, not a real thumbnail. html2canvas would look better but
// costs seconds per render; revisit if orientation turns out to need real content.
const MIN_AREA = 200; // layout px² — below this a block is noise at minimap scale
const MAX_RECTS = 1200;
const MEDIA = /^(IMG|VIDEO|CANVAS|SVG|PICTURE|IFRAME)$/;
const REDRAW_DEBOUNCE_MS = 300;

// Box (container) styles
const boxStyles: Record<string, string> = {
    position: "fixed",
    top: "16px",
    right: "16px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(0,0,0,0.25)",
    borderRadius: "6px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
    padding: "4px",
    zIndex: "2147483646", // just under the popover/badge
    cursor: "crosshair",
    touchAction: "none",
};

// Lens styles
const lensStyles: Record<string, string> = {
    position: "absolute",
    border: "2px solid #d23",
    background: "rgba(221,51,51,0.12)",
    pointerEvents: "none",
    borderRadius: "2px",
};

let box: HTMLDivElement | null = null;
let canvas: HTMLCanvasElement;
let lens: HTMLDivElement;
let mapScale = 0;
let raf = 0;
let watcher: MutationObserver | null = null;
let redrawTimer: number | undefined;
/** located elements to mark on the map; rects are read live at draw time */
let targets: Element[] = [];
/** the chip number of each target, drawn when mmNumbers is on */
let labels: string[] = [];

/**
 * Mark the elements the model pointed at, so an outline that lies outside the
 * magnified viewport is still discoverable (design decision D11). Elements, not
 * rects: a stored rect goes stale on the next layout shift.
 */
export function setTargets(els: Element[], nums: string[] = []) {
    targets = els;
    labels = nums;
    if (box && box.style.display !== "none") redraw();
}

/**
 * Targets drawn as their real rects on the map in the highlight colour. Shape is
 * one choice (a see-through fill or an outline); dimming the rest of the map, a
 * glow and the chip numbers stack on top. Numbers are drawn fully opaque over the
 * see-through fill so they read at map scale. Tiny targets grow to the minimum.
 */
function drawTargets(g: CanvasRenderingContext2D, scale: number) {
    const s = getSettings();
    const min = s.minimapMarkerSize;
    const color = lookFrom(s).color;
    const v = getView();
    const rects: { x: number; y: number; w: number; h: number; n: string }[] =
        [];
    targets.forEach((el, i) => {
        if (!el.isConnected) return;
        const r = boxOf(el);
        if (isEmptyBox(r)) return;
        const p = toContent(r.left + v.x, r.top + v.y);
        const w = (r.width / scale) * mapScale;
        const h = (r.height / scale) * mapScale;
        const mw = Math.max(w, min);
        const mh = Math.max(h, min);
        rects.push({
            x: p.x * mapScale + w / 2 - mw / 2,
            y: p.y * mapScale + h / 2 - mh / 2,
            w: mw,
            h: mh,
            n: labels[i] ?? "",
        });
    });
    if (!rects.length) return;
    if (s.mmDim) {
        g.beginPath();
        g.rect(0, 0, g.canvas.width, g.canvas.height);
        for (const r of rects) g.rect(r.x, r.y, r.w, r.h);
        g.fillStyle = "rgba(0,0,0,0.55)";
        g.fill("evenodd");
    }
    for (const r of rects) {
        g.save();
        if (s.mmGlow) {
            g.shadowColor = color;
            g.shadowBlur = 10;
        }
        if (s.mmShape === "filled") {
            // see-through: the page skeleton under the target stays visible
            g.fillStyle = colorWithAlpha(color, 0.45);
            g.fillRect(r.x, r.y, r.w, r.h);
            g.restore();
            g.lineWidth = 1.5;
            g.strokeStyle = EDGE;
            g.strokeRect(r.x, r.y, r.w, r.h);
        } else {
            g.lineWidth = 4;
            g.strokeStyle = EDGE;
            g.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
            g.restore();
            g.lineWidth = 2.5;
            g.strokeStyle = color;
            g.strokeRect(r.x, r.y, r.w, r.h);
        }
        if (s.mmNumbers && r.n) {
            g.font = "700 12px system-ui, sans-serif";
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.lineWidth = 3;
            g.strokeStyle = EDGE;
            g.fillStyle = "#fff";
            const cx = r.x + r.w / 2;
            const cy = r.y + r.h / 2;
            g.strokeText(r.n, cx, cy);
            g.fillText(r.n, cx, cy);
        }
    }
}

function build() {
    box = document.createElement("div");
    Object.assign(box.style, boxStyles);

    canvas = document.createElement("canvas");
    canvas.style.display = "block";
    box.appendChild(canvas);

    lens = document.createElement("div");
    Object.assign(lens.style, lensStyles);
    box.appendChild(lens);

    box.addEventListener("pointerdown", (e) => {
        try {
            box?.setPointerCapture(e.pointerId); // keeps the drag alive past the map's edge
        } catch {
            /* no live pointer to capture — dragging still works, just not past the edge */
        }
        panTo(e);
    });
    box.addEventListener("pointermove", (e) => {
        if (e.buttons) panTo(e);
    });

    document.documentElement.appendChild(box);
}

/** move the lens so it centres on the point clicked in the minimap */
function panTo(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const { scale } = getZoom();
    const contentX = (e.clientX - r.left) / mapScale;
    const contentY = (e.clientY - r.top) / mapScale;
    setView(
        contentX * scale - window.innerWidth / 2,
        contentY * scale - window.innerHeight / 2,
    );
}

/** redraw the page skeleton — layout only changes on resize, not while zooming */
function drawSkeleton() {
    const { scale, layoutW, layoutH } = getZoom();
    // width is the fixed dimension and height follows the page's aspect; only a page
    // long enough to overflow the window falls back to fitting the height instead
    mapScale = Math.min(MAP_W / layoutW, heightBudget() / layoutH);
    canvas.width = Math.max(1, Math.round(layoutW * mapScale));
    canvas.height = Math.max(1, Math.round(layoutH * mapScale));

    const g = canvas.getContext("2d");
    if (!g) return;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, canvas.width, canvas.height);

    let drawn = 0;
    for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
        if (drawn >= MAX_RECTS) break;
        const media = MEDIA.test(el.tagName);
        // leaves only: nested wrappers all paint the same region and the map turns into
        // one solid block. A leaf is the paragraph, link, or image you'd actually navigate to.
        if (!media && (el.children.length || !el.textContent?.trim())) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        // client px -> layout px: undo the zoom transform and the scroll offset
        const w = r.width / scale;
        const h = r.height / scale;
        if (w * h < MIN_AREA) continue;
        const v = getView();
        const p = toContent(r.left + v.x, r.top + v.y);
        g.fillStyle = media ? "rgba(0,120,200,0.30)" : "rgba(0,0,0,0.30)";
        g.fillRect(
            p.x * mapScale,
            p.y * mapScale,
            Math.max(1, w * mapScale),
            Math.max(1, h * mapScale),
        );
        drawn++;
    }
    drawTargets(g, scale);
}

function updateLens() {
    const { scale } = getZoom();
    const v = getView();
    const x = v.x / scale;
    const y = v.y / scale;
    lens.style.left = `${4 + x * mapScale}px`;
    lens.style.top = `${4 + y * mapScale}px`;
    lens.style.width = `${(window.innerWidth / scale) * mapScale}px`;
    lens.style.height = `${(window.innerHeight / scale) * mapScale}px`;
}

function scheduleLens() {
    if (!box || raf) return;
    raf = requestAnimationFrame(() => {
        raf = 0;
        updateLens();
    });
}

/**
 * Reactive pages rewrite their content while zoomed — new results, an expanded
 * accordion, lazy-loaded images. Redraw when that happens, and re-measure first
 * because the page's layout size usually changed with it.
 */
function startWatching() {
    if (watcher) return;
    watcher = new MutationObserver((records) => {
        // zoom writes inline styles on body and on the elements it seats; redrawing on
        // those would retrigger the measure that wrote them, looping forever
        if (!records.some((r) => !isOwnMutation(r))) return;
        clearTimeout(redrawTimer);
        redrawTimer = window.setTimeout(redraw, REDRAW_DEBOUNCE_MS);
    });
    watcher.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["style", "class", "hidden", "src"],
    });
}

function redraw() {
    if (!box || box.style.display === "none") return;
    refreshLayout(); // content changed, so the page is probably a different size now
    drawSkeleton();
    updateLens();
}

function show() {
    if (!box) build();
    if (box) box.style.display = "";
    redraw();
    startWatching();
}

function hide() {
    if (box) box.style.display = "none";
    clearTimeout(redrawTimer);
    watcher?.disconnect();
    watcher = null;
}

export function initMinimap() {
    onZoomChange((scale) => {
        if (scale > 1 && getSettings().minimap) {
            if (!box || box.style.display === "none") show();
            else updateLens();
        } else hide();
    });
    window.addEventListener("scroll", scheduleLens, { passive: true });
    onViewChange(scheduleLens); // lens-pan engine: the document never scrolls
    window.addEventListener("resize", redraw);
    // marker shape, dim, glow, numbers and the highlight colour apply to an open map
    // at once; debounced, since a redraw repaints the whole page skeleton
    onSettingsChange(() => {
        if (!box || box.style.display === "none" || !targets.length) return;
        clearTimeout(redrawTimer);
        redrawTimer = window.setTimeout(redraw, 60);
    });
}
