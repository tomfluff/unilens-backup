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
    /** short description for buttons and speech */
    label: string;
}

const places = new Map<string, Place>();
/** places in the order they were made: P1, P2, … in the chat */
const order: Place[] = [];
let latest: Place | null = null;

export function recordPlace(p: Place) {
    places.set(p.captureId, p);
    order.push(p);
    latest = p;
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
}
