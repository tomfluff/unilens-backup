import { describe, expect, it } from "vitest";
import {
    normalizeReadingGuidePosition,
    normalizeReadingGuideStyle,
    READING_GUIDE_BELOW_GAP_PX,
    READING_GUIDE_DEFAULT_POSITION,
    READING_GUIDE_DEFAULT_STYLE,
    READING_GUIDE_EDGE_PX,
    READING_GUIDE_GAP_PX,
    READING_GUIDE_HEIGHT_PX,
    READING_GUIDE_PAIRS,
    READING_GUIDE_POSITIONS,
    READING_GUIDE_STYLES,
    READING_GUIDE_TIP_EDGE_HALF_WIDTH_PX,
    READING_GUIDE_TIP_EDGE_HEIGHT_PX,
    READING_GUIDE_TIP_HALF_WIDTH_PX,
    READING_GUIDE_TIP_HEIGHT_PX,
    READING_GUIDE_WIDTH_PX,
    readingGuideBoxShadow,
    readingGuidePairCss,
    readingGuideTipDirection,
    readingGuideTransform,
} from "./readingGuide";

function rgb(css: string): [number, number, number] {
    const parts = css.match(/\d+/g)?.map(Number);
    if (!parts || parts.length < 3) {
        throw new Error(`not an rgb() color: ${css}`);
    }
    return [parts[0], parts[1], parts[2]];
}

function isNearYellow([r, g, b]: [number, number, number]): boolean {
    return r > 200 && g > 200 && b < 80;
}

function isNearBlack([r, g, b]: [number, number, number]): boolean {
    return r < 40 && g < 40 && b < 40;
}

describe("reading guide", () => {
    it("places the bar above, on, or below the pointer", () => {
        expect(READING_GUIDE_WIDTH_PX).toBe(600);
        expect(READING_GUIDE_HEIGHT_PX).toBe(10);
        expect(READING_GUIDE_GAP_PX).toBe(10);
        expect(READING_GUIDE_BELOW_GAP_PX).toBe(30);
        expect(readingGuideTransform(400, 200, "above")).toBe(
            "translate3d(400px, 190px, 0) translate(-50%, -100%)",
        );
        expect(readingGuideTransform(400, 200, "center")).toBe(
            "translate3d(400px, 200px, 0) translate(-50%, -50%)",
        );
        expect(readingGuideTransform(400, 200, "below")).toBe(
            "translate3d(400px, 230px, 0) translate(-50%, 0)",
        );
        expect(readingGuideTransform(400, 200)).toBe(
            readingGuideTransform(400, 200, "above"),
        );
    });

    it("offers five fill/outline pairs", () => {
        expect(READING_GUIDE_STYLES).toEqual([
            "whiteBlue",
            "blackYellow",
            "cyanGreen",
            "magentaNavy",
            "orangeWhite",
        ]);
        expect(READING_GUIDE_DEFAULT_STYLE).toBe("blackYellow");
        expect(READING_GUIDE_EDGE_PX).toBe(2);
        expect(READING_GUIDE_POSITIONS).toEqual(["above", "center", "below"]);
        expect(READING_GUIDE_DEFAULT_POSITION).toBe("above");
        expect(normalizeReadingGuidePosition("center")).toBe("center");
        expect(normalizeReadingGuidePosition("side")).toBe("above");
    });

    it("keeps fill and outline different; only the black bar uses a yellow frame", () => {
        for (const style of READING_GUIDE_STYLES) {
            const { fill, edge } = readingGuidePairCss(style);
            expect(fill).toBe(READING_GUIDE_PAIRS[style].fill);
            expect(fill).not.toBe(edge);
            const fillRgb = rgb(fill);
            const edgeRgb = rgb(edge);
            expect(isNearYellow(fillRgb)).toBe(false);
            if (style === "blackYellow") {
                expect(isNearBlack(fillRgb)).toBe(true);
                expect(isNearYellow(edgeRgb)).toBe(true);
                continue;
            }
            expect(isNearYellow(edgeRgb)).toBe(false);
        }
    });

    it("uses every candidate color across the five pairs", () => {
        const used = new Set<string>();
        for (const style of READING_GUIDE_STYLES) {
            const { fill, edge } = readingGuidePairCss(style);
            used.add(fill);
            used.add(edge);
        }
        expect(used).toEqual(
            new Set([
                "rgb(255, 255, 255)",
                "rgb(0, 85, 255)",
                "rgb(17, 17, 17)",
                "rgb(255, 255, 0)",
                "rgb(0, 255, 255)",
                "rgb(0, 255, 40)",
                "rgb(255, 0, 196)",
                "rgb(0, 32, 128)",
                "rgb(255, 48, 0)",
            ]),
        );
    });

    it("paints a 2px outline from the pair's edge color", () => {
        expect(readingGuideBoxShadow("rgb(0, 85, 255)")).toBe(
            "0 0 0 2px rgb(0, 85, 255)",
        );
    });

    it("falls back to the default style (black/yellow) on hydration garbage", () => {
        expect(normalizeReadingGuideStyle("cyanGreen")).toBe("cyanGreen");
        expect(normalizeReadingGuideStyle("cyanNavy")).toBe("cyanGreen");
        expect(normalizeReadingGuideStyle("orangeBlue")).toBe("orangeWhite");
        expect(normalizeReadingGuideStyle("blackWhite")).toBe("blackYellow");
        expect(normalizeReadingGuideStyle("yellow")).toBe("blackYellow");
        expect(normalizeReadingGuideStyle(undefined)).toBe("blackYellow");
    });

    it("always points the center tip up", () => {
        expect(READING_GUIDE_TIP_HALF_WIDTH_PX).toBe(12);
        expect(READING_GUIDE_TIP_HEIGHT_PX).toBe(13);
        expect(READING_GUIDE_TIP_EDGE_HALF_WIDTH_PX).toBe(14);
        expect(READING_GUIDE_TIP_EDGE_HEIGHT_PX).toBe(15);
        expect(readingGuideTipDirection("above")).toBe("up");
        expect(readingGuideTipDirection("center")).toBe("up");
        expect(readingGuideTipDirection("below")).toBe("up");
        expect(readingGuideTipDirection()).toBe(
            readingGuideTipDirection(READING_GUIDE_DEFAULT_POSITION),
        );
    });
});
