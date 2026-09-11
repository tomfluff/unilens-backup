import { afterEach, describe, expect, it } from "vitest";
import { a11yFontSizeToScale, levelToScale, scaledFontPx } from "./fontScales";
import {
    computeScaledFontPx,
    getEffectivePageFontScale,
    isPageFontSkipTag,
    PAGE_FONT_SKIP_TAGS,
    setPageFontExtraScale,
    setPageFontSizeScale,
} from "./pageFontScale";

describe("isPageFontSkipTag", () => {
    it("skips replaced media so photos do not pick up a text scale", () => {
        ["IMG", "PICTURE", "VIDEO", "CANVAS", "SVG", "IFRAME"].forEach(
            (tag) => {
                expect(isPageFontSkipTag(tag)).toBe(true);
            },
        );
    });

    it("does not skip text-bearing tags", () => {
        ["P", "SPAN", "H1", "LI", "A", "DIV", "BUTTON"].forEach((tag) => {
            expect(isPageFontSkipTag(tag)).toBe(false);
        });
    });

    it("is case-insensitive", () => {
        expect(isPageFontSkipTag("img")).toBe(true);
        expect(isPageFontSkipTag("Img")).toBe(true);
    });

    it("covers the media tags used by the host SoftBank pages", () => {
        expect(PAGE_FONT_SKIP_TAGS.has("IMG")).toBe(true);
        expect(PAGE_FONT_SKIP_TAGS.has("SOURCE")).toBe(true);
    });
});

describe("computeScaledFontPx", () => {
    it("multiplies the original pixel size by the page scale", () => {
        expect(computeScaledFontPx(14, 1.5)).toBe(21);
        expect(computeScaledFontPx(14, 2)).toBe(28);
    });

    it("leaves the size unchanged at scale 1", () => {
        expect(computeScaledFontPx(16, 1)).toBe(16);
    });

    it("matches selection resize for the same base and page font-size choice", () => {
        expect(computeScaledFontPx(16, a11yFontSizeToScale("large"))).toBe(
            scaledFontPx(16, levelToScale(2)),
        );
        expect(computeScaledFontPx(16, a11yFontSizeToScale("xlarge"))).toBe(
            scaledFontPx(16, levelToScale(3)),
        );
    });
});

describe("getEffectivePageFontScale", () => {
    afterEach(() => {
        setPageFontSizeScale(1);
        setPageFontExtraScale(1);
    });

    it("combines the panel font-size scale with auto-text extra scale", () => {
        setPageFontSizeScale(1.5);
        setPageFontExtraScale(1.2);
        expect(getEffectivePageFontScale()).toBe(1.8);
    });
});
