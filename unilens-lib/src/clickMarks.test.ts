import { beforeEach, describe, expect, it } from "vitest";
import { initClickMarks, markPoint, relayMarks } from "./clickMarks";
import { clearPlaces, clickOffset, type Place, recordPlace } from "./places";
import { updateSetting } from "./settings";

const marks = () => [
    ...document.querySelectorAll<HTMLElement>(
        "#unilens-click-marks .unilens-mark",
    ),
];
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
    clearPlaces();
    document.body.innerHTML = "";
});

describe("lasting click marks", () => {
    it("marks each click with its number, as the chat does", () => {
        recordPlace(place("a", 10, 20));
        recordPlace(place("b", 30, 40));
        expect(marks().map((m) => m.textContent)).toEqual(["P1", "P2"]);
        expect(marks()[1].style.left).toBe("30px");
        expect(marks()[1].style.top).toBe("40px");
        expect(marks()[0].style.getPropertyValue("--ul-mark")).toBe("#ffd400");
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
        expect(marks()[0].style.top).toBe("110px");
        top = 300;
        (el.firstChild as Text).data = "a much longer text";
        await new Promise((r) => setTimeout(r, 50));
        expect(marks()[0].style.top).toBe("310px");
    });
});
