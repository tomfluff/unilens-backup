import { describe, expect, it } from "vitest";
import {
    normalizeTextStrokeStyle,
    TEXT_STROKE_DEFAULT_STYLE,
    TEXT_STROKE_PAIRS,
    TEXT_STROKE_STYLES,
    TEXT_STROKE_WIDTH,
    textStrokePairCss,
} from "./accessibilityStoreTypes";

type Rgb = [number, number, number];

function rgb(css: string): Rgb {
    const parts = css.match(/\d+/g)?.map(Number);
    if (!parts || parts.length < 3) {
        throw new Error(`not an rgb() color: ${css}`);
    }
    return [parts[0], parts[1], parts[2]];
}

function lum([r, g, b]: Rgb): number {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastEnough(a: Rgb, b: Rgb): boolean {
    return Math.abs(lum(a) - lum(b)) > 80;
}

/** CSS `hue-rotate` matrix (SVG filter spec), channels 0–255. */
function hueRotate([r, g, b]: Rgb, deg: number): Rgb {
    const angle = (deg * Math.PI) / 180;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const R = r / 255;
    const G = g / 255;
    const B = b / 255;
    const clamp = (x: number) =>
        Math.max(0, Math.min(255, Math.round(x * 255)));
    return [
        clamp(
            (0.213 + 0.787 * c) * R +
                (0.715 - 0.715 * c - 0.715 * s) * G +
                (0.072 - 0.072 * c + 0.928 * s) * B,
        ),
        clamp(
            (0.213 - 0.213 * c + 0.143 * s) * R +
                (0.715 + 0.285 * c + 0.14 * s) * G +
                (0.072 - 0.072 * c - 0.283 * s) * B,
        ),
        clamp(
            (0.213 - 0.213 * c - 0.787 * s) * R +
                (0.715 - 0.715 * c + 0.715 * s) * G +
                (0.072 + 0.928 * c) * B,
        ),
    ];
}

/** Color-mode invert: `filter: invert(1) hue-rotate(180deg)`. */
function invertThenHueRotate(color: Rgb): Rgb {
    return hueRotate([255 - color[0], 255 - color[1], 255 - color[2]], 180);
}

/** Color-mode mono: CSS `saturate(0)` Rec.709 luma. */
function saturate0([r, g, b]: Rgb): Rgb {
    const y = Math.round(0.213 * r + 0.715 * g + 0.072 * b);
    return [y, y, y];
}

describe("text stroke pairs", () => {
    it("offers nine fill/outline pairs with a white-on-black default", () => {
        expect(TEXT_STROKE_STYLES).toEqual([
            "whiteBlack",
            "blackWhite",
            "yellowBlue",
            "blueYellow",
            "whiteMagenta",
            "navyYellow",
            "blackCyan",
            "greenWhite",
            "orangeWhite",
        ]);
        expect(TEXT_STROKE_DEFAULT_STYLE).toBe("whiteBlack");
        expect(TEXT_STROKE_WIDTH).toBe("0.1em");
    });

    it("keeps fill and outline different and readable against each other", () => {
        for (const style of TEXT_STROKE_STYLES) {
            const { fill, edge } = textStrokePairCss(style);
            expect(fill).toBe(TEXT_STROKE_PAIRS[style].fill);
            expect(fill).not.toBe(edge);
            expect(contrastEnough(rgb(fill), rgb(edge))).toBe(true);
        }
    });

    it("keeps fill and outline distinct after invert and after mono", () => {
        for (const style of TEXT_STROKE_STYLES) {
            const { fill, edge } = textStrokePairCss(style);
            const fillRgb = rgb(fill);
            const edgeRgb = rgb(edge);
            expect(
                contrastEnough(
                    invertThenHueRotate(fillRgb),
                    invertThenHueRotate(edgeRgb),
                ),
            ).toBe(true);
            expect(contrastEnough(saturate0(fillRgb), saturate0(edgeRgb))).toBe(
                true,
            );
        }
    });

    it("keeps a glyph readable on light, dark, and high-contrast backgrounds", () => {
        const light: Rgb = [245, 245, 245];
        const dark: Rgb = [26, 26, 46];
        const highContrast: Rgb = [0, 0, 0];
        for (const style of TEXT_STROKE_STYLES) {
            const fill = rgb(TEXT_STROKE_PAIRS[style].fill);
            const edge = rgb(TEXT_STROKE_PAIRS[style].edge);
            for (const bg of [light, dark, highContrast]) {
                expect(
                    contrastEnough(fill, bg) || contrastEnough(edge, bg),
                ).toBe(true);
            }
        }
    });

    it("uses opponent hues for chromatic pairs so the edge is not a same-family shadow", () => {
        const hue = ([r, g, b]: Rgb) => {
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            if (max === min) return null;
            const d = max - min;
            let h = 0;
            if (max === r) h = (g - b) / d;
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            return (h * 60 + 360) % 360;
        };
        const hueDelta = (a: number, b: number) => {
            const d = Math.abs(a - b);
            return Math.min(d, 360 - d);
        };
        for (const style of [
            "yellowBlue",
            "blueYellow",
            "navyYellow",
        ] as const) {
            const fillH = hue(rgb(TEXT_STROKE_PAIRS[style].fill));
            const edgeH = hue(rgb(TEXT_STROKE_PAIRS[style].edge));
            expect(fillH).not.toBeNull();
            expect(edgeH).not.toBeNull();
            expect(hueDelta(fillH as number, edgeH as number)).toBeGreaterThan(
                90,
            );
        }
        const magenta = rgb(TEXT_STROKE_PAIRS.whiteMagenta.edge);
        expect(Math.max(...magenta) - Math.min(...magenta)).toBeGreaterThan(80);
    });

    it("maps unknown and retired stored values onto the current pairs", () => {
        expect(normalizeTextStrokeStyle("yellowBlue")).toBe("yellowBlue");
        expect(normalizeTextStrokeStyle("yellowBlack")).toBe("yellowBlue");
        expect(normalizeTextStrokeStyle("blackYellow")).toBe("blueYellow");
        expect(normalizeTextStrokeStyle("cyanNavy")).toBe("whiteMagenta");
        expect(normalizeTextStrokeStyle("rainbow")).toBe("whiteBlack");
        expect(normalizeTextStrokeStyle(undefined)).toBe("whiteBlack");
    });
});
