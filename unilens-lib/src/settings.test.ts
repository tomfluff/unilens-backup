import { describe, expect, it } from "vitest";
import {
    type BoolSettingKey,
    clampSetting,
    ENUM_CHOICES,
    exportSettings,
    getSettings,
    importSettings,
    NUMBER_KNOBS,
    type NumSettingKey,
    PANEL_SECTIONS,
    type Settings,
    TOGGLE_LABELS,
    useSettings,
} from "./settings";

// Fresh jsdom, empty localStorage: the store holds DEFAULTS. Copied, because the
// hydration test replaces the state object.
const defaults = { ...getSettings() };
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

    it("puts every panel control in exactly one group", () => {
        const controls = [
            ...Object.keys(TOGGLE_LABELS),
            ...Object.keys(ENUM_CHOICES),
            ...Object.keys(NUMBER_KNOBS),
            "hlColor",
        ];
        const placed = PANEL_SECTIONS.flatMap((g) => g.keys as string[]);
        expect(new Set(placed).size, "a key in two groups").toBe(placed.length);
        expect([...placed].sort()).toEqual([...new Set(controls)].sort());
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
        expect(clampSetting("autoHighlight", "always")).toBe("always");
        expect(clampSetting("autoHighlight", "toString")).toBe(
            defaults.autoHighlight,
        );
        const gone = "neon" as Settings["hlOutline"];
        expect(clampSetting("hlOutline", gone)).toBe(defaults.hlOutline);
        expect(clampSetting("hlOutline", "brackets")).toBe("brackets");
        expect(clampSetting("hlBackdrop", "spotlight")).toBe("spotlight");
        expect(clampSetting("offscreenCue", "pointer")).toBe("pointer");
        expect(clampSetting("moveToEvidence", "sideways")).toBe(
            defaults.moveToEvidence,
        );
    });

    it("coerces numeric strings before clamping", () => {
        expect(clampSetting("inventoryMaxDepth", "99")).toBe(
            NUMBER_KNOBS.inventoryMaxDepth.max,
        );
        expect(clampSetting("inventoryMaxDepth", "abc")).toBe(
            defaults.inventoryMaxDepth,
        );
    });

    it("rejects a select knob value outside its option set", () => {
        expect(clampSetting("captureRes", 0.75)).toBe(defaults.captureRes);
        expect(clampSetting("captureRes", "0.5")).toBe(0.5);
        expect(clampSetting("chatFontSize", 15)).toBe(defaults.chatFontSize);
    });

    it("never treats a prototype key as a table entry", () => {
        expect(clampSetting("hlOutline", "constructor")).toBe(
            defaults.hlOutline,
        );
        expect(clampSetting("escapeOrder", "toString")).toBe(
            defaults.escapeOrder,
        );
    });

    it("accepts only a hex highlight colour", () => {
        expect(clampSetting("hlColor", "#ff00aa")).toBe("#ff00aa");
        expect(clampSetting("hlColor", "#f0a")).toBe("#f0a");
        for (const bad of ["red", "#ff00aa;background:url(x)", 7, "#12345"])
            expect(clampSetting("hlColor", bad)).toBe(defaults.hlColor);
    });

    it("passes booleans and pinnedPos through, defaulting a non-boolean", () => {
        expect(clampSetting("zoom", false)).toBe(false);
        expect(clampSetting("zoom", "yes")).toBe(defaults.zoom);
        expect(clampSetting("pinnedPos", null)).toBeNull();
    });
});

describe("hydration", () => {
    it("sanitises every stored key and drops unknown ones", async () => {
        localStorage.setItem(
            "unilens-settings",
            JSON.stringify({
                state: {
                    hlOutline: "nope",
                    hlColor: "javascript:alert(1)",
                    escapeOrder: "x",
                    inventoryMaxDepth: "99",
                    captureRes: 0.75,
                    ringWidth: 4,
                    zoom: "yes",
                    bogusKey: 1,
                    hlBadges: "constructor",
                },
                version: 0,
            }),
        );
        await useSettings.persist.rehydrate();
        const s = getSettings();
        expect(s.hlOutline).toBe(defaults.hlOutline);
        expect(s.hlColor).toBe(defaults.hlColor);
        expect(s.escapeOrder).toBe(defaults.escapeOrder);
        expect(s.inventoryMaxDepth).toBe(NUMBER_KNOBS.inventoryMaxDepth.max);
        expect(s.captureRes).toBe(defaults.captureRes);
        expect(s.ringWidth).toBe(4);
        expect(s.zoom).toBe(defaults.zoom);
        expect(s.hlBadges).toBe(defaults.hlBadges);
        expect(Object.hasOwn(s, "bogusKey")).toBe(false);
        expect(Object.keys(s).sort()).toEqual(Object.keys(defaults).sort());
        localStorage.removeItem("unilens-settings");
        useSettings.setState(defaults);
    });

    it("carries an older minimap shape and dim switch into the new layers", async () => {
        localStorage.setItem(
            "unilens-settings",
            JSON.stringify({
                state: { mmShape: "outlined", mmDim: true },
                version: 0,
            }),
        );
        await useSettings.persist.rehydrate();
        const s = getSettings();
        expect(s.mmOutline).toBe("band");
        expect(s.mmFill).toBe(false);
        expect(s.mmBackdrop).toBe("dim");
        localStorage.removeItem("unilens-settings");
        useSettings.setState(defaults);
    });
});

describe("settings files", () => {
    const reset = () => useSettings.setState({ ...defaults });

    it("exports every setting, and importing the file restores them", () => {
        reset();
        useSettings.setState({
            chatStyle: "station",
            cueSize: 96,
            sounds: false,
        });
        const file = exportSettings();
        const parsed = JSON.parse(file);
        expect(parsed.kind).toBe("unilens-settings");
        expect(Object.keys(parsed.settings).sort()).toEqual([...keys].sort());
        reset();
        expect(getSettings().chatStyle).toBe(defaults.chatStyle);
        const { applied, ignored } = importSettings(file);
        expect(applied).toBe(keys.length);
        expect(ignored).toEqual([]);
        expect(getSettings()).toMatchObject({
            chatStyle: "station",
            cueSize: 96,
            sounds: false,
        });
        reset();
    });

    it("checks an imported file like stored settings, and keeps what it leaves out", () => {
        reset();
        useSettings.setState({ motion: "instant" });
        const { applied, ignored } = importSettings(
            JSON.stringify({
                cueSize: 9999,
                chatStyle: "not a style",
                sounds: "yes",
                somethingNew: 1,
                mmShape: "outlined",
            }),
        );
        const s = getSettings();
        expect(s.cueSize).toBe(NUMBER_KNOBS.cueSize.max);
        expect(s.chatStyle).toBe(defaults.chatStyle);
        expect(s.sounds).toBe(defaults.sounds);
        // a bare object of settings works, old keys still migrate, the rest stays
        expect(s.mmOutline).toBe("band");
        expect(s.motion).toBe("instant");
        expect(applied).toBe(3);
        expect(ignored).toEqual(["somethingNew"]);
        reset();
    });

    it("refuses a file that is not settings, and changes nothing", () => {
        reset();
        const before = { ...getSettings() };
        for (const text of [
            "not json",
            "[1,2]",
            "42",
            '{"kind":"unilens-settings","settings":[]}',
        ])
            expect(() => importSettings(text)).toThrow();
        expect(getSettings()).toEqual(before);
    });
});
