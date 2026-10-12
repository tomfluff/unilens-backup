/**
 * Places the user asked about: every capture's click (or selected region's centre),
 * so the conversation can take them back there ("where I clicked"). Kept for this
 * page load; the element reference goes stale on reload, the content point does not.
 */
import { getTargetView, getZoom, revealPoint } from "./zoom";

export interface Place {
    captureId: string;
    at: number;
    /** content-space point of the click */
    x: number;
    y: number;
    /** the element clicked, while it is still on the page */
    el?: Element;
    /** where in that element, content px from its top-left, measured at the click
     *  (before the capture, which can take a while, so the page may move first) */
    offset?: { x: number; y: number };
    /** asked from the floating button: the middle of the window, not a click */
    byButton?: boolean;
    /** short description for buttons and speech */
    label: string;
}

const places = new Map<string, Place>();
/** places in the order they were made: P1, P2, … in the chat */
const order: Place[] = [];
let latest: Place | null = null;
const listeners = new Set<() => void>();
const changed = () => {
    for (const cb of listeners) cb();
};

/** told when a place is added or the places start over (the lasting click marks) */
export function onPlacesChange(cb: () => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

/** where a client point falls within `el`, content px from its top-left; none when
 *  it falls outside (a region's centre on another element) */
export function clickOffset(
    el: Element | undefined,
    clientX: number,
    clientY: number,
): { x: number; y: number } | undefined {
    const r = el?.getBoundingClientRect();
    if (!r?.width || !r.height) return undefined;
    const x = clientX - r.left;
    const y = clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) return undefined;
    const { scale } = getZoom();
    return { x: x / scale, y: y / scale };
}

export function recordPlace(p: Place) {
    places.set(p.captureId, p);
    order.push(p);
    latest = p;
    changed();
}

/** a re-capture of the same view (a follow-up after the user moved) is the same place */
export function aliasPlace(captureId: string, of: string) {
    const p = places.get(of);
    if (p) places.set(captureId, p);
}

/** the place's number in this page load, from 1 */
export const placeNumber = (p: Place) => order.indexOf(p) + 1;

export const placeOf = (captureId: string | undefined) =>
    captureId ? places.get(captureId) : undefined;

export const latestPlace = () => latest;

/** every place in order, and the other capture ids that stand for one (view
 *  refreshes), as [id, the place's own capture id] */
export const allPlaces = () => ({
    order: [...order],
    aliases: [...places]
        .filter(([id, p]) => id !== p.captureId)
        .map(([id, p]) => [id, p.captureId] as [string, string]),
});

/**
 * Go back to the exact point the user clicked (not the middle of whatever they
 * clicked on, which can be a whole page section). No move when it is on screen.
 */
export function goToPlace(p: Place): "moved" | "in-view" {
    const { scale } = getZoom();
    // mid-glide, judge from where the page is going, not where it is
    const v = getTargetView();
    const W = window.visualViewport?.width ?? window.innerWidth;
    const H = window.visualViewport?.height ?? window.innerHeight;
    const cx = p.x * scale - v.x;
    const cy = p.y * scale - v.y;
    if (cx >= 0 && cy >= 0 && cx <= W && cy <= H) return "in-view";
    revealPoint(p.x, p.y);
    return "moved";
}

export function clearPlaces() {
    places.clear();
    order.length = 0;
    latest = null;
    changed();
}
