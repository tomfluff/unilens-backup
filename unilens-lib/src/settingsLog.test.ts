import { beforeEach, describe, expect, it, vi } from "vitest";

const logged: [string, Record<string, unknown>][] = [];
vi.mock("./studyLog", () => ({
    logEvent: (type: string, fields: Record<string, unknown> = {}) =>
        logged.push([type, fields]),
    flush: () => {},
}));

const { setSourceStyle, startPreset, updateSetting, useSettings } =
    await import("./settings");
const { PRESETS } = await import("./presets");
const {
    asSource,
    initSettingsLog,
    logPanelSession,
    logSettingsSnapshot,
    resetSettingsLogForTest,
} = await import("./settingsLog");

const changes = () =>
    logged.filter(([t]) => t === "setting_changed").map(([, f]) => f);

beforeEach(() => {
    startPreset(
        "session2",
        PRESETS.session2.name,
        PRESETS.session2.values,
        PRESETS.session2.panel,
    );
    initSettingsLog();
    updateSetting("chatTextScale", 100);
    updateSetting("hlPulse", "off");
    setSourceStyle("inline");
    resetSettingsLogForTest();
    logged.length = 0;
});

describe("settings in the study's log", () => {
    it("logs each change once, with its label, old and new value and source", () => {
        const close = logPanelSession("participant", "look");
        updateSetting("chatTextScale", 140);
        // the same value again is no change
        updateSetting("chatTextScale", 140);
        close();
        expect(logged[0]).toEqual([
            "settings_opened",
            { panel: "participant", tab: "look" },
        ]);
        expect(changes()).toEqual([
            {
                key: "chatTextScale",
                label: "Text size",
                from: 100,
                to: 140,
                source: "panel",
            },
        ]);
        expect(logged.at(-1)).toEqual([
            "settings_closed",
            { panel: "participant", changes: 1 },
        ]);
    });

    it("names the Sources button, the reset and the facilitator, and logs a pulled setting once", () => {
        asSource("sources button", () => setSourceStyle("underline"));
        asSource("reset", () => updateSetting("hlPulse", "few"));
        asSource("facilitator", () => updateSetting("hlPulse", "off"));
        // sourceStyle pulls associateText and citePlacement along (not in the panel)
        expect(changes()).toEqual([
            expect.objectContaining({
                key: "sourceStyle",
                from: "inline",
                to: "underline",
                source: "sources button",
            }),
            expect.objectContaining({
                key: "hlPulse",
                to: "few",
                source: "reset",
            }),
            expect.objectContaining({
                key: "hlPulse",
                to: "off",
                source: "facilitator",
            }),
        ]);
    });

    it("snapshots every setting in the participant's panel, with its default", () => {
        updateSetting("chatTextScale", 150);
        logged.length = 0;
        logSettingsSnapshot("hidden");
        const [type, f] = logged[0];
        expect(type).toBe("settings_snapshot");
        expect(f.reason).toBe("hidden");
        const values = f.values as Record<string, unknown>;
        const defaults = f.defaults as Record<string, unknown>;
        expect(Object.keys(values).sort()).toEqual(
            [...PRESETS.session2.panel].sort(),
        );
        expect(values.chatTextScale).toBe(150);
        expect(defaults.chatTextScale).toBe(100);
    });

    it("never logs a value that is not plain", () => {
        useSettings.setState({ pinnedPos: { left: 1, top: 2 } } as never);
        expect(changes()).toEqual([]);
    });
});
