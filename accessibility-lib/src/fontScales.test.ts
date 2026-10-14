import { describe, expect, it } from "vitest";
import {
    a11yFontSizeToScale,
    FONT_SCALE_LEVELS,
    type FontScaleLevel,
    fontScalePercent,
    levelToScale,
    PREVIEW_FONT_BASE_PX,
    PREVIEW_FONT_PX,
    scaleToLevel,
} from "./fontScales";

describe("levelToScale / scaleToLevel", () => {
    it("maps each level to its scale", () => {
        expect(levelToScale(1)).toBe(1);
        expect(levelToScale(2)).toBe(1.95);
        expect(levelToScale(3)).toBe(2.6);
    });

    it("round-trips back to the same level", () => {
        ([1, 2, 3] as FontScaleLevel[]).forEach((level) => {
            expect(scaleToLevel(levelToScale(level))).toBe(level);
        });
    });

    it("rounds an in-between scale to the nearest level", () => {
        expect(scaleToLevel(1.1)).toBe(1);
        expect(scaleToLevel(1.7)).toBe(2);
        expect(scaleToLevel(2.4)).toBe(3);
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
        expect(a11yFontSizeToScale("large")).toBe(1.95);
        expect(a11yFontSizeToScale("xlarge")).toBe(2.6);
    });

    it("agrees with the shared level table for its scale", () => {
        expect(a11yFontSizeToScale("standard")).toBe(levelToScale(1));
        expect(a11yFontSizeToScale("large")).toBe(levelToScale(2));
        expect(a11yFontSizeToScale("xlarge")).toBe(levelToScale(3));
    });
});

describe("preview glyphs follow the same ratios as the live scale", () => {
    it("is 100% / 195% / 260% of the base preview size", () => {
        expect([...PREVIEW_FONT_PX]).toEqual([
            PREVIEW_FONT_BASE_PX,
            Math.round(PREVIEW_FONT_BASE_PX * 1.95),
            Math.round(PREVIEW_FONT_BASE_PX * 2.6),
        ]);
        expect(fontScalePercent(1)).toBe("100%");
        expect(fontScalePercent(2)).toBe("195%");
        expect(fontScalePercent(3)).toBe("260%");
    });
});
