import { beforeEach, describe, expect, it } from "vitest";
import { choosePreset, PRESETS, startChosenPreset } from "./presets";
import {
    activePreset,
    clampSetting,
    clearPresetChanges,
    defaultOf,
    getSettings,
    SETTINGS_GEN,
    type Settings,
    updateSetting,
} from "./settings";

const page = "http://127.0.0.1:8101/ja/index.html";

describe("choosePreset: the address, then the facilitator's choice, then init", () => {
    beforeEach(() => localStorage.clear());

    it("is off with nothing asked", () => {
        expect(choosePreset(undefined, page)).toBeNull();
    });

    it("takes the page's init option", () => {
        expect(choosePreset("initial", page)).toBe("initial");
    });

    it("takes the address, and remembers it for the site's other pages", () => {
        expect(choosePreset(undefined, `${page}?unilens-preset=initial`)).toBe(
            "initial",
        );
        expect(choosePreset(undefined, page)).toBe("initial");
    });

    it("=off in the address wins over the init option, and is remembered", () => {
        expect(
            choosePreset("initial", `${page}?unilens-preset=off`),
        ).toBeNull();
        expect(choosePreset("initial", page)).toBeNull();
    });

    it("ignores an unknown preset", () => {
        expect(
            choosePreset(undefined, `${page}?unilens-preset=nope`),
        ).toBeNull();
        expect(localStorage.getItem("unilens-preset")).toBeNull();
        expect(choosePreset("nope", page)).toBeNull();
    });

    it("works with storage blocked", () => {
        expect(
            choosePreset(undefined, `${page}?unilens-preset=initial`, null),
        ).toBe("initial");
    });
});

describe("every preset", () => {
    it("holds only valid values (as stored settings are checked)", () => {
        for (const [id, p] of Object.entries(PRESETS))
            for (const [k, v] of Object.entries(p.values))
                expect(
                    clampSetting(k as keyof Settings, v),
                    `${id}.${k}`,
                ).toEqual(v);
    });

    it("the initial prototype is Yotam's (2026-10-06 and 07): click and chat, voice, highlights, nothing else", () => {
        const b: Partial<Settings> = PRESETS.initial.values;
        expect(b).toMatchObject({
            voiceInput: true,
            liveTalk: false,
            sounds: true,
            citeEvidence: true,
            autoHighlight: "always",
            associateText: false,
            citePlacement: "end",
            offscreenCue: "none",
            minimap: "off",
            zoom: false,
            zoomKeys: false,
            smartZoom: false,
            assistantZoom: false,
            settingsButton: false,
            // 2026-10-07: English, the chat never moves, no about line, no debug key
            chatLanguage: "en",
            // speech and read-aloud through the server, OpenAI (2026-10-07)
            sttEngine: "openai",
            ttsProvider: "openai",
            // one fixed highlight look, every part named (a later default change
            // must not change the initial prototype)
            hlOutline: "ring",
            hlBackdrop: "none",
            hlFill: "none",
            hlGlow: "medium",
            hlBadges: "small",
            hlColor: "#ffef26",
            hlColorMode: "fixed",
            ringWidth: 2,
            ringScale: false,
            chatMovesAside: false,
            aboutLine: false,
            debugShortcut: false,
        });
        expect(b.moveToEvidence).not.toBe("never");
    });
});

