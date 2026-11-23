/**
 * Geometry helpers for host media vs HTML text.
 * High-contrast used to dim overlapping photos; text now gets a black plate
 * instead, so photos keep their original brightness.
 */
import { BG_MEDIA_ATTR } from "./domIds";

export function hasPaintedBackgroundImage(value: string): boolean {
    if (!value) return false;
    const layers = value.split(",").map((s) => s.trim().toLowerCase());
    return layers.some((layer) => layer !== "" && layer !== "none");
}

export type OverlayRect = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

export function rectsOverlap(a: OverlayRect, b: OverlayRect): boolean {
    return (
        a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top
    );
}

/** Drop leftover dim-markers from older builds. */
export function clearBackgroundMediaMarkers(
    root: ParentNode | null = document,
) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    root.querySelectorAll(`[${BG_MEDIA_ATTR}]`).forEach((el) => {
        el.removeAttribute(BG_MEDIA_ATTR);
    });
}
