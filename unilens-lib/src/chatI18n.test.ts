import { afterEach, describe, expect, it } from "vitest";
import { chatLang, chatText } from "./chatI18n";
import { CHAT_CSS, ensureChatStyles } from "./chatStyles";
import { earcon, PALETTES } from "./earcons";
import { updateSetting } from "./settings";

afterEach(() => {
    updateSetting("chatLanguage", "auto");
    document.documentElement.lang = "";
});

describe("chat language", () => {
    it("follows the page's <html lang> on auto, and a setting overrides it", () => {
        updateSetting("chatLanguage", "auto");
        document.documentElement.lang = "ja";
        expect(chatLang()).toBe("ja");
        expect(chatText().send).toBe("送信");
        updateSetting("chatLanguage", "en");
        expect(chatLang()).toBe("en");
        expect(chatText().send).toBe("Send");
    });

    it("has every English string in Japanese too", () => {
        updateSetting("chatLanguage", "en");
        const en = Object.keys(chatText()).sort();
        updateSetting("chatLanguage", "ja");
        expect(Object.keys(chatText()).sort()).toEqual(en);
    });
});

describe("earcons", () => {
    it("has a sound for every action in every style, and never throws without audio", () => {
        const kinds = Object.keys(PALETTES.assistant).sort();
        for (const p of Object.values(PALETTES))
            expect(Object.keys(p).sort()).toEqual(kinds);
        // jsdom has no AudioContext
        expect(() => earcon("done")).not.toThrow();
        updateSetting("sounds", false);
        expect(() => earcon("done")).not.toThrow();
        updateSetting("sounds", true);
    });
});

describe("chat styles", () => {
    it("injects the stylesheet once, with all three styles", () => {
        ensureChatStyles();
        ensureChatStyles();
        expect(
            document.querySelectorAll('style[data-unilens="chat"]'),
        ).toHaveLength(1);
        for (const s of ["assistant", "audioGuide", "station"])
            expect(CHAT_CSS).toContain(`[data-style="${s}"]`);
    });
});
