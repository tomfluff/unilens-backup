import { describe, expect, it } from "vitest";
import {
    type BoolSettingKey,
    clampSetting,
    getSettings,
    NUMBER_KNOBS,
    type NumSettingKey,
    type Settings,
    TOGGLE_LABELS,
} from "./settings";

// Fresh jsdom, empty localStorage: the store holds DEFAULTS.
const defaults = getSettings();
const keys = Object.keys(defaults) as (keyof Settings)[];

describe("settings tables", () => {
    it("bounds every numeric knob and its default lies within them", () => {
        const numKeys = keys.filter(
            (k) => typeof defaults[k] === "number",
        ) as NumSettingKey[];
        expect(numKeys.length).toBeGreaterThan(0);
        for (const key of numKeys) {
            const knob = NUMBER_KNOBS[key];
            expect(knob, key).toBeDefined();
            expect(knob.label, key).not.toBe("");
            expect(knob.min, key).toBeLessThanOrEqual(knob.max);
            expect(knob.step, key).toBeGreaterThan(0);
            const value = defaults[key];
            expect(value, key).toBeGreaterThanOrEqual(knob.min);
            expect(value, key).toBeLessThanOrEqual(knob.max);
        }
    });

    it("labels every boolean toggle", () => {
        const boolKeys = keys.filter(
            (k) => typeof defaults[k] === "boolean",
        ) as BoolSettingKey[];
        expect(boolKeys.length).toBeGreaterThan(0);
        for (const key of boolKeys) {
            expect(TOGGLE_LABELS[key], key).toBeTruthy();
        }
    });
});

describe("clampSetting", () => {
    it("clamps numbers into their NUMBER_KNOBS bounds", () => {
        const { min, max } = NUMBER_KNOBS.ringWidth;
        expect(clampSetting("ringWidth", min - 5)).toBe(min);
        expect(clampSetting("ringWidth", max + 5)).toBe(max);
        expect(clampSetting("ringWidth", min)).toBe(min);
    });

    it("falls back to the default for a non-finite number", () => {
        expect(clampSetting("inventoryMaxNodes", Number.NaN)).toBe(
            defaults.inventoryMaxNodes,
        );
    });

    it("falls back to the default for an unknown enum value", () => {
        const stale = "gone" as Settings["escapeOrder"];
        expect(clampSetting("escapeOrder", stale)).toBe(defaults.escapeOrder);
        expect(clampSetting("escapeOrder", "both")).toBe("both");
        const gone = "neon" as Settings["highlightStyle"];
        expect(clampSetting("highlightStyle", gone)).toBe(
            defaults.highlightStyle,
        );
        expect(clampSetting("highlightStyle", "glow")).toBe("glow");
    });

    it("passes everything else through", () => {
        expect(clampSetting("zoom", false)).toBe(false);
        expect(clampSetting("pinnedPos", null)).toBeNull();
    });
});
