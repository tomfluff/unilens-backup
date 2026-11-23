import { describe, expect, it } from "vitest";
import {
    maxSafeScale,
    overlapsAnyNeighbor,
    resolvePageFontCap,
} from "./overlapSafeScale";

describe("overlapsAnyNeighbor", () => {
    const box = (left: number, top: number, right: number, bottom: number) => ({
        left,
        top,
        right,
        bottom,
    });

    it("is false with no neighbors", () => {
        expect(overlapsAnyNeighbor(box(0, 0, 10, 10), [])).toBe(false);
    });

    it("is true when any neighbor rect intersects", () => {
        const rect = box(0, 0, 100, 40);
        const neighbors = [box(200, 200, 240, 220), box(80, 10, 150, 30)];
        expect(overlapsAnyNeighbor(rect, neighbors)).toBe(true);
    });

    it("is false when no neighbor intersects", () => {
        const rect = box(0, 0, 100, 40);
        const neighbors = [box(200, 200, 240, 220), box(0, 50, 100, 80)];
        expect(overlapsAnyNeighbor(rect, neighbors)).toBe(false);
    });
});

describe("maxSafeScale", () => {
    it("returns the desired scale untouched when nothing overlaps", () => {
        const scale = maxSafeScale({
            desiredScale: 2.6,
            overlapsAt: () => false,
        });
        expect(scale).toBe(2.6);
    });

    it("never scales below 1x, even below the panel's floor", () => {
        expect(maxSafeScale({ desiredScale: 1, overlapsAt: () => false })).toBe(
            1,
        );
        expect(
            maxSafeScale({ desiredScale: 0.8, overlapsAt: () => true }),
        ).toBe(0.8);
    });

    it("falls back to minScale when even the floor already overlaps", () => {
        const scale = maxSafeScale({
            desiredScale: 2.6,
            overlapsAt: () => true,
        });
        expect(scale).toBe(1);
    });

    it("finds the largest safe scale just below where overlap starts (large, 195%)", () => {
        // Layout can absorb growth up to 1.7x before two boxes touch.
        const scale = maxSafeScale({
            desiredScale: 1.95,
            overlapsAt: (s) => s > 1.7,
        });
        expect(scale).toBeGreaterThan(1.68);
        expect(scale).toBeLessThanOrEqual(1.7);
    });

    it("lets a roomier layout scale further than a tighter one (large vs. extra-large no longer collapse to the same ceiling)", () => {
        // A roomy badge tolerates growth up to 2.2x; both "large" (1.95) and
        // "extra-large" (2.6) requests should come back distinct from each
        // other, and distinct from a tighter badge capped at 1.3x.
        const roomy = (desired: number) =>
            maxSafeScale({ desiredScale: desired, overlapsAt: (s) => s > 2.2 });
        const tight = (desired: number) =>
            maxSafeScale({ desiredScale: desired, overlapsAt: (s) => s > 1.3 });

        expect(roomy(1.95)).toBeCloseTo(1.95, 2); // room to spare — grows fully
        expect(roomy(2.6)).toBeGreaterThan(2.1);
        expect(roomy(2.6)).toBeLessThanOrEqual(2.2);

        expect(tight(1.95)).toBeGreaterThan(1.28);
        expect(tight(1.95)).toBeLessThanOrEqual(1.3);
        expect(tight(2.6)).toBeGreaterThan(1.28);
        expect(tight(2.6)).toBeLessThanOrEqual(1.3);

        // The two levels stop being visually identical once there's room.
        expect(roomy(1.95)).not.toBeCloseTo(roomy(2.6), 1);
    });

    it("settles within one `resolution` step of the true breakpoint", () => {
        const breakpoint = 1.837;
        const scale = maxSafeScale({
            desiredScale: 2.6,
            resolution: 0.01,
            overlapsAt: (s) => s > breakpoint,
        });
        expect(scale).toBeLessThanOrEqual(breakpoint);
        expect(breakpoint - scale).toBeLessThan(0.02);
    });

    it("respects a custom minScale floor", () => {
        const scale = maxSafeScale({
            desiredScale: 2.6,
            minScale: 1.1,
            overlapsAt: (s) => s > 1.5,
        });
        expect(scale).toBeGreaterThanOrEqual(1.1);
        expect(scale).toBeLessThanOrEqual(1.5);
    });
});

describe("resolvePageFontCap", () => {
    const box = (left: number, top: number, right: number, bottom: number) => ({
        left,
        top,
        right,
        bottom,
    });

    it("keeps the desired scale when nothing sits next to the box", () => {
        expect(resolvePageFontCap(2.6, [], () => box(0, 0, 40, 20))).toBe(2.6);
    });

    it("lets a roomy overlay grow to the panel's extra-large scale", () => {
        // Neighbor starts at x=120; a 40px-wide box at 2.6x is 104px — still clear.
        const neighbors = [box(120, 0, 180, 20)];
        const cap = resolvePageFontCap(2.6, neighbors, (s) =>
            box(0, 0, 40 * s, 20),
        );
        expect(cap).toBe(2.6);
    });

    it("stops just before the grown box hits a neighbor (not a flat 1.3x)", () => {
        // Neighbor starts at x=80; 40*s overlaps when s > 2.
        const neighbors = [box(80, 0, 140, 20)];
        const cap = resolvePageFontCap(2.6, neighbors, (s) =>
            box(0, 0, 40 * s, 20),
        );
        expect(cap).toBeGreaterThan(1.9);
        expect(cap).toBeLessThanOrEqual(2);
        expect(cap).toBeGreaterThan(1.3);
    });

    it("gives large and extra-large distinct caps when the layout has room", () => {
        const neighbors = [box(88, 0, 140, 20)];
        const measure = (s: number) => box(0, 0, 40 * s, 20);
        const large = resolvePageFontCap(1.95, neighbors, measure);
        const xlarge = resolvePageFontCap(2.6, neighbors, measure);
        expect(large).toBe(1.95);
        expect(xlarge).toBeGreaterThan(large);
        expect(xlarge).toBeLessThanOrEqual(2.2);
    });
});
