/**
 * Draggable toggle button — hold the "display adjustment" button and drag it to
 * anywhere on screen. The position is remembered in localStorage.
 *
 * The root (#unilens-a11y-root) is `position: fixed`; we anchor it to whichever
 * viewport corner is nearest the button, so the panel always opens toward the
 * middle of the screen instead of running off an edge.
 *
 * KEEP: this is wired up from accessibilityPanel.tsx. It is a shipped feature
 * (see toggleDragWiring.test.ts) — do not remove it as an "unused module".
 */

const STORAGE_KEY = "unilens-a11y-toggle-pos";
/** Pointer travel (px) before a press becomes a drag, so plain clicks still work. */
const DRAG_THRESHOLD_PX = 5;
const EDGE_MARGIN_PX = 8;

export interface TogglePos {
    /** left / top of the toggle button in viewport px */
    x: number;
    y: number;
}

export interface RootPlacement {
    left: string;
    right: string;
    top: string;
    bottom: string;
    /** true when the button sits in the top half → the panel opens below it */
    openDown: boolean;
    /** true when the button sits in the left half → the panel extends rightward */
    alignStart: boolean;
}

export function clampPos(
    pos: TogglePos,
    size: { w: number; h: number },
    viewport: { w: number; h: number },
): TogglePos {
    const maxX = Math.max(EDGE_MARGIN_PX, viewport.w - size.w - EDGE_MARGIN_PX);
    const maxY = Math.max(EDGE_MARGIN_PX, viewport.h - size.h - EDGE_MARGIN_PX);
    return {
        x: Math.min(Math.max(pos.x, EDGE_MARGIN_PX), maxX),
        y: Math.min(Math.max(pos.y, EDGE_MARGIN_PX), maxY),
    };
}

export function placementFor(
    pos: TogglePos,
    size: { w: number; h: number },
    viewport: { w: number; h: number },
): RootPlacement {
    const alignStart = pos.x + size.w / 2 < viewport.w / 2;
    const openDown = pos.y + size.h / 2 < viewport.h / 2;
    return {
        left: alignStart ? `${Math.round(pos.x)}px` : "auto",
        right: alignStart
            ? "auto"
            : `${Math.round(viewport.w - pos.x - size.w)}px`,
        top: openDown ? `${Math.round(pos.y)}px` : "auto",
        bottom: openDown
            ? "auto"
            : `${Math.round(viewport.h - pos.y - size.h)}px`,
        openDown,
        alignStart,
    };
}

/** Panel/button gap (matches the CSS margin) and a breathing margin from the viewport edge. */
const PANEL_GAP_PX = 10;
const MIN_PANEL_PX = 160;

/**
 * Height the panel can use on the side it opens toward, so it is never taller
 * than the room between the button and the viewport edge (its body scrolls).
 */
export function availablePanelHeight(
    pos: TogglePos,
    size: { w: number; h: number },
    viewport: { w: number; h: number },
): number {
    const openDown = placementFor(pos, size, viewport).openDown;
    const room = openDown
        ? viewport.h - (pos.y + size.h) - PANEL_GAP_PX - EDGE_MARGIN_PX
        : pos.y - PANEL_GAP_PX - EDGE_MARGIN_PX;
    return Math.max(MIN_PANEL_PX, Math.floor(room));
}

function readSaved(): TogglePos | null {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const v = JSON.parse(raw) as Partial<TogglePos>;
        if (Number.isFinite(v.x) && Number.isFinite(v.y)) {
            return { x: v.x as number, y: v.y as number };
        }
    } catch {
        // storage unavailable or corrupt — fall back to the default corner
    }
    return null;
}

function writeSaved(pos: TogglePos): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {
        // ignore
    }
}

/** Wires drag-to-move onto the toggle. Returns a cleanup function. */
export function installToggleDrag(
    toggle: HTMLElement,
    root: HTMLElement,
): () => void {
    const viewport = () => ({
        w: document.documentElement.clientWidth || window.innerWidth,
        h: window.innerHeight,
    });
    const size = () => {
        const r = toggle.getBoundingClientRect();
        return { w: r.width, h: r.height };
    };

    function apply(pos: TogglePos): TogglePos {
        const vp = viewport();
        const sz = size();
        const clamped = clampPos(pos, sz, vp);
        const p = placementFor(clamped, sz, vp);
        root.style.left = p.left;
        root.style.right = p.right;
        root.style.top = p.top;
        root.style.bottom = p.bottom;
        if (p.openDown) root.setAttribute("data-unilens-a11y-down", "");
        else root.removeAttribute("data-unilens-a11y-down");
        if (p.alignStart) root.setAttribute("data-unilens-a11y-start", "");
        else root.removeAttribute("data-unilens-a11y-start");
        updateAvail(clamped);
        return clamped;
    }

    function updateAvail(at: TogglePos) {
        root.style.setProperty(
            "--unilens-a11y-avail",
            `${availablePanelHeight(at, size(), viewport())}px`,
        );
    }

    function currentPos(): TogglePos {
        const r = toggle.getBoundingClientRect();
        return { x: r.left, y: r.top };
    }

    let pos: TogglePos | null = readSaved();
    if (pos) pos = apply(pos);
    else updateAvail(currentPos());

    let startX = 0;
    let startY = 0;
    let origin: TogglePos = { x: 0, y: 0 };
    let pointerId: number | null = null;
    let dragging = false;
    let suppressClick = false;

    function onPointerDown(e: PointerEvent) {
        if (e.button !== 0 || pointerId !== null) return;
        pointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        origin = currentPos();
        dragging = false;
        // Capture from the press so a fast drag can't leave the button before
        // the first move event arrives.
        try {
            toggle.setPointerCapture(e.pointerId);
        } catch {
            // pointer may already be gone
        }
    }

    function onPointerMove(e: PointerEvent) {
        if (e.pointerId !== pointerId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!dragging) {
            if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
            dragging = true;
            toggle.setAttribute("data-unilens-a11y-dragging", "");
        }
        e.preventDefault();
        pos = apply({ x: origin.x + dx, y: origin.y + dy });
    }

    function endDrag(e: PointerEvent) {
        if (e.pointerId !== pointerId) return;
        pointerId = null;
        if (dragging) {
            dragging = false;
            suppressClick = true;
            // the click (if any) fires right after pointerup; clear the flag after it
            window.setTimeout(() => {
                suppressClick = false;
            }, 0);
            toggle.removeAttribute("data-unilens-a11y-dragging");
            if (pos) writeSaved(pos);
        }
    }

    function onClickCapture(e: MouseEvent) {
        if (!suppressClick) return;
        e.stopPropagation();
        e.preventDefault();
        suppressClick = false;
    }

    function onResize() {
        if (pos) pos = apply(pos);
        else updateAvail(currentPos());
    }

    toggle.addEventListener("pointerdown", onPointerDown);
    toggle.addEventListener("pointermove", onPointerMove);
    toggle.addEventListener("pointerup", endDrag);
    toggle.addEventListener("pointercancel", endDrag);
    toggle.addEventListener("click", onClickCapture, true);
    window.addEventListener("resize", onResize);

    return () => {
        toggle.removeEventListener("pointerdown", onPointerDown);
        toggle.removeEventListener("pointermove", onPointerMove);
        toggle.removeEventListener("pointerup", endDrag);
        toggle.removeEventListener("pointercancel", endDrag);
        toggle.removeEventListener("click", onClickCapture, true);
        window.removeEventListener("resize", onResize);
    };
}
