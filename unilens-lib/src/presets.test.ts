import { beforeEach, describe, expect, it } from "vitest";
import { choosePreset, PRESETS, startChosenPreset } from "./presets";
import {
    activePreset,
    clampSetting,
    clearPresetChanges,
    defaultOf,
    getSettings,
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
            hlFill: false,
            hlGlow: true,
            hlBadges: true,
            hlColor: "#ffef26",
            ringWidth: 2,
            ringScale: false,
            chatMovesAside: false,
            aboutLine: false,
            debugShortcut: false,
        });
        expect(b.moveToEvidence).not.toBe("never");
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
        expect(kept.state).toEqual({ chatTextScale: 150 });

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
        ).toEqual({});
    });
});
