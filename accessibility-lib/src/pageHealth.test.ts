import { describe, expect, it } from "vitest";
import {
    dominantProblem,
    type HealthSample,
    healthFromAreas,
    isNarrowWrap,
    outsideWidth,
    overlapArea,
    searchHealthyScale,
    textRunStats,
} from "./pageHealth";

const sample = (
    health: number,
    parts: Partial<Omit<HealthSample, "health" | "total">> = {},
): HealthSample => ({
    health,
    total: 1000,
    overflow: 0,
    overlap: 0,
    narrow: 0,
    ...parts,
});

describe("healthFromAreas", () => {
    it("is 1 minus the problem share of text area", () => {
        expect(
            healthFromAreas({
                total: 200,
                overflow: 20,
                overlap: 10,
                narrow: 10,
            }).health,
        ).toBeCloseTo(0.8);
    });

    it("treats a page with no text as healthy", () => {
        expect(
            healthFromAreas({ total: 0, overflow: 0, overlap: 0, narrow: 0 })
                .health,
        ).toBe(1);
    });

    it("never goes below 0 when areas double-count", () => {
        expect(
            healthFromAreas({
                total: 10,
                overflow: 10,
                overlap: 10,
                narrow: 10,
            }).health,
        ).toBe(0);
    });
});

describe("overlapArea", () => {
    it("sums real text-on-text intersections", () => {
        const a = { left: 0, top: 0, right: 100, bottom: 20 };
        const b = { left: 50, top: 0, right: 150, bottom: 20 };
        expect(overlapArea([a, b])).toBe(50 * 20);
    });

    it("ignores adjacent lines that only touch through tight leading", () => {
        const line1 = { left: 0, top: 0, right: 300, bottom: 20 };
        const line2 = { left: 0, top: 18, right: 300, bottom: 38 };
        expect(overlapArea([line1, line2])).toBe(0);
    });

    it("ignores side-by-side runs on one line", () => {
        const a = { left: 0, top: 0, right: 100, bottom: 20 };
        const b = { left: 100, top: 0, right: 200, bottom: 20 };
        expect(overlapArea([a, b])).toBe(0);
    });

    it("does not count separate rows", () => {
        const rects = Array.from({ length: 50 }, (_, i) => ({
            left: 0,
            top: i * 24,
            right: 600,
            bottom: i * 24 + 20,
        }));
        expect(overlapArea(rects)).toBe(0);
    });
});

describe("outsideWidth", () => {
    it("measures only the part beyond the viewport", () => {
        expect(outsideWidth(900, 1100, 1000)).toBe(100);
        expect(outsideWidth(-50, 100, 1000)).toBe(50);
        expect(outsideWidth(10, 500, 1000)).toBe(0);
        expect(outsideWidth(1200, 1300, 1000)).toBe(100);
    });
});

describe("isNarrowWrap", () => {
    it("flags English with too few words per line", () => {
        const stats = textRunStats("one two three four five six", 4);
        expect(stats.cjk).toBe(false);
        expect(isNarrowWrap(stats)).toBe(true);
    });

    it("allows comfortable English lines", () => {
        expect(
            isNarrowWrap(
                textRunStats(
                    "the quick brown fox jumps over the lazy dog again and again",
                    3,
                ),
            ),
        ).toBe(false);
    });

    it("judges Japanese by characters per line", () => {
        const text = "ウェブを少しだけ見やすくするための研究";
        expect(textRunStats(text, 4).cjk).toBe(true);
        expect(isNarrowWrap(textRunStats(text, 4))).toBe(true);
        expect(isNarrowWrap(textRunStats(text, 3))).toBe(false);
    });

    it("never flags short runs", () => {
        expect(isNarrowWrap(textRunStats("a b", 2))).toBe(false);
    });
});

describe("dominantProblem", () => {
    it("picks the problem that grew most from the baseline", () => {
        const base = sample(0.9, { overlap: 100 });
        const failed = sample(0.7, { overlap: 120, overflow: 180 });
        expect(dominantProblem(base, failed)).toBe("overflow");
    });
});

describe("searchHealthyScale", () => {
    /** Healthy up to `limit`, then breaks by overflow. */
    const cliff = (limit: number, calls: number[]) => (scale: number) => {
        calls.push(scale);
        return scale <= limit + 1e-9
            ? sample(1)
            : sample(0.6, { overflow: 400 });
    };

    it("finds the largest healthy scale to 0.05", () => {
        const calls: number[] = [];
        const r = searchHealthyScale({
            maxScale: 1.8,
            healthAt: cliff(1.45, calls),
        });
        expect(r.scale).toBe(1.45);
        expect(r.stopReason).toBe("overflow");
        expect(r.trials).toBe(calls.length);
        // 1, 1.2, 1.4, 1.6, then 1.5, 1.45: fewer than a flat 0.1 walk.
        expect(calls.length).toBeLessThanOrEqual(7);
    });

    it("reports reaching the maximum", () => {
        const r = searchHealthyScale({
            maxScale: 1.8,
            healthAt: cliff(5, []),
        });
        expect(r.scale).toBe(1.8);
        expect(r.stopReason).toBe("max");
    });

    it("stays at 1 when the first step already breaks", () => {
        const r = searchHealthyScale({
            maxScale: 1.8,
            healthAt: cliff(1.02, []),
        });
        expect(r.scale).toBe(1);
        expect(r.stopReason).toBe("overflow");
    });

    it("tolerates a small drop from the baseline", () => {
        const r = searchHealthyScale({
            maxScale: 1.4,
            healthAt: (s) => sample(s > 1 ? 0.86 : 0.9),
        });
        expect(r.scale).toBe(1.4);
    });

    it("judges against the page's own starting health", () => {
        // Already broken at 1x (0.5) but not getting worse: magnify freely.
        const r = searchHealthyScale({
            maxScale: 1.6,
            healthAt: () => sample(0.5, { overlap: 500 }),
        });
        expect(r.scale).toBe(1.6);
    });

    it("does not trust a layout that heals at a larger scale", () => {
        const r = searchHealthyScale({
            maxScale: 1.8,
            healthAt: (s) =>
                s > 1.3 && s < 1.5 ? sample(0.5, { narrow: 500 }) : sample(1),
        });
        expect(r.scale).toBeLessThan(1.4);
        expect(r.stopReason).toBe("narrow");
    });

    it("returns 1 with no text to measure", () => {
        const r = searchHealthyScale({
            maxScale: 1.8,
            healthAt: () =>
                healthFromAreas({
                    total: 0,
                    overflow: 0,
                    overlap: 0,
                    narrow: 0,
                }),
        });
        expect(r).toMatchObject({ scale: 1, stopReason: "empty", trials: 1 });
    });
});
