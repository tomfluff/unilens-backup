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
    acquireTextSizeStyles,
    readOriginalFontPx,
    releaseTextSizeStyles,
    remeasureTextSizes,
    storedOriginalFontPx,
    TEXT_SIZE_CSS,
    TEXT_SIZE_PROBE_ATTR,
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

    it("rounds the computed size to the precision it is recorded at", () => {
        // 10pt form controls compute to 13.3333px; the stored original is
        // 13.33, so the first read must agree or every rescan re-applies.
        expect(readOriginalFontPx(el({}, 13.333333))).toBe(13.33);
    });
});

describe("re-measuring host sizes (resize / root size change)", () => {
    it("the shared rule is switched off while probing", () => {
        expect(TEXT_SIZE_CSS).toContain(`html:not([${TEXT_SIZE_PROBE_ATTR}])`);
    });

    it("reads each marked node with the rule off, updates its record, and rescans", () => {
        const htmlAttrs = new Set<string>();
        const attrs: Record<string, string> = {
            [PAGE_FONT_ORIGINAL_ATTR]: "20",
            [SMALL_BOOST_ORIGINAL_ATTR]: "20",
        };
        const node = {
            hasAttribute: (k: string) => k in attrs,
            setAttribute: (k: string, v: string) => {
                attrs[k] = v;
            },
        };
        let probedReads = 0;
        vi.stubGlobal("getComputedStyle", () => {
            if (htmlAttrs.has(TEXT_SIZE_PROBE_ATTR)) probedReads++;
            // host's own size after a breakpoint: 12px; enlarged size: 30px
            return { fontSize: htmlAttrs.has(TEXT_SIZE_PROBE_ATTR) ? "12px" : "30px" };
        });
        vi.stubGlobal("document", {
            documentElement: {
                setAttribute: (k: string) => htmlAttrs.add(k),
                removeAttribute: (k: string) => htmlAttrs.delete(k),
            },
            querySelectorAll: () => [node],
            getElementById: () => ({ remove: () => undefined }),
            head: null,
        });
        vi.stubGlobal("window", {
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            clearTimeout: () => undefined,
        });
        const rescan = vi.fn();
        acquireTextSizeStyles("smallBoost", rescan);
        remeasureTextSizes();
        expect(probedReads).toBe(1);
        expect(htmlAttrs.has(TEXT_SIZE_PROBE_ATTR)).toBe(false);
        expect(attrs[PAGE_FONT_ORIGINAL_ATTR]).toBe("12");
        expect(attrs[SMALL_BOOST_ORIGINAL_ATTR]).toBe("12");
        expect(attrs[BODY_EXPAND_ORIGINAL_ATTR]).toBeUndefined();
        expect(rescan).toHaveBeenCalledTimes(1);
        releaseTextSizeStyles("smallBoost");
    });
});