describe("session 2 (2026-10-09)", () => {
    it("starts from the initial prototype, with numbers in the text and a Sources button", () => {
        const b: Partial<Settings> = PRESETS.session2.values;
        expect(b).toMatchObject({
            ...PRESETS.initial.values,
            citePlacement: "inline",
            sourceStyle: "inline",
            associateText: false,
            sourceStyleButton: true,
            ttsVoice: "marin",
            // only the default ways to ask (Yotam, 2026-10-12): no box, no Live, no
            // edge arrows; the page map off, found in the panel
            regionSelect: false,
            liveTalk: false,
            offscreenCue: "none",
            // a row in the panel, off to begin with (Yotam's try-out, 2026-10-12)
            chatMovesAside: false,
            outlineClicked: true,
            zoom: true,
            zoomKeys: true,
            minimap: "off",
            voicePauseMs: 2000,
            // the gear opens the participant's panel; the model may take them places
            settingsButton: true,
            assistantGoTo: true,
            // #26: the fixed color (Yotam, 2026-10-12)
            hlColorMode: "fixed",
            hlColorRange: "some",
            // #30: answers from their start, Listen first; session 1 kept as it was
            answerFromStart: true,
            // numbers by their places, not slid in at the screen's edge
            hlBadgeClamp: false,
            quietNotFound: false,
            hlAdaptLine: true,
            altDragInert: true,
            // near the screen's edge or under the chat moves to the middle (item 16)
            edgeZone: 0.2,
        });
        expect(PRESETS.initial.values.edgeZone).toBe(0);
        // judged over everything under the ring in every preset, and in no panel
        // (Yotam, 2026-10-13, after the menu-bar comparison)
        for (const p of Object.values(PRESETS)) {
            expect(p.values.adaptBg).toBe("under-ring");
            expect(
                ("panel" in p ? p.panel : []) as readonly string[],
            ).not.toContain("adaptBg");
        }
        // All moving the page: a switch, off in both, offered in session 2 (16b)
        expect(PRESETS.initial.values.allMoves).toBe(false);
        expect(PRESETS.session2.values.allMoves).toBe(false);
        expect(PRESETS.session2.panel as readonly string[]).toContain(
            "allMoves",
        );
        expect(PRESETS.initial.values.altDragInert).toBe(false);
        expect(PRESETS.initial.values.hlAdaptLine).toBe(false);
        expect(PRESETS.initial.values.quietNotFound).toBe(true);
        expect(PRESETS.initial.values.hlBadgeClamp).toBe(true);
        expect(PRESETS.initial.values.answerFromStart).toBe(false);
        expect(PRESETS.session2.panel as readonly string[]).not.toContain(
            "answerFromStart",
        );
    });

    it("lists a participant's panel of real panel settings", async () => {
        const { PANEL_TABS } = await import("./settings");
        const placed = new Set(
            PANEL_TABS.flatMap((t) =>
                t.groups.flatMap((g) => [...g.first, ...g.more]),
            ),
        );
        expect(PRESETS.session2.panel.length).toBeGreaterThan(0);
        for (const k of PRESETS.session2.panel)
            expect(placed.has(k), k).toBe(true);
        // session-lead's list: chat text size and high contrast in; the source
        // style (the Sources button has it) and the voice pause out
        const panel: readonly string[] = PRESETS.session2.panel;
        expect(panel).toEqual(
            expect.arrayContaining([
                "chatTextScale",
                "highContrast",
                "minimap",
                // Yotam, 2026-10-10
                "chatFontSize",
                "chatTheme",
                "sourceStyle",
                "ttsSpeed",
                "chatMovesAside",
                "hlBadgePos",
            ]),
        );
        for (const k of [
            "sourceStyleButton",
            "citePlacement",
            "associateText",
            "ttsVoice",
            "regionSelect",
            // only discussed in the gallery (Yotam, 2026-10-12)
            "liveTalk",
            "offscreenCue",
            "voicePauseMs",
            "voiceAutoSend",
            "assistantGoTo",
            "settingsButton",
        ])
            expect(panel, k).not.toContain(k);
        // session 1 sets its zoom and map itself, so a changed default never reaches it
        expect(PRESETS.initial.values).toMatchObject({
            zoom: false,
            zoomKeys: false,
            minimap: "off",
        });
        // session 1 keeps the chat still and outlines no click
        expect(PRESETS.initial.values.chatMovesAside).toBe(false);
        expect("outlineClicked" in PRESETS.initial.values).toBe(false);
        // session 1 still has no box drawing (Alt+drag), and no participant panel
        expect(PRESETS.initial.values.regionSelect).toBe(false);
        // session 1 has no participant panel
        expect("panel" in PRESETS.initial).toBe(false);
    });
});

