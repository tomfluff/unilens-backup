import { describe, expect, it } from "vitest";
import {
    isIconFontName,
    isPrivateUseText,
    primaryFontFamily,
    pseudoContentText,
} from "./iconFontGuard";

describe("icon font detection", () => {
    it("recognises the common icon font names by the primary family only", () => {
        expect(isIconFontName('"Material Icons"')).toBe(true);
        expect(isIconFontName('"Material Symbols Outlined"')).toBe(true);
        expect(isIconFontName('"Font Awesome 6 Free"')).toBe(true);
        expect(isIconFontName("FontAwesome")).toBe(true);
        expect(isIconFontName("bootstrap-icons")).toBe(true);
        expect(isIconFontName("icomoon")).toBe(true);
        expect(isIconFontName('"Segoe MDL2 Assets"')).toBe(true);
        expect(isIconFontName("fa")).toBe(true);
        // text fonts, including a stack that merely ends in a symbol font
        expect(
            isIconFontName('"Noto Sans JP", "Segoe UI Symbol", sans-serif'),
        ).toBe(false);
        expect(isIconFontName('"BIZ UDPGothic", sans-serif')).toBe(false);
        expect(isIconFontName("Fira Sans")).toBe(false);
        expect(isIconFontName("Inter")).toBe(false);
        // "icon" inside a word is not an icon font; the usual suffix names are
        expect(isIconFontName("Lexicon")).toBe(false);
        expect(isIconFontName("Siliconsans")).toBe(false);
        expect(isIconFontName("ElegantIcons")).toBe(true);
        expect(isIconFontName("Glyphicons Halflings")).toBe(true);
        expect(isIconFontName("Ionicons")).toBe(true);
        expect(isIconFontName('"Segoe Fluent Icons"')).toBe(true);
        expect(isIconFontName("fa-solid-900")).toBe(true);
        expect(isIconFontName("MaterialIcons")).toBe(true);
        expect(isIconFontName("MaterialIcons-Regular")).toBe(true);
    });

    it("takes the first family, unquoted", () => {
        expect(primaryFontFamily(' "Material Icons", serif')).toBe(
            "Material Icons",
        );
        expect(primaryFontFamily("'a b'")).toBe("a b");
    });

    it("treats text as icons only when every visible character is Private Use", () => {
        expect(isPrivateUseText("")).toBe(true);
        expect(isPrivateUseText("  \n")).toBe(true);
        expect(isPrivateUseText("\u{f0001}")).toBe(true);
        expect(isPrivateUseText("home")).toBe(false);
        expect(isPrivateUseText(" Home")).toBe(false);
        expect(isPrivateUseText("   ")).toBe(false);
        expect(isPrivateUseText("")).toBe(false);
    });

    it("reads ::before content as getComputedStyle reports it", () => {
        expect(pseudoContentText('""')).toBe("");
        expect(pseudoContentText("none")).toBe("");
        expect(pseudoContentText("normal")).toBe("");
        expect(pseudoContentText('"a\\"b"')).toBe('a"b');
        expect(pseudoContentText('counter(x) "."')).toBe("");
    });
});
