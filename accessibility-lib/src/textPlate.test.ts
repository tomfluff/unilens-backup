import { describe, expect, it } from "vitest";
import {
    HC_TEXT_SCOPE_DEFAULT,
    HC_TEXT_SCOPES,
    normalizeHcTextScope,
    normalizeTextPlateStyle,
    TEXT_PLATE_DEFAULT_STYLE,
    TEXT_PLATE_PAIRS,
    TEXT_PLATE_STYLES,
    textPlateActive,
    textPlatePairCss,
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

describe("text plate pairs", () => {
    it("keeps five named background and type pairs", () => {
        expect([...TEXT_PLATE_STYLES]).toEqual([
            "blackYellow",
            "blackWhite",
            "navyYellow",
            "blackCyan",
            "greenWhite",
        ]);
        expect(TEXT_PLATE_DEFAULT_STYLE).toBe("blackYellow");
    });

    it("paints a dark plate under a much lighter glyph color", () => {
        for (const style of TEXT_PLATE_STYLES) {
            const { bg, fg } = textPlatePairCss(style);
            expect(contrastEnough(rgb(bg), rgb(fg))).toBe(true);
            expect(lum(rgb(bg))).toBeLessThan(lum(rgb(fg)));
        }
    });

    it("falls back to black-and-yellow for unknown values", () => {
        expect(normalizeTextPlateStyle("navyYellow")).toBe("navyYellow");
        expect(normalizeTextPlateStyle("nope")).toBe(TEXT_PLATE_DEFAULT_STYLE);
        expect(normalizeTextPlateStyle(undefined)).toBe(
            TEXT_PLATE_DEFAULT_STYLE,
        );
    });

    it("is on during high-contrast only", () => {
        expect(textPlateActive("high-contrast")).toBe(true);
        expect(textPlateActive("dark")).toBe(false);
        expect(textPlateActive("standard")).toBe(false);
    });

    it("exposes matching rgb() pairs for every style id", () => {
        for (const style of TEXT_PLATE_STYLES) {
            expect(TEXT_PLATE_PAIRS[style]).toEqual(textPlatePairCss(style));
        }
    });
});

describe("high contrast reach", () => {
    it("offers two steps, body text + parts / everything, parts by default", () => {
        expect([...HC_TEXT_SCOPES]).toEqual(["parts", "all"]);
        expect(HC_TEXT_SCOPE_DEFAULT).toBe("parts");
    });

    it("normalizes unknown stored values to the default", () => {
        expect(normalizeHcTextScope("all")).toBe("all");
        expect(normalizeHcTextScope("parts")).toBe("parts");
        // "text" (body text only) was removed: a stored value falls back.
        expect(normalizeHcTextScope("text")).toBe(HC_TEXT_SCOPE_DEFAULT);
        expect(normalizeHcTextScope("nope")).toBe(HC_TEXT_SCOPE_DEFAULT);
        expect(normalizeHcTextScope(undefined)).toBe(HC_TEXT_SCOPE_DEFAULT);
    });
});
