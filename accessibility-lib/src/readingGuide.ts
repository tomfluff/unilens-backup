/**
 * Reading guide: a 600×10px bar that follows the pointer. Placement is
 * above, centered on, or below the pointer. The OS cursor is never restyled.
 */
import { getA11ySettings, onA11yChange } from "./accessibilityStore";
import {
    normalizeReadingGuidePosition,
    normalizeReadingGuideStyle,
    READING_GUIDE_DEFAULT_POSITION,
    READING_GUIDE_DEFAULT_STYLE,
    READING_GUIDE_PAIRS,
    type ReadingGuidePosition,
    type ReadingGuideStyle,
    readingGuidePairCss,
} from "./accessibilityStoreTypes";
import {
    READING_GUIDE_EDGE_VAR,
    READING_GUIDE_FILL_VAR,
    READING_GUIDE_ID,
    READING_GUIDE_TIP_ATTR,
    UI_ATTR,
} from "./domIds";
import { appendA11yStyle } from "./cspStyle";

export {
    normalizeReadingGuidePosition,
    normalizeReadingGuideStyle,
    READING_GUIDE_DEFAULT_POSITION,
    READING_GUIDE_DEFAULT_STYLE,
    READING_GUIDE_PAIRS,
    READING_GUIDE_POSITIONS,
    READING_GUIDE_STYLES,
    type ReadingGuidePosition,
    type ReadingGuideStyle,
    readingGuidePairCss,
} from "./accessibilityStoreTypes";

export const READING_GUIDE_WIDTH_PX = 600;
export const READING_GUIDE_HEIGHT_PX = 10;
/** Gap between the pointer and the bar in the above position. */
export const READING_GUIDE_GAP_PX = 10;
/** Gap between the pointer and the bar in the below position (10px + 20px). */
export const READING_GUIDE_BELOW_GAP_PX = READING_GUIDE_GAP_PX + 20;
export const READING_GUIDE_EDGE_PX = 2;

/**
 * Center tip: a small arrowhead on the bar pointing toward the pointer
 * (down when the bar sits above the pointer or is centered on it, up when
 * the bar sits below). Drawn as ::before (edge) / ::after (fill) triangles
 * so no extra DOM nodes are needed; the edge triangle is 2px larger on
 * every side so it reads as an outline around the fill triangle, matching
 * the bar's own box-shadow edge.
 */
export const READING_GUIDE_TIP_HALF_WIDTH_PX = 12;
export const READING_GUIDE_TIP_HEIGHT_PX = 13;
export const READING_GUIDE_TIP_EDGE_HALF_WIDTH_PX =
    READING_GUIDE_TIP_HALF_WIDTH_PX + READING_GUIDE_EDGE_PX;
export const READING_GUIDE_TIP_EDGE_HEIGHT_PX =
    READING_GUIDE_TIP_HEIGHT_PX + READING_GUIDE_EDGE_PX;

const DEFAULT_PAIR = READING_GUIDE_PAIRS[READING_GUIDE_DEFAULT_STYLE];

const STYLE_ID = "unilens-a11y-reading-guide-style";

const GUIDE_CSS = `
#${READING_GUIDE_ID} {
  position: fixed;
  top: 0;
  left: 0;
  width: ${READING_GUIDE_WIDTH_PX}px;
  height: ${READING_GUIDE_HEIGHT_PX}px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 2px;
  pointer-events: none;
  z-index: 2147483645;
  background: var(${READING_GUIDE_FILL_VAR}, ${DEFAULT_PAIR.fill});
  box-shadow: 0 0 0 ${READING_GUIDE_EDGE_PX}px var(${READING_GUIDE_EDGE_VAR}, ${DEFAULT_PAIR.edge});
  transform: translate3d(-9999px, -9999px, 0);
  will-change: transform;
  display: none;
}
#${READING_GUIDE_ID}[data-unilens-a11y-reading-guide="on"] {
  display: block;
}
#${READING_GUIDE_ID}::before,
#${READING_GUIDE_ID}::after {
  content: "";
  position: absolute;
  left: 50%;
  width: 0;
  height: 0;
}
#${READING_GUIDE_ID}::before {
  border-left: ${READING_GUIDE_TIP_EDGE_HALF_WIDTH_PX}px solid transparent;
  border-right: ${READING_GUIDE_TIP_EDGE_HALF_WIDTH_PX}px solid transparent;
}
#${READING_GUIDE_ID}::after {
  border-left: ${READING_GUIDE_TIP_HALF_WIDTH_PX}px solid transparent;
  border-right: ${READING_GUIDE_TIP_HALF_WIDTH_PX}px solid transparent;
}
#${READING_GUIDE_ID}[${READING_GUIDE_TIP_ATTR}="down"]::before {
  top: 100%;
  transform: translateX(-50%);
  border-top: ${READING_GUIDE_TIP_EDGE_HEIGHT_PX}px solid var(${READING_GUIDE_EDGE_VAR}, ${DEFAULT_PAIR.edge});
}
#${READING_GUIDE_ID}[${READING_GUIDE_TIP_ATTR}="down"]::after {
  top: 100%;
  transform: translateX(-50%);
  border-top: ${READING_GUIDE_TIP_HEIGHT_PX}px solid var(${READING_GUIDE_FILL_VAR}, ${DEFAULT_PAIR.fill});
}
#${READING_GUIDE_ID}[${READING_GUIDE_TIP_ATTR}="up"]::before {
  bottom: 100%;
  transform: translateX(-50%);
  border-bottom: ${READING_GUIDE_TIP_EDGE_HEIGHT_PX}px solid var(${READING_GUIDE_EDGE_VAR}, ${DEFAULT_PAIR.edge});
}
#${READING_GUIDE_ID}[${READING_GUIDE_TIP_ATTR}="up"]::after {
  bottom: 100%;
  transform: translateX(-50%);
  border-bottom: ${READING_GUIDE_TIP_HEIGHT_PX}px solid var(${READING_GUIDE_FILL_VAR}, ${DEFAULT_PAIR.fill});
}
`;

