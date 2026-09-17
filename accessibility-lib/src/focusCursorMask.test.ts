import { describe, expect, it } from "vitest";
import {
    FOCUS_CURSOR_BAND_PX,
    FOCUS_CURSOR_DIM,
    FOCUS_CURSOR_EDGE,
    FOCUS_CURSOR_EDGE_PX,
    focusCursorBandBottom,
    focusCursorBandTop,
    focusCursorEdgeBottom,
    focusCursorEdgeTop,
} from "./focusCursorMask";

describe("focus cursor mask", () => {
    it("clears a full-width band centered on the pointer", () => {
        expect(FOCUS_CURSOR_BAND_PX).toBe(150);
        expect(focusCursorBandTop(100, 150)).toBe(25);
        expect(focusCursorBandBottom(100, 150)).toBe(175);
        expect(
            focusCursorBandBottom(100, 150) - focusCursorBandTop(100, 150),
        ).toBe(150);
    });

    it("supports small, medium, and large band heights", () => {
        expect(focusCursorBandBottom(100, 80) - focusCursorBandTop(100, 80)).toBe(
            80,
        );
        expect(
            focusCursorBandBottom(100, 240) - focusCursorBandTop(100, 240),
        ).toBe(240);
    });

    it("tints the top and bottom 10px of the clear band blue", () => {
        expect(FOCUS_CURSOR_EDGE_PX).toBe(10);
        expect(focusCursorEdgeTop(100, 150)).toBe(25);
        expect(focusCursorEdgeBottom(100, 150)).toBe(165);
        expect(FOCUS_CURSOR_EDGE).toBe("rgb(0, 102, 255)");
    });

    it("dims the rest of the page lightly enough that text stays readable", () => {
        expect(FOCUS_CURSOR_DIM).toBe("rgba(0, 0, 0, 0.65)");
    });
});
