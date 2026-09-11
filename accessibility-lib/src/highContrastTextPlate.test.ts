import { describe, expect, it } from "vitest";
import {
    hasDirectTextNodes,
    hasGeneratedTextContent,
    isHighContrastTheme,
} from "./highContrastTextPlate";

describe("hasDirectTextNodes", () => {
    const text = (value: string) => ({
        nodeType: 3,
        textContent: value,
    });
    const element = { nodeType: 1, textContent: "nested" };

    it("detects a real text run used as a caption on a photo", () => {
        expect(hasDirectTextNodes([text("SPECIAL")])).toBe(true);
        expect(hasDirectTextNodes([text("  採用情報  ")])).toBe(true);
    });

    it("ignores wrappers that only contain child elements", () => {
        expect(hasDirectTextNodes([element])).toBe(false);
        expect(hasDirectTextNodes([text("   "), element])).toBe(false);
    });

    it("ignores empty or whitespace-only nodes", () => {
        expect(hasDirectTextNodes([])).toBe(false);
        expect(hasDirectTextNodes([text("")])).toBe(false);
        expect(hasDirectTextNodes([text(" \n\t ")])).toBe(false);
    });
});

describe("hasGeneratedTextContent", () => {
    it("treats none / empty / images as not text", () => {
        expect(hasGeneratedTextContent("none")).toBe(false);
        expect(hasGeneratedTextContent("normal")).toBe(false);
        expect(hasGeneratedTextContent('""')).toBe(false);
        expect(hasGeneratedTextContent("''")).toBe(false);
        expect(hasGeneratedTextContent('url("/icon.svg")')).toBe(false);
    });

    it("treats quoted glyphs and attr()/counter() as text", () => {
        expect(hasGeneratedTextContent('"メニュー"')).toBe(true);
        expect(hasGeneratedTextContent('"\\e001"')).toBe(true);
        expect(hasGeneratedTextContent("attr(data-label)")).toBe(true);
        expect(hasGeneratedTextContent("counter(section)")).toBe(true);
    });
});

describe("isHighContrastTheme", () => {
    it("is only the high-contrast palette", () => {
        expect(isHighContrastTheme("high-contrast")).toBe(true);
        expect(isHighContrastTheme("dark")).toBe(false);
        expect(isHighContrastTheme("standard")).toBe(false);
        expect(isHighContrastTheme(null)).toBe(false);
    });
});