/**
 * Places the bar relative to the pointer: 10px above, centered, or 30px below.
 */
export function readingGuideTransform(
    x: number,
    y: number,
    position: ReadingGuidePosition = READING_GUIDE_DEFAULT_POSITION,
): string {
    const place = normalizeReadingGuidePosition(position);
    if (place === "center") {
        return `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }
    if (place === "below") {
        return `translate3d(${x}px, ${y + READING_GUIDE_BELOW_GAP_PX}px, 0) translate(-50%, 0)`;
    }
    return `translate3d(${x}px, ${y - READING_GUIDE_GAP_PX}px, 0) translate(-50%, -100%)`;
}

export function readingGuideBoxShadow(edge: string): string {
    return `0 0 0 ${READING_GUIDE_EDGE_PX}px ${edge}`;
}

export type ReadingGuideTipDirection = "up" | "down";

/**
 * Which way the center tip points. Always "up", regardless of bar
 * position — the `position` argument is kept so the CSS/attribute wiring
 * in paintGuide() doesn't need to change if per-position direction comes
 * back later.
 */
export function readingGuideTipDirection(
    position: ReadingGuidePosition = READING_GUIDE_DEFAULT_POSITION,
): ReadingGuideTipDirection {
    void position;
    return "up";
}

let active = false;
let tracking = false;
let a11yUnsub: (() => void) | null = null;
let lastX = Number.NaN;
let lastY = Number.NaN;

function ensureStylesheet() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = GUIDE_CSS;
    appendA11yStyle(style);
}

function ensureGuide(): HTMLElement | null {
    if (typeof document === "undefined") return null;
    let el = document.getElementById(READING_GUIDE_ID);
    if (el instanceof HTMLElement) return el;
    el = document.createElement("div");
    el.id = READING_GUIDE_ID;
    el.setAttribute(UI_ATTR, "1");
    el.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(el);
    return el;
}

function hideGuide() {
    const el = document.getElementById(READING_GUIDE_ID);
    if (!(el instanceof HTMLElement)) return;
    el.removeAttribute("data-unilens-a11y-reading-guide");
    el.removeAttribute(READING_GUIDE_TIP_ATTR);
}

function applyGuideColors(el: HTMLElement, style: ReadingGuideStyle) {
    const pair = readingGuidePairCss(style);
    el.style.setProperty(READING_GUIDE_FILL_VAR, pair.fill);
    el.style.setProperty(READING_GUIDE_EDGE_VAR, pair.edge);
    el.style.background = pair.fill;
    el.style.boxShadow = readingGuideBoxShadow(pair.edge);
}

function paintGuide() {
    const s = getA11ySettings();
    if (!s.readingGuide) {
        hideGuide();
        return;
    }
    const el = ensureGuide();
    if (!el) return;
    applyGuideColors(el, normalizeReadingGuideStyle(s.readingGuideStyle));
    if (!Number.isFinite(lastX) || !Number.isFinite(lastY)) return;
    const position = normalizeReadingGuidePosition(s.readingGuidePosition);
    el.style.transform = readingGuideTransform(lastX, lastY, position);
    el.setAttribute(READING_GUIDE_TIP_ATTR, readingGuideTipDirection(position));
    el.setAttribute("data-unilens-a11y-reading-guide", "on");
}

function onPointerMove(e: PointerEvent) {
    lastX = e.clientX;
    lastY = e.clientY;
    paintGuide();
}

function onPointerLeave() {
    hideGuide();
}

function attachTracking() {
    if (tracking || typeof window === "undefined") return;
    tracking = true;
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    // `pointerleave` never fires on window; <html> gets it when the pointer
    // leaves the viewport (the root is hit-tested for empty canvas too).
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
}

function detachTracking() {
    if (!tracking || typeof window === "undefined") return;
    tracking = false;
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("blur", onPointerLeave);
}

function syncFromSettings() {
    if (getA11ySettings().readingGuide) {
        ensureStylesheet();
        attachTracking();
        paintGuide();
        return;
    }
    hideGuide();
    detachTracking();
    lastX = Number.NaN;
    lastY = Number.NaN;
}

export function initReadingGuide() {
    if (active) return;
    active = true;
    syncFromSettings();
    a11yUnsub = onA11yChange(syncFromSettings);
}

export function destroyReadingGuide() {
    if (!active) return;
    active = false;
    a11yUnsub?.();
    a11yUnsub = null;
    detachTracking();
    lastX = Number.NaN;
    lastY = Number.NaN;
    document.getElementById(READING_GUIDE_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
}
