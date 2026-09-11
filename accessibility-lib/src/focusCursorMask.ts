/**
 * Reading-focus mask: a full-width, 150px-tall clear band centered on the
 * pointer. The rest of the viewport is slightly dimmed. The OS cursor is
 * unchanged. The top and bottom 10px of the clear band are solid blue.
 */
import { getA11ySettings, onA11yChange } from "./accessibilityStore";
import {
    FOCUS_CURSOR_BOTTOM_ID,
    FOCUS_CURSOR_EDGE_BOTTOM_ID,
    FOCUS_CURSOR_EDGE_TOP_ID,
    FOCUS_CURSOR_ID,
    FOCUS_CURSOR_TOP_ID,
    UI_ATTR,
} from "./domIds";

/** Clear band height in CSS pixels, vertically centered on the pointer. */
export const FOCUS_CURSOR_BAND_PX = 150;

/** Blue tint along the top and bottom of the clear band. */
export const FOCUS_CURSOR_EDGE_PX = 10;

/** Dim overlay outside the band (about 65% black). */
export const FOCUS_CURSOR_DIM = "rgba(0, 0, 0, 0.65)";

/** Solid blue bars on the top and bottom of the clear band. */
export const FOCUS_CURSOR_EDGE = "rgb(0, 102, 255)";

const STYLE_ID = "unilens-a11y-focus-cursor-style";
const HALO_Z = 2147483645;

const MASK_CSS = `
#${FOCUS_CURSOR_ID} {
  position: fixed;
  inset: 0;
  margin: 0;
  padding: 0;
  border: none;
  overflow: hidden;
  pointer-events: none;
  z-index: ${HALO_Z};
  display: none;
}
#${FOCUS_CURSOR_ID}[data-unilens-a11y-focus-cursor="on"] {
  display: block;
}
#${FOCUS_CURSOR_TOP_ID},
#${FOCUS_CURSOR_BOTTOM_ID},
#${FOCUS_CURSOR_EDGE_TOP_ID},
#${FOCUS_CURSOR_EDGE_BOTTOM_ID} {
  position: absolute;
  left: 0;
  right: 0;
  margin: 0;
  padding: 0;
  border: none;
  pointer-events: none;
}
#${FOCUS_CURSOR_TOP_ID},
#${FOCUS_CURSOR_BOTTOM_ID} {
  background: ${FOCUS_CURSOR_DIM};
}
#${FOCUS_CURSOR_EDGE_TOP_ID},
#${FOCUS_CURSOR_EDGE_BOTTOM_ID} {
  height: ${FOCUS_CURSOR_EDGE_PX}px;
  background: ${FOCUS_CURSOR_EDGE};
}
#${FOCUS_CURSOR_TOP_ID} { top: 0; height: 0; }
#${FOCUS_CURSOR_BOTTOM_ID} { top: 0; bottom: 0; }
#${FOCUS_CURSOR_EDGE_TOP_ID},
#${FOCUS_CURSOR_EDGE_BOTTOM_ID} { top: 0; }
`;

/** Top edge of the 150px clear band, in viewport Y. */
export function focusCursorBandTop(clientY: number): number {
    return clientY - FOCUS_CURSOR_BAND_PX / 2;
}

/** Bottom edge of the 150px clear band, in viewport Y. */
export function focusCursorBandBottom(clientY: number): number {
    return clientY + FOCUS_CURSOR_BAND_PX / 2;
}

/** Top of the blue tint at the upper edge of the clear band. */
export function focusCursorEdgeTop(clientY: number): number {
    return focusCursorBandTop(clientY);
}

/** Top of the blue tint at the lower edge of the clear band. */
export function focusCursorEdgeBottom(clientY: number): number {
    return focusCursorBandBottom(clientY) - FOCUS_CURSOR_EDGE_PX;
}

let active = false;
let tracking = false;
let a11yUnsub: (() => void) | null = null;
let lastY = Number.NaN;

