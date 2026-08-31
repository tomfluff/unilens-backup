import { beforeEach, describe, expect, it } from "vitest";
import {
    A11Y_LANG_NAMES,
    A11Y_LANGS,
    A11Y_MESSAGES,
    type A11yLang,
    fontScaleLabel,
    getA11yLang,
    setA11yLang,
    t,
} from "./accessibilityI18n";
import {
    bodyExpandLevelLabels,
    smallBoostLevelLabels,
} from "./accessibilityPanelOptions";
import {
    bodyTextExpandHint,
    smallTextBoostHint,
    type TextAdjustLevel,
} from "./textAdjustLevels";

/** Recursively extracts a dictionary's shape (key order, value kind, function arity). */
function shapeOf(value: unknown, path = ""): string[] {
    if (typeof value === "function")
        return [
            `${path}: fn/${(value as (...a: unknown[]) => unknown).length}`,
        ];
    if (typeof value === "object" && value !== null) {
        return Object.keys(value)
            .sort()
            .flatMap((key) =>
                shapeOf(
                    (value as Record<string, unknown>)[key],
                    path ? `${path}.${key}` : key,
                ),
            );
    }
    return [`${path}: ${typeof value}`];
}

describe("language dictionary coverage", () => {
    it("every language has the same keys and the same function arities", () => {
        const reference = shapeOf(A11Y_MESSAGES.ja);
        A11Y_LANGS.forEach((lang) => {
            expect(
                shapeOf(A11Y_MESSAGES[lang]),
                `${lang} dictionary`,
            ).toStrictEqual(reference);
        });
    });

    it("no string is empty", () => {
        A11Y_LANGS.forEach((lang) => {
            const empty: string[] = [];
            const walk = (value: unknown, path: string) => {
                if (typeof value === "string" && value.trim() === "")
                    empty.push(path);
                else if (typeof value === "object" && value !== null) {
                    for (const [key, v] of Object.entries(value)) {
                        walk(v, path ? `${path}.${key}` : key);
                    }
                }
            };
            walk(A11Y_MESSAGES[lang], "");
            expect(empty, `${lang} empty strings`).toStrictEqual([]);
        });
    });

    it("language names are written in their own language", () => {
        expect(A11Y_LANG_NAMES.ja).toBe("日本語");
        expect(A11Y_LANG_NAMES.en).toBe("English");
    });
});

describe("switching language", () => {
    beforeEach(() => {
        setA11yLang("ja");
    });

    it("switching also swaps the dictionary returned by t()", () => {
        expect(t().panelTitle).toBe(A11Y_MESSAGES.ja.panelTitle);
        setA11yLang("en");
        expect(getA11yLang()).toBe("en");
        expect(t().panelTitle).toBe(A11Y_MESSAGES.en.panelTitle);
    });

    it("re-selecting the same language leaves the state unchanged", () => {
        setA11yLang("ja");
        expect(getA11yLang()).toBe("ja");
    });
});

describe("combining with language-independent values", () => {
    const levels: TextAdjustLevel[] = [1, 2, 3];

    it("level labels: only the name changes per language, the hint stays shared", () => {
        const hints: Record<A11yLang, string[]> = { ja: [], en: [] };
        const names: Record<A11yLang, string[]> = { ja: [], en: [] };

        A11Y_LANGS.forEach((lang) => {
            setA11yLang(lang);
            levels.forEach((level) => {
                const [name, hint] = bodyExpandLevelLabels()[level];
                names[lang].push(name);
                hints[lang].push(hint);
                expect(hint).toBe(bodyTextExpandHint(level));
                expect(smallBoostLevelLabels()[level][1]).toBe(
                    smallTextBoostHint(level),
                );
            });
        });

        expect(hints.en).toStrictEqual(hints.ja);
        expect(names.en).not.toStrictEqual(names.ja);
    });

    it("the scale label joins the name and the percentage", () => {
        setA11yLang("en");
        expect(fontScaleLabel(2)).toBe("Large 150%");
        setA11yLang("ja");
        expect(fontScaleLabel(2)).toBe("大 150%");
    });
});
