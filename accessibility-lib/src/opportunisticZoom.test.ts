import { describe, expect, it } from "vitest";
import {
    cachedScale,
    countLines,
    countWords,
    dominantProblem,
    healthFromAreas,
    isNarrowWrap,
    type LineBox,
    type OppZoomCache,
    overlapArea,
    type PageHealth,
    pruneCache,
    searchOppZoom,
} from "./opportunisticZoom";

const health = (
    h: number,
    parts: Partial<Omit<PageHealth, "health">> = {},
): PageHealth => ({
    health: h,
    pageArea: 1000,
    overflow: 0,
    overlap: 0,
    narrow: 0,
    ...parts,
});

describe("countWords", () => {
    it("counts space-separated words with a letter or digit", () => {
        expect(countWords("Making the web easier to see")).toBe(6);
        expect(countWords("  2014 — UIST ")).toBe(2);
    });

    it("counts two CJK characters as one word", () => {
        expect(countWords("機会主義的なアクセシビリティ")).toBe(7);
        expect(countWords("ウェブを見やすく UIST 2014")).toBe(4 + 2);
    });
});

describe("isNarrowWrap (paper: < 5 words per line, >= 10 words)", () => {
    it("flags text wrapped to fewer than 5 words a line", () => {
        expect(isNarrowWrap(12, 3)).toBe(true);
        expect(isNarrowWrap(20, 4)).toBe(false);
    });

    it("ignores elements with fewer than 10 words", () => {
        expect(isNarrowWrap(9, 9)).toBe(false);
    });

    it("needs at least one line", () => {
        expect(isNarrowWrap(30, 0)).toBe(false);
    });
});

describe("countLines", () => {
    it("puts boxes that share a row on one line", () => {
        expect(
            countLines([
                { left: 0, top: 0, right: 50, bottom: 20 },
                { left: 50, top: 2, right: 90, bottom: 18 },
                { left: 0, top: 22, right: 80, bottom: 42 },
                { left: 0, top: 44, right: 20, bottom: 64 },
            ]),
        ).toBe(3);
    });

    it("is 0 with no boxes", () => {
        expect(countLines([])).toBe(0);
    });
});

describe("overlapArea", () => {
    const box = (
        group: number,
        left: number,
        top: number,
        right: number,
        bottom: number,
    ): LineBox => ({ group, left, top, right, bottom });

    it("sums where lines of different text nodes overlap", () => {
        expect(overlapArea([box(1, 0, 0, 100, 20), box(2, 50, 0, 150, 20)])).toBe(
            50 * 20,
        );
    });

    it("ignores lines of the same text node", () => {
        expect(overlapArea([box(1, 0, 0, 100, 20), box(1, 0, 10, 100, 30)])).toBe(
            0,
        );
    });

    it("ignores lines that only touch (tight line-height)", () => {
        expect(overlapArea([box(1, 0, 0, 100, 20), box(2, 0, 18, 100, 38)])).toBe(
            0,
        );
    });

    it("ignores boxes side by side", () => {
        expect(overlapArea([box(1, 0, 0, 100, 20), box(2, 100, 0, 200, 20)])).toBe(
            0,
        );
    });
});

describe("healthFromAreas", () => {
    it("is 1 minus the problem share of the page", () => {
        const h = healthFromAreas({
            pageArea: 1000,
            overflow: 50,
            overlap: 20,
            narrow: 30,
        });
        expect(h.health).toBeCloseTo(0.9);
    });

    it("is floored at 0 and is 1 for an empty page", () => {
        expect(
            healthFromAreas({
                pageArea: 100,
                overflow: 80,
                overlap: 80,
                narrow: 0,
            }).health,
        ).toBe(0);
        expect(
            healthFromAreas({ pageArea: 0, overflow: 0, overlap: 0, narrow: 0 })
                .health,
        ).toBe(1);
    });
});

