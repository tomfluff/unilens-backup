import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    announce,
    clearHighlights,
    cuePosition,
    escapeAction,
    hasHighlight,
    init,
    nextToken,
    onHighlightsCleared,
    registerPopoverClose,
    relayNow,
    setCurrentCapture,
    settleCues,
    showHighlights,
} from "./highlight";
import { updateSetting, useSettings } from "./settings";

const rect = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    width,
    height,
});
const measure = () => rect(100, 200, 50, 20);
const live = () => document.querySelector('[role="status"]');
const layerBoxes = () =>
    document.querySelectorAll("#unilens-highlight-layer .unilens-hl");

function mount(id = "n1") {
    const el = document.createElement("button");
    el.textContent = "Choose Pro";
    document.body.appendChild(el);
    return { el, registry: new Map([[id, el]]) };
}

/** a highlight for the current capture with the latest token */
function show(registry: Map<string, Element>, ids = ["n1"], label?: string) {
    setCurrentCapture("c1");
    const token = nextToken();
    return showHighlights(
        ids.map((id) => ({ id, role: "target" as const })),
        registry,
        "c1",
        token,
        { measure, label },
    );
}

beforeEach(() => {
    clearHighlights();
    document.body.innerHTML = "";
    updateSetting("autoRead", false);
    updateSetting("escapeOrder", "highlight");
    updateSetting("hlOutline", "ring");
    updateSetting("hlBackdrop", "none");
    updateSetting("hlFill", false);
    updateSetting("hlGlow", false);
    updateSetting("hlBadges", true);
    updateSetting("hlColor", "#ffd400");
    updateSetting("offscreenCue", "none");
    updateSetting("ringWidth", 2);
    updateSetting("ringScale", false);
});

