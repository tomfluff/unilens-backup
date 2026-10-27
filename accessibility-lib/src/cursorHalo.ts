/**
 * Translucent circle centered on the pointer. Diameter changes; the OS
 * cursor itself is never restyled.
 */
import { getA11ySettings, onA11yChange } from "./accessibilityStore";
import {
    normalizePointerHaloColor,
    normalizePointerHaloOpacity,
    POINTER_HALO_RGB,
    type PointerHaloPx,
    pointerHaloCssDiameter,
    pointerHaloFillCss,
    pointerHaloOn,
} from "./accessibilityStoreTypes";
import {
    lastOnPointerHaloPx,
    rememberPointerHaloOnPx,
    resetPointerHaloMemory,
} from "./pointerHaloMemory";
import {
    CURSOR_HALO_FILL_VAR,
    CURSOR_HALO_ID,
    CURSOR_HALO_RGB_VAR,
    CURSOR_HALO_SIZE_VAR,
    UI_ATTR,
} from "./domIds";
import { appendA11yStyle } from "./cspStyle";
import { registerTopLayer, unregisterTopLayer } from "./topLayer";

export {
    isPointerHaloViewportPct,
    normalizePointerHaloColor,
    normalizePointerHaloOpacity,
    normalizePointerHaloPx,
    POINTER_HALO_ALPHA,
    POINTER_HALO_COLORS,
    POINTER_HALO_DEFAULT_COLOR,
    POINTER_HALO_DEFAULT_OPACITY,
    POINTER_HALO_DEFAULT_PX,
    POINTER_HALO_FIXED_PX,
    POINTER_HALO_ON_PX,
    POINTER_HALO_OPACITIES,
    POINTER_HALO_PX,
    POINTER_HALO_RGB,
    POINTER_HALO_VIEWPORT_PCT,
    type PointerHaloColor,
    type PointerHaloFixedPx,
    type PointerHaloOpacity,
    type PointerHaloPx,
    type PointerHaloViewportPct,
    pointerHaloCssDiameter,
    pointerHaloFillCss,
    pointerHaloOn,
    pointerHaloPreviewDiameter,
} from "./accessibilityStoreTypes";

const STYLE_ID = "unilens-a11y-cursor-halo-style";
const HALO_CSS = `
#${CURSOR_HALO_ID} {
  position: fixed;
  /* a manual popover in the top layer (topLayer.ts): undo the popover UA box */
  inset: auto;
  overflow: visible;
  max-width: none;
  max-height: none;
  color: inherit;
  top: 0;
  left: 0;
  width: var(${CURSOR_HALO_SIZE_VAR}, 20px);
  height: var(${CURSOR_HALO_SIZE_VAR}, 20px);
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2147483647;
  background: var(${CURSOR_HALO_FILL_VAR}, rgba(255, 255, 0, 0.35));
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.4),
    0 0 12px rgb(var(${CURSOR_HALO_RGB_VAR}, 255 255 0) / 0.7);
  transform: translate3d(-9999px, -9999px, 0);
  will-change: transform;
  display: none;
}
#${CURSOR_HALO_ID}[data-unilens-a11y-cursor-halo="on"] {
  display: block;
}
`;

/** Viewport-fixed transform that keeps the circle centered on the pointer. */
export function pointerHaloTransform(x: number, y: number): string {
    return `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
}

let active = false;
let tracking = false;
let a11yUnsub: (() => void) | null = null;
let lastX = Number.NaN;
let lastY = Number.NaN;
export { lastOnPointerHaloPx, rememberPointerHaloOnPx } from "./pointerHaloMemory";

function ensureStylesheet() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = HALO_CSS;
    appendA11yStyle(style);
}

function ensureHalo(): HTMLElement | null {
    if (typeof document === "undefined") return null;
    let el = document.getElementById(CURSOR_HALO_ID);
    if (el instanceof HTMLElement) return el;
    el = document.createElement("div");
    el.id = CURSOR_HALO_ID;
    el.setAttribute(UI_ATTR, "1");
    el.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(el);
    // Above a host modal / popover, and outside the invert filter on <html>
    // (which turned the fluorescent fill gray).
    registerTopLayer(el, "always");
    return el;
}

function hideHalo() {
    const el = document.getElementById(CURSOR_HALO_ID);
    if (!(el instanceof HTMLElement)) return;
    el.removeAttribute("data-unilens-a11y-cursor-halo");
}

function paintHalo() {
    const s = getA11ySettings();
    const px = s.pointerHaloPx;
    if (!pointerHaloOn(px)) {
        hideHalo();
        return;
    }
    const el = ensureHalo();
    if (!el) return;
    const color = normalizePointerHaloColor(s.pointerHaloColor);
    const opacity = normalizePointerHaloOpacity(s.pointerHaloOpacity);
    const fill = pointerHaloFillCss(color, opacity);
    const [r, g, b] = POINTER_HALO_RGB[color];
    el.style.setProperty(CURSOR_HALO_SIZE_VAR, pointerHaloCssDiameter(px));
    el.style.setProperty(CURSOR_HALO_FILL_VAR, fill);
    el.style.setProperty(CURSOR_HALO_RGB_VAR, `${r} ${g} ${b}`);
    el.style.background = fill;
    if (!Number.isFinite(lastX) || !Number.isFinite(lastY)) return;
    el.style.transform = pointerHaloTransform(lastX, lastY);
    el.setAttribute("data-unilens-a11y-cursor-halo", "on");
}

function onPointerMove(e: PointerEvent) {
    lastX = e.clientX;
    lastY = e.clientY;
    paintHalo();
}

function onPointerLeave() {
    hideHalo();
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
    const px = getA11ySettings().pointerHaloPx;
    rememberPointerHaloOnPx(px);
    if (pointerHaloOn(px)) {
        ensureStylesheet();
        attachTracking();
        paintHalo();
        return;
    }
    hideHalo();
    detachTracking();
    lastX = Number.NaN;
    lastY = Number.NaN;
}

export function initCursorHalo() {
    if (active) return;
    active = true;
    syncFromSettings();
    a11yUnsub = onA11yChange(syncFromSettings);
}

export function destroyCursorHalo() {
    if (!active) return;
    active = false;
    a11yUnsub?.();
    a11yUnsub = null;
    detachTracking();
    lastX = Number.NaN;
    lastY = Number.NaN;
    const halo = document.getElementById(CURSOR_HALO_ID);
    unregisterTopLayer(halo);
    halo?.remove();
    document.getElementById(STYLE_ID)?.remove();
    resetPointerHaloMemory();
}
