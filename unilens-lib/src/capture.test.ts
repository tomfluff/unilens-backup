import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    type CaptureMeta,
    drawClick,
    drawTrail,
    FONT_PROBE_GUARD_CSS,
    getLastInventoryDebug,
    guardFontProbe,
    MARK,
    pageChangedSince,
    recordInventoryDebug,
    TRAIL_RGB,
    viewMovedSince,
} from "./capture";
import {
    buildInventory,
    inventoryOptionsFrom,
    type WireNode,
} from "./inventory";
import { getSettings } from "./settings";

const wire: WireNode[] = [
    { i: "n0", r: "landmark", n: "", b: [0, 0, 10, 10], v: 1 },
    { i: "n1", r: "button", n: "Sign up", b: [0, 0, 5, 5], v: 1, p: "n0" },
];

describe("getLastInventoryDebug", () => {
    it("is null until a capture records an inventory", () => {
        expect(getLastInventoryDebug()).toBeNull();
    });

    it("reports node count, bytes and dropped count of the last capture", () => {
        recordInventoryDebug({ wire, bytes: 1234, truncated: 3 });
        expect(getLastInventoryDebug()).toMatchObject({
            nodes: 2,
            bytes: 1234,
            truncated: 3,
        });
        expect(getLastInventoryDebug()?.at).toBeTypeOf("number");
    });

    it("clears when a capture runs with the inventory off", () => {
        recordInventoryDebug(undefined);
        expect(getLastInventoryDebug()).toBeNull();
    });
});

describe("guardFontProbe", () => {
    it("pins html2canvas's 1x1 baseline probe against host img rules, then removes itself", () => {
        const host = document.createElement("style");
        host.textContent = "img { height: 260px }";
        document.head.appendChild(host);
        const probe = document.createElement("img");
        probe.src =
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        document.body.appendChild(probe);

        const unguard = guardFontProbe();
        expect(getComputedStyle(probe).height).toBe("1px");
        expect(document.head.lastElementChild?.textContent).toBe(
            FONT_PROBE_GUARD_CSS,
        );

        unguard();
        expect(getComputedStyle(probe).height).toBe("260px");
        host.remove();
        probe.remove();
    });
});

describe("viewMovedSince", () => {
    // jsdom: view at (0, 0), zoom 1, no pinch
    const meta = (over: Partial<CaptureMeta>) =>
        ({
            scrollX: 0,
            scrollY: 0,
            viewportW: 1000,
            viewportH: 800,
            zoom: 1,
            pinchZoom: 1,
            ...over,
        }) as CaptureMeta;

    it("ignores small scrolls and flags a real move or a zoom change", () => {
        expect(viewMovedSince(meta({}))).toBe(false);
        expect(viewMovedSince(meta({ scrollY: 150 }))).toBe(false);
        expect(viewMovedSince(meta({ scrollY: 400 }))).toBe(true);
        expect(viewMovedSince(meta({ scrollX: 300 }))).toBe(true);
        expect(viewMovedSince(meta({ zoom: 2 }))).toBe(true);
    });
});

describe("pageChangedSince", () => {
    const take = () =>
        buildInventory(
            document.body,
            inventoryOptionsFrom(getSettings(), { w: 1000, h: 1000 }),
        );
    const measure = Element.prototype.getBoundingClientRect;
    // jsdom lays nothing out: every element measures as a visible 10x10 box
    beforeEach(() => {
        Element.prototype.getBoundingClientRect = () =>
            DOMRect.fromRect({ x: 0, y: 0, width: 10, height: 10 });
    });
    afterEach(() => {
        Element.prototype.getBoundingClientRect = measure;
        document.body.innerHTML = "";
    });

    it("flags new, gone, swapped or changed elements, not a regrouping around them", () => {
        document.body.innerHTML =
            '<main><button aria-expanded="false">Plans</button><a href="/a">Fees</a></main>';
        const { wire, registry } = take();
        const before = { inventory: wire, registry };
        expect(pageChangedSince(before)).toBe(false);
        // the same elements, moved, with a container regrouped around them
        const moved = wire.map((n) => ({ ...n, b: [5, 5, 1, 1], v: 0 }));
        const regrouped = [
            ...(moved as WireNode[]),
            { i: "n99", r: "container", n: "", b: [0, 0, 1, 1], v: 1 },
        ] as WireNode[];
        expect(pageChangedSince({ inventory: regrouped, registry })).toBe(
            false,
        );
        // a click opened a panel: the button's state changed
        document.querySelector("button")?.setAttribute("aria-expanded", "true");
        expect(pageChangedSince(before)).toBe(true);
        document
            .querySelector("button")
            ?.setAttribute("aria-expanded", "false");
        // a tab put in a link of the same name, in the same place
        const fees = document.querySelector("a");
        fees?.replaceWith(fees.cloneNode(true));
        expect(pageChangedSince(before)).toBe(true);
        // a new element
        const now = take();
        document
            .querySelector("main")
            ?.insertAdjacentHTML("beforeend", '<a href="/b">Apply</a>');
        expect(
            pageChangedSince({ inventory: now.wire, registry: now.registry }),
        ).toBe(true);
        expect(pageChangedSince({})).toBe(false);
    });
});

describe("the marks (R3 of the 2026-09-27 report)", () => {
    /** a canvas context that records what is stroked and filled, in what colour */
    function recorder() {
        const drawn: string[] = [];
        const ctx = {
            strokeStyle: "",
            fillStyle: "",
            lineWidth: 0,
            lineCap: "",
            lineJoin: "",
            beginPath() {},
            arc() {},
            moveTo() {},
            lineTo() {},
            stroke() {
                drawn.push(`stroke ${ctx.strokeStyle} ${ctx.lineWidth}`);
            },
            fill() {
                drawn.push(`fill ${ctx.fillStyle}`);
            },
        };
        return { ctx: ctx as unknown as CanvasRenderingContext2D, drawn };
    }

    it("the click: a white-edged magenta ring, with a dot on the full page only", () => {
        const full = recorder();
        drawClick(full.ctx, 100, 100, 1, true);
        expect(full.drawn).toEqual([
            `stroke ${MARK.edge} 8`,
            `stroke ${MARK.click} 4`,
            `fill ${MARK.edge}`,
            `fill ${MARK.click}`,
        ]);
        const close = recorder();
        drawClick(close.ctx, 100, 100, 2, false);
        expect(close.drawn).toEqual([
            `stroke ${MARK.edge} 16`,
            `stroke ${MARK.click} 8`,
        ]);
    });

    it("the trail: in the chosen colour, over a dark edge, brightest at its end", () => {
        const { ctx, drawn } = recorder();
        const pts = [0, 1, 2].map((i) => ({ x: i * 10, y: 0, t: i * 100 }));
        drawTrail(ctx, pts, 1, "lime");
        expect(drawn).toHaveLength(4); // two segments, each with its edge
        expect(drawn[0]).toMatch(/^stroke rgba\(0, 0, 0,/);
        expect(drawn.at(-1)).toBe(`stroke rgba(${TRAIL_RGB.lime}, 1.00) 6`);
    });
});
