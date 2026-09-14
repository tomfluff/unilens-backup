/**
 * Cursor color (pointer halo), focus cursor, and reading guide share one pointer
 * slot — only one may be active at a time.
 */
import type { A11ySettings } from "./accessibilityStoreTypes";
import {
    normalizePointerHaloPx,
    pointerHaloOn,
} from "./accessibilityStoreTypes";
import { rememberPointerHaloOnPx } from "./pointerHaloMemory";

type PointerFollowerFields = Pick<
    A11ySettings,
    "pointerHaloPx" | "focusCursor" | "readingGuide"
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
        next.focusCursor = false;
        next.readingGuide = false;
    }
    if (patch.focusCursor === true) {
        if (currentHaloOn) rememberPointerHaloOnPx(current.pointerHaloPx);
        next.pointerHaloPx = 0;
        next.readingGuide = false;
    }
    if (patch.readingGuide === true) {
        if (currentHaloOn) rememberPointerHaloOnPx(current.pointerHaloPx);
        next.focusCursor = false;
        next.pointerHaloPx = 0;
    }
    return next;
}

/** Hydration / legacy stores may have more than one on; keep a single winner. */
export function reconcilePointerFollowers(s: PointerFollowerFields): void {
    const haloOn = pointerHaloOn(normalizePointerHaloPx(s.pointerHaloPx));
    if (haloOn) {
        s.focusCursor = false;
        s.readingGuide = false;
        return;
    }
    if (s.focusCursor) {
        s.pointerHaloPx = 0;
        s.readingGuide = false;
        return;
    }
    if (s.readingGuide) {
        s.pointerHaloPx = 0;
        s.focusCursor = false;
    }
}
