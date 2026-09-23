import { describe, expect, it, vi } from "vitest";
import { onViewChange, revealElement, setView } from "./zoom";

describe("onViewChange", () => {
    it("returns an unsubscribe that stops later notifications", () => {
        window.scrollTo = vi.fn(); // jsdom does not implement it
        const cb = vi.fn();
        const off = onViewChange(cb);
        setView(10, 20);
        expect(cb).toHaveBeenCalledTimes(1);
        off();
        setView(30, 40);
        expect(cb).toHaveBeenCalledTimes(1);
    });
});

describe("revealElement", () => {
    const box = (left: number, top: number, width = 100, height = 40) => ({
        left,
        top,
        width,
        height,
    });

    it("centres an off-screen element and leaves an on-screen one alone", () => {
        const scroll = vi.fn();
        window.scrollTo = scroll as unknown as typeof window.scrollTo;
        const el = document.createElement("div");
        // jsdom viewport is 1024x768 and scrollX/Y are 0
        expect(revealElement(el, () => box(100, 2000))).toBe(true);
        expect(scroll).toHaveBeenLastCalledWith(150 - 512, 2020 - 384);
        scroll.mockClear();
        expect(revealElement(el, () => box(100, 200))).toBe(true);
        expect(scroll).not.toHaveBeenCalled();
    });

    it("uses the visual viewport under browser pinch zoom", () => {
        const scroll = vi.fn();
        window.scrollTo = scroll as unknown as typeof window.scrollTo;
        Object.defineProperty(window, "visualViewport", {
            configurable: true,
            value: { offsetLeft: 300, offsetTop: 200, width: 400, height: 300 },
        });
        const el = document.createElement("div");
        // inside the layout viewport but left of the pinched visual viewport
        expect(revealElement(el, () => box(100, 250))).toBe(true);
        expect(scroll).toHaveBeenLastCalledWith(150 - 500, 270 - 350);
        Object.defineProperty(window, "visualViewport", {
            configurable: true,
            value: undefined,
        });
    });

    it("refuses an element with no box", () => {
        const el = document.createElement("div");
        expect(revealElement(el, () => box(0, 0, 0, 0))).toBe(false);
    });
});
