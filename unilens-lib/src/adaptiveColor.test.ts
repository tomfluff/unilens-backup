import { describe, expect, it } from "vitest";
import {
    type Backgrounds,
    type Choice,
    chooseColor,
    contrast,
    fromOklch,
    gradientStops,
    hexToRgba,
    invertGlowFor,
    parseColor,
    rgbaToHex,
    TARGET_CONTRAST,
    toOklch,
} from "./adaptiveColor";

const c = (hex: string) => {
    const rgba = hexToRgba(hex);
    if (!rgba) throw new Error(`not a colour: ${hex}`);
    return rgba;
};
const bgs = (edge: string[], inside = edge, text?: string): Backgrounds => ({
    edge: edge.map(c),
    inside: inside.map(c),
    text: text ? c(text) : null,
});
const near: Choice = {
    base: "#ffef26",
    mode: "near",
    range: "some",
    fillAlpha: 0,
    glowAlpha: 0,
};

describe("colour maths", () => {
    it("measures WCAG contrast", () => {
        expect(contrast(c("#000"), c("#fff"))).toBeCloseTo(21, 5);
        expect(contrast(c("#fff"), c("#fff"))).toBeCloseTo(1, 5);
    });
    it("goes to OKLCH and back", () => {
        for (const hex of ["#ffef26", "#1f5bff", "#808080", "#d4001a"]) {
            const { l, c: C, h } = toOklch(c(hex));
            expect(rgbaToHex(fromOklch(l, C, h))).toBe(hex);
        }
    });
    it("reads computed colours and a gradient's stops", () => {
        expect(parseColor("rgba(10, 20, 30, 0.5)")).toEqual({
            r: 10,
            g: 20,
            b: 30,
            a: 0.5,
        });
        expect(parseColor("rgb(1 2 3 / 40%)")).toEqual({
            r: 1,
            g: 2,
            b: 3,
            a: 0.4,
        });
        expect(
            gradientStops(
                "linear-gradient(90deg, rgb(255, 0, 0) 0%, rgba(0, 0, 255, 0.5) 100%)",
            ),
        ).toHaveLength(2);
    });
});

describe("near my colour", () => {
    it("keeps the colour where it already shows", () => {
        expect(chooseColor(bgs(["#1f2a44"]), near)).toBe("#ffef26");
    });
    it("moves only lightness, as far as 3:1 needs, on white", () => {
        const got = chooseColor(bgs(["#ffffff"]), { ...near, range: "any" });
        expect(contrast(c(got), c("#fff"))).toBeGreaterThanOrEqual(
            TARGET_CONTRAST,
        );
        // the smallest move: just past the target, not far beyond it
        expect(contrast(c(got), c("#fff"))).toBeLessThan(3.4);
        // still the yellow's hue: only the lightness moved (and the chroma, as far
        // as the darker yellow fits the screen)
        const h0 = toOklch(c("#ffef26")).h;
        expect(Math.abs(toOklch(c(got)).h - h0)).toBeLessThan(0.02);
    });
    it("stops at its limit", () => {
        const little = chooseColor(bgs(["#ffffff"]), {
            ...near,
            range: "little",
        });
        const L0 = toOklch(c("#ffef26")).l;
        expect(L0 - toOklch(c(little)).l).toBeLessThanOrEqual(0.151);
    });
    it("judges a highlight over two backgrounds by the worse", () => {
        const got = chooseColor(bgs(["#ffffff", "#000000"]), {
            ...near,
            range: "any",
        });
        const worst = Math.min(
            contrast(c(got), c("#fff")),
            contrast(c(got), c("#000")),
        );
        // a mid tone reaches 3:1 over both
        expect(worst).toBeGreaterThanOrEqual(TARGET_CONTRAST);
    });
    it("keeps the nothing-sampled case at the base colour", () => {
        expect(chooseColor(bgs([], []), near)).toBe("#ffef26");
    });
});

describe("best contrast", () => {
    const k: Choice = { ...near, mode: "contrast" };
    it("takes yellow on dark and a deep colour on white", () => {
        expect(chooseColor(bgs(["#1f2a44"]), k)).toBe("#ffef26");
        const onWhite = chooseColor(bgs(["#ffffff"]), k);
        expect(contrast(c(onWhite), c("#fff"))).toBeGreaterThan(5);
    });
    it("takes the dark blue on white, clearly the strongest there", () => {
        // the spec of 2026-10-12: dark blue on white, yellow on navy
        const onWhite = chooseColor(bgs(["#ffffff"]), k);
        expect(onWhite).toBe("#1a3fd6");
        expect(contrast(c(onWhite), c("#fff"))).toBeGreaterThan(7);
    });
    it("leaves out a colour whose fill would hide the text", () => {
        // white text on grey (4.5:1): a yellow fill at 0.3 would wash it out
        const got = chooseColor(bgs(["#767676"], ["#767676"], "#ffffff"), {
            ...k,
            fillAlpha: 0.3,
        });
        expect(got).not.toBe("#ffef26");
        expect(chooseColor(bgs(["#767676"], ["#767676"]), k)).toBe("#ffef26");
    });
});

describe("inverted glow", () => {
    it("stays whole by black text on white", () => {
        expect(
            invertGlowFor(bgs(["#ffffff"], ["#ffffff"], "#000000"), 0.25),
        ).toBe(0.25);
    });
    it("gives way by grey text, which a partial inversion would wash out", () => {
        const a = invertGlowFor(bgs(["#ffffff"], ["#ffffff"], "#767676"), 0.25);
        expect(a).toBeLessThan(0.25);
    });
    it("stays whole with no text to protect", () => {
        expect(invertGlowFor(bgs(["#767676"]), 0.25)).toBe(0.25);
    });
});

describe("background images", () => {
    it("splits layers only at top-level commas", async () => {
        const { splitLayers } = await import("./adaptiveColor");
        expect(
            splitLayers(
                'linear-gradient(135deg, rgb(0, 0, 0), rgb(10, 10, 10)), url("a,b.png")',
            ),
        ).toEqual([
            "linear-gradient(135deg, rgb(0, 0, 0), rgb(10, 10, 10))",
            'url("a,b.png")',
        ]);
    });
});
