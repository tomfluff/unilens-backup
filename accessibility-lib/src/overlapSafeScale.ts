/**
 * Dynamic, per-element ceiling on text scaling so a chosen level/% never
 * grows text past the point where it starts overlapping something else.
 *
 * Page font scale, body-text expand, small-text boost and selection resize
 * each multiply an element's font-size on their own, independent of host
 * layout. A single flat ceiling (the old 1.3x used for out-of-flow badges)
 * either undershoots roomy layouts — capping "large" (195%) and "extra-large"
 * (260%) to the exact same visible size — or overshoots tight ones, letting
 * a badge grow until it sits on top of the text next to it. Measuring the
 * real box against its neighbors after each trial scale lets every element
 * grow as far as its own layout allows, and no further.
 */
import { type OverlayRect, rectsOverlap } from "./backgroundMediaOverlay";
import { isUniLensOverlayNode } from "./domIds";

export type { OverlayRect };

/** Never below this — 1x is "no scaling", the always-safe floor. */
const DEFAULT_MIN_SCALE = 1;
/** Font-size scale never needs more precision than this; also bounds the
 *  number of bisection steps (~7 across a 1x-3x range). */
const DEFAULT_RESOLUTION = 0.02;
/** How many ancestor levels to walk looking for a nearby out-of-flow
 *  overlay — bounds the cost of the reverse (in-flow element vs. badge
 *  layered somewhere above it) check. */
const OVERLAY_SEARCH_DEPTH = 4;

export interface MaxSafeScaleOptions {
    /** The scale we'd like to apply (e.g. the panel's 1.95 / 2.6). */
    desiredScale: number;
    /** Always-safe fallback, never reduced further than this. */
    minScale?: number;
    /** Stop bisecting once the safe/unsafe gap is this small. */
    resolution?: number;
    /**
     * Applies `scale` (writes the trial style and forces layout) and
     * reports whether the result overlaps something it shouldn't. Called
     * with a handful of decreasing scales; overlap is assumed monotonic in
     * scale — growing text only closes gaps, never opens them — so the
     * largest safe scale can be found by bisection.
     */
    overlapsAt: (scale: number) => boolean;
}

/**
 * Largest scale in [minScale, desiredScale] at which `overlapsAt` reports
 * no overlap. Falls back to `minScale` if even that overlaps — the layout
 * was already tight before we touched it, so there is nothing safe to grow
 * into.
 */
export function maxSafeScale({
    desiredScale,
    minScale = DEFAULT_MIN_SCALE,
    resolution = DEFAULT_RESOLUTION,
    overlapsAt,
}: MaxSafeScaleOptions): number {
    if (!Number.isFinite(desiredScale) || desiredScale <= minScale) {
        return desiredScale;
    }
    if (!overlapsAt(desiredScale)) return desiredScale;
    if (overlapsAt(minScale)) return minScale;

    let safe = minScale;
    let unsafe = desiredScale;
    while (unsafe - safe > resolution) {
        const mid = Math.round((safe + unsafe) / 2 / resolution) * resolution;
        if (mid <= safe || mid >= unsafe) break;
        if (overlapsAt(mid)) unsafe = mid;
        else safe = mid;
    }
    return Math.round(safe * 1000) / 1000;
}

/** True when `rect` overlaps any rect in `neighbors`. */
export function overlapsAnyNeighbor(
    rect: OverlayRect,
    neighbors: OverlayRect[],
): boolean {
    return neighbors.some((n) => rectsOverlap(rect, n));
}

/** Absolutely/fixed-positioned elements sit outside normal flow, so the
 *  host reserves space for them at their authored 1x size — growing them
 *  can overlap the in-flow content around that reserved space. */
export function isOutOfFlowPositioned(el: Element): boolean {
    if (!(el instanceof HTMLElement)) return false;
    const position = getComputedStyle(el).position;
    return position === "absolute" || position === "fixed";
}

/**
 * Largest scale that does not overlap `neighbors`. No neighbors means the
 * desired scale is already safe (roomy header/tab, isolated badge).
 */
export function resolvePageFontCap(
    desiredScale: number,
    neighbors: OverlayRect[],
    measureRectAt: (scale: number) => OverlayRect,
): number {
    if (neighbors.length === 0) return desiredScale;
    return maxSafeScale({
        desiredScale,
        overlapsAt: (scale) =>
            overlapsAnyNeighbor(measureRectAt(scale), neighbors),
    });
}

/** Positioning ancestor used to find in-flow siblings of an overlay. */
export function positioningContainer(el: HTMLElement): Element | null {
    return el.offsetParent || el.parentElement;
}

/**
 * True when this node's growth can collide with something the host laid out
 * at 1x: the node itself is out of flow, or an overlay sits nearby.
 */
export function needsOverlapCap(el: Element): boolean {
    if (isOutOfFlowPositioned(el)) return true;
    return nearbyOutOfFlowOverlayRects(el).length > 0;
}

/** Neighbor boxes this element must not grow into. */
export function collectOverlapNeighbors(el: HTMLElement): OverlayRect[] {
    if (isOutOfFlowPositioned(el)) {
        const container = positioningContainer(el);
        if (!container) return [];
        return inFlowSiblingRects(container, el);
    }
    return nearbyOutOfFlowOverlayRects(el);
}

function isEligibleNeighbor(el: Element, exclude: Element): boolean {
    return (
        el !== exclude && el instanceof HTMLElement && !isUniLensOverlayNode(el)
    );
}

/**
 * In-flow content sharing `container` with an out-of-flow element — the
 * "reserved space" neighbors that element can grow into (e.g. a "NEW"
 * ribbon absolutely positioned in a card, and the date text elsewhere in
 * that same card). `container` is the out-of-flow element's own
 * positioning container (`offsetParent`), so its direct children are
 * exactly the content laid out around the reserved space.
 */
export function inFlowSiblingRects(
    container: Element,
    exclude: Element,
): OverlayRect[] {
    const rects: OverlayRect[] = [];
    for (const child of Array.from(container.children)) {
        if (!isEligibleNeighbor(child, exclude)) continue;
        if (isOutOfFlowPositioned(child)) continue; // layered independently
        rects.push(child.getBoundingClientRect());
    }
    return rects;
}

/**
 * Out-of-flow badges/pills layered over the ancestors of `el` — the kind of
 * content an in-flow element (body-text expand, small-text boost, a
 * selection-resize span) can grow underneath. Unlike `inFlowSiblingRects`,
 * the in-flow element has no direct positioning relationship to the
 * overlay, so this walks a few ancestor levels looking for one.
 */
export function nearbyOutOfFlowOverlayRects(el: Element): OverlayRect[] {
    const rects: OverlayRect[] = [];
    let node: Element = el;
    for (let depth = 0; depth < OVERLAY_SEARCH_DEPTH; depth++) {
        const parent = node.parentElement;
        if (!parent) break;
        for (const child of Array.from(parent.children)) {
            if (!isEligibleNeighbor(child, node)) continue;
            if (!isOutOfFlowPositioned(child)) continue;
            rects.push(child.getBoundingClientRect());
        }
        node = parent;
    }
    return rects;
}
