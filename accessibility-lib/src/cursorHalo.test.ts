import { describe, expect, it } from "vitest";
import {
    lastOnPointerHaloPx,
    normalizePointerHaloColor,
    normalizePointerHaloOpacity,
    normalizePointerHaloPx,
    POINTER_HALO_ALPHA,
    POINTER_HALO_COLORS,
    POINTER_HALO_DEFAULT_COLOR,
    POINTER_HALO_DEFAULT_OPACITY,
    POINTER_HALO_DEFAULT_PX,
    POINTER_HALO_ON_PX,
    POINTER_HALO_OPACITIES,
    POINTER_HALO_PX,
    POINTER_HALO_RGB,
    pointerHaloCssDiameter,
    pointerHaloFillCss,
    pointerHaloOn,
    pointerHaloTransform,
    rememberPointerHaloOnPx,
} from "./cursorHalo";

describe("pointer halo sizes", () => {
    it("offers off plus 5 / 20 / 40 px and 5% / 10% / 15% of the viewport", () => {
        expect(POINTER_HALO_PX).toEqual([0, 5, 20, 40, "5%", "10%", "15%"]);
        expect(POINTER_HALO_ON_PX).toEqual([5, 20, 40, "5%", "10%", "15%"]);
        expect(POINTER_HALO_DEFAULT_PX).toBe(20);
    });

    it("keeps only those diameters after hydration garbage", () => {
        expect(normalizePointerHaloPx(20)).toBe(20);
        expect(normalizePointerHaloPx("40")).toBe(40);
        expect(normalizePointerHaloPx("5%")).toBe("5%");
        expect(normalizePointerHaloPx("15%")).toBe("15%");
        expect(normalizePointerHaloPx("5")).toBe(5);
        expect(normalizePointerHaloPx(12)).toBe(0);
        expect(normalizePointerHaloPx(undefined)).toBe(0);
        expect(normalizePointerHaloPx("8%")).toBe(0);
    });

    it("maps viewport percents to vmin so the circle tracks the shorter screen side", () => {
        expect(pointerHaloCssDiameter(0)).toBe("0px");
        expect(pointerHaloCssDiameter(20)).toBe("20px");
        expect(pointerHaloCssDiameter("5%")).toBe("5vmin");
        expect(pointerHaloCssDiameter("10%")).toBe("10vmin");
        expect(pointerHaloCssDiameter("15%")).toBe("15vmin");
    });

    it("treats viewport percents as on", () => {
        expect(pointerHaloOn(0)).toBe(false);
        expect(pointerHaloOn(5)).toBe(true);
        expect(pointerHaloOn("10%")).toBe(true);
    });

    it("centers the circle on the pointer without scaling the cursor", () => {
        expect(pointerHaloTransform(100, 50)).toBe(
            "translate3d(100px, 50px, 0) translate(-50%, -50%)",
        );
    });

    it("remembers the last on size so the toggle can restore it", () => {
        rememberPointerHaloOnPx(40);
        expect(lastOnPointerHaloPx()).toBe(40);
        rememberPointerHaloOnPx(0);
        expect(lastOnPointerHaloPx()).toBe(40);
        rememberPointerHaloOnPx(5);
        expect(lastOnPointerHaloPx()).toBe(5);
        rememberPointerHaloOnPx("15%");
        expect(lastOnPointerHaloPx()).toBe("15%");
        rememberPointerHaloOnPx(POINTER_HALO_DEFAULT_PX);
        expect(lastOnPointerHaloPx()).toBe(POINTER_HALO_DEFAULT_PX);
    });
});

describe("pointer halo color and transparency", () => {
    it("offers five fluorescent colors", () => {
        expect(POINTER_HALO_COLORS).toEqual([
            "yellow",
            "green",
            "pink",
            "orange",
            "cyan",
        ]);
        expect(POINTER_HALO_DEFAULT_COLOR).toBe("yellow");
        for (const color of POINTER_HALO_COLORS) {
            const rgb = POINTER_HALO_RGB[color];
            expect(rgb).toHaveLength(3);
            expect(Math.max(...rgb)).toBe(255);
            expect(Math.min(...rgb)).toBe(0);
        }
    });

    it("offers three see-through fills, strongest still under half opaque", () => {
        expect(POINTER_HALO_OPACITIES).toEqual(["thin", "medium", "strong"]);
        expect(POINTER_HALO_DEFAULT_OPACITY).toBe("medium");
        expect(POINTER_HALO_ALPHA.thin).toBeLessThan(POINTER_HALO_ALPHA.medium);
        expect(POINTER_HALO_ALPHA.medium).toBeLessThan(
            POINTER_HALO_ALPHA.strong,
        );
        expect(POINTER_HALO_ALPHA.strong).toBeLessThanOrEqual(0.5);
    });

    it("falls back to yellow / medium on hydration garbage", () => {
        expect(normalizePointerHaloColor("pink")).toBe("pink");
        expect(normalizePointerHaloColor("red")).toBe("yellow");
        expect(normalizePointerHaloColor(undefined)).toBe("yellow");
        expect(normalizePointerHaloOpacity("strong")).toBe("strong");
        expect(normalizePointerHaloOpacity("opaque")).toBe("medium");
    });

    it("paints an rgba fill from color and transparency", () => {
        expect(pointerHaloFillCss("yellow", "medium")).toBe(
            "rgba(255, 255, 0, 0.35)",
        );
        expect(pointerHaloFillCss("cyan", "thin")).toBe(
            `rgba(0, 255, 255, ${POINTER_HALO_ALPHA.thin})`,
        );
    });
});
