import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearPlaces,
    goToPlace,
    latestPlace,
    placeOf,
    recordPlace,
} from "./places";

beforeEach(() => {
    clearPlaces();
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

describe("places", () => {
    it("keeps the latest place and finds one by capture id", () => {
        recordPlace({ captureId: "a", at: 1, x: 10, y: 20, label: "first" });
        recordPlace({ captureId: "b", at: 2, x: 30, y: 40, label: "second" });
        expect(latestPlace()?.label).toBe("second");
        expect(placeOf("a")?.label).toBe("first");
        expect(placeOf(undefined)).toBeUndefined();
    });

    it("centres the exact clicked point, and stays put when it is on screen", () => {
        const far = { captureId: "a", at: 1, x: 100, y: 3000, label: "x" };
        expect(goToPlace(far)).toBe("moved");
        // jsdom: 1024x768 viewport, zoom 1, view at (0, 0)
        expect(window.scrollTo).toHaveBeenLastCalledWith(100 - 512, 3000 - 384);
        const near = { captureId: "b", at: 2, x: 100, y: 300, label: "y" };
        expect(goToPlace(near)).toBe("in-view");
    });
});