describe("a preset in effect", () => {
    it("starts from its values whatever localStorage holds, and leaves it alone", () => {
        // the participant's browser, left with other settings by an earlier session
        const left = JSON.stringify({
            state: { liveTalk: true, minimap: "always", settingsButton: true },
            version: 0,
        });
        localStorage.setItem("unilens-settings", left);
        history.replaceState(null, "", "/ja/?unilens-preset=initial");
        expect(startChosenPreset()).toBe("initial");
        expect(activePreset()?.id).toBe("initial");
        const s = getSettings();
        expect(s.liveTalk).toBe(false);
        expect(s.minimap).toBe("off");
        expect(s.settingsButton).toBe(false);
        // not in the preset: the shipped default, not what localStorage held
        expect(s.chatTextScale).toBe(120);

        // a change in the (hidden) panel: this tab only, and only the difference
        updateSetting("chatTextScale", 150);
        expect(localStorage.getItem("unilens-settings")).toBe(left);
        const kept = JSON.parse(
            sessionStorage.getItem("unilens-settings:initial") as string,
        );
        // what differs, and the settings' generation that wrote it
        expect(kept.state).toEqual({ chatTextScale: 150, _gen: SETTINGS_GEN });

        // "Reset this tab" and "changed" measure from the preset
        expect(defaultOf("minimap")).toBe("off");
        expect(defaultOf("chatTextScale")).toBe(120);

        // a bad value in this tab's store (hand-edited, an older build) falls back
        // to the preset's value, not the shipped default
        expect(clampSetting("settingsButton", null)).toBe(false);
        expect(clampSetting("citePlacement", "stale")).toBe("end");

        // the next participant: back to the preset
        clearPresetChanges();
        expect(getSettings().chatTextScale).toBe(120);
        expect(
            JSON.parse(
                sessionStorage.getItem("unilens-settings:initial") as string,
            ).state,
        ).toEqual({ _gen: SETTINGS_GEN });
    });
});

describe("session 2 keeps a participant's changes across tabs", () => {
    it("by pid in this browser, until the facilitator's reset", () => {
        localStorage.clear();
        sessionStorage.clear();
        // P03's first task link: a change in the panel and the Sources button
        history.replaceState(
            null,
            "",
            "/en/?unilens-preset=session2&pid=P03&session=2",
        );
        expect(startChosenPreset()).toBe("session2");
        updateSetting("chatTextScale", 160);
        updateSetting("citePlacement", "end");
        expect(
            JSON.parse(
                localStorage.getItem("unilens-settings:session2:P03") as string,
            ).state,
        ).toEqual({
            chatTextScale: 160,
            citePlacement: "end",
            sourceStyle: "end",
            _gen: SETTINGS_GEN,
        });

        // a tab of an older build saving its record (without what it does not know)
        // is not taken up: it would undo the newer settings
        const key = "unilens-settings:session2:P03";
        const older = JSON.stringify({
            state: { chatTextScale: 100 },
            version: 0,
        });
        window.dispatchEvent(
            new StorageEvent("storage", {
                key,
                newValue: older,
                storageArea: localStorage,
            }),
        );
        expect(getSettings().chatTextScale).toBe(160);
        // and this tab writes its own record back as the page goes (a reload)
        localStorage.setItem(key, older);
        window.dispatchEvent(
            new StorageEvent("storage", {
                key,
                newValue: older,
                storageArea: localStorage,
            }),
        );
        window.dispatchEvent(new Event("pagehide"));
        expect(
            JSON.parse(localStorage.getItem(key) as string).state.chatTextScale,
        ).toBe(160);
        // one of this generation is
        const now = JSON.parse(localStorage.getItem(key) as string);
        const newer = JSON.stringify({
            ...now,
            state: { ...now.state, chatTextScale: 140 },
        });
        localStorage.setItem(key, newer);
        window.dispatchEvent(
            new StorageEvent("storage", {
                key,
                newValue: newer,
                storageArea: localStorage,
            }),
        );
        expect(getSettings().chatTextScale).toBe(140);
        updateSetting("chatTextScale", 160);

        // the next task link opens a new tab (no sessionStorage), the pid remembered
        sessionStorage.clear();
        history.replaceState(
            null,
            "",
            "/en/status.html?unilens-preset=session2",
        );
        startChosenPreset();
        expect(getSettings().chatTextScale).toBe(160);
        expect(getSettings().citePlacement).toBe("end");

        // another participant in the same browser starts from the preset
        history.replaceState(null, "", "/en/?unilens-preset=session2&pid=P04");
        startChosenPreset();
        expect(getSettings().chatTextScale).toBe(120);
        expect(getSettings().citePlacement).toBe("inline");

        // the reset forgets what P03 changed
        history.replaceState(null, "", "/en/?unilens-preset=session2&pid=P03");
        startChosenPreset();
        clearPresetChanges();
        expect(
            JSON.parse(
                localStorage.getItem("unilens-settings:session2:P03") as string,
            ).state,
        ).toEqual({ _gen: SETTINGS_GEN });

        // an older P03 tab still open takes up a newer tab's change (storage event)
        updateSetting("chatTextScale", 140);
        const kept = localStorage.getItem("unilens-settings:session2:P03");
        const theirs = JSON.stringify({
            state: { sounds: false, _gen: SETTINGS_GEN },
            version: 0,
        });
        localStorage.setItem("unilens-settings:session2:P03", theirs);
        window.dispatchEvent(
            new StorageEvent("storage", {
                key: "unilens-settings:session2:P03",
                storageArea: localStorage,
                oldValue: kept,
                newValue: theirs,
            }),
        );
        expect(getSettings().sounds).toBe(false);
        expect(getSettings().chatTextScale).toBe(120);

        // a change made in the tab before the pid came is forgotten by the reset too
        sessionStorage.setItem(
            "unilens-settings:session2",
            JSON.stringify({ state: { chatTextScale: 170 }, version: 0 }),
        );
        clearPresetChanges();
        expect(sessionStorage.getItem("unilens-settings:session2")).toBeNull();

        // session 1 keeps changes in the tab only, even with a pid
        history.replaceState(null, "", "/en/?unilens-preset=initial&pid=P03");
        startChosenPreset();
        updateSetting("chatTextScale", 150);
        expect(localStorage.getItem("unilens-settings:initial:P03")).toBeNull();
        expect(
            sessionStorage.getItem("unilens-settings:initial"),
        ).not.toBeNull();
    });
});

