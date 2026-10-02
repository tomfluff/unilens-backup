import { describe, expect, it, vi } from "vitest";
import {
    BODY_EXPAND_ORIGINAL_ATTR,
    BODY_EXPAND_TARGET_VAR,
    PAGE_FONT_ORIGINAL_ATTR,
    PAGE_FONT_TARGET_VAR,
    SMALL_BOOST_ORIGINAL_ATTR,
    SMALL_BOOST_TARGET_VAR,
} from "./domIds";
import {
    readOriginalFontPx,
    storedOriginalFontPx,
    TEXT_SIZE_CSS,
} from "./textSizeLayers";

function el(attrs: Record<string, string>, computedPx = 30) {
    vi.stubGlobal("getComputedStyle", () => ({ fontSize: `${computedPx}px` }));
    return {
        getAttribute: (k: string) => attrs[k] ?? null,
        parentElement: null,
    } as unknown as HTMLElement;
}

describe("shared text-size rule", () => {
    it("paints the largest of the three targets in one !important rule", () => {
        expect(TEXT_SIZE_CSS).toContain("font-size: max(");
        expect(TEXT_SIZE_CSS).toContain(`var(${BODY_EXPAND_TARGET_VAR}, 0px)`);
        expect(TEXT_SIZE_CSS).toContain(`var(${SMALL_BOOST_TARGET_VAR}, 0px)`);
        expect(TEXT_SIZE_CSS.match(/!important/g)).toHaveLength(1);
    });

    it("zeroes each target the element was not given, so none inherit", () => {
        for (const v of [
            PAGE_FONT_TARGET_VAR,
            BODY_EXPAND_TARGET_VAR,
            SMALL_BOOST_TARGET_VAR,
        ]) {
            expect(TEXT_SIZE_CSS).toContain(`{ ${v}: 0px; }`);
        }
    });
});

describe("readOriginalFontPx", () => {
    it("prefers a size another feature already recorded", () => {
        const body = el({ [BODY_EXPAND_ORIGINAL_ATTR]: "14" });
        const small = el({ [SMALL_BOOST_ORIGINAL_ATTR]: "12" });
        const page = el({ [PAGE_FONT_ORIGINAL_ATTR]: "16" });
        expect(readOriginalFontPx(body)).toBe(14);
        expect(readOriginalFontPx(small)).toBe(12);
        expect(readOriginalFontPx(page, 2.6)).toBe(16);
    });

    it("falls back to the computed size", () => {
        expect(storedOriginalFontPx(el({}))).toBeNull();
        expect(readOriginalFontPx(el({}, 18))).toBe(18);
    });
});
