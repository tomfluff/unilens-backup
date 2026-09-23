import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    announce,
    clearHighlights,
    escapeAction,
    hasHighlight,
    init,
    nextToken,
    onHighlightsCleared,
    registerPopoverClose,
    relayNow,
    setCurrentCapture,
    showHighlights,
} from "./highlight";
import type { HighlightPreset } from "./highlightStyles";
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
    updateSetting("highlightStyle", "wcag-ring");
    updateSetting("ringWidth", 2);
    updateSetting("ringScale", false);
});

describe("showHighlights", () => {
    it("draws with the default preset when the store holds an unknown style", () => {
        const { registry } = mount();
        // bypasses clampSetting on purpose: the fallback is for a hot store edit
        useSettings.setState({ highlightStyle: "nope" as HighlightPreset });
        expect(show(registry, ["n1"], "Choose Pro")).toBe(true);
        expect((layerBoxes()[0] as HTMLElement).style.border).toContain(
            "2px solid",
        );
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

    it("applies fill, glow and dim from the preset", () => {
        updateSetting("highlightStyle", "dim-yellow-glow");
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
        updateSetting("highlightStyle", "dim-others");
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
        const dim = document.querySelector(".unilens-hl-dim") as HTMLElement;
        expect(dim.style.clipPath).toContain("evenodd");
        expect(dim.style.clipPath).toContain("M10 20h30v40h-30Z");
        expect(dim.style.clipPath).toContain("M300 400h50v60h-50Z");
        const badges = [...document.querySelectorAll(".unilens-hl-badge")];
        expect(badges.map((x) => x.textContent)).toEqual(["1", "2"]);
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
