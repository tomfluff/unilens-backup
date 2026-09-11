import { describe, expect, it } from "vitest";
import { SATURATION_FILTER } from "./accessibilityStoreTypes";
import { toneFilterCss, toneFilterTarget } from "./documentEffects";

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
