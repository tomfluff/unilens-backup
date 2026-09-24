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
    // page moves land within the call, so a test can read them
    updateSetting("motion", "instant");
    updateSetting("autoRead", false);
    updateSetting("escapeOrder", "highlight");
    updateSetting("hlOutline", "ring");
    updateSetting("hlBackdrop", "none");
    updateSetting("hlFill", false);
    updateSetting("hlGlow", false);
    updateSetting("hlBadges", true);
    updateSetting("hlColor", "#ffd400");
    updateSetting("offscreenCue", "none");
    updateSetting("cueRadius", 90);
    updateSetting("cueSize", 72);
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

    it("speaks in the chat's language", () => {
        updateSetting("chatLanguage", "ja");
        try {
            const { registry } = mount();
            show(registry, ["n1"], "Choose Pro");
            expect(live()?.textContent).toContain("見つかりました：Choose Pro");
        } finally {
            updateSetting("chatLanguage", "auto");
        }
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

type Cue = { x: number; y: number; angle: number; tx: number; ty: number };
type Avoid = { left: number; top: number; right: number; bottom: number };

/** the smallest difference between two angles, in degrees */
const degOff = (a: number, b: number) => {
    const d = Math.abs(a - b) % (2 * Math.PI);
    return (Math.min(d, 2 * Math.PI - d) * 180) / Math.PI;
};

/** every arrow points at its target from where the cue is drawn */
function expectAimed(cues: Cue[]) {
    for (const c of cues)
        expect(
            degOff(c.angle, Math.atan2(c.ty - c.y, c.tx - c.x)),
        ).toBeLessThanOrEqual(1);
}

/** what every settled edge layout must hold, whatever moved the cues */
function expectSettled(
    cues: Cue[],
    view: { w: number; h: number },
    avoid: Avoid | null,
    size: number,
) {
    const m = size / 2 + 8;
    expectAimed(cues);
    for (const c of cues) {
        // the whole cue, plus the margin, is on screen
        expect(c.x).toBeGreaterThanOrEqual(m - 1e-6);
        expect(c.x).toBeLessThanOrEqual(view.w - m + 1e-6);
        expect(c.y).toBeGreaterThanOrEqual(m - 1e-6);
        expect(c.y).toBeLessThanOrEqual(view.h - m + 1e-6);
        // never under the chat
        if (avoid)
            expect(
                c.x > avoid.left &&
                    c.x < avoid.right &&
                    c.y > avoid.top &&
                    c.y < avoid.bottom,
            ).toBe(false);
    }
    for (let i = 0; i < cues.length; i++)
        for (let j = i + 1; j < cues.length; j++)
            expect(
                Math.hypot(cues[i].x - cues[j].x, cues[i].y - cues[j].y),
            ).toBeGreaterThanOrEqual(size - 1e-6);
}

/** a cue from cuePosition for a target centred at (tx, ty) */
const cueAt = (
    mode: "edge" | "pointer",
    tx: number,
    ty: number,
    view: { w: number; h: number },
    from: { x: number; y: number } | null,
    radius: number,
    size: number,
) => cuePosition(mode, rect(tx, ty, 0, 0), view, from, radius, size);

describe("off-screen cues", () => {
    const view = { w: 1000, h: 800 };

    it("places an edge cue on the inset screen edge toward the target", () => {
        const p = cuePosition(
            "edge",
            rect(500, 3000, 100, 40),
            view,
            null,
            90,
            72,
        );
        expect(p.y).toBe(800 - 36 - 8);
        expect(p.angle).toBeGreaterThan(0); // pointing down
        expect(p).toMatchObject({ tx: 550, ty: 3020 });
    });

    it("places a pointer cue on a circle round the pointer", () => {
        const p = cuePosition(
            "pointer",
            rect(1000, 100, 0, 0),
            view,
            { x: 100, y: 100 },
            90,
            72,
        );
        expect(p).toMatchObject({ x: 190, y: 100, angle: 0 });
    });

    it("pins pointer cues to the pointer, whatever the view or the chat", () => {
        // the pointer at the bottom edge, inside the chat
        const from = { x: 500, y: 790 };
        const chat = { left: 300, top: 500, right: 800, bottom: 800 };
        const cues = [
            [500, 3000],
            [-3000, 790],
            [3000, -2000],
        ].map(([tx, ty]) => cueAt("pointer", tx, ty, view, from, 90, 72));
        const free = settleCues(cues, "pointer", view, null, from, 90, 72);
        // the chat and the view change nothing
        expect(settleCues(cues, "pointer", view, chat, from, 90, 72)).toEqual(
            free,
        );
        expect(
            settleCues(cues, "pointer", { w: 300, h: 200 }, chat, from, 90, 72),
        ).toEqual(free);
        // far apart, so none spread: each sits on its own bearing at the radius,
        // the one below the pointer past the view's edge
        free.forEach((c, i) => {
            expect(c.x).toBeCloseTo(cues[i].x);
            expect(c.y).toBeCloseTo(cues[i].y);
            expect(Math.hypot(c.x - from.x, c.y - from.y)).toBeCloseTo(90);
        });
        expect(free[0]).toMatchObject({ x: 500, y: 880 });
        expectAimed(free);
    });

    it("keeps edge cues apart and slides one out from under the popover", () => {
        const bottom = (x: number) =>
            cueAt("edge", x, 5000, view, null, 90, 48);
        const apart = settleCues(
            [bottom(500), bottom(502)],
            "edge",
            view,
            null,
            null,
            90,
            48,
        );
        expect(Math.abs(apart[1].x - apart[0].x)).toBeGreaterThanOrEqual(
            52 - 1e-6,
        );
        expectSettled(apart, view, null, 48);
        const popover = { left: 400, top: 500, right: 740, bottom: 800 };
        const moved = settleCues(
            [bottom(500), bottom(560), bottom(600)],
            "edge",
            view,
            popover,
            null,
            90,
            48,
        );
        for (const c of moved)
            expect(
                c.x + 24 <= popover.left ||
                    c.x - 24 >= popover.right ||
                    c.y + 24 <= popover.top,
            ).toBe(true);
        expectSettled(moved, view, popover, 48);
    });

    it("aims every moved cue at its own target, not along the edge it slid on", () => {
        // the critique's case: cues crowded next to the chat all turned the same way
        const pop = { left: 700, top: 300, right: 1000, bottom: 800 };
        const cues = [
            [1400, 1300],
            [1500, 1250],
            [1450, 1350],
        ].map(([tx, ty]) => cueAt("edge", tx, ty, view, null, 90, 72));
        const out = settleCues(cues, "edge", view, pop, null, 90, 72);
        expectSettled(out, view, pop, 72);
        // no two cues share a spot, so no two cues can share a wrong angle there
        expect(new Set(out.map((c) => `${c.x},${c.y}`)).size).toBe(3);
    });

    it("keeps edge cues that meet at a corner apart", () => {
        const cues = [
            [3000, 2400],
            [3000, 2300],
            [2900, 2400],
            [3000, 2000],
        ].map(([tx, ty]) => cueAt("edge", tx, ty, view, null, 90, 96));
        expectSettled(
            settleCues(cues, "edge", view, null, null, 90, 96),
            view,
            null,
            96,
        );
    });

    it("spreads pointer cues round the circle", () => {
        const from = { x: 300, y: 300 };
        const cues = [0, 0.05].map((a) =>
            cueAt(
                "pointer",
                from.x + 1000 * Math.cos(a),
                from.y + 1000 * Math.sin(a),
                view,
                from,
                90,
                48,
            ),
        );
        const [a, b] = settleCues(cues, "pointer", view, null, from, 90, 48);
        expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(
            52 - 1e-6,
        );
        expect(Math.hypot(a.x - from.x, a.y - from.y)).toBeCloseTo(90);
        expect(Math.hypot(b.x - from.x, b.y - from.y)).toBeCloseTo(90);
        expectAimed([a, b]);
    });

    it("spaces the pointer cues that wrap round past ±π", () => {
        const from = { x: 500, y: 300 };
        const cues = [Math.PI - 0.02, -Math.PI + 0.02].map((a) =>
            cueAt(
                "pointer",
                from.x + 2000 * Math.cos(a),
                from.y + 2000 * Math.sin(a),
                view,
                from,
                90,
                48,
            ),
        );
        const [a, b] = settleCues(cues, "pointer", view, null, from, 90, 48);
        expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(
            52 - 1e-6,
        );
        expectAimed([a, b]);
    });

    it("holds every rule for any pointer, popover, size and set of targets", () => {
        // a fixed-seed generator, so a failure replays
        let seed = 7;
        const rnd = () => {
            seed = (seed * 1103515245 + 12345) % 2147483648;
            return seed / 2147483648;
        };
        for (let run = 0; run < 400; run++) {
            const mode = rnd() < 0.5 ? "edge" : "pointer";
            const size = 48 + Math.round(rnd() * 80);
            const radius = 40 + Math.round(rnd() * 200);
            const from = { x: rnd() * view.w, y: rnd() * view.h };
            const pw = 200 + rnd() * 200;
            const ph = 200 + rnd() * 300;
            const px = rnd() * (view.w - pw);
            const py = rnd() * (view.h - ph);
            const pop =
                rnd() < 0.8
                    ? { left: px, top: py, right: px + pw, bottom: py + ph }
                    : null;
            // off-screen targets, bunched in one direction half the time
            const base = rnd() * 2 * Math.PI;
            const n = 1 + Math.floor(rnd() * 5);
            const cues = Array.from({ length: n }, () => {
                const a =
                    rnd() < 0.5 ? base + rnd() * 0.3 : rnd() * 2 * Math.PI;
                const d = 1500 + rnd() * 2000;
                return cueAt(
                    mode,
                    view.w / 2 + d * Math.cos(a),
                    view.h / 2 + d * Math.sin(a),
                    view,
                    from,
                    radius,
                    size,
                );
            });
            const out = settleCues(cues, mode, view, pop, from, radius, size);
            expect(out).toHaveLength(n);
            if (mode === "edge") {
                expectSettled(out, view, pop, size);
                continue;
            }
            expectAimed(out);
            expect(
                settleCues(
                    cues,
                    mode,
                    { w: 1, h: 1 },
                    null,
                    from,
                    radius,
                    size,
                ),
            ).toEqual(out);
            for (const c of out)
                expect(Math.hypot(c.x - from.x, c.y - from.y)).toBeCloseTo(
                    radius,
                );
        }
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

    /** each drawn cue as the page shows it: centre, drawn rotation, and its target */
    function drawnCues(where: ReturnType<typeof rect>[]) {
        return [
            ...document.querySelectorAll<HTMLElement>(".unilens-hl-cue"),
        ].map((el) => {
            const size = Number.parseFloat(el.style.width);
            const deg = Number(
                /rotate\(([-\d.e]+)/.exec(
                    el.querySelector("g")?.getAttribute("transform") ?? "",
                )?.[1],
            );
            const r = where[Number(el.textContent) - 1];
            return {
                el,
                size,
                x: Number.parseFloat(el.style.left) + size / 2,
                y: Number.parseFloat(el.style.top) + size / 2,
                angle: (deg * Math.PI) / 180,
                tx: r.left + r.width / 2,
                ty: r.top + r.height / 2,
            };
        });
    }

    /** outline one element per rect, numbered 1…n */
    function showAt(where: ReturnType<typeof rect>[]) {
        const els = where.map(() => {
            const el = document.createElement("div");
            document.body.appendChild(el);
            return el;
        });
        setCurrentCapture("c1");
        showHighlights(
            els.map((_, i) => ({
                id: `n${i}`,
                role: "target" as const,
                badge: `${i + 1}`,
            })),
            new Map(els.map((el, i) => [`n${i}`, el])),
            "c1",
            nextToken(),
            { measure: (el) => where[els.indexOf(el as HTMLDivElement)] },
        );
    }

    it("draws each cue aimed at its target from where it lands, clear of the chat, at the cue size", () => {
        updateSetting("offscreenCue", "edge");
        updateSetting("cueSize", 96);
        // the chat popover covers the bottom-right, where every cue wants to be
        const chat = { left: 600, top: 400, right: 1024, bottom: 768 };
        const root = document.createElement("div");
        root.id = "unilens-root";
        const panel = document.createElement("div");
        panel.getBoundingClientRect = () =>
            ({
                ...chat,
                width: chat.right - chat.left,
                height: chat.bottom - chat.top,
            }) as DOMRect;
        root.appendChild(panel);
        document.body.appendChild(root);
        const where = [
            rect(1500, 1400, 40, 20),
            rect(1600, 1300, 40, 20),
            rect(1550, 1500, 40, 20),
        ];
        showAt(where);
        const cues = drawnCues(where);
        expect(cues).toHaveLength(3);
        expect(cues[0].size).toBe(96);
        expect(cues[0].el.closest("#unilens-highlight-layer")).not.toBeNull();
        expectSettled(
            cues,
            { w: window.innerWidth, h: window.innerHeight },
            chat,
            96,
        );
        // a size change re-lays the same elements at the new size
        updateSetting("cueSize", 64);
        relayNow();
        const after = drawnCues(where);
        expect(after.map((c) => c.el)).toEqual(cues.map((c) => c.el));
        expect(after[0].size).toBe(64);
        expectSettled(
            after,
            { w: window.innerWidth, h: window.innerHeight },
            chat,
            64,
        );
    });

    it("draws pointer cues on the pointer's circle over the chat, never taking clicks", () => {
        updateSetting("offscreenCue", "pointer");
        init();
        const from = { x: 500, y: window.innerHeight - 5 };
        window.dispatchEvent(
            new MouseEvent("mousemove", { clientX: from.x, clientY: from.y }),
        );
        // the chat sits under the pointer
        const chat = { left: 300, top: 500, right: 800, bottom: 768 };
        const root = document.createElement("div");
        root.id = "unilens-root";
        const panel = document.createElement("div");
        panel.getBoundingClientRect = () =>
            ({
                ...chat,
                width: chat.right - chat.left,
                height: chat.bottom - chat.top,
            }) as DOMRect;
        root.appendChild(panel);
        document.body.appendChild(root);
        const where = [
            rect(480, 3000, 40, 20),
            rect(-3000, 700, 40, 20),
            rect(3000, -2000, 40, 20),
        ];
        showAt(where);
        const cues = drawnCues(where);
        expect(cues).toHaveLength(3);
        expectAimed(cues);
        cues.forEach((c, i) => {
            const want = cuePosition(
                "pointer",
                where[i],
                { w: window.innerWidth, h: window.innerHeight },
                from,
                90,
                72,
            );
            expect(c.x).toBeCloseTo(want.x);
            expect(c.y).toBeCloseTo(want.y);
            expect(Math.hypot(c.x - from.x, c.y - from.y)).toBeCloseTo(90);
            expect(c.el.style.pointerEvents).toBe("none");
        });
        // their own layer over the highlights, under the chat, and never taking a click
        const host = cues[0].el.parentElement as HTMLElement;
        expect(host.parentElement).toBe(document.documentElement);
        expect(host.style.zIndex).toBe("2147483646");
        expect(host.style.pointerEvents).toBe("none");
        expect(cues[0].el.closest("#unilens-highlight-layer")).toBeNull();
        // the chat going away moves nothing
        root.remove();
        relayNow();
        const after = drawnCues(where);
        after.forEach((c, i) => {
            expect(c.x).toBeCloseTo(cues[i].x);
            expect(c.y).toBeCloseTo(cues[i].y);
        });
        // back to edge cues: they return to the highlight layer, under the chat
        updateSetting("offscreenCue", "edge");
        relayNow();
        expect(
            document
                .querySelector(".unilens-hl-cue")
                ?.closest("#unilens-highlight-layer"),
        ).not.toBeNull();
        expect(document.querySelectorAll(".unilens-hl-cues")).toHaveLength(1);
    });
});
