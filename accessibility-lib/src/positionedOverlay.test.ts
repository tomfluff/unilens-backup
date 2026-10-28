import { describe, expect, it } from "vitest";
import {
    hasNonZeroInset,
    isOpaqueBackgroundColor,
    isOwnStyleMutation,
    surfaceInputsKey,
} from "./documentEffects";

function style(
    inset: Partial<Record<"top" | "right" | "bottom" | "left", string>>,
): CSSStyleDeclaration {
    return {
        top: inset.top ?? "auto",
        right: inset.right ?? "auto",
        bottom: inset.bottom ?? "auto",
        left: inset.left ?? "auto",
    } as CSSStyleDeclaration;
}

describe("hasNonZeroInset", () => {
    it("ignores auto and zero offsets", () => {
        expect(hasNonZeroInset(style({}))).toBe(false);
        expect(hasNonZeroInset(style({ top: "0px" }))).toBe(false);
        expect(hasNonZeroInset(style({ top: "auto", left: "0px" }))).toBe(
            false,
        );
    });

    it("detects positive and negative offsets", () => {
        expect(hasNonZeroInset(style({ top: "12rem" }))).toBe(true);
        expect(hasNonZeroInset(style({ top: "-7rem" }))).toBe(true);
        expect(hasNonZeroInset(style({ left: "192px" }))).toBe(true);
    });
});

describe("isOpaqueBackgroundColor", () => {
    it("treats transparent / low-alpha as empty", () => {
        expect(isOpaqueBackgroundColor("transparent")).toBe(false);
        expect(isOpaqueBackgroundColor("rgba(0, 0, 0, 0)")).toBe(false);
        expect(isOpaqueBackgroundColor("rgba(51, 51, 51, 0)")).toBe(false);
        // SoftBank chevron end-cap — must not get a surface fill over the parent border
        expect(isOpaqueBackgroundColor("rgba(255, 255, 255, 0.25)")).toBe(
            false,
        );
    });

    it("treats solid colors as opaque", () => {
        expect(isOpaqueBackgroundColor("rgb(51, 51, 51)")).toBe(true);
        expect(isOpaqueBackgroundColor("rgba(38, 38, 62, 1)")).toBe(true);
        expect(isOpaqueBackgroundColor("rgba(38, 38, 62, 0.95)")).toBe(true);
        expect(isOpaqueBackgroundColor("#333")).toBe(true);
    });

    it("treats a tab still fading out as opaque — sampling must freeze transitions first", () => {
        // SoftBank `.tab-button { transition: all .3s }` from #007ec4 → transparent.
        // ~16ms into the fade is still > 0.9 alpha; a mid-transition sample would
        // keep the previous tab marked and leave its themed ring behind.
        expect(isOpaqueBackgroundColor("rgba(0, 126, 196, 0.95)")).toBe(true);
        expect(isOpaqueBackgroundColor("rgba(0, 126, 196, 0)")).toBe(false);
    });
});

describe("isOwnStyleMutation", () => {
    it("ignores the text-size features' own classes and properties", () => {
        expect(
            isOwnStyleMutation(
                "class",
                "card",
                "card unilens-a11y-page-font unilens-a11y-small-text-boost",
            ),
        ).toBe(true);
        expect(
            isOwnStyleMutation(
                "style",
                "color:red",
                "color: red; --unilens-a11y-page-font-px: 13.33px;",
            ),
        ).toBe(true);
        expect(
            isOwnStyleMutation(
                "style",
                null,
                "--unilens-a11y-target-size: 16px;",
            ),
        ).toBe(true);
    });

    it("reacts to host class and style changes", () => {
        expect(
            isOwnStyleMutation(
                "class",
                "tab unilens-a11y-page-font",
                "tab is-active unilens-a11y-page-font",
            ),
        ).toBe(false);
        expect(
            isOwnStyleMutation(
                "style",
                "--unilens-a11y-page-font-px: 14px;",
                "--unilens-a11y-page-font-px: 14px; display: none;",
            ),
        ).toBe(false);
        expect(isOwnStyleMutation("hidden", null, "")).toBe(false);
        expect(isOwnStyleMutation("src", "a.png", "b.png")).toBe(false);
    });
});

describe("surfaceInputsKey", () => {
    const base = { theme: "dark", linkBackground: false } as const;

    it("changes with the theme and link backgrounds", () => {
        expect(surfaceInputsKey(base)).not.toBe(
            surfaceInputsKey({ ...base, theme: "high-contrast" }),
        );
        expect(surfaceInputsKey(base)).not.toBe(
            surfaceInputsKey({ ...base, linkBackground: true }),
        );
    });

    it("ignores settings that never change a host background", () => {
        const withOthers = {
            ...base,
            linkUnderline: true,
            fontSize: "xlarge",
            readingGuide: true,
        };
        expect(surfaceInputsKey(withOthers)).toBe(surfaceInputsKey(base));
    });

    it("follows the high-contrast plate pair (the fills are worked out against its text color)", () => {
        const hc = { theme: "high-contrast", linkBackground: false } as const;
        expect(
            surfaceInputsKey({ ...hc, textPlateStyle: "blackYellow" }),
        ).not.toBe(surfaceInputsKey({ ...hc, textPlateStyle: "blackCyan" }));
        expect(
            surfaceInputsKey({ ...base, textPlateStyle: "blackYellow" }),
        ).toBe(surfaceInputsKey({ ...base, textPlateStyle: "blackCyan" }));
    });

    it("follows the high-contrast reach, and only in high contrast", () => {
        const hc = { theme: "high-contrast", linkBackground: false } as const;
        expect(surfaceInputsKey({ ...hc, hcTextScope: "text" })).not.toBe(
            surfaceInputsKey({ ...hc, hcTextScope: "parts" }),
        );
        expect(surfaceInputsKey({ ...hc, hcTextScope: "parts" })).not.toBe(
            surfaceInputsKey({ ...hc, hcTextScope: "all" }),
        );
        expect(surfaceInputsKey({ ...base, hcTextScope: "text" })).toBe(
            surfaceInputsKey({ ...base, hcTextScope: "all" }),
        );
    });
});