describe("showHighlights", () => {
    it("falls back to the ring when the store holds an unknown outline", () => {
        const { registry } = mount();
        // bypasses clampSetting on purpose: the fallback is for a hot store edit
        useSettings.setState({ hlOutline: "nope" as "ring" });
        expect(show(registry, ["n1"], "Choose Pro")).toBe(true);
        expect(layerBoxes()).toHaveLength(1);
    });

    it("draws one box per target with the preset's geometry", () => {
        const { registry } = mount();
        expect(show(registry, ["n1"], "Choose Pro")).toBe(true);
        const boxes = layerBoxes();
        expect(boxes.length).toBe(1);
        const s = (boxes[0] as HTMLElement).style;
        // offset 3 + band 2 on each side of a 50x20 rect at (100,200)
        expect(s.left).toBe("95px");
        expect(s.top).toBe("195px");
        expect(s.width).toBe("60px");
        expect(s.height).toBe("30px");
        expect(s.border).toContain("2px solid");
        expect(hasHighlight()).toBe(true);
        expect(live()?.textContent).toContain("Found: Choose Pro");
    });

    it("is a no-op for another capture or a superseded token", () => {
        const { registry } = mount();
        setCurrentCapture("c2");
        const t = nextToken();
        expect(
            showHighlights([{ id: "n1", role: "target" }], registry, "c1", t, {
                measure,
            }),
        ).toBe(false);
        const stale = nextToken();
        nextToken(); // a newer question was asked
        expect(
            showHighlights(
                [{ id: "n1", role: "target" }],
                registry,
                "c2",
                stale,
                { measure },
            ),
        ).toBe(false);
        expect(layerBoxes().length).toBe(0);
    });

    it("skips ids the registry does not know", () => {
        const { registry } = mount();
        show(registry, ["n1", "n99"]);
        expect(layerBoxes().length).toBe(1);
    });

    it("never draws a box-less target at the screen corner; announces instead", () => {
        const { registry } = mount();
        setCurrentCapture("c1");
        const token = nextToken();
        const drawn = showHighlights(
            [{ id: "n1", role: "target" }],
            registry,
            "c1",
            token,
            { measure: () => rect(0, 0, 0, 0), label: "Choose Pro" },
        );
        expect(drawn).toBe(true); // not stale, just nothing to outline
        expect(layerBoxes()).toHaveLength(0);
        expect(hasHighlight()).toBe(false);
        expect(live()?.textContent).toContain("not showing");
    });

    it("outlines a display:contents wrapper by its children's union", () => {
        const li = document.createElement("li");
        const a = document.createElement("span");
        const b = document.createElement("span");
        li.append(a, b);
        document.body.appendChild(li);
        const boxes = new Map<Element, ReturnType<typeof rect>>([
            [li, rect(0, 0, 0, 0)],
            [a, rect(50, 400, 20, 30)],
            [b, rect(80, 400, 500, 30)],
        ]);
        setCurrentCapture("c1");
        const token = nextToken();
        showHighlights(
            [{ id: "n1", role: "target" }],
            new Map([["n1", li]]),
            "c1",
            token,
            { measure: (el) => boxes.get(el) ?? rect(0, 0, 0, 0) },
        );
        const box = layerBoxes()[0] as HTMLElement;
        // offset 3 + band 2 outside the union (50,400)-(580,430)
        expect(box.style.left).toBe("45px");
        expect(box.style.top).toBe("395px");
        expect(box.style.width).toBe("540px");
    });

    it("tells listeners when the last outlined element leaves the page", () => {
        const { el, registry } = mount();
        const cleared = vi.fn();
        const off = onHighlightsCleared(cleared);
        show(registry);
        el.remove();
        relayNow();
        expect(hasHighlight()).toBe(false);
        expect(cleared).toHaveBeenCalledTimes(1);
        off();
    });

    it("removes and announces an element that left the page", () => {
        const { el, registry } = mount();
        show(registry);
        el.remove();
        relayNow();
        expect(layerBoxes().length).toBe(0);
        expect(live()?.textContent).toContain("no longer on the page");
        expect(hasHighlight()).toBe(false);
    });

    it("stacks fill and glow in the chosen colour over a dim backdrop", () => {
        updateSetting("hlFill", true);
        updateSetting("hlGlow", true);
        updateSetting("hlBackdrop", "dim");
        updateSetting("hlColor", "#ffe600");
        const { registry } = mount();
        show(registry);
        const box = layerBoxes()[0] as HTMLElement;
        expect(box.style.background).toContain("rgba(255, 230, 0");
        expect(box.style.boxShadow).toContain("18px");
        expect(document.querySelector(".unilens-hl-dim")).not.toBeNull();
        clearHighlights();
        expect(document.querySelector(".unilens-hl-dim")).toBeNull();
    });

    it("dims around every target, one hole each", () => {
        updateSetting("hlBackdrop", "dim");
        const a = document.createElement("button");
        const b = document.createElement("button");
        document.body.append(a, b);
        const boxes = new Map<Element, ReturnType<typeof rect>>([
            [a, rect(10, 20, 30, 40)],
            [b, rect(300, 400, 50, 60)],
        ]);
        setCurrentCapture("c1");
        showHighlights(
            [
                { id: "a", role: "target", badge: "1" },
                { id: "b", role: "target", badge: "2" },
            ],
            new Map([
                ["a", a],
                ["b", b],
            ]),
            "c1",
            nextToken(),
            { measure: (el) => boxes.get(el) ?? rect(0, 0, 0, 0) },
        );
        const dim = document.querySelector(
            ".unilens-hl-dim > div",
        ) as HTMLElement;
        expect(dim.style.clipPath).toContain("evenodd");
        expect(dim.style.clipPath).toContain("M10 20h30v40h-30Z");
        expect(dim.style.clipPath).toContain("M300 400h50v60h-50Z");
        const badges = [...document.querySelectorAll(".unilens-hl-badge")];
        expect(badges.map((x) => x.textContent)).toEqual(["1", "2"]);
    });

    it("keeps the whole viewport dimmed when the target is far off-screen", () => {
        // the old dim was a 200vmax box-shadow around the target: once the page moved
        // the target more than that away, content between them was not dimmed
        updateSetting("hlBackdrop", "dim");
        const { registry } = mount();
        setCurrentCapture("c1");
        showHighlights(
            [{ id: "n1", role: "target" }],
            registry,
            "c1",
            nextToken(),
            { measure: () => rect(100, 9000, 50, 20) },
        );
        const dim = document.querySelector(".unilens-hl-dim") as HTMLElement;
        expect(dim.style.left).toBe("0px");
        expect(dim.style.top).toBe("0px");
        expect(dim.style.width).toBe("100vw");
        expect(dim.style.height).toBe("100vh");
        expect(dim.style.boxShadow).toBe("");
        expect((dim.firstElementChild as HTMLElement).style.clipPath).toContain(
            `M0 0H${window.innerWidth}V${window.innerHeight}H0Z`,
        );
    });

    it("draws a user's click for an older capture; a late answer stays dropped", () => {
        const { registry } = mount();
        setCurrentCapture("c2"); // the view was refreshed since this message
        expect(
            showHighlights(
                [{ id: "n1", role: "target" }],
                registry,
                "c1",
                nextToken(),
                { measure },
            ),
        ).toBe(false);
        expect(
            showHighlights(
                [{ id: "n1", role: "target" }],
                registry,
                "c1",
                nextToken(),
                { measure, userInitiated: true },
            ),
        ).toBe(true);
        expect(layerBoxes()).toHaveLength(1);
    });

    it("scales the band with zoom only when ringScale is on", () => {
        updateSetting("ringScale", true);
        const { registry } = mount();
        show(registry);
        // zoom is 1 in jsdom: clamp(3, 2*1, 8) = 3 per band
        expect((layerBoxes()[0] as HTMLElement).style.left).toBe("94px");
    });
});

