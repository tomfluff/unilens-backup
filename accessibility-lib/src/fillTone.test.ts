import { describe, expect, it } from "vitest";
import {
    contrastRatio,
    fillArea,
    fillTier,
    isChromatic,
    isGradientOnly,
    isSmallPart,
    largeToneIsSurfaceFor,
    parseCssColor,
    type Rgb,
    reachDecision,
    SMALL_FILL_AREA_PX,
    saturationCapFor,
    themedBorderColor,
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

    it("high contrast: large colored bands take the surface, small marks keep the hue", () => {
        for (const c of ["#3471cc", "#408038", "#e53935", "#fbc02d"]) {
            // Page band / section background: a side longer than 400px.
            expect(fillTier(rgb(c), fillArea(1280, 600), true)).toBe(
                "surface",
            );
            expect(fillTier(rgb(c), fillArea(300, 900), true)).toBe(
                "surface",
            );
            // Switches, badges, chips, brand buttons: keep the hue.
            expect(fillTier(rgb(c), fillArea(48, 24), true)).toBe("tone");
            expect(fillTier(rgb(c), fillArea(400, 60), true)).toBe("tone");
            expect(fillTier(rgb(c), fillArea(400, 400), true)).toBe("tone");
            // Pseudo-element decorations are measured as 0.
            expect(fillTier(rgb(c), 0, true)).toBe("tone");
            // Other themes keep the hue at any size.
            expect(fillTier(rgb(c), fillArea(1280, 600))).toBe("tone");
        }
        // Neutrals are unaffected by the option.
        expect(fillTier(rgb("#cccccc"), fillArea(1280, 600), true)).toBe(
            "muted",
        );
        expect(fillTier(rgb("#333333"), fillArea(80, 30), true)).toBe(
            "muted",
        );
    });

    it("only high contrast turns large colored fills into the surface", () => {
        expect(largeToneIsSurfaceFor("high-contrast")).toBe(true);
        for (const t of ["dark", "light", "soft", "invert", null])
            expect(largeToneIsSurfaceFor(t)).toBe(false);
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

describe("themedBorderColor", () => {
    const side = (color: string, width: number) => ({ color, width });
    const T = "var(--unilens-a11y-display-border)";
    const red = "rgb(239, 61, 52)";
    const clear = "rgba(0, 0, 0, 0)";

    it("leaves plain borders to the theme", () => {
        const thin = side("rgb(51, 51, 51)", 1);
        expect(
            themedBorderColor([thin, thin, thin, thin], "rgb(255, 255, 0)", HIGH_CONTRAST),
        ).toBeNull();
        // Thin colored lines too: they are lines, not shapes.
        const thinRed = side(red, 2);
        expect(
            themedBorderColor([thinRed, thinRed, thinRed, thinRed], "rgb(255, 255, 0)", HIGH_CONTRAST),
        ).toBeNull();
        expect(
            themedBorderColor([side(red, 0), side(red, 0), side(red, 0), side(red, 0)], "rgb(255, 255, 0)", HIGH_CONTRAST),
        ).toBeNull();
        expect(themedBorderColor([side(clear, 4), side(red, 4), side(red, 4), side(red, 4)], "x", null)).toBeNull();
    });

    it("keeps transparent sides transparent (CSS triangles, idle tab underlines)", () => {
        // yukoyuko "値下げ" ribbon tail: transparent top/right, red bottom/left.
        const v = themedBorderColor(
            [side(clear, 12), side(clear, 12), side(red, 12), side(red, 12)],
            "rgb(255, 255, 0)",
            HIGH_CONTRAST,
        ) as string;
        const parts = v.match(/transparent|rgb\([^)]*\)|var\([^)]*\)/g);
        expect(parts?.[0]).toBe("transparent");
        expect(parts?.[1]).toBe("transparent");
        // A tab whose idle underline is transparent: the line stays hidden.
        const tab = themedBorderColor(
            [side(clear, 0), side(clear, 0), side(clear, 3), side(clear, 0)],
            "rgb(255, 255, 0)",
            HIGH_CONTRAST,
        ) as string;
        expect(tab.match(/transparent|var\([^)]*\)/g)?.[2]).toBe("transparent");
    });

    it("paints thick colored sides like a fill of that color, in every theme", () => {
        for (const [, palette] of PAGES) {
            const host = rgb(red);
            const tone = themedFill("tone", host, palette) as string;
            const v = themedBorderColor(
                [side(red, 11), side(red, 11), side(red, 11), side(red, 11)],
                "rgb(1, 2, 3)",
                palette,
            );
            expect(v).toBe([tone, tone, tone, tone].join(" "));
            // The ribbon matches the label's own (small) fill.
            expect(tone).toBe(themedFill(fillTier(host, 100), host, palette));
        }
    });

    it("keeps the theme border for dark arrow heads and currentColor shapes", () => {
        const dark = side("rgb(51, 51, 51)", 6);
        expect(themedBorderColor([dark, side(clear, 6), side(clear, 6), side(clear, 6)], "rgb(255, 255, 0)", HIGH_CONTRAST)).toBe(
            [T, "transparent", "transparent", "transparent"].join(" "),
        );
        const cur = side("rgb(255, 255, 0)", 8);
        expect(themedBorderColor([cur, cur, cur, cur], "rgb(255, 255, 0)", HIGH_CONTRAST)).toBeNull();
    });

    it("light shapes take the surface, mid grays the muted gray", () => {
        const white = side("rgb(255, 255, 255)", 10);
        expect(themedBorderColor([white, side(clear, 10), side(clear, 10), side(clear, 10)], "rgb(255, 255, 0)", HIGH_CONTRAST)?.startsWith(
            "var(--unilens-a11y-display-surface)",
        )).toBe(true);
        const gray = side("rgb(204, 204, 204)", 10);
        const muted = themedFill("muted", rgb("#cccccc"), HIGH_CONTRAST) as string;
        expect(themedBorderColor([gray, gray, gray, gray], "rgb(255, 255, 0)", HIGH_CONTRAST)).toBe(
            [muted, muted, muted, muted].join(" "),
        );
    });
});

