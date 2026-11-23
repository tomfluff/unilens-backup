import { describe, expect, it } from "vitest";
import {
    hasPaintedBackgroundImage,
    rectsOverlap,
} from "./backgroundMediaOverlay";

describe("hasPaintedBackgroundImage", () => {
    it("treats none / empty as unpainted", () => {
        expect(hasPaintedBackgroundImage("")).toBe(false);
        expect(hasPaintedBackgroundImage("none")).toBe(false);
        expect(hasPaintedBackgroundImage("none, none")).toBe(false);
    });

    it("treats url and gradient layers as painted", () => {
        expect(hasPaintedBackgroundImage('url("/recruit/mv.jpg")')).toBe(true);
        expect(
            hasPaintedBackgroundImage(
                "linear-gradient(rgb(255, 255, 255), rgb(255, 255, 255))",
            ),
        ).toBe(true);
        expect(
            hasPaintedBackgroundImage(
                'url("a.webp"), linear-gradient(rgba(0, 0, 0, 0), rgb(0, 0, 0))',
            ),
        ).toBe(true);
    });
});

describe("rectsOverlap", () => {
    const box = (left: number, top: number, right: number, bottom: number) => ({
        left,
        top,
        right,
        bottom,
    });

    it("detects overlapping photo + caption (recruit category cards / MV heading)", () => {
        const photo = box(0, 0, 400, 240);
        const title = box(40, 160, 360, 230);
        expect(rectsOverlap(photo, title)).toBe(true);
    });

    it("ignores a caption sitting fully below the photo", () => {
        const photo = box(0, 0, 400, 240);
        const caption = box(0, 250, 400, 300);
        expect(rectsOverlap(photo, caption)).toBe(false);
    });

    it("treats a text box on its own background-image as overlapping itself", () => {
        const plate = box(10, 10, 200, 80);
        expect(rectsOverlap(plate, plate)).toBe(true);
    });

    it("does not count boxes that only share an edge", () => {
        expect(rectsOverlap(box(0, 0, 100, 100), box(100, 0, 200, 100))).toBe(
            false,
        );
    });
});
