import { describe, expect, it, vi } from "vitest";
import {
    canReturn,
    directionOf,
    isOwnUI,
    onViewChange,
    returnToPreviousView,
    revealElement,
    setView,
} from "./zoom";

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
        expect(revealElement(el, () => box(100, 2000))).toBe("moved");
        expect(scroll).toHaveBeenLastCalledWith(150 - 512, 2020 - 384);
        scroll.mockClear();
        expect(revealElement(el, () => box(100, 200))).toBe("in-view");
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
        expect(revealElement(el, () => box(100, 250))).toBe("moved");
        expect(scroll).toHaveBeenLastCalledWith(150 - 500, 270 - 350);
        Object.defineProperty(window, "visualViewport", {
            configurable: true,
            value: undefined,
        });
    });

    it("centres an on-screen element too when asked to always", () => {
        const scroll = vi.fn();
        window.scrollTo = scroll as unknown as typeof window.scrollTo;
        const el = document.createElement("div");
        revealElement(el, () => box(100, 200), { always: true });
        expect(scroll).toHaveBeenCalledWith(150 - 512, 220 - 384);
    });

    it("remembers each move so the user can return to where they were", () => {
        const scroll = vi.fn();
        window.scrollTo = scroll as unknown as typeof window.scrollTo;
        while (returnToPreviousView()); // clean history from earlier tests
        expect(canReturn()).toBe(false);
        const el = document.createElement("div");
        revealElement(el, () => box(100, 3000));
        expect(canReturn()).toBe(true);
        scroll.mockClear();
        expect(returnToPreviousView()).toBe(true);
        // jsdom view is (0, 0), so returning centres the old view centre again
        expect(scroll).toHaveBeenCalledWith(0, 0);
        expect(canReturn()).toBe(false);
        expect(returnToPreviousView()).toBe(false);
    });

    it("names where an element is, for spoken status", () => {
        const el = document.createElement("div");
        expect(directionOf(el, () => box(100, 3000))).toBe("below");
        expect(directionOf(el, () => box(100, -300))).toBe("above");
        expect(directionOf(el, () => box(100, 200))).toBe("on screen");
    });

    it("moves an element the popover covers into the free band beside it", () => {
        const scroll = vi.fn();
        window.scrollTo = scroll as unknown as typeof window.scrollTo;
        const el = document.createElement("div");
        // jsdom viewport 1024x768; popover on the right half; element under it
        const popover = { left: 600, top: 0, right: 1024, bottom: 768 };
        expect(revealElement(el, () => box(700, 300), { avoid: popover })).toBe(
            "moved",
        );
        // centred in the free left band (0..600 wide): x 750 -> 300, y stays centred
        expect(scroll).toHaveBeenLastCalledWith(750 - 300, 320 - 384);
    });

    it("refuses an element with no box", () => {
        const el = document.createElement("div");
        expect(revealElement(el, () => box(0, 0, 0, 0))).toBe("none");
    });
});

describe("isOwnUI", () => {
    it("is true for UniLens chrome outside <body>, false for the page", () => {
        const panel = document.createElement("div");
        const spinner = document.createElement("input");
        panel.appendChild(spinner);
        document.documentElement.appendChild(panel);
        const pageEl = document.createElement("p");
        document.body.appendChild(pageEl);
        expect(isOwnUI(spinner)).toBe(true);
        expect(isOwnUI(panel)).toBe(true);
        expect(isOwnUI(pageEl)).toBe(false);
        expect(isOwnUI(document.body)).toBe(false);
        expect(isOwnUI(document.documentElement)).toBe(false);
        expect(isOwnUI(null)).toBe(false);
        panel.remove();
        pageEl.remove();
    });
});
