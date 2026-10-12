import { beforeEach, describe, expect, it } from "vitest";
import { initClickMarks, markPoint, relayMarks } from "./clickMarks";
import { clearPlaces, clickOffset, type Place, recordPlace } from "./places";
import { updateSetting } from "./settings";

const marks = () => [
    ...document.querySelectorAll<HTMLElement>(
        "#unilens-click-marks .unilens-mark",
    ),
];
const part = (i: number, c: string) =>
    marks()[i].querySelector(`.unilens-mark-${c}`) as HTMLElement;
const place = (id: string, x: number, y: number, el?: Element): Place => ({
    captureId: id,
    at: 1,
    x,
    y,
    el,
    label: id,
});

beforeEach(() => {
    initClickMarks();
    updateSetting("clickMarks", true);
    updateSetting("hlColor", "#ffd400");
    updateSetting("hlBadges", "small");
    updateSetting("clickMarkTarget", "spot");
    updateSetting("hlOutline", "ring");
    updateSetting("ringWidth", 2);
    updateSetting("chatStyle", "assistant");
    clearPlaces();
    document.body.innerHTML = "";
});

describe("lasting click marks", () => {
    it("marks each click with its number, as the chat does", () => {
        recordPlace(place("a", 10, 20));
        recordPlace(place("b", 30, 40));
        expect(marks().map((m) => m.textContent)).toEqual(["P1", "P2"]);
        expect(part(1, "ring").style.left).toBe("30px");
        expect(part(1, "ring").style.top).toBe("40px");
        expect(marks()[0].style.getPropertyValue("--ul-mark")).toBe("#ffd400");
    });

    it("wears the source numbers' look and size, with its P", () => {
        updateSetting("hlBadges", "large");
        recordPlace(place("a", 10, 20));
        const num = part(0, "num");
        expect(num.textContent).toBe("P1");
        expect(num.style.height).toBe("42px");
        expect(num.style.background).toContain("37, 99, 235"); // #2563eb
        // hidden source numbers: the mark's still shows, at the smallest
        updateSetting("hlBadges", "none");
        relayMarks();
        expect(part(0, "num").style.height).toBe("24px");
    });

    it("marks the spot, what was clicked, or both", () => {
        const el = document.createElement("button");
        document.body.appendChild(el);
        el.getBoundingClientRect = () =>
            ({
                left: 0,
                top: 100,
                width: 200,
                height: 50,
                right: 200,
                bottom: 150,
            }) as DOMRect;
        recordPlace(place("a", 20, 110, el));
        const shown = (c: string) => part(0, c).style.display !== "none";
        expect([shown("ring"), shown("box")]).toEqual([true, false]);
        updateSetting("clickMarkTarget", "element");
        relayMarks();
        expect([shown("ring"), shown("box")]).toEqual([false, true]);
        // outlined as a highlight is: the ring's black outer band
        expect(part(0, "box").style.outline).toContain("solid");
        const top = Number.parseFloat(part(0, "box").style.top);
        expect(top).toBeLessThan(100);
        // the number above the outline's right end, clear of the ring as drawn
        const box = part(0, "box").style;
        const num = part(0, "num").style;
        expect(Number.parseFloat(num.left)).toBeGreaterThan(200);
        expect(Number.parseFloat(num.top)).toBeLessThan(
            Number.parseFloat(box.top) - Number.parseFloat(box.outline),
        );
        expect(num.translate).toBe("-100% -100%");
        // a wider stroke draws it again
        const before = part(0, "box").style.outline;
        updateSetting("ringWidth", 6);
        relayMarks();
        expect(part(0, "box").style.outline).not.toBe(before);
        updateSetting("ringWidth", 2);
        relayMarks();
        // off the screen: no number held at its edge
        el.getBoundingClientRect = () =>
            ({
                left: 2000,
                top: 100,
                width: 200,
                height: 50,
                right: 2200,
                bottom: 150,
            }) as DOMRect;
        relayMarks();
        expect(part(0, "num").style.display).toBe("none");
        el.getBoundingClientRect = () =>
            ({
                left: 0,
                top: 100,
                width: 200,
                height: 50,
                right: 200,
                bottom: 150,
            }) as DOMRect;
        relayMarks();
        // a scroll moves it without drawing it again
        el.getBoundingClientRect = () =>
            ({
                left: 0,
                top: 40,
                width: 200,
                height: 50,
                right: 200,
                bottom: 90,
            }) as DOMRect;
        relayMarks();
        expect(Number.parseFloat(part(0, "box").style.top)).toBeCloseTo(
            top - 60,
        );
        updateSetting("clickMarkTarget", "both");
        relayMarks();
        expect([shown("ring"), shown("box")]).toEqual([true, true]);
        // a whole section is not outlined: its spot is marked instead
        el.getBoundingClientRect = () =>
            ({
                left: 0,
                top: 0,
                width: 2000,
                height: 3000,
                right: 2000,
                bottom: 3000,
            }) as DOMRect;
        updateSetting("clickMarkTarget", "element");
        relayMarks();
        expect([shown("ring"), shown("box")]).toEqual([true, false]);
    });

    it("is drawn over the highlights, made after it", async () => {
        recordPlace(place("a", 10, 20));
        const hl = document.createElement("div");
        hl.id = "unilens-highlight-layer";
        document.documentElement.appendChild(hl);
        await new Promise((r) => setTimeout(r, 50));
        const layer = document.getElementById("unilens-click-marks");
        expect(hl.nextElementSibling).toBe(layer);
        hl.remove();
    });

    it("goes when the conversation starts over, or the setting is off", () => {
        recordPlace(place("a", 10, 20));
        clearPlaces();
        expect(marks()).toHaveLength(0);
        recordPlace(place("b", 10, 20));
        expect(marks()).toHaveLength(1);
        updateSetting("clickMarks", false);
        relayMarks();
        expect(marks()).toHaveLength(0);
        expect(document.getElementById("unilens-click-marks")).toBeNull();
    });

    it("follows what was clicked when it moves", () => {
        const el = document.createElement("p");
        document.body.appendChild(el);
        let box = { left: 0, top: 100, width: 200, height: 50 };
        el.getBoundingClientRect = () =>
            ({
                ...box,
                right: box.left + box.width,
                bottom: box.top + box.height,
            }) as DOMRect;
        const p = place("a", 20, 110, el);
        recordPlace(p);
        expect(markPoint(p)).toEqual({ x: 20, y: 110 });
        // a section opened above it: the paragraph is 300px lower now
        box = { ...box, top: 400 };
        expect(markPoint(p)).toEqual({ x: 20, y: 410 });
        // gone from the page: the point it was clicked at
        el.remove();
        expect(markPoint(p)).toEqual({ x: 20, y: 110 });
    });

    it("keeps where in the element it was clicked, measured at the click", () => {
        const el = document.createElement("p");
        document.body.appendChild(el);
        let box = { left: 0, top: 100, width: 200, height: 50 };
        el.getBoundingClientRect = () =>
            ({
                ...box,
                right: box.left + box.width,
                bottom: box.top + box.height,
            }) as DOMRect;
        const offset = clickOffset(el, 20, 110);
        expect(offset).toEqual({ x: 20, y: 10 });
        // the page moved while the capture uploaded
        box = { ...box, top: 400 };
        const p = { ...place("a", 20, 110, el), offset };
        recordPlace(p);
        expect(markPoint(p)).toEqual({ x: 20, y: 410 });
        // away from the page when the place was made, then back: still the offset
        const q = { ...place("b", 20, 110, el), offset };
        el.remove();
        recordPlace(q);
        document.body.appendChild(el);
        expect(markPoint(q)).toEqual({ x: 20, y: 410 });
        // outside the element: no offset
        expect(clickOffset(el, 20, 90)).toBeUndefined();
    });

    it("moves when a text edit moves what was clicked", async () => {
        const el = document.createElement("p");
        el.textContent = "short";
        document.body.appendChild(el);
        let top = 100;
        el.getBoundingClientRect = () =>
            ({
                left: 0,
                top,
                width: 200,
                height: 50,
                right: 200,
                bottom: top + 50,
            }) as DOMRect;
        recordPlace(place("a", 20, 110, el));
        expect(part(0, "ring").style.top).toBe("110px");
        top = 300;
        (el.firstChild as Text).data = "a much longer text";
        await new Promise((r) => setTimeout(r, 50));
        expect(part(0, "ring").style.top).toBe("310px");
    });
});
