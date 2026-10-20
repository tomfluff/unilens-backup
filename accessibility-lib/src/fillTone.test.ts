import { describe, expect, it } from "vitest";
import {
    contrastRatio,
    fillArea,
    fillTier,
    isChromatic,
    parseCssColor,
    type Rgb,
    SMALL_FILL_AREA_PX,
    saturationCapFor,
    themedFill,
} from "./fillTone";

const rgb = (s: string): Rgb => {
    const c = parseCssColor(s);
    if (!c) throw new Error(s);
    return [c[0], c[1], c[2]];
};

const DARK = {
    surface: rgb("#26263e"),
    text: rgb("#f0f0f0"),
    link: rgb("#77ddff"),
    saturationCap: 0.6,
};
const HIGH_CONTRAST = {
    surface: rgb("#000000"),
    text: rgb("rgb(255, 255, 0)"),
    link: rgb("rgb(255, 255, 0)"),
    saturationCap: 0.6,
};
const LIGHT = {
    surface: rgb("#ffffff"),
    text: rgb("#222222"),
    link: rgb("#0f3460"),
    saturationCap: 0.6,
};
const SOFT = {
    surface: rgb("#faf8f3"),
    text: rgb("#2b2b2b"),
    link: rgb("#3d5a40"),
    saturationCap: 0.35,
};
const PAGES: [string, typeof DARK, Rgb][] = [
    ["dark", DARK, rgb("#1a1a2e")],
    ["high-contrast", HIGH_CONTRAST, rgb("#000000")],
    ["light", LIGHT, rgb("#f5f5f5")],
    ["soft", SOFT, rgb("#f5f2eb")],
];

describe("parseCssColor", () => {
    it("reads hex and rgb() forms", () => {
        expect(parseCssColor("#fff")).toEqual([255, 255, 255, 1]);
        expect(parseCssColor(" #1a1a2e ")).toEqual([26, 26, 46, 1]);
        expect(parseCssColor("rgb(0, 26, 102)")).toEqual([0, 26, 102, 1]);
        expect(parseCssColor("rgba(0, 0, 0, 0.5)")).toEqual([0, 0, 0, 0.5]);
        expect(parseCssColor("color(srgb 1 0 0)")).toBeNull();
    });
});

describe("fillTier", () => {
    it("keeps light neutrals (cards, white buttons) on the surface", () => {
        for (const c of ["#ffffff", "#f5f5f5", "#eeeeee", "#f6f5f1"])
            expect(fillTier(rgb(c), 100)).toBe("surface");
    });

    it("puts mid grays (tracks, dividers) one step away", () => {
        for (const c of ["#cccccc", "#dddddd", "#999999", "#666666"])
            expect(fillTier(rgb(c), 100)).toBe("muted");
    });

    it("keeps the host hue for colored fills", () => {
        for (const c of [
            "#2e7d32",
            "#1976d2",
            "#e53935",
            "#fbc02d",
            "#0e2d4f",
            "#ffff00",
        ])
            expect(fillTier(rgb(c), Number.POSITIVE_INFINITY)).toBe("tone");
    });

    it("treats tinted panels as neutral", () => {
        expect(isChromatic(rgb("#e3f2fd"))).toBe(false);
        expect(isChromatic(rgb("#fff3cd"))).toBe(false);
    });

    it("sizes dark neutrals: small ones are marks, large ones are bars", () => {
        expect(fillTier(rgb("#333333"), 80 * 30)).toBe("muted");
        expect(fillTier(rgb("#222222"), SMALL_FILL_AREA_PX * 10)).toBe(
            "surface",
        );
        // A full-width thin bar is a band, whatever its area.
        expect(fillTier(rgb("#232f3e"), fillArea(1280, 24))).toBe("surface");
        expect(fillTier(rgb("#333333"), fillArea(120, 32))).toBe("muted");
    });
});

describe("themedFill", () => {
    for (const [name, palette, page] of PAGES) {
        it(`${name}: theme text and links stay readable on muted and tone fills`, () => {
            for (const c of [
                "#cccccc",
                "#2e7d32",
                "#1976d2",
                "#e53935",
                "#fbc02d",
            ]) {
                const host = rgb(c);
                const fill = themedFill(fillTier(host, 100), host, palette);
                expect(fill).not.toBeNull();
                const f = rgb(fill as string);
                expect(contrastRatio(palette.text, f)).toBeGreaterThanOrEqual(
                    4.5,
                );
                expect(contrastRatio(palette.link, f)).toBeGreaterThanOrEqual(
                    3,
                );
            }
        });

        it(`${name}: surface, muted and tone are each a step apart`, () => {
            const surface = palette.surface;
            const mutedC = rgb(
                themedFill("muted", rgb("#cccccc"), palette) as string,
            );
            const toneC = rgb(
                themedFill("tone", rgb("#1976d2"), palette) as string,
            );
            expect(contrastRatio(surface, mutedC)).toBeGreaterThan(1.4);
            expect(contrastRatio(mutedC, toneC)).toBeGreaterThan(1.4);
        });

        it(`${name}: surface < muted < tone in distance from the page`, () => {
            const muted = rgb(
                themedFill("muted", rgb("#cccccc"), palette) as string,
            );
            const tone = rgb(
                themedFill("tone", rgb("#2e7d32"), palette) as string,
            );
            expect(contrastRatio(muted, page)).toBeGreaterThan(1.4);
            expect(contrastRatio(tone, page)).toBeGreaterThan(
                contrastRatio(muted, page),
            );
        });

        it(`${name}: different hues stay different`, () => {
            const fills = ["#d32f2f", "#1976d2", "#388e3c", "#fbc02d"].map(
                (c) => themedFill("tone", rgb(c), palette),
            );
            expect(new Set(fills).size).toBe(4);
        });
    }

    it("returns nothing for the plain surface", () => {
        expect(themedFill("surface", rgb("#ffffff"), DARK)).toBeNull();
    });

    it("keeps the calm theme calm", () => {
        expect(saturationCapFor("soft")).toBeLessThan(saturationCapFor("dark"));
    });
});
