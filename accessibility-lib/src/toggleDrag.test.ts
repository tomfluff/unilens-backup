import { describe, expect, it } from "vitest";
import { availablePanelHeight, clampPos, placementFor } from "./toggleDrag";

const vp = { w: 1000, h: 800 };
const sz = { w: 120, h: 44 };

describe("clampPos", () => {
    it("keeps the button fully inside the viewport", () => {
        expect(clampPos({ x: -50, y: -50 }, sz, vp)).toEqual({ x: 8, y: 8 });
        expect(clampPos({ x: 5000, y: 5000 }, sz, vp)).toEqual({
            x: 1000 - 120 - 8,
            y: 800 - 44 - 8,
        });
    });

    it("leaves an in-range position alone", () => {
        expect(clampPos({ x: 300, y: 200 }, sz, vp)).toEqual({
            x: 300,
            y: 200,
        });
    });
});

describe("placementFor", () => {
    it("anchors bottom-right and opens upward for a lower-right button", () => {
        const p = placementFor({ x: 860, y: 740 }, sz, vp);
        expect(p.alignStart).toBe(false);
        expect(p.openDown).toBe(false);
        expect(p.right).toBe("20px");
        expect(p.bottom).toBe("16px");
        expect(p.left).toBe("auto");
        expect(p.top).toBe("auto");
    });

    it("anchors top-left and opens downward for an upper-left button", () => {
        const p = placementFor({ x: 30, y: 40 }, sz, vp);
        expect(p.alignStart).toBe(true);
        expect(p.openDown).toBe(true);
        expect(p.left).toBe("30px");
        expect(p.top).toBe("40px");
        expect(p.right).toBe("auto");
        expect(p.bottom).toBe("auto");
    });
});

describe("availablePanelHeight", () => {
    it("uses the room below when the button is in the upper half", () => {
        // 800 - (40 + 44) - 10 gap - 8 margin
        expect(availablePanelHeight({ x: 30, y: 40 }, sz, vp)).toBe(698);
    });

    it("uses the room above when the button is in the lower half", () => {
        // 600 - 10 gap - 8 margin
        expect(availablePanelHeight({ x: 30, y: 600 }, sz, vp)).toBe(582);
    });

    it("never goes below a usable minimum", () => {
        expect(
            availablePanelHeight({ x: 30, y: 20 }, sz, { w: 1000, h: 80 }),
        ).toBe(160);
    });
});
