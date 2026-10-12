import { beforeEach, describe, expect, it } from "vitest";
import {
    initClickMarks,
    markedPlace,
    markPlace,
    markPoint,
    relayMarks,
} from "./clickMarks";
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
    updateSetting("hlColor", "#ffd400");
    updateSetting("hlBadges", "small");
    updateSetting("clickMark", "spot");
    updateSetting("clickMarkStyle", "tag");
    updateSetting("hlOutline", "ring");
    updateSetting("ringWidth", 2);
    updateSetting("chatStyle", "assistant");
    clearPlaces();
    document.body.innerHTML = "";
});

describe("lasting click marks", () => {
    it("marks the latest click only, with its number as the chat has it", () => {
        recordPlace(place("a", 10, 20));
        recordPlace(place("b", 30, 40));
        // one at a time: the new click's mark shows, the earlier one hides
        expect(marks().map((_, i) => part(i, "num").textContent)).toEqual([
            "P2",
        ]);
        expect(part(0, "dot").style.left).toBe("30px");
        expect(part(0, "dot").style.top).toBe("40px");
        expect(marks()[0].style.getPropertyValue("--ul-mark")).toBe("#ffd400");
    });

    it("shows the place whose P entry is pressed, and none when pressed again", () => {
        const a = place("a", 10, 20);
        recordPlace(a);
        recordPlace(place("b", 30, 40));
        markPlace(a);
        relayMarks();
        expect(marks().map((_, i) => part(i, "num").textContent)).toEqual([
            "P1",
        ]);
        expect(markedPlace()).toBe(a);
        markPlace(null);
        relayMarks();
        expect(marks()).toHaveLength(0);
        // "None": no marks, and none is marked
        markPlace(a);
        updateSetting("clickMark", "none");
        relayMarks();
        expect(marks()).toHaveLength(0);
        expect(markedPlace()).toBeNull();
    });

    it("never marks the floating button's place", () => {
        recordPlace({ ...place("a", 10, 20), byButton: true });
        expect(marks()).toHaveLength(0);
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
        expect([shown("dot"), shown("box")]).toEqual([true, false]);
        updateSetting("clickMark", "element");
        relayMarks();
        expect([shown("dot"), shown("box")]).toEqual([false, true]);
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
        updateSetting("clickMark", "both");
        relayMarks();
        expect([shown("dot"), shown("box")]).toEqual([true, true]);
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
        updateSetting("clickMark", "element");
        relayMarks();
        expect([shown("dot"), shown("box")]).toEqual([true, false]);
    });

    it("sits over the highlights' outlines and under their numbers", () => {
        recordPlace(place("a", 10, 20));
        const layer = document.getElementById("unilens-click-marks");
        // in the highlights' layer, at a level between their outlines (none) and
        // their numbers (3)
        expect(layer?.parentElement?.id).toBe("unilens-highlight-layer");
        expect(getComputedStyle(layer as Element).zIndex).toBe("2");
        // within a mark: the outline, the ring and dot, then the number on top
        const kids = [...marks()[0].children].map((e) => e.className);
        expect(kids.at(-1)).toContain("unilens-mark-num");
        expect(kids[0]).toBe("unilens-mark-box");
    });

    it("goes when the conversation starts over, or the setting is off", () => {
        recordPlace(place("a", 10, 20));
        clearPlaces();
        expect(marks()).toHaveLength(0);
        recordPlace(place("b", 10, 20));
        expect(marks()).toHaveLength(1);
        updateSetting("clickMark", "none");
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
        expect(part(0, "dot").style.top).toBe("110px");
        top = 300;
        (el.firstChild as Text).data = "a much longer text";
        await new Promise((r) => setTimeout(r, 50));
        expect(part(0, "dot").style.top).toBe("310px");
    });

    it("marks the spot in the style chosen", () => {
        recordPlace(place("a", 100, 200));
        const shown = (c: string) => part(0, c).style.display !== "none";
        const parts = () =>
            ["pin", "dot", "halo", "line", "num"].filter(shown).join(" ");
        expect(parts()).toBe("dot line num");
        // the line runs from the number's corner to the dot's edge
        const l = part(0, "line").querySelector(".c") as SVGLineElement;
        expect(l.getAttribute("x1")).toBe("120");
        expect(l.getAttribute("y1")).toBe("180");
        expect(Number(l.getAttribute("x2"))).toBeCloseTo(100 + 7 / Math.SQRT2);
        // two-tone: a white edge under a dark core
        expect(part(0, "line").querySelectorAll("line")).toHaveLength(2);
        updateSetting("clickMarkStyle", "tagClear");
        relayMarks();
        expect(part(0, "dot").hasAttribute("data-clear")).toBe(true);
        updateSetting("clickMarkStyle", "pin");
        relayMarks();
        // the number is in the pin
        expect(parts()).toBe("pin");
        expect(part(0, "pin").textContent).toBe("P1");
        updateSetting("clickMarkStyle", "halo");
        relayMarks();
        expect(parts()).toBe("halo line num");
        // the line stops short of the spot, inside the halo
        const h = part(0, "line").querySelector(".c") as SVGLineElement;
        expect(Number(h.getAttribute("x2"))).toBeCloseTo(100 + 20 / Math.SQRT2);
        updateSetting("clickMarkStyle", "line");
        relayMarks();
        expect(parts()).toBe("line num");
    });

    it("turns the number away from the window's top edge", () => {
        recordPlace(place("a", 100, 5));
        const l = part(0, "line").querySelector(".c") as SVGLineElement;
        // below the spot, not above it
        expect(Number(l.getAttribute("y1"))).toBeGreaterThan(5);
        // the pin turns over: its tip up on the spot, the number below
        updateSetting("clickMarkStyle", "pin");
        relayMarks();
        expect(part(0, "pin").style.translate).toBe("-50% 0");
        expect(part(0, "pin").querySelector("text")?.getAttribute("y")).toBe(
            "38",
        );
    });
});
