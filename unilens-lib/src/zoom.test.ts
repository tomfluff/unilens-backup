import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateSetting } from "./settings";
import {
    canReturn,
    directionOf,
    getTargetView,
    getView,
    isOwnUI,
    onViewChange,
    returnToPreviousView,
    revealElement,
    revealPoint,
    setView,
} from "./zoom";

// these read positions right after a move: they assume the instant motion setting
beforeEach(() => updateSetting("motion", "instant"));

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

    it("moves an element the popover covers above or below it when the page cannot pan sideways", () => {
        const scroll = vi.fn();
        window.scrollTo = scroll as unknown as typeof window.scrollTo;
        const el = document.createElement("div");
        // jsdom viewport 1024x768, no horizontal overflow; popover over the lower half
        const popover = { left: 300, top: 400, right: 700, bottom: 768 };
        expect(revealElement(el, () => box(400, 500), { avoid: popover })).toBe(
            "moved",
        );
        // x unchanged (cannot pan sideways); centred in the band above: y 520 -> 200
        expect(scroll).toHaveBeenLastCalledWith(0, 520 - 200);
    });

    it("uses the band beside the popover when the page can pan sideways", () => {
        const scroll = vi.fn();
        window.scrollTo = scroll as unknown as typeof window.scrollTo;
        Object.defineProperty(document.documentElement, "scrollWidth", {
            configurable: true,
            value: 3000,
        });
        const el = document.createElement("div");
        const popover = { left: 600, top: 0, right: 1024, bottom: 768 };
        revealElement(el, () => box(700, 300), { avoid: popover });
        // centred in the free left band (0..600): x 750 -> 300
        expect(scroll).toHaveBeenLastCalledWith(750 - 300, 320 - 384);
        Object.defineProperty(document.documentElement, "scrollWidth", {
            configurable: true,
            value: 0,
        });
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

describe("page moves: eased, cancellable, and Back as a bookmark", () => {
    const root = document.documentElement;
    const sizes = {
        scrollWidth: 1024,
        clientWidth: 1024,
        scrollHeight: 10000,
        clientHeight: 768,
    };
    const saved = {
        x: Object.getOwnPropertyDescriptor(window, "scrollX"),
        y: Object.getOwnPropertyDescriptor(window, "scrollY"),
    };
    let pos = { x: 0, y: 0 };
    let scroll: ReturnType<typeof vi.fn>;

    /** a page that really scrolls, clamped like a browser: 1024 wide, 10000 tall */
    beforeEach(() => {
        pos = { x: 0, y: 0 };
        for (const [k, v] of Object.entries(sizes))
            Object.defineProperty(root, k, { configurable: true, value: v });
        Object.defineProperty(window, "scrollX", {
            configurable: true,
            get: () => pos.x,
        });
        Object.defineProperty(window, "scrollY", {
            configurable: true,
            get: () => pos.y,
        });
        scroll = vi.fn((a: number | ScrollToOptions, b?: number) => {
            const x = typeof a === "number" ? a : (a.left ?? pos.x);
            const y = typeof a === "number" ? (b ?? 0) : (a.top ?? pos.y);
            pos = {
                x: Math.max(0, Math.min(x, sizes.scrollWidth - 1024)),
                y: Math.max(0, Math.min(y, sizes.scrollHeight - 768)),
            };
        });
        window.scrollTo = scroll as unknown as typeof window.scrollTo;
        vi.useFakeTimers({
            toFake: [
                "requestAnimationFrame",
                "cancelAnimationFrame",
                "performance",
            ],
        });
        while (returnToPreviousView()); // no bookmark from earlier tests
        vi.runAllTimers();
        pos = { x: 0, y: 0 };
    });

    afterEach(() => {
        vi.useRealTimers();
        for (const k of Object.keys(sizes))
            delete (root as unknown as Record<string, unknown>)[k];
        if (saved.x) Object.defineProperty(window, "scrollX", saved.x);
        if (saved.y) Object.defineProperty(window, "scrollY", saved.y);
        Object.defineProperty(window, "matchMedia", {
            configurable: true,
            value: undefined,
        });
    });

    /** an element at a content-space top, measured live against the scroll */
    const at = (top: number) => () => ({
        left: 100,
        top: top - pos.y,
        width: 100,
        height: 40,
    });
    const el = document.createElement("div");

    const smooth = (ms = 300) => {
        updateSetting("motion", "smooth");
        updateSetting("motionMs", ms);
    };

    it("jumps within the call when motion is instant, or when the system asks for reduced motion", () => {
        setView(0, 500);
        expect(pos.y).toBe(500);
        smooth();
        Object.defineProperty(window, "matchMedia", {
            configurable: true,
            value: (q: string) => ({ matches: q.includes("reduce") }),
        });
        setView(0, 900);
        expect(pos.y).toBe(900);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("glides to the target over the duration, every frame between start and target", () => {
        smooth(300);
        const seen: number[] = [];
        const off = onViewChange((_x, y) => seen.push(y));
        setView(0, 1000);
        expect(pos.y).toBe(0); // nothing moves within the call
        expect(getTargetView()).toEqual({ x: 0, y: 1000 });
        vi.advanceTimersByTime(150);
        expect(pos.y).toBeGreaterThan(0);
        expect(pos.y).toBeLessThan(1000);
        vi.advanceTimersByTime(200);
        expect(pos.y).toBe(1000);
        off();
        // the view listeners followed every frame, only ever forwards
        expect(seen.length).toBeGreaterThan(5);
        expect(seen.at(-1)).toBe(1000);
        for (let i = 1; i < seen.length; i++) {
            expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
            expect(seen[i]).toBeLessThanOrEqual(1000);
        }
        expect(getTargetView()).toEqual(getView());
    });

    it("stops where it is when the user wheels, but not for a wheel over UniLens' own panel", () => {
        smooth(300);
        const panel = document.createElement("div");
        root.appendChild(panel);
        setView(0, 1000);
        vi.advanceTimersByTime(60);
        const early = pos.y;
        panel.dispatchEvent(new WheelEvent("wheel", { bubbles: true }));
        vi.advanceTimersByTime(60);
        const mid = pos.y;
        expect(mid).toBeGreaterThan(early); // still gliding
        document.body.dispatchEvent(new WheelEvent("wheel", { bubbles: true }));
        vi.advanceTimersByTime(500);
        expect(pos.y).toBe(mid);
        expect(getTargetView()).toEqual({ x: 0, y: mid });
        panel.remove();
    });

    it("Back after two moves in a row returns to where the user was reading", () => {
        revealElement(el, at(1500)); // source 3
        expect(pos.y).toBe(1500 + 20 - 384);
        revealElement(el, at(1100)); // next
        expect(pos.y).toBe(1100 + 20 - 384);
        expect(returnToPreviousView()).toBe(true);
        expect(pos.y).toBe(0);
        expect(canReturn()).toBe(false);
    });

    it("a scroll of the user's own between moves makes that the place Back returns to", () => {
        revealElement(el, at(1500));
        pos = { x: 0, y: 2000 }; // the user reads on from there
        revealElement(el, at(400));
        expect(pos.y).toBe(400 + 20 - 384);
        revealPoint(150, 3000); // the same run
        expect(returnToPreviousView()).toBe(true);
        expect(pos.y).toBe(2000);
    });

    it("mid-glide, decides from where the page is going, and Back glides home too", () => {
        smooth(300);
        revealElement(el, at(1500)); // heading for 1136
        vi.advanceTimersByTime(40);
        expect(pos.y).toBeLessThan(700); // 1500 is still below the screen here
        // but on screen once the move lands: no second move, and it is not "below"
        expect(directionOf(el, at(1500))).toBe("on screen");
        expect(revealElement(el, at(1500))).toBe("in-view");
        // a second move mid-glide continues the run
        expect(revealElement(el, at(3000))).toBe("moved");
        vi.advanceTimersByTime(400);
        expect(pos.y).toBe(3000 + 20 - 384);
        expect(returnToPreviousView()).toBe(true);
        expect(pos.y).toBe(3000 + 20 - 384); // Back glides as well
        vi.advanceTimersByTime(400);
        expect(pos.y).toBe(0);
    });
});
