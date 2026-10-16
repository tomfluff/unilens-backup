import { describe, expect, it } from "vitest";
import { SATURATION_FILTER } from "./accessibilityStoreTypes";
import {
    isAdoptableTag,
    mediaTextGuardActive,
    toneFilterCss,
    toneFilterTarget,
} from "./documentEffects";

const standard = {
    theme: "standard",
    saturation: "standard",
    contrast: "standard",
} as const;

describe("toneFilterTarget", () => {
    it("does not paint a filter when theme, saturation, and contrast are standard", () => {
        expect(toneFilterTarget(standard)).toBe("none");
    });

    it("paints the whole page when theme is standard and saturation changes", () => {
        expect(toneFilterTarget({ ...standard, saturation: "soft" })).toBe(
            "page",
        );
    });

    it("paints the whole page when theme is standard and contrast changes", () => {
        expect(toneFilterTarget({ ...standard, contrast: "strong" })).toBe(
            "page",
        );
    });

    it("paints remapped themes on the page root when tone changes", () => {
        expect(
            toneFilterTarget({
                ...standard,
                theme: "dark",
                contrast: "max",
            }),
        ).toBe("page");
    });

    it("does not paint a page filter for remapped themes with default tone", () => {
        expect(toneFilterTarget({ ...standard, theme: "light" })).toBe("none");
    });

    it("keeps invert on html so fixed headers stay viewport-anchored", () => {
        expect(toneFilterTarget({ ...standard, theme: "invert" })).toBe("html");
        expect(
            toneFilterTarget({
                ...standard,
                theme: "invert",
                saturation: "high",
            }),
        ).toBe("html");
    });
});

describe("toneFilterCss", () => {
    it("matches the store multipliers so panel preview and page stay in sync", () => {
        expect(
            toneFilterCss({ saturation: "soft", contrast: "standard" }),
        ).toBe(`saturate(${SATURATION_FILTER.soft}) contrast(1)`);
        expect(
            toneFilterCss({ saturation: "standard", contrast: "strong" }),
        ).toBe("saturate(1) contrast(1.4)");
    });
});

describe("mediaTextGuardActive", () => {
    const base = { ...standard, textStroke: false, linkBackground: false };

    it("is off when nothing changes colors", () => {
        expect(mediaTextGuardActive(base)).toBe(false);
    });

    it("is on for the dark and high-contrast themes and for tone filters", () => {
        expect(mediaTextGuardActive({ ...base, theme: "dark" })).toBe(true);
        expect(mediaTextGuardActive({ ...base, theme: "high-contrast" })).toBe(
            true,
        );
        expect(mediaTextGuardActive({ ...base, saturation: "soft" })).toBe(
            true,
        );
    });

    it("is off under invert: the whole page, pictures and their text, flips alike", () => {
        expect(mediaTextGuardActive({ ...base, theme: "invert" })).toBe(false);
        expect(
            mediaTextGuardActive({
                ...base,
                theme: "invert",
                saturation: "soft",
                textStroke: true,
                linkBackground: true,
            }),
        ).toBe(false);
    });
});

describe("isAdoptableTag", () => {
    it("moves painted host elements appended to <body> into the page root", () => {
        for (const tag of ["FOOTER", "DIV", "UL", "dialog"])
            expect(isAdoptableTag(tag)).toBe(true);
    });

    it("leaves non-painting tags where the host put them", () => {
        for (const tag of ["SCRIPT", "STYLE", "LINK", "NOSCRIPT", "template"])
            expect(isAdoptableTag(tag)).toBe(false);
    });
});
