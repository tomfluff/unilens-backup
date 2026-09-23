import { describe, expect, it } from "vitest";
import {
    type CaptureMeta,
    FONT_PROBE_GUARD_CSS,
    getLastInventoryDebug,
    guardFontProbe,
    recordInventoryDebug,
    viewMovedSince,
} from "./capture";
import type { WireNode } from "./inventory";

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
