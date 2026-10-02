import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    HTML_ATTR_FOCUS_ENHANCE,
    HTML_ATTR_LINK_UNDERLINE,
    HTML_ATTR_REDUCE_MOTION,
    HTML_ATTR_SATURATION,
    HTML_ATTR_TEXT_PLATE,
    HTML_ATTR_TEXT_STROKE,
    HTML_ATTR_THEME,
    HTML_STYLE_DISPLAY_BG,
    HTML_STYLE_DISPLAY_TEXT,
    HTML_STYLE_LETTER_SPACING,
    HTML_STYLE_SATURATE,
    HTML_STYLE_TEXT_PLATE_BG,
    HTML_STYLE_TEXT_PLATE_FG,
    HTML_STYLE_TEXT_STROKE_EDGE,
    HTML_STYLE_TEXT_STROKE_FILL,
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
            getPropertyPriority: () => "",
            removeProperty: (key: string) => styleProps.delete(key),
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
    A11Y_PRESET_IDS,
    applyA11yPreset,
    isPresetActive,
    toggleA11yPreset,
} from "./accessibilityPresets";
import { patchSettings } from "./settings";
import {
    A11Y_DEFAULTS,
    applyA11yToDocument,
    getA11ySettings,
    patchA11ySettings,
    resetA11ySettings,
    SATURATION_FILTER,
} from "./accessibilityStore";
import { runAutoTextAction } from "./autoTextSize";

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
        expect(getA11ySettings().fontSize).toBe("xlarge");
        expect(getA11ySettings().letterSpacing).toBe("wide");
        expect(getA11ySettings().focusEnhanceLevel).toBe(2);
        expect(isPresetActive("lowVision")).toBe(true);
        expect(runAutoTextAction).toHaveBeenCalledWith("reset");
    });

    it("mild preset is cream theme, 50% saturation, animations stopped", () => {
        applyA11yPreset("mild");
        expect(getA11ySettings().theme).toBe("soft");
        expect(getA11ySettings().saturation).toBe("soft");
        expect(getA11ySettings().reduceMotion).toBe(true);
        expect(isPresetActive("mild")).toBe(true);
    });

    it("senior preset expands body text and boosts contrast", () => {
        applyA11yPreset("senior");
        expect(getA11ySettings().bodyTextExpandLevel).toBe(2);
        expect(getA11ySettings().contrast).toBe("strong");
        expect(getA11ySettings().linkUnderline).toBe(true);
    });

    it("high-contrast preset uses max contrast black/yellow theme", () => {
        applyA11yPreset("highContrast");
        expect(getA11ySettings().theme).toBe("high-contrast");
        expect(getA11ySettings().contrast).toBe("max");
    });

    it("focus preset widens line height and desaturates", () => {
        applyA11yPreset("focus");
        expect(getA11ySettings().lineHeight).toBe("wide");
        expect(getA11ySettings().saturation).toBe("mono");
    });

    it("toggle turns a preset off and restores its fields", () => {
        applyA11yPreset("highContrast");
        toggleA11yPreset("highContrast");
        expect(getA11ySettings().theme).toBe("standard");
        expect(isPresetActive("highContrast")).toBe(false);
    });

    it("toggle clears body expand and link underline when turning senior off", () => {
        applyA11yPreset("senior");
        toggleA11yPreset("senior");
        expect(getA11ySettings().bodyTextExpandLevel).toBe(0);
        expect(getA11ySettings().linkUnderline).toBe(false);
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
            focusEnhanceLevel: 2,
            reduceMotion: true,
            letterSpacing: "wide",
            theme: "soft",
            saturation: "soft",
        });
        applyA11yToDocument();
        expect(stub.html.getAttribute(HTML_ATTR_LINK_UNDERLINE)).toBe("true");
        expect(stub.html.getAttribute(HTML_ATTR_FOCUS_ENHANCE)).toBe("2");
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

    it("text stroke writes the pair onto html as an attribute and css vars", () => {
        const stub = installDomStub();
        patchA11ySettings({
            textStroke: true,
            textStrokeStyle: "yellowBlue",
        });
        applyA11yToDocument();
        expect(stub.html.getAttribute(HTML_ATTR_TEXT_STROKE)).toBe(
            "yellowBlue",
        );
        expect(
            stub.html.style.getPropertyValue(HTML_STYLE_TEXT_STROKE_FILL),
        ).toBe("rgb(255, 255, 0)");
        expect(
            stub.html.style.getPropertyValue(HTML_STYLE_TEXT_STROKE_EDGE),
        ).toBe("rgb(0, 80, 255)");
        patchA11ySettings({ textStroke: false });
        expect(stub.html.getAttribute(HTML_ATTR_TEXT_STROKE)).toBeNull();
    });

    it("high-contrast writes the Lab text-plate pair onto html", () => {
        const stub = installDomStub();
        patchA11ySettings({
            theme: "high-contrast",
            textPlateStyle: "navyYellow",
        });
        applyA11yToDocument();
        expect(stub.html.getAttribute(HTML_ATTR_TEXT_PLATE)).toBe("navyYellow");
        expect(stub.html.style.getPropertyValue(HTML_STYLE_TEXT_PLATE_BG)).toBe(
            "rgb(0, 26, 102)",
        );
        expect(stub.html.style.getPropertyValue(HTML_STYLE_TEXT_PLATE_FG)).toBe(
            "rgb(255, 255, 0)",
        );
        expect(stub.html.style.getPropertyValue(HTML_STYLE_DISPLAY_BG)).toBe(
            "rgb(0, 26, 102)",
        );
        expect(stub.html.style.getPropertyValue(HTML_STYLE_DISPLAY_TEXT)).toBe(
            "rgb(255, 255, 0)",
        );
        patchA11ySettings({ theme: "standard" });
        expect(stub.html.getAttribute(HTML_ATTR_TEXT_PLATE)).toBeNull();
    });
});

