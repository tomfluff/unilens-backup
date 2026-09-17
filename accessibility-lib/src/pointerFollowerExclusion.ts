/**
 * Cursor color (pointer halo), focus cursor, and reading guide share one pointer
 * slot — only one may be active at a time.
 */
import type { A11ySettings } from "./accessibilityStoreTypes";
import {
    focusCursorOn,
    normalizeFocusCursorBandPx,
    normalizePointerHaloPx,
    pointerHaloOn,
} from "./accessibilityStoreTypes";
import { rememberPointerHaloOnPx } from "./pointerHaloMemory";

type PointerFollowerFields = Pick<
    A11ySettings,
    "pointerHaloPx" | "focusCursorBandPx" | "readingGuide"
>;

export function applyPointerFollowerExclusion(
    current: PointerFollowerFields,
    patch: Partial<A11ySettings>,
): Partial<A11ySettings> {
    const next = { ...patch };
    const currentHaloOn = pointerHaloOn(
        normalizePointerHaloPx(current.pointerHaloPx),
    );

    if (
        patch.pointerHaloPx !== undefined &&
        pointerHaloOn(normalizePointerHaloPx(patch.pointerHaloPx))
    ) {
        next.focusCursorBandPx = 0;
        next.readingGuide = false;
    }
    if (
        patch.focusCursorBandPx !== undefined &&
        focusCursorOn(normalizeFocusCursorBandPx(patch.focusCursorBandPx))
    ) {
        if (currentHaloOn) rememberPointerHaloOnPx(current.pointerHaloPx);
        next.pointerHaloPx = 0;
        next.readingGuide = false;
    }
    if (patch.readingGuide === true) {
        if (currentHaloOn) rememberPointerHaloOnPx(current.pointerHaloPx);
        next.focusCursorBandPx = 0;
        next.pointerHaloPx = 0;
    }
    return next;
}

/** Hydration / legacy stores may have more than one on; keep a single winner. */
export function reconcilePointerFollowers(s: PointerFollowerFields): void {
    const haloOn = pointerHaloOn(normalizePointerHaloPx(s.pointerHaloPx));
    if (haloOn) {
        s.focusCursorBandPx = 0;
        s.readingGuide = false;
        return;
    }
    if (focusCursorOn(normalizeFocusCursorBandPx(s.focusCursorBandPx))) {
        s.pointerHaloPx = 0;
        s.readingGuide = false;
        return;
    }
    if (s.readingGuide) {
        s.pointerHaloPx = 0;
        s.focusCursorBandPx = 0;
    }
}
