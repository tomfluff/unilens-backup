import { describe, expect, it } from "vitest";
import {
    applyPointerFollowerExclusion,
    reconcilePointerFollowers,
} from "./pointerFollowerExclusion";
import { lastOnPointerHaloPx } from "./pointerHaloMemory";

describe("pointer follower exclusion", () => {
    it("turning cursor color on disables focus cursor and reading guide", () => {
        const patch = applyPointerFollowerExclusion(
            { pointerHaloPx: 0, focusCursor: true, readingGuide: true },
            { pointerHaloPx: 20 },
        );
        expect(patch).toEqual({
            pointerHaloPx: 20,
            focusCursor: false,
            readingGuide: false,
        });
    });

    it("turning focus cursor on disables cursor color and reading guide", () => {
        const patch = applyPointerFollowerExclusion(
            { pointerHaloPx: 40, focusCursor: false, readingGuide: true },
            { focusCursor: true },
        );
        expect(patch.pointerHaloPx).toBe(0);
        expect(patch.focusCursor).toBe(true);
        expect(patch.readingGuide).toBe(false);
        expect(lastOnPointerHaloPx()).toBe(40);
    });

    it("turning reading guide on disables cursor color and focus cursor", () => {
        const patch = applyPointerFollowerExclusion(
            { pointerHaloPx: 20, focusCursor: true, readingGuide: false },
            { readingGuide: true },
        );
        expect(patch.pointerHaloPx).toBe(0);
        expect(patch.focusCursor).toBe(false);
        expect(patch.readingGuide).toBe(true);
    });

    it("changing halo size while already on does not re-clear unrelated fields", () => {
        const patch = applyPointerFollowerExclusion(
            { pointerHaloPx: 20, focusCursor: false, readingGuide: false },
            { pointerHaloPx: 40 },
        );
        expect(patch).toEqual({
            pointerHaloPx: 40,
            focusCursor: false,
            readingGuide: false,
        });
    });

    it("reconcile keeps cursor color over the other two", () => {
        const s = {
            pointerHaloPx: 20 as const,
            focusCursor: true,
            readingGuide: true,
        };
        reconcilePointerFollowers(s);
        expect(s).toEqual({
            pointerHaloPx: 20,
            focusCursor: false,
            readingGuide: false,
        });
    });

    it("reconcile keeps focus cursor when halo is off", () => {
        const s = {
            pointerHaloPx: 0 as const,
            focusCursor: true,
            readingGuide: true,
        };
        reconcilePointerFollowers(s);
        expect(s).toEqual({
            pointerHaloPx: 0,
            focusCursor: true,
            readingGuide: false,
        });
    });
});
