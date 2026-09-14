/**
 * Last on-size for the pointer halo so toggling it back on restores the choice.
 * Kept separate from cursorHalo.ts so settings can remember without a circular import.
 */
import {
    POINTER_HALO_DEFAULT_PX,
    pointerHaloOn,
    type PointerHaloPx,
} from "./accessibilityStoreTypes";

let rememberedOnPx: Exclude<PointerHaloPx, 0> = POINTER_HALO_DEFAULT_PX;

export function rememberPointerHaloOnPx(px: PointerHaloPx): void {
    if (pointerHaloOn(px)) rememberedOnPx = px;
}

export function lastOnPointerHaloPx(): Exclude<PointerHaloPx, 0> {
    return rememberedOnPx;
}

export function resetPointerHaloMemory(): void {
    rememberedOnPx = POINTER_HALO_DEFAULT_PX;
}