describe("high contrast reach", () => {
    it("leaves fills alone outside high contrast", () => {
        expect(reachDecision(null, "tone", true)).toBe("default");
        expect(reachDecision(null, "muted", false)).toBe("default");
    });

    it("text: every colored or gray fill keeps the host color", () => {
        expect(reachDecision("text", "tone", true)).toBe("host");
        expect(reachDecision("text", "muted", false)).toBe("host");
        expect(reachDecision("text", "surface", true)).toBe("surface");
    });

    it("parts / all: a fill holding text takes the surface at any size, one without keeps its tone", () => {
        for (const reach of ["parts", "all"] as const) {
            expect(reachDecision(reach, "tone", true)).toBe("surface");
            expect(reachDecision(reach, "muted", true)).toBe("surface");
            expect(reachDecision(reach, "tone", false)).toBe("default");
            expect(reachDecision(reach, "muted", false)).toBe("default");
        }
    });

    it("a part is small on both sides and narrower than 60% of the viewport", () => {
        expect(isSmallPart(320, 60, 1280)).toBe(true);
        expect(isSmallPart(401, 60, 1280)).toBe(false);
        expect(isSmallPart(300, 401, 1280)).toBe(false);
        // A full-width phone header bar is a band, not a part.
        expect(isSmallPart(390, 45, 390)).toBe(false);
        expect(isSmallPart(120, 30, 390)).toBe(true);
    });

    it("drops only gradient-only backgrounds", () => {
        expect(
            isGradientOnly(
                "linear-gradient(rgb(255, 0, 0), rgb(0, 0, 255))",
            ),
        ).toBe(true);
        expect(
            isGradientOnly(
                'linear-gradient(rgba(0, 0, 0, 0), rgb(0, 0, 0)), url("p.jpg")',
            ),
        ).toBe(false);
        expect(isGradientOnly('url("p.jpg")')).toBe(false);
        expect(isGradientOnly("none")).toBe(false);
        expect(isGradientOnly("")).toBe(false);
    });
});