describe("?sources= in the facilitator's link", () => {
    it("sets where the numbers go, and ignores anything else", async () => {
        const { applySourcesParam } = await import("./presets");
        const { getSettings, sourceStyleOf } = await import("./settings");
        applySourcesParam("https://x/en/?sources=underline");
        expect(sourceStyleOf(getSettings())).toBe("underline");
        applySourcesParam("https://x/en/?sources=end");
        expect(sourceStyleOf(getSettings())).toBe("end");
        applySourcesParam("https://x/en/?sources=everywhere");
        expect(sourceStyleOf(getSettings())).toBe("end");
        applySourcesParam("https://x/en/?sources=both");
        expect(sourceStyleOf(getSettings())).toBe("both");
        expect(getSettings().citePlacement).toBe("both");
        applySourcesParam("https://x/en/?sources=inline");
        expect(sourceStyleOf(getSettings())).toBe("inline");
    });

    it("is applied once: a reload keeps the participant's later choice", async () => {
        const { applySourcesParam } = await import("./presets");
        const { getSettings, setSourceStyle, sourceStyleOf } = await import(
            "./settings"
        );
        history.replaceState(
            null,
            "",
            "/en/?unilens-preset=session2&sources=underline",
        );
        applySourcesParam(location.href);
        expect(sourceStyleOf(getSettings())).toBe("underline");
        expect(location.search).not.toContain("sources");
        setSourceStyle("end");
        applySourcesParam(location.href); // the reload
        expect(sourceStyleOf(getSettings())).toBe("end");
    });
});

describe("the sources' style, as one setting (Yotam, 2026-10-10)", () => {
    it("sets the two settings it stands for, and follows them", () => {
        localStorage.clear();
        sessionStorage.clear();
        history.replaceState(null, "", "/en/?unilens-preset=session2");
        startChosenPreset();
        expect(getSettings().sourceStyle).toBe("inline");
        updateSetting("sourceStyle", "underline");
        expect(getSettings()).toMatchObject({
            citePlacement: "inline",
            associateText: true,
        });
        updateSetting("sourceStyle", "end");
        expect(getSettings().citePlacement).toBe("end");
        // the full panel's own settings name the style back
        updateSetting("citePlacement", "inline");
        expect(getSettings().sourceStyle).toBe("inline");
        updateSetting("associateText", true);
        expect(getSettings().sourceStyle).toBe("underline");
        // session 1: numbers after the answer
        history.replaceState(null, "", "/en/?unilens-preset=initial");
        startChosenPreset();
        expect(getSettings().sourceStyle).toBe("end");
    });
});
