/**
 * Places the user asked about: every capture's click (or selected region's centre),
 * so the conversation can take them back there ("where I clicked"). Kept for this
 * page load; the element reference goes stale on reload, the content point does not.
 */
import { getView, getZoom, revealPoint } from "./zoom";

export interface Place {
    captureId: string;
    at: number;
    /** content-space point of the click */
    x: number;
    y: number;
    /** the element clicked, while it is still on the page */
    el?: Element;
    /** short description for buttons and speech */
    label: string;
}

const places = new Map<string, Place>();
let latest: Place | null = null;

export function recordPlace(p: Place) {
    places.set(p.captureId, p);
    latest = p;
}

export const placeOf = (captureId: string | undefined) =>
    captureId ? places.get(captureId) : undefined;

export const latestPlace = () => latest;

/**
 * Go back to the exact point the user clicked (not the middle of whatever they
 * clicked on, which can be a whole page section). No move when it is on screen.
 */
export function goToPlace(p: Place): "moved" | "in-view" {
    const { scale } = getZoom();
    const v = getView();
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
    latest = null;
}