describe("announce", () => {
    it("writes the live region, and stays silent under autoRead", () => {
        announce("hello");
        expect(live()?.textContent).toContain("hello");
        updateSetting("autoRead", true);
        announce("quiet");
        expect(live()?.textContent).not.toContain("quiet");
    });
});

describe("escapeAction", () => {
    const cases: [
        "highlight" | "popover" | "both",
        boolean,
        boolean,
        string,
    ][] = [
        ["highlight", true, true, "clear"],
        ["highlight", true, false, "clear"],
        ["highlight", false, true, "close"],
        ["highlight", false, false, "none"],
        ["popover", true, true, "close"],
        ["popover", true, false, "clear"],
        ["popover", false, true, "close"],
        ["popover", false, false, "none"],
        ["both", true, true, "both"],
        ["both", true, false, "both"],
        ["both", false, true, "both"],
        ["both", false, false, "none"],
    ];
    for (const [order, hl, pop, expected] of cases) {
        it(`${order} · highlight=${hl} · popover=${pop} → ${expected}`, () => {
            updateSetting("escapeOrder", order);
            const off = pop ? registerPopoverClose(() => {}) : () => {};
            if (hl) show(mount().registry);
            expect(escapeAction()).toBe(expected);
            off();
        });
    }
});

describe("Escape listener (single owner)", () => {
    const press = () =>
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    it("clears the highlight first, then closes the popover", () => {
        init();
        const close = vi.fn();
        const off = registerPopoverClose(close);
        show(mount().registry);
        press();
        expect(hasHighlight()).toBe(false);
        expect(close).not.toHaveBeenCalled();
        press();
        expect(close).toHaveBeenCalledTimes(1);
        off();
    });

    it("does both on one press under escapeOrder=both", () => {
        init();
        updateSetting("escapeOrder", "both");
        const close = vi.fn();
        const off = registerPopoverClose(close);
        show(mount().registry);
        press();
        expect(hasHighlight()).toBe(false);
        expect(close).toHaveBeenCalledTimes(1);
        off();
    });

    it("does not stop the event reaching the host", () => {
        init();
        const host = vi.fn();
        window.addEventListener("keydown", host);
        show(mount().registry);
        press();
        expect(host).toHaveBeenCalled();
        window.removeEventListener("keydown", host);
    });
});

describe("clearHighlights", () => {
    it("leaves no boxes and drops the scroll/resize subscriptions", () => {
        const removed = vi.spyOn(window, "removeEventListener");
        show(mount().registry);
        clearHighlights();
        expect(layerBoxes().length).toBe(0);
        const names = removed.mock.calls.map((c) => c[0]);
        expect(names).toContain("scroll");
        expect(names).toContain("resize");
        removed.mockRestore();
    });
});