describe("dominantProblem", () => {
    it("names the problem that grew the most from 1x", () => {
        expect(
            dominantProblem(
                health(0.95, { narrow: 50 }),
                health(0.85, { narrow: 60, overflow: 90 }),
            ),
        ).toBe("overflow");
        expect(
            dominantProblem(
                health(0.98, { overflow: 20 }),
                health(0.9, { overflow: 20, overlap: 80 }),
            ),
        ).toBe("overlap");
    });
});

describe("searchOppZoom (paper: 0.1 steps, stop past -0.05, max 3x)", () => {
    it("keeps the last step within 0.05 of the 1x health", () => {
        const tried: number[] = [];
        const result = searchOppZoom({
            healthAt: (scale) => {
                tried.push(scale);
                // Healthy up to 1.6x; at 1.7x the page scrolls sideways.
                return scale <= 1.6
                    ? health(0.97)
                    : health(0.9, { overflow: 70 });
            },
        });
        expect(result.scale).toBe(1.6);
        expect(result.stopReason).toBe("overflow");
        expect(result.failed?.scale).toBe(1.7);
        expect(tried).toEqual([1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7]);
        expect(result.trials).toBe(8);
    });

    it("measures against the page as it was, even if broken at 1x", () => {
        const result = searchOppZoom({
            // Already 0.7 at 1x; 0.66 is within tolerance, 0.64 is not.
            healthAt: (scale) =>
                health(scale <= 1.2 ? 0.7 : scale <= 1.4 ? 0.66 : 0.64, {
                    narrow: 300,
                }),
        });
        expect(result.scale).toBe(1.4);
        expect(result.baseline?.health).toBe(0.7);
    });

    it("tolerates a drop of exactly 0.05", () => {
        const result = searchOppZoom({
            healthAt: (scale) => health(scale === 1 ? 0.95 : 0.9),
        });
        expect(result.scale).toBe(3);
        expect(result.stopReason).toBe("max");
    });

    it("stops at 3x when nothing breaks", () => {
        const result = searchOppZoom({ healthAt: () => health(1) });
        expect(result.scale).toBe(3);
        expect(result.stopReason).toBe("max");
        expect(result.failed).toBeNull();
        expect(result.trials).toBe(21);
    });

    it("stays at 1x when the first step already breaks", () => {
        const result = searchOppZoom({
            healthAt: (scale) =>
                scale === 1 ? health(1) : health(0.5, { overflow: 500 }),
        });
        expect(result.scale).toBe(1);
        expect(result.failed?.scale).toBe(1.1);
    });

    it("does nothing on a page with no area", () => {
        const result = searchOppZoom({
            healthAt: () => ({ ...health(1), pageArea: 0 }),
        });
        expect(result.scale).toBe(1);
        expect(result.stopReason).toBe("empty");
        expect(result.trials).toBe(1);
    });
});

describe("remembered scale", () => {
    const cache: OppZoomCache = {
        "https://a.example/news": { s: 1.6, w: 1280, k: "k1", t: 1 },
    };

    it("is reused only at the same width and text settings", () => {
        expect(cachedScale(cache, "https://a.example/news", 1280, "k1")).toBe(
            1.6,
        );
        expect(
            cachedScale(cache, "https://a.example/news", 1024, "k1"),
        ).toBeNull();
        expect(
            cachedScale(cache, "https://a.example/news", 1280, "k2"),
        ).toBeNull();
        expect(cachedScale(cache, "https://a.example/", 1280, "k1")).toBeNull();
    });

    it("rejects a stored value outside 1–3", () => {
        const bad = {
            p: { s: 9, w: 10, k: "k", t: 0 },
        } as OppZoomCache;
        expect(cachedScale(bad, "p", 10, "k")).toBeNull();
    });

    it("keeps only the most recent pages", () => {
        const many: OppZoomCache = {};
        for (let i = 0; i < 5; i++)
            many[`p${i}`] = { s: 1.1, w: 1, k: "", t: i };
        expect(Object.keys(pruneCache(many, 2)).sort()).toEqual(["p3", "p4"]);
    });
});
