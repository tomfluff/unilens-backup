import { describe, expect, it } from "vitest";
import {
    BACKDROPS,
    colorWithAlpha,
    drawnOutline,
    type HighlightLook,
    isHexColor,
    lookFrom,
    OUTLINES,
} from "./highlightStyles";
import { getSettings } from "./settings";

const look = (over: Partial<HighlightLook>): HighlightLook => ({
    backdrop: "none",
    outline: "band",
    fill: false,
    glow: false,
    badges: true,
    color: "#ffd400",
    ...over,
});

describe("highlight look", () => {
    it("the stored defaults name a real backdrop and outline", () => {
        const l = lookFrom(getSettings());
        expect(Object.hasOwn(BACKDROPS, l.backdrop)).toBe(true);
        expect(Object.hasOwn(OUTLINES, l.outline)).toBe(true);
    });

    it("never draws nothing: no outline and no other layer falls back to the ring", () => {
        expect(drawnOutline(look({ outline: "none" }))).toBe("ring");
        expect(drawnOutline(look({ outline: "none", fill: true }))).toBe(
            "none",
        );
        expect(
            drawnOutline(look({ outline: "none", backdrop: "spotlight" })),
        ).toBe("none");
        expect(drawnOutline(look({ outline: "brackets" }))).toBe("brackets");
    });

    it("keeps a bad stored colour out of the look", () => {
        const s = { ...getSettings(), hlColor: "url(x)" };
        expect(lookFrom(s).color).toBe("#ffd400");
        expect(isHexColor("#abc")).toBe(true);
        expect(isHexColor("abc")).toBe(false);
    });

    it("turns a hex colour into rgba", () => {
        expect(colorWithAlpha("#ff0000", 0.5)).toBe("rgba(255,0,0,0.5)");
        expect(colorWithAlpha("#0f0", 1)).toBe("rgba(0,255,0,1)");
    });
});