describe("layered look", () => {
    const one = (m = () => rect(100, 200, 50, 20)) => {
        const { registry } = mount();
        setCurrentCapture("c1");
        showHighlights(
            [{ id: "n1", role: "target", badge: "1" }],
            registry,
            "c1",
            nextToken(),
            { measure: m },
        );
        return layerBoxes()[0] as HTMLElement;
    };

    it("band: a thick stroke in the colour between two dark edges", () => {
        updateSetting("hlOutline", "band");
        updateSetting("hlColor", "#ff00aa");
        const box = one();
        expect(box.style.border).toBe("6px solid rgb(255, 0, 170)");
        expect(box.style.outline).toMatch(/^2px solid (#000|rgb\(0, 0, 0\))$/);
        expect(box.style.boxShadow).toMatch(/^inset 0(px)? 0(px)? 0(px)? 2px/);
    });

    it("brackets and underline draw decorations instead of a border", () => {
        updateSetting("hlOutline", "brackets");
        let box = one();
        expect(box.style.border).toBe("0px");
        expect(box.querySelectorAll("path")).toHaveLength(2);
        expect(box.querySelector("path")?.getAttribute("d")).toMatch(/^M/);
        clearHighlights();
        updateSetting("hlOutline", "underline");
        box = one();
        expect(box.querySelector(".unilens-hl-deco")).not.toBeNull();
    });

    it("badges are an addition the user can turn off", () => {
        updateSetting("hlBadges", false);
        one();
        expect(document.querySelector(".unilens-hl-badge")).toBeNull();
        clearHighlights();
        updateSetting("hlBadges", true);
        one();
        expect(document.querySelector(".unilens-hl-badge")?.textContent).toBe(
            "1",
        );
    });

    it("spotlight feathers the holes and overshoots the screen edges", () => {
        updateSetting("hlBackdrop", "spotlight");
        one();
        const wrap = document.querySelector(".unilens-hl-dim") as HTMLElement;
        const shade = wrap.firstElementChild as HTMLElement;
        expect(wrap.style.filter).toBe("blur(14px)");
        expect(shade.style.left).toBe("-42px");
        expect(shade.style.background).toBe("rgba(0, 0, 0, 0.72)");
        // hole shifted by the overshoot so it still lands on the element
        expect(shade.style.clipPath).toContain("M142 242h50v20h-50Z");
    });
});

describe("off-screen cues", () => {
    it("places an edge cue on the inset screen edge toward the target", () => {
        const p = cuePosition(
            "edge",
            rect(500, 3000, 100, 40),
            { w: 1000, h: 800 },
            null,
            90,
        );
        expect(p.y).toBe(800 - 32);
        expect(p.angle).toBeGreaterThan(0); // pointing down
    });

    it("places a pointer cue on a circle round the pointer", () => {
        const p = cuePosition(
            "pointer",
            rect(1000, 100, 0, 0),
            { w: 1000, h: 800 },
            { x: 100, y: 100 },
            90,
        );
        expect(p).toMatchObject({ x: 190, y: 100, angle: 0 });
    });

    it("keeps edge cues apart and slides one out from under the popover", () => {
        const view = { w: 1000, h: 800 };
        const bottom = (x: number) => ({ x, y: 768, angle: Math.PI / 2 });
        const apart = settleCues(
            [bottom(500), bottom(510)],
            "edge",
            view,
            null,
            null,
            90,
        );
        expect(Math.abs(apart[1].x - apart[0].x)).toBeGreaterThanOrEqual(52);
        const popover = { left: 400, top: 500, right: 740, bottom: 800 };
        const moved = settleCues(
            [bottom(500), bottom(560), bottom(600)],
            "edge",
            view,
            popover,
            null,
            90,
        );
        for (const c of moved)
            expect(c.x + 24 <= popover.left || c.x - 24 >= popover.right).toBe(
                true,
            );
        const xs = moved.map((c) => c.x).sort((a, b) => a - b);
        for (let k = 1; k < xs.length; k++)
            expect(xs[k] - xs[k - 1]).toBeGreaterThanOrEqual(52);
    });

    it("spreads pointer cues round the circle", () => {
        const from = { x: 300, y: 300 };
        const cues = [0, 0.05].map((angle) => ({ x: 0, y: 0, angle }));
        const [a, b] = settleCues(
            cues,
            "pointer",
            { w: 1000, h: 800 },
            null,
            from,
            90,
        );
        expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThan(48);
        expect(Math.hypot(a.x - from.x, a.y - from.y)).toBeCloseTo(90);
    });

    it("spaces the pointer cues that wrap round past ±π", () => {
        const from = { x: 300, y: 300 };
        const cues = [Math.PI - 0.02, -Math.PI + 0.02].map((angle) => ({
            x: 0,
            y: 0,
            angle,
        }));
        const [a, b] = settleCues(
            cues,
            "pointer",
            { w: 1000, h: 800 },
            null,
            from,
            90,
        );
        expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThan(48);
    });

    it("rotates a pointer cue out from under the popover", () => {
        const from = { x: 300, y: 300 };
        const popover = { left: 360, top: 250, right: 700, bottom: 700 };
        const [c] = settleCues(
            [{ x: 0, y: 0, angle: 0 }],
            "pointer",
            { w: 1000, h: 800 },
            popover,
            from,
            90,
        );
        const inside =
            c.x + 24 > popover.left &&
            c.x - 24 < popover.right &&
            c.y + 24 > popover.top &&
            c.y - 24 < popover.bottom;
        expect(inside).toBe(false);
    });

    it("places cues from real DOMRects, whose fields are prototype getters", () => {
        class Rect {
            constructor(
                private l: number,
                private t: number,
            ) {}
            get left() {
                return this.l;
            }
            get top() {
                return this.t;
            }
            get width() {
                return 50;
            }
            get height() {
                return 20;
            }
        }
        updateSetting("offscreenCue", "edge");
        const { registry } = mount();
        setCurrentCapture("c1");
        showHighlights(
            [{ id: "n1", role: "target", badge: "1" }],
            registry,
            "c1",
            nextToken(),
            { measure: () => new Rect(100, 5000) },
        );
        const cue = document.querySelector(".unilens-hl-cue") as HTMLElement;
        expect(cue.style.top).toMatch(/^\d+(\.\d+)?px$/);
        expect(cue.getAttribute("aria-label")).toContain("below");
    });

    it("keeps the same edge cue element across relays, so focus survives", () => {
        updateSetting("offscreenCue", "edge");
        const { registry } = mount();
        setCurrentCapture("c1");
        showHighlights(
            [{ id: "n1", role: "target", badge: "1" }],
            registry,
            "c1",
            nextToken(),
            { measure: () => rect(100, 5000, 50, 20) },
        );
        const before = document.querySelector(".unilens-hl-cue");
        relayNow();
        expect(document.querySelector(".unilens-hl-cue")).toBe(before);
    });

    it("marks an outline-less box, so forced colours can give it a ring", () => {
        updateSetting("hlOutline", "none");
        updateSetting("hlFill", true);
        const { registry } = mount();
        show(registry);
        expect((layerBoxes()[0] as HTMLElement).dataset.outline).toBe("none");
    });

    it("draws an edge cue only for a target off screen, and it brings the target in", () => {
        updateSetting("offscreenCue", "edge");
        const scroll = vi.fn();
        window.scrollTo = scroll as unknown as typeof window.scrollTo;
        const { registry } = mount();
        setCurrentCapture("c1");
        showHighlights(
            [{ id: "n1", role: "target", badge: "2" }],
            registry,
            "c1",
            nextToken(),
            { measure: () => rect(100, 5000, 50, 20) },
        );
        const cue = document.querySelector(
            ".unilens-hl-cue",
        ) as HTMLButtonElement;
        expect(cue.tagName).toBe("BUTTON");
        expect(cue.getAttribute("aria-label")).toBe(
            "Item 2 is below. Go there.",
        );
        expect(cue.textContent).toContain("2");
        cue.click();
        expect(scroll).toHaveBeenCalled();
    });

    it("draws no cue when the target is on screen, and a pointer cue never takes clicks", () => {
        updateSetting("offscreenCue", "pointer");
        const { registry } = mount();
        setCurrentCapture("c1");
        showHighlights(
            [{ id: "n1", role: "target", badge: "1" }],
            registry,
            "c1",
            nextToken(),
            { measure: () => rect(100, 200, 50, 20) },
        );
        expect(document.querySelector(".unilens-hl-cue")).toBeNull();
        clearHighlights();
        showHighlights(
            [{ id: "n1", role: "target", badge: "1" }],
            registry,
            "c1",
            nextToken(),
            { measure: () => rect(100, -900, 50, 20) },
        );
        const cue = document.querySelector(".unilens-hl-cue") as HTMLElement;
        expect(cue.tagName).toBe("DIV");
        expect(cue.style.pointerEvents).toBe("none");
        expect(cue.getAttribute("aria-hidden")).toBe("true");
    });
});