describe("accessibility presets keep the visitor's own choices", () => {
    beforeEach(() => {
        installDomStub();
        resetA11ySettings();
    });

    it("leaves fields the preset does not define alone", () => {
        patchA11ySettings({ reduceMotion: true, theme: "dark" });
        applyA11yPreset("lowVision");
        expect(getA11ySettings().reduceMotion).toBe(true);
        expect(getA11ySettings().theme).toBe("dark");
        expect(isPresetActive("lowVision")).toBe(true);
    });

    it("turning a preset off puts back the values it replaced", () => {
        patchA11ySettings({ contrast: "max", fontSize: "large" });
        toggleA11yPreset("senior");
        expect(getA11ySettings().contrast).toBe("strong");
        expect(getA11ySettings().fontSize).toBe("large");
        toggleA11yPreset("senior");
        expect(getA11ySettings().contrast).toBe("max");
        expect(getA11ySettings().bodyTextExpandLevel).toBe(0);
        expect(isPresetActive("senior")).toBe(false);
    });

    it("switching presets undoes the first one before applying the second", () => {
        patchA11ySettings({ reduceMotion: true });
        applyA11yPreset("mild");
        applyA11yPreset("highContrast");
        expect(getA11ySettings().saturation).toBe("standard");
        expect(getA11ySettings().reduceMotion).toBe(true);
        expect(getA11ySettings().theme).toBe("high-contrast");
        expect(isPresetActive("mild")).toBe(false);
        expect(isPresetActive("highContrast")).toBe(true);
        toggleA11yPreset("highContrast");
        expect(getA11ySettings().theme).toBe("standard");
        expect(getA11ySettings().contrast).toBe("standard");
    });

    it("never shows two presets as on, even when fields overlap", () => {
        applyA11yPreset("lowVision");
        patchA11ySettings({ saturation: "mono" });
        const on = A11Y_PRESET_IDS.filter((id) => isPresetActive(id));
        expect(on).toEqual(["lowVision"]);

        resetA11ySettings();
        applyA11yPreset("colorVision");
        patchA11ySettings({ lineHeight: "wide", bodyTextExpandLevel: 2 });
        expect(A11Y_PRESET_IDS.filter((id) => isPresetActive(id))).toEqual([
            "colorVision",
        ]);
    });

    it("a field changed by hand after the preset stays when it is turned off", () => {
        applyA11yPreset("lowVision");
        patchA11ySettings({ fontSize: "large" });
        expect(isPresetActive("lowVision")).toBe(false);
        applyA11yPreset("lowVision");
        patchA11ySettings({ contrast: "max" });
        // still not matching: contrast was changed by hand
        expect(isPresetActive("lowVision")).toBe(false);
        expect(getA11ySettings().contrast).toBe("max");
    });

    it("settings saved before presets were tracked still show and clear", () => {
        patchA11ySettings({ theme: "high-contrast", contrast: "max" });
        patchSettings({ activePreset: undefined, presetRestore: null });
        expect(isPresetActive("highContrast")).toBe(true);
        toggleA11yPreset("highContrast");
        expect(getA11ySettings().theme).toBe("standard");
        expect(getA11ySettings().contrast).toBe("standard");
    });

    it("reset clears the tracked preset", () => {
        applyA11yPreset("focus");
        resetA11ySettings();
        expect(isPresetActive("focus")).toBe(false);
        patchA11ySettings({ lineHeight: "wide", saturation: "mono" });
        expect(isPresetActive("focus")).toBe(false);
    });
});
