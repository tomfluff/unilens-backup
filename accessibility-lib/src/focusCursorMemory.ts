/**
 * Last on-band height for the focus cursor so toggling it back on restores the choice.
 */
import {
    FOCUS_CURSOR_DEFAULT_BAND_PX,
    focusCursorOn,
    type FocusCursorBandPx,
} from "./accessibilityStoreTypes";

let rememberedBandPx: Exclude<FocusCursorBandPx, 0> =
    FOCUS_CURSOR_DEFAULT_BAND_PX;

export function rememberFocusCursorBandPx(px: FocusCursorBandPx): void {
    if (focusCursorOn(px)) rememberedBandPx = px;
}

export function lastOnFocusCursorBandPx(): Exclude<FocusCursorBandPx, 0> {
    return rememberedBandPx;
}

export function resetFocusCursorMemory(): void {
    rememberedBandPx = FOCUS_CURSOR_DEFAULT_BAND_PX;
}
