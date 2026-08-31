import { describe, expect, it } from "vitest";
import {
    FONT_SCALE_LEVELS,
    a11yFontSizeToScale,
    levelToScale,
    scaleToLevel,
    type FontScaleLevel,
} from "./fontScales";

describe("levelToScale / scaleToLevel", () => {
    it("maps each level to its scale", () => {
        expect(levelToScale(1)).toBe(1);
        expect(levelToScale(2)).toBe(1.5);
        expect(levelToScale(3)).toBe(2);
    });

    it("round-trips back to the same level", () => {
        ([1, 2, 3] as FontScaleLevel[]).forEach((level) => {
            expect(scaleToLevel(levelToScale(level))).toBe(level);
        });
    });

    it("rounds an in-between scale to the nearest level", () => {
        expect(scaleToLevel(1.1)).toBe(1);
        expect(scaleToLevel(1.4)).toBe(2);
        expect(scaleToLevel(1.9)).toBe(3);
    });

    it("clamps out-of-range scales to the nearest edge level", () => {
        expect(scaleToLevel(0.2)).toBe(1);
        expect(scaleToLevel(10)).toBe(3);
    });

    it("has a level list matching the scale table length", () => {
        expect(FONT_SCALE_LEVELS).toHaveLength(3);
    });
});

describe("a11yFontSizeToScale", () => {
    it("converts a page font-size choice to a scale", () => {
        expect(a11yFontSizeToScale("standard")).toBe(1);
        expect(a11yFontSizeToScale("large")).toBe(1.5);
        expect(a11yFontSizeToScale("xlarge")).toBe(2);
    });

    it("agrees with the shared level table for its scale", () => {
        expect(a11yFontSizeToScale("large")).toBe(levelToScale(2));
        expect(a11yFontSizeToScale("xlarge")).toBe(levelToScale(3));
    });
});
