import { describe, expect, it } from "vitest";
import { localize, MESSAGES, pickLang } from "./quizI18n";

describe("pickLang", () => {
    it("takes the first supported language tag", () => {
        expect(pickLang(["ja-JP", "en"])).toBe("ja");
        expect(pickLang(["", "fr-FR", "EN-us"])).toBe("en");
        expect(pickLang([undefined, "de"])).toBe("en");
    });
});

describe("localize", () => {
    it("prefers the language, then any other", () => {
        expect(localize({ ja: "あ", en: "a" }, "en")).toBe("a");
        expect(localize({ ja: "あ" }, "en")).toBe("あ");
        expect(localize("plain", "ja")).toBe("plain");
        expect(localize(undefined, "ja")).toBe("");
    });
});

describe("MESSAGES", () => {
    it("has every key in both languages", () => {
        expect(Object.keys(MESSAGES.ja).sort()).toEqual(
            Object.keys(MESSAGES.en).sort(),
        );
    });
});