function ensureStylesheet() {
    if (typeof document === "undefined") return;
    let style = document.getElementById(STYLE_ID);
    if (!(style instanceof HTMLStyleElement)) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head?.appendChild(style);
    }
    style.textContent = MASK_CSS;
}

function ensureChild(root: HTMLElement, id: string): HTMLElement {
    const existing = document.getElementById(id);
    if (existing instanceof HTMLElement && existing.parentElement === root) {
        return existing;
    }
    existing?.remove();
    const el = document.createElement("div");
    el.id = id;
    root.appendChild(el);
    return el;
}

function ensureMask(): HTMLElement | null {
    if (typeof document === "undefined") return null;
    let root = document.getElementById(FOCUS_CURSOR_ID);
    if (!(root instanceof HTMLElement)) {
        root = document.createElement("div");
        root.id = FOCUS_CURSOR_ID;
        root.setAttribute(UI_ATTR, "1");
        root.setAttribute("aria-hidden", "true");
        document.documentElement.appendChild(root);
    }
    ensureChild(root, FOCUS_CURSOR_TOP_ID);
    ensureChild(root, FOCUS_CURSOR_BOTTOM_ID);
    ensureChild(root, FOCUS_CURSOR_EDGE_TOP_ID);
    ensureChild(root, FOCUS_CURSOR_EDGE_BOTTOM_ID);
    return root;
}

function hideMask() {
    const root = document.getElementById(FOCUS_CURSOR_ID);
    if (!(root instanceof HTMLElement)) return;
    root.removeAttribute("data-unilens-a11y-focus-cursor");
}

function paintMask() {
    if (!getA11ySettings().focusCursor) {
        hideMask();
        return;
    }
    if (!Number.isFinite(lastY)) {
        hideMask();
        return;
    }
    const root = ensureMask();
    if (!root) return;
    const topEl = document.getElementById(FOCUS_CURSOR_TOP_ID);
    const bottomEl = document.getElementById(FOCUS_CURSOR_BOTTOM_ID);
    const edgeTopEl = document.getElementById(FOCUS_CURSOR_EDGE_TOP_ID);
    const edgeBottomEl = document.getElementById(FOCUS_CURSOR_EDGE_BOTTOM_ID);
    if (
        !(topEl instanceof HTMLElement) ||
        !(bottomEl instanceof HTMLElement) ||
        !(edgeTopEl instanceof HTMLElement) ||
        !(edgeBottomEl instanceof HTMLElement)
    ) {
        return;
    }
    const bandTop = focusCursorBandTop(lastY);
    const bandBottom = focusCursorBandBottom(lastY);
    topEl.style.height = `${Math.max(0, bandTop)}px`;
    bottomEl.style.top = `${Math.max(0, bandBottom)}px`;
    edgeTopEl.style.top = `${bandTop}px`;
    edgeBottomEl.style.top = `${focusCursorEdgeBottom(lastY)}px`;
    root.setAttribute("data-unilens-a11y-focus-cursor", "on");
}

function onPointerMove(e: PointerEvent) {
    lastY = e.clientY;
    paintMask();
}

function onPointerLeave() {
    hideMask();
}

function attachTracking() {
    if (tracking || typeof window === "undefined") return;
    tracking = true;
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
}

function detachTracking() {
    if (!tracking || typeof window === "undefined") return;
    tracking = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("blur", onPointerLeave);
}

function syncFromSettings() {
    if (getA11ySettings().focusCursor) {
        ensureStylesheet();
        attachTracking();
        paintMask();
        return;
    }
    hideMask();
    detachTracking();
    lastY = Number.NaN;
}

export function initFocusCursorMask() {
    if (active) return;
    active = true;
    syncFromSettings();
    a11yUnsub = onA11yChange(syncFromSettings);
}

export function destroyFocusCursorMask() {
    if (!active) return;
    active = false;
    a11yUnsub?.();
    a11yUnsub = null;
    detachTracking();
    lastY = Number.NaN;
    document.getElementById(FOCUS_CURSOR_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
}
