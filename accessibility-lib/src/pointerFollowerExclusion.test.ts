import { describe, expect, it } from "vitest";
import {
    applyPointerFollowerExclusion,
    reconcilePointerFollowers,
} from "./pointerFollowerExclusion";

describe("pointer follower exclusion", () => {
    it("turning cursor color on disables focus cursor and reading guide", () => {
        const patch = applyPointerFollowerExclusion(
            { pointerHaloPx: 0, focusCursorBandPx: 150, readingGuide: true },
            { pointerHaloPx: 20 },
        );
        expect(patch).toEqual({
            pointerHaloPx: 20,
            focusCursorBandPx: 0,
            readingGuide: false,
        });
    });

    it("turning focus cursor on disables cursor color and reading guide", () => {
        const patch = applyPointerFollowerExclusion(
            { pointerHaloPx: 40, focusCursorBandPx: 0, readingGuide: true },
            { focusCursorBandPx: 150 },
        );
        expect(patch).toEqual({
            focusCursorBandPx: 150,
            pointerHaloPx: 0,
            readingGuide: false,
        });
    });

    it("turning reading guide on disables cursor color and focus cursor", () => {
        const patch = applyPointerFollowerExclusion(
            {
                pointerHaloPx: 20,
                focusCursorBandPx: 150,
                readingGuide: false,
            },
            { readingGuide: true },
        );
        expect(patch).toEqual({
            readingGuide: true,
            pointerHaloPx: 0,
            focusCursorBandPx: 0,
        });
    });

    it("turning cursor color off does not force other followers off", () => {
        const patch = applyPointerFollowerExclusion(
            {
                pointerHaloPx: 20,
                focusCursorBandPx: 0,
                readingGuide: false,
            },
            { pointerHaloPx: 40 },
        );
        expect(patch).toEqual({
            pointerHaloPx: 40,
            focusCursorBandPx: 0,
            readingGuide: false,
        });
    });

    it("reconcile keeps cursor color when it is on", () => {
        const s = {
            pointerHaloPx: 20 as const,
            focusCursorBandPx: 150 as const,
            readingGuide: true,
        };
        reconcilePointerFollowers(s);
        expect(s).toEqual({
            pointerHaloPx: 20,
            focusCursorBandPx: 0,
            readingGuide: false,
        });
    });

    it("reconcile keeps focus cursor when halo is off", () => {
        const s = {
            pointerHaloPx: 0 as const,
            focusCursorBandPx: 240 as const,
            readingGuide: true,
        };
        reconcilePointerFollowers(s);
        expect(s).toEqual({
            pointerHaloPx: 0,
            focusCursorBandPx: 240,
            readingGuide: false,
        });
    });
});
