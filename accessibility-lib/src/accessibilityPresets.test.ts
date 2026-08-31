import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    HTML_ATTR_CONTRAST,
    HTML_ATTR_FOCUS_ENHANCE,
    HTML_ATTR_LINK_UNDERLINE,
    HTML_ATTR_REDUCE_MOTION,
    HTML_ATTR_SATURATION,
    HTML_ATTR_THEME,
    HTML_STYLE_CONTRAST,
    HTML_STYLE_LETTER_SPACING,
    HTML_STYLE_SATURATE,
} from "./domIds";

vi.mock("./autoTextSize", () => ({
    runAutoTextAction: vi.fn(),
}));

/** Sets up the minimal DOM that applyA11yToDocument touches (vitest has no DOM by default). */
function installDomStub() {
    const attrs = new Map<string, string>();
    const styleProps = new Map<string, string>();
    const html = {
        setAttribute: (key: string, value: string) => attrs.set(key, value),
        removeAttribute: (key: string) => attrs.delete(key),
        getAttribute: (key: string) => attrs.get(key) ?? null,
        style: {
            setProperty: (key: string, value: string) =>
                styleProps.set(key, value),
            getPropertyValue: (key: string) => styleProps.get(key) ?? "",
        },
    };
    const doc = {
        documentElement: html,
        getElementById: () => null,
        createElement: () => ({
            id: "",
            rel: "",
            href: "",
        }),
        head: { appendChild: () => undefined },
    };
    vi.stubGlobal("document", doc);
    return { attrs, styleProps, html };
}

import {
    A11Y_DEFAULTS,
    SATURATION_FILTER,
    a11ySettings,
    applyA11yToDocument,
    getA11ySettings,
    patchA11ySettings,
    resetA11ySettings,
} from "./accessibilityStore";
import {
    A11Y_PRESET_IDS,
    A11Y_PRESETS,
    applyA11yPreset,
    isPresetActive,
    toggleA11yPreset,
} from "./accessibilityPresets";
import { runAutoTextAction } from "./autoTextSize";
import { BODY_TEXT_EXPAND_CONFIG } from "./textAdjustLevels";

describe("accessibility presets", () => {
    beforeEach(() => {
        installDomStub();
        resetA11ySettings();
        vi.mocked(runAutoTextAction).mockClear();
    });

    it("defines 6 presets", () => {
        expect(A11Y_PRESET_IDS).toEqual([
            "lowVision",
            "colorVision",
            "mild",
            "senior",
            "highContrast",
            "focus",
        ]);
    });

    it("low-vision preset goes bigger, roomier, and crisper", () => {
        applyA11yPreset("lowVision");
        expect(a11ySettings.fontSize).toBe("xlarge");
        expect(a11ySettings.letterSpacing).toBe("wide");
        expect(a11ySettings.focusEnhance).toBe(true);
        expect(isPresetActive("lowVision")).toBe(true);
        expect(runAutoTextAction).toHaveBeenCalledWith("reset");
    });

    it("mild preset is cream theme, 50% saturation, animations stopped", () => {
        applyA11yPreset("mild");
        expect(a11ySettings.theme).toBe("soft");
        expect(a11ySettings.saturation).toBe("soft");
        expect(a11ySettings.reduceMotion).toBe(true);
        expect(isPresetActive("mild")).toBe(true);
    });

    it("senior preset expands body text and boosts contrast", () => {
        applyA11yPreset("senior");
        expect(a11ySettings.bodyTextExpandLevel).toBe(2);
        expect(a11ySettings.contrast).toBe("strong");
        expect(a11ySettings.linkUnderline).toBe(true);
    });

    it("high-contrast preset uses max contrast black/yellow theme", () => {
        applyA11yPreset("highContrast");
        expect(a11ySettings.theme).toBe("high-contrast");
        expect(a11ySettings.contrast).toBe("max");
    });

    it("focus preset widens line height and desaturates", () => {
        applyA11yPreset("focus");
        expect(a11ySettings.lineHeight).toBe("wide");
        expect(a11ySettings.saturation).toBe("mono");
    });

    it("toggle turns a preset off and restores its fields", () => {
        applyA11yPreset("highContrast");
        toggleA11yPreset("highContrast");
        expect(a11ySettings.theme).toBe("standard");
        expect(isPresetActive("highContrast")).toBe(false);
    });

    it("toggle clears body expand and link underline when turning senior off", () => {
        applyA11yPreset("senior");
        toggleA11yPreset("senior");
        expect(a11ySettings.bodyTextExpandLevel).toBe(0);
        expect(a11ySettings.linkUnderline).toBe(false);
    });

    it("letter-spacing alone does not set legacy font-active flag", () => {
        const stub = installDomStub();
        patchA11ySettings({ letterSpacing: "wide" });
        applyA11yToDocument();
        expect(
            stub.html.getAttribute("data-unilens-a11y-font-active"),
        ).toBeNull();
        expect(stub.html.getAttribute("data-unilens-a11y-font-size")).toBe(
            "standard",
        );
        expect(stub.html.getAttribute("data-unilens-a11y-line-height")).toBe(
            "standard",
        );
        expect(stub.html.getAttribute("data-unilens-a11y-letter-spacing")).toBe(
            "wide",
        );
    });

    it("applyA11yToDocument writes prefixed html attributes and css vars", () => {
        const stub = installDomStub();
        patchA11ySettings({
            linkUnderline: true,
            focusEnhance: true,
            reduceMotion: true,
            letterSpacing: "wide",
            theme: "soft",
            saturation: "soft",
        });
        applyA11yToDocument();
        expect(stub.html.getAttribute(HTML_ATTR_LINK_UNDERLINE)).toBe("true");
        expect(stub.html.getAttribute(HTML_ATTR_FOCUS_ENHANCE)).toBe("true");
        expect(stub.html.getAttribute(HTML_ATTR_REDUCE_MOTION)).toBe("true");
        expect(stub.html.getAttribute(HTML_ATTR_THEME)).toBe("soft");
        expect(stub.html.getAttribute(HTML_ATTR_SATURATION)).toBe("soft");
        expect(stub.html.style.getPropertyValue(HTML_STYLE_SATURATE)).toBe(
            String(SATURATION_FILTER.soft),
        );
        expect(
            stub.html.style.getPropertyValue(HTML_STYLE_LETTER_SPACING),
        ).toBe("0.12em");
        expect(getA11ySettings()).toMatchObject({ theme: "soft" });
        expect(A11Y_DEFAULTS.reduceMotion).toBe(false);
    });
});
