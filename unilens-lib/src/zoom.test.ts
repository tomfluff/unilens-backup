import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateSetting } from "./settings";
import {
    assistantZoom,
    besideTarget,
    canReturn,
    directionOf,
    getTargetView,
    getTargetZoom,
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

    it("centres an element the chat would cover: the chat steps aside instead", () => {
        const scroll = vi.fn();
        window.scrollTo = scroll as unknown as typeof window.scrollTo;
        const el = document.createElement("div");
        // jsdom viewport 1024x768: an element below the fold goes to the middle
        expect(revealElement(el, () => box(400, 1500))).toBe("moved");
        expect(scroll).toHaveBeenLastCalledWith(450 - 512, 1520 - 384);
    });

    it("steps the chat aside to the nearer side that clears the target", () => {
        // only the right side keeps the chat on screen
        expect(
            besideTarget(
                { left: 400, right: 600 },
                { left: 450, width: 400 },
                1280,
            ),
        ).toBe(616);
        // both fit: the nearer one wins
        expect(
            besideTarget(
                { left: 600, right: 700 },
                { left: 550, width: 300 },
                1280,
            ),
        ).toBe(716);
        expect(
            besideTarget(
                { left: 600, right: 700 },
                { left: 350, width: 300 },
                1280,
            ),
        ).toBe(284);
        // a target wider than the room on either side: nowhere to go
        expect(
            besideTarget(
                { left: 50, right: 1230 },
                { left: 300, width: 400 },
                1280,
            ),
        ).toBeNull();
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

    /** an element at a content-space top, measured live against the scroll, as the
     *  DOMRect a browser returns (its fields are prototype getters, not own props) */
    const at = (top: number) => () => new DOMRect(100, top - pos.y, 100, 40);
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

    it("starts from where the page is, whatever the host page did to performance.now", () => {
        smooth(300);
        // SoftBank's vendor bundle swaps in a Date-based performance.now that runs
        // behind the frame clock by as long as the page took to load (~600ms)
        const frameClock = performance.now.bind(performance);
        const hostNow = vi
            .spyOn(performance, "now")
            .mockImplementation(() => frameClock() - 600);
        try {
            const seen: number[] = [];
            const off = onViewChange((_x, y) => seen.push(y));
            setView(0, 1000);
            vi.advanceTimersByTime(40); // the first two frames
            off();
            // the glide steps off from where the page was: no leap partway (or all
            // the way) there on its first frame
            expect(seen.length).toBeGreaterThanOrEqual(2);
            expect(seen[0]).toBe(0);
            expect(Math.max(...seen)).toBeLessThan(250);
            vi.advanceTimersByTime(400);
            expect(pos.y).toBe(1000);
        } finally {
            hostNow.mockRestore();
        }
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
        // a second move mid-glide continues the run, and heads for the element on
        // from where the page had got to, never via the page top
        const here = pos.y;
        expect(here).toBeGreaterThan(0);
        expect(revealElement(el, at(3000))).toBe("moved");
        expect(getTargetView()).toEqual({ x: 0, y: 3000 + 20 - 384 });
        vi.advanceTimersByTime(40);
        expect(pos.y).toBeGreaterThan(here);
        vi.advanceTimersByTime(400);
        expect(pos.y).toBe(3000 + 20 - 384);
        expect(returnToPreviousView()).toBe(true);
        expect(pos.y).toBe(3000 + 20 - 384); // Back glides as well
        vi.advanceTimersByTime(400);
        expect(pos.y).toBe(0);
    });
});

describe("assistantZoom (R1 of the 2026-09-27 report)", () => {
    const sized = (width: number, height: number) => {
        const el = document.createElement("div");
        document.body.appendChild(el);
        el.getBoundingClientRect = () =>
            ({ left: 100, top: 100, width, height }) as DOMRect;
        return el;
    };
    beforeEach(() => {
        updateSetting("smoothZoom", false);
        window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
        assistantZoom("reset");
        while (returnToPreviousView());
    });
    afterEach(() => {
        assistantZoom("reset");
    });

    it("fits an element to the screen, as smart zoom does, at most 5x", () => {
        // jsdom's window is 1024 x 768: a small link would fit at 9.8x
        expect(assistantZoom(sized(100, 20))).toBe(5);
        expect(getTargetZoom()).toBe(5);
        assistantZoom("reset");
        // a wide block fits its width: (1024 - 48) / 900
        expect(assistantZoom(sized(900, 300))).toBeCloseTo(976 / 900, 3);
    });

    it("steps in and out as Ctrl + and Ctrl - do, never below 100%", () => {
        expect(assistantZoom("in")).toBeCloseTo(1.25, 5);
        expect(assistantZoom("in")).toBeCloseTo(1.5625, 5);
        expect(assistantZoom("out")).toBeCloseTo(1.25, 5);
        expect(assistantZoom("reset")).toBe(1);
        expect(assistantZoom("out")).toBe(1);
    });

    it("a box-less wrapper is fitted by its children; nothing to fit changes nothing", () => {
        const wrap = document.createElement("div");
        document.body.appendChild(wrap);
        wrap.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 0, height: 0 }) as DOMRect;
        // no child with a box: the zoom stays, and no Back is left
        expect(assistantZoom(wrap)).toBe(1);
        expect(canReturn()).toBe(false);
        wrap.appendChild(sized(100, 20));
        expect(assistantZoom(wrap)).toBe(5);
    });

    it("a series of zooms is one run: Back returns to before the first", () => {
        assistantZoom(sized(100, 20));
        assistantZoom("out");
        expect(getTargetZoom()).toBeCloseTo(4, 5);
        expect(returnToPreviousView()).toBe(true);
        expect(getTargetZoom()).toBe(1);
    });

    it("a zoom that changes nothing leaves no Back", () => {
        expect(assistantZoom("reset")).toBe(1);
        expect(assistantZoom("out")).toBe(1);
        expect(canReturn()).toBe(false);
    });

    it("Back returns to where the user was, at the zoom they had", () => {
        expect(getTargetZoom()).toBe(1);
        assistantZoom(sized(100, 20));
        expect(getTargetZoom()).toBe(5);
        expect(returnToPreviousView()).toBe(true);
        expect(getTargetZoom()).toBe(1);
    });
});
